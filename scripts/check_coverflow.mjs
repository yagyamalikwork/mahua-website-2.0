// `04 · Days in the Field` as a coverflow — `components/sections/Coverflow.tsx`
// and `app/globals.css`'s `.coverflow*` block — in a real browser.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_coverflow.mjs
//
// **This file carries ONE assertion. The plan's Task 7 writes the other eight**
// (the stage holding, the neighbours' scale and veil, the arrows' loop, the crop
// bound, a continuous width sweep, reduced motion, and no-JavaScript). It exists
// now because Task 6 needs a gate that is watched failing rather than a reading
// of the markup.
//
// Everything below is read off the rendered page with `getBoundingClientRect()`,
// `getComputedStyle()` and `document.elementFromPoint()` — never off
// `app/globals.css` or `lib/motion.ts`. A check that reads back the CSS it was
// given proves nothing (`docs/DECISIONS.md` §2).
//
// ─────────────────────────────────────────────────────────────────────────────
// Assertion 1 — at every scroll position inside the pin there is exactly one
// card in charge, and it is the one nearest the middle of the stage.
//
// Concretely, at every sample where the stage is genuinely pinned:
//
//   (a) AT MOST ONE card is within 8px of the stage's horizontal centre;
//   (b) EXACTLY ONE card's arrows are hit-testable — `elementFromPoint` at each
//       arrow's own centre returns that arrow or something inside it;
//   (c) that card is the one nearest the centre (ties inside 1px allowed);
//
// and across the pin as a whole:
//
//   (d) the card in charge advances 0 → 7, monotonically, hitting every index;
//   (e) every card genuinely REACHES the centre — found by bisecting its own
//       signed offset for the zero crossing, and required to land inside 8px.
//
// Eight, not six, since 16 Aug 2026: the deck carries a wrap-around copy of the
// last activity and of the first, so the client's loop is in the scroll and not
// only in the arrows. They are `aria-hidden`, carry no `id`, and their arrows are
// out of the tab order — all three read off the DOM below, because "eight cards"
// must not silently become "eight activities" to a screen reader.
//
// **(a) is "at most one", not "exactly one", and the difference is a correction
// to this task's own brief.** No continuously-moving carousel can have a card
// exactly centred at every scroll position: between two centred moments the
// outgoing card has left the middle and the incoming one has not arrived, and
// the only ways out are a plateau at centre long enough to tile the pin (which
// puts TWO cards at dead centre at the crossover) or a jump. So the invariant
// that is actually true — and that is the one a visitor cares about — is the
// arrows' one, (b) and (c): `pointer-events` is keyframed over d ∈ [−0.5, +0.5]
// steps from each card's own centred moment, and those intervals tile the pin
// exactly. (a) survives as the half of the brief that IS true, and it is what
// catches every card sharing one range.
//
// What a broken build scores, written down before the first run:
//
//   * No coverflow at all (the state of the page before Task 6): no
//     `ul.coverflow-stage` inside `#field-days` — the rig stops there and says so.
//   * Per-card `animation-range` deleted, so every card shares the full range:
//     they all move together, so at a centred moment EIGHT cards are inside 8px
//     — (a) fails — and either eight or zero cards' arrows are live — (b) fails.
//   * The keyframed `pointer-events` removed: all twelve arrows are live
//     wherever they are on screen — (b) fails with a count of 3 (the centre card
//     and both neighbours) rather than 1.
//   * `animation-timeline` written BEFORE the `animation` shorthand, which
//     resets it: nothing binds, every card sits at its 0% keyframe off-screen
//     right, no card is ever centred and no arrow is ever reachable — (b) and
//     (e) both fail.
//   * The range moved to `exit` or `contain` (probe §6): the carousel freezes for
//     the whole pin, so one card is live for every sample and (d)'s coverage
//     fails at one index instead of six.
//
// A precondition rather than an assertion: every card's computed
// `animation-range-start` is read back and reported if it is `normal`. An
// undeclared custom property inside `animation-range` makes the declaration
// invalid at computed-value time and it falls back silently to the whole
// timeline — the probe's §7 measured a card 445px out with nothing on screen
// saying so.

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
  let prev = null;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(30);
    const cur = await page.evaluate(() => window.scrollY);
    if (prev !== null && Math.abs(cur - prev) < SETTLE_TOLERANCE) return cur;
    prev = cur;
  }
  return prev;
}

