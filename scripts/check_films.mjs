// The two films — the tiger closing `04 · Days in the Field`, the potter closing
// `02 · Rooted like the mahua` — in a real browser.
//
// **On `feat/home-v2` and its descendants (including `feat/journal-and-mobile`,
// 26 August 2026), THIS RIG FAILS AND THAT IS CORRECT — do not "fix" it by
// remounting a film or weakening an assertion.** The potter left the home page
// when the seven-chapter restructure was cut (19-20 Aug); the tiger followed on
// 26 Aug, client ruling: *"Remove the tiger from 'The Experience' section, hence
// removing the big gap between the activities and the text for this section."*
// Both films are UNMOUNTED, not deleted — `components/signature/SignatureFilm.tsx`,
// `/media/tiger-film.mp4`, `/media/potter-film.mp4` and this rig are all untouched
// on disk, exactly as the lantern, the hornbill tint and (now) the tiger were
// handled — and `feat/image-sizing` still ships both films and still passes this
// rig unmodified. See `docs/DECISIONS.md` §22 and CLAUDE.md's Tests row. A FAIL
// here on `feat/home-v2`/`feat/journal-and-mobile` means "no film to check", not
// "a film is broken" — there is nothing left on either home-page build for this
// file to find.
//
// Run (with `npx next start -p 3100` already up), on `feat/image-sizing` or `main`:
//   node scripts/check_films.mjs
//
// **These were the only signature interaction on the page with no automated
// check at all.** `npm test` cannot watch a video play; it reported 276 passing
// while nothing whatsoever guarded whether either film ran, stopped, held, or
// showed its white background to the visitor.
//
// Every assertion is about what a visitor gets, not about what was configured —
// `docs/DECISIONS.md` §2, the shape this project has been burned by twenty-three
// times. In particular: `loop` being absent is not the same claim as "it stopped",
// and `mix-blend-mode: darken` being set is not the same claim as "the white
// rectangle is gone". Both of those are read off the running page here.
//
// The contract, from CLAUDE.md non-negotiable #5 and `DECISIONS.md` §9:
//
//   1. Server-rendered still, lazily loaded, and neither film in the first load.
//   2. Exactly one of the still and the film is visible at any moment.
//   3. It plays once when scrolled to.
//   4. It stops at the end and **holds the last frame** — it does not loop, and
//      it does not rewind.
//   5. **The white ground is erased.** Sampled as pixels, against the cream the
//      chapter actually sits on — **at six widths, not one** (see below).
//   5b. **Nothing on the page covers the film's box.** A separate question from
//      the one above and a separate assertion, because a corner sample answers
//      "is the ground cream *here*" and says nothing about a card lying over the
//      middle of the drawing.
//   6. A deliberate hover replays it.
//   7. Hover is ignored **while it is still playing**.
//   8. The pointer must **leave and return** — a parked cursor may not replay it
//      a second time. This is the guard that stops hover becoming a loop by
//      another name, and it is the one no static reading can see.
//   9. Reduced motion: the still, and nothing ever plays.
//  10. No JavaScript: the still, and no broken box.
//
// ─────────────────────────────────────────────────────────────────────────────
// **Everything above except 5 and 5b is measured at 1440x900 only, and that is
// how this rig missed a real defect for a day.** 16 Aug 2026: the coverflow's
// widened card covers the tiger below ~1430px of viewport — headless at 1280 —
// and the conflict was already true below ~1090px at the card's previous width.
// No instrument on this project ever looked, because this file's one viewport is
// the one width at which the overlap does not happen
// (`docs/reviews/2026-08-16-coverflow/density-sweep.md` §9).
//
// Worse, when the overlap finally *did* reach 1440 the message this rig printed
// was a false diagnosis — "the white ground is showing as a rectangle" — because
// a corner sample that is 131 levels off cream has exactly two explanations and
// this rig only knew one of them. The sampled pixel was a photograph.
//
// So 5 and 5b sweep `GROUND_SHAPES` and are two assertions, not one:
//
//   * **5b, the geometry**, asked at a dozen scroll positions per width while the
//     box is on screen: does any element that actually paints anything overlap
//     the film's box? This is the one that catches a card over the tiger's head
//     while all four corners still sit on cream.
//   * **5, the pixels**, sampled with the box fully in view. Its message now
//     names the covering element when there is one, says "white" when the corner
//     is near white, and says neither when it is neither — three different
//     repairs that read identically before.
//
// What a broken build scores, written down before the first run:
//
//   * The card covering the tiger (the build this was written against): 5b fails
//     at 390, 1024, 1280 and 1366 with `li.coverflow-card` named as the
//     occluder, and 5 fails wherever a *corner* lands on the card.
//   * `mix-blend-mode: darken` removed: 5 fails at every width with the corner
//     near white and 5b clean — the pair separates the two defects.
//   * The film moved inside a stacking context: same signature as the line above.

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
const OUT = flag("out", "docs/reviews/2026-08-08-films/films.json");
const SHOTS = path.dirname(OUT);

