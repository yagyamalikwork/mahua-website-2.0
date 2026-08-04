// Serve the production build over HTTP/2, by proxying `next start`.
//
// Exists because every performance figure this project has, including
// Lighthouse's, was taken against `next start` — which speaks **HTTP/1.1**. No
// visitor will. Vercel, Netlify, Cloudflare and every CDN in front of a static
// Next export negotiate h2 or h3.
//
// The difference is not cosmetic. Over HTTP/1.1 Chrome opens six connections per
// origin and shares the pipe between whatever is in flight; a `fetchpriority`
// hint can reorder the *queue* but cannot stop five other responses eating five
// sixths of the bandwidth. Measured at 412px/DPR 1.75 on Slow 4G, the 65 KB hero
// took 1,874 ms to arrive with twelve requests in flight — five times what it
// costs on its own. HTTP/2 multiplexes one connection and honours stream
// priority, so the same hint has teeth.
//
// So this is not an optimisation. It is a control: it answers "how much of the
// number we are chasing belongs to the site, and how much to the test rig".
//
// **`--http1` is not optional if you intend to quote the result.** TLS over a
// 150 ms-RTT link costs two or three extra round trips that plain `next start`
// never pays, so an h2-over-TLS run measured against the http:// baseline is
// comparing multiplexing *and* a handshake against neither, and the handshake
// swamps the answer — the first attempt at this read 879 ms to first byte
// against 390 ms and looked like a regression. `--http1` serves the same
// upstream over the same certificate with ALPN h2 withheld, so the only
// difference left between the two runs is the protocol.
//
// Self-signed certificate, so every client of this must ignore certificate
// errors. Never point anything but a test at it.
//
// Run:
//   npx next start -p 3100 &
//   node scripts/serve_http2.mjs --upstream 3100 --port 3443            # h2
//   node scripts/serve_http2.mjs --upstream 3100 --port 3444 --http1    # control
//   node scripts/measure_first_fold.mjs --url https://localhost:3443/ --insecure

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import http from "node:http";
import http2 from "node:http2";
import https from "node:https";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const UPSTREAM = Number(flag("upstream", "3100"));
const PORT = Number(flag("port", "3443"));
const HTTP1 = args.includes("--http1");

const certDir = path.join(os.tmpdir(), "mahua-h2-cert");
const keyPath = path.join(certDir, "key.pem");
const certPath = path.join(certDir, "cert.pem");
if (!existsSync(keyPath) || !existsSync(certPath)) {
  mkdirSync(certDir, { recursive: true });
  const gen = spawnSync(
    "openssl",
    [
      "req", "-x509", "-newkey", "rsa:2048", "-nodes",
      "-keyout", keyPath, "-out", certPath, "-days", "7",
      "-subj", "/CN=localhost",
      "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
    ],
    { stdio: "inherit" },
  );
  if (gen.status !== 0) {
    console.error("openssl could not generate a self-signed certificate");
    process.exit(1);
  }
}

const tls = { key: readFileSync(keyPath), cert: readFileSync(certPath) };
const HOP_BY_HOP = ["connection", "keep-alive", "transfer-encoding", "upgrade"];

/** One upstream request, shared by both protocol front ends. */
function proxy({ method, url, headers }, onResponse, onError) {
  const req = http.request(
    {
      host: "127.0.0.1",
      port: UPSTREAM,
      method,
      path: url,
      headers: {
        ...Object.fromEntries(
          Object.entries(headers).filter(([k]) => !k.startsWith(":") && !HOP_BY_HOP.includes(k)),
        ),
        host: `localhost:${UPSTREAM}`,
      },
    },
    onResponse,
  );
  req.on("error", onError);
  return req;
}

const server = HTTP1
  ? https.createServer(tls, (cReq, cRes) => {
      const req = proxy(
        { method: cReq.method, url: cReq.url, headers: cReq.headers },
        (res) => {
          cRes.writeHead(res.statusCode, res.headers);
          res.pipe(cRes);
        },
        () => cRes.destroy(),
      );
      cReq.pipe(req);
    })
  : http2.createSecureServer({ ...tls, allowHTTP1: false });

if (!HTTP1) {
  server.on("stream", (stream, headers) => {
    const req = proxy(
      { method: headers[":method"], url: headers[":path"], headers },
      (res) => {
        const out = { ":status": res.statusCode };
        for (const [k, v] of Object.entries(res.headers)) {
          if (HOP_BY_HOP.includes(k)) continue;
          out[k] = v;
        }
        try {
          stream.respond(out);
        } catch {
          return;
        }
        res.pipe(stream);
      },
      () => {
        try {
          stream.close(http2.constants.NGHTTP2_INTERNAL_ERROR);
        } catch {}
      },
    );
    stream.pipe(req);
  });
}

server.listen(PORT, () => {
  console.log(
    `${HTTP1 ? "HTTPS/1.1" : "HTTP/2"} proxy on https://localhost:${PORT}/ -> http://localhost:${UPSTREAM}/`,
  );
  console.log("Self-signed certificate; clients must ignore certificate errors.");
});
