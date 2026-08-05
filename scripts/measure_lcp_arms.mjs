// Task 6 — the arrival measurement, and the GSAP-versus-fonts question.
//
// Why this exists alongside scripts/measure_page.mjs rather than replacing it:
// measure_page.mjs is the committed rig and produces the committed artefact,
// but it runs ONE load per figure and this page's LCP has ranged 2,462-4,140 ms
// on an unchanged build. A single run is not a measurement here. This harness
// does only the arrival half, N times, and reports medians.
//
// It also answers the question the client is owed: is mobile LCP being held up
// by the JavaScript this plan deferred, or by the fonts nobody has touched?
// Arms are selected with --arm:
//
//   baseline      as shipped
//   no-fonts      every .woff2 aborted -> UPPER BOUND on what any font work
//                 could buy, since it removes both the bytes and the swap
//                 repaint. Subsetting can only recover part of this.
//   no-gsap-net   the GSAP chunks aborted -> confirms they are not in the
//                 pre-LCP critical path at all on an untouched load
//
// The gsap-static counterfactual is NOT an arm: it needs a different build, so
// it is a second server measured with --arm baseline.
//
// Flags: --port --arm --runs --width --height --dpr --label --out --no-throttle

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const has = (n) => args.includes(`--${n}`);

const PORT = flag("port", "3210");
const URL = flag("url", `http://localhost:${PORT}/`);
const ARM = flag("arm", "baseline");
const RUNS = Number(flag("runs", "5"));
const WIDTH = Number(flag("width", "390"));
const HEIGHT = Number(flag("height", "844"));
const DPR = Number(flag("dpr", "3"));
const LABEL = flag("label", `${ARM}-${WIDTH}x${HEIGHT}@${DPR}x`);
const OUT = flag("out", "");
const THROTTLE = !has("no-throttle");

const SLOW_4G = {
  offline: false,
  downloadThroughput: (1.6 * 1000 * 1000) / 8,
  uploadThroughput: (750 * 1000) / 8,
  latency: 150,
};
const CPU_THROTTLE = 4;
const HERO = "reception-path-dusk";

// Every LCP candidate, not just the last — the font-swap hypothesis predicts a
// LATE candidate on a text element arriving with the web font, so the history
// is the evidence, not the final value.
const PROBE = `
  window.__lcpAll = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__lcpAll.push({
        ms: Math.round(e.startTime),
        tag: e.element ? e.element.tagName : null,
        cls: e.element ? String(e.element.className || "").slice(0, 70) : null,
        text: e.element ? String(e.element.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 80) : null,
        url: e.url || null,
        size: e.size,
      });
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
  window.__fcp = null;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.name === "first-contentful-paint") window.__fcp = Math.round(e.startTime);
    }
  }).observe({ type: "paint", buffered: true });
`;

const COLLECT = `(() => {
  const kb = (n) => Math.round((n / 1024) * 10) / 10;
  const res = performance.getEntriesByType("resource");
  const pick = (re) => res.filter((r) => re.test(new URL(r.name).pathname));
  const sum = (a) => Math.round(a.reduce((n, r) => n + (r.transferSize || 0), 0) / 1024 * 10) / 10;
  const fonts = pick(/\\.woff2?$/);
  const js = pick(/\\.js$/);
  const imgs = res.filter((r) => r.initiatorType === "img" || /\\.(avif|webp|jpg|png)$/.test(new URL(r.name).pathname));
  const hero = imgs.find((r) => r.name.includes(${JSON.stringify(HERO)})) || null;
  const last = (a) => (a.length ? Math.round(Math.max(...a.map((r) => r.responseEnd))) : null);
  return {
    fcpMs: window.__fcp,
    lcpAll: window.__lcpAll,
    lcp: window.__lcpAll.length ? window.__lcpAll[window.__lcpAll.length - 1] : null,
    heroMs: hero ? Math.round(hero.responseEnd) : null,
    heroKB: hero ? kb(hero.transferSize || 0) : null,
    heroFile: hero ? new URL(hero.name).pathname : null,
    fontCount: fonts.length,
    fontKB: sum(fonts),
    fontLastMs: last(fonts),
    fontFiles: fonts.map((r) => ({ f: new URL(r.name).pathname.split("/").pop(), kb: kb(r.transferSize || 0), ms: Math.round(r.responseEnd) })),
    jsCount: js.length,
    jsKB: sum(js),
    jsLastMs: last(js),
    totalKB: sum(res),
    requests: res.length,
  };
})()`;

const median = (xs) => {
  const a = xs.filter((x) => x != null).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
};

