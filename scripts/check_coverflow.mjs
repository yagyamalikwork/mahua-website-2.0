// `04 · Days in the Field` as a coverflow — `components/sections/Coverflow.tsx`
// and `app/globals.css`'s `.coverflow*` block — in a real browser.
//
// Run (with `npx next start -p 3110` already up):
//   node scripts/check_coverflow.mjs --port 3110
//
// Flags: `--port`, `--url`, `--path` (the negative control — a route with no
// coverflow), `--out`, `--sweep-step` (the committed default is 20px; coarsening
// it is for iteration, and a run that reports a step other than 20 is not the
// run this file's assertions were written for).
//
// Everything below is read off the rendered page with `getBoundingClientRect()`,
// `getComputedStyle()` and `document.elementFromPoint()` — never off
// `app/globals.css` or `lib/motion.ts`. A check that reads back the CSS it was
// given proves nothing (`docs/DECISIONS.md` §2). The two places a dial's own
// value IS read back (`--coverflow-side-veil`, `--coverflow-side-scale`) each
// carry an absolute floor beside them for exactly that reason: with the dial at
// zero, a purely relative assertion passes against a build with the effect
// switched off.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE NINE ASSERTIONS
//
// Watched failing, one deliberate break each, in
// `docs/reviews/2026-08-16-coverflow/rig-failures.md`. Break it in the way the
// assertion is written to catch — a rig that passes against a build broken
// somewhere else has proved nothing.
//
//   1. **The stage holds.** Between the scroll offset where the stage locks and
//      the one where it lets go — both computed from the track's own measured
//      box, not from the CSS — the stage's top edge stays within 2px of the
//      header's height. Break: remove `position: sticky`.
//
//   2. **One card is in charge, and it advances.** At every sampled position
//      inside the pin, AT MOST ONE card is within 8px of the stage's horizontal
//      centre; across the pin the card in charge advances 0 → 7 monotonically,
//      hitting every index; and every card is bisected to its own centred
//      moment and must land inside 8px of centre. Break: delete the per-card
//      `animation-range` so every card shares the full range.
//
//      **"At most one", not "exactly one", and the difference is a correction to
//      this rig's own brief.** No continuously-moving carousel can have a card
//      exactly centred at every scroll position: between two centred moments the
//      outgoing card has left the middle and the incoming one has not arrived,
//      and the only ways out are a plateau at centre long enough to tile the pin
//      (which puts TWO cards at dead centre at the crossover) or a jump. The
//      invariant that IS true at every position, and the one a visitor cares
//      about, is assertion 4's.
//
//   3. **A neighbour recedes by veil, and is never faded.** At each card's own
//      centred moment its existing neighbours are on screen, scaled measurably
//      below 1, and carrying real `.coverflow-veil` opacity; the centred card
//      itself is at full scale and unveiled. And at EVERY pinned sample, no
//      card's own computed `opacity` is anything but 1. Break two ways: set
//      `COVERFLOW.sideVeil` to 0 (nothing recedes), and move the recede back
//      onto the card's `opacity` (the plan's correction C regression — the two
//      look identical to the eye, and one of them fades cream type against the
//      photograph beneath it).
//
//   4. **Exactly one card's arrows are hit-testable**, at every pinned sample,
//      and it is the card nearest the centre. `document.elementFromPoint` at
//      each arrow's own centre must return that arrow or something inside it.
//      Break: remove the keyframed `pointer-events`, and twelve overlapping
//      links resolve by paint order — invisible to the eye and to a screenshot.
//
//   5. **The arrows loop.** Click the last activity's "next" and the first
//      activity must become the centred card; click the first activity's
//      "previous" and the last must. This is the client's own request of 16 Aug
//      2026 — *"after 6 the 1 card comes back or vice-versa"* — and it is the
//      whole reason the arrows are anchors. Break: replace `coverflowNeighbours`
//      with a clamp.
//
//   6. **No photograph is cropped past 25% of its own width** at any sampled
//      viewport — the bound `check_card_stack.mjs` assertion 6 enforces, for the
//      same reason. Compares the loaded `<img>`'s natural aspect against its
//      rendered box; a box narrower than the photograph crops height instead,
//      which is unbounded by design. Break: widen `CARD_BOX` past the 1.7194
//      the six photographs allow.
//
//   7. **A continuous width sweep, 360 → 1920 in 20px steps** — not four
//      presets — asserting 1-6 at every step, plus the two things a width can
//      break on its own: the centred card must be genuinely centred in its
//      stage, and its rendered width must be exactly
//      `min(--coverflow-card-max, the stage's own width)`.
//
//      **This is the assertion that found the defect it was written for.**
//      Before it existed the rig sampled 1440 and 390 and nothing between, and
//      `CoverflowCard`'s width was `min(cardMax, 100vw − 2 × gutter)` with
//      `gutter` at 24px while `ChapterSurface`'s container is `md:px-12` — 48px
//      — from 768px up. So from 768px to 996px the card was up to 48px WIDER
//      than the stage holding it, `margin-inline: auto` resolved to `0 / −48px`
//      per CSS 2.1 §10.3.7, and every card sat hard against the container's left
//      edge with 47px of cream one side and 1px the other. Measured 22.8-25.4px
//      off centre at every scroll position across that whole band. That is the
//      same shape as `DECISIONS.md` §2 #44-45 and #52-53: a defect living
//      between the fixed sample widths. Break: put the viewport arithmetic back.
//
//   8. **Reduced motion yields a readable list.** With the setting emulated: the
//      track reserves no screens (its height is its content's), the stage is not
//      sticky, no card is `position: absolute` or carries an `animation-name`,
//      exactly the six activities are rendered — not the two wrap-around ghosts,
//      which have nothing to wrap in a list — and the six do not overlap. Break:
//      remove `.coverflow-track { height: auto }` from the reduced-motion block.
//
//   9. **No JavaScript.** With scripting disabled, all six activities are in the
//      document with their words, their arrows and their scroll targets, and
//      every card has a real box. The effect itself is CSS and keeps working
//      here; what this asserts is that the CONTENT never depended on script.
//      Break: make `Coverflow.tsx` a client component that renders its stage
//      only after mount.
//
// And one precondition that is fatal like an assertion:
//
//   * **`animation-range` must not have fallen back to `normal`.** Every
//     animated element in the section — the card, its veil, its arrows — has its
//     computed `animation-range-start` read back. An undeclared custom property
//     inside `animation-range` makes the declaration invalid at computed-value
//     time and it falls back SILENTLY to the whole timeline, which puts a card
//     445px from where it belongs with nothing on screen saying so (probe §7).
//     Break: rename `--cf-from` at its declaration and leave the use alone.
//
// What a broken build scores, written down before the first run:
//
//   * No coverflow at all: no `ul.coverflow-stage` inside `#field-days` — the
//     rig stops there and says so. Demonstrated with `--path /mahua-vann`,
//     because a production build of this page *before* the section existed
//     cannot be made: `app/page.tsx`'s switch is exhaustive.
//   * Per-card `animation-range` deleted: every card shares the full range and
//     they all move together, so at a centred moment EIGHT cards are inside 8px
//     (2 fails) and either eight or zero cards' arrows are live (4 fails).
//   * The keyframed `pointer-events` removed: all sixteen arrows are live
//     wherever they are on screen — 4 fails with a count of 3 (the centre card
//     and both neighbours) rather than 1.
//   * `animation-timeline` written BEFORE the `animation` shorthand, which
//     resets it: nothing binds, every card sits at its 0% keyframe off-screen
//     right, no card is ever centred and no arrow is ever reachable.
//   * The range moved to `exit` or `contain` (probe §6): the carousel freezes
//     for the whole pin, so one card is live for every sample and 2's coverage
//     fails at one index instead of eight.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const PORT = flag("port", "3100");
const BASE = flag("url", `http://localhost:${PORT}`);
// `--path` exists for the negative control. A production build of the page
// BEFORE this section existed cannot be made — `app/page.tsx`'s switch is
// exhaustive, so `"coverflow"` joining `ChapterKind` in Task 3 made `tsc` fail
// until Task 6 added the case arm — so the "no coverflow anywhere" failure is
// demonstrated by pointing the rig at a route that has none.
const PATH = flag("path", "/");
const OUT = flag("out", "docs/reviews/2026-08-16-coverflow/coverflow.json");