/** Every film on the page, and the chapter each one closes. */
/*
 * **The potter left this list on 19 Aug 2026, on `feat/home-v2` only.**
 *
 * The client's restructure removes the potter film's mount from `03 · Rooted
 * Like The Mahua` — *"first the animated potter needs to be removed"*. The film,
 * its poster, `SignatureFilm` and every assertion below are untouched and still
 * work; `feat/image-sizing` keeps it mounted and this rig green on both films.
 *
 * It is commented rather than deleted for one reason: **this rig crashed instead
 * of failing** when the element vanished, throwing on a null rather than
 * reporting an absent film, and a gate that dies is a gate nobody can read. If
 * the potter returns to any chapter, restore the line — do not rewrite the arm.
 */
const FILMS = [
  // { chapter: "rooted", name: "potter" },
  { chapter: "field-days", name: "tiger" },
];

const failures = [];
const note = (film, message) => failures.push(`${film}: ${message}`);

/** How far a channel may drift from the chapter's own cream before it reads as a rectangle. */
const CREAM_TOLERANCE = 6;

/** How near 255 a corner has to read before "the white ground is back" is the honest diagnosis. */
const WHITE_TOLERANCE = 14;

/**
 * The shapes assertions 5 and 5b are asked at.
 *
 * **Continuous-ish rather than the project's four fixed widths**, because the
 * defect this list exists for lives between them: the overlap begins at whatever
 * viewport makes `container/2 − cardWidth/2` smaller than the film's own box, and
 * that is a threshold nobody can put on a round number in advance. 1366x768 is in
 * the list for a second reason — it is a `short:` viewport (`max-height: 800px`),
 * which is where this project has already shipped two geometry defects
 * (`DECISIONS.md` §2 #44-45).
 */
const GROUND_SHAPES = [
  [390, 844],
  [1024, 900],
  [1280, 900],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];

/** How many scroll positions the box is checked for overlap at, per width per film. */
const SWEEP_SAMPLES = 12;
/** An overlap smaller than this is sub-pixel rounding at a shared edge, not a card on a tiger. */
const OVERLAP_TOLERANCE_PX = 4;

/**
 * Everything that paints, and overlaps the film's box, right now.
 *
 * **Geometry rather than `elementFromPoint`, deliberately.** Hit-testing cannot
 * answer this question here: the coverflow's stage is `pointer-events: none` so
 * that the tiger stays hoverable through it, and `elementFromPoint` /
 * `elementsFromPoint` do not return such elements at all — the same blindness
 * that made `measure_density.mjs` score the lantern as bare paper until 7 Aug
 * 2026. A card would lie over the tiger and every hit test would say the tiger
 * was reachable, which it is.
 *
 * "Paints" is the filter that keeps this from reporting the section, the
 * container and the stage: an element counts only if it is an `<img>`/`<video>`/
 * `<picture>`/`<canvas>`/`<svg>`, or carries a background image, or a background
 * colour with real alpha. Ancestors and descendants of the frame are skipped
 * outright — an ancestor always overlaps, and a descendant is the drawing.
 */
