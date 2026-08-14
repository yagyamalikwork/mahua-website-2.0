// The room gallery — `.room-gallery` CSS `:target` panels, wired by
// `RoomCardStack.tsx`/`RoomCard.tsx` — in a real browser, on both properties.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_room_gallery.mjs
//   node scripts/check_room_gallery.mjs --port 3100 --out docs/reviews/2026-08-13-image-sizing/gallery.json
//
// **Second mechanism, same file, same purpose.** The gallery shipped first as
// native HTML popovers (Task 6), and this rig's own first version measured —
// not assumed — the deferred-image claim code review flagged and found it
// true, but also found, unasked, that the "next"/"previous" arrows do NOT
// close the panel they navigate away from: the HTML Popover API's own
// "topmost popover ancestor" rule treats a popover invoked from a button
// INSIDE another open popover as NESTED rather than a replacement, and the
// arrows have to live inside their own panel to sit beside its own figure.
// Confirmed with an isolated two-popover fixture outside this codebase before
// it was trusted — the full reconstruction is in this task's own report
// (`.superpowers/sdd/2026-08-13-image-sizing/task-7-report.md`) and in
// `docs/DECISIONS.md` §18; `docs/reviews/2026-08-13-image-sizing/README.md`
// does NOT exist as of this fix (Task 8 writes it) — cited here only once it
// does, not as a dangling pointer a reader chases and doesn't find. A second,
// independent finding from the same measurement pass: the panel was never
// actually centred either — Tailwind's own preflight (`* { margin: 0 }`)
// defeated the popover UA stylesheet's `margin: auto`.
//
// Both are fixed now by switching the mechanism to CSS `:target`
// (`RoomCardStack.tsx`, `app/globals.css` — read both files' own comments for
// the mechanism), which cannot nest BY CONSTRUCTION: `location.hash` is one
// string, so at most one element in the whole document can ever match
// `:target`. This rig is rewritten to match — every assertion below is new or
// substantially changed, not patched.
//
// **What the new mechanism does NOT give back, in full — two separate costs,
// not one.**
//
// (1) `:target` has no Escape key. Popover's Esc-to-close was UA behaviour,
// free; `:target` is a URL/CSS mechanism with no keyboard binding, and adding
// one back would need a `keydown` listener — script this construction
// deliberately carries none of. The OLD assertion 4 ("Esc closes") is gone,
// not silently — replaced with an assertion that the CLOSE CONTROL and the
// LIGHT-DISMISS BACKDROP each genuinely work. A visitor without a mouse can
// still reach either by Tab then ENTER — an `<a href>` activates on Enter
// ONLY, Space scrolls the page rather than activating it, said precisely
// because an earlier draft of this comment said "Enter/Space" and that is
// wrong. What's gone is a single Esc keypress from anywhere.
//
// (2) Closing does not return focus. The popover version's hide algorithm
// restored focus to the invoker (UA behaviour, free); `:target` has nothing
// equivalent — closing navigates to a fragment matching no element, so no
// HTML "focusing steps" run, and the previously-focused link (now inside a
// `display: none` subtree) is dropped by the browser to `<body>`. A keyboard
// visitor who opens a room and closes it restarts Tab from the top of the
// page. Not asserted pass/fail (the fix needs a listener this construction
// deliberately has none of) but measured: assertion 4 reads
// `document.activeElement` after the close control fires, the same way
// assertion 2 already does after opening.
//
// **A genuine, arguably-a-feature side effect, measured three deep rather
// than extrapolated from one step:** every fragment navigation is a real
// history entry, so the browser's own Back button steps back through opened
// rooms. Confirmed by opening three rooms in sequence and pressing Back three
// times, on both routes — see `backButtonDeep` below — not asserted pass/fail
// (a property of the mechanism, not a requirement either construction was
// ever asked to meet), but no longer resting on a single sample either.
//
// **A collision the mechanism change made newly reachable: the welcome
// screen.** `:target` applies on first paint, so a page loaded with a room's
// own fragment already in the URL opens that panel before `WelcomeScreen`
// has finished its ~2.1s hold. `checkWelcomeCollision` (below) loads exactly
// that URL shape and measures what is actually painted mid-hold, not just
// the z-index numbers on paper — see its own comment and `app/globals.css`'s
// `.room-gallery` for the fix (`z-index: 60`, deliberately below the
// welcome's `90` and above every persistent-chrome value on the page).
//
// **Every arrow/close link is selected by ACCESSIBLE NAME now, read live
// from `content/site.ts`** (`COPY`/`navLink`, below) — not by position
// (`.nth(0)`/`.nth(1)`/`.last()`, this rig's own first draft), so a reorder
// of the control row cannot leave this rig silently testing a different
// control than the one whose label a visitor actually reads.
//
// House boilerplate (flags, `note()`, JSON out, exit code) modelled on
// `scripts/check_card_stack.mjs`. Routes `/mahua-vann` (3 rooms) and
// `/mahua-tola` (4), at 1440x900 and 390x844.
//
// Assertions, each labelled below and in the code:
//
//   1. Lazy until asked: after a full-page scroll (every card seen), every
//      `.room-gallery img` still has naturalWidth === 0 — UNLESS its
//      resolved file is byte-identical to its own card's file (shared-cache
//      reuse — see the long comment at this assertion's own site) and that
//      shared URL was requested exactly once. Browser truth, corroborated by
//      the network log where the brief allows it, never assumed.
//   2. Click opens: click the first card's trigger link; exactly ONE
//      `.room-gallery` is visible (computed `display !== "none"`, not merely
//      `:target` — see assertion 3's own note on why that distinction
//      matters), its own; its img reaches naturalWidth > 0 AND a rendered
//      width >= 40% of the viewport within 5s; focus lands on the panel
//      itself (`tabindex="-1"`'s whole reason to exist); `window.scrollY`
//      does not move. Also measures the panel's own box for horizontal
//      overflow (`scrollWidth` vs `clientWidth` — Minor 6, fixed in
//      `app/globals.css`).
//   3. Arrows are navigation, and EXACTLY ONE PANEL IS EVER VISIBLE — the one
//      assertion this whole fix exists to satisfy. Walking forward with
//      "next" from panel 0 through a full wraparound (n clicks, ending back
//      at panel 0) and separately testing "previous" from panel 0 wrapping to
//      the last panel, every single step checks: the expected panel is
//      visible, EVERY OTHER PANEL IS NOT (computed display, not `:target` —
//      `:target` itself is a browser-native, always-exactly-one guarantee
//      that could not have caught the popover bug OR the CSS-authoring bug
//      this rig's own sabotage (d) introduces; checking rendered visibility
//      is what actually proves the fix), and `window.scrollY` does not move.
//   4. The close control works: click the close link; nothing is visible.
//      Replaces the old "Esc closes" — Esc is not supported by this
//      construction; see the header note above for why, stated plainly
//      rather than a quietly deleted assertion. Also reads
//      `document.activeElement` afterward — the focus-loss cost above,
//      measured rather than only described in prose.
//   5. Light dismiss via the real backdrop: the backdrop is now a genuine,
//      addressable DOM element (`.room-gallery-backdrop`, a full-viewport
//      `<a>`), not a blind "click somewhere and hope" point. Click a point
//      measured (via `elementFromPoint`) to land on the backdrop specifically
//      — not guessed — then confirm nothing is visible.
//   6. Absence, not breakage, without JS — AND, because `:target` is pure
//      HTML/CSS with no script dependency at all (unlike `popover`, which
//      still needed native UA support for the invoker attributes), this rig
//      also proves a panel genuinely OPENS under `javaScriptEnabled: false`,
//      not merely that nothing errors. A real capability the new mechanism
//      gives that the old one couldn't promise, proven rather than assumed.
//
// Plus two checks outside the six, run once per route/shape but not folded
// into the numbering above: `backButtonDeep` (three opens, three Back
// presses, per route — see above) and `checkWelcomeCollision` (the welcome
// screen, per route/shape — see its own comment).
//
// Real user paths only: every click goes through Playwright's own
// `Locator.click()` / `page.mouse.click(x, y)`, which dispatch real pointer
// events — never `location.hash = "..."` set directly, which would test the
// URL API instead of the behaviour a visitor gets from clicking a link.
//
// **Watched failing, five ways, every time recorded in `report.watchedFailing`
// below** (not only in this task's own report, which `.gitignore` excludes
// from the repo — the JSON this script writes is the one copy that survives
// a clone): (a) the trigger's `href` removed, (b) the panel's `Photo` given
// `priority`, (c) every "next" mis-pointed at panel 0, (d) `.room-gallery`'s
// own `display: none` default removed, (e) `position: fixed` dropped from
// `.room-gallery`. Each rebuilt, measured, reverted with a targeted `Edit`
// (never `git checkout --` on a file carrying other uncommitted work — see
// the report for the mistake that taught this) and confirmed via `git diff`
// before the next arm.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * `SITE.roomGallery`'s four labels, read out of `content/site.ts` rather than
 * hand-copied here — the same discipline `check_image_resolution.mjs`'s
 * `readDensityCap()` uses for `lib/sizes.ts`. This is what lets the arrows be
 * selected by ACCESSIBLE NAME (`navLink`, below) instead of position
 * (`.nth(0)`/`.nth(1)`/`.last()`, this rig's own earlier shape): a hand-typed
 * copy of the strings would silently drift the moment a copywriter changed
 * `content/site.ts` and nobody touched this file, which is exactly the "read
 * back what you were given, not what is actually there" trap this project
 * keeps a catalogue of. Reading the real file means a reorder of the control
 * row — previous/next/close rendered in a different order — still tests the
 * control the label actually names, rather than silently testing whichever
 * control now happens to sit at that position.
 */
async function readRoomGalleryCopy() {
  const source = await readFile(path.join(ROOT, "content", "site.ts"), "utf8");
  const block = /roomGallery:\s*\{([\s\S]*?)\}/.exec(source)?.[1];
  if (!block) throw new Error("could not find SITE.roomGallery in content/site.ts");
  const get = (key) => {
    const m = new RegExp(`${key}:\\s*"([^"]*)"`).exec(block);
    if (!m) throw new Error(`could not find "${key}:" inside SITE.roomGallery`);
    return m[1];
  };
  return { open: get("open"), previous: get("previous"), next: get("next"), close: get("close") };
}
const COPY = await readRoomGalleryCopy();

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

const SHAPES = [
  [390, 844],
  [1440, 900],
];

const CLICK_TIMEOUT = 5000;

/** `RoomCardStack.tsx`'s own `roomGalleryId` and `ROOM_GALLERY_CLOSED` —
 * re-derived here rather than imported (this is plain Node, not the TS
 * build), same as every other rig that reconstructs a component's id shape
 * from its own comment. */
function panelId(chapterId, i) {
  return `room-gallery-${chapterId}-${i}`;
}
const CLOSED = "room-gallery-closed";

const failures = [];
const note = (label, msg) => failures.push(`${label}: ${msg}`);

const WELCOME_WAIT = 2600;

async function scrollWholePage(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
  });
}

