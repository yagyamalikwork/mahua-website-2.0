// The room gallery — `.room-gallery` native popovers, wired by
// `RoomCardStack.tsx`/`RoomCard.tsx` (Task 6) — in a real browser, on both
// properties.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_room_gallery.mjs
//   node scripts/check_room_gallery.mjs --port 3100 --out docs/reviews/2026-08-13-image-sizing/gallery.json
//
// Task 6's own code review approved the gallery but flagged one claim as
// reasoned rather than measured: "the enlarged image is deferred... asserted,
// not measured." This rig is what closes that gap, by BROWSER TRUTH —
// `naturalWidth === 0` on a closed panel's own `<img>` after a full-page
// scroll — rather than by attributing network requests to causes, because a
// cached card-tier file can make a request log lie in both directions: it can
// look like the panel image loaded when it was really the card's own smaller
// tier answering from cache, and it can look like nothing loaded when the
// panel image WAS served, also from cache, with no new request to see.
// `naturalWidth` has no such ambiguity — a browser only ever sets it once an
// image has actually decoded, cached or not.
//
// House boilerplate (flags, `note()`, JSON out, exit code) modelled on
// `scripts/check_card_stack.mjs`. Routes `/mahua-vann` (3 rooms) and
// `/mahua-tola` (4), at 1440x900 and 390x844 — the two shapes the brief
// names, not the full six-shape matrix `check_card_stack.mjs` sweeps: this
// rig is about popover BEHAVIOUR (open/close/navigate/deferred-load), not the
// deck's own stacking geometry, which is already covered there.
//
// Six assertions, each labelled below and in the code:
//
//   1. Lazy until asked. The brief's own literal test — naturalWidth === 0 on
//      every closed panel image after a full-page scroll — was run against
//      the clean, correctly-wired build FIRST, and it did not hold: two of
//      three (Vann) / several of four (Tola) panels showed nonzero
//      naturalWidth despite being closed the whole time. Investigated rather
//      than weakened blind (see the long comment at assertion 1's own site):
//      every panel's `<Photo>` shares its `id` with its own room CARD's
//      `<Photo>` — the gallery enlarges the SAME photograph, by design — and
//      where the two components' different `sizes` strings resolve to the
//      SAME candidate file at the current viewport, Chromium serves the
//      closed panel's naturalWidth from its own in-memory decoded-image
//      cache (documented behaviour: `loading="lazy"` gates the FETCH, not
//      access to an already-decoded resource), with ZERO extra network
//      requests — confirmed against the page's own request log. A blanket
//      naturalWidth === 0 cannot tell that apart from a genuine early,
//      independent fetch (both produce a nonzero reading), so the corrected
//      assertion is: naturalWidth === 0 wherever achievable, and where it
//      isn't, the panel's own `currentSrc` must be byte-identical to its own
//      card's `currentSrc` (the reuse is provably free) AND the network log
//      — consulted here as the brief allows, "treat it as corroboration" —
//      must show that shared URL requested exactly once across the page.
//   2. Click opens: click the first card's trigger button; its panel matches
//      `:popover-open` and its img reaches naturalWidth > 0 AND a rendered
//      width >= 40% of the viewport, together, within 5s.
//   3. Arrows are navigation: click "next" in panel 0 -> panel 1 open, panel
//      0 NOT open (popover="auto" guarantees at most one). From the LAST
//      panel, "next" wraps to panel 0. From panel 0, "previous" wraps to the
//      last. **Measured, 14 Aug 2026, to FAIL on the current build** — see
//      the long comment at this assertion's own site. The HTML Popover API's
//      "topmost popover ancestor" rule nests rather than replaces when the
//      invoking button lives inside the popover it targets a sibling of,
//      which is exactly how RoomCardStack.tsx's own "next"/"previous"
//      buttons are built. Confirmed with an isolated two-popover fixture
//      outside this codebase before trusting it, not assumed from the DOM
//      alone. A real, previously undiscovered defect in already-shipped,
//      already-reviewed code — not a rig bug, and not fixed in this task
//      (`RoomCardStack.tsx` is outside its file list, and the working fix
//      needs a real layout change). Left failing rather than weakened.
//   4. Esc closes: press Escape -> no `.room-gallery:popover-open` anywhere.
//      Tested against a single, freshly-opened panel (assertion 3's own
//      finding is that the arrows can leave more than one open — Escape only
//      ever closes the topmost, so testing it against THAT leftover state
//      would conflate two different questions; a full reset precedes this).
//   5. Light dismiss: open panel 0, mouse-click at a point MEASURED to be
//      outside the panel's own rendered box — not the brief's fixed
//      `(8, viewportHeight/2)`, which turned out to be inside the panel at
//      1440x900 (see `knownDefects[1]`: the panel is not actually centred) —
//      -> none open.
//   6. Absence, not breakage, without JS: a context with javaScriptEnabled:
//      false renders both routes, the stack lays out, the trigger buttons
//      exist; no assertion that panels open (whether declarative invokers run
//      without scripting is the UA's business), only that nothing errors and
//      the page still scrolls.
//
// Real user paths only, for the two assertions the brief names explicitly:
// `page.keyboard.press("Escape")` (4) and a real `page.mouse.click(x, y)` at
// a point outside any panel (5) — never `hidePopover()` / `showPopover()`
// called directly, which would test the API instead of the behaviour a
// visitor gets. Every click on a trigger or an arrow (2, 3) goes through
// Playwright's own `Locator.click()`, which also dispatches a real pointer
// event at the element's own screen position — a real click, just aimed
// rather than blind. Every click is timeout-bounded and wrapped so a broken
// invoker (exactly what the sabotages below produce) reports a clean, named
// failure instead of hanging the rig on a 30s default actionability wait.

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
const OUT = flag("out", "docs/reviews/2026-08-13-image-sizing/gallery.json");