/** The chapter, and the deck it must carry. */
const CHAPTER = "field-days";
/**
 * Six activities — and therefore six scroll targets, one per activity.
 *
 * The ghosts carry no `id`: a wrap-around copy of a card that is also on the
 * stage under its own number would otherwise emit a duplicate id, and every
 * arrow pointing at it would land on whichever the browser saw first.
 */
const EXPECTED_TARGETS = 6;
/**
 * Eight cards, since 16 Aug 2026: the six, plus a copy of the last at `--i: -1`
 * and of the first at `--i: count`.
 *
 * They are the client's own "after 6 the 1 card comes back" made visible in the
 * scroll rather than only in the arrows, and they are what puts a card at the
 * flanks at the two moments the stage used to hold ONE card alone — this
 * chapter's worst screens (`docs/reviews/2026-08-16-coverflow/density-sweep.md`
 * §2). Everything below is asked of all eight: each one is bisected to its own
 * centred moment, and each one takes its turn in charge.
 */
const EXPECTED_CARDS = EXPECTED_TARGETS + 2;

const SHAPES = [
  [1440, 900],
  // 390 is measured deliberately even though desktop is the client's lens (12
  // Aug 2026): the two worst defects the rooms card stack produced were both
  // found at this width, one of them by a human reading a screenshot.
  [390, 844],
];

/**
 * The continuous sweep — assertion 7.
 *
 * 360 because it is narrower than any phone this project draws for, 1920
 * because it is past the 1696px at which `ChapterSurface`'s container saturates
 * at its own 1600px cap and stops growing with the viewport. 20px because the
 * defect this sweep exists to catch was 48px wide in the card and produced a
 * 22-25px displacement across a 228px band: a 20px step cannot step over it,
 * and the four fixed presets every rig on this project uses stepped over it
 * completely.
 */
const SWEEP_FROM = 360;
const SWEEP_TO = 1920;
const SWEEP_STEP = Number(flag("sweep-step", "20"));
const SWEEP_HEIGHT = 900;
/**
 * Which activities the sweep lands on at each width.
 *
 * Two, not six: the sweep's own quantities (the card's width against its
 * stage's, and where the card sits in it) are scroll-independent, so a second
 * position is a cross-check rather than more coverage, and 79 widths × 6
 * scroll-and-settle rounds buys nothing the deep arms above do not already
 * hold. Interior indices, so both flanks exist at both of them.
 */
const SWEEP_TARGETS = [1, 4];

/** How near the stage's centre a card must be to count as centred. */
const CENTRE_TOLERANCE = 8;
/** Two cards this close to each other in distance are a tie, not a disagreement. */
const TIE_TOLERANCE = 1;
/** The stage counts as pinned while its top edge sits this near the header. */
const PIN_TOLERANCE = 2;
/** Coarse sweep through the pin. A card is "in charge" for one whole step. */
const STEP = 24;
/** Past this the scroll is treated as settled — see `scrollToAndSettle`. */
const SETTLE_TOLERANCE = 0.5;
/**
 * A neighbour's veil must clear this ABSOLUTE floor as well as matching the
 * dial.
 *
 * Both halves are needed and neither is redundant. Matching the dial alone is
 * circular — with `sideVeil` at 0 a build with no recede at all satisfies
 * "within 20% of `--coverflow-side-veil`" perfectly. The floor alone would pass
 * a build whose veil had drifted to some other value. Together they say: a
 * neighbour is really veiled, and it is veiled by the number `lib/motion.ts`
 * publishes.
 */
const VEIL_FLOOR = 0.05;
/** How near the dial a flank's measured veil must land (it is read at ±8px of centre). */
const VEIL_MATCH = 0.8;
/** A neighbour must be measurably smaller than the card in front of it. */
const SCALE_BEHIND_MAX = 0.99;
/** …and not collapsed to nothing. */
const SCALE_BEHIND_MIN = 0.5;
/** The bound every cropped photograph on this project is held to. */
const MAX_CROP = 0.25;
/** A card's rendered width must equal `min(cardMax, stageWidth)` this closely. */
const WIDTH_TOLERANCE = 1;

const failures = [];
const note = (label, msg) => failures.push(`${label}: ${msg}`);

/**
 * Scroll to `y` and wait for the position to actually stop changing.
 *
 * Lenis is running on this page and interpolates toward its target, so a fixed
 * wait after `window.scrollTo` reads a position the page has not reached — and
 * a view timeline read mid-interpolation reports a scroll offset that is not
 * the one this sample claims to be about. Task 1's probe explicitly did not
 * test this (§10); `check_card_stack.mjs` solved it first and this is its
 * routine, unchanged.
 */
async function scrollToAndSettle(page, y) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  return settle(page);
}

/** The polling half of the above, for a scroll something else started (an anchor click). */
async function settle(page) {
  let prev = null;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(30);
    const cur = await page.evaluate(() => window.scrollY);
    if (prev !== null && Math.abs(cur - prev) < SETTLE_TOLERANCE) return cur;
    prev = cur;
  }
  return prev;
}

/**
 * Where an anchor click on `#id` would land the page.
 *
 * `scroll-padding-top` is the whole of it: `app/globals.css` sets it on `html`
 * to the header's own measured height, a fragment navigation honours it, and
 * every `.coverflow-target` is placed at the offset an anchor click lands its
 * card centred at. Ignore the inset and every one of these lands a header's
 * height past the moment it claims to be about — the same correction
 * `check_contrast_over_photos.mjs`'s `anchor: true` carries.
 */
async function anchorOffset(page, id) {
  return page.evaluate((elId) => {
    const el = document.getElementById(elId);
    if (!el) return null;
    const pad =
      Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    return el.getBoundingClientRect().top + window.scrollY - pad;
  }, id);
}