/**
 * The `.room-gallery` panels that are actually RENDERED right now — computed
 * `display !== "none"`, not `.matches(":target")`. This distinction is the
 * whole point of assertion 3 and sabotage (d): `:target` is a browser-native
 * pseudo-class that can only ever match one element at a time BY
 * CONSTRUCTION (`location.hash` is one string), so checking it alone could
 * never have caught the popover version's nesting bug (a different
 * mechanism entirely) NOR could it catch a bug in the CSS THIS rig's own
 * fix depends on — a broken `.room-gallery { display: none }` default (or a
 * missing `:target` selector) would still leave `:target` itself reporting
 * "exactly one," while every panel sat visibly on screen. Checking rendered
 * `display` is what actually proves a visitor sees one panel, not the
 * mechanism's own unfalsifiable guarantee.
 */
async function visiblePanels(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".room-gallery")]
      .filter((el) => getComputedStyle(el).display !== "none")
      .map((el) => el.id),
  );
}

/**
 * A panel's own previous/next/close link, found by its ACCESSIBLE NAME
 * (`COPY.previous`/`COPY.next`/`COPY.close`, read live from `content/site.ts`
 * — see `readRoomGalleryCopy`'s own comment), not by position. Scoped to the
 * one panel's `.room-gallery-box` so a click always lands on THAT panel's own
 * control even if another panel's markup happens to be in the DOM nearby.
 */
function navLink(page, panelIdStr, name) {
  return page.locator(`#${panelIdStr} .room-gallery-box`).getByRole("link", { name });
}

/**
 * Reset to nothing-visible between test phases — by clicking whatever panel's
 * OWN close link is currently showing, a real user action, same as the rest
 * of this rig. `:target` has no Esc to fall back on (the whole reason this
 * exists), and setting `location.hash` directly from script would test the
 * URL API rather than the behaviour a visitor gets, which this rig's own
 * header promises it never does — so the close LINK, clicked for real, is
 * the only honest way to clear state between phases.
 */
async function closeWhatsOpen(page) {
  for (let i = 0; i < 6; i++) {
    const visible = await visiblePanels(page);
    if (visible.length === 0) return;
    try {
      await navLink(page, visible[0], COPY.close).click({ timeout: CLICK_TIMEOUT });
    } catch {
      return;
    }
    await page.waitForTimeout(150);
  }
}

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

