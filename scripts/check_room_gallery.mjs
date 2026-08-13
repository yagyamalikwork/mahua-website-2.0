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
// it was trusted (`docs/reviews/2026-08-13-image-sizing/README.md` and this
// task's own report have the full reconstruction). A second, independent
// finding from the same measurement pass: the panel was never actually
// centred either — Tailwind's own preflight (`* { margin: 0 }`) defeated the
// popover UA stylesheet's `margin: auto`.
//
// Both are fixed now by switching the mechanism to CSS `:target`
// (`RoomCardStack.tsx`, `app/globals.css` — read both files' own comments for
// the mechanism), which cannot nest BY CONSTRUCTION: `location.hash` is one
// string, so at most one element in the whole document can ever match
// `:target`. This rig is rewritten to match — every assertion below is new or
// substantially changed, not patched.
//
// **What the new mechanism does NOT give back: `:target` has no Escape key.**
// Popover's Esc-to-close was UA behaviour, free; `:target` is a URL/CSS
// mechanism with no keyboard binding, and adding one back would need a
// `keydown` listener — script this construction deliberately carries none of.
// The OLD assertion 4 ("Esc closes") is gone, not silently — replaced with an
// assertion that the CLOSE CONTROL and the LIGHT-DISMISS BACKDROP each
// genuinely work, which is what a keyboard-less construction can still
// promise. A visitor who wants to close with the keyboard alone can still Tab
// to the close link and press Enter/Space; what's gone is a single Esc
// keypress from anywhere.
//
// **A genuine, arguably-a-feature side effect, also worth knowing rather than
// discovering by accident:** every fragment navigation is a real history
// entry, so the browser's own Back button now steps back through opened
// rooms one at a time (a lightbox behaviour `popover` never gave this page).
// Checked below, not asserted pass/fail — it's a property of the mechanism,
// not a requirement either construction was ever asked to meet.
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
//      does not move.
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
//      rather than a quietly deleted assertion.
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
// Real user paths only: every click goes through Playwright's own
// `Locator.click()` / `page.mouse.click(x, y)`, which dispatch real pointer
// events — never `location.hash = "..."` set directly, which would test the
// URL API instead of the behaviour a visitor gets from clicking a link.

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
      await page.locator(`#${visible[0]} .room-gallery-box a`).last().click({ timeout: CLICK_TIMEOUT });
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
  combo.assertion2 = {
    clickedTrigger0,
    visibleAfterOpen,
    opened0,
    scrollBeforeOpen,
    scrollAfterOpen,
    activeElementId: activeAfterOpen,
    minWidth,
    ...lastRead,
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
        await page.locator(`#${fromId} .room-gallery-box a`).nth(1).click({ timeout: CLICK_TIMEOUT });
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
      await page.locator(`#${panel0} .room-gallery-box a`).nth(0).click({ timeout: CLICK_TIMEOUT });
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
    await page.locator(`#${panel0} .room-gallery-box a`).last().click({ timeout: CLICK_TIMEOUT });
  } catch {
    closeClicked = false;
  }
  await page.waitForTimeout(200);
  const afterClose = await visiblePanels(page);
  combo.assertion4 = { openBeforeClose, closeClicked, afterClose };
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

  // ------------------------------------------------- back-button note (checked, not pass/fail)
  //
  // A property of `:target`, not a requirement either construction was asked
  // to meet — recorded because a mechanism change that alters browser-history
  // behaviour should be measured, not discovered by accident later.
  await closeWhatsOpen(page);
  await scrollTriggerIntoView(page, trigger0);
  await trigger0.click({ timeout: CLICK_TIMEOUT }).catch(() => {});
  await page.waitForTimeout(150);
  if (n > 1) {
    await page.locator(`#${panel0} .room-gallery-box a`).nth(1).click({ timeout: CLICK_TIMEOUT }).catch(() => {});
    await page.waitForTimeout(150);
  }
  const beforeBack = await visiblePanels(page);
  await page.goBack();
  await page.waitForTimeout(200);
  const afterBack = await visiblePanels(page);
  combo.backButton = { beforeBack, afterBack };

  console.log(
    `${label.padEnd(16)} triggers=${found}/${n} a1(lazy)=${assertion1Rows.every((r) => r.naturalWidth === 0 || (r.sharedWithCard && r.requestCount === 1))} ` +
      `a2(open)=${opened0} a3(nav)=${!chainBroken} a4(close)=${afterClose.length === 0} a5(dismiss)=${afterDismiss.length === 0} ` +
      `back=[${beforeBack.join(",")}]->[${afterBack.join(",")}]`,
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
      const closeLink = page.locator(`#${panelId(route.chapterId, 0)} .room-gallery-box a`).last();
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
  esc: "NOT supported by this construction — a deliberate trade, not an oversight. See the header comment.",
  backButton: "steps back through opened rooms (a real :target/history side effect) — checked per combo, not pass/fail.",
  combos: [],
  noJs: [],
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