/** One sample: where the stage is, where every card is, and which arrows answer. */
async function sample(page, chapter) {
  return page.evaluate(
    ({ id, pinTolerance }) => {
      const stage = document.querySelector(`#${id} ul.coverflow-stage`);
      const header = document.querySelector("[data-site-header]");
      if (!stage) return null;

      const stageRect = stage.getBoundingClientRect();
      const stageCentre = stageRect.left + stageRect.width / 2;
      const headerHeight = header ? header.getBoundingClientRect().height : 0;

      const root = getComputedStyle(document.documentElement);
      const dial = (n) => Number.parseFloat(root.getPropertyValue(n));

      const cards = Array.from(stage.querySelectorAll("li.coverflow-card")).map((el, i) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);

        // Both arrows, hit-tested at their own centres. `elementFromPoint` takes
        // viewport coordinates and returns null outside the viewport, which is
        // the honest answer for an arrow that has been carried off the stage.
        const arrows = Array.from(el.querySelectorAll("nav.coverflow-arrows a")).map((a) => {
          const ar = a.getBoundingClientRect();
          const x = ar.left + ar.width / 2;
          const y = ar.top + ar.height / 2;
          const inside =
            x >= 0 && y >= 0 && x <= window.innerWidth - 1 && y <= window.innerHeight - 1;
          const hit = inside ? document.elementFromPoint(x, y) : null;
          return {
            href: a.getAttribute("href"),
            x: Math.round(x),
            y: Math.round(y),
            inside,
            reachable: Boolean(hit && (hit === a || a.contains(hit))),
            // What answered instead. Without this a failure says only "nobody
            // could click it" and leaves the reader guessing between a keyframe
            // that did not apply, a card off the side of the stage, and something
            // else on the page lying over the top of it — which is three very
            // different repairs.
            hit: !inside
              ? "outside the viewport"
              : hit
                ? `${hit.tagName.toLowerCase()}${hit.className && typeof hit.className === "string" ? `.${hit.className.trim().split(/\s+/).slice(0, 3).join(".")}` : ""}`
                : "nothing",
            pointerEvents: getComputedStyle(a.closest("nav")).pointerEvents,
          };
        });

        // The scale the card is actually drawn at. Read off the resolved matrix
        // rather than off the keyframe, because the keyframe is the thing under
        // test — `hypot(a, b)` is the x-axis length of the transform, which is
        // the scale for the translate+scale this effect uses and stays honest if
        // a rotation is ever added (which non-negotiable #4 forbids, and which
        // this would then report as a scale of 1).
        const m = new DOMMatrixReadOnly(cs.transform === "none" ? "" : cs.transform);
        const veilEl = el.querySelector(".coverflow-veil");

        // `object-fit: cover` keeps `min(1, boxAspect / imageAspect)` of a
        // photograph's width; a box NARROWER than the photograph crops its
        // height instead, which is unbounded by design and reports 0 here.
        const img = el.querySelector("img");
        const ir = img ? img.getBoundingClientRect() : null;
        const photo =
          img && img.naturalWidth > 0 && ir && ir.width > 0 && ir.height > 0
            ? (() => {
                const imageAspect = img.naturalWidth / img.naturalHeight;
                const boxAspect = ir.width / ir.height;
                return {
                  src: (img.currentSrc || img.src).split("/").pop(),
                  imageAspect: Number(imageAspect.toFixed(4)),
                  boxAspect: Number(boxAspect.toFixed(4)),
                  cropped: Number(Math.max(0, 1 - Math.min(1, boxAspect / imageAspect)).toFixed(4)),
                };
              })()
            : null;

        return {
          i,
          centre: r.left + r.width / 2,
          offset: r.left + r.width / 2 - stageCentre,
          width: r.width,
          // The width the card is LAID OUT at, which is a different question
          // from the width it is drawn at: `getBoundingClientRect()` includes
          // the keyframed `scale()`, so a card mid-transit reports 0.82 of
          // itself. `offsetWidth` is the border box before any transform, and it
          // is what "the card is wider than its stage" is actually about — the
          // margin resolution that put every card 24px off centre is a layout
          // fact and has nothing to do with where the animation has it.
          layoutWidth: el.offsetWidth,
          height: r.height,
          onScreen: r.right > 0 && r.left < window.innerWidth,
          opacity: Number(cs.opacity),
          scale: Number(Math.hypot(m.a, m.b).toFixed(4)),
          veil: veilEl ? Number(getComputedStyle(veilEl).opacity) : null,
          zIndex: cs.zIndex,
          rangeStart: cs.animationRangeStart,
          veilRangeStart: veilEl ? getComputedStyle(veilEl).animationRangeStart : null,
          arrowsRangeStart: el.querySelector("nav.coverflow-arrows")
            ? getComputedStyle(el.querySelector("nav.coverflow-arrows")).animationRangeStart
            : null,
          photo,
          arrows,
          /**
           * "In charge": at least one of this card's arrows is on screen, and
           * every arrow of it that IS on screen answers to itself.
           *
           * Not "both arrows reachable", which was the first form and which
           * measurement rejected: at 390 the card is 342px of a 390px viewport, so
           * mid-transit a shift of 62% carries one of its two arrows past the edge
           * while the card is still the one at the front. That is the phone doing
           * what a phone does, not a defect, and it is a different question from
           * the one this assertion asks — which is whether anything is lying over
           * the arrows a visitor can see, and whether a card that is NOT at the
           * front can be clicked anyway. Both of those survive: an off-centre
           * card's `<nav>` is `pointer-events: none`, so `elementFromPoint` never
           * returns its arrows however far on screen they are.
           */
          live:
            arrows.some((a) => a.inside) && arrows.filter((a) => a.inside).every((a) => a.reachable),
        };
      });

      return {
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        headerHeight,
        stageTop: stageRect.top,
        stageWidth: stage.offsetWidth,
        stageCentre,
        cardMax: Number.parseFloat(root.getPropertyValue("--coverflow-card-max")),
        sideVeil: dial("--coverflow-side-veil"),
        sideScale: dial("--coverflow-side-scale"),
        pinned: Math.abs(stageRect.top - headerHeight) <= pinTolerance,
        cards,
      };
    },
    { id: chapter, pinTolerance: PIN_TOLERANCE },
  );
}

/** The section's own boxes, in document coordinates. */
async function readGeometry(page, chapter) {
  return page.evaluate((id) => {
    const wrap = document.querySelector(`#${id} .coverflow`);
    const track = document.querySelector(`#${id} .coverflow-track`);
    const stage = document.querySelector(`#${id} ul.coverflow-stage`);
    if (!wrap || !stage) return null;
    const r = wrap.getBoundingClientRect();
    const tr = track ? track.getBoundingClientRect() : r;
    const header = document.querySelector("[data-site-header]");
    const seen = new Set();
    const duplicateIds = [];
    for (const el of document.querySelectorAll(`#${id} [id]`)) {
      if (seen.has(el.id)) duplicateIds.push(el.id);
      seen.add(el.id);
    }
    return {
      top: Math.round(r.top + window.scrollY),
      height: Math.round(r.height),
      trackTop: Math.round(tr.top + window.scrollY),
      trackHeight: Math.round(tr.height),
      headerHeight: header ? header.getBoundingClientRect().height : 0,
      innerHeight: window.innerHeight,
      cards: stage.querySelectorAll("li.coverflow-card").length,
      targets: document.querySelectorAll(`#${id} .coverflow-target`).length,
      // The ghosts must be out of the accessibility tree AND out of the tab
      // order. Read off the DOM rather than off the component: eight cards must
      // not be eight activities to a screen reader, and sixteen arrows must not
      // be sixteen stops on the way through the page.
      ghostCards: stage.querySelectorAll('li.coverflow-card[aria-hidden="true"]').length,
      tabbableArrows: stage.querySelectorAll("nav.coverflow-arrows a:not([tabindex='-1'])").length,
      duplicateIds,
    };
  }, chapter);
}

/**
 * Assertion 3, at one card's own centred moment.
 *
 * `s` is a settled sample, `i` the card that should be at the front. It must be
 * at full size and unveiled; and, when `flanks` is asked for, its neighbours
 * must be on screen, smaller, unfaded and veiled.
 *
 * **`flanks` is asked of the six activities and not of the two ghosts, and that
 * is the composition rather than a relaxation.** A ghost's centred moment is a
 * HOLD — `coverflow-pass-first`/`-last` flatten one end of the schedule onto
 * centre — and it opens two steps before the stage even locks, where the rest of
 * the deck is deliberately parked at `--cf-off`, off the side of the stage. That
 * is the chapter riding in with one card up, which is exactly the state
 * `docs/reviews/2026-08-16-coverflow/density-sweep.md` §2 measured and the
 * ghosts were added to shorten. Measured at 1440x900 with the check asked of
 * them anyway: card 1 sat at x=1611 in a 1440px viewport, 1,260px from the
 * stage's centre, which is `--cf-off` doing its job. The client's own request —
 * *"the next and previous cards sit out of focus on left and right respectively
 * behind the center card"* — is a claim about the carousel's run, and all six
 * activities are inside it. Both ghosts are still measured HERE, as the flanks
 * of activity 1 and activity 6, which is the thing they were added to be.
 */
function checkFlanks(label, where, s, i, { flanks = true } = {}) {
  const me = s.cards[i];
  if (!me) return;
  if (me.opacity !== 1) {
    note(
      label,
      `assertion 3: at ${where} the centred card ${i} has opacity ${me.opacity} — a card's type ` +
        "sits ON its own photograph, so nothing may ever fade a card (correction C)",
    );
  }
  if (me.veil !== null && me.veil > 0.02) {
    note(
      label,
      `assertion 3: at ${where} the centred card ${i} is wearing ${me.veil} of veil — the depth ` +
        "cue is pointing at the card in front",
    );
  }
  if (me.scale < SCALE_BEHIND_MAX) {
    note(
      label,
      `assertion 3: at ${where} the centred card ${i} is drawn at scale ${me.scale}, not 1 — it is ` +
        "not actually at the front of the stage",
    );
  }

  if (!flanks) return;
  for (const j of [i - 1, i + 1]) {
    if (j < 0 || j >= s.cards.length) continue;
    const n = s.cards[j];
    if (!n.onScreen) {
      note(
        label,
        `assertion 3: at ${where} neighbour ${j} of the centred card ${i} is off screen entirely ` +
          `(left ${Math.round(n.centre - n.width / 2)}, right ${Math.round(n.centre + n.width / 2)}, ` +
          `viewport ${s.innerWidth}) — the client asked for the neighbours to sit BEHIND the ` +
          "centre card, not to be gone",
      );
    }
    if (n.opacity !== 1) {
      note(
        label,
        `assertion 3: at ${where} neighbour ${j} has opacity ${n.opacity} — the recede is on the ` +
          "card instead of on its veil, which fades cream type against the photograph beneath it " +
          "(correction C). `COVERFLOW.sideVeil`, never a `sideDim`",
      );
    }
    if (!(n.scale <= SCALE_BEHIND_MAX && n.scale >= SCALE_BEHIND_MIN)) {
      note(
        label,
        `assertion 3: at ${where} neighbour ${j} is drawn at scale ${n.scale} — a neighbour must ` +
          `be measurably behind (≤${SCALE_BEHIND_MAX}) and still a card (≥${SCALE_BEHIND_MIN})`,
      );
    }
    if (n.veil === null || n.veil < VEIL_FLOOR || n.veil < VEIL_MATCH * s.sideVeil) {
      note(
        label,
        `assertion 3: at ${where} neighbour ${j}'s \`.coverflow-veil\` is ${n.veil} — it must clear ` +
          `the absolute floor ${VEIL_FLOOR} AND reach ${VEIL_MATCH} of the ` +
          `\`--coverflow-side-veil\` the page publishes (${s.sideVeil}). Both halves: matching the ` +
          "dial alone passes a build with the dial at zero",
      );
    }
  }
}