async function runRouteShape(browser, route, width, height) {
  const label = `${route.label}@${width}x${height}`;
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const mediaRequests = [];
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/media/")) mediaRequests.push(u);
  });
  await page.goto(`${BASE}${route.path}`, { waitUntil: "load" });
  await page.waitForTimeout(WELCOME_WAIT);

  const n = route.expectedRooms;
  const combo = { route: route.label, path: route.path, width, height };
  // Structural, not `[href]`-scoped — sabotage (a) removes the trigger's
  // `href` value, not the `<a>` element itself, and a Playwright locator
  // matching zero elements hangs for its own 30s default timeout rather than
  // failing fast (learned the hard way against the popover version of this
  // rig, 14 Aug 2026 — see the report). Selecting by position sidesteps that
  // whole class of bug rather than re-guarding against it per call site.
  const triggerSel = `#${route.chapterId} ol.room-stack > li.room-card > :first-child a`;
  const panel0 = panelId(route.chapterId, 0);

  const found = await page.evaluate((sel) => document.querySelectorAll(sel).length, triggerSel);
  if (found !== n) {
    note(label, `expected ${n} gallery triggers, found ${found} — assertions below assume the wrong count`);
  }
  // The close sentinel's own contract, checked on the live page: no element
  // may ever carry this id, or "close" would silently reopen something.
  const sentinelClaimed = await page.evaluate(
    (id) => document.getElementById(id) !== null,
    CLOSED,
  );
  if (sentinelClaimed) {
    note(label, `the close sentinel id "${CLOSED}" is claimed by a real element — every close link would silently reopen it instead of closing`);
  }

  // --------------------------------------------------------- assertion 1
  //
  // Unchanged in mechanism from the popover-era rig's own (corrected)
  // version — a closed panel is `display: none` either way, and the
  // shared-card-tier cache confound is a Chromium in-memory-image-cache
  // behaviour, not specific to which CSS feature is doing the hiding.
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
    if (row.naturalWidth === 0) continue;
    if (row.sharedWithCard && row.requestCount === 1) continue;
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

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);

  // --------------------------------------------------------- assertion 2
  const trigger0 = page.locator(triggerSel).nth(0);
  await scrollTriggerIntoView(page, trigger0);
  const scrollBeforeOpen = await page.evaluate(() => window.scrollY);
  let clickedTrigger0 = true;
  try {
    await trigger0.click({ timeout: CLICK_TIMEOUT });
  } catch {
    clickedTrigger0 = false;
  }
  await page.waitForTimeout(200);
  const scrollAfterOpen = await page.evaluate(() => window.scrollY);

  const visibleAfterOpen = await visiblePanels(page);
  if (!clickedTrigger0) {
    note(label, `assertion 2: clicking room 0's trigger failed/timed out`);
  }
  const opened0 = visibleAfterOpen.length === 1 && visibleAfterOpen[0] === panel0;
  if (!opened0) {
    note(
      label,
      `assertion 2: clicking room 0's trigger did not leave exactly panel "${panel0}" visible — visible: ` +
        `[${visibleAfterOpen.join(", ") || "(none)"}]`,
    );
  }
  if (scrollAfterOpen !== scrollBeforeOpen) {
    note(
      label,
      `assertion 2: opening panel 0 moved window.scrollY from ${scrollBeforeOpen} to ${scrollAfterOpen} — ` +
        "a scroll jump the fixed-position panel should not have caused",
    );
  }
  const activeAfterOpen = await page.evaluate(() => document.activeElement?.id ?? null);
  if (activeAfterOpen !== panel0) {
    note(
      label,
      `assertion 2: focus did not land on panel "${panel0}" after opening (tabindex="-1"'s own purpose) — ` +
        `document.activeElement.id was "${activeAfterOpen}"`,
    );
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
  // **Box overflow (image-sizing Task 7 review, Minor 6) — measured, not
  // reasoned about.** The box's own `max-width` used to be a bare `92vw`
  // while the image inside is `max-w-[88vw]` plus the box's own `3rem` of
  // horizontal padding — arithmetic alone suggested overflow anywhere below
  // ~1200px, but nothing ever read `scrollWidth`. Measured directly instead:
  // `docs/reviews/2026-08-13-image-sizing/` has the real figures (10px at
  // 390×844 on every room, 0px at 768×1024 and 1440×900 — narrower than the
  // arithmetic implied). Fixed in `app/globals.css` (`min(calc(88vw + 3rem),
  // 96rem)`); this check is what re-derives the number on every run rather
  // than trusting the CSS comment to stay true.
  const boxOverflow = await page.evaluate((id) => {
    const box = document.querySelector(`#${id} .room-gallery-box`);
    if (!box) return null;
    return { scrollWidth: box.scrollWidth, clientWidth: box.clientWidth };
  }, panel0);
  const overflowPx = boxOverflow ? boxOverflow.scrollWidth - boxOverflow.clientWidth : null;
  if (boxOverflow === null) {
    note(label, `box overflow: could not find panel "${panel0}"'s own .room-gallery-box to measure`);
  } else if (overflowPx > 1) {
    note(
      label,
      `box overflow: panel "${panel0}"'s box scrolls horizontally by ${overflowPx}px ` +
        `(scrollWidth ${boxOverflow.scrollWidth}px vs clientWidth ${boxOverflow.clientWidth}px)`,
    );
  }

  combo.assertion2 = {
    clickedTrigger0,
    visibleAfterOpen,
    opened0,
    scrollBeforeOpen,
    scrollAfterOpen,
    activeElementId: activeAfterOpen,
    minWidth,
    ...lastRead,
    boxOverflow: { ...boxOverflow, overflowPx },
  };

  // --------------------------------------------------------- assertion 3
  //
  // The one this whole fix exists to satisfy. Every step checks THREE
  // things: the expected panel is the ONLY thing visible (rendered display,
  // not `:target` — see `visiblePanels`'s own comment), and the page has not
  // scrolled.
  combo.assertion3 = { steps: [] };
  let current = 0;
  let chainBroken = false;
  if (!opened0) {
    note(label, `assertion 3: skipped — panel 0 was never the sole visible panel after assertion 2, navigation cannot be exercised`);
    chainBroken = true;
  } else {
    for (let step = 0; step < n; step++) {
      const fromId = panelId(route.chapterId, current);
      const scrollBefore = await page.evaluate(() => window.scrollY);
      let clicked = true;
      try {
        await navLink(page, fromId, COPY.next).click({ timeout: CLICK_TIMEOUT });
      } catch {
        clicked = false;
      }
      await page.waitForTimeout(150);
      const scrollAfter = await page.evaluate(() => window.scrollY);
      const expectedNext = (current + 1) % n;
      const wantId = panelId(route.chapterId, expectedNext);
      const visible = await visiblePanels(page);
      combo.assertion3.steps.push({ clicked: "next", from: current, clickSucceeded: clicked, visible, scrollBefore, scrollAfter });

      if (!clicked) note(label, `assertion 3: clicking "next" inside panel ${current} failed/timed out`);
      if (scrollAfter !== scrollBefore) {
        note(label, `assertion 3: "next" from panel ${current} moved window.scrollY from ${scrollBefore} to ${scrollAfter}`);
      }
      if (visible.length !== 1 || visible[0] !== wantId) {
        note(
          label,
          `assertion 3: after "next" from panel ${current}, expected exactly [${wantId}] visible — got ` +
            `[${visible.join(", ") || "(none)"}]`,
        );
        chainBroken = true;
        break;
      }
      current = expectedNext;
    }
    if (!chainBroken && current !== 0) {
      note(label, `assertion 3: after ${n} "next" clicks from panel 0, expected to be back at panel 0, landed at ${current}`);
    }
  }

  // "previous" wrap test, independent of the forward walk's own end state:
  // close everything, re-open panel 0 via its trigger, test "previous".
  await closeWhatsOpen(page);
  await scrollTriggerIntoView(page, trigger0);
  let reopened = true;
  try {
    await trigger0.click({ timeout: CLICK_TIMEOUT });
  } catch {
    reopened = false;
  }
  await page.waitForTimeout(150);
  const beforePrev = await visiblePanels(page);
  if (reopened && beforePrev.length === 1 && beforePrev[0] === panel0) {
    const scrollBeforePrev = await page.evaluate(() => window.scrollY);
    let prevClicked = true;
    try {
      await navLink(page, panel0, COPY.previous).click({ timeout: CLICK_TIMEOUT });
    } catch {
      prevClicked = false;
    }
    await page.waitForTimeout(150);
    const scrollAfterPrev = await page.evaluate(() => window.scrollY);
    const afterPrev = await visiblePanels(page);
    const lastId = panelId(route.chapterId, n - 1);
    combo.assertion3.previousFromZero = { clicked: prevClicked, visible: afterPrev, scrollBeforePrev, scrollAfterPrev };
    if (!prevClicked) note(label, `assertion 3: clicking "previous" inside panel 0 failed/timed out`);
    if (afterPrev.length !== 1 || afterPrev[0] !== lastId) {
      note(
        label,
        `assertion 3: "previous" from panel 0 did not leave exactly [${lastId}] visible — got ` +
          `[${afterPrev.join(", ") || "(none)"}]`,
      );
    }
    if (scrollAfterPrev !== scrollBeforePrev) {
      note(label, `assertion 3: "previous" from panel 0 moved window.scrollY from ${scrollBeforePrev} to ${scrollAfterPrev}`);
    }
  } else {
    combo.assertion3.previousFromZero = { skipped: true, beforePrev };
    note(label, `assertion 3: could not re-open panel 0 to test "previous" wraparound`);
  }

  // --------------------------------------------------------- assertion 4 — the close control
  //
  // Replaces "Esc closes" (popover-era). `:target` has no Escape key — see
  // this file's own header comment for why that is a deliberate, recorded
  // trade, not a silently dropped guarantee.
  await closeWhatsOpen(page);
  await scrollTriggerIntoView(page, trigger0);
  await trigger0.click({ timeout: CLICK_TIMEOUT }).catch(() => {});
  await page.waitForTimeout(200);
  const openBeforeClose = await visiblePanels(page);
  let closeClicked = true;
  try {
    await navLink(page, panel0, COPY.close).click({ timeout: CLICK_TIMEOUT });
  } catch {
    closeClicked = false;
  }
  await page.waitForTimeout(200);
  const afterClose = await visiblePanels(page);
  // **Measured, not merely asserted about in a comment: focus is NOT
  // returned to the trigger on close.** Closing navigates to
  // `ROOM_GALLERY_CLOSED`, a fragment matching no element, so no HTML
  // "focusing steps" run at all (unlike opening — see assertion 2's own
  // `activeElement` read, which DOES land on the panel, `tabindex="-1"`'s own
  // doing) and the previously-focused link, now inside a `display: none`
  // subtree, is dropped by the browser to `<body>`. This is a real,
  // documented regression from the popover version (whose hide algorithm
  // restored focus to the invoker) — not asserted pass/fail here, because
  // fixing it needs a `keydown`/`focus` listener this construction
  // deliberately has none of, but recorded so the loss is visible in the
  // rig's own output rather than only in a paragraph of prose.
  const activeAfterClose = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName}${el.id ? "#" + el.id : ""}` : null;
  });
  combo.assertion4 = { openBeforeClose, closeClicked, afterClose, activeElementAfterClose: activeAfterClose };
  if (openBeforeClose.length === 0) note(label, `assertion 4: no panel was open to test the close control against`);
  if (!closeClicked) note(label, `assertion 4: clicking the close control failed/timed out`);
  if (afterClose.length > 0) {
    note(label, `assertion 4: the close control did not close every panel — still visible: [${afterClose.join(", ")}]`);
  }

  // --------------------------------------------------------- assertion 5 — light dismiss
  //
  // The backdrop is a real, addressable element now (`.room-gallery-backdrop`)
  // — clicked at a point MEASURED (via `elementFromPoint`) to land on it
  // specifically, not a blind guess at "somewhere outside the box."
  await scrollTriggerIntoView(page, trigger0);
  await trigger0.click({ timeout: CLICK_TIMEOUT }).catch(() => {});
  await page.waitForTimeout(200);
  const openBeforeDismiss = await visiblePanels(page);
  const probe = await page.evaluate(
    ({ id, vw, vh }) => {
      const backdrop = document.querySelector(`#${id} .room-gallery-backdrop`);
      if (!backdrop) return { point: [8, 8], confirmedOutside: false };
      const box = document.querySelector(`#${id} .room-gallery-box`);
      const r = box ? box.getBoundingClientRect() : { left: 0, top: 0, right: 0, bottom: 0 };
      const candidates = [
        [8, Math.round(r.bottom + Math.min(20, (vh - r.bottom) / 2))],
        [Math.round(r.right + Math.min(20, (vw - r.right) / 2)), 8],
        [8, 8],
      ];
      for (const [x, y] of candidates) {
        if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
        const hit = document.elementFromPoint(x, y);
        if (hit === backdrop) return { point: [x, y], confirmedOutside: true };
      }
      return { point: candidates[0], confirmedOutside: false };
    },
    { id: panel0, vw: width, vh: height },
  );
  if (!probe.confirmedOutside) {
    note(label, `assertion 5: could not find a point that resolves to panel "${panel0}"'s own backdrop at ${width}x${height}`);
  }
  await page.mouse.click(probe.point[0], probe.point[1]);
  await page.waitForTimeout(200);
  const afterDismiss = await visiblePanels(page);
  combo.assertion5 = { openBeforeDismiss, afterDismiss, point: probe.point, confirmedOutside: probe.confirmedOutside };
  if (openBeforeDismiss.length === 0) note(label, `assertion 5: no panel was open to test light-dismiss against`);
  if (afterDismiss.length > 0) {
    note(
      label,
      `assertion 5: a click on the backdrop at (${probe.point[0]}, ${probe.point[1]}) did not dismiss every panel — ` +
        `still visible: [${afterDismiss.join(", ")}]`,
    );
  }

  // ------------------------------------------------- back-button, measured three deep
  //
  // A property of `:target`, not a requirement either construction was asked
  // to meet — but measured three deep, not extrapolated from one step. An
  // earlier draft of this rig's own comments (and `RoomCardStack.tsx`'s)
  // claimed "a visitor who has looked at three rooms can back out of them one
  // at a time" from a single measured Back press — exactly the kind of
  // confident, unread claim §2's own catalogue exists to catch. Opens three
  // rooms in sequence (real clicks: the trigger, then "next" twice) and
  // presses Back three times, recording what is visible after each one.
  await closeWhatsOpen(page);
  await scrollTriggerIntoView(page, trigger0);
  await trigger0.click({ timeout: CLICK_TIMEOUT }).catch(() => {});
  await page.waitForTimeout(150);
  if (n >= 3) {
    await navLink(page, panelId(route.chapterId, 0), COPY.next).click({ timeout: CLICK_TIMEOUT }).catch(() => {});
    await page.waitForTimeout(150);
    await navLink(page, panelId(route.chapterId, 1), COPY.next).click({ timeout: CLICK_TIMEOUT }).catch(() => {});
    await page.waitForTimeout(150);
  }
  const openedThreeDeep = await visiblePanels(page);
  const backSteps = [];
  for (let i = 0; i < 3; i++) {
    await page.goBack();
    await page.waitForTimeout(200);
    backSteps.push(await visiblePanels(page));
  }
  combo.backButtonDeep = { openedThreeDeep, backSteps };
  if (n >= 3) {
    const expected = [[panelId(route.chapterId, 1)], [panelId(route.chapterId, 0)], []];
    backSteps.forEach((step, i) => {
      const want = expected[i];
      const match = step.length === want.length && step.every((id, idx) => id === want[idx]);
      if (!match) {
        note(
          label,
          `back-button (3 deep): step ${i + 1} of 3 expected visible [${want.join(", ") || "(none)"}], got ` +
            `[${step.join(", ") || "(none)"}]`,
        );
      }
    });
  } else {
    note(label, `back-button (3 deep): route has fewer than 3 rooms, cannot be exercised`);
  }

  console.log(
    `${label.padEnd(16)} triggers=${found}/${n} a1(lazy)=${assertion1Rows.every((r) => r.naturalWidth === 0 || (r.sharedWithCard && r.requestCount === 1))} ` +
      `a2(open)=${opened0} a3(nav)=${!chainBroken} a4(close)=${afterClose.length === 0} a5(dismiss)=${afterDismiss.length === 0} ` +
      `back3=[${openedThreeDeep.join(",")}]->${backSteps.map((s) => `[${s.join(",")}]`).join("->")}`,
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
  const triggerSel = `#${route.chapterId} ol.room-stack > li.room-card > :first-child a`;
  const triggerCount = await page.evaluate((sel) => document.querySelectorAll(sel).length, triggerSel);

  const beforeScroll = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(300);
  const afterScroll = await page.evaluate(() => window.scrollY);

  // **New, because the new mechanism actually allows it.** `:target` is pure
  // HTML/CSS — no script is involved at any point, unlike `popover`, whose
  // invoker attributes still needed native UA support even though this
  // codebase never wrote a listener for them. So this rig now PROVES a panel
  // opens under `javaScriptEnabled: false`, rather than only proving the page
  // doesn't break — a real capability, measured rather than assumed to carry
  // over from the interactive arm.
  let openedWithoutJs = false;
  let dismissedWithoutJs = false;
  const trigger0 = page.locator(triggerSel).nth(0);
  if (await trigger0.count()) {
    await trigger0.scrollIntoViewIfNeeded().catch(() => {});
    await trigger0.click({ timeout: CLICK_TIMEOUT }).catch(() => {});
    await page.waitForTimeout(300);
    const visible = await visiblePanels(page);
    openedWithoutJs = visible.length === 1 && visible[0] === panelId(route.chapterId, 0);
    if (openedWithoutJs) {
      const closeLink = navLink(page, panelId(route.chapterId, 0), COPY.close);
      await closeLink.click({ timeout: CLICK_TIMEOUT }).catch(() => {});
      await page.waitForTimeout(300);
      const afterClose = await visiblePanels(page);
      dismissedWithoutJs = afterClose.length === 0;
    }
  }

  const result = {
    route: route.label,
    path: route.path,
    width,
    height,
    stackHeight,
    triggerCount,
    scrolled: afterScroll !== beforeScroll,
    openedWithoutJs,
    dismissedWithoutJs,
    pageErrors,
    consoleErrors,
  };

  if (!(stackHeight > 0)) note(label, `assertion 6: ol.room-stack rendered with 0 height without JS — the stack did not lay out`);
  if (triggerCount !== route.expectedRooms) {
    note(
      label,
      `assertion 6: expected ${route.expectedRooms} trigger links without JS, found ${triggerCount} — the trigger ` +
        "links are server-rendered markup and must exist regardless of scripting",
    );
  }
  if (!result.scrolled) note(label, `assertion 6: the page did not scroll without JS (scrollY stayed at ${beforeScroll})`);
  if (!openedWithoutJs) {
    note(label, `assertion 6: clicking the trigger link without JS did not open exactly panel 0 — this mechanism should not need script`);
  }
  if (openedWithoutJs && !dismissedWithoutJs) {
    note(label, `assertion 6: the close link did not close the panel without JS`);
  }
  if (pageErrors.length > 0) note(label, `assertion 6: ${pageErrors.length} page error(s) without JS — ${pageErrors.join(" | ")}`);
  if (consoleErrors.length > 0) note(label, `assertion 6: ${consoleErrors.length} console error(s) without JS — ${consoleErrors.join(" | ")}`);

  console.log(
    `${label.padEnd(24)} stackHeight=${stackHeight.toFixed(0)}px triggers=${triggerCount}/${route.expectedRooms} ` +
      `scrolled=${result.scrolled} openedWithoutJs=${openedWithoutJs} dismissedWithoutJs=${dismissedWithoutJs} ` +
      `errors=${pageErrors.length + consoleErrors.length}`,
  );

  await context.close();
  return result;
}

