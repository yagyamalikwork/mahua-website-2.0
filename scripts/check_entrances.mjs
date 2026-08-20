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
/**
 * The chapters `scripts/check_pinned_collage.mjs` is actually **run against**,
 * comma separated. Kept here so the seam between the two rigs is asserted rather
 * than assumed; see `DRIFT_ELEMENTS` below.
 *
 * **This was a single chapter — that rig's own `--chapter` default — until
 * 19 Aug 2026, and a single chapter was the wrong shape.** `04 · Mahua
 * Philosophy` is a second pinned collage since the v2 restructure, so three more
 * `[data-drift]` photographs appeared on the page and this check reported them
 * as measured by nobody. That was correct: `check_pinned_collage.mjs` scopes
 * itself to ONE chapter per run and defaults to `rooted`, so the second chapter
 * genuinely was unmeasured until somebody started running it a second time with
 * `--chapter philosophy`.
 *
 * So what this names is not a property of that rig's source, it is a promise
 * about how it is invoked — every id here must have its own run, and a drift
 * element in a chapter that is not named is a failure. Both promises are in the
 * gate list in `docs/reviews/2026-08-19-home-v2/collage.md`.
 */
const DRIFT_CHAPTERS = flag("drift-chapters", "rooted,philosophy")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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
//     that the import fired at all. The offsets are derived from **each
//     element's own position and height**, and **every** `[data-parallax]` must
//     move — see `checkParallax` for what the two fixed offsets and the "fail if
//     nothing moved" rule they replaced had quietly stopped covering.
//
// `[data-drift]` — the pinned collage's photographs — is deliberately *not*
// measured here; `scripts/check_pinned_collage.mjs` owns it, and the reason is
// on `DRIFT_ELEMENTS`. What this rig does guard is the seam: that rig scopes
// itself to ONE chapter per run, so a drift element in a chapter nobody runs it
// against would be measured by nobody, and the check below names both
// directions — an uncovered chapter, and a covered one that has stopped
// drifting.

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
   * How much of the welcome screen is still painted over the viewport, 0 to 1.
   *
   * **On screen and visible are not the same thing, and this rig assumed they
   * were until 20 Aug 2026.** The welcome curtain is `position: fixed; inset: 0`
   * over the whole page for `WELCOME.hold` and then fades over `WELCOME.fade`,
   * so for that window the first fold is on screen and cannot be seen. That is
   * the whole licence `components/motion/useCurtainReveal.ts` operates under —
   * the hero's headline is staged there, deliberately, because nobody is looking
   * at it — and without this reading `stagedInView` would report the effect
   * working as a flicker.
   *
   * Measured as computed opacity rather than assumed from the clock, because the
   * clock is what the rig would have to model and the opacity is what the
   * visitor actually gets: a curtain that failed to fade reads 1 here forever,
   * which is a different failure that `scripts/check_welcome.mjs` owns.
   */
  const curtain = document.querySelector("[data-welcome]");
  const curtainOpacity = curtain
    ? round(Number(getComputedStyle(curtain).opacity) || 0)
    : 0;
  /**
   * **Still going, not still opaque, and the difference is the whole of it.**
   *
   * An opacity threshold was tried first and is wrong twice over. It is
   * arbitrary — the fade runs on `--enter-ease`, which is heavily front-loaded,
   * so the curtain is at 0.04 three-quarters of the way through and spends its
   * last 150ms in the noise below any number anyone would pick. And it measures
   * the wrong thing: what licenses the hero's staging is not that the curtain is
   * *dark* but that the welcome is *unfinished*, which is a binary fact the
   * browser will simply state.
   *
   * The rise begins at `CURTAIN_LINES.delay` — three-quarters through the fade —
   * so the headline has left `pending` about 160ms before this goes false. The
   * window this opens is therefore bounded by the welcome screen's own length
   * and closes on its own; everything after it is measured with no exemption at
   * all, at every scroll position, for the whole of the page.
   */
  const fade = curtain?.getAnimations?.()[0];
  const curtained = Boolean(fade) && fade.playState !== "finished";

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
    /** How much of the welcome curtain is still painted. See above. */
    curtainOpacity,
    /**
     * Staged *while the visitor can see it* — the flicker, and the only staging
     * that is ever wrong. Everything below the fold is supposed to be staged.
     *
     * **"Can see it" excludes anything staged while the welcome screen is still
     * running**, which is on screen and not yet done with the viewport; see
     * `curtained` above for why that is a play state and not an opacity. The
     * hero's headline is staged from hydration until three-quarters of the way
     * through the fade (`CURTAIN_LINES`), so any threshold inside the fade would
     * report the shipped, intended behaviour as a defect.
     *
     * The moment the welcome has finished this is absolute again, at every
     * scroll position, for the rest of the page — which is the 4 Aug finding
     * intact. That flicker is settled text moving in front of somebody, and it
     * happens on a page with nothing over it.
     */
    stagedInView: curtained
      ? 0
      : [
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
    return { top: Math.round(r.top + scrollY), viewportTop: Math.round(r.top) };
  });