/** Assertion 6, at one sample. */
function checkCrops(label, where, s) {
  for (const c of s.cards) {
    if (!c.photo) {
      note(label, `assertion 6: at ${where} card ${c.i}'s photograph has not loaded — not measured`);
      continue;
    }
    if (c.photo.cropped > MAX_CROP) {
      note(
        label,
        `assertion 6: at ${where} card ${c.i} (${c.photo.src}) loses ` +
          `${(c.photo.cropped * 100).toFixed(1)}% of its own width to a ${c.photo.boxAspect} box ` +
          `against a ${c.photo.imageAspect} photograph — the bound is ${MAX_CROP * 100}%`,
      );
    }
  }
}

/** Assertions 2 and 4, at one sample. Returns the card in charge, or null. */
function checkInCharge(label, where, s) {
  const centred = s.cards.filter((c) => Math.abs(c.offset) <= CENTRE_TOLERANCE);
  if (centred.length > 1) {
    note(
      label,
      `assertion 2: at ${where} ${centred.length} cards (${centred
        .map((c) => c.i)
        .join(", ")}) were within ${CENTRE_TOLERANCE}px of the stage's centre — they are ` +
        "sharing one animation window instead of each having its own",
    );
  }

  const live = s.cards.filter((c) => c.live);
  if (live.length !== 1) {
    note(
      label,
      `assertion 4: at ${where} ${live.length} cards had their on-screen arrows hit-testable ` +
        `(${live.map((c) => c.i).join(", ") || "none"}) — exactly one must, or the visitor is ` +
        "clicking whichever of sixteen overlapping links paint order happened to put on top. " +
        `Nearest card ${s.cards.reduce((a, b) => (Math.abs(a.offset) <= Math.abs(b.offset) ? a : b)).i}; ` +
        `arrows answered: ${s.cards
          .map(
            (c) =>
              `${c.i}[${c.arrows.map((a) => `${a.pointerEvents}/${a.reachable ? "ok" : a.hit}`).join(" ")}]`,
          )
          .join(" ")}`,
    );
    return null;
  }

  const best = Math.min(...s.cards.map((c) => Math.abs(c.offset)));
  const nearest = s.cards.filter((c) => Math.abs(c.offset) <= best + TIE_TOLERANCE).map((c) => c.i);
  if (!nearest.includes(live[0].i)) {
    note(
      label,
      `assertion 4: at ${where} card ${live[0].i}'s arrows were the live pair but ` +
        `card ${nearest.join("/")} was nearest the centre (${best.toFixed(1)}px against ` +
        `${Math.abs(live[0].offset).toFixed(1)}px) — the arrows are live on the wrong card`,
    );
  }
  return live[0];
}

/** The `animation-range` read-back, on every animated element in the section. */
function checkRanges(label, s) {
  for (const c of s.cards) {
    for (const [what, value] of [
      ["the card", c.rangeStart],
      ["its `.coverflow-veil`", c.veilRangeStart],
      ["its `nav.coverflow-arrows`", c.arrowsRangeStart],
    ]) {
      if (value === "normal") {
        note(
          label,
          `card ${c.i}: ${what} computed \`animation-range-start: normal\` — the declaration was ` +
            "dropped (an undeclared custom property inside it is invalid at computed-value time), " +
            "so it animates over the WHOLE timeline. Silent: it looks like a carousel running " +
            "eight times too fast, not like an error (probe §7)",
        );
      }
    }
  }
}

const browser = await chromium.launch();
const report = {
  measuredAt: new Date().toISOString(),
  url: BASE,
  path: PATH,
  sweep: { from: SWEEP_FROM, to: SWEEP_TO, step: SWEEP_STEP, height: SWEEP_HEIGHT },
  assertions: [
    "1 the stage holds within 2px of the header across the whole pin",
    "2 at most one card within 8px of centre; the card in charge advances 0->7; every card reaches centre",
    "3 a neighbour recedes by veil and scale, never by opacity; the centred card is unveiled",
    "4 exactly one card's arrows are hit-testable, and it is the one nearest centre",
    "5 the arrows loop both ways",
    "6 no photograph loses more than 25% of its own width",
    `7 continuous width sweep ${SWEEP_FROM}-${SWEEP_TO} in ${SWEEP_STEP}px steps, asserting 1-6 plus the card's centring and its width against its stage`,
    "8 reduced motion yields a readable, non-overlapping list of the six activities",
    "9 with no JavaScript the six activities are complete in the document",
    "precondition animation-range never falls back to `normal`",
  ],
  shapes: [],
};

