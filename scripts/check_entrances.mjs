// The entrances, driven rather than inspected.
//
// Plan 4 Task 2 replaced GSAP's `Reveal` with `Enter` and re-cut `ImageReveal`
// on the same engine: a `data-enter` / `data-image-enter` attribute written by
// `components/motion/useInView.ts`, and CSS in `app/globals.css` doing the
// moving. Nothing about that is visible to a unit test — jsdom has no layout,
// no cascade, and no `IntersectionObserver`.
//
// It is also the exact shape this project has been burned by: a check that
// confirms a *mechanism was configured* rather than that *behaviour changed*.
// So nothing below reads a class name or asserts an attribute in isolation.
// Every finding is a measurement of what is on screen:
//
//   - a staged element is measured invisible and displaced, and then measured
//     settled — via a MutationObserver log of every state the page actually
//     went through, not via a snapshot;
//   - the mask is measured by the height of the box it draws over its
//     photograph, because "the class is still there" would not have caught
//     Tailwind v4 compiling `scale-y-0` to the `scale` property while the
//     override was written against `transform` (they compose, so the mask would
//     have stayed collapsed and the wipe would have been a silent no-op);
//   - "readable with no JavaScript" is measured as rendered text and computed
//     opacity in a context with `javaScriptEnabled: false`, not inferred from
//     the server markup.
//
// Run (with `npm run build && npx next start -p 3100` already up):
//   node scripts/check_entrances.mjs
//   node scripts/check_entrances.mjs --out docs/reviews/<date>/entrances.json

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-05-scroll-craft/entrances.json");
const SHOTS = path.dirname(OUT);

/** Every state change the page really went through, in order. */
const RECORD_STATES = () => {
  window.__enterLog = [];
  const attrs = ["data-enter", "data-image-enter"];
  const start = () => {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        window.__enterLog.push({
          attr: m.attributeName,
          from: m.oldValue,
          to: m.target.getAttribute(m.attributeName),
        });
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: attrs,
    });
  };
  if (document.documentElement) start();
  else document.addEventListener("DOMContentLoaded", start);
};

/** Evidence at the size the rest of `docs/reviews/` is kept: webp, ~100 KB. */
async function shot(page, name) {
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 78 }).toFile(path.join(SHOTS, `${name}.webp`));
}

/** Real wheel turns, spaced so Lenis's inertia has time to run. */
async function wheelTo(page, turns, onStep) {
  for (let i = 0; i < turns; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(140);
    if (onStep) await onStep(i);
  }
  await page.waitForTimeout(2000);
}

/**
 * What is on screen right now, for the elements this task owns.
 *
 * `maskCover` is the fraction of its own frame each mask actually covers,
 * measured off rendered boxes. 0 means the photograph is visible; ~1 means it
 * is behind a cream panel.
 */
const SNAPSHOT = () => {
  const round = (n) => Math.round(n * 1000) / 1000;
  const entering = [...document.querySelectorAll("[data-enter]")];
  const masks = [...document.querySelectorAll("[data-image-mask]")];

  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  };

  return {
    staged: document.querySelectorAll('[data-enter="pending"]').length,
    stagedImages: document.querySelectorAll('[data-image-enter="pending"]').length,
    /**
     * Staged *while the visitor can see it* — the flicker, and the only staging
     * that is ever wrong. Everything below the fold is supposed to be staged.
     */
    stagedInView: [
      ...document.querySelectorAll('[data-enter="pending"], [data-image-enter="pending"]'),
    ].filter(onScreen).length,
    settled: document.querySelectorAll('[data-enter="in"]').length,
    settledImages: document.querySelectorAll('[data-image-enter="in"]').length,
    attributed: entering.length,
    /**
     * Anything a visitor cannot read. The number that must end at zero.
     *
     * The threshold is 0.5 and not 0.99 because the hero already sets a
     * paragraph to `opacity: 0.9` by design, with and without JavaScript. A
     * stranded entrance is not a dim one — `[data-enter="pending"]` sets exactly
     * 0, so anything this catches is genuinely unreadable.
     */
    invisible: entering.filter((el) => Number(getComputedStyle(el).opacity) < 0.5).length,
    displaced: entering.filter((el) => {
      const t = getComputedStyle(el).transform;
      return t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)";
    }).length,
    maskCover: masks.map((mask) => {
      const frame = mask.parentElement.getBoundingClientRect();
      if (!frame.height) return 0;
      return round(mask.getBoundingClientRect().height / frame.height);
    }),
  };
};