/** Both properties' rooms chapters, and how many rooms each one really has —
 * the same table `check_card_stack.mjs` uses. */
const ROUTES = [
  { path: "/mahua-vann", chapterId: "vann-rooms", label: "vann", expectedRooms: 3 },
  { path: "/mahua-tola", chapterId: "tola-rooms", label: "tola", expectedRooms: 4 },
];

/** The brief's own two shapes — this rig is about popover behaviour, not the
 * deck's stacking geometry across the full shape matrix. */
const SHAPES = [
  [390, 844],
  [1440, 900],
];

const CLICK_TIMEOUT = 5000;

/** `RoomCardStack.tsx`'s own `roomGalleryId` — re-derived here rather than
 * imported (this is plain Node, not the TS build), same as every other rig
 * that reconstructs a component's id shape from its own comment. */
function panelId(chapterId, i) {
  return `room-gallery-${chapterId}-${i}`;
}

const failures = [];
const note = (label, msg) => failures.push(`${label}: ${msg}`);

/** The welcome screen covers the page for ~2.1s (non-negotiable #5) and is
 * `pointer-events: none`, so it never blocks a programmatic scroll or click,
 * but its geometry is not what a visitor is looking at. Waited out with
 * margin, same pattern as `check_card_stack.mjs` / `check_plates.mjs`. */
const WELCOME_WAIT = 2600;

/** A coarse pass over the whole page — every card scrolled past, every lazy
 * image given a chance to start (or, for assertion 1, deliberately NOT
 * start). Mirrors `check_card_stack.mjs`'s own coarse pass. */
async function scrollWholePage(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
  });
}

/** Scroll a trigger into view AND clear of the sticky header.
 * `scrollIntoViewIfNeeded` alone can leave the element's top flush with the
 * viewport's own top edge, which is exactly where the sticky header sits —
 * still obscured. Nudges the extra distance the header itself measures, then
 * settles. Takes a `Locator`, not a selector string, so it works for
 * elements that don't carry any attribute a CSS selector could lean on. */
async function scrollTriggerIntoView(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);
  const shortfall = await locator.evaluate((el) => {
    const header = document.querySelector("[data-site-header]");
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const rect = el.getBoundingClientRect();
    const need = headerH + 16 - rect.top;
    return need > 0 ? need : 0;
  });
  if (shortfall > 0) {
    await page.evaluate((amount) => window.scrollBy(0, -amount), shortfall);
    await page.waitForTimeout(80);
  }
}

/** Every `.room-gallery` panel currently matching `:popover-open`, by id. */
async function openPanels(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".room-gallery")]
      .filter((el) => el.matches(":popover-open"))
      .map((el) => el.id),
  );
}

/**
 * Reset to a known-clean "nothing open" state before assertions 4 and 5, each
 * of which is meant to test Esc / light-dismiss in isolation ("open panel 0"
 * — a single, fresh panel — per the brief), not whatever state assertion 3's
 * own navigation walk left behind. A single Escape only closes the TOPMOST
 * popover (assertion 3's own finding: the arrows nest rather than replace),
 * so this presses Escape repeatedly, bounded, until the DOM agrees nothing is
 * open — real keypresses, same as the assertion itself, just repeated as a
 * precondition rather than the thing being measured.
 */
async function closeAllPanels(page) {
  for (let i = 0; i < 6; i++) {
    const open = await openPanels(page);
    if (open.length === 0) return;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }
}