/**
 * Where each parallaxed element sits in the document *ignoring its parallax*,
 * plus enough of a name to say which one failed.
 *
 * The translate GSAP has written is subtracted, so the anchor is the element's
 * layout position and does not depend on when it happens to be read. **This is
 * the only place in this file that looks at a transform, and it is used to
 * choose where to sample — never as evidence that anything moved.** The evidence
 * is `PARALLAX_AT`, two rendered positions.
 *
 * The name is the chapter it lives in, its ordinal within that chapter, and the
 * photograph it wraps, because "1 of 12 moved" is not a finding anybody can act
 * on. A rig that cannot say *which* element died is a rig that will be re-run
 * rather than believed.
 */
const PARALLAX_ANCHORS = () =>
  [...document.querySelectorAll("[data-parallax]")].map((el, index) => {
    const r = el.getBoundingClientRect();
    const t = getComputedStyle(el).transform;
    const ty = t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0;
    const section = el.closest("section");
    const siblings = [...(section?.querySelectorAll("[data-parallax]") ?? [])];
    const img = el.querySelector("img");
    let photograph = null;
    if (img) {
      const raw = img.currentSrc || img.src;
      // Next's optimiser serves `/_next/image?url=...&w=...`; the real filename
      // is inside the query, and it is the only part worth printing.
      const inner = new URL(raw, location.href).searchParams.get("url");
      photograph = decodeURIComponent(inner ?? raw).split("/").pop();
    }
    return {
      index,
      section: section?.id ?? null,
      label: `${section?.id ?? "no-chapter"}[${siblings.indexOf(el)}]${photograph ? ` ${photograph}` : ""}`,
      layoutTop: Math.round(r.top + scrollY - ty),
      height: Math.round(r.height),
    };
  });

/**
 * Where `[data-drift]` elements are — a boundary check, not a movement one.
 *
 * **This rig does not measure drift, and that is deliberate.** The pinned
 * collage is a different mechanism: its photographs are scrubbed against a
 * `position: sticky` scene, so the meaningful reading is a viewport-space
 * position across the pin, not a document-space one either side of it — and it
 * only runs above `(min-width: 1440px) and (min-height: 860px)`, which two of
 * this file's three viewports are not. `scripts/check_pinned_collage.mjs` owns
 * them and measures exactly that.
 *
 * What is checked here is the seam between the two rigs, so nothing can fall
 * down it: that rig scopes itself to one chapter, so a `[data-drift]` element
 * added anywhere else would be measured by nobody. This reports which chapters
 * they are in; the assertion below names any outside the one that is covered.
 */
