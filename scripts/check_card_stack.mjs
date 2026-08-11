// The rooms card stack — `components/sections/RoomCardStack.tsx` — in a real
// browser, on both properties.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_card_stack.mjs
//   node scripts/check_card_stack.mjs --no-recede
//
// Client request, 11 Aug 2026: "pile up, with recede" — each card sticks below
// the header while the next rises over it, and a covered card scales down and
// dims so the deck reads as depth rather than as stacked paper. Every claim
// below is read off the rendered page with `getBoundingClientRect()` /
// `getComputedStyle()` — never off `app/globals.css` or `lib/motion.ts`. A
// check that reads back the CSS it was given proves nothing (`docs/DECISIONS.md`
// §2). Almost all of it is about what a visitor's own scrolling produces — the
// exception is assertion 3, a drift guard comparing the bar's measured height
// against a computed custom property, not a behaviour a visitor's scrolling
// itself produces.
//
// Eight assertions, on `/mahua-vann` (three rooms) and `/mahua-tola` (four
// rooms), at 390x844, 768x1024, 1024x1366, 1280x1024, 1440x900 and 1920x1080
// (the last two added in the fix wave that closed Finding 1 — see `SHAPES`'s
// own comment):
//
//   1. Cards stack — scrolling in ~120px steps, for every adjacent pair there
//      is a window of three consecutive steps where the earlier card's own
//      top freezes (<2px of change) while the next one is still visibly
//      arriving (>40px of change).
//   2. No card is clipped by the sticky header above it or the fixed booking
//      bar below it, at every step where the card is on screen.
//   3. `[data-property-bar]`'s own measured height never exceeds the
//      `--property-bar-reserve` the deck was sized against — the assertion
//      that makes `ROOM_STACK.barReserve` a safe constant rather than a
//      guess.
//   4. The deck is visible: at the last card's resting position, every
//      earlier card shows a real strip of itself, ≥6px tall, above it.
//   5. The recede happened: at that same position, the first card is
//      measurably smaller (≥1.5% narrower) and dimmer (opacity <0.99) than
//      the last one. `--no-recede` (emulated `prefers-reduced-motion`)
//      inverts this one check — it must NOT hold there — while 1-4 and 6
//      still must.
//   6. No photograph loses more than 25% of its own width to the crop its
//      card box imposes. Compares the loaded `<img>`'s natural aspect
//      against its rendered box; a box wider than the photograph is a purely
//      vertical crop and always passes.
//   7. The last card (`data-room-card-last`) never recedes, at any scroll
//      position where the stack is on screen — AND at least one covered card
//      is measured strictly dimmer and smaller somewhere in the same scan.
//      **Both halves are required.** Without the second, a build with the
//      recede switched off entirely would pass on the strength of the last
//      card being trivially opaque. Not run under `--no-recede`, where
//      nothing recedes by design. This is the check that guards the
//      tail-bleed fix — see the spec's §7.
//   8. **A visitor can actually read every card.** Assertions 2 and 6 both
//      measure the card's own OUTER box and its photograph; neither one ever
//      looks at the words. A card can pass both while its text is entirely
//      invisible, if the photo area grows taller than the card itself — the
//      words, which sit after it in flow, land below the card's own
//      `overflow: hidden` line and are clipped away regardless of where the
//      outer box sits relative to the header or the bar. That is exactly what
//      shipped on five stacked cards at 1440/1920 (fix round, 11 Aug 2026,
//      `.superpowers/sdd/2026-08-11-room-card-stack/task-7-fix2-report.md`):
//      `ROOM_CARD_BOXES` bounds the photo's WIDTH crop and was never checked
//      against the card's own height. For every card, a fine (20px) sweep
//      across the chapter's scroll range checks whether its TEXT BLOCK
//      (`card.children[1]`, not the card) is ever simultaneously (a) inside
//      the visible band — below the header, above the booking bar, not just
//      inside `window.innerHeight`, which is exactly the gap that let a
//      still-clipped card look "on screen"; (b) inside the CARD's OWN box,
//      so a text rect that lands inside the visible band by coincidence while
//      sitting outside its own ancestor's clip is still caught; (c) at
//      opacity >= 0.98. A card that never manages all three at once fails,
//      naming the room and the width.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const has = (n) => args.includes(`--${n}`);