async function once(browser) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: DPR,
  });
  const page = await context.newPage();
  await page.addInitScript(PROBE);

  let aborted = 0;
  if (ARM === "no-fonts") {
    await page.route(/\.woff2?$/, (r) => { aborted++; return r.abort(); });
  } else if (ARM === "no-font-preload") {
    // The three fonts are `<link rel=preload as=font>`, which makes them
    // high-priority and puts 110 KB in front of the hero photograph on a link
    // that only carries 200 KB/s. This arm keeps every font byte but drops the
    // preload, so the fonts are discovered from CSS instead and the hero is no
    // longer queued behind them. `display: swap` means the type still paints
    // immediately in the fallback either way.
    //
    // Separating this from `no-fonts` matters: one arm asks "what do the bytes
    // cost", this one asks "what does their PRIORITY cost". They have different
    // fixes and only one of them needs a glyph subset to maintain.
    await page.route(URL, async (route) => {
      const res = await route.fetch();
      const html = await res.text();
      const stripped = html.replace(
        /<link[^>]*rel="preload"[^>]*as="font"[^>]*>/g,
        () => { aborted++; return ""; },
      );
      return route.fulfill({ response: res, body: stripped });
    });
  } else if (ARM === "no-gsap-net") {
    // Chunk names are content hashes, so match on what the request is for by
    // letting it through and reading it would be too late. The GSAP chunks are
    // the only ones fetched after load on this page; abort by size-independent
    // path match supplied via --gsap-chunks.
    const names = flag("gsap-chunks", "").split(",").filter(Boolean);
    if (!names.length) throw new Error("--arm no-gsap-net needs --gsap-chunks a,b");
    await page.route(
      (u) => names.some((n) => u.pathname.endsWith(n)),
      (r) => { aborted++; return r.abort(); },
    );
  }

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.clearBrowserCache");
  if (THROTTLE) {
    await cdp.send("Network.emulateNetworkConditions", SLOW_4G);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
  }

  await page.goto(URL, { waitUntil: "load", timeout: 240_000 });
  await page.waitForLoadState("networkidle", { timeout: 240_000 }).catch(() => {});
  // LCP is only final once the page stops changing; give the swap repaint room.
  await page.waitForTimeout(1500);

  const out = await page.evaluate(COLLECT);
  out.abortedRequests = aborted;
  await context.close();
  return out;
}

async function main() {
  const browser = await chromium.launch();
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await once(browser);
    runs.push(r);
    console.log(
      `  run ${i + 1}/${RUNS}  lcp ${String(r.lcp?.ms).padStart(5)}ms <${r.lcp?.tag}>  fcp ${String(r.fcpMs).padStart(5)}ms  hero ${String(r.heroMs).padStart(5)}ms  fonts ${r.fontCount}/${r.fontKB}KB@${r.fontLastMs}ms  js ${r.jsCount}/${r.jsKB}KB`,
    );
  }
  await browser.close();

  // A blocking arm that blocked nothing has silently re-measured the baseline,
  // and would be read as "removing this made no difference" — the loudest way
  // to get the wrong answer out of this harness. So it is a FAILURE, not a
  // footnote. Same rule as every other rig here: assert the outcome (bytes
  // really did not arrive), never the mechanism (a route was registered).
  // The test is BYTES, not request count. Resource Timing still records an
  // aborted request — it appears with transferSize 0 — so counting entries
  // reports a working block as a failure. This assertion checked `fontCount`
  // on its first run and failed a run that had blocked all four requests
  // perfectly well: the same mechanism-not-outcome mistake this project keeps
  // finding, committed here in the instrument built to avoid it. What the arm
  // claims is that the bytes did not arrive, so that is what is asserted.
  if (ARM !== "baseline") {
    const abortedEvery = runs.every((r) => r.abortedRequests > 0);
    const bytesGone = ARM !== "no-fonts" || runs.every((r) => r.fontKB === 0);
    // The preload arm must still LOAD every font byte — it removes the hint,
    // not the typeface. If the fonts vanished too, this arm has quietly become
    // `no-fonts` and its number would be read as a priority effect when it is
    // really a bytes effect.
    const bytesKept = ARM !== "no-font-preload" || runs.every((r) => r.fontKB > 100);
    if (!abortedEvery || !bytesGone || !bytesKept) {
      console.error(
        `\nFAIL — arm "${ARM}" did not actually block anything.` +
          ` aborted per run: ${runs.map((r) => r.abortedRequests).join(",")};` +
          `font KB: ${runs.map((r) => r.fontKB).join(",")}`,
      );
      process.exitCode = 1;
    }
  }

  const summary = {
    label: LABEL,
    arm: ARM,
    url: URL,
    viewport: `${WIDTH}x${HEIGHT}`,
    dpr: DPR,
    throttled: THROTTLE,
    runs: RUNS,
    medians: {
      lcpMs: median(runs.map((r) => r.lcp?.ms)),
      fcpMs: median(runs.map((r) => r.fcpMs)),
      heroResponseEndMs: median(runs.map((r) => r.heroMs)),
      fontLastMs: median(runs.map((r) => r.fontLastMs)),
      fontKB: median(runs.map((r) => r.fontKB)),
      jsKB: median(runs.map((r) => r.jsKB)),
      totalKB: median(runs.map((r) => r.totalKB)),
    },
    lcpRangeMs: [Math.min(...runs.map((r) => r.lcp?.ms ?? Infinity)), Math.max(...runs.map((r) => r.lcp?.ms ?? -Infinity))],
    lcpElements: [...new Set(runs.map((r) => `${r.lcp?.tag} "${r.lcp?.text}"`))],
    all: runs,
  };

  console.log(
    `\n${LABEL}: LCP median ${summary.medians.lcpMs}ms (range ${summary.lcpRangeMs[0]}-${summary.lcpRangeMs[1]}), ` +
      `FCP ${summary.medians.fcpMs}ms, hero ${summary.medians.heroResponseEndMs}ms, fonts ${summary.medians.fontKB}KB by ${summary.medians.fontLastMs}ms`,
  );
  console.log(`LCP resolved to: ${summary.lcpElements.join(" | ")}`);

  if (OUT) {
    await mkdir(path.dirname(OUT), { recursive: true });
    await writeFile(OUT, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(`Wrote ${OUT}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