/**
 * **The welcome-screen collision (image-sizing Task 7 review, Important 4).**
 * `:target` applies on FIRST PAINT — no load event, no script needed — so a
 * page requested with a room's own fragment already in the URL (a reload
 * with a panel open, a bookmarked/copied link, or the browser's own Back
 * into a page that had one open — every open is a real history entry, see
 * the back-button checks above) opens that panel from the very first frame,
 * while `WelcomeScreen` (`app/globals.css`'s `[data-welcome]`, `z-index: 90`,
 * opaque, `fixed inset-0`) is still holding. `.room-gallery`'s own `z-index`
 * used to be `100` — ABOVE the welcome — so that panel would have painted
 * over the welcome intro; fixed to `60`, deliberately below the welcome and
 * above every persistent-chrome value on the page (header/bar `z-40`, menu/
 * grain `z-50`). This loads a route with a room fragment already in the URL
 * and reads what is ACTUALLY PAINTED partway through the welcome's hold —
 * not just the z-index numbers on paper — then confirms the panel is still
 * correctly open once the welcome clears (deep-link-open kept as a real,
 * working capability, not merely "not visually broken").
 *
 * `reducedMotion: "no-preference"` is set explicitly, not left to inherit
 * the host's own setting — `WelcomeScreen`'s own contract is "hidden in its
 * base style, made visible only by the animation" (`lib/motion.ts`), so a
 * reduced-motion context would never show the welcome at all and this check
 * would measure nothing (the same OS-level trap CLAUDE.md's own
 * "Verification" section warns about).
 */