async function runRouteShape(browser, route, width, height) {
  const label = `${route.label}@${width}x${height}`;
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  // Every `/media/` request, in issue order, for assertion 1's own
  // corroborating check (see its own long comment) — collected from the
  // start so a shared card/gallery URL's true request count is never
  // undercounted by attaching the listener too late.
  const mediaRequests = [];
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/media/")) mediaRequests.push(u);
  });
  await page.goto(`${BASE}${route.path}`, { waitUntil: "load" });
  await page.waitForTimeout(WELCOME_WAIT);

  const n = route.expectedRooms;
  const combo = { route: route.label, path: route.path, width, height };
  const triggerSel = `#${route.chapterId} ol.room-stack button[popovertarget]`;
  const panel0 = panelId(route.chapterId, 0);

  // ----------------------------------------------------- confirm the fixture
  const found = await page.evaluate(
    (sel) => document.querySelectorAll(sel).length,
    triggerSel,
  );
  if (found !== n) {
    note(label, `expected ${n} gallery triggers, found ${found} — assertions below assume the wrong count`);
  }

  // --------------------------------------------------------- assertion 1
  //
  // Every gallery panel is closed at this point (nothing has been clicked
  // yet). A full-page scroll gives every lazy `<img>` on the page — including
  // every card's own photo — a chance to load.
  //
  // **Why this isn't a blanket naturalWidth === 0 check.** Measured against
  // this exact, unmodified, correctly-wired build: it wasn't. Every panel's
  // `<Photo id={room.mediaId}>` shares its media id with its own room CARD's
  // `<Photo id={room.mediaId}>` — the gallery enlarges the SAME photograph.
  // `ROOM_CARD_SIZES` and `GALLERY_SIZES` are different strings, but at some
  // viewports they resolve to the SAME candidate file from the shared
  // `srcset` — and once the card's own (ordinary, visible, correctly lazy)
  // `<img>` has fetched and decoded that file, Chromium will hand the
  // CLOSED panel's `<img>` a nonzero `naturalWidth` too, from its own
  // in-memory decoded-image cache, with no new network request at all.
  // `loading="lazy"` gates the FETCH; it has nothing to say about an element
  // that references a resource the browser has already decoded for a
  // different, legitimate reason. This is not a defect in the wiring — the
  // visitor pays zero extra bytes either way — but it does mean a plain
  // naturalWidth reading cannot tell "shared for free" apart from "loaded
  // early and independently," because both produce the same nonzero number.
  //
  // So: naturalWidth === 0 passes outright (the strongest, simplest case).
  // Where it is nonzero, the panel's own `currentSrc` must be byte-identical
  // to its own card's `currentSrc` (proving the "load" is the card's
  // unavoidable fetch, reused, not a new one) AND — the brief's own allowed
  // corroboration — that shared URL must have been requested exactly once
  // across the whole page load, confirmed against the request log. Either
  // check failing means the panel really did cause something the visible
  // card alone would not have.
  await scrollWholePage(page);
  const requestCounts = new Map();
  for (const u of mediaRequests) requestCounts.set(u, (requestCounts.get(u) ?? 0) + 1);

  const pairs = await page.evaluate((chapterId) => {
    const cards = [...document.querySelectorAll(`#${chapterId} ol.room-stack > li.room-card`)];
    const panels = [...document.querySelectorAll(`#${chapterId} .room-gallery`)];
    return panels.map((panel, i) => {
      const cardImg = cards[i] ? cards[i].querySelector("img") : null;
      const panelImg = panel.querySelector("img");
      return {
        id: panel.id,
        cardSrc: cardImg ? cardImg.currentSrc : null,
        panelSrc: panelImg ? panelImg.currentSrc : null,
        naturalWidth: panelImg ? panelImg.naturalWidth : 0,
      };
    });
  }, route.chapterId);

  const assertion1Rows = pairs.map((p) => ({
    ...p,
    sharedWithCard: p.naturalWidth === 0 ? null : p.panelSrc === p.cardSrc,
    requestCount: p.panelSrc ? (requestCounts.get(p.panelSrc) ?? 0) : 0,
  }));
  combo.assertion1 = { afterFullPageScroll: assertion1Rows };

  if (pairs.length !== n) {
    note(label, `assertion 1: expected ${n} gallery panels, found ${pairs.length}`);
  }
  for (const row of assertion1Rows) {
    if (row.naturalWidth === 0) continue; // the clean, unambiguous case
    if (row.sharedWithCard && row.requestCount === 1) continue; // proven free reuse
    if (!row.sharedWithCard) {
      note(
        label,
        `assertion 1: panel "${row.id}" has naturalWidth ${row.naturalWidth} before being opened, and its ` +
          `resolved image ("${row.panelSrc}") is NOT the same file its own card is showing ("${row.cardSrc}") — ` +
          "this is an independent load, not shared-cache reuse",
      );
    } else {
      note(
        label,
        `assertion 1: panel "${row.id}" shares its card's file ("${row.panelSrc}") but that URL was requested ` +
          `${row.requestCount} times, not once — a genuinely independent fetch happened for the closed panel`,
      );
    }
  }
  const stillLoading = assertion1Rows.filter(
    (r) => r.naturalWidth !== 0 && !(r.sharedWithCard && r.requestCount === 1),
  );

  // Back to the top before the interaction sequence — a deterministic
  // starting point for the trigger's own scroll-into-view.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);

  // --------------------------------------------------------- assertion 2
  const hasTrigger = found > 0;
  const trigger0 = page.locator(triggerSel).nth(0);
  /**
   * Click room 0's trigger, defensively. Sabotage (a) — removing
   * `popoverTarget` from the trigger — makes `triggerSel` match NOTHING, and
   * a Playwright `Locator` action against zero matches waits (and times out
   * after its own internal 30s default) rather than failing fast, which
   * would hang this whole rig rather than reporting a clean failure. Checked
   * with `hasTrigger` (computed once, from the DOM count taken above) before
   * ever touching the locator.
   */
  async function clickTrigger0() {
    if (!hasTrigger) return false;
    await scrollTriggerIntoView(page, trigger0);
    try {
      await trigger0.click({ timeout: CLICK_TIMEOUT });
      return true;
    } catch {
      return false;
    }
  }

  const clickedTrigger0 = await clickTrigger0();
  await page.waitForTimeout(150);

  const opened0 = await page.evaluate((id) => {
    const el = document.getElementById(id);
    return el ? el.matches(":popover-open") : false;
  }, panel0);
  if (!clickedTrigger0) {
    note(label, `assertion 2: clicking room 0's trigger failed/timed out`);
  }
  if (!opened0) {
    note(label, `assertion 2: clicking room 0's trigger did not open panel "${panel0}"`);
  }

  const minWidth = width * 0.4;
  const loaded = await page
    .waitForFunction(
      ({ id, minW }) => {
        const el = document.getElementById(id);
        const img = el ? el.querySelector("img") : null;
        if (!img || !(img.naturalWidth > 0)) return null;
        const box = img.getBoundingClientRect();
        if (!(box.width >= minW)) return null;
        return { naturalWidth: img.naturalWidth, width: box.width };
      },
      { id: panel0, minW: minWidth },
      { timeout: CLICK_TIMEOUT },
    )
    .then((h) => h.jsonValue())
    .catch(() => null);

  let lastRead = loaded;
  if (!loaded) {
    lastRead = await page.evaluate((id) => {
      const el = document.getElementById(id);
      const img = el ? el.querySelector("img") : null;
      if (!img) return { naturalWidth: 0, width: 0 };
      const box = img.getBoundingClientRect();
      return { naturalWidth: img.naturalWidth, width: box.width };
    }, panel0);
    note(
      label,
      `assertion 2: panel "${panel0}"'s img did not reach naturalWidth>0 AND rendered width>=${minWidth.toFixed(1)}px ` +
        `within 5s — last read naturalWidth=${lastRead.naturalWidth}, width=${lastRead.width.toFixed(1)}`,
    );
  }
  combo.assertion2 = { clickedTrigger0, panelOpened: opened0, minWidth, ...lastRead };

  // --------------------------------------------------------- assertion 3
  //
  // Each panel's own nav row is its second (and only other) child —
  // `<figure>` then a `<div>` holding [previous?, next?, close] in that DOM
  // order (RoomCardStack.tsx). For n > 1 (both routes) that's exactly
  // [previous, next, close] — read structurally, not by button text, so a
  // copy change to SITE.roomGallery can never desync this rig from the
  // markup.
  //
  // **This assertion is written exactly as specified and MEASURED to fail on
  // the current, already-shipped, already-code-reviewed build — 14 Aug 2026,
  // this task.** Not a rig bug: confirmed with a minimal, isolated two-popover
  // HTML fixture outside this codebase before trusting it. The mechanism is
  // the HTML Popover API's own "topmost popover ancestor" rule: when an
  // invoker button is itself a DESCENDANT of the auto popover it is about to
  // replace, the browser treats the newly-shown popover as NESTED inside that
  // ancestor rather than replacing it, and does not close it — this is
  // intentional spec behaviour (it is what lets a button inside a popover
  // open a submenu without closing its own parent). RoomCardStack.tsx's
  // "next"/"previous" buttons are rendered INSIDE their own panel
  // (`<div popover="auto">…<button popovertarget={neighbour}>`), so clicking
  // "next" opens the neighbour ON TOP of, not INSTEAD of, the current panel —
  // both remain `:popover-open` simultaneously. The isolated fixture that
  // proved this: two sibling `[popover=auto]` divs; a button INSIDE the first
  // targeting the second nests (both end up open); the IDENTICAL markup with
  // the invoking button moved OUTSIDE both popovers replaces cleanly (only
  // the second stays open) — confirming both the mechanism and that a fix is
  // possible in principle. Both the ORIGINAL SPEC
  // (`docs/superpowers/specs/2026-08-13-image-sizing-design.md` §3: "popover
  // `auto` guarantees at most one open panel — opening the neighbour closes
  // the current one, which *is* the navigation") and `RoomCardStack.tsx`'s
  // own code comment assert the premise this measurement disproves.
  //
  // Consequences beyond this assertion's own three checks: Esc (assertion 4)
  // and light-dismiss (assertion 5) each only close the TOPMOST popover in
  // the nested stack, so a visitor who has stepped through more than one room
  // needs one Escape / outside-click PER accumulated panel to actually leave
  // the gallery, not one. A screenshot taken mid-repro also shows the covered
  // panel's own text peeking out from behind the top one's edges (both boxes
  // are independently centred, near-but-not-exactly the same size).
  //
  // **Not fixed here.** `components/sections/RoomCardStack.tsx` is not in
  // this task's file list, and the fix that actually works (verified above:
  // move "next"/"previous" outside the popover's own DOM) changes how the
  // nav row is laid out and sized — the panel is currently `width:
  // fit-content` up to its `max-width` cap, sized BY the photograph, and an
  // external control row would need to be independently made to match that
  // width (CSS anchor positioning, or a different visual treatment such as
  // edge-pinned chevrons) — a real design change needing its own review, not
  // a same-task patch. Left failing, honestly, per this project's own rule
  // against weakening an assertion to make a page pass — see the report.
  const navCount = await page.evaluate((id) => {
    const panel = document.getElementById(id);
    if (!panel) return 0;
    const nav = panel.querySelector(":scope > div");
    return nav ? nav.querySelectorAll("button").length : 0;
  }, panel0);
  combo.assertion3 = { navButtonCount: navCount, steps: [] };

  if (navCount !== 3) {
    note(label, `assertion 3: panel "${panel0}"'s nav row has ${navCount} buttons, expected 3 (previous, next, close)`);
  } else if (!opened0) {
    note(label, `assertion 3: skipped — panel 0 never opened (assertion 2 already failed), navigation cannot be exercised`);
  } else {
    // Walk forward with "next" from panel 0. n clicks should land back at
    // panel 0 — n-1 ordinary steps plus the wrap from the LAST panel. Each
    // click is bounded and the walk stops the moment the DOM state diverges
    // from what "next" should have done, rather than trusting the tracked
    // index and risking a click on a panel that never actually opened
    // (which would otherwise hang on Playwright's own actionability wait).
    let current = 0;
    let chainBroken = false;
    for (let step = 0; step < n; step++) {
      const fromId = panelId(route.chapterId, current);
      let clicked = true;
      try {
        await page.locator(`#${fromId} > div button`).nth(1).click({ timeout: CLICK_TIMEOUT });
      } catch {
        clicked = false;
      }
      await page.waitForTimeout(150);
      const expectedNext = (current + 1) % n;
      const open = await openPanels(page);
      combo.assertion3.steps.push({ clicked: "next", from: current, clickSucceeded: clicked, open });
      const wantId = panelId(route.chapterId, expectedNext);
      if (!clicked) {
        note(label, `assertion 3: clicking "next" inside panel ${current} failed/timed out`);
      }
      if (!open.includes(wantId)) {
        note(
          label,
          `assertion 3: "next" from panel ${current} did not open panel ${expectedNext} — open: ` +
            `[${open.join(", ") || "(none)"}]`,
        );
      }
      if (open.includes(fromId)) {
        note(label, `assertion 3: panel ${current} still matches :popover-open after "next" was clicked`);
      }
      if (open.length > 1) {
        note(
          label,
          `assertion 3: more than one panel open at once — [${open.join(", ")}] — popover="auto" should ` +
            "guarantee at most one",
        );
      }
      if (open.length === 1 && open[0] === wantId) {
        current = expectedNext;
      } else {
        chainBroken = true;
        note(
          label,
          `assertion 3: navigation chain broke at step ${step} (from panel ${current}) — stopped walking ` +
            "forward rather than clicking a panel that may not actually be open",
        );
        break;
      }
    }
    if (!chainBroken && current !== 0) {
      note(label, `assertion 3: after ${n} "next" clicks from panel 0, expected to be back at panel 0, landed at ${current}`);
    }
  }

  // "previous" wrap test — independent of the forward walk above (which may
  // have broken under sabotage, and — see assertion 3's own finding above —
  // may have left MORE THAN ONE panel open, which a single Escape cannot
  // fully clear): close everything, re-open panel 0 directly via its own
  // trigger, then test "previous" from there.
  await closeAllPanels(page);
  await clickTrigger0();
  await page.waitForTimeout(150);
  const beforePrev = await openPanels(page);
  if (beforePrev.includes(panel0) && navCount === 3) {
    let prevClicked = true;
    try {
      await page.locator(`#${panel0} > div button`).nth(0).click({ timeout: CLICK_TIMEOUT });
    } catch {
      prevClicked = false;
    }
    await page.waitForTimeout(150);
    const afterPrev = await openPanels(page);
    const lastId = panelId(route.chapterId, n - 1);
    combo.assertion3.previousFromZero = { clicked: prevClicked, open: afterPrev };
    if (!prevClicked) {
      note(label, `assertion 3: clicking "previous" inside panel 0 failed/timed out`);
    }
    if (!afterPrev.includes(lastId)) {
      note(
        label,
        `assertion 3: "previous" from panel 0 did not wrap to the last panel (${lastId}) — open: ` +
          `[${afterPrev.join(", ") || "(none)"}]`,
      );
    }
    if (afterPrev.includes(panel0)) {
      note(label, `assertion 3: panel 0 still matches :popover-open after "previous" was clicked`);
    }
  } else if (navCount === 3) {
    combo.assertion3.previousFromZero = { skipped: true, beforePrev };
    note(label, `assertion 3: could not re-open panel 0 to test "previous" wraparound (see assertion 2's trigger failure)`);
  }

  // --------------------------------------------------------- assertion 4
  //
  // A real Escape keypress — the UA's own light-dismiss path, not
  // `hidePopover()`. Deliberately isolated from assertion 3's own state: the
  // brief's own wording ("press Escape") tests a single, freshly-opened
  // panel, not whatever the arrows' nesting (assertion 3's finding) may have
  // left behind — reset to nothing-open first, then open panel 0 fresh via
  // its own trigger, exactly the state the brief describes.
  await closeAllPanels(page);
  await clickTrigger0();
  await page.waitForTimeout(200);
  const openBeforeEsc = await openPanels(page);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const afterEsc = await openPanels(page);
  combo.assertion4 = { openBeforeEsc, afterEsc };
  if (openBeforeEsc.length === 0) {
    note(label, `assertion 4: no panel was open to test Escape against`);
  }
  if (afterEsc.length > 0) {
    note(label, `assertion 4: Escape did not close every panel — still open: [${afterEsc.join(", ")}]`);
  }

  // --------------------------------------------------------- assertion 5
  //
  // The brief's own fixed point — `(8, viewportHeight/2)` — was tried FIRST,
  // and measurement disproves the assumption behind it: the panel's `margin:
  // auto` (the UA popover stylesheet's own centring rule) is being overridden
  // by Tailwind's preflight `* { margin: 0 }` reset (an author-origin style,
  // which wins over a UA-origin one regardless of selector specificity), so
  // `.room-gallery` renders pinned to the viewport's top-left corner —
  // `getBoundingClientRect()` reads `{left:0, top:0}` at every shape tried —
  // rather than centred. At 390 the panel happens to be short enough that
  // `(8, 422)` genuinely lands below it; at 1440 the panel is 1103x841 from
  // the same corner and `(8, 450)` lands INSIDE it — confirmed directly with
  // `document.elementFromPoint`, which returned the panel itself. This is a
  // second, independent, real defect (see `knownDefects[1]` below) — but it
  // means a FIXED probe point cannot be trusted to test the light-dismiss
  // MECHANISM in isolation, so this now measures the panel's own live
  // geometry and picks a point PROVEN outside it (verified with
  // `elementFromPoint` before ever clicking), which is what assertion 5 is
  // actually meant to exercise. Same isolation as assertion 4: a fresh single
  // panel, not assertion 3's leftover state.
  await closeAllPanels(page);
  await clickTrigger0();
  await page.waitForTimeout(200);
  const openBeforeDismiss = await openPanels(page);

  const probe = await page.evaluate(
    ({ id, vw, vh }) => {
      const panel = document.getElementById(id);
      const r = panel ? panel.getBoundingClientRect() : { left: 0, top: 0, right: 0, bottom: 0 };
      const candidates = [
        [8, Math.round(r.bottom + Math.min(20, (vh - r.bottom) / 2))], // below the panel
        [Math.round(r.right + Math.min(20, (vw - r.right) / 2)), 8], // right of the panel
        [8, Math.round(vh / 2)], // the brief's own point, as a last resort
      ];
      for (const [x, y] of candidates) {
        if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
        const hit = document.elementFromPoint(x, y);
        if (!hit || !hit.closest(".room-gallery")) return { point: [x, y], confirmedOutside: true };
      }
      return { point: candidates[0], confirmedOutside: false };
    },
    { id: panel0, vw: width, vh: height },
  );

  if (!probe.confirmedOutside) {
    note(
      label,
      `assertion 5: could not find a point provably outside panel "${panel0}" at ${width}x${height} — the ` +
        "panel may occupy the whole viewport at this shape",
    );
  }
  await page.mouse.click(probe.point[0], probe.point[1]);
  await page.waitForTimeout(200);
  const afterDismiss = await openPanels(page);
  combo.assertion5 = { openBeforeDismiss, afterDismiss, point: probe.point, confirmedOutside: probe.confirmedOutside };
  if (openBeforeDismiss.length === 0) {
    note(label, `assertion 5: no panel was open to test light-dismiss against`);
  }
  if (afterDismiss.length > 0) {
    note(
      label,
      `assertion 5: a click at (${probe.point[0]}, ${probe.point[1]}), measured outside the panel, did not ` +
        `dismiss every panel — still open: [${afterDismiss.join(", ")}]`,
    );
  }

  console.log(
    `${label.padEnd(16)} triggers=${found}/${n} a1(lazy)=${stillLoading.length === 0} ` +
      `a2(open)=${opened0} a3(nav)=${navCount === 3} a4(esc)=${afterEsc.length === 0} ` +
      `a5(dismiss)=${afterDismiss.length === 0}`,
  );

  await context.close();
  return combo;
}