const OVERLAP = ({ chapter, tolerance }) => {
  const frame = document.querySelector(`#${chapter} [data-signature-film-frame]`);
  if (!frame) return null;
  const r = frame.getBoundingClientRect();
  const vis = {
    left: Math.max(r.left, 0),
    top: Math.max(r.top, 0),
    right: Math.min(r.right, window.innerWidth),
    bottom: Math.min(r.bottom, window.innerHeight),
  };
  const onScreen = vis.right - vis.left > 1 && vis.bottom - vis.top > 1;
  if (!onScreen) return { onScreen: false, scrollY: Math.round(window.scrollY), occluders: [] };

  const paints = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) return false;
    if (/^(IMG|VIDEO|PICTURE|CANVAS|SVG)$/.test(el.tagName)) return true;
    if (cs.backgroundImage !== "none") return true;
    const parts = cs.backgroundColor.match(/[\d.]+/g);
    if (!parts) return false;
    return (parts.length > 3 ? Number(parts[3]) : 1) > 0.01;
  };

  const name = (el) => {
    const cls =
      typeof el.className === "string" && el.className.trim()
        ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
        : "";
    return `${el.tagName.toLowerCase()}${cls}`;
  };

  const occluders = [];
  for (const el of document.querySelectorAll(`#${chapter} *`)) {
    if (el === frame || frame.contains(el) || el.contains(frame)) continue;
    if (!paints(el)) continue;
    const b = el.getBoundingClientRect();
    const w = Math.min(b.right, vis.right) - Math.max(b.left, vis.left);
    const h = Math.min(b.bottom, vis.bottom) - Math.max(b.top, vis.top);
    if (w <= tolerance || h <= tolerance) continue;
    occluders.push({
      el: name(el),
      overlap: { w: Math.round(w), h: Math.round(h), area: Math.round(w * h) },
    });
  }
  occluders.sort((a, b) => b.overlap.area - a.overlap.area);

  return {
    onScreen: true,
    scrollY: Math.round(window.scrollY),
    box: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
    visibleShare: Number(
      (((vis.right - vis.left) * (vis.bottom - vis.top)) / (r.width * r.height)).toFixed(3),
    ),
    occluders: occluders.slice(0, 4),
  };
};

const FRAME = (chapter) => {
  const frame = document.querySelector(`#${chapter} [data-signature-film-frame]`);
  if (!frame) return null;
  const still = frame.querySelector("img");
  const film = frame.querySelector("video");
  const box = frame.getBoundingClientRect();
  const vis = (el) => getComputedStyle(el).visibility !== "hidden";
  return {
    stillVisible: vis(still),
    filmVisible: vis(film),
    stillLazy: still.getAttribute("loading") === "lazy",
    hasPosterAttribute: film.hasAttribute("poster"),
    preload: film.getAttribute("preload"),
    ariaHidden: film.getAttribute("aria-hidden"),
    blend: {
      still: getComputedStyle(still).mixBlendMode,
      film: getComputedStyle(film).mixBlendMode,
    },
    currentTime: Number(film.currentTime.toFixed(2)),
    duration: Number.isFinite(film.duration) ? Number(film.duration.toFixed(2)) : null,
    paused: film.paused,
    ended: film.ended,
    box: {
      x: Math.round(box.left),
      y: Math.round(box.top),
      w: Math.round(box.width),
      h: Math.round(box.height),
    },
    onScreen: box.bottom > 0 && box.top < window.innerHeight,
  };
};

/**
 * Scroll to `y` and wait for the page to actually stop there.
 *
 * **Lenis is running on this page**, so `window.scrollTo` sets a target the page
 * then interpolates toward — a fixed wait afterwards reads whatever position it
 * happens to have reached, which on a cold file cache or a loaded machine is not
 * the one that was asked for. Every other rig on this project polls
 * (`check_card_stack.mjs` solved it first); this file waited a flat 700ms, which
 * is long enough on a warm run and is not a promise on any run.
 *
 * Added 19 Aug 2026. It is the difference between a rig that measures the page
 * and one that measures the page most of the time, which is the worse of the two
 * because it fails in the direction of a green report.
 */
async function scrollToAndSettle(page, y) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  let prev = null;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(30);
    const cur = await page.evaluate(() => window.scrollY);
    if (prev !== null && Math.abs(cur - prev) < 0.5) return cur;
    prev = cur;
  }
  return prev;
}

/** Scroll the film into the middle of the screen and let it start. */
async function reveal(page, chapter) {
  await scrollToAndSettle(page, 0);
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  const top = await page.evaluate((id) => {
    const el = document.querySelector(`#${id} [data-signature-film-frame]`);
    // **A named failure rather than a TypeError on `null`, 19 Aug 2026.** When
    // the client's restructure unmounted the potter, this line threw
    // `Cannot read properties of null` from inside a `for` loop with no film
    // name attached, and the entry was commented out to get the rig running —
    // which is a rig going quiet about a page it can no longer describe. A film
    // listed in `FILMS` and absent from the page is a real failure and now says
    // so, with the chapters it CAN see, which is the sentence that tells a
    // reader whether the page or the list is wrong.
    if (!el) {
      const seen = [...document.querySelectorAll("[data-signature-film-frame]")]
        .map((f) => f.closest("section")?.id ?? "(no section)")
        .join(", ");
      throw new Error(
        `no film in #${id}. Films on this page: ${seen || "none at all"}. ` +
          `Either the page lost one, or FILMS names a chapter this branch does not have.`,
      );
    }
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  }, chapter);
  await scrollToAndSettle(page, top - 900 * 0.35);
  // On top of the settle, not instead of it: the entrance reveal and the
  // parallax finish after the scroll does, and what is measured is the frame a
  // visitor reads.
  await page.waitForTimeout(700);
}