const DRIFT_ELEMENTS = () =>
  [...document.querySelectorAll("[data-drift]")].map((el) => ({
    section: el.closest("section")?.id ?? null,
    rate: el.getAttribute("data-drift"),
  }));

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
 * How far along its own scrub each element is sampled.
 *
 * `Parallax` runs its tween from `start: "top bottom"` to `end: "bottom top"` —
 * from the scroll at which the element's top reaches the foot of the screen to
 * the scroll at which its bottom leaves the head of it. 0.2 and 0.8 of that
 * range put both readings comfortably on screen at every element's own size,
 * and leave 60% of the travel between them.
 */
const SAMPLE_AT = [0.2, 0.8];

/**
 * The least an element may move between its two offsets and still count.
 *
 * The travel is linear (`EASE.drift` is `none`), so 60% of the range moves the
 * weakest element on the page — strength 0.05 on a ~400px photograph — about
 * 12px. Two pixels is therefore a floor for rounding and Lenis's sub-pixel
 * settle, not a threshold anything real sits near.
 */
const MIN_PARALLAX_SHIFT = 2;

async function scrollTo(page, y, settle = 700) {
  await page.evaluate((to) => window.scrollTo(0, to), y);
  await page.waitForTimeout(settle);
}

/**
 * Does the parallax still move — **every parallaxed element, not merely one?**
 *
 * Two scroll positions per element, derived from that element's own position and
 * height, and the document-space position of every `[data-parallax]` read at
 * each. An element with no parallax sits at the same document position at both.
 * This is the outcome; whether an `import()` resolved is not.
 *
 * **Both halves of that sentence are a repair, made 5 Aug 2026.** This rig used
 * to read two fixed document offsets, 2200 and 3000px, and pass if *anything*
 * moved. Both parts had quietly stopped working:
 *
 *   - the two offsets were chosen when the chapters above them were shorter. As
 *     the page grew they slid off three of the elements they were meant to
 *     cover, and off ten of the twelve that exist now — an offset that is not
 *     inside an element's scrub range reads it as perfectly still, which is
 *     correct and tells you nothing;
 *   - "fail if nothing moved" meant eleven of twelve could be dead and the rig
 *     would still print a pass. It reported `parallax 1/12 moved` for two tasks
 *     and nobody could act on it, which is what a rule like that produces.
 *
 * So the offsets are now per element and the floor is every element. Anything
 * that does not move is named.
 */
