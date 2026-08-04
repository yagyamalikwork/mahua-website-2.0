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

// Extended for Plan 4 Task 3, which moved the headline reveal off GSAP and onto
// the same CSS engine. Two things the rig could not see before and now must:
//
//   - **the per-line stagger**, checked against where each headline *really*
//     wraps at that viewport. Words are grouped by their rendered top edge, and
//     every word on one line must carry the same `--enter-delay` while each line
//     below carries a later one. A stagger computed from an assumed line count
//     passes every unit test and is wrong at every width but one.
//   - **parallax**, which is the one effect GSAP is still here for. Measured as
//     a change in rendered position between two scroll offsets, because the
//     library now arrives by dynamic import and "it moved" is the only evidence
//     that the import fired at all.

/** Every state change the page really went through, in order. */
const RECORD_STATES = () => {
  window.__enterLog = [];
  const attrs = ["data-enter", "data-image-enter", "data-lines-enter"];
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

  /**
   * How far each word is currently displaced inside its own mask, in pixels,
   * measured off rendered boxes. The mask does not move; the span inside it
   * does. 0 is a word at rest; anything else is a word mid-reveal or stuck.
   */
  const lineOffsets = [...document.querySelectorAll("[data-word]")]
    .map((word) => {
      const inner = word.querySelector("[data-line-inner]");
      if (!inner) return 0;
      return round(inner.getBoundingClientRect().top - word.getBoundingClientRect().top);
    })
    .filter((n) => Math.abs(n) > 0.5);

  return {
    staged: document.querySelectorAll('[data-enter="pending"]').length,
    stagedImages: document.querySelectorAll('[data-image-enter="pending"]').length,
    stagedHeadlines: document.querySelectorAll('[data-lines-enter="pending"]').length,
    /**
     * Staged *while the visitor can see it* — the flicker, and the only staging
     * that is ever wrong. Everything below the fold is supposed to be staged.
     */
    stagedInView: [
      ...document.querySelectorAll(
        '[data-enter="pending"], [data-image-enter="pending"], [data-lines-enter="pending"]',
      ),
    ].filter(onScreen).length,
    settled: document.querySelectorAll('[data-enter="in"]').length,
    settledImages: document.querySelectorAll('[data-image-enter="in"]').length,
    settledHeadlines: document.querySelectorAll('[data-lines-enter="in"]').length,
    attributed: entering.length,
    /** Words displaced right now, and by how much at the extreme. */
    displacedWords: lineOffsets.length,
    peakWordOffset: lineOffsets.length ? Math.max(...lineOffsets.map(Math.abs)) : 0,
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

/**
 * Does every headline's stagger follow the wrap the browser actually produced?
 *
 * Words are grouped by their rendered top edge — that *is* the real wrapping at
 * this viewport, not a count anybody assumed. Then two things have to hold for
 * the effect to be a per-line stagger rather than a per-word one or a single
 * lump: every word on a line shares one delay, and each line's delay is later
 * than the line above it.
 */
const LINE_STAGGER = () =>
  [...document.querySelectorAll("h1, h2, h3, p")]
    .filter((el) => el.querySelector("[data-word]"))
    .map((el) => {
      const lines = new Map();
      for (const word of el.querySelectorAll("[data-word]")) {
        const top = Math.round(word.getBoundingClientRect().top);
        const inner = word.querySelector("[data-line-inner]");
        const delay = (getComputedStyle(inner).getPropertyValue("--enter-delay") || "0s").trim();
        if (!lines.has(top)) lines.set(top, new Set());
        lines.get(top).add(delay);
      }
      const tops = [...lines.keys()].sort((a, b) => a - b);
      const delays = tops.map((t) => [...lines.get(t)]);
      const seconds = delays.map((d) => Number((d[0] || "0s").replace("s", "")));
      return {
        text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 42),
        wrappedInto: tops.length,
        /** A line whose words do not agree on a delay is a per-word stagger. */
        splitLines: delays.filter((d) => d.length > 1).length,
        /** Delays must climb line by line, never repeat or go backwards. */
        risesLineByLine: seconds.every((s, i) => i === 0 || s > seconds[i - 1]),
        delays: seconds,
      };
    });

/**
 * Did the parallax actually move?
 *
 * GSAP now arrives by dynamic import, so this is also the only proof the import
 * fired. Read each parallaxed element's rendered offset from the top of the
 * document at two scroll positions: with no parallax the two differ by exactly
 * the distance scrolled, so anything else is the drift.
 */
const PARALLAX_AT = () =>
  [...document.querySelectorAll("[data-parallax]")].map((el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top + scrollY), height: Math.round(r.height) };
  });

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
  let peakWordOffset = 0;
  let shotTaken = false;
  await wheelTo(page, turns, async () => {
    const now = await page.evaluate(SNAPSHOT);
    peakStaged = Math.max(peakStaged, now.staged + now.stagedImages + now.stagedHeadlines);
    peakMaskCover = Math.max(peakMaskCover, ...now.maskCover);
    peakWordOffset = Math.max(peakWordOffset, now.peakWordOffset);
    // One frame caught mid-entrance, so the movement can be looked at and not
    // only counted.
    if (!shotTaken && now.staged > 0) {
      shotTaken = true;
      await shot(page, `${label}-mid-entrance`);
    }
  });

  const afterScroll = await page.evaluate(SNAPSHOT);
  const lineStagger = await page.evaluate(LINE_STAGGER);
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
    headlineStagings: log.filter((e) => e.attr === "data-lines-enter" && e.to === "pending").length,
    headlineSettlings: log.filter((e) => e.attr === "data-lines-enter" && e.to === "in").length,
    /** Was a mask ever actually drawn over its photograph? */
    peakMaskCover,
    /** Was a word ever actually pushed out of its own box? */
    peakWordOffset,
    peakStagedAtOnce: peakStaged,
    afterScroll,
    leftStaged: afterScroll.staged + afterScroll.stagedImages + afterScroll.stagedHeadlines,
    leftInvisible: afterScroll.invisible,
    leftMasked: afterScroll.maskCover.filter((c) => c > 0.05).length,
    /** Words still sitting outside their mask once everything has settled. */
    leftDisplacedWords: afterScroll.displacedWords,
    lineStagger,
    /** Headlines whose stagger does not follow the wrap the browser produced. */
    staggerFaults: lineStagger.filter((h) => h.wrappedInto > 1 && (h.splitLines > 0 || !h.risesLineByLine)),
    chapters,
  };
}

