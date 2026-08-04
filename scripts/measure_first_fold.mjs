// What does the visitor actually wait for on the first screen?
//
// Written for the mobile-LCP failure found in Task 8: Lighthouse reported LCP
// 4.1 s on mobile and resolved it to the hero *sub-paragraph*, not the
// photograph. A number like that cannot be acted on until you know which of the
// two stories it is telling — a paragraph blocked from painting, or a paragraph
// that painted early and a metric dragged out by everything else on the pipe.
//
// So this rig deliberately measures three different things and refuses to
// collapse them into one:
//
//   1. **Every LCP candidate**, not just the last. Chrome emits a new entry each
//      time a larger element paints; reporting only the final one hides the fact
//      that the paragraph painted at 700 ms and was still the answer at 4 s.
//   2. **The first-fold byte budget by kind** — document, CSS, fonts, JS,
//      images — with the priority Chrome assigned and the moment each request
//      started. This is what shows contention rather than blocking.
//   3. **A screencast filmstrip**, which is the only outcome measure here. Every
//      other number is a browser API describing its own intent. The filmstrip
//      answers "when did the first screen stop changing", which is the thing the
//      visitor experiences and the thing this project has three times shipped a
//      regression against by checking a mechanism instead.
//
// `--dpr` matters more than anything else here. Every performance figure this
// project committed before 4 Aug 2026 was taken at DPR 1, which is not a phone.
// Lighthouse's mobile emulation is 1.75; real handsets are 2 or 3.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/measure_first_fold.mjs --dpr 3 --out docs/reviews/.../first-fold-dpr3.json
//
// Flags: --url, --port, --out, --dpr, --width, --height, --label, --no-throttle.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const has = (n) => args.includes(`--${n}`);

const PAGE_URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", null);
const DPR = Number(flag("dpr", "3"));
const WIDTH = Number(flag("width", "390"));
const HEIGHT = Number(flag("height", "844"));
const LABEL = flag("label", `${WIDTH}x${HEIGHT}@${DPR}x`);
const THROTTLE = !has("no-throttle");

/** Lighthouse's own mobile profile, so the two rigs can be read against each other. */
const SLOW_4G = {
  offline: false,
  downloadThroughput: (1.6 * 1000 * 1000) / 8,
  uploadThroughput: (750 * 1000) / 8,
  latency: 150,
};
const CPU_THROTTLE = 4;

/**
 * Records *every* largest-contentful-paint entry with enough of the element to
 * name it, plus the paint timings. `buffered: true` so entries that fired before
 * this script ran are not lost.
 */
const PROBE = `
  window.__lcpCandidates = [];
  window.__paint = {};
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const el = e.element;
        window.__lcpCandidates.push({
          ms: Math.round(e.startTime),
          renderTimeMs: Math.round(e.renderTime || 0),
          loadTimeMs: Math.round(e.loadTime || 0),
          tag: el ? el.tagName : null,
          id: el && el.id ? el.id : null,
          cls: el && el.className && typeof el.className === "string"
            ? el.className.slice(0, 70) : null,
          text: el ? (el.textContent || "").trim().slice(0, 70) : null,
          url: e.url || null,
          size: e.size,
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch (err) { window.__lcpError = String(err); }
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__paint[e.name] = Math.round(e.startTime);
    }).observe({ type: "paint", buffered: true });
  } catch (err) {}
`;

