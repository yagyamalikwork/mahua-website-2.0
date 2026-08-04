// Run Lighthouse against the production build and print the four numbers that
// matter here, plus the one thing a score cannot tell you on its own: which
// element LCP resolved to, and whether the figure is Lighthouse's *simulated*
// LCP or the browser's *observed* one.
//
// Task 8 reported mobile LCP 4.1 s. That is a Lantern simulation: Lighthouse
// loads the page on the real machine (observed LCP here: ~350 ms) and then
// replays the request graph over a modelled Slow 4G link. For the LCP metric the
// pessimistic half of that model treats **every request that started before the
// observed paint** as blocking, so the number is, in practice, a function of
// first-fold *bytes* — which is why it can read 4.1 s while a real throttled
// Chrome paints the same element at 1.4 s (scripts/measure_first_fold.mjs).
//
// Both are printed. Neither is the whole story and neither should be quoted
// alone.
//
// ## Why `--runs` exists, and why one Lighthouse number is not a measurement
//
// Because that cutoff is the *observed* paint on the machine doing the test, the
// simulated LCP moves with how busy that machine is. Five consecutive runs
// against one unchanged build, downloading a byte-identical 536 KiB every time,
// produced simulated LCPs of 2,454 / 2,496 / 4,051 ms — scores of 96, 96 and 85.
// The 4.1 s figure Task 8 reported is one draw from a distribution that wide.
//
// So this runs N times and reports the median and the spread. A single run is
// not evidence of a regression or of a fix, in either direction.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/lighthouse_summary.mjs --form-factor mobile --runs 5 --out docs/reviews/.../lighthouse-mobile

import { mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const FORM = flag("form-factor", "mobile");
// Lighthouse appends `.report.<ext>` to `--output-path` whenever more than one
// output format is asked for, so the base is given without an extension and the
// real filenames are derived — rather than a caller passing `foo.json` and
// finding `foo.json.report.json` on disk.
const BASE = flag("out", `lighthouse-${FORM}`).replace(/(\.report)?\.(json|html)$/, "");
const RUNS = Number(flag("runs", "1"));

await mkdir(path.dirname(path.resolve(BASE)), { recursive: true });

/** The LCP element node lives in whichever of these audits this version ships. */
function findNode(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (obj.type === "node" && obj.nodeLabel) return obj;
  for (const v of Array.isArray(obj) ? obj : Object.values(obj)) {
    const hit = findNode(v);
    if (hit) return hit;
  }
  return null;
}

function runOnce(base) {
  const jsonOut = `${base}.report.json`;
  const lhArgs = [
    "--yes",
    "lighthouse",
    URL,
    "--output=json",
    "--output=html",
    `--output-path=${base}`,
    `--form-factor=${FORM}`,
    "--chrome-flags=--headless=new --no-sandbox",
    "--quiet",
  ];
  if (FORM === "desktop") lhArgs.push("--preset=desktop");
  else lhArgs.push("--screenEmulation.mobile", "--throttling-method=simulate");

  const proc = spawnSync("npx", lhArgs, { stdio: ["ignore", "inherit", "inherit"], shell: true });
  // On Windows, chrome-launcher routinely fails to delete its own temp profile
  // and exits non-zero *after* the report is written. Judge the run by whether
  // the artefact exists — but never silently: a missing report is a hard failure.
  if (!existsSync(jsonOut)) {
    console.error(`Lighthouse produced no report at ${jsonOut} (exit ${proc.status}).`);
    process.exit(proc.status ?? 1);
  }

  const report = JSON.parse(readFileSync(jsonOut, "utf8"));
  const m = report.audits.metrics.details.items[0];
  const node =
    findNode(report.audits["largest-contentful-paint-element"]?.details) ??
    findNode(report.audits["lcp-breakdown-insight"]?.details);
  const requests = report.audits["network-requests"].details.items.filter(
    (i) => !i.url.startsWith("data:"),
  );
  const byType = {};
  for (const r of requests) {
    const k = /\.woff2?$/.test(r.url) ? "font" : (r.resourceType || "other").toLowerCase();
    byType[k] = Math.round(((byType[k] || 0) + (r.transferSize || 0) / 1024) * 10) / 10;
  }
  return {
    file: jsonOut,
    score: Math.round(report.categories.performance.score * 100),
    fcp: m.firstContentfulPaint,
    lcp: m.largestContentfulPaint,
    observedLcp: m.observedLargestContentfulPaint,
    tbt: m.totalBlockingTime,
    cls: m.cumulativeLayoutShift,
    si: m.speedIndex,
    transferKiB: Math.round(requests.reduce((n, r) => n + (r.transferSize || 0), 0) / 1024),
    byType,
    lcpElement: node ? `${node.selector} — ${node.nodeLabel}` : "not reported",
  };
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const results = [];
for (let i = 1; i <= RUNS; i++) {
  results.push(runOnce(RUNS === 1 ? BASE : `${BASE}-run${i}`));
  const r = results[results.length - 1];
  console.log(
    `run ${i}/${RUNS}: score ${r.score}  FCP ${r.fcp}  LCP ${r.lcp} (observed ${r.observedLcp})  ` +
      `TBT ${r.tbt}  CLS ${r.cls}  SI ${r.si}  ${r.transferKiB} KiB`,
  );
}

const f = (k) => results.map((r) => r[k]);
console.log(`\n=== Lighthouse ${FORM} — ${URL} — ${RUNS} run(s) ===`);
for (const k of ["score", "fcp", "lcp", "tbt", "si"]) {
  const v = f(k);
  console.log(
    `${k.padEnd(6)} median ${String(median(v)).padStart(6)}  min ${String(Math.min(...v)).padStart(6)}  max ${String(Math.max(...v)).padStart(6)}`,
  );
}
console.log(`CLS ${JSON.stringify(f("cls"))}`);
console.log(`LCP element: ${results[0].lcpElement}`);
console.log(`transfer ${results[0].transferKiB} KiB — ${JSON.stringify(results[0].byType)}`);
console.log(`Wrote ${results.map((r) => r.file).join(", ")}`);