/** Park the pointer well away from the film, so no hover is in effect. */
const AWAY = { x: 4, y: 4 };
async function hover(page, chapter, on) {
  if (!on) {
    await page.mouse.move(AWAY.x, AWAY.y);
    await page.waitForTimeout(160);
    return;
  }
  const box = await page.evaluate((id) => {
    const r = document.querySelector(`#${id} [data-signature-film-frame]`).getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, chapter);
  await page.mouse.move(box.x, box.y);
  await page.waitForTimeout(160);
}

/**
 * The cream the film actually has to disappear into.
 *
 * **It read the chapter's own `background-color` and nothing else until 19 Aug
 * 2026, and that is only right for a chapter that paints one.** `ChapterSurface`
 * does (`bg-[color:var(--bg)]`), so the tiger's chapter answered correctly and
 * the fault stayed invisible; `PinnedCollage` renders its own `<section>` and
 * paints nothing, so `#rooted` returned **`rgba(0,0,0,0)`** — which this then
 * parsed to `{0, 0, 0}` and compared every corner of the film against BLACK.
 * A film blending perfectly into cream would have read a drift of ~230 levels
 * and been reported as a broken blend; the arm that would have said so was
 * commented out, so nobody saw it.
 *
 * `mix-blend-mode` blends against whatever is painted behind the element, which
 * is the nearest ancestor with a non-transparent background — not the section
 * the film happens to be in. So this walks up until it finds one, and returns
 * which element it came from, because "the cream came from `<body>`" is a real
 * finding about a chapter that was supposed to have its own.
 *
 * It throws rather than guessing if nothing in the chain paints. There is no
 * honest default: a tolerance measured against an invented colour is the exact
 * shape of a confident wrong number this project catalogues.
 */
const chapterCream = (page, chapter) =>
  page.evaluate((id) => {
    let el = document.getElementById(id);
    if (!el) throw new Error(`no #${id} on this page — nothing to blend against`);
    for (; el; el = el.parentElement) {
      const raw = getComputedStyle(el).backgroundColor;
      const n = raw.match(/[\d.]+/g)?.map(Number) ?? [];
      // `rgba(r, g, b, a)` with a === 0 is transparent and paints nothing;
      // `rgb(r, g, b)` has no alpha and always paints.
      const alpha = n.length > 3 ? n[3] : 1;
      if (n.length >= 3 && alpha > 0) {
        return { r: n[0], g: n[1], b: n[2], from: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") };
      }
    }
    throw new Error(
      `nothing from #${id} up to the root paints a background — there is no cream for the film to blend into`,
    );
  }, chapter);

/**
 * The four corners of the film's box, as pixels, against that cream.
 *
 * Pixels rather than the declared blend mode: the artwork is drawn on white and
 * only `mix-blend-mode: darken` against a lighter-than-cream ground makes the
 * rectangle disappear. If that stops working the page shows a white box and
 * every other assertion in this file still passes.
 */
async function ground(page, chapter, box, shotPath) {
  const cream = await chapterCream(page, chapter);
  await page.screenshot({ path: shotPath, clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
  const { data, info } = await sharp(shotPath).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };
  // The artwork occupies the middle of its frame, so every one of these is
  // background in the source file.
  const corners = [
    px(2, 2),
    px(info.width - 3, 2),
    px(2, info.height - 3),
    px(info.width - 3, info.height - 3),
  ];
  const drift = Math.max(
    ...corners.flatMap((c) => [
      Math.abs(c.r - cream.r),
      Math.abs(c.g - cream.g),
      Math.abs(c.b - cream.b),
    ]),
  );
  return { chapterCream: cream, corners, worstChannelDriftPx: drift };
}

/**
 * What a drifting corner actually means — three readings, three repairs.
 *
 * The rig said "the white ground is showing as a rectangle" for a year and it was
 * the only sentence it knew. On 16 Aug 2026 it printed that sentence about a
 * corner reading `{102,104,75}`, which is a photograph: the coverflow's card had
 * grown wide enough to reach under the film's box. A reader who trusted the
 * message would have gone looking at `mix-blend-mode`, which was fine.
 */
function groundVerdict(g, occluders) {
  if (g.worstChannelDriftPx <= CREAM_TOLERANCE) return null;
  const c = g.corners.find(
    (x) =>
      Math.max(
        Math.abs(x.r - g.chapterCream.r),
        Math.abs(x.g - g.chapterCream.g),
        Math.abs(x.b - g.chapterCream.b),
      ) > CREAM_TOLERANCE,
  );
  const near = `${JSON.stringify(c)} against the chapter's cream ${JSON.stringify(g.chapterCream)} — ` +
    `${g.worstChannelDriftPx} levels out`;
  const white = c && Math.min(c.r, c.g, c.b) >= 255 - WHITE_TOLERANCE;
  if (white) {
    return `a corner of the film's box is ${near}, and it is WHITE — the ground is showing as a ` +
      "rectangle, so the blend against the chapter's cream has stopped working (a stacking context " +
      "between the film and that cream is what breaks it — `DECISIONS.md` §14)";
  }
  if (occluders && occluders.length > 0) {
    return `a corner of the film's box is ${near}, and it is NOT white — ${occluders[0].el} is ` +
      `lying over the box (${occluders[0].overlap.w}x${occluders[0].overlap.h}px of it), so what this ` +
      "sample read is that element, not the film's own ground. The blend is not the defect; the " +
      "overlap is";
  }
  return `a corner of the film's box is ${near}, and it is neither white nor covered by anything ` +
    "this rig can see — the chapter's own background may have changed under it";
}

const t = async (page, chapter) =>
  page.evaluate((id) => {
    const v = document.querySelector(`#${id} [data-signature-film-frame] video`);
    return Number(v.currentTime.toFixed(2));
  }, chapter);

const browser = await chromium.launch();
await mkdir(SHOTS, { recursive: true });
const report = { measuredAt: new Date().toISOString(), url: URL, films: [] };

// ------------------------------------------ neither film is in the first load

const firstLoad = await (async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const seen = [];
  page.on("request", (r) => seen.push(r.url()));
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await context.close();
  const stills = seen.filter((u) => /film-poster/.test(u));
  const videos = seen.filter((u) => /film\.mp4/.test(u));
  return { stillsFetched: stills.length, videosFetched: videos.length };
})();

if (firstLoad.stillsFetched > 0) {
  failures.push(
    `${firstLoad.stillsFetched} film still(s) were fetched before anything scrolled — a \`poster\` ` +
      "attribute is fetched immediately however far down the page it sits, and reintroducing one costs " +
      "103 KB of the first screen and 537 ms of the hero (DECISIONS.md §3)",
  );
}
if (firstLoad.videosFetched > 0) {
  failures.push(`${firstLoad.videosFetched} film(s) were downloaded before anything scrolled`);
}

// ---------------------------------------------------------- each film in turn

for (const { chapter, name } of FILMS) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1000);

  const record = { chapter, name };

  // --- Before it is reached: the still stands in for the film. --------------
  const atRest = await page.evaluate(FRAME, chapter);
  if (!atRest) {
    note(name, `no film frame inside #${chapter}`);
    await context.close();
    continue;
  }
  record.beforeReached = atRest;
  if (!atRest.stillLazy) note(name, "the still is not `loading=\"lazy\"`");
  if (atRest.hasPosterAttribute) {
    note(name, "the film carries a `poster` attribute again — see the first-load note above");
  }
  if (atRest.preload !== "none") note(name, `preload is "${atRest.preload}", not "none"`);
  if (atRest.ariaHidden !== "true") note(name, "the film is not aria-hidden");
  if (atRest.blend.still !== "darken" || atRest.blend.film !== "darken") {
    note(name, `blend is ${atRest.blend.still}/${atRest.blend.film}, not darken/darken`);
  }
  if (!atRest.stillVisible || atRest.filmVisible) {
    note(
      name,
      `before it is reached the still is ${atRest.stillVisible ? "visible" : "HIDDEN"} and the film is ` +
        `${atRest.filmVisible ? "VISIBLE" : "hidden"} — exactly one of the two must show, and before ` +
        "the film has frames it must be the still",
    );
  }

  // --- It plays once when scrolled to. --------------------------------------
  await reveal(page, chapter);
  await page.waitForTimeout(1200);
  const early = await page.evaluate(FRAME, chapter);
  record.whilePlaying = early;

  if (early.currentTime <= 0.1 || early.paused) {
    note(
      name,
      `it did not start on scroll — t=${early.currentTime}, paused=${early.paused}. The observer, the ` +
        "autoplay permission, or the source itself",
    );
  }
  if (early.stillVisible || !early.filmVisible) {
    note(
      name,
      `while playing the still is ${early.stillVisible ? "VISIBLE" : "hidden"} and the film is ` +
        `${early.filmVisible ? "visible" : "HIDDEN"} — a still left under a playing film ghosts through ` +
        "it, because both blend with darken",
    );
  }

  // --- Hover is ignored while it is still playing. --------------------------
  const beforeHover = await t(page, chapter);
  await hover(page, chapter, true);
  await page.waitForTimeout(400);
  const afterHover = await t(page, chapter);
  record.hoverWhilePlaying = { beforeHover, afterHover };
  if (afterHover < beforeHover) {
    note(
      name,
      `hovering mid-play rewound it from ${beforeHover}s to ${afterHover}s — hover must be ignored until ` +
        "it has finished, or a cursor resting on it restarts it forever",
    );
  }
  await hover(page, chapter, false);

  // --- It stops at the end and holds the last frame. ------------------------
  // The clip is ten seconds; wait it out from wherever it has reached.
  await page.waitForTimeout(11000);
  const held = [];
  for (let i = 0; i < 3; i++) {
    held.push(await t(page, chapter));
    await page.waitForTimeout(700);
  }
  const ended = await page.evaluate(FRAME, chapter);
  record.afterItEnds = { ...ended, sampledTimes: held };

  if (!ended.paused) {
    note(name, `it is still running ${held.join(" -> ")}s after its own duration — it is looping`);
  }
  if (ended.duration && Math.abs(held[0] - ended.duration) > 0.6) {
    note(
      name,
      `it settled at ${held[0]}s of ${ended.duration}s rather than holding its last frame — a rewind to ` +
        "the first frame reads as the animation being cut off",
    );
  }
  if (new Set(held.map((n) => n.toFixed(1))).size > 1) {
    note(name, `its position kept changing after it ended: ${held.join(" -> ")}s`);
  }

  // --- The white ground is erased. ------------------------------------------
  // See `ground` and `groundVerdict`. The overlap probe runs first so a failing
  // corner can be told from a covered one rather than guessed at.
  const overlapHere = await page.evaluate(OVERLAP, {
    chapter,
    tolerance: OVERLAP_TOLERANCE_PX,
  });
  const g = await ground(page, chapter, ended.box, path.join(SHOTS, `film-${name}.png`));
  record.ground = { ...g, overlap: overlapHere };
  const verdict = groundVerdict(g, overlapHere?.occluders);
  if (verdict) note(name, verdict);

  // --- A deliberate hover replays it. ---------------------------------------
  await hover(page, chapter, true);
  await page.waitForTimeout(700);
  const replayed = await t(page, chapter);
  record.hoverReplay = { from: held[held.length - 1], to: replayed };
  if (replayed >= held[held.length - 1] - 0.2) {
    note(
      name,
      `hovering a finished film left it at ${replayed}s rather than replaying it from the start — the ` +
        "client asked for this explicitly on 6 Aug",
    );
  }

  // --- ...but only once, until the pointer leaves and returns. ---------------
  // The pointer stays put. When this replay ends the film must stay ended: a
  // parked cursor may not restart it, which is the whole difference between an
  // answer and a loop.
  //
  // **Know what this does and does not prove.** Run on 8 Aug 2026 against a build
  // with the `armed` ref deleted from `SignatureFilm`, it passed unchanged —
  // 10s -> 10s on both films. Chromium does not re-fire `pointerenter` under a
  // stationary pointer, so `armed` is never reached and the `finished` guard
  // alone carries this case. `armed` is defence for the browsers that *do* fire
  // an enter when an element becomes visible beneath a resting cursor, and this
  // rig cannot reach that. So: this is a real assertion about what a visitor
  // gets, and it is **not** evidence that both guards are present. Do not delete
  // `armed` on the strength of this line being green.
  await page.waitForTimeout(11500);
  const parked = await t(page, chapter);
  const parkedState = await page.evaluate(FRAME, chapter);
  await page.waitForTimeout(1500);
  const parkedAgain = await t(page, chapter);
  record.pointerParked = { paused: parkedState.paused, first: parked, second: parkedAgain };
  if (!parkedState.paused || Math.abs(parkedAgain - parked) > 0.2) {
    note(
      name,
      `with the pointer resting on it the film replayed again by itself (${parked}s -> ${parkedAgain}s, ` +
        `paused=${parkedState.paused}) — hover has become a loop by another name`,
    );
  }

  // --- Leaving and returning arms it again. ---------------------------------
  await hover(page, chapter, false);
  await hover(page, chapter, true);
  await page.waitForTimeout(700);
  const rearmed = await t(page, chapter);
  record.leaveAndReturn = { from: parkedAgain, to: rearmed };
  if (rearmed >= parkedAgain - 0.2) {
    note(
      name,
      `after the pointer left and came back the film stayed at ${rearmed}s — it has armed itself off ` +
        "permanently and can never be replayed again",
    );
  }

  report.films.push(record);
  await context.close();
}

