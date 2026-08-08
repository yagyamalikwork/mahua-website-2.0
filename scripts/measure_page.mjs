// Browser measurement rig for the home page.
//
// Exists because docs/reviews/2026-08-04-task-7/verification.json was written by
// a rig that lived in a scratchpad and was gone by the time anyone read the
// numbers — so the committed artefact drifted from the report and nobody could
// re-derive either. Everything this writes can be regenerated with one command.
//
// Two things it measures that a Lighthouse run does not:
//
//   1. **The hero photograph's own responseEnd**, not just Chrome's LCP. Chrome
//      resolved LCP to a <p> on this page in both throttled and unthrottled runs
//      while the hero was still arriving at ~4.8s. The budget passed on the
//      metric while the thing the visitor waits for did not.
//   2. **Initial vs whole-page transfer separately.** Everything below the fold
//      is lazy, so one number cannot describe both.
//
// Run:
//   npm run build && npx next start -p 3100 &
//   node scripts/measure_page.mjs --out docs/reviews/2026-08-04-task-7/verification.json
//
// Flags: --url, --out, --port, --hero.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-04-task-7/verification.json");
/**
 * Device pixel ratio. Defaults to 1 so the figures already committed stay
 * reproducible, but **1 is not a phone**: every real handset is 2 or 3, and at
 * DPR 3 a 390px viewport asks the `srcset` for a 1170px file. Run it at 3 to see
 * what the hero actually costs the traffic this site is built for.
 */
const DPR = Number(flag("dpr", "1"));

/** The reviewer's profile: Slow 4G, 1.6 Mbps down, 150 ms RTT, 4x CPU. */
const SLOW_4G = {
  offline: false,
  downloadThroughput: (1.6 * 1000 * 1000) / 8,
  uploadThroughput: (750 * 1000) / 8,
  latency: 150,
};
const CPU_THROTTLE = 4;

/**
 * The hero photograph — the one the visitor is actually waiting for.
 *
 * A flag, not a bare constant: this rig was written for the home page and its
 * one hero file, and a hardcoded id silently reports `hero: null` on any other
 * route — which is exactly what happened pointing it at `/mahua-vann` (its
 * hero is `vann-hero-*`, not `reception-path-dusk-*`) on 9 Aug 2026. Nothing
 * failed loudly; the field most of this file's own comment is about simply
 * came back empty. Defaults to the home page's hero so every existing command
 * and committed report stays reproducible unchanged.
 */
const HERO = flag("hero", "reception-path-dusk");

const LCP_PROBE = `
  window.__lcp = null;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__lcp = {
        ms: Math.round(e.startTime),
        element: e.element ? e.element.tagName : null,
        url: e.url || null,
        size: e.size,
      };
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
`;

const COLLECT = `(() => {
  const images = performance.getEntriesByType("resource").filter((r) => r.initiatorType === "img" || /\\.(avif|webp|jpg|png)$/.test(new URL(r.name).pathname));
  const all = performance.getEntriesByType("resource");
  const kb = (n) => Math.round(n / 1024);
  return {
    requests: all.length,
    totalKB: kb(all.reduce((n, r) => n + (r.transferSize || 0), 0)),
    imagesKB: kb(images.reduce((n, r) => n + (r.transferSize || 0), 0)),
    imagesLoaded: images.length,
    images: images
      .map((r) => ({
        file: new URL(r.name).pathname,
        kb: kb(r.transferSize || 0),
        responseEndMs: Math.round(r.responseEnd),
      }))
      .sort((a, b) => b.kb - a.kb),
    lcp: window.__lcp,
  };
})()`;

async function scrollWholePage(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 260));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 900));
  });
  await page.waitForLoadState("networkidle").catch(() => {});
}

/** One page load. `throttle` applies the Slow 4G + 4x CPU profile. */
async function run(browser, { width, height = 900, throttle, scroll }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: DPR,
  });
  const page = await context.newPage();
  await page.addInitScript(LCP_PROBE);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.clearBrowserCache");
  if (throttle) {
    await cdp.send("Network.emulateNetworkConditions", SLOW_4G);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
  }

  await page.goto(URL, { waitUntil: "load", timeout: 180_000 });
  // Let lazy images inside the initial viewport threshold finish arriving —
  // they are part of what the visitor pays for before scrolling.
  await page.waitForLoadState("networkidle", { timeout: 180_000 }).catch(() => {});

  const initial = await page.evaluate(COLLECT);
  const hero = initial.images.find((i) => i.file.includes(HERO)) ?? null;

  let whole = null;
  if (scroll) {
    await scrollWholePage(page);
    whole = await page.evaluate(COLLECT);
  }

  await context.close();
  return { width, throttled: Boolean(throttle), initial, hero, whole };
}

/** Share of pixels that differ between two same-size PNG buffers, as a percent. */
async function changedPercent(a, b) {
  const [ra, rb] = await Promise.all([
    sharp(a).greyscale().raw().toBuffer(),
    sharp(b).greyscale().raw().toBuffer(),
  ]);
  let changed = 0;
  for (let i = 0; i < ra.length; i++) if (Math.abs(ra[i] - rb[i]) > 6) changed++;
  return Number(((changed / ra.length) * 100).toFixed(1));
}

/**
 * Is the scroll choreography actually perceptible? Land 120px above a section so
 * it is entering rather than settled, then sample 420 ms apart. The client
 * rejected the previous build partly for "no scroll animation", so this is a
 * standing measurement, not a one-off.
 */
