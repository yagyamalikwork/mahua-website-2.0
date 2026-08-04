// `npm run verify:budget` — the JavaScript budget guard, in one command.
//
// `scripts/measure_js_budget.mjs` is the only thing standing between this page
// and the 110 KB Plan 4 Task 3 took out of the first load. It needs a production
// build and a running server, so it cannot join `npm test`, and this repo has no
// CI — which left the guard existing but costing three manual steps, and made
// its failure mode *forgetting*. A reviewer made closing that the condition on
// Task 3c, because Task 3c is the change most likely to trip it: the first
// scroll-scrubbed element sits at y=2346 at 1440x900, 546px of headroom, and the
// pinned collage attaches another scrubbed effect in exactly that band.
//
// So: build, start, wait, measure, kill, propagate the exit code. One command,
// no steps to skip.
//
//   npm run verify:budget
//   npm run verify:budget -- --port 3131 --no-build
//   npm run verify:budget -- --out docs/reviews/<date>/js-budget.json
//
// Anything it does not recognise is passed straight through to the rig, so
// `--width 390 --height 844` and `--max-untouched-kb` work as they do there.
//
// **It refuses to measure a server it did not start.** A stale `next start` on
// the port — from an earlier session, or another terminal — would otherwise be
// measured happily and silently, reporting the JavaScript of a build that no
// longer exists. That is a whole category of wrong answer, and this project has
// been burned nine times by checks that confirmed the wrong thing confidently.

import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import path from "node:path";

const argv = process.argv.slice(2);
const take = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0 || !argv[i + 1]) return fallback;
  const value = argv[i + 1];
  argv.splice(i, 2);
  return value;
};
const takeFlag = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return false;
  argv.splice(i, 1);
  return true;
};

const PORT = Number(take("port", "3131"));
const SKIP_BUILD = takeFlag("no-build");
// Whatever is left belongs to the rig.
const RIG_ARGS = argv;

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

/**
 * `shell` is opt-in and defaults to off, which on Windows is the difference
 * between working and not. `npx` there is `npx.cmd`, a batch file, and
 * `spawn` cannot execute one without a shell — but Node's own binary lives at
 * `C:\Program Files\nodejs\node.exe`, and handing *that* to a shell hands `cmd`
 * an unquoted path with a space in it. The first version of this file used one
 * setting for both and died on "'C:\\Program' is not recognized".
 */
function run(command, args, label, { shell = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${label} exited ${code}`));
    });
  });
}

/** Is anything already listening? A connection that succeeds means yes. */
function portInUse(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.setTimeout(1500);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    const no = () => {
      socket.destroy();
      resolve(false);
    };
    socket.on("error", no);
    socket.on("timeout", no);
  });
}

async function waitForServer(port, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await portInUse(port)) {
      // Listening is not the same as serving. Ask for the page itself.
      const ok = await fetch(`http://127.0.0.1:${port}/`)
        .then((r) => r.ok)
        .catch(() => false);
      if (ok) return;
    }
    if (Date.now() > deadline) throw new Error(`the server never answered on port ${port}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

let server = null;

function stopServer() {
  if (!server || server.killed) return;
  // The child is `next start`, which on Windows is a shell wrapping node; the
  // tree has to go, not just the wrapper, or the port stays held.
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
  } else {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
  server = null;
}

async function main() {
  if (await portInUse(PORT)) {
    throw new Error(
      `port ${PORT} is already in use. This command refuses to measure a server it did not ` +
        `start — the numbers would describe whatever build that server is running. Stop it, or ` +
        `pass --port.`,
    );
  }

  if (!SKIP_BUILD) {
    console.log("→ npm run build\n");
    await run(npx, ["next", "build"], "next build", { shell: process.platform === "win32" });
  } else {
    console.log("→ skipping the build (--no-build): measuring whatever .next holds\n");
  }

  console.log(`\n→ next start -p ${PORT}`);
  server = spawn(npx, ["next", "start", "-p", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    detached: process.platform !== "win32",
  });
  server.stdout.on("data", () => {});
  server.stderr.on("data", (d) => process.stderr.write(d));
  server.on("exit", (code) => {
    if (server && code !== 0) console.error(`the server exited early (${code})`);
    server = null;
  });

  await waitForServer(PORT);
  console.log(`→ serving on http://127.0.0.1:${PORT} — this process started it\n`);

  console.log("→ node scripts/measure_js_budget.mjs\n");
  await run(
    process.execPath,
    [path.join("scripts", "measure_js_budget.mjs"), "--port", String(PORT), ...RIG_ARGS],
    "measure_js_budget.mjs",
  );
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
  stopServer();
  process.exit(130);
});

main()
  .then(() => {
    stopServer();
    console.log("\nverify:budget PASS");
    process.exitCode = 0;
  })
  .catch((error) => {
    stopServer();
    console.error(`\nverify:budget FAIL — ${error.message}`);
    process.exitCode = 1;
  });