async function checkParallax(browser, { reducedMotion = false } = {}) {
  const { context, page } = await open(browser, { width: 1440, height: 900, reducedMotion });

  const viewport = await page.evaluate(() => innerHeight);
  const maxScroll = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollHeight - innerHeight),
  );

  // One pass down the page before anything is measured. `whenNear` does not
  // fetch GSAP until an element is within a screen and ScrollTrigger only
  // scrubs what it has created, so an element that has never been approached
  // would read as "did not move" for a reason that has nothing to do with the
  // effect. The pass also settles every lazy photograph, which is what makes
  // the anchors below the page's final layout rather than an early guess.
  for (let y = 0; y < maxScroll; y += Math.round(viewport * 0.75)) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(140);
  }
  await scrollTo(page, maxScroll);
  await scrollTo(page, 0);

  const drift = await page.evaluate(DRIFT_ELEMENTS);
  const anchors = await page.evaluate(PARALLAX_ANCHORS);

  const planned = anchors.map((a) => {
    const enters = a.layoutTop - viewport;
    const leaves = a.layoutTop + a.height;
    const at = SAMPLE_AT.map((p) =>
      Math.min(maxScroll, Math.max(0, Math.round(enters + p * (leaves - enters)))),
    );
    return { ...a, enters, leaves, at };
  });

  // One monotonic pass down the union of every element's offsets, reading all
  // of them at each stop. Twelve elements do not need twenty-four page loads,
  // and scrolling downward throughout is what a visitor does.
  const stops = [...new Set(planned.flatMap((e) => e.at))].sort((a, b) => a - b);
  const readings = new Map();
  for (const y of stops) {
    await scrollTo(page, y);
    readings.set(y, await page.evaluate(PARALLAX_AT));
  }
  await context.close();

  const measured = planned.map((e) => {
    const [y1, y2] = e.at;
    const first = readings.get(y1)[e.index];
    const second = readings.get(y2)[e.index];
    const shift = Math.abs(second.top - first.top);
    return {
      label: e.label,
      section: e.section,
      layoutTop: e.layoutTop,
      height: e.height,
      /**
       * The scroll positions between which this element scrubs at all — the
       * whole reason two global offsets could not work. Kept in the report so
       * the coverage of any *other* choice of offsets can be re-derived from
       * committed evidence rather than re-argued.
       */
      scrubsBetween: [e.enters, e.leaves],
      at: e.at,
      shift,
      /** As a fraction of the element's own height — spec section 4.3 caps at 0.15. */
      ofHeight: Math.round((shift / Math.max(e.height, 1)) * 1000) / 1000,
      /**
       * Both offsets landed on the same scroll position, so nothing was
       * actually compared. The old rig did this silently for ten elements; here
       * it is a failure in its own right, because a rig that cannot reach an
       * element must say so rather than score it as still.
       */
      unsampled: y1 === y2,
    };
  });

  const moved = measured.filter((m) => !m.unsampled && m.shift >= MIN_PARALLAX_SHIFT);

  return {
    reducedMotion,
    elements: measured.length,
    moved: moved.length,
    sampledAt: SAMPLE_AT,
    strongest: moved.length ? Math.max(...moved.map((m) => m.ofHeight)) : 0,
    weakest: moved.length ? Math.min(...moved.map((m) => m.ofHeight)) : 0,
    /** Named, because "1 of 12" is not something anybody can act on. */
    still: measured.filter((m) => !m.unsampled && m.shift < MIN_PARALLAX_SHIFT),
    unreachable: measured.filter((m) => m.unsampled),
    measured,
    drift,
  };
}

/**
 * The hero: its photograph is the LCP element and must never be tweened, and its
 * headline now rises once, behind the welcome curtain.
 *
 * **Read twice, because one reading cannot tell the two failures apart.** Taken
 * only at load, a settled headline could mean "the reveal is finished" or "the
 * reveal never happened" — and the second is what this page shipped until 20 Aug
 * 2026 and what the client reported. Taken only at the end, a headline stuck
 * behind its mask for two seconds in front of a visitor would pass. So: the
 * first reading is the photograph's guarantee, unchanged; the second is the
 * headline's, and it asserts the reveal both *played* and *finished*.
 */