/** One sample: where the stage is, where every card is, and which arrows answer. */
async function sample(page, chapter) {
  return page.evaluate(({ id, pinTolerance }) => {
    const stage = document.querySelector(`#${id} ul.coverflow-stage`);
    const header = document.querySelector("[data-site-header]");
    if (!stage) return null;

    const stageRect = stage.getBoundingClientRect();
    const stageCentre = stageRect.left + stageRect.width / 2;
    const headerHeight = header ? header.getBoundingClientRect().height : 0;

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

      return {
        i,
        centre: r.left + r.width / 2,
        offset: r.left + r.width / 2 - stageCentre,
        width: r.width,
        opacity: Number(cs.opacity),
        zIndex: cs.zIndex,
        rangeStart: cs.animationRangeStart,
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
      headerHeight,
      stageTop: stageRect.top,
      stageCentre,
      pinned: Math.abs(stageRect.top - headerHeight) <= pinTolerance,
      cards,
    };
  }, { id: chapter, pinTolerance: PIN_TOLERANCE });
}

const browser = await chromium.launch();
const report = {
  measuredAt: new Date().toISOString(),
  url: BASE,
  assertion:
    "At every sampled scroll position inside the pin: at most one card is within 8px of the " +
    "stage's horizontal centre, exactly one card's arrows are hit-testable, and that card is the " +
    `one nearest the centre. Across the pin the card in charge advances 0 -> ${EXPECTED_CARDS - 1} ` +
    "hitting every index, and every card is bisected to its own centred moment and must land " +
    "inside 8px. The deck is the six activities plus the two wrap-around ghosts, which must be " +
    "aria-hidden, id-less and out of the tab order.",
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
  const geometry = await page.evaluate((id) => {
    const wrap = document.querySelector(`#${id} .coverflow`);
    const stage = document.querySelector(`#${id} ul.coverflow-stage`);
    if (!wrap || !stage) return null;
    const r = wrap.getBoundingClientRect();
    const seen = new Set();
    const duplicateIds = [];
    for (const el of document.querySelectorAll(`#${id} [id]`)) {
      if (seen.has(el.id)) duplicateIds.push(el.id);
      seen.add(el.id);
    }
    return {
      top: Math.round(r.top + window.scrollY),
      height: Math.round(r.height),
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
  }, CHAPTER);

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

  // A precondition, not an assertion: a dropped `animation-range` declaration is
  // silent and makes every card animate over the whole timeline.
  const normalRanges = pinned[0].cards.filter((c) => c.rangeStart === "normal").map((c) => c.i);
  if (normalRanges.length > 0) {
    note(
      label,
      `cards ${normalRanges.join(", ")} computed \`animation-range-start: normal\` — the ` +
        "declaration was dropped (an undeclared custom property inside it is invalid at " +
        "computed-value time), so they animate over the whole timeline",
    );
  }

  // ---- (a), (b), (c): per pinned sample. ------------------------------------
  const inCharge = [];
  for (const s of pinned) {
    const centred = s.cards.filter((c) => Math.abs(c.offset) <= CENTRE_TOLERANCE);
    if (centred.length > 1) {
      note(
        label,
        `at scrollY=${Math.round(s.scrollY)} ${centred.length} cards (${centred
          .map((c) => c.i)
          .join(", ")}) were within ${CENTRE_TOLERANCE}px of the stage's centre — they are ` +
          "sharing one animation window instead of each having its own",
      );
    }

    const live = s.cards.filter((c) => c.live);
    if (live.length !== 1) {
      note(
        label,
        `at scrollY=${Math.round(s.scrollY)} ${live.length} cards had BOTH arrows hit-testable ` +
          `(${live.map((c) => c.i).join(", ") || "none"}) — exactly one must, or the visitor is ` +
          "clicking whichever of twelve overlapping links paint order happened to put on top. " +
          `Nearest card ${s.cards.reduce((a, b) => (Math.abs(a.offset) <= Math.abs(b.offset) ? a : b)).i}; ` +
          `arrows answered: ${s.cards
            .map(
              (c) =>
                `${c.i}[${c.arrows.map((a) => `${a.pointerEvents}/${a.reachable ? "ok" : a.hit}`).join(" ")}]`,
            )
            .join(" ")}`,
      );
      continue;
    }

    const best = Math.min(...s.cards.map((c) => Math.abs(c.offset)));
    const nearest = s.cards
      .filter((c) => Math.abs(c.offset) <= best + TIE_TOLERANCE)
      .map((c) => c.i);
    if (!nearest.includes(live[0].i)) {
      note(
        label,
        `at scrollY=${Math.round(s.scrollY)} card ${live[0].i}'s arrows were the live pair but ` +
          `card ${nearest.join("/")} was nearest the centre (${best.toFixed(1)}px against ` +
          `${Math.abs(live[0].offset).toFixed(1)}px) — the arrows are live on the wrong card`,
      );
    }
    inCharge.push({ scrollY: Math.round(s.scrollY), card: live[0].i });
  }

  // ---- (d): the card in charge advances 0 -> 5 and never goes backwards. ----
  const order = [];
  for (const entry of inCharge) {
    if (order.length === 0 || order[order.length - 1] !== entry.card) order.push(entry.card);
  }
  const expectedOrder = Array.from({ length: EXPECTED_CARDS }, (_, i) => i);
  if (order.join(",") !== expectedOrder.join(",")) {
    note(
      label,
      `the card in charge went ${order.join(" -> ")} across the pin, not ` +
        `${expectedOrder.join(" -> ")} — either a card never takes its turn, or the order ` +
        "reverses, or one card holds the whole pin",
    );
  }

  // ---- (e): every card genuinely reaches the centre. -----------------------
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
  // and more directly, by (c) and (d) — the card in charge is the one nearest
  // the centre, and the order runs 0 → 7 across the pin.
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
          `card ${i} is only ever centred at scrollY=${already.scrollY}, where the stage is NOT ` +
            "pinned — the pin is too short for its own carousel",
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
        `card ${i}'s offset from the stage's centre never crossed zero anywhere in this chapter ` +
          "— it is never the centred card",
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
        `card ${i} came no closer than ${best ? best.offset.toFixed(1) : "?"}px to the stage's ` +
          `centre — it never actually arrives`,
      );
    }
    if (best && !best.pinned && activityCards.includes(i)) {
      note(
        label,
        `card ${i} reaches the centre at scrollY=${best.scrollY}, where the stage is NOT pinned ` +
          "— the pin is too short for its own carousel",
      );
    }
  }

  report.shapes.push({
    width,
    height,
    geometry,
    samples: samples.length,
    pinnedSamples: pinned.length,
    inChargeOrder: order,
    centreHits,
    firstSample: pinned[0],
  });

  console.log(
    `${label.padEnd(18)} cards=${geometry.cards} pinned=${pinned.length}/${samples.length} ` +
      `order=${order.join(",")} worst-centre=${
        centreHits.length
          ? Math.max(...centreHits.map((c) => Math.abs(c.offset ?? 999))).toFixed(2)
          : "-"
      }px`,
  );

  await context.close();
}