/** Every chapter, and how much text it is actually rendering. */
const CHAPTER_TEXT = () =>
  [...document.querySelectorAll("main > section")].map((s) => ({
    id: s.id,
    words: (s.innerText || "").trim().split(/\s+/).filter(Boolean).length,
    hidden: [...s.querySelectorAll("p, h1, h2, h3, blockquote, li")].filter(
      (el) => el.textContent.trim() && Number(getComputedStyle(el).opacity) < 0.5,
    ).length,
    photographs: s.querySelectorAll("img").length,
    maskedOver: [...s.querySelectorAll("[data-image-mask]")].filter((mask) => {
      const frame = mask.parentElement.getBoundingClientRect();
      return frame.height > 0 && mask.getBoundingClientRect().height / frame.height > 0.05;
    }).length,
  }));

async function open(browser, { width, height, reducedMotion, javaScript = true }) {
  const context = await browser.newContext({
    viewport: { width, height },
    javaScriptEnabled: javaScript,
    ...(reducedMotion ? { reducedMotion: "reduce" } : {}),
  });
  if (javaScript) await context.addInitScript(RECORD_STATES);
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1800);
  return { context, page };
}

/** The whole page, scrolled the way a visitor scrolls it. */
async function scrollThrough(browser, { width, height, reducedMotion, label }) {
  const { context, page } = await open(browser, { width, height, reducedMotion });

  // The first fold, before anything is scrolled. Nothing here may be staged:
  // an element the visitor is already looking at that fades out and back is the
  // flicker a capture found on 4 Aug.
  const atRest = await page.evaluate(SNAPSHOT);
  const firstFold = [];
  for (let i = 0; i < 24; i++) {
    firstFold.push(await page.evaluate(SNAPSHOT));
    await page.waitForTimeout(60);
  }

  const documentHeight = await page.evaluate(() => document.body.scrollHeight);
  const turns = Math.ceil(documentHeight / 500) + 6;

  let peakStaged = 0;
  let peakMaskCover = 0;
  let shotTaken = false;
  await wheelTo(page, turns, async () => {
    const now = await page.evaluate(SNAPSHOT);
    peakStaged = Math.max(peakStaged, now.staged + now.stagedImages);
    peakMaskCover = Math.max(peakMaskCover, ...now.maskCover);
    // One frame caught mid-entrance, so the movement can be looked at and not
    // only counted.
    if (!shotTaken && now.staged > 0) {
      shotTaken = true;
      await shot(page, `${label}-mid-entrance`);
    }
  });

  const afterScroll = await page.evaluate(SNAPSHOT);
  const chapters = await page.evaluate(CHAPTER_TEXT);
  const log = await page.evaluate(() => window.__enterLog ?? []);
  await shot(page, `${label}-foot-of-page`);
  await context.close();

  const flickered = firstFold.some((s) => s.stagedInView > 0);

  return {
    label,
    viewport: `${width}x${height}`,
    reducedMotion: Boolean(reducedMotion),
    atRest,
    /** Did anything on the first fold get staged? Must be false. */
    flickeredOnLoad: flickered,
    /** Did entrances ever actually play? `pending` -> `in`, counted from the log. */
    stagings: log.filter((e) => e.to === "pending").length,
    settlings: log.filter((e) => e.to === "in").length,
    /** Was a mask ever actually drawn over its photograph? */
    peakMaskCover,
    peakStagedAtOnce: peakStaged,
    afterScroll,
    leftStaged: afterScroll.staged + afterScroll.stagedImages,
    leftInvisible: afterScroll.invisible,
    leftMasked: afterScroll.maskCover.filter((c) => c > 0.05).length,
    chapters,
  };
}

/** The hero, which is the LCP element and must never be tweened. */
async function checkHero(browser) {
  const { context, page } = await open(browser, { width: 1440, height: 900 });
  const hero = await page.evaluate(() => {
    const section = document.querySelector("main > section");
    const frame = section.querySelector("[data-image-mask]")?.parentElement;
    const mask = frame?.querySelector("[data-image-mask]");
    const img = frame?.querySelector("img");
    const box = frame?.getBoundingClientRect();
    return {
      id: section.id,
      // `null` is the whole point: the hero is never handed to the observer, so
      // no state is ever written to it.
      state: frame?.getAttribute("data-image-enter") ?? null,
      maskCover: box?.height ? mask.getBoundingClientRect().height / box.height : null,
      imageScale: img ? getComputedStyle(img.parentElement).scale : null,
      imageVisible: img ? Number(getComputedStyle(img).opacity) : null,
      imageComplete: img ? img.complete : null,
    };
  });
  await shot(page, "hero-at-load");
  await context.close();
  return hero;
}