async function checkWelcomeCollision(browser, route, width, height) {
  const label = `${route.label}@${width}x${height} (welcome collision)`;
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "no-preference" });
  const page = await context.newPage();
  const target = panelId(route.chapterId, 0);

  await page.goto(`${BASE}${route.path}#${target}`, { waitUntil: "load" });

  // WELCOME.hold is 1.45s and the fade does not even begin until then
  // (lib/motion.ts) — sampled at 700ms, comfortably inside the hold, before
  // any fade has started.
  await page.waitForTimeout(700);
  // **`elementFromPoint` skips `pointer-events: none` elements — the exact
  // mechanism §2 #21 already catalogued for `measure_density.mjs`, tripped a
  // second time by this rig's own first draft.** `WelcomeScreen` is
  // deliberately `pointer-events-none` (a curtain a click should pass
  // through), so a naive hit-test at the centre skips right past it and
  // reports whatever DOES accept pointer events underneath — which is
  // exactly what this check first measured, and it read as "the welcome is
  // NOT on top" on a build where it demonstrably was (z-index 90 > 60,
  // confirmed separately). Fixed the same way §2 #21 was: the element is
  // switched hit-testable for the instant of the sample, then restored.
  const midHold = await page.evaluate((id) => {
    const welcome = document.querySelector("[data-welcome]");
    const panel = document.getElementById(id);
    const cx = Math.floor(window.innerWidth / 2);
    const cy = Math.floor(window.innerHeight / 2);
    const previousPointerEvents = welcome ? welcome.style.pointerEvents : null;
    if (welcome) welcome.style.pointerEvents = "auto";
    const topmost = document.elementFromPoint(cx, cy);
    if (welcome) welcome.style.pointerEvents = previousPointerEvents;
    return {
      welcomeOpacity: welcome ? Number(getComputedStyle(welcome).opacity) : null,
      welcomeZ: welcome ? Number(getComputedStyle(welcome).zIndex) : null,
      galleryZ: panel ? Number(getComputedStyle(panel).zIndex) : null,
      galleryDisplay: panel ? getComputedStyle(panel).display : null,
      topmostIsWelcomeOrDescendant: welcome ? topmost === welcome || welcome.contains(topmost) : false,
    };
  }, target);

  // Past WELCOME.hold (1.45s) + WELCOME.fade (0.65s) = ~2.1s, with margin.
  await page.waitForTimeout(2000);
  const afterHold = await page.evaluate((welcomeSelector) => {
    const welcome = document.querySelector(welcomeSelector);
    return {
      welcomeOpacity: welcome ? Number(getComputedStyle(welcome).opacity) : null,
      visible: [...document.querySelectorAll(".room-gallery")]
        .filter((el) => getComputedStyle(el).display !== "none")
        .map((el) => el.id),
    };
  }, "[data-welcome]");

  const result = { route: route.label, path: route.path, width, height, target, midHold, afterHold };

  if (midHold.galleryZ === null || midHold.welcomeZ === null) {
    note(label, `welcome collision: could not read both z-index values (welcome=${midHold.welcomeZ}, gallery=${midHold.galleryZ})`);
  } else if (!(midHold.welcomeZ > midHold.galleryZ)) {
    note(
      label,
      `welcome collision: welcome's z-index (${midHold.welcomeZ}) is not above the gallery's (${midHold.galleryZ}) — ` +
        "the panel could paint over the welcome intro",
    );
  }
  if (!midHold.topmostIsWelcomeOrDescendant) {
    note(
      label,
      `welcome collision: at the viewport's centre, mid-hold, the topmost element was NOT the welcome screen — ` +
        `the gallery panel (z-index ${midHold.galleryZ}, display ${midHold.galleryDisplay}) may be painting over it`,
    );
  }
  if (!(afterHold.visible.length === 1 && afterHold.visible[0] === target)) {
    note(
      label,
      `welcome collision: after the welcome's hold, expected exactly [${target}] visible (deep-link-open kept), ` +
        `got [${afterHold.visible.join(", ") || "(none)"}]`,
    );
  }

  console.log(
    `${label.padEnd(30)} midHold: welcomeZ=${midHold.welcomeZ} galleryZ=${midHold.galleryZ} ` +
      `topmostIsWelcome=${midHold.topmostIsWelcomeOrDescendant} | afterHold: visible=[${afterHold.visible.join(",")}]`,
  );

  await context.close();
  return result;
}