/**
 * Does the parallax still move, now that GSAP arrives by dynamic import?
 *
 * Two scroll positions, both chosen so the elements are on screen, and the
 * document-space position of every `[data-parallax]` read at each. An element
 * with no parallax sits at the same document position at both. This is the
 * outcome; whether an `import()` resolved is not.
 */
async function checkParallax(browser, { reducedMotion = false } = {}) {
  const { context, page } = await open(browser, { width: 1440, height: 900, reducedMotion });
  await page.evaluate(() => window.scrollTo(0, 2200));
  await page.waitForTimeout(1500);
  const first = await page.evaluate(PARALLAX_AT);
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(1500);
  const second = await page.evaluate(PARALLAX_AT);
  await context.close();

  const moved = first
    .map((a, i) => ({ shift: Math.abs((second[i]?.top ?? a.top) - a.top), height: a.height }))
    .filter((m) => m.shift > 1);

  return {
    reducedMotion,
    elements: first.length,
    moved: moved.length,
    /** As a fraction of the element's own height — spec section 4.3 caps at 0.15. */
    strongest: moved.length
      ? Math.max(...moved.map((m) => Math.round((m.shift / Math.max(m.height, 1)) * 1000) / 1000))
      : 0,
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
    const headline = section.querySelector("h1");
    const word = headline?.querySelector("[data-word]");
    const inner = word?.querySelector("[data-line-inner]");
    return {
      id: section.id,
      // `null` is the whole point: the hero is never handed to the observer, so
      // no state is ever written to it.
      state: frame?.getAttribute("data-image-enter") ?? null,
      maskCover: box?.height ? mask.getBoundingClientRect().height / box.height : null,
      imageScale: img ? getComputedStyle(img.parentElement).scale : null,
      imageVisible: img ? Number(getComputedStyle(img).opacity) : null,
      imageComplete: img ? img.complete : null,
      // The headline is on screen at mount, so it must be left alone for the
      // same reason: it is the flicker, and it would put a 1s transition on the
      // LCP clock. Both the state and the rendered offset, because either one
      // alone could be the wrong half of the story.
      headlineState: headline?.getAttribute("data-lines-enter") ?? null,
      headlineWordOffset:
        inner && word
          ? Math.round(inner.getBoundingClientRect().top - word.getBoundingClientRect().top)
          : null,
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
  parallax: await checkParallax(browser),
  parallaxReducedMotion: await checkParallax(browser, { reducedMotion: true }),
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
  if (run.headlineStagings === 0) failures.push(`${run.label}: no headline reveal ever played`);
  if (run.headlineSettlings < run.headlineStagings)
    failures.push(
      `${run.label}: ${run.headlineStagings - run.headlineSettlings} headlines staged and never settled`,
    );
  if (run.peakWordOffset < 10)
    failures.push(
      `${run.label}: no word ever moved more than ${run.peakWordOffset}px inside its mask — the line reveal is a no-op`,
    );
  if (run.leftDisplacedWords > 0)
    failures.push(`${run.label}: ${run.leftDisplacedWords} words left outside their own mask`);
  for (const h of run.staggerFaults)
    failures.push(
      `${run.label}: "${h.text}" wrapped into ${h.wrappedInto} lines but its delays are ${JSON.stringify(h.delays)}`,
    );
  if (!run.lineStagger.some((h) => h.wrappedInto > 1))
    failures.push(
      `${run.label}: no headline wrapped, so the per-line stagger was never exercised at this width`,
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

if (report.reducedMotion.afterScroll.displacedWords > 0)
  failures.push("reduced motion: a word was left outside its own mask");

if (report.hero.state !== null) failures.push(`hero: was staged (${report.hero.state})`);
if (report.hero.maskCover > 0.05) failures.push(`hero: a mask covered ${report.hero.maskCover}`);
if (report.hero.headlineState !== null)
  failures.push(`hero: the headline was staged (${report.hero.headlineState})`);
if (report.hero.headlineWordOffset !== 0)
  failures.push(`hero: the headline is displaced by ${report.hero.headlineWordOffset}px`);

if (report.parallax.elements === 0) failures.push("parallax: nothing on the page is parallaxed");
if (report.parallax.moved === 0)
  failures.push("parallax: no parallaxed element moved — the deferred GSAP import never arrived");
if (report.parallax.strongest > 0.16)
  failures.push(`parallax: drifted ${report.parallax.strongest} of an element's height, past the cap`);
if (report.parallaxReducedMotion.moved > 0)
  failures.push(
    `reduced motion: ${report.parallaxReducedMotion.moved} elements were still parallaxed`,
  );

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
  console.log(
    `${"".padEnd(15)} headlines staged ${String(run.headlineStagings).padStart(3)}  settled ${String(run.headlineSettlings).padStart(3)}  ` +
      `peak word offset ${run.peakWordOffset}px  wrapped headlines ${run.lineStagger.filter((h) => h.wrappedInto > 1).length}/${run.lineStagger.length}  ` +
      `stagger faults ${run.staggerFaults.length}`,
  );
}
console.log(
  `hero            state=${report.hero.state} maskCover=${report.hero.maskCover} ` +
    `headline=${report.hero.headlineState} headlineOffset=${report.hero.headlineWordOffset}px`,
);
console.log(
  `parallax        ${report.parallax.moved}/${report.parallax.elements} moved, strongest ${report.parallax.strongest} of height  ` +
    `| reduced motion ${report.parallaxReducedMotion.moved}/${report.parallaxReducedMotion.elements} moved`,
);
for (const run of report.noScript)
  console.log(
    `no-js ${run.viewport.padEnd(10)} entrance attributes ${run.enterAttributes}  ` +
      `chapters ${run.chapters.length}  words ${run.chapters.reduce((t, c) => t + c.words, 0)}`,
  );
console.log(`\n${report.verdict.toUpperCase()}  ->  ${OUT}`);
for (const f of failures) console.log(`  - ${f}`);
process.exit(failures.length === 0 ? 0 : 1);