const PORT = flag("port", "3100");
const BASE = flag("url", `http://localhost:${PORT}`);
const NO_RECEDE = has("no-recede");
const OUT = flag(
  "out",
  `docs/reviews/2026-08-11-card-stack/card-stack${NO_RECEDE ? "-no-recede" : ""}.json`,
);

/** Both properties' rooms chapters, and how many rooms each one really has. */
const ROUTES = [
  { path: "/mahua-vann", chapterId: "vann-rooms", label: "vann", expectedRooms: 3 },
  { path: "/mahua-tola", chapterId: "tola-rooms", label: "tola", expectedRooms: 4 },
];

const SHAPES = [
  [390, 844],
  [768, 1024],
  // Added in the fix wave that closed Finding 1: the original four shapes all
  // happen to be wide relative to their height, which is exactly the case
  // `beside`'s `lg:items-stretch` box coincidentally clears without a real
  // floor. iPad Pro portrait and a taller-than-wide desktop window are both
  // real, reviewed device shapes on this project's own matrix elsewhere and
  // neither one was ever sampled by this rig — 1024×1366 measured 51.1% of
  // `suite-tiger-painting`'s width lost, 1280×1024 measured 37.5%, both past
  // the 25% bound assertion 6 exists to enforce.
  [1024, 1366],
  [1280, 1024],
  [1440, 900],
  [1920, 1080],
];

/** The brief's own step size. */
const STEP = 120;
/** Past this the scroll is treated as settled — see `scrollToAndSettle`. */
const SETTLE_TOLERANCE = 0.5;

const failures = [];
const note = (label, msg) => failures.push(`${label}: ${msg}`);

/**
 * Scroll to `y` and wait for the position to actually stop changing.
 *
 * Smooth scrolling (Lenis) is on this page. `window.scrollTo` moves the
 * native scroll position, but Lenis's own frame loop can still be
 * interpolating toward an earlier target when the very next sample is read,
 * so a fixed wait after `scrollTo` produces a stale reading — the brief's own
 * warning. Polled instead: keep sampling `scrollY` until two consecutive
 * reads agree to within half a pixel.
 */
async function scrollToAndSettle(page, y) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  let prev = null;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(35);
    const cur = await page.evaluate(() => window.scrollY);
    if (prev !== null && Math.abs(cur - prev) < SETTLE_TOLERANCE) return cur;
    prev = cur;
  }
  return prev;
}

/** One sample: the header, the bar (0 when absent) and every card's own box. */
async function sample(page, sel) {
  return page.evaluate((selector) => {
    const header = document.querySelector("[data-site-header]");
    const bar = document.querySelector("[data-property-bar]");
    const headerRect = header ? header.getBoundingClientRect() : null;
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const cards = Array.from(document.querySelectorAll(selector)).map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      let scaleX = 1;
      if (cs.transform && cs.transform !== "none") {
        const m = new DOMMatrixReadOnly(cs.transform);
        scaleX = m.a;
      }
      return {
        top: r.top,
        bottom: r.bottom,
        width: r.width,
        opacity: Number(cs.opacity),
        scaleX,
        layout: el.getAttribute("data-card-layout"),
        isLast: el.hasAttribute("data-room-card-last"),
      };
    });
    return {
      headerHeight: headerRect ? headerRect.height : 0,
      barHeight: barRect ? barRect.height : 0,
      innerHeight: window.innerHeight,
      scrollY: window.scrollY,
      cards,
    };
  }, sel);
}

const browser = await chromium.launch();
const report = {
  measuredAt: new Date().toISOString(),
  url: BASE,
  noRecede: NO_RECEDE,
  method:
    "Scrolled `/mahua-vann` and `/mahua-tola`'s rooms chapters in 120px steps in a real browser, " +
    "settling the smooth-scrolled position (polled, never a fixed wait) before every sample. Every " +
    "figure is getBoundingClientRect() / getComputedStyle() on the running page.",
  combos: [],
};