/**
 * **The box-overflow band (image-sizing Task 7, second review pass, 14 Aug
 * 2026).** `.room-gallery-box`'s own cap (`app/globals.css`) is WIDER than
 * the old `92vw` below 1200px of viewport width — Minor 6's own fix, and the
 * only range its `10px`-at-390×844 measurement needed closed — but genuinely
 * NARROWER than the old cap between ~1200px and ~1690.9px, solved (not
 * assumed) in that CSS rule's own comment: equal at the two endpoints,
 * narrowest by ~19px around 1670px, 12px narrower at 1500px specifically.
 * Every fixed-shape rig on this project samples 390/768/1440/1920 — never
 * inside that band — so whether anything actually clips there was
 * unmeasured in either direction until now. `1500` is the coordinator's own
 * worked example; sampled here for every room, both routes, real clicks
 * (the trigger, then the close link), not reasoned about a second time.
 */
async function checkBoxOverflowBand(browser, route) {
  const width = 1500;
  const height = 900;
  const label = `${route.label}@${width}x${height} (box overflow band)`;
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(`${BASE}${route.path}`, { waitUntil: "load" });
  await page.waitForTimeout(WELCOME_WAIT);

  const triggerSel = `#${route.chapterId} ol.room-stack > li.room-card > :first-child a`;
  const rows = [];
  for (let i = 0; i < route.expectedRooms; i++) {
    const id = panelId(route.chapterId, i);
    const trigger = page.locator(triggerSel).nth(i);
    await scrollTriggerIntoView(page, trigger);
    await trigger.click({ timeout: CLICK_TIMEOUT }).catch(() => {});
    await page.waitForTimeout(300);
    const measure = await page.evaluate((panelIdStr) => {
      const box = document.querySelector(`#${panelIdStr} .room-gallery-box`);
      if (!box) return null;
      return { scrollWidth: box.scrollWidth, clientWidth: box.clientWidth };
    }, id);
    const overflowPx = measure ? measure.scrollWidth - measure.clientWidth : null;
    rows.push({ room: id, ...measure, overflowPx });
    if (measure === null) {
      note(label, `box overflow band: could not find panel "${id}"'s own .room-gallery-box to measure`);
    } else if (overflowPx > 1) {
      note(
        label,
        `box overflow band: panel "${id}"'s box scrolls horizontally by ${overflowPx}px at 1500x900 ` +
          `(scrollWidth ${measure.scrollWidth}px vs clientWidth ${measure.clientWidth}px) — inside the range ` +
          "app/globals.css's own comment documents as narrower than the pre-fix cap",
      );
    }
    await navLink(page, id, COPY.close).click({ timeout: CLICK_TIMEOUT }).catch(() => {});
    await page.waitForTimeout(150);
  }

  console.log(`${label.padEnd(30)} ${rows.map((r) => `${r.room}:${r.overflowPx}px`).join(" ")}`);

  await context.close();
  return { route: route.label, path: route.path, width, height, rows };
}

const browser = await chromium.launch();

for (const route of ROUTES) {
  const warm = await browser.newContext();
  const warmPage = await warm.newPage();
  await warmPage.goto(`${BASE}${route.path}`, { waitUntil: "load" });
  await warm.close();
}