async function runNoJs(browser, route, width, height) {
  const label = `${route.label}@${width}x${height} (no-JS)`;
  const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: false });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(`${BASE}${route.path}`, { waitUntil: "load" });
  await page.waitForTimeout(1200);

  const stackHeight = await page.evaluate((chapterId) => {
    const ol = document.querySelector(`#${chapterId} ol.room-stack`);
    return ol ? ol.getBoundingClientRect().height : 0;
  }, route.chapterId);
  const triggerCount = await page.evaluate(
    (chapterId) => document.querySelectorAll(`#${chapterId} ol.room-stack button[popovertarget]`).length,
    route.chapterId,
  );

  const beforeScroll = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(300);
  const afterScroll = await page.evaluate(() => window.scrollY);

  const result = {
    route: route.label,
    path: route.path,
    width,
    height,
    stackHeight,
    triggerCount,
    scrolled: afterScroll !== beforeScroll,
    pageErrors,
    consoleErrors,
  };

  if (!(stackHeight > 0)) {
    note(label, `assertion 6: ol.room-stack rendered with 0 height without JS — the stack did not lay out`);
  }
  if (triggerCount !== route.expectedRooms) {
    note(
      label,
      `assertion 6: expected ${route.expectedRooms} trigger buttons without JS, found ${triggerCount} — ` +
        "the trigger buttons are server-rendered markup and must exist regardless of scripting",
    );
  }
  if (!result.scrolled) {
    note(label, `assertion 6: the page did not scroll without JS (scrollY stayed at ${beforeScroll})`);
  }
  if (pageErrors.length > 0) {
    note(label, `assertion 6: ${pageErrors.length} page error(s) without JS — ${pageErrors.join(" | ")}`);
  }
  if (consoleErrors.length > 0) {
    note(label, `assertion 6: ${consoleErrors.length} console error(s) without JS — ${consoleErrors.join(" | ")}`);
  }

  console.log(
    `${label.padEnd(24)} stackHeight=${stackHeight.toFixed(0)}px triggers=${triggerCount}/${route.expectedRooms} ` +
      `scrolled=${result.scrolled} errors=${pageErrors.length + consoleErrors.length}`,
  );

  await context.close();
  return result;
}