for (const route of ROUTES) {
  for (const [width, height] of SHAPES) {
    const label = `${route.label}@${width}x${height}`;
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: NO_RECEDE ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    await page.goto(`${BASE}${route.path}`, { waitUntil: "load" });
    // The welcome screen covers the page for ~2.1s (CLAUDE.md, non-negotiable
    // #5 / the welcome). It is pointer-events: none, so it never blocks a
    // programmatic scroll, but the geometry it briefly overlays is not what a
    // visitor is looking at — waited out with margin either way.
    await page.waitForTimeout(2600);

    // A coarse pass over the whole page first, exactly like check_lantern.mjs's
    // `reveal()`: it settles lazily-loaded images and fires the entrance
    // observers before anything here is measured, so the very first sample of
    // the stepped scan below is not catching mid-load layout.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 70));
      }
    });

    const sel = `#${route.chapterId} ol.room-stack > li.room-card`;

    const geometry = await page.evaluate(
      ({ chapterId, selector }) => {
        const ol = document.querySelector(`#${chapterId} ol.room-stack`);
        if (!ol) return null;
        const rect = ol.getBoundingClientRect();
        return {
          top: Math.round(rect.top + window.scrollY),
          height: Math.round(rect.height),
          count: document.querySelectorAll(selector).length,
        };
      },
      { chapterId: route.chapterId, selector: sel },
    );

    if (!geometry || geometry.count === 0) {
      note(label, `no <ol class="room-stack"> found at #${route.chapterId}`);
      await context.close();
      continue;
    }
    if (geometry.count !== route.expectedRooms) {
      note(
        label,
        `expected ${route.expectedRooms} rooms, found ${geometry.count} — the assertions below assume ` +
          "the wrong count",
      );
    }
    const count = geometry.count;

    // --------------------------------------------------- assertion 6: crops
    // Scroll-independent (a uniform CSS `scale()` on the card never changes
    // its own box's aspect ratio), so measured once, right after the coarse
    // pass has given every image a chance to load.
    const crops = await page.evaluate(async (selector) => {
      const cards = Array.from(document.querySelectorAll(selector));
      const out = [];
      for (const card of cards) {
        const wrapper = card.firstElementChild;
        const img = wrapper ? wrapper.querySelector("img") : null;
        const name = card.querySelector("h3")?.textContent?.trim() ?? "(unnamed)";
        if (!img) {
          out.push({ name, ok: false, reason: "no <img> inside the card's photo wrapper" });
          continue;
        }
        if (!(img.complete && img.naturalWidth > 0)) {
          img.loading = "eager";
          await new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 3000);
          });
        }
        const box = wrapper.getBoundingClientRect();
        out.push({
          name,
          ok: true,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          boxWidth: box.width,
          boxHeight: box.height,
        });
      }
      return out;
    }, sel);

    for (const c of crops) {
      if (!c.ok) {
        note(label, `assertion 6: "${c.name}" — ${c.reason}`);
        continue;
      }
      if (!c.naturalWidth || !c.naturalHeight) {
        note(label, `assertion 6: "${c.name}" never finished loading (naturalWidth 0)`);
        continue;
      }
      const naturalAspect = c.naturalWidth / c.naturalHeight;
      const boxAspect = c.boxWidth / c.boxHeight;
      // A box at least as wide (relative to its height) as the photograph
      // only ever crops height — object-cover fills the width exactly.
      if (boxAspect >= naturalAspect) continue;
      const widthLostPct = (1 - boxAspect / naturalAspect) * 100;
      if (widthLostPct > 25) {
        note(
          label,
          `assertion 6: "${c.name}" loses ${widthLostPct.toFixed(1)}% of its width — box ` +
            `${boxAspect.toFixed(2)}:1 against a ${naturalAspect.toFixed(2)}:1 photograph`,
        );
      }
    }

    // ---------------------------------------------- the stepped scroll scan
    const scanStart = Math.max(0, geometry.top - 400);
    const scanEnd = geometry.top + geometry.height + 400;
    const samples = [];
    for (let y = scanStart; y <= scanEnd; y += STEP) {
      await scrollToAndSettle(page, y);
      samples.push(await sample(page, sel));
    }
    // One more at the very end of the range, in case the loop's step size
    // didn't land on it exactly.
    await scrollToAndSettle(page, scanEnd);
    samples.push(await sample(page, sel));

    const lastIdx = samples[0].cards.findIndex((c) => c.isLast);
    if (lastIdx === -1) {
      note(label, "no card carries data-room-card-last — assertions 4, 5 and 7 cannot run");
    }

    // -------------------------------------- the last card's resting position
    //
    // Defined as the earliest point (searching forward) where the last card
    // first satisfies the on-screen bounds — the moment it arrives and becomes
    // the card being read. That is the only well-defined candidate: a
    // frame-by-frame trace at 5px resolution (both routes, both narrow and
    // wide viewports) showed the last card has no genuine stationary plateau
    // at all. It is *continuously* approaching right up until the whole deck
    // — including cards that had been stuck for hundreds of px — unsticks
    // together in the same ~10-40px of scroll where the last card's own
    // approach happens to complete (the mechanism `app/globals.css` documents
    // above `.room-card[data-room-card-last]`: every card shares one
    // containing block and one height, so they cross their unstick threshold
    // within a narrow, near-simultaneous window). A 120px step, or even a 15px
    // one with a stability requirement, can land on either side of that
    // instant and never on a settled frame, because there isn't one.
    //
    // "Earliest arrival" is chosen over "deepest still on-screen" because it
    // is the one candidate assertion 4 can be evaluated at independent of
    // whether the recede has run at all — matching the brief's own breakage
    // test 3, which expects assertion 4 to still pass with the recede deleted
    // entirely. A dedicated fine pass (15px steps) locates it, computed here
    // (before assertion 2) because assertion 2 also needs it — see the note
    // there.
    const FINE_STEP = 15;
    let resting = null;
    if (lastIdx !== -1) {
      for (let y = scanStart; y <= scanEnd; y += FINE_STEP) {
        await scrollToAndSettle(page, y);
        const s = await sample(page, sel);
        const c = s.cards[lastIdx];
        if (c.top >= s.headerHeight - 1 && c.bottom <= s.innerHeight - s.barHeight + 1) {
          resting = s;
          break;
        }
      }
      if (!resting) {
        note(label, "assertions 4/5: the last card was never on screen within the scanned range");
      }
    }

    // ------------------------------------------------------- assertion 1
    for (let i = 0; i < count - 1; i++) {
      let found = false;
      for (let k = 0; k + 2 < samples.length; k++) {
        const iTops = [samples[k].cards[i].top, samples[k + 1].cards[i].top, samples[k + 2].cards[i].top];
        const jTops = [
          samples[k].cards[i + 1].top,
          samples[k + 1].cards[i + 1].top,
          samples[k + 2].cards[i + 1].top,
        ];
        const iRange = Math.max(...iTops) - Math.min(...iTops);
        const jRange = Math.max(...jTops) - Math.min(...jTops);
        if (iRange < 2 && jRange > 40) {
          found = true;
          break;
        }
      }
      if (!found) {
        note(
          label,
          `assertion 1: no window found where card ${i}'s top freezes (<2px/3 steps) while card ` +
            `${i + 1} advances (>40px/3 steps) — the deck is not stacking for this pair`,
        );
      }
    }

    // ------------------------------------------------------- assertion 2
    //
    // Two guards keep this to the genuine pinned/presentation phase, both
    // earned by measurement rather than assumed:
    //
    // 1. Bounded to samples up through `resting` (the last card's arrival).
    //    Past that point the whole deck legitimately unsticks and scrolls
    //    away together as normal (non-sticky) content handing off to the
    //    next chapter — exactly like any page's content sliding out from
    //    under a fixed header — and a card's top going negative or its
    //    bottom crossing the bar line there is ordinary scrolling, not a
    //    clip.
    // 2. Per-card, per-sample: only checked once that card's own top has
    //    stopped moving from the previous coarse sample (<2px, the same
    //    freeze threshold assertion 1 uses). A card still approaching from
    //    below legitimately has a large bottom for a stretch before it
    //    arrives — that is the entrance, not a clip — and sticky guarantees
    //    a genuinely stuck card's top can never itself be the problem, so
    //    this also means the top-clip half only ever fires when sticky
    //    itself has been defeated (breakage 1's scenario), never in
    //    ordinary operation.
    //
    // Traced at 5px resolution on the real page before adding these: without
    // them, every reported violation came from the natural entrance or the
    // post-`resting` departure, never from a moment a card was actually
    // pinned.
    const clipRangeEnd = resting ? resting.scrollY : scanEnd;
    const clipTop = Array.from({ length: count }, () => 0);
    const clipBottom = Array.from({ length: count }, () => 0);
    let worstTop = Array.from({ length: count }, () => null);
    let worstBottom = Array.from({ length: count }, () => null);
    for (let k = 1; k < samples.length; k++) {
      const s = samples[k];
      if (s.scrollY > clipRangeEnd) continue;
      for (let i = 0; i < count; i++) {
        const c = s.cards[i];
        const prevTop = samples[k - 1].cards[i].top;
        if (Math.abs(c.top - prevTop) >= 2) continue; // still approaching, not pinned yet
        const onScreen = c.bottom > s.headerHeight && c.top < s.innerHeight - s.barHeight;
        if (!onScreen) continue;
        if (c.top < s.headerHeight - 1) {
          clipTop[i]++;
          if (worstTop[i] === null || c.top < worstTop[i]) worstTop[i] = c.top;
        }
        const barLine = s.innerHeight - s.barHeight;
        if (c.bottom > barLine + 1) {
          clipBottom[i]++;
          if (worstBottom[i] === null || c.bottom > worstBottom[i]) worstBottom[i] = c.bottom;
        }
      }
    }
    for (let i = 0; i < count; i++) {
      if (clipTop[i] > 0) {
        note(
          label,
          `assertion 2: card ${i} rose above the header at ${clipTop[i]} scroll position(s), worst ` +
            `top ${worstTop[i].toFixed(1)}px`,
        );
      }
      if (clipBottom[i] > 0) {
        note(
          label,
          `assertion 2: card ${i} dropped below the booking bar at ${clipBottom[i]} scroll position(s), ` +
            `worst bottom ${worstBottom[i].toFixed(1)}px`,
        );
      }
    }

    // ------------------------------------------------------- assertion 3
    const reservePx = await page.evaluate(() => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--property-bar-reserve");
      return Number.parseFloat(v);
    });
    const maxBar = Math.max(0, ...samples.map((s) => s.barHeight));
    if (!Number.isFinite(reservePx)) {
      note(label, "assertion 3: --property-bar-reserve did not compute to a number");
    } else if (maxBar > reservePx) {
      note(
        label,
        `assertion 3: the booking bar measured ${maxBar.toFixed(1)}px, past the ` +
          `${reservePx}px --property-bar-reserve the deck is sized against`,
      );
    }

    // ------------------------------------------------------- assertion 4
    let strips = null;
    if (resting) {
      const lastTop = resting.cards[lastIdx].top;
      strips = [];
      for (let i = 0; i < count; i++) {
        if (i === lastIdx) continue;
        strips.push({ i, strip: lastTop - resting.cards[i].top });
      }
      const visible = strips.filter((s) => s.strip >= 6).length;
      if (visible < count - 1) {
        note(
          label,
          `assertion 4: only ${visible}/${count - 1} covered cards show a >=6px strip above the last ` +
            `one — strips: ${strips.map((s) => `${s.i}:${s.strip.toFixed(1)}px`).join(", ")}`,
        );
      }
    }

    // ------------------------------------------------------- assertion 5
    //
    // Two halves. The first is the brief's own: card 0 is measurably smaller
    // and dimmer than the last card at "resting". The second exists because
    // breakage 3 (deleting `animation-timeline`) exposed a gap in the first
    // one alone: `animation: room-recede linear both` has no explicit
    // `animation-duration`, so with the timeline gone it falls back to a
    // *time*-based animation of 0s length, which — with `fill: both` — jumps
    // straight to its end keyframe on load and holds there forever. Measured
    // directly: with that one line deleted, card 0 is already `opacity: 0.55`
    // / `scale: 0.94` at `scrollY: 0`, before the chapter is anywhere near the
    // viewport. The first half alone still reports "receded" in that state —
    // it is dimmer than the last card, just not *because of scroll* — so it
    // would have silently passed a build where the recede is not an
    // interaction at all, only a permanently-applied style. The second half
    // catches that: the very first coarse sample (`scanStart`, ~400px before
    // the chapter even starts) must still show card 0 at essentially full
    // opacity and scale, proving whatever dimming shows up later actually
    // came from scrolling through the chapter rather than being there from
    // the first paint.
    let recedeAt5 = null;
    if (resting) {
      const card0 = resting.cards[0];
      const lastCard = resting.cards[lastIdx];
      const widthDiffPct = ((lastCard.width - card0.width) / lastCard.width) * 100;
      const recededAtResting = widthDiffPct >= 1.5 && card0.opacity < 0.99;
      const early = samples[0].cards[0];
      const undimmedAtStart = early.opacity >= 0.99 && early.scaleX >= 0.99;
      const receded = recededAtResting && undimmedAtStart;
      recedeAt5 = {
        widthDiffPct,
        opacity: card0.opacity,
        recededAtResting,
        earlyOpacity: early.opacity,
        earlyScaleX: early.scaleX,
        undimmedAtStart,
        receded,
      };
      if (!NO_RECEDE) {
        if (!recededAtResting) {
          note(
            label,
            `assertion 5: card 0 did not recede against the last card — width diff ` +
              `${widthDiffPct.toFixed(2)}%, opacity ${card0.opacity}`,
          );
        } else if (!undimmedAtStart) {
          note(
            label,
            `assertion 5: card 0 is already opacity ${early.opacity} / scaleX ${early.scaleX.toFixed(3)} ` +
              `~400px before the chapter starts (scrollY ${samples[0].scrollY}) — the recede is not ` +
              "scroll-driven, it is a permanently-applied style (this is what breakage 3 exposed: a " +
              "0s time-based fallback animation with fill:both jumps to its end state on load and holds)",
          );
        }
      } else if (recededAtResting) {
        note(
          label,
          `assertion 5 (--no-recede): card 0 still receded under reduced motion — width diff ` +
            `${widthDiffPct.toFixed(2)}%, opacity ${card0.opacity}`,
        );
      }
    }

    // ------------------------------------------------------- assertion 7
    let assertion7 = null;
    if (!NO_RECEDE && lastIdx !== -1) {
      const EPS = 0.02;
      let lastViolations = 0;
      let worstLastOpacity = 1;
      let worstLastScale = 1;
      let anyCoveredReceded = false;
      for (const s of samples) {
        const onScreenStack = s.cards.some((c) => c.bottom > 0 && c.top < s.innerHeight);
        if (!onScreenStack) continue;
        const last = s.cards[lastIdx];
        if (Math.abs(last.opacity - 1) > EPS || Math.abs(last.scaleX - 1) > EPS) {
          lastViolations++;
          if (last.opacity < worstLastOpacity) worstLastOpacity = last.opacity;
          if (last.scaleX < worstLastScale) worstLastScale = last.scaleX;
        }
        for (let i = 0; i < count; i++) {
          if (i === lastIdx) continue;
          const c = s.cards[i];
          if (c.opacity < 1 - EPS && c.scaleX < 1 - EPS) anyCoveredReceded = true;
        }
      }
      assertion7 = { lastViolations, worstLastOpacity, worstLastScale, anyCoveredReceded };
      if (lastViolations > 0) {
        note(
          label,
          `assertion 7: the last card receded at ${lastViolations} scroll position(s) — worst opacity ` +
            `${worstLastOpacity.toFixed(3)}, worst scaleX ${worstLastScale.toFixed(3)}`,
        );
      }
      if (!anyCoveredReceded) {
        note(
          label,
          "assertion 7: no covered card was ever measured dimmer AND smaller than the last one — the " +
            "last-card check above would trivially pass on a build with no recede at all",
        );
      }
    }

    // ------------------------------------------------------- assertion 8
    //
    // See the long comment above this rig's assertion list for the mechanism.
    // One evaluate() per step (not one per card) so a fine 20px sweep over a
    // multi-thousand-px chapter stays affordable: every card's text-block
    // legibility is read in the same round trip. `scrollToAndSettle` (not a
    // fixed wait) for the same reason assertions 1/2/4/5 use it — a stale
    // read mid-Lenis-interpolation would misplace exactly the boundary this
    // assertion is checking.
    const TEXT_STEP = 20;
    const textLegible = Array.from({ length: count }, () => false);
    for (let y = scanStart; y <= scanEnd; y += TEXT_STEP) {
      await scrollToAndSettle(page, y);
      const rows = await page.evaluate((selector) => {
        const header = document.querySelector("[data-site-header]");
        const bar = document.querySelector("[data-property-bar]");
        const headerH = header ? header.getBoundingClientRect().height : 0;
        const barTop = bar ? bar.getBoundingClientRect().top : window.innerHeight;
        const visibleBottom = Math.min(window.innerHeight, barTop);
        return Array.from(document.querySelectorAll(selector)).map((card) => {
          const words = card.children[1];
          const cardRect = card.getBoundingClientRect();
          const wordsRect = words.getBoundingClientRect();
          const opacity = Number(getComputedStyle(card).opacity);
          const insideBand = wordsRect.top >= headerH - 0.5 && wordsRect.bottom <= visibleBottom + 0.5;
          const insideCardClip =
            wordsRect.top >= cardRect.top - 0.5 && wordsRect.bottom <= cardRect.bottom + 0.5;
          return insideBand && insideCardClip && opacity >= 0.98;
        });
      }, sel);
      rows.forEach((ok, i) => {
        if (ok) textLegible[i] = true;
      });
    }
    for (let i = 0; i < count; i++) {
      if (!textLegible[i]) {
        const name = crops[i]?.name ?? `card ${i}`;
        note(
          label,
          `assertion 8: "${name}" text block was never simultaneously inside [header, bar], inside ` +
            "its own card's clip box, and at full opacity — a visitor can never read it",
        );
      }
    }

    report.combos.push({
      route: route.label,
      path: route.path,
      width,
      height,
      roomCount: count,
      geometry,
      samples: samples.length,
      restingScrollY: resting ? resting.scrollY : null,
      assertion3: { reservePx, maxBar },
      assertion4Strips: strips,
      assertion5: recedeAt5,
      assertion7,
      assertion8: crops.map((c, i) => ({ name: c.name, legible: textLegible[i] })),
      crops,
    });

    const textLegibleCount = textLegible.filter(Boolean).length;
    console.log(
      `${label.padEnd(16)} rooms=${count} samples=${samples.length} bar<=${reservePx ?? "?"}px ` +
        `(max ${maxBar.toFixed(1)}px) resting@${resting ? Math.round(resting.scrollY) : "-"}` +
        (recedeAt5
          ? ` recede=${recedeAt5.receded} (${recedeAt5.widthDiffPct.toFixed(1)}%, op ${recedeAt5.opacity.toFixed(2)})`
          : "") +
        ` text-legible=${textLegibleCount}/${count}`,
    );

    await context.close();
  }
}

await browser.close();

report.failures = failures;
report.verdict = failures.length === 0 ? "pass" : "fail";

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`\n${report.verdict.toUpperCase()}${NO_RECEDE ? " (--no-recede)" : ""}`);
for (const f of failures) console.log(`  - ${f}`);
console.log(`\n-> ${OUT}`);

process.exitCode = failures.length === 0 ? 0 : 1;