const report = {
  measuredAt: new Date().toISOString(),
  url: BASE,
  mechanism: ":target — see this file's own header comment for the full history (popover -> :target, 14 Aug 2026)",
  method:
    "Real Chromium, production build. Every assertion drives the page through the same paths a visitor " +
    "uses (Playwright's own .click(), page.mouse.click(x,y)) and reads computed `display` / " +
    "`document.activeElement` / `window.scrollY` off the live DOM — never `location.hash = ...` set " +
    "directly. Assertion 6 additionally proves the mechanism works with javaScriptEnabled:false, not " +
    "only that nothing errors.",
  esc: "NOT supported by this construction — a deliberate trade, not an oversight. Reached from the " +
    "keyboard via Tab then ENTER ONLY (Space scrolls the page, it does not activate a link). See the " +
    "header comment.",
  focusOnClose: "NOT returned to the trigger — closing navigates to a fragment matching no element, so " +
    "no focusing steps run, and focus drops to <body>. A real regression from the popover version " +
    "(whose hide algorithm restored it), not fixed (would need a listener this construction " +
    "deliberately has none of), measured per combo in assertion4.activeElementAfterClose.",
  backButton: "steps back through opened rooms — measured THREE deep (open room 0, 1, 2 in sequence; " +
    "press Back three times) per route, in backButtonDeep, not extrapolated from one step.",
  boxOverflow: "measured per combo in assertion2.boxOverflow (scrollWidth vs clientWidth on the panel's " +
    "own .room-gallery-box) — Minor 6, fixed in app/globals.css. The fix is wider than the old cap below " +
    "1200px but genuinely narrower between ~1200px and ~1690.9px (solved in that CSS rule's own comment); " +
    "boxOverflowBand samples 1500px, inside that band, per room per route — see that field.",
  combos: [],
  noJs: [],
  welcomeCollision: [],
  knownDefects: [
    {
      id: "arrows-nest-instead-of-replacing",
      status: "FIXED 14 Aug 2026",
      summary:
        "Was: the gallery's popover-based arrows nested rather than replaced, because the invoking button " +
        "lived inside the popover it targeted a sibling of. Fixed by switching the whole mechanism to CSS " +
        "`:target`, which cannot nest by construction (`location.hash` is one string). See RoomCardStack.tsx.",
    },
    {
      id: "gallery-panel-not-centred",
      status: "FIXED 14 Aug 2026",
      summary:
        "Was: Tailwind's preflight (`* { margin: 0 }`) defeated the popover UA stylesheet's `margin: auto` " +
        "centring. Fixed by centring the panel's own box explicitly with `transform: translate(-50%, -50%)`, " +
        "which never touches `margin` at all. See app/globals.css's `.room-gallery-box`.",
    },
    {
      id: "z-index-misattributed-and-welcome-collision",
      status: "FIXED 14 Aug 2026",
      summary:
        "Was: a CSS comment claimed [data-site-header] was z-index:90 without reading the file — the " +
        "header is z-40 (StickyHeader.tsx), and the real z-index:90 belongs to [data-welcome]. The " +
        "gallery's own z-index:100 therefore sat ABOVE the welcome screen, and :target applies on first " +
        "paint, so a room fragment already in the URL on load (reload, bookmark, Back) would paint the " +
        "panel over the welcome intro. Fixed: z-index read correctly off every stacked element, gallery " +
        "moved to z-index:60 (above persistent chrome, below the welcome's 90), verified with " +
        "checkWelcomeCollision.",
    },
    {
      id: "gallery-box-horizontal-overflow",
      status: "FIXED 14 Aug 2026",
      summary:
        "Was: the panel's box capped at min(92vw, 96rem) while the image inside is max-w-[88vw] plus 3rem " +
        "of the box's own padding — real horizontal overflow (10px, measured, every room, both routes) at " +
        "390x844; 0px at 768x1024 and 1440x900. Fixed: box cap widened to min(calc(88vw + 3rem), 96rem), " +
        "which is provably never narrower than the old cap below 1200px and unchanged above it.",
    },
  ],
  // **Five arms, every one rebuilt/measured/reverted for real (14 Aug 2026),
  // recorded here so the evidence survives a clone** — `.superpowers/` (this
  // task's own prose report) is git-ignored (`.gitignore:42`); this JSON is
  // not. Each `quotedOutput` is copied verbatim from the actual failing run,
  // not paraphrased. Reverts used a targeted `Edit` on the one sabotaged
  // line, never `git checkout --` on the whole file — see `id:
  // "git-checkout-mistake"` below for why that rule exists.
  watchedFailing: [
    {
      id: "a-trigger-href-removed",
      sabotaged: "components/sections/RoomCard.tsx — removed `href={`#${galleryId}`}` from the trigger `<a>` (the element stays an `<a>`, just without a working href)",
      expected: "assertions 2 and 3 fail (brief's own prediction)",
      failedAssertions: ["2", "3 (skipped)", "4", "5", "6 (no-JS)"],
      quotedOutput: [
        'vann@390x844: assertion 2: clicking room 0\'s trigger did not leave exactly panel "room-gallery-vann-rooms-0" visible — visible: [(none)]',
        'vann@390x844: assertion 2: focus did not land on panel "room-gallery-vann-rooms-0" after opening (tabindex="-1"\'s own purpose) — document.activeElement.id was ""',
        'vann@390x844: assertion 3: skipped — panel 0 was never the sole visible panel after assertion 2, navigation cannot be exercised',
        'vann@390x844 (no-JS): assertion 6: clicking the trigger link without JS did not open exactly panel 0 — this mechanism should not need script',
      ],
      note: "Clean, fast failure on every route/width/no-JS combination — 46 failure lines total. No hang: the trigger selector is structural (position, not `[href]`-scoped), a lesson learned the hard way earlier in this same task when a stricter selector matched zero elements and hung Playwright's own 30s default timeout.",
    },
    {
      id: "b-panel-photo-eager",
      sabotaged: 'components/sections/RoomCardStack.tsx — added `priority` to the gallery panel\'s `<Photo>` (loading="eager", fetchPriority="high")',
      expected: "assertion 1 fails (brief's own prediction)",
      failedAssertions: ["1"],
      quotedOutput: [
        'vann@1440x900: assertion 1: panel "room-gallery-vann-rooms-2" has naturalWidth 1152 before being opened, and its resolved image (".../suite-tiger-painting-1200.avif") is NOT the same file its own card is showing (".../suite-tiger-painting-1440.avif") — this is an independent load, not shared-cache reuse',
        'tola@1440x900: assertion 1: panel "room-gallery-tola-rooms-2" has naturalWidth 1152 before being opened, and its resolved image (".../tola-room-super-deluxe-1200.avif") is NOT the same file its own card is showing (".../tola-room-super-deluxe-1440.avif") — this is an independent load, not shared-cache reuse',
        'tola@1440x900: assertion 1: panel "room-gallery-tola-rooms-3" has naturalWidth 1152 before being opened, and its resolved image (".../tola-room-family-1200.avif") is NOT the same file its own card is showing (".../tola-room-family-1440.avif") — this is an independent load, not shared-cache reuse',
      ],
      note: "Fails only at 1440x900, only assertion 1, exactly the shape the corrected 'shared-with-card' logic is meant to catch: a genuinely independent fetch (different resolved file than the card's own), not the benign cache-reuse case assertion 1 otherwise allows. 3 failures total, identical both times this arm was run.",
    },
    {
      id: "c-next-mispointed-at-panel-0",
      sabotaged: "components/sections/RoomCardStack.tsx — every panel's \"next\" link's href changed from `roomGalleryId(chapter.id, (i + 1) % n)` to `roomGalleryId(chapter.id, 0)`",
      expected: "assertion 3's wraparound and panel-1 checks fail (brief's own prediction)",
      failedAssertions: ["3", "back-button (3 deep), as a knock-on effect"],
      quotedOutput: [
        'vann@390x844: assertion 3: after "next" from panel 0, expected exactly [room-gallery-vann-rooms-1] visible — got [room-gallery-vann-rooms-0]',
        'vann@390x844: back-button (3 deep): step 1 of 3 expected visible [room-gallery-vann-rooms-1], got [(none)]',
      ],
      note: "Distinct signature from sabotage (d): 'next' from an already-open panel 0, re-pointed at itself, is a same-fragment navigation — a genuine no-op under :target (the hash does not change), so panel 0 stays the ONLY thing visible ('got [room-gallery-vann-rooms-0]'), not 'more than one open' (that is sabotage (d)'s signature) and not 'nothing open' (that was the popover-era version of this same sabotage, which toggled panel 0 closed). Confirms the rig discriminates between different real causes, not just between pass/fail. 8 failures total.",
    },
    {
      id: "d-display-none-default-removed",
      sabotaged: ".room-gallery's own `display: none;` default rule removed (`.room-gallery:target { display: block; }` left in place, so every panel now defaults to a plain div's own `display: block`, permanently visible regardless of :target)",
      expected: "the 'exactly one panel visible' check fails — the one assertion this whole fix exists to satisfy",
      failedAssertions: ["2", "3 (skipped)", "4", "5", "6 (no-JS)", "welcome collision (new)", "back-button (3 deep)"],
      quotedOutput: [
        'vann@390x844: assertion 2: clicking room 0\'s trigger did not leave exactly panel "room-gallery-vann-rooms-0" visible — visible: [room-gallery-vann-rooms-0, room-gallery-vann-rooms-1, room-gallery-vann-rooms-2]',
        'vann@390x844: assertion 4: the close control did not close every panel — still visible: [room-gallery-vann-rooms-0, room-gallery-vann-rooms-1, room-gallery-vann-rooms-2]',
        'vann@390x844 (welcome collision): welcome collision: after the welcome\'s hold, expected exactly [room-gallery-vann-rooms-0] visible (deep-link-open kept), got [room-gallery-vann-rooms-0, room-gallery-vann-rooms-1, room-gallery-vann-rooms-2]',
        'vann@1440x900: assertion 1: panel "room-gallery-vann-rooms-2" has naturalWidth 1152 before being opened... this is an independent load, not shared-cache reuse',
      ],
      note: "The most comprehensive failure of all five arms — every panel visible simultaneously cascades into assertions 2, 4, 5, 6, the welcome-collision check (new) and the deep back-button check, ~60 failure lines across all combos. `:target` itself still correctly names exactly one element throughout (a browser-native, unfalsifiable guarantee) — it is the CSS AUTHOR RULE that broke, which is exactly why assertion 3 checks computed `display`, never `:target` directly. Slow (~5 minutes: every click attempt against an always-covering panel legitimately exhausts its own 5s bound) but not stuck — confirmed via the JSON's own `verdict: \"fail\"` after one run where the background task runner's own completion notice misreported the exit code.",
    },
    {
      id: "e-position-fixed-dropped",
      sabotaged: "`position: fixed;` removed from `.room-gallery` (display:none/z-index/inset left in place)",
      expected: "the scroll-jump check fails — nothing had proven it could until this arm",
      failedAssertions: ["2 (scroll jump)", "5 (light dismiss, as a knock-on effect of the box no longer being viewport-relative)"],
      quotedOutput: [
        "vann@390x844: assertion 2: opening panel 0 moved window.scrollY from 2293 to 4497 — a scroll jump the fixed-position panel should not have caused",
        "tola@1440x900: assertion 2: opening panel 0 moved window.scrollY from 3378 to 6067 — a scroll jump the fixed-position panel should not have caused",
      ],
      note: "Real, large jumps (~2,200-2,700px) on every combo — without `position: fixed` the panel flows into the normal document at its point in the DOM (after the room stack), and `:target`'s own 'scroll the indicated part into view' step must move the page to reach it, exactly the behaviour non-fixed positioning was chosen to avoid. Assertion 5 also fails as a side effect (the light-dismiss probe assumes a viewport-relative box) — a reasonable cascade, not a separate bug.",
    },
    {
      id: "z-welcome-z-index-100",
      sabotaged: ".room-gallery's z-index reverted from 60 to the old, wrong 100 (a supplementary check, not one of the five named arms, run to prove the NEW welcome-collision check itself is sensitive both ways)",
      expected: "the welcome-collision check fails on both its own sub-checks",
      failedAssertions: ["welcome collision"],
      quotedOutput: [
        "vann@390x844 (welcome collision): welcome collision: welcome's z-index (90) is not above the gallery's (100) — the panel could paint over the welcome intro",
        "vann@390x844 (welcome collision): welcome collision: at the viewport's centre, mid-hold, the topmost element was NOT the welcome screen — the gallery panel (z-index 100, display block) may be painting over it",
      ],
      note: "Confirms the welcome-collision check (added for Important 4) is a real, two-way-sensitive instrument, not merely a passing formality — both its z-index-ordering check and its paint-order hit-test correctly fail on the old, wrong value, on all four route/width combinations.",
    },
    {
      id: "git-checkout-mistake",
      sabotaged: "not a sabotage — a real process error, recorded here because it shaped every revert after it",
      note: "After watching sabotage (d) fail in an earlier pass, `git checkout -- app/globals.css` was used to revert it — safe for the ORIGINAL Task 7's three arms (no other uncommitted work in those files at the time), wrong here: this file carried substantial uncommitted, legitimate `:target` CSS on top of the sabotage, and `git checkout --` reverts to the last COMMIT, not \"one edit back\" — it silently wiped the whole CSS fix. Caught immediately by the harness's own external-change warning, confirmed with `git diff` (empty — matching HEAD, the old popover CSS), recovered by re-applying the exact `:target` CSS from the session's own record. Every sabotage revert after this one — and both review passes' worth, all five arms above — used a targeted `Edit` on the one sabotaged line instead.",
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
report.welcomeCollision = [];
for (const route of ROUTES) {
  for (const [width, height] of SHAPES) {
    report.welcomeCollision.push(await checkWelcomeCollision(browser, route, width, height));
  }
}
report.boxOverflowBand = [];
for (const route of ROUTES) {
  report.boxOverflowBand.push(await checkBoxOverflowBand(browser, route));
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