for (const [width, height] of SHAPES) {
  const label = `${PATH}@${width}x${height}`;
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(`${BASE}${PATH}`, { waitUntil: "load" });
  // The welcome screen covers the page for ~2.1s. It is pointer-events: none, so
  // it never blocks a programmatic scroll, but it does answer `elementFromPoint`.
  await page.waitForTimeout(2600);

  // A coarse pass over the whole page first — settles lazily-loaded photographs
  // and fires the entrance observers, so the first real sample is not catching
  // mid-load layout. Same routine as `check_card_stack.mjs`.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
  });

  const supported = await page.evaluate(() => CSS.supports("animation-timeline: view()"));
  const geometry = await readGeometry(page, CHAPTER);

  if (!geometry) {
    note(label, `no \`.coverflow\` wrapper with a \`ul.coverflow-stage\` inside #${CHAPTER}`);
    await context.close();
    continue;
  }
  if (geometry.cards !== EXPECTED_CARDS) {
    note(label, `${geometry.cards} cards in the stage, expected ${EXPECTED_CARDS}`);
  }
  if (geometry.ghostCards !== EXPECTED_CARDS - EXPECTED_TARGETS) {
    note(
      label,
      `${geometry.ghostCards} cards are \`aria-hidden\`, expected ${EXPECTED_CARDS - EXPECTED_TARGETS} — ` +
        "the wrap-around copies must not be read out as activities of their own",
    );
  }
  if (geometry.tabbableArrows !== EXPECTED_TARGETS * 2) {
    note(
      label,
      `${geometry.tabbableArrows} arrows are in the tab order, expected ${EXPECTED_TARGETS * 2} — ` +
        "a ghost's arrows are inside an `aria-hidden` card and must carry `tabindex=\"-1\"`, or they " +
        "are keyboard stops a screen reader cannot announce",
    );
  }
  if (geometry.targets !== EXPECTED_TARGETS) {
    note(label, `${geometry.targets} scroll targets, expected ${EXPECTED_TARGETS}`);
  }
  if (geometry.duplicateIds.length > 0) {
    note(
      label,
      `duplicate element ids inside #${CHAPTER}: ${geometry.duplicateIds.join(", ")} — a ghost card ` +
        "is carrying its twin's id, so half the arrows point at the wrong element",
    );
  }
  if (!supported) {
    note(
      label,
      "this browser reports no support for `animation-timeline: view()`, so the pinned " +
        "construction is not in effect and nothing below can be measured — the fallback list " +
        "is what shipped, which is correct but is not what this assertion is about",
    );
    await context.close();
    continue;
  }

  // Find the pin by measurement rather than by re-deriving the probe's formula:
  // sweep the wrapper's whole scroll range coarsely and keep the samples where
  // the stage's own top edge is sitting on the header.
  const from = geometry.top - height;
  const to = geometry.top + geometry.height;
  const samples = [];
  for (let y = from; y <= to; y += STEP) {
    if (y < 0) continue;
    await scrollToAndSettle(page, y);
    const s = await sample(page, CHAPTER);
    if (s) samples.push(s);
  }

  // ---- assertion 1: the stage holds. ---------------------------------------
  // **Before the "is there a pin at all" bail below, deliberately.** With
  // `position: sticky` removed the stage is pinned at zero of 113 sampled
  // positions, so that guard fires first and reports "there is no pin to
  // measure a carousel inside" — true, and two steps back from the sentence a
  // reader needs. Assertion 1 names the element, its measured top edge and the
  // header it should be sitting on; it is the more useful failure and it comes
  // first.
  //
  // The window is the track's own measured box, not the CSS's arithmetic: the
  // stage locks when the track's top reaches the header, and lets go when the
  // stage's bottom meets the track's bottom — `trackTop + trackHeight -
  // innerHeight`, because the stage is exactly `100svh - header` tall. 8px is
  // held back at each end so a sample landing on the changeover itself is not
  // read as a failure of the middle.
  const lockAt = geometry.trackTop - geometry.headerHeight;
  const releaseAt = geometry.trackTop + geometry.trackHeight - geometry.innerHeight;
  const shouldHold = samples.filter((s) => s.scrollY > lockAt + 8 && s.scrollY < releaseAt - 8);
  const slipped = shouldHold.filter((s) => Math.abs(s.stageTop - s.headerHeight) > PIN_TOLERANCE);
  if (shouldHold.length < 4) {
    note(
      label,
      `assertion 1: only ${shouldHold.length} samples fell inside the pin's own computed window ` +
        `(${Math.round(lockAt)}-${Math.round(releaseAt)}px) — there is nothing to hold`,
    );
  }
  if (slipped.length > 0) {
    const worst = slipped.reduce((a, b) =>
      Math.abs(a.stageTop - a.headerHeight) >= Math.abs(b.stageTop - b.headerHeight) ? a : b,
    );
    note(
      label,
      `assertion 1: the stage moved at ${slipped.length} of ${shouldHold.length} samples inside ` +
        `the pin (${Math.round(lockAt)}-${Math.round(releaseAt)}px). Worst at scrollY=` +
        `${Math.round(worst.scrollY)}: its top edge was ${worst.stageTop.toFixed(1)}px from the ` +
        `viewport top against a header of ${worst.headerHeight.toFixed(1)}px — it is not sticking`,
    );
  }

  const pinned = samples.filter((s) => s.pinned);
  if (pinned.length < 8) {
    note(
      label,
      `the stage was pinned at only ${pinned.length} of ${samples.length} sampled positions — ` +
        "there is no pin to measure a carousel inside",
    );
    await context.close();
    continue;
  }

  // ---- precondition: `animation-range` resolved. ---------------------------
  checkRanges(label, pinned[0]);

  // ---- assertions 2 and 4, per pinned sample. ------------------------------
  const inCharge = [];
  for (const s of pinned) {
    // Assertion 3's own invariant, asked at EVERY position rather than only at
    // the centred moments: nothing on this stage may ever fade.
    const faded = s.cards.filter((c) => c.opacity !== 1);
    if (faded.length > 0) {
      note(
        label,
        `assertion 3: at scrollY=${Math.round(s.scrollY)} cards ${faded
          .map((c) => `${c.i} (${c.opacity})`)
          .join(", ")} are not fully opaque — a card's type sits ON its own photograph, so the ` +
          "recede is scrim over the frame and never opacity on the card (correction C)",
      );
    }
    const winner = checkInCharge(label, `scrollY=${Math.round(s.scrollY)}`, s);
    if (winner) inCharge.push({ scrollY: Math.round(s.scrollY), card: winner.i });
  }

  // ---- assertion 2 (d): the card in charge advances 0 -> 7 and never back. --
  const order = [];
  for (const entry of inCharge) {
    if (order.length === 0 || order[order.length - 1] !== entry.card) order.push(entry.card);
  }
  const expectedOrder = Array.from({ length: EXPECTED_CARDS }, (_, i) => i);
  if (order.join(",") !== expectedOrder.join(",")) {
    note(
      label,
      `assertion 2: the card in charge went ${order.join(" -> ")} across the pin, not ` +
        `${expectedOrder.join(" -> ")} — either a card never takes its turn, or the order ` +
        "reverses, or one card holds the whole pin",
    );
  }

  // ---- assertion 2 (e): every card genuinely reaches the centre. -----------
  // Bisect each card's own signed offset for its zero crossing. The offset falls
  // monotonically with scrollY (the card travels right to left), so a sign change
  // between two coarse samples brackets exactly one crossing.
  //
  // **A card that HOLDS at centre has no crossing to bracket**, and the first
  // version of this loop reported the first card as "never the centred card"
  // when it was centred for a third of the pin — the bisection's own assumption
  // failing, not the page. So a coarse sample already inside the tolerance
  // settles it outright and the bisection is only for cards that pass through.
  //
  // **The search runs over EVERY sample, not only the pinned ones, and the
  // "while pinned" half of the assertion is asked of the six activities only.**
  // That is the ghosts' geometry, not a relaxation: `step` is `pin-len / 7`, so
  // the eight centred moments sit at 0, 1, … 7 steps from the pin's start — the
  // first ghost's is exactly where the stage locks and the last ghost's exactly
  // where it lets go, and each of them then HOLDS at centre through the stage's
  // own ride-in and ride-out. Measured at 390x844 before this was corrected: the
  // last ghost's offset never went negative anywhere in the *pinned* window,
  // because its crossing is that window's own closing edge. That the two ghosts
  // are the cards at the centre when the pin begins and ends is still asserted,
  // and more directly, by assertions 2 and 4 — the card in charge is the one
  // nearest the centre, and the order runs 0 → 7 across the pin.
  const activityCards = Array.from({ length: EXPECTED_CARDS }, (_, i) => i).filter(
    (i) => i !== 0 && i !== EXPECTED_CARDS - 1,
  );
  const centreHits = [];
  for (let i = 0; i < EXPECTED_CARDS; i++) {
    const already = samples
      .map((s) => ({
        scrollY: Math.round(s.scrollY),
        offset: s.cards[i]?.offset ?? 999,
        pinned: s.pinned,
      }))
      .filter((s) => Math.abs(s.offset) <= CENTRE_TOLERANCE)
      .sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset))[0];
    if (already) {
      centreHits.push({ card: i, ...already, byHold: true });
      if (!already.pinned && activityCards.includes(i)) {
        note(
          label,
          `assertion 2: card ${i} is only ever centred at scrollY=${already.scrollY}, where the ` +
            "stage is NOT pinned — the pin is too short for its own carousel",
        );
      }
      continue;
    }

    let lo = null;
    let hi = null;
    for (let k = 1; k < samples.length; k++) {
      const a = samples[k - 1].cards[i];
      const b = samples[k].cards[i];
      if (!a || !b) continue;
      if (a.offset > 0 && b.offset <= 0) {
        lo = samples[k - 1].scrollY;
        hi = samples[k].scrollY;
        break;
      }
    }
    if (lo === null) {
      note(
        label,
        `assertion 2: card ${i}'s offset from the stage's centre never crossed zero anywhere in ` +
          "this chapter — it is never the centred card",
      );
      continue;
    }
    let best = null;
    for (let it = 0; it < 12 && hi - lo > 0.5; it++) {
      const mid = (lo + hi) / 2;
      await scrollToAndSettle(page, mid);
      const s = await sample(page, CHAPTER);
      const o = s.cards[i].offset;
      if (best === null || Math.abs(o) < Math.abs(best.offset)) {
        best = { scrollY: Math.round(s.scrollY), offset: o, pinned: s.pinned };
      }
      if (o > 0) lo = s.scrollY;
      else hi = s.scrollY;
    }
    centreHits.push({ card: i, ...best });
    if (!best || Math.abs(best.offset) > CENTRE_TOLERANCE) {
      note(
        label,
        `assertion 2: card ${i} came no closer than ${best ? best.offset.toFixed(1) : "?"}px to ` +
          "the stage's centre — it never actually arrives",
      );
    }
    if (best && !best.pinned && activityCards.includes(i)) {
      note(
        label,
        `assertion 2: card ${i} reaches the centre at scrollY=${best.scrollY}, where the stage is ` +
          "NOT pinned — the pin is too short for its own carousel",
      );
    }
  }

  // ---- assertions 3 and 6, at each card's own centred moment. --------------
  // The centred moment is where the effect makes its claim: the flanks are at
  // exactly `sideShift`/`sideScale`/`sideVeil` there, so it is the one position
  // where "behind and out of focus" is a number rather than an interpolation.
  const flankSamples = [];
  for (const hit of centreHits) {
    if (!hit || hit.scrollY === undefined) continue;
    await scrollToAndSettle(page, hit.scrollY);
    const s = await sample(page, CHAPTER);
    if (!s) continue;
    checkFlanks(label, `card ${hit.card}'s centred moment (scrollY=${hit.scrollY})`, s, hit.card, {
      flanks: activityCards.includes(hit.card),
    });
    checkCrops(label, `card ${hit.card}'s centred moment`, s);
    flankSamples.push({
      card: hit.card,
      ghost: !activityCards.includes(hit.card),
      scrollY: hit.scrollY,
      neighbours: [hit.card - 1, hit.card + 1]
        .filter((j) => j >= 0 && j < s.cards.length)
        .map((j) => ({
          i: j,
          scale: s.cards[j].scale,
          veil: s.cards[j].veil,
          opacity: s.cards[j].opacity,
          onScreen: s.cards[j].onScreen,
        })),
      worstCrop: Math.max(...s.cards.map((c) => c.photo?.cropped ?? 0)),
    });
  }

  // ---- assertion 5: the arrows loop, in both directions. -------------------
  // Clicked, not read: the hrefs could be right while the targets sit at the
  // wrong offsets, and the client's request was about what happens when he
  // presses the thing, not about what the markup says.
  const loop = [];
  for (const [fromCard, direction, toCard] of [
    // DOM index 6 is the LAST activity (the deck is ghost, 1…6, ghost), and its
    // "next" must wrap to the first. DOM index 1 is the first activity and its
    // "previous" must wrap to the last.
    [EXPECTED_TARGETS, "next", 1],
    [1, "previous", EXPECTED_TARGETS],
  ]) {
    const hit = centreHits.find((c) => c.card === fromCard);
    if (!hit) {
      note(label, `assertion 5: card ${fromCard} has no centred moment to click its arrows from`);
      continue;
    }
    await scrollToAndSettle(page, hit.scrollY);
    const clicked = await page.evaluate(
      ({ id, index, dir }) => {
        const cards = document.querySelectorAll(`#${id} ul.coverflow-stage li.coverflow-card`);
        const card = cards[index];
        if (!card) return null;
        const links = card.querySelectorAll("nav.coverflow-arrows a");
        const a = dir === "next" ? links[1] : links[0];
        if (!a) return null;
        const href = a.getAttribute("href");
        a.click();
        return href;
      },
      { id: CHAPTER, index: fromCard, dir: direction },
    );
    if (!clicked) {
      note(label, `assertion 5: card ${fromCard} has no "${direction}" arrow to click`);
      continue;
    }
    await settle(page);
    await page.waitForTimeout(200);
    const s = await sample(page, CHAPTER);
    const nearest = s.cards.reduce((a, b) => (Math.abs(a.offset) <= Math.abs(b.offset) ? a : b));
    loop.push({ from: fromCard, direction, href: clicked, landedOn: nearest.i });
    if (nearest.i !== toCard) {
      note(
        label,
        `assertion 5: clicking card ${fromCard}'s "${direction}" (${clicked}) left card ` +
          `${nearest.i} nearest the stage's centre, not card ${toCard} — the loop the client asked ` +
          'for on 16 Aug 2026 ("after 6 the 1 card comes back or vice-versa") is not wired: either ' +
          "`coverflowNeighbours` is clamping instead of wrapping, or the target it names sits at " +
          "the wrong scroll offset",
      );
    }
  }

  report.shapes.push({
    width,
    height,
    geometry,
    samples: samples.length,
    pinnedSamples: pinned.length,
    pinWindow: { lockAt: Math.round(lockAt), releaseAt: Math.round(releaseAt) },
    heldSamples: shouldHold.length,
    slippedSamples: slipped.length,
    inChargeOrder: order,
    centreHits,
    flanks: flankSamples,
    loop,
    firstSample: pinned[0],
  });

  console.log(
    `${label.padEnd(18)} cards=${geometry.cards} pinned=${pinned.length}/${samples.length} ` +
      `held=${shouldHold.length - slipped.length}/${shouldHold.length} ` +
      `order=${order.join(",")} worst-centre=${
        centreHits.length
          ? Math.max(...centreHits.map((c) => Math.abs(c.offset ?? 999))).toFixed(2)
          : "-"
      }px loop=${loop.map((l) => `${l.from}${l.direction === "next" ? ">" : "<"}${l.landedOn}`).join(" ")}`,
  );

  await context.close();
}