const browser = await chromium.launch();

// ------------------------------------------------------------- warm the server
// Catalogued elsewhere on this project (`check_welcome.mjs`, `check_plates.mjs`):
// the first navigation after `next start` can take several seconds to compile,
// long enough that a sample taken against it lands mid-compile rather than on
// the page a visitor sees. One throwaway navigation per route first.
for (const route of ROUTES) {
  const warm = await browser.newContext();
  const warmPage = await warm.newPage();
  await warmPage.goto(`${BASE}${route.path}`, { waitUntil: "load" });
  await warm.close();
}

const report = {
  measuredAt: new Date().toISOString(),
  url: BASE,
  method:
    "Real Chromium, production build. Assertions 1-5 drive the popover through the same paths a " +
    "visitor uses (Playwright's own .click(), page.keyboard.press('Escape'), page.mouse.click(x,y)) " +
    "and read `naturalWidth` / `:popover-open` off the live DOM — never `hidePopover()`/`showPopover()`. " +
    "Assertion 6 asserts ABSENCE of breakage without JavaScript, not that panels open.",
  combos: [],
  noJs: [],
  watchedFailing: {},
  knownDefects: [
    {
      id: "nested-popover-arrows",
      found: "2026-08-14",
      summary:
        "The gallery's \"next\"/\"previous\" arrows nest rather than replace: clicking \"next\" opens the " +
        "neighbouring panel WITHOUT closing the current one, because both buttons live inside the panel " +
        "they navigate away from, and the HTML Popover API's own \"topmost popover ancestor\" rule treats " +
        "a popover invoked from inside another open popover as nested rather than a replacement.",
      confirmedBy:
        "An isolated two-popover HTML fixture outside this codebase, run in the same Chromium: an invoker " +
        "INSIDE its sibling popover nests (both stay open); the identical markup with the invoker moved " +
        "OUTSIDE both popovers replaces cleanly. Also reproduces on the real page with a full-page " +
        "screenshot showing the covered panel's own text peeking out from behind the top one's edges.",
      consequences:
        "Assertions 3, 4 and 5 fail on the current, unmodified, already-shipped build for this reason: " +
        "panel 0 never closes when \"next\" is clicked (assertion 3); Escape and a light-dismiss click " +
        "each only close the TOPMOST nested panel, so stepping through more than one room needs one " +
        "Escape/outside-click per accumulated panel to fully leave the gallery, not one (assertions 4, 5).",
      wronglyClaimedBy: [
        "docs/superpowers/specs/2026-08-13-image-sizing-design.md §3 (\"popover `auto` guarantees at most " +
          "one open panel — opening the neighbour closes the current one, which *is* the navigation\")",
        "components/sections/RoomCardStack.tsx's own code comment (\"Because every panel is popover=\\\"auto\\\", " +
          "the UA guarantees at most one such popover open — so invoking the neighbour's popover closes " +
          "the current one as a side effect\")",
      ],
      notFixedHere:
        "components/sections/RoomCardStack.tsx is outside this task's file list, and the working fix " +
        "(move the invoking buttons outside the popover's own DOM) needs a real layout change — the panel " +
        "is width:fit-content, sized by the photograph, and an external control row needs its own " +
        "mechanism (CSS anchor positioning, or a different visual treatment) to match that width without " +
        "JavaScript. Left failing rather than weakened — see task-7-report.md.",
    },
    {
      id: "gallery-panel-not-centred",
      found: "2026-08-14",
      summary:
        "The gallery panel does not centre itself. getBoundingClientRect() reads {left:0, top:0} at every " +
        "shape tried — the HTML Popover API's own UA stylesheet centres a popover via `margin: auto`, but " +
        "Tailwind's preflight (`* { margin: 0 }`) is an author-origin rule and wins over a UA-origin one " +
        "regardless of selector specificity, zeroing that margin out. The panel renders pinned to the " +
        "viewport's top-left corner, sized to its own content (the photograph), rather than centred.",
      confirmedBy:
        "Direct getComputedStyle(panel).margin === \"0px\" at both 390x844 and 1440x900, with the panel's " +
        "own rect confirming {left:0, top:0} in both cases (1440x900: 1103x841 from the corner; 390x844: " +
        "358.8x395.8 from the corner).",
      consequences:
        "Purely cosmetic at narrow viewports where the panel is small relative to the screen (390: the gap " +
        "below/right of the panel is large enough that the brief's own fixed light-dismiss point still " +
        "landed outside it by chance), but at 1440x900 the panel covers over half the screen from the " +
        "corner rather than presenting as a centred lightbox — which is also why the brief's fixed " +
        "(8, 450) light-dismiss point landed INSIDE the panel there, not outside it as assumed. Assertion " +
        "5 in this rig now measures the panel's own live geometry and picks a point proven outside it " +
        "(see its own comment) so it tests the dismiss mechanism rather than this defect.",
      wronglyClaimedBy: [
        "This task's own brief, assertion 5's own reasoning: \"the panel's max-width: min(92vw, 96rem) " +
          "with margin: auto centring (the UA's own popover default) always leaves at least 4vw clear on " +
          "each side\" — the margin:auto half of that premise does not hold on this build.",
      ],
      notFixedHere:
        "app/globals.css's `.room-gallery` rule and Tailwind's own preflight are both outside this task's " +
        "file list. The likely fix is a one-line `margin: auto;` added to `.room-gallery` (author-origin, " +
        "so it would win back the centring Tailwind's reset removed) but that is a visual change on " +
        "already-shipped, already-reviewed markup and needs its own verification pass, not a same-task " +
        "patch — see task-7-report.md.",
    },
  ],
};

for (const route of ROUTES) {
  for (const [width, height] of SHAPES) {
    report.combos.push(await runRouteShape(browser, route, width, height));
  }
}
for (const route of ROUTES) {
  for (const [width, height] of SHAPES) {
    report.noJs.push(await runNoJs(browser, route, width, height));
  }
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