// ---------------------------------------------------------------------------
// The fallback: reduced motion, where the pin collapses to a plain list.
//
// **This arm exists because the ghosts broke it, 16 Aug 2026.** They are copies
// of cards that are also on the stage under their own numbers, which earns its
// place in the pinned construction and is simply wrong in a list: the fallback
// rendered 06 / 01 / 02 / 03 / 04 / 05 / 06 / 01, opening with a repeat of its
// own last entry. `app/globals.css` now turns them off outside the carousel, in
// the base rule and again under reduced motion, and this is what holds it there.
//
// What a broken build scores: with either `display: none` removed, `visible`
// reads 8 instead of 6.
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
    if (!stage) return null;
    const cards = Array.from(stage.querySelectorAll("li.coverflow-card"));
    const shown = cards.filter((el) => getComputedStyle(el).display !== "none");
    return {
      inMarkup: cards.length,
      visible: shown.length,
      titles: shown.map((el) => el.querySelector("h3")?.textContent ?? "?"),
      stagePosition: getComputedStyle(stage).position,
      animations: [...new Set(cards.map((el) => getComputedStyle(el).animationName))],
    };
  }, CHAPTER);

  if (!fallback) {
    note("reduced motion", `no \`ul.coverflow-stage\` inside #${CHAPTER}`);
  } else {
    report.reducedMotion = fallback;
    if (fallback.visible !== EXPECTED_TARGETS) {
      note(
        "reduced motion",
        `${fallback.visible} cards are rendered (${fallback.titles.join(" / ")}), expected ` +
          `${EXPECTED_TARGETS} — with no carousel there is nothing for a wrap-around copy to wrap, ` +
          "and a plain list that opens with a repeat of its own last entry reads as a mistake",
      );
    }
    if (fallback.stagePosition === "sticky") {
      note("reduced motion", "the stage is still sticky — the pin has not collapsed");
    }
    if (fallback.animations.some((a) => a !== "none")) {
      note(
        "reduced motion",
        `cards still carry animation-name ${fallback.animations.join(", ")} — every selector that ` +
          "names an animation must be repeated in the reduced-motion block, or the more specific " +
          "ones keep theirs",
      );
    }
    console.log(
      `reduced motion      ${fallback.visible}/${fallback.inMarkup} cards rendered, stage ` +
        `${fallback.stagePosition}, animations ${fallback.animations.join("/")}`,
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