// ---------------------------------------------------------------------------
// Assertion 7 — the continuous width sweep.
//
// One page, resized rather than reloaded: `setViewportSize` re-lays-out and
// re-resolves the view timeline, and reloading 79 times would put this arm past
// ten minutes for nothing. Photographs are already decoded from the first
// width's full-page pass, and the crop bound is about a file's ASPECT, which no
// `srcset` tier changes.
//
// At each width the page is taken to two of its own scroll targets — the
// arithmetic the arrows use, `scroll-padding-top` and all — rather than to a
// re-derivation of the pin's formula. If the targets are wrong, this arm says so
// too.
{
  const context = await browser.newContext({
    viewport: { width: SWEEP_TO, height: SWEEP_HEIGHT },
  });
  const page = await context.newPage();
  await page.goto(`${BASE}${PATH}`, { waitUntil: "load" });
  await page.waitForTimeout(2600);
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
  });

  /** One row per width, so a failure can be reported as a RANGE rather than 79 lines. */
  const rows = [];
  for (let w = SWEEP_FROM; w <= SWEEP_TO; w += SWEEP_STEP) {
    await page.setViewportSize({ width: w, height: SWEEP_HEIGHT });
    await page.waitForTimeout(60);
    const row = { width: w, targets: [] };

    for (const t of SWEEP_TARGETS) {
      const y = await anchorOffset(page, `${CHAPTER}-card-${t}`);
      if (y === null) {
        row.targets.push({ target: t, error: "no such scroll target" });
        continue;
      }
      await scrollToAndSettle(page, y);
      const s = await sample(page, CHAPTER);
      if (!s) {
        row.targets.push({ target: t, error: "no stage" });
        continue;
      }
      // The deck opens with a ghost, so activity `t` is the `t + 1`-th card.
      const expected = t + 1;
      const me = s.cards[expected];
      const nearest = s.cards.reduce((a, b) => (Math.abs(a.offset) <= Math.abs(b.offset) ? a : b));
      const live = s.cards.filter((c) => c.live);
      const centred = s.cards.filter((c) => Math.abs(c.offset) <= CENTRE_TOLERANCE);
      const wantWidth = Math.min(s.cardMax, s.stageWidth);
      const flanks = [expected - 1, expected + 1]
        .filter((j) => j >= 0 && j < s.cards.length)
        .map((j) => s.cards[j]);

      row.targets.push({
        target: t,
        scrollY: Math.round(s.scrollY),
        pinned: s.pinned,
        stageTop: Number(s.stageTop.toFixed(1)),
        headerHeight: Number(s.headerHeight.toFixed(1)),
        stageWidth: Number(s.stageWidth.toFixed(1)),
        cardWidth: me ? Number(me.layoutWidth.toFixed(1)) : null,
        drawnWidth: me ? Number(me.width.toFixed(1)) : null,
        wantWidth: Number(wantWidth.toFixed(1)),
        offset: me ? Number(me.offset.toFixed(1)) : null,
        nearest: nearest.i,
        liveCount: live.length,
        liveCard: live.length === 1 ? live[0].i : null,
        centredCount: centred.length,
        flankVeil: flanks.map((f) => f.veil),
        flankScale: flanks.map((f) => f.scale),
        minOpacity: Math.min(...s.cards.map((c) => c.opacity)),
        worstCrop: Math.max(...s.cards.map((c) => c.photo?.cropped ?? 0)),
        // Why a card that is wider than its stage cannot be centred, in the
        // page's own numbers: `margin-inline: auto` with `left: 0; right: 0`
        // and an over-constrained width resolves to `0 / negative`.
        margins: me
          ? [
              Number((me.centre - me.width / 2 - (s.stageCentre - s.stageWidth / 2)).toFixed(1)),
              Number((s.stageCentre + s.stageWidth / 2 - (me.centre + me.width / 2)).toFixed(1)),
            ]
          : null,
      });
    }
    rows.push(row);
  }
  await context.close();

  /**
   * Report a width-dependent failure as a RANGE.
   *
   * 79 widths × a per-width message is a wall nobody reads, and the shape of a
   * width defect is a BAND — that is what makes it invisible to fixed presets in
   * the first place. `worst` picks the sample to name.
   *
   * **A row that could not be measured at all is never fed to a predicate.** It
   * carries `error` and none of the fields the messages below read, and the
   * first version of this helper pushed it into every band and then crashed
   * formatting the message — which is the rig failing rather than the page, on
   * exactly the negative control (`--path /mahua-vann`) it exists to survive.
   * Those rows are reported once, as their own band, by `unmeasured` below.
   */
  const band = (name, predicate, describe) => {
    const bad = [];
    for (const row of rows) {
      for (const t of row.targets) {
        if (!t.error && predicate(t, row)) bad.push({ ...t, width: row.width });
      }
    }
    if (bad.length === 0) return;
    const widths = [...new Set(bad.map((b) => b.width))].sort((a, b) => a - b);
    const ranges = [];
    for (const w of widths) {
      const last = ranges[ranges.length - 1];
      if (last && w - last[1] <= SWEEP_STEP) last[1] = w;
      else ranges.push([w, w]);
    }
    note(
      `assertion 7 · sweep`,
      `${name} at ${ranges.map(([a, b]) => (a === b ? `${a}px` : `${a}-${b}px`)).join(", ")} ` +
        `(${bad.length} of ${rows.length * SWEEP_TARGETS.length} samples). ${describe(bad)}`,
    );
  };

  // Anything the sweep could not measure at all — no scroll target, no stage —
  // reported once rather than folded into every band below.
  const unmeasured = rows.flatMap((r) =>
    r.targets.filter((t) => t.error).map((t) => ({ ...t, width: r.width })),
  );
  if (unmeasured.length > 0) {
    const widths = [...new Set(unmeasured.map((b) => b.width))].sort((a, b) => a - b);
    note(
      "assertion 7 · sweep",
      `${unmeasured.length} of ${rows.length * SWEEP_TARGETS.length} samples could not be ` +
        `measured (${[...new Set(unmeasured.map((u) => u.error))].join("; ")}) at ` +
        `${widths[0]}-${widths[widths.length - 1]}px`,
    );
  }

  band(
    "the stage did not hold",
    (t) => !t.pinned,
    (bad) =>
      `Worst: at ${bad[0].width}px the stage's top edge was ${bad[0].stageTop}px from the ` +
      `viewport top against a header of ${bad[0].headerHeight}px — assertion 1, off the fixed samples`,
  );
  band(
    "the centred card was not centred in its stage",
    (t) => Math.abs(t.offset ?? 999) > CENTRE_TOLERANCE,
    (bad) => {
      const worst = bad.reduce((a, b) => (Math.abs(a.offset) >= Math.abs(b.offset) ? a : b));
      return (
        `Worst ${Math.abs(worst.offset).toFixed(1)}px at ${worst.width}px, where a ` +
        `${worst.cardWidth}px card sits in a ${worst.stageWidth}px stage with margins ` +
        `${worst.margins?.join(" / ")}. A card wider than its stage cannot be centred: with ` +
        "`left: 0; right: 0` and a definite width, `margin-inline: auto` is over-constrained and " +
        "CSS 2.1 §10.3.7 resolves it by pushing the box to the inline start"
      );
    },
  );
  band(
    "the card's rendered width was not `min(--coverflow-card-max, the stage's own width)`",
    (t) => Math.abs((t.cardWidth ?? 0) - (t.wantWidth ?? 0)) > WIDTH_TOLERANCE,
    (bad) => {
      const worst = bad.reduce((a, b) =>
        Math.abs(a.cardWidth - a.wantWidth) >= Math.abs(b.cardWidth - b.wantWidth) ? a : b,
      );
      return (
        `Worst at ${worst.width}px: drawn ${worst.cardWidth}px, wanted ${worst.wantWidth}px ` +
        `(stage ${worst.stageWidth}px). The card's own width expression and the container that ` +
        "holds it disagree about what bounds it — which is exactly how this defect shipped, with " +
        "the card bounded by `100vw − 2 × 24px` inside a container padded 48px a side from `md` up"
      );
    },
  );
  band(
    "the scroll target landed on the wrong card",
    (t) => t.nearest !== t.target + 1,
    (bad) =>
      `Worst at ${bad[0].width}px: \`#${CHAPTER}-card-${bad[0].target}\` left card ${bad[0].nearest} ` +
      `nearest the centre, not card ${bad[0].target + 1} — assertion 2 off the fixed samples`,
  );
  band(
    "more than one card was within 8px of centre",
    (t) => t.centredCount > 1,
    (bad) => `Worst at ${bad[0].width}px: ${bad[0].centredCount} cards — assertion 2`,
  );
  band(
    "the arrows were live on no card or on more than one",
    (t) => t.liveCount !== 1,
    (bad) => `Worst at ${bad[0].width}px: ${bad[0].liveCount} cards with live arrows — assertion 4`,
  );
  band(
    "the arrows were live on a card that was not the centred one",
    (t) => t.liveCount === 1 && t.liveCard !== t.nearest,
    (bad) =>
      `Worst at ${bad[0].width}px: card ${bad[0].liveCard}'s arrows were live, card ` +
      `${bad[0].nearest} was nearest — assertion 4`,
  );
  band(
    "a card was faded rather than veiled",
    (t) => t.minOpacity !== 1,
    (bad) => `Worst at ${bad[0].width}px: opacity ${bad[0].minOpacity} — assertion 3, correction C`,
  );
  band(
    "a neighbour was not veiled",
    (t) => t.flankVeil.some((v) => v === null || v < VEIL_FLOOR),
    (bad) => `Worst at ${bad[0].width}px: flank veils ${bad[0].flankVeil.join(", ")} — assertion 3`,
  );
  band(
    "a neighbour was not behind the centre card",
    (t) => t.flankScale.some((v) => v > SCALE_BEHIND_MAX || v < SCALE_BEHIND_MIN),
    (bad) => `Worst at ${bad[0].width}px: flank scales ${bad[0].flankScale.join(", ")} — assertion 3`,
  );
  band(
    "a photograph was cropped past its bound",
    (t) => t.worstCrop > MAX_CROP,
    (bad) => {
      const worst = bad.reduce((a, b) => (a.worstCrop >= b.worstCrop ? a : b));
      return `Worst ${(worst.worstCrop * 100).toFixed(1)}% at ${worst.width}px — assertion 6`;
    },
  );

  report.widthSweep = rows;
  const offsets = rows.flatMap((r) => r.targets.map((t) => Math.abs(t.offset ?? 0)));
  console.log(
    `width sweep         ${rows.length} widths × ${SWEEP_TARGETS.length} targets, ` +
      `${SWEEP_FROM}-${SWEEP_TO}px step ${SWEEP_STEP}, worst off-centre ` +
      `${Math.max(...offsets).toFixed(2)}px`,
  );
}