// ------------------- 5 and 5b: the ground, and the clearance, at six widths --

/**
 * Scroll and wait for the page to actually stop.
 *
 * Lenis interpolates toward its target, so a fixed wait after `scrollTo` reads a
 * position the page has not reached. `check_card_stack.mjs` solved this first,
 * and every rig on this project carries the same routine; this is it, trimmed.
 * (`check_coverflow.mjs` did too, until it was retired on 19 Aug 2026 with the
 * carousel it measured; `check_experience_strip.mjs` carries it now.)
 */
async function settle(page, y) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  let prev = null;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(30);
    const cur = await page.evaluate(() => window.scrollY);
    if (prev !== null && Math.abs(cur - prev) < 0.5) return cur;
    prev = cur;
  }
  return prev;
}

const widthShots = path.join(SHOTS, "widths");
await mkdir(widthShots, { recursive: true });
report.groundSweep = [];

for (const [width, height] of GROUND_SHAPES) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  // Settle the lazily-loaded stills and fire the entrance observers, so the
  // first real sample is not catching mid-load layout.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });

  for (const { chapter, name } of FILMS) {
    const label = `${name}@${width}x${height}`;
    const geom = await page.evaluate((id) => {
      const el = document.querySelector(`#${id} [data-signature-film-frame]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top + window.scrollY),
        h: Math.round(r.height),
        w: Math.round(r.width),
      };
    }, chapter);
    if (!geom) {
      failures.push(`${label}: no film frame inside #${chapter}`);
      continue;
    }

    // From "box bottom resting on the viewport's bottom edge" to "box top on the
    // viewport's top edge" — every position at which a visitor can see the box.
    const from = geom.top + geom.h - height;
    const to = geom.top;
    const swept = [];
    for (let k = 0; k < SWEEP_SAMPLES; k++) {
      const y = Math.max(0, Math.round(from + ((to - from) * k) / (SWEEP_SAMPLES - 1)));
      await settle(page, y);
      const o = await page.evaluate(OVERLAP, { chapter, tolerance: OVERLAP_TOLERANCE_PX });
      if (o) swept.push(o);
    }

    const covered = swept.filter((s) => s.onScreen && s.occluders.length > 0);
    const worst = covered.sort(
      (a, b) => b.occluders[0].overlap.area - a.occluders[0].overlap.area,
    )[0];

    // The pixels, from a position where the whole box is in view — clipping a
    // screenshot to a partly off-screen box measures the viewport's edge.
    const whole = swept.filter((s) => s.onScreen && s.visibleShare >= 0.999);
    const at = whole[Math.floor(whole.length / 2)] ?? swept.find((s) => s.onScreen);
    let g = null;
    if (at) {
      await settle(page, at.scrollY);
      const box = await page.evaluate((id) => {
        const r = document.querySelector(`#${id} [data-signature-film-frame]`).getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
      }, chapter);
      const clipped =
        box.x >= 0 && box.y >= 0 && box.x + box.w <= width && box.y + box.h <= height;
      if (clipped) {
        g = await ground(page, chapter, box, path.join(widthShots, `${name}-${width}x${height}.png`));
      }
    }

    const here = await page.evaluate(OVERLAP, { chapter, tolerance: OVERLAP_TOLERANCE_PX });
    const verdict = g ? groundVerdict(g, here?.occluders) : null;
    if (verdict) failures.push(`${label}: ${verdict}`);
    if (worst) {
      failures.push(
        `${label}: ${worst.occluders.map((o) => o.el).join(", ")} overlap${
          worst.occluders.length === 1 ? "s" : ""
        } the film's box at scrollY=${worst.scrollY} — worst ` +
          `${worst.occluders[0].overlap.w}x${worst.occluders[0].overlap.h}px of a ${geom.w}x${geom.h}px ` +
          "drawing, on " +
          `${covered.length} of ${swept.length} sampled positions. The film has to sit clear of ` +
          "everything else in its chapter: it cannot be raised above them, because a stacking " +
          "context between it and the chapter's cream is exactly what puts its white ground back",
      );
    }

    report.groundSweep.push({
      film: name,
      width,
      height,
      box: geom,
      sampled: swept.length,
      coveredAt: covered.length,
      worstOverlap: worst ? { scrollY: worst.scrollY, occluders: worst.occluders } : null,
      ground: g,
    });
    console.log(
      `${label.padEnd(20)} covered ${covered.length}/${swept.length} positions` +
        (worst ? ` (worst ${worst.occluders[0].el} ${worst.occluders[0].overlap.w}x${worst.occluders[0].overlap.h})` : "") +
        (g ? ` | corners within ${g.worstChannelDriftPx} of cream` : " | box never wholly in view"),
    );
  }

  await context.close();
}

// ------------------------------------------------- reduced motion, and no-JS

async function stillnessRun(label, options) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  const out = [];
  for (const { chapter, name } of FILMS) {
    if (options.javaScriptEnabled === false) {
      const present = (await page.locator(`#${chapter} [data-signature-film-frame] img`).count()) > 0;
      if (!present) {
        failures.push(`${label}: ${name} — no still at all. It must be server-rendered, not scripted in`);
      }
      out.push({ name, stillPresent: present });
      continue;
    }
    await reveal(page, chapter);
    await page.waitForTimeout(1500);
    await hover(page, chapter, true);
    await page.waitForTimeout(600);
    const state = await page.evaluate(FRAME, chapter);
    out.push({ name, ...state });
    if (state.currentTime > 0.1 || !state.paused) {
      failures.push(
        `${label}: ${name} played anyway — t=${state.currentTime}, paused=${state.paused}`,
      );
    }
    if (!state.stillVisible) {
      failures.push(`${label}: ${name} — the still is hidden, so the chapter has an empty box`);
    }
    await hover(page, chapter, false);
  }
  await context.close();
  return out;
}