async function checkHero(browser) {
  const { context, page } = await open(browser, { width: 1440, height: 900 });

  /*
   * The reveal's own window, read off the page's dials rather than restated
   * here. `app/layout.tsx` publishes all three onto <html> out of
   * `lib/motion.ts`, so a rig that reads them cannot disagree with the build it
   * is measuring — the alternative is a second copy of three numbers, which is
   * the shape of drift this project has caught four times.
   *
   * `CURTAIN_LINES.delay` is `hold + fade * 0.75` and is deliberately NOT
   * published as a custom property: no stylesheet needs it. The margin below
   * covers it and then some, which is the right trade for a rig whose job is
   * "was it finished", not "was it finished to the millisecond".
   */
  const dials = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const seconds = (name) => parseFloat(cs.getPropertyValue(name)) || 0;
    return {
      hold: seconds("--welcome-hold"),
      fade: seconds("--welcome-fade"),
      slow: seconds("--lines-slow-duration"),
      now: performance.now() / 1000,
    };
  });

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
      // The headline's state as the curtain is going. Both the attribute and the
      // rendered offset, because either one alone could be the wrong half of the
      // story — and neither is asserted here any more. What this reading is for
      // is the record: `hero-at-load.png` beside it shows what the visitor sees
      // at this instant, and the numbers say why.
      headlineState: headline?.getAttribute("data-lines-enter") ?? null,
      headlineWordOffset:
        inner && word
          ? Math.round(inner.getBoundingClientRect().top - word.getBoundingClientRect().top)
          : null,
      curtainOpacity: Number(
        getComputedStyle(document.querySelector("[data-welcome]") ?? document.body).opacity,
      ),
    };
  });
  await shot(page, "hero-at-load");

  /*
   * Second reading: past the end of the reveal, with margin. The wait is
   * computed from the page's own dials plus a second, and taken from `load`
   * rather than from now, so a slow first paint cannot shorten it.
   */
  /*
   * Two seconds of margin, and one of them is not slack. The reveal runs on the
   * welcome curtain's own animation clock, which starts at first paint — 380ms
   * behind navigation on a local production build and further behind on a cold
   * one — while this wait is taken from `load`. The rest is ordinary headroom.
   */
  const endsAt = dials.hold + dials.fade + dials.slow + 2;
  await page.waitForTimeout(Math.max(0, Math.round((endsAt - dials.now) * 1000)));
  const settled = await page.evaluate(() => {
    const headline = document.querySelector("main > section h1");
    const words = [...(headline?.querySelectorAll("[data-word]") ?? [])];
    const offsets = words.map((word) => {
      const inner = word.querySelector("[data-line-inner]");
      return inner
        ? Math.round(inner.getBoundingClientRect().top - word.getBoundingClientRect().top)
        : 0;
    });
    return {
      headlineState: headline?.getAttribute("data-lines-enter") ?? null,
      // Every word, not the first: a reveal that settled line one and stranded
      // line three is exactly the failure a single sample cannot see.
      worstWordOffset: offsets.length ? Math.max(...offsets.map(Math.abs)) : null,
      words: offsets.length,
      curtainOpacity: Number(
        getComputedStyle(document.querySelector("[data-welcome]") ?? document.body).opacity,
      ),
    };
  });
  await shot(page, "hero-after-reveal");

  await context.close();
  return { ...hero, revealWindowS: Math.round(endsAt * 100) / 100, settled };
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

// The photograph, unchanged and not negotiable: it is the LCP element, and
// Lighthouse stops the timer on the final frame of any animation applied to it.
if (report.hero.state !== null) failures.push(`hero: was staged (${report.hero.state})`);
if (report.hero.maskCover > 0.05) failures.push(`hero: a mask covered ${report.hero.maskCover}`);

/*
 * The headline, which since 20 Aug 2026 rises once as the welcome curtain lifts.
 *
 * **Two assertions, and the first one is the one that would have caught what the
 * client caught.** Until that date this rig asserted the headline was never
 * staged — which was true, and passed, on a page where the effect the client
 * believed he had asked for was simply not happening. "It is configured
 * correctly" and "it moved" are different questions and this file's own header
 * says so; the old check was asking the first about a mechanism that was off.
 *
 * So: it must have played (the attribute reaches `in`), and it must have
 * finished (every word back at zero, not just the first). Requiring `in` rather
 * than accepting `null` is deliberate even though `useCurtainReveal` may
 * legitimately decline on a slow device: this rig runs against a local
 * production build on a developer machine, where hydration is hundreds of
 * milliseconds inside a 1.45s curtain. If it ever declines *here*, something is
 * broken, and a rig that shrugged at that would be the old rig again.
 */
if (report.hero.settled.headlineState !== "in")
  failures.push(
    `hero: the headline's reveal did not play — it was ${report.hero.settled.headlineState ?? "never staged"} ` +
      `at ${report.hero.revealWindowS}s, past the end of its own window`,
  );
if (report.hero.settled.worstWordOffset !== 0)
  failures.push(
    `hero: a word is still ${report.hero.settled.worstWordOffset}px outside its mask at ${report.hero.revealWindowS}s`,
  );