// ---------------------------------------------------------------------------
// Assertion 8 — reduced motion, where the pin collapses to a plain list.
//
// **This arm exists because the ghosts broke it, 16 Aug 2026.** They are copies
// of cards that are also on the stage under their own numbers, which earns its
// place in the pinned construction and is simply wrong in a list: the fallback
// rendered 06 / 01 / 02 / 03 / 04 / 05 / 06 / 01, opening with a repeat of its
// own last entry. `app/globals.css` now turns them off outside the carousel, in
// the base rule and again under reduced motion, and this is what holds it there.
//
// What a broken build scores: with either `display: none` removed, `visible`
// reads 8 instead of 6; with `.coverflow-track { height: auto }` removed, the
// track still reserves two screens of scroll for a list that does not move.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${BASE}${PATH}`, { waitUntil: "load" });
  await page.waitForTimeout(2600);
  const fallback = await page.evaluate((id) => {
    const stage = document.querySelector(`#${id} ul.coverflow-stage`);
    const track = document.querySelector(`#${id} .coverflow-track`);
    if (!stage) return null;
    const cards = Array.from(stage.querySelectorAll("li.coverflow-card"));
    const shown = cards.filter((el) => getComputedStyle(el).display !== "none");
    const rects = shown.map((el) => el.getBoundingClientRect());
    // Sorted by their own top edge, then walked: any card whose top is above the
    // previous one's bottom is sitting on top of another card, which is the pile
    // the `@supports` fallback exists to prevent.
    const ordered = [...rects].sort((a, b) => a.top - b.top);
    let overlaps = 0;
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].top < ordered[i - 1].bottom - 1) overlaps++;
    }
    return {
      inMarkup: cards.length,
      visible: shown.length,
      titles: shown.map((el) => el.querySelector("h3")?.textContent ?? "?"),
      stagePosition: getComputedStyle(stage).position,
      stageHeight: Math.round(stage.getBoundingClientRect().height),
      trackHeight: track ? Math.round(track.getBoundingClientRect().height) : null,
      reservedScreens: Math.round(window.innerHeight * 2),
      positions: [...new Set(shown.map((el) => getComputedStyle(el).position))],
      overlaps,
      animations: [...new Set(cards.map((el) => getComputedStyle(el).animationName))],
    };
  }, CHAPTER);

  if (!fallback) {
    note("assertion 8 · reduced motion", `no \`ul.coverflow-stage\` inside #${CHAPTER}`);
  } else {
    report.reducedMotion = fallback;
    if (fallback.visible !== EXPECTED_TARGETS) {
      note(
        "assertion 8 · reduced motion",
        `${fallback.visible} cards are rendered (${fallback.titles.join(" / ")}), expected ` +
          `${EXPECTED_TARGETS} — with no carousel there is nothing for a wrap-around copy to wrap, ` +
          "and a plain list that opens with a repeat of its own last entry reads as a mistake",
      );
    }
    if (fallback.stagePosition === "sticky") {
      note("assertion 8 · reduced motion", "the stage is still sticky — the pin has not collapsed");
    }
    // The track's only child is the stage, so `height: auto` makes the two
    // equal. Anything more is reserved scroll a visitor pays for and nothing
    // travels through — `.sticky-scene`'s own case, non-negotiable #9.
    if (fallback.trackHeight === null) {
      note("assertion 8 · reduced motion", "no `.coverflow-track` to measure");
    } else if (Math.abs(fallback.trackHeight - fallback.stageHeight) > 2) {
      note(
        "assertion 8 · reduced motion",
        `the track is ${fallback.trackHeight}px tall around a ${fallback.stageHeight}px stage — ` +
          "it is still reserving the pin's scroll (two screens) for a list that does not move, " +
          "which is exactly the paid-for empty scroll non-negotiable #9 forbids",
      );
    }
    if (fallback.positions.some((p) => p === "absolute" || p === "fixed")) {
      note(
        "assertion 8 · reduced motion",
        `cards are \`position: ${fallback.positions.join(", ")}\` — out of flow, they pile up ` +
          "instead of listing",
      );
    }
    if (fallback.overlaps > 0) {
      note(
        "assertion 8 · reduced motion",
        `${fallback.overlaps} of the ${fallback.visible} cards overlap the one above them — the ` +
          "fallback is a pile, not a list",
      );
    }
    if (fallback.animations.some((a) => a !== "none")) {
      note(
        "assertion 8 · reduced motion",
        `cards still carry animation-name ${fallback.animations.join(", ")} — every selector that ` +
          "names an animation must be repeated in the reduced-motion block, or the more specific " +
          "ones keep theirs",
      );
    }
    console.log(
      `reduced motion      ${fallback.visible}/${fallback.inMarkup} cards rendered, stage ` +
        `${fallback.stagePosition}, track ${fallback.trackHeight}px vs stage ` +
        `${fallback.stageHeight}px, overlaps ${fallback.overlaps}, animations ` +
        `${fallback.animations.join("/")}`,
    );
  }
  await context.close();
}