async function measureMotion(browser) {
  const ids = ["lodges", "rooted", "forest", "field-days", "rooms", "guests"];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  const out = [];
  for (const id of ids) {
    await page.evaluate((sel) => {
      const el = document.getElementById(sel);
      window.scrollTo(0, (el?.getBoundingClientRect().top ?? 0) + window.scrollY - 120);
    }, id);
    const first = await page.screenshot();
    await page.waitForTimeout(420);
    const second = await page.screenshot();
    out.push({ id, changedPercent: await changedPercent(first, second) });
    // Back to the top so each section is entered fresh rather than already run.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
  }
  await context.close();
  return out;
}

/** Under `prefers-reduced-motion`, the page must be a still image at rest. */
async function measureReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 160));
    }
    window.scrollTo(0, Math.round(document.body.scrollHeight / 2));
    await new Promise((r) => setTimeout(r, 1200));
  });
  const first = await page.screenshot();
  await page.waitForTimeout(800);
  const second = await page.screenshot();

  const wordsLeftDisplaced = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll("[data-line-inner]")).filter((el) => {
        const t = getComputedStyle(el).transform;
        return t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)";
      }).length,
  );

  await context.close();
  return {
    changedPercentWhileStill: await changedPercent(first, second),
    wordsLeftDisplaced,
  };
}

/**
 * No horizontal scroll at any scroll position. Several photographs extend past
 * the viewport edge on purpose and are held by `overflow-x-clip`; this is what
 * proves the clip is doing its job.
 */
async function measureResponsive(browser) {
  const out = [];
  for (const width of [390, 768, 1440, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "load" });
    const worst = await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.6);
      let max = 0;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 140));
        max = Math.max(max, document.documentElement.scrollWidth);
      }
      return { scrollWidth: max, clientWidth: document.documentElement.clientWidth };
    });
    out.push({ width, horizontalScroll: worst.scrollWidth > worst.clientWidth, ...worst });
    await context.close();
  }
  return out;
}

async function main() {
  const browser = await chromium.launch();

  // The measurement this fix round turns on: what the hero costs a phone on a
  // slow link. Reported as the photograph's own responseEnd, because Chrome's
  // LCP does not resolve to it.
  const throttled390 = await run(browser, { width: 390, height: 844, throttle: true, scroll: false });

  // Transfer sizes are link-independent, so the budget figures are measured
  // unthrottled — much faster, and identical bytes.
  const budget390 = await run(browser, { width: 390, height: 844, scroll: true });
  const budget1440 = await run(browser, { width: 1440, height: 900, scroll: true });

  const motion = await measureMotion(browser);
  const reducedMotion = await measureReducedMotion(browser);
  const responsive = await measureResponsive(browser);

  await browser.close();

  const report = {
    measuredAt: new Date().toISOString(),
    url: URL,
    devicePixelRatio: DPR,
    note:
      "Regenerated by scripts/measure_page.mjs. `throttledHero` is the hero photograph's own " +
      "responseEnd on Slow 4G (1.6 Mbps / 150 ms RTT / 4x CPU) at 390x844 — Chrome's LCP on this " +
      "page resolves to a <p>, not the photograph, so LCP alone hides it.",
    throttledHero: {
      viewport: `390x844 @${DPR}x`,
      profile: "1.6 Mbps down / 150 ms RTT / 4x CPU",
      file: throttled390.hero?.file ?? null,
      kb: throttled390.hero?.kb ?? null,
      responseEndMs: throttled390.hero?.responseEndMs ?? null,
      chromeLcp: throttled390.initial.lcp,
      initialKB: throttled390.initial.totalKB,
      initialImagesKB: throttled390.initial.imagesKB,
      initialImages: throttled390.initial.imagesLoaded,
    },
    budget: {
      "390": {
        initialKB: budget390.initial.totalKB,
        initialImagesKB: budget390.initial.imagesKB,
        initialImages: budget390.initial.imagesLoaded,
        wholePageKB: budget390.whole.totalKB,
        wholePageImages: budget390.whole.imagesLoaded,
        largestImage: budget390.whole.images[0] ?? null,
        heaviestInitial: budget390.initial.images.slice(0, 5),
      },
      "1440": {
        initialKB: budget1440.initial.totalKB,
        initialImagesKB: budget1440.initial.imagesKB,
        initialImages: budget1440.initial.imagesLoaded,
        wholePageKB: budget1440.whole.totalKB,
        wholePageImages: budget1440.whole.imagesLoaded,
        largestImage: budget1440.whole.images[0] ?? null,
        heaviestInitial: budget1440.initial.images.slice(0, 5),
      },
    },
    motion,
    reducedMotion,
    responsive,
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Wrote ${OUT}`);
  console.log(
    `hero ${report.throttledHero.file} — ${report.throttledHero.kb} KB, responseEnd ${report.throttledHero.responseEndMs} ms (Slow 4G, 390px)`,
  );
  console.log(`Chrome LCP: ${JSON.stringify(report.throttledHero.chromeLcp)}`);
  for (const w of ["390", "1440"]) {
    const b = report.budget[w];
    console.log(
      `${w}px — initial ${b.initialKB} KB (${b.initialImages} images, ${b.initialImagesKB} KB), whole page ${b.wholePageKB} KB (${b.wholePageImages} images)`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