/** Which bucket a request falls in, for the byte budget. */
const COLLECT = `(() => {
  const kb = (n) => Math.round((n / 1024) * 10) / 10;
  const kindOf = (r) => {
    const p = new URL(r.name, location.href).pathname;
    if (r.initiatorType === "navigation") return "document";
    if (/\\.woff2?$/.test(p)) return "font";
    if (/\\.css$/.test(p)) return "css";
    if (/\\.js$/.test(p)) return "js";
    if (/\\.(avif|webp|jpg|jpeg|png|svg)$/.test(p)) return "image";
    if (/favicon/.test(p) || /\\.ico$/.test(p)) return "favicon";
    return "other";
  };
  const nav = performance.getEntriesByType("navigation")[0];
  const rows = performance.getEntriesByType("resource")
    .filter((r) => !r.name.startsWith("data:"))
    .map((r) => ({
      kind: kindOf(r),
      file: new URL(r.name, location.href).pathname,
      kb: kb(r.transferSize || 0),
      startMs: Math.round(r.startTime),
      endMs: Math.round(r.responseEnd),
    }));
  if (nav) rows.unshift({ kind: "document", file: "/", kb: kb(nav.transferSize || 0), startMs: 0, endMs: Math.round(nav.responseEnd) });

  const byKind = {};
  for (const r of rows) {
    byKind[r.kind] = byKind[r.kind] || { kb: 0, count: 0, lastEndMs: 0 };
    byKind[r.kind].kb = Math.round((byKind[r.kind].kb + r.kb) * 10) / 10;
    byKind[r.kind].count++;
    byKind[r.kind].lastEndMs = Math.max(byKind[r.kind].lastEndMs, r.endMs);
  }

  return {
    totalKB: Math.round(rows.reduce((n, r) => n + r.kb, 0)),
    byKind,
    requests: rows.sort((a, b) => a.startMs - b.startMs),
    lcpCandidates: window.__lcpCandidates || [],
    paint: window.__paint || {},
    lcpError: window.__lcpError || null,
  };
})()`;