// ---------------------------------------------------------------------------
// Assertion 9 — no JavaScript.
//
// The effect itself is CSS and keeps running here, which is the whole budget
// claim; what this arm asserts is the other half — that the CONTENT never
// depended on script. Six activities, their words, their arrows and their six
// scroll targets, all in the document a server sent.
//
// What a broken build scores: make `Coverflow.tsx` a client component that
// renders its stage only after mount and the stage is not in the document at
// all, so this reads 0 cards while every other arm in this file still passes.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}${PATH}`, { waitUntil: "load" });
  await page.waitForTimeout(800);

  // `page.evaluate` cannot be used here — it needs the very scripting this arm
  // has switched off. Everything below reads the DOM through Playwright's own
  // selectors, which run out of process.
  const stage = await page.$(`#${CHAPTER} ul.coverflow-stage`);
  if (!stage) {
    note(
      "assertion 9 · no JavaScript",
      `no \`ul.coverflow-stage\` inside #${CHAPTER} with scripting disabled — the section's ` +
        "content depends on script",
    );
  } else {
    const cards = await page.$$(
      `#${CHAPTER} ul.coverflow-stage li.coverflow-card:not([aria-hidden="true"])`,
    );
    const titles = [];
    const bodies = [];
    let boxless = 0;
    let arrowless = 0;
    for (const card of cards) {
      const h3 = await card.$("h3");
      titles.push(h3 ? ((await h3.textContent()) ?? "").trim() : "");
      const ps = await card.$$("p");
      bodies.push(ps.length);
      const box = await card.boundingBox();
      if (!box || box.width < 40 || box.height < 40) boxless++;
      const arrows = await card.$$("nav.coverflow-arrows a[href^='#']");
      if (arrows.length !== 2) arrowless++;
    }
    const targets = await page.$$(`#${CHAPTER} .coverflow-target`);
    report.noJavaScript = {
      cards: cards.length,
      titles,
      targets: targets.length,
      boxless,
      arrowless,
    };

    if (cards.length !== EXPECTED_TARGETS) {
      note(
        "assertion 9 · no JavaScript",
        `${cards.length} activity cards in the document, expected ${EXPECTED_TARGETS}`,
      );
    }
    if (titles.some((t) => t.length === 0)) {
      note(
        "assertion 9 · no JavaScript",
        `a card has no heading (${titles.map((t) => t || "—").join(" / ")}) — the words are not ` +
          "server-rendered",
      );
    }
    if (bodies.some((n) => n < 2)) {
      note(
        "assertion 9 · no JavaScript",
        `a card is missing its number or its body copy (paragraph counts ${bodies.join(", ")})`,
      );
    }
    if (boxless > 0) {
      note(
        "assertion 9 · no JavaScript",
        `${boxless} cards have no real box — present in the markup but not laid out`,
      );
    }
    if (arrowless > 0) {
      note(
        "assertion 9 · no JavaScript",
        `${arrowless} cards do not carry two fragment-link arrows — the navigation is script, not ` +
          "anchors, which is the whole of this section's zero-JavaScript claim",
      );
    }
    if (targets.length !== EXPECTED_TARGETS) {
      note(
        "assertion 9 · no JavaScript",
        `${targets.length} scroll targets, expected ${EXPECTED_TARGETS} — the arrows point at ` +
          "nothing",
      );
    }
    console.log(
      `no JavaScript       ${cards.length} activity cards, ${targets.length} targets, ` +
        `${titles.filter(Boolean).length} headings`,
    );
  }
  await context.close();
}

await browser.close();

report.failures = failures;
report.verdict = failures.length === 0 ? "pass" : "fail";

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`\n${report.verdict.toUpperCase()}`);
for (const f of failures) console.log(`  - ${f}`);
console.log(`\n-> ${OUT}`);

process.exitCode = failures.length === 0 ? 0 : 1;