if (report.parallax.elements === 0) failures.push("parallax: nothing on the page is parallaxed");
// **Every element, named.** The old rule was "fail if nothing moved", which one
// surviving element satisfied while eleven could be dead.
for (const e of report.parallax.still)
  failures.push(
    `parallax: ${e.label} did not move — ${e.shift}px between ${e.at[0]} and ${e.at[1]}px of scroll, on a ${e.height}px box`,
  );
for (const e of report.parallax.unreachable)
  failures.push(
    `parallax: ${e.label} could not be sampled at all — both of its offsets clamp to ${e.at[0]}px, so this rig does not cover it`,
  );
if (report.parallax.strongest > 0.16)
  failures.push(`parallax: drifted ${report.parallax.strongest} of an element's height, past the cap`);
for (const e of report.parallaxReducedMotion.measured.filter((m) => m.shift >= MIN_PARALLAX_SHIFT))
  failures.push(`reduced motion: ${e.label} was still parallaxed — it moved ${e.shift}px`);

// The seam with `scripts/check_pinned_collage.mjs`, which measures `[data-drift]`
// and scopes itself to one chapter. A drift element anywhere else is measured by
// nobody, and this is the only place that would notice.
for (const d of report.parallax.drift.filter((d) => !DRIFT_CHAPTERS.includes(d.section)))
  failures.push(
    `drift: a [data-drift="${d.rate}"] element sits in #${d.section}, but check_pinned_collage.mjs is only run against ${DRIFT_CHAPTERS.map((c) => `#${c}`).join(", ")} — nothing measures this one`,
  );
// The other direction, which the single-chapter form could not state: a chapter
// promised a run of its own and no longer carrying a drifting photograph means
// somebody is running an assertion against a composition that has gone.
for (const chapter of DRIFT_CHAPTERS)
  if (!report.parallax.drift.some((d) => d.section === chapter))
    failures.push(
      `drift: #${chapter} is listed as covered by check_pinned_collage.mjs but has no [data-drift] element — that run is measuring nothing`,
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
  `hero            state=${report.hero.state} maskCover=${report.hero.maskCover}\n` +
    `                headline at load: ${report.hero.headlineState} ` +
    `offset=${report.hero.headlineWordOffset}px curtain=${report.hero.curtainOpacity}\n` +
    `                headline at ${report.hero.revealWindowS}s: ${report.hero.settled.headlineState} ` +
    `worstOffset=${report.hero.settled.worstWordOffset}px over ${report.hero.settled.words} words ` +
    `curtain=${report.hero.settled.curtainOpacity}`,
);
console.log(
  `parallax        ${report.parallax.moved}/${report.parallax.elements} moved (every one must), ` +
    `drift ${report.parallax.weakest}-${report.parallax.strongest} of height, cap 0.15  ` +
    `| reduced motion ${report.parallaxReducedMotion.moved}/${report.parallaxReducedMotion.elements} moved`,
);
for (const e of report.parallax.measured)
  console.log(
    `                ${e.unsampled ? "UNREACHABLE" : e.shift >= MIN_PARALLAX_SHIFT ? "moved      " : "STILL      "} ` +
      `${String(e.shift).padStart(4)}px (${String(e.ofHeight).padEnd(5)} of ${String(e.height).padStart(4)}px)  ` +
      `at ${e.at[0]}/${e.at[1]}px  ${e.label}`,
  );
console.log(
  `drift           ${report.parallax.drift.length} [data-drift] elements, all in ` +
    `${[...new Set(report.parallax.drift.map((d) => `#${d.section}`))].join(", ") || "(none)"} ` +
    `— measured by check_pinned_collage.mjs, not here`,
);
for (const run of report.noScript)
  console.log(
    `no-js ${run.viewport.padEnd(10)} entrance attributes ${run.enterAttributes}  ` +
      `chapters ${run.chapters.length}  words ${run.chapters.reduce((t, c) => t + c.words, 0)}`,
  );
console.log(`\n${report.verdict.toUpperCase()}  ->  ${OUT}`);
for (const f of failures) console.log(`  - ${f}`);
process.exit(failures.length === 0 ? 0 : 1);