/** No JavaScript at all — the fail-safe the whole arrangement exists for. */
async function checkNoScript(browser, { width, height }) {
  const { context, page } = await open(browser, { width, height, javaScript: false });
  const found = await page.evaluate(() => ({
    enterAttributes: document.querySelectorAll("[data-enter], [data-image-enter]").length,
  })).catch(() => ({ enterAttributes: null }));
  const chapters = await page.evaluate(CHAPTER_TEXT);
  // Three frames rather than one full-page capture: the page is ~14,700px tall
  // at 1440, and the per-chapter word and mask counts above are the finding
  // anyway. These are here to be looked at, not to be measured.
  const height_ = await page.evaluate(() => document.body.scrollHeight);
  for (const [name, y] of [
    ["top", 0],
    ["middle", Math.round(height_ / 2)],
    ["foot", height_],
  ]) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(500);
    await shot(page, `no-js-${width}-${name}`);
  }
  await context.close();
  return { viewport: `${width}x${height}`, ...found, chapters };
}

const browser = await chromium.launch();
await mkdir(SHOTS, { recursive: true });

const report = {
  url: URL,
  measuredAt: new Date().toISOString(),
  desktop: await scrollThrough(browser, { width: 1440, height: 900, label: "desktop" }),
  phone: await scrollThrough(browser, { width: 390, height: 844, label: "phone" }),
  reducedMotion: await scrollThrough(browser, {
    width: 1440,
    height: 900,
    reducedMotion: true,
    label: "reduced-motion",
  }),
  hero: await checkHero(browser),
  noScript: [
    await checkNoScript(browser, { width: 1440, height: 900 }),
    await checkNoScript(browser, { width: 390, height: 844 }),
  ],
};

await browser.close();

// The findings, stated as pass/fail against what a visitor would see.
const runs = [report.desktop, report.phone];
const failures = [];

for (const run of runs) {
  if (run.stagings === 0) failures.push(`${run.label}: no entrance ever played`);
  if (run.settlings < run.stagings)
    failures.push(`${run.label}: ${run.stagings - run.settlings} entrances staged and never settled`);
  if (run.leftStaged > 0) failures.push(`${run.label}: ${run.leftStaged} elements left staged`);
  if (run.leftInvisible > 0)
    failures.push(`${run.label}: ${run.leftInvisible} elements left invisible`);
  if (run.leftMasked > 0)
    failures.push(`${run.label}: ${run.leftMasked} photographs left behind a mask`);
  if (run.flickeredOnLoad) failures.push(`${run.label}: something on the first fold was staged`);
  if (run.peakMaskCover < 0.9)
    failures.push(
      `${run.label}: a mask never covered more than ${run.peakMaskCover} of its frame — the wipe is a no-op`,
    );
  for (const c of run.chapters) {
    if (c.hidden > 0) failures.push(`${run.label}/${c.id}: ${c.hidden} text nodes left invisible`);
    if (c.maskedOver > 0)
      failures.push(`${run.label}/${c.id}: ${c.maskedOver} photographs left masked`);
  }
}

if (report.reducedMotion.stagings > 0)
  failures.push("reduced motion: something was staged for a visitor who asked for less motion");
if (report.reducedMotion.afterScroll.invisible > 0)
  failures.push("reduced motion: something was left invisible");

if (report.hero.state !== null) failures.push(`hero: was staged (${report.hero.state})`);
if (report.hero.maskCover > 0.05) failures.push(`hero: a mask covered ${report.hero.maskCover}`);

for (const run of report.noScript) {
  if (run.enterAttributes > 0)
    failures.push(`no-js ${run.viewport}: ${run.enterAttributes} elements carry an entrance state`);
  for (const c of run.chapters) {
    if (c.words < 3 && c.photographs === 0)
      failures.push(`no-js ${run.viewport}/${c.id}: renders nothing`);
    if (c.hidden > 0) failures.push(`no-js ${run.viewport}/${c.id}: ${c.hidden} text nodes invisible`);
    if (c.maskedOver > 0)
      failures.push(`no-js ${run.viewport}/${c.id}: ${c.maskedOver} photographs behind a mask`);
  }
}

report.failures = failures;
report.verdict = failures.length === 0 ? "pass" : "fail";

await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

for (const run of runs.concat(report.reducedMotion)) {
  console.log(
    `${run.label.padEnd(15)} staged ${String(run.stagings).padStart(3)}  settled ${String(run.settlings).padStart(3)}  ` +
      `left staged ${run.leftStaged}  left invisible ${run.leftInvisible}  peak mask cover ${run.peakMaskCover}`,
  );
}
console.log(`hero            state=${report.hero.state} maskCover=${report.hero.maskCover}`);
for (const run of report.noScript)
  console.log(
    `no-js ${run.viewport.padEnd(10)} entrance attributes ${run.enterAttributes}  ` +
      `chapters ${run.chapters.length}  words ${run.chapters.reduce((t, c) => t + c.words, 0)}`,
  );
console.log(`\n${report.verdict.toUpperCase()}  ->  ${OUT}`);
for (const f of failures) console.log(`  - ${f}`);
process.exit(failures.length === 0 ? 0 : 1);