report.reducedMotion = await stillnessRun("reduced motion", { reducedMotion: "reduce" });
report.noJs = await stillnessRun("no JavaScript", { javaScriptEnabled: false });

await browser.close();

report.firstLoad = firstLoad;
report.failures = failures;
report.verdict = failures.length === 0 ? "pass" : "fail";
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  `first load: ${firstLoad.stillsFetched} stills, ${firstLoad.videosFetched} films fetched before scrolling`,
);
for (const f of report.films) {
  console.log(
    `${f.name.padEnd(7)} plays ${f.whilePlaying?.currentTime}s -> holds ${f.afterItEnds?.sampledTimes.join("/")}s ` +
      `of ${f.afterItEnds?.duration}s`,
  );
  console.log(
    `        hover mid-play ${f.hoverWhilePlaying?.beforeHover}->${f.hoverWhilePlaying?.afterHover}s | ` +
      `replay ${f.hoverReplay?.from}->${f.hoverReplay?.to}s | ` +
      `parked ${f.pointerParked?.first}->${f.pointerParked?.second}s | ` +
      `re-entered ${f.leaveAndReturn?.from}->${f.leaveAndReturn?.to}s`,
  );
  console.log(
    `        ground: corners within ${f.ground?.worstChannelDriftPx} levels of the chapter's cream ` +
      `(tolerance ${CREAM_TOLERANCE})`,
  );
}
console.log(
  `reduced motion: ${report.reducedMotion.map((r) => `${r.name} t=${r.currentTime}`).join(", ")} | ` +
    `no-JS stills present: ${report.noJs.map((r) => r.stillPresent).join(", ")}`,
);
console.log(`\n${report.verdict.toUpperCase()}`);
for (const f of failures) console.log(`  - ${f}`);
console.log(`\n-> ${OUT}`);

process.exitCode = failures.length === 0 ? 0 : 1;