/** Share of pixels differing by more than a just-noticeable margin. */
async function diffPercent(a, b) {
  const [ra, rb] = await Promise.all([
    sharp(a).resize(240, null, { fit: "inside" }).greyscale().raw().toBuffer(),
    sharp(b).resize(240, null, { fit: "inside" }).greyscale().raw().toBuffer(),
  ]);
  const n = Math.min(ra.length, rb.length);
  let changed = 0;
  for (let i = 0; i < n; i++) if (Math.abs(ra[i] - rb[i]) > 8) changed++;
  return (changed / n) * 100;
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: DPR,
    // Only for `scripts/serve_http2.mjs`, whose certificate is self-signed.
    ignoreHTTPSErrors: has("insecure"),
  });
  const page = await context.newPage();
  await page.addInitScript(PROBE);
  // No `document.fonts.ready` probe here, deliberately. It was in the first
  // version of this rig and it reported 196 ms while the three woff2 files were
  // still arriving at 1,600 ms — the promise resolves whenever nothing is
  // *pending at that instant*, which on this page is before layout has asked for
  // a single font. It is a mechanism reporting on itself. `byKind.font.lastEndMs`
  // below is when the fonts actually finished, read off resource timing.

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.clearBrowserCache");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  if (THROTTLE) {
    await cdp.send("Network.emulateNetworkConditions", SLOW_4G);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
  }

  // Chrome's own request priorities. `Photo` sets `fetchPriority` explicitly and
  // next/font emits `<link rel=preload>`; both only matter if Chrome agrees, so
  // read them back rather than trusting the markup.
  // `globalThis.URL`, not `URL`: this module's own `PAGE_URL` used to be called
  // `URL`, which shadowed the constructor, so every call in here threw
  // `URL is not a constructor` into a bare `catch {}` and the priority column came
  // out `null` for every request in every artefact — a plausible-looking empty
  // field that would have been quoted as "Chrome assigned no priority". The
  // constant is renamed and the catch now reports, because a measurement rig that
  // swallows its own failures is worse than not having the column.
  const priority = new Map();
  const priorityErrors = [];
  cdp.on("Network.requestWillBeSent", (e) => {
    try {
      priority.set(new globalThis.URL(e.request.url).pathname, e.request.initialPriority);
    } catch (err) {
      priorityErrors.push(String(err));
    }
  });

  // The filmstrip. Screencast rather than repeated `page.screenshot()`: capture
  // runs in the browser process off the throttled main thread, and each frame
  // arrives with its own timestamp instead of one invented by the test.
  const frames = [];
  cdp.on("Page.screencastFrame", async (e) => {
    frames.push({ ts: e.metadata.timestamp, data: Buffer.from(e.data, "base64") });
    try {
      await cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId });
    } catch {}
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 70, everyNthFrame: 1 });

  await page.goto(PAGE_URL, { waitUntil: "load", timeout: 240_000 });
  await page.waitForLoadState("networkidle", { timeout: 240_000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await cdp.send("Page.stopScreencast").catch(() => {});

  const data = await page.evaluate(COLLECT);
  const timeOrigin = await page.evaluate(() => performance.timeOrigin / 1000);

  // "Visually complete": the first frame after which nothing on the first screen
  // changes by more than 1% of its pixels. Measured backwards from the settled
  // final frame, which is what the visitor eventually sees.
  let visuallyCompleteMs = null;
  let firstPaintedFrameMs = null;
  if (frames.length > 1) {
    const final = frames[frames.length - 1].data;
    const blankish = frames[0].data;
    for (const f of frames) {
      const d = await diffPercent(f.data, final);
      const fromFirst = await diffPercent(f.data, blankish);
      const ms = Math.round((f.ts - timeOrigin) * 1000);
      if (firstPaintedFrameMs === null && fromFirst > 1) firstPaintedFrameMs = ms;
      if (visuallyCompleteMs === null && d <= 1) visuallyCompleteMs = ms;
    }
  }

  if (priorityErrors.length > 0) {
    console.error(`FAILED: could not read request priorities (${priorityErrors[0]})`);
    process.exitCode = 1;
  }
  const requests = data.requests.map((r) => ({ ...r, priority: priority.get(r.file) ?? null }));
  const lcp = data.lcpCandidates[data.lcpCandidates.length - 1] ?? null;

  // A `<link rel=preload as=image>` whose `imagesizes`/`type` disagree by so much
  // as a character with what the `<picture>` resolves to does not fail loudly:
  // the browser fetches the preloaded candidate, the `<img>` then picks a
  // different one, and the page quietly downloads the same photograph twice.
  // That is invisible in a screenshot and invisible in a total-bytes figure that
  // nobody has broken down. Every media id here must resolve to exactly one tier.
  const tiersById = new Map();
  for (const r of requests) {
    const m = /^\/media\/(.+)-(\d+)\.(avif|webp|jpg)$/.exec(r.file);
    if (!m) continue;
    const key = `${m[1]}.${m[3]}`;
    if (!tiersById.has(key)) tiersById.set(key, new Set());
    tiersById.get(key).add(Number(m[2]));
  }
  const doubleFetched = [...tiersById.entries()]
    .filter(([, widths]) => widths.size > 1)
    .map(([id, widths]) => ({ id, widths: [...widths].sort((a, b) => a - b) }));

  await context.close();
  await browser.close();

  const report = {
    measuredAt: new Date().toISOString(),
    url: PAGE_URL,
    viewport: LABEL,
    devicePixelRatio: DPR,
    profile: THROTTLE ? "1.6 Mbps down / 150 ms RTT / 4x CPU" : "unthrottled",
    fcpMs: data.paint["first-contentful-paint"] ?? null,
    lcpMs: lcp?.ms ?? null,
    lcpElement: lcp ? `${lcp.tag}${lcp.id ? "#" + lcp.id : ""} — ${lcp.url || lcp.text}` : null,
    lcpCandidates: data.lcpCandidates,
    visuallyCompleteMs,
    firstPaintedFrameMs,
    framesCaptured: frames.length,
    firstFoldKB: data.totalKB,
    byKind: data.byKind,
    doubleFetched,
    requests,
  };

  if (OUT) {
    await mkdir(path.dirname(OUT), { recursive: true });
    await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  console.log(`--- ${LABEL} ${THROTTLE ? "(Slow 4G, 4x CPU)" : "(unthrottled)"} ---`);
  console.log(`FCP ${report.fcpMs} ms · LCP ${report.lcpMs} ms → ${report.lcpElement}`);
  console.log(`visually complete ${visuallyCompleteMs} ms · first painted frame ${firstPaintedFrameMs} ms (${frames.length} frames)`);
  console.log(`first fold ${report.firstFoldKB} KB:`);
  for (const [k, v] of Object.entries(report.byKind).sort((a, b) => b[1].kb - a[1].kb)) {
    console.log(`  ${k.padEnd(9)} ${String(v.kb).padStart(7)} KB  ${v.count} req  last ends ${v.lastEndMs} ms`);
  }
  console.log("LCP candidates:");
  for (const c of report.lcpCandidates) {
    console.log(`  ${String(c.ms).padStart(6)} ms  ${c.tag}  size ${c.size}  ${c.url || JSON.stringify(c.text)}`);
  }
  if (OUT) console.log(`Wrote ${OUT}`);

  if (doubleFetched.length > 0) {
    console.error(
      `\nFAILED: ${doubleFetched.length} photograph(s) downloaded at more than one width in a single load — ` +
        `a preload and its <picture> have disagreed:`,
    );
    for (const d of doubleFetched) console.error(`  ${d.id} at ${d.widths.join(" and ")}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
