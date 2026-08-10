// The site menu, driven rather than inspected.
//
// This script exists because of a specific mistake. The first version of the menu
// locked scrolling with `document.documentElement.style.overflow = "hidden"`, and
// the verification checked that the CSS property had been *set*. It had. But
// Lenis (`components/motion/SmoothScroll.tsx`, `smoothWheel: true`) intercepts the
// wheel and scrolls programmatically, and no CSS rule can stop a script calling
// `scrollTo` — so the keyboard was blocked and the wheel was not, and the hidden
// page still travelled ~1,485px behind the open menu.
//
// **"The property is set" and "scrolling has stopped" are different claims, and
// only the second one is the requirement.** So every assertion below drives a real
// input — `page.mouse.wheel`, real key presses — and reads `window.scrollY`.
//
// **Rewritten 10-11 Aug 2026** for `SiteMenu.tsx`, `ChapterMenu`'s successor: this
// panel does not hold seven links to `#id` anchors inside one page — it holds
// three places (`Home`, `Mahua Vann`, `Mahua Tola`), each a real `href` route, and
// the current route is marked `aria-current="page"`. The scroll-lock mechanism
// and the focus trap/Escape/inert machinery are unchanged (both components share
// the same reviewed dialog code), so those assertions survive verbatim under the
// new id (`site-menu`, was `chapter-menu`). What changed is what the panel
// contains and where a link actually takes you — a full browser navigation now,
// since the links are plain `<a href>` and not client-side route changes, and the
// old "does Enter+Tab+Tab+Enter scroll to a chapter" check has no subject left:
// it is replaced below by a check that a real route link performs a real
// navigation, and that the current page's own link is a same-page no-op.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_menu.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-04-task-7/menu-and-layout.json");
const SHOTS = path.dirname(OUT);

const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));

/** Several real wheel turns, spaced so Lenis's inertia has time to run. */
async function wheel(page, turns = 6) {
  for (let i = 0; i < turns; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(120);
  }
  // Lenis eases over ~1.1s; wait past that before reading, or a blocked wheel and
  // a merely slow one look the same.
  await page.waitForTimeout(1600);
}

/** Unchanged from the chapter menu: the lock mechanism did not move. */
async function checkScrollLock(browser, { width, reducedMotion }) {
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 900 },
    ...(reducedMotion ? { reducedMotion: "reduce" } : {}),
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1800);

  // 1. The wheel works before the menu is opened — otherwise "blocked" proves
  //    nothing about the lock.
  await wheel(page);
  const scrolledBefore = await scrollY(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);

  // 2. Open, then turn the wheel. This is the finding.
  await page.getByRole("button", { name: "Menu" }).click();
  await page.waitForTimeout(700);
  const atOpen = await scrollY(page);
  await wheel(page);
  const afterWheelWhileOpen = await scrollY(page);

  // 3. And the keyboard, which the CSS rule did already cover.
  await page.keyboard.press("PageDown");
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(900);
  const afterKeysWhileOpen = await scrollY(page);

  // 4. Close, and confirm scrolling is genuinely given back — a page left with
  //    Lenis stopped scrolls by keyboard but not by wheel, which is worse than
  //    no lock at all.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  const afterClose = await scrollY(page);
  await wheel(page);
  const afterWheelWhenClosed = await scrollY(page);

  const htmlOverflowWhenClosed = await page.evaluate(
    () => getComputedStyle(document.documentElement).overflow,
  );

  await context.close();
  return {
    viewport: width,
    reducedMotion: Boolean(reducedMotion),
    // Every raw reading is kept. Booleans derived from them are convenient, but
    // a boolean is exactly the kind of claim that hid this bug the first time.
    scrolledBefore,
    scrollYAtOpen: atOpen,
    afterWheelWhileOpen,
    afterKeysWhileOpen,
    afterClose,
    afterWheelWhenClosed,
    wheelWorksBeforeOpening: scrolledBefore > 200,
    wheelBlockedWhileOpen: afterWheelWhileOpen === atOpen,
    // Compared with the position after the wheel test, not with the position at
    // open: if the wheel has already moved the page, comparing against `atOpen`
    // reports the keyboard as broken when it is the wheel that is.
    keyboardBlockedWhileOpen: afterKeysWhileOpen === afterWheelWhileOpen,
    positionKeptOnClose: afterClose === atOpen,
    wheelRestoredAfterClose: afterWheelWhenClosed > afterClose + 200,
    htmlOverflowWhenClosed,
  };
}

/**
 * The panel's own contents: three places, real routes, the current one marked,
 * the hamburger's `aria-label`/`aria-expanded`, and the focus trap/Escape/inert
 * machinery. What the seven-anchor chapter menu asserted about its link *count*
 * and *labels* is now asserted about three places instead — the mechanism
 * (focus lands inside on open, Escape returns it to the trigger, Tab wraps at
 * both ends, the panel is `inert` while closed) is exactly what it was.
 */
async function checkSemantics(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  await page.getByRole("button", { name: "Menu" }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/w${width}-menu-open.png` });

  const open = await page.evaluate(() => {
    const panel = document.getElementById("site-menu");
    const links = [...panel.querySelectorAll("nav a[href]")];
    const trigger = document.querySelector("[aria-controls='site-menu']");
    const describe = (el) =>
      el && {
        tag: el.tagName,
        href: el.getAttribute ? el.getAttribute("href") : null,
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
      };
    return {
      places: links.length,
      hrefs: links.map((a) => new URL(a.getAttribute("href"), location.href).pathname),
      current: links.map((a) => a.getAttribute("aria-current")),
      ariaLabel: trigger.getAttribute("aria-label"),
      ariaExpanded: trigger.getAttribute("aria-expanded"),
      focusedOnOpen: describe(document.activeElement),
      role: panel.getAttribute("role"),
      modal: panel.getAttribute("aria-modal"),
    };
  });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  const afterEscape = await page.evaluate(() => ({
    ariaExpanded: document.querySelector("[aria-controls='site-menu']").getAttribute("aria-expanded"),
    focusReturnedToTrigger:
      document.activeElement === document.querySelector("[aria-controls='site-menu']"),
    panelInert: document.getElementById("site-menu").hasAttribute("inert"),
  }));

  // Reopen (Enter on the trigger, which still has focus), and walk the trap:
  // Tab from the first focusable to the last, then once more to prove it wraps
  // back to the first rather than escaping the panel. Four focusables now
  // (Close, then the three place links) rather than the old panel's, but the
  // wrap is the same mechanism.
  await page.keyboard.press("Enter");
  await page.waitForTimeout(700);
  const trap = await page.evaluate(() => {
    const panel = document.getElementById("site-menu");
    const focusable = [...panel.querySelectorAll("a[href], button")];
    const describe = (el) =>
      el && {
        tag: el.tagName,
        href: el.getAttribute ? el.getAttribute("href") : null,
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
      };
    return { count: focusable.length, first: describe(focusable[0]), last: describe(focusable[focusable.length - 1]) };
  });
  for (let i = 0; i < trap.count - 1; i++) await page.keyboard.press("Tab");
  const onLast = await page.evaluate(() => {
    const el = document.activeElement;
    return el && {
      tag: el.tagName,
      href: el.getAttribute ? el.getAttribute("href") : null,
      text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
    };
  });
  await page.keyboard.press("Tab");
  const wrappedToFirst = await page.evaluate(() => {
    const el = document.activeElement;
    return el && {
      tag: el.tagName,
      href: el.getAttribute ? el.getAttribute("href") : null,
      text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
    };
  });

  await context.close();
  return { open, afterEscape, trap: { ...trap, onLast, wrappedToFirst } };
}

/**
 * Real navigation. The links are ordinary `<a href>` (SiteMenu.tsx: "nothing
 * about the navigation depends on script once the panel is open"), so following
 * one to another place is a full browser navigation, not a client-side route
 * change — and the current page's own link is a same-page no-op that still
 * closes the menu (`if (current(place.href)) e.preventDefault(); close();`).
 * Both halves of that contract are asserted here, because a menu that either
 * failed to navigate at all, or reloaded the page you were already reading,
 * would look identical to a glance at the markup.
 */
async function checkNavigation(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1200);

  await page.getByRole("button", { name: "Menu" }).click();
  await page.waitForTimeout(700);

  const before = await page.evaluate(() => {
    const panel = document.getElementById("site-menu");
    const links = [...panel.querySelectorAll("nav a[href]")];
    return {
      path: location.pathname,
      currentHref: links.find((a) => a.getAttribute("aria-current") === "page")?.getAttribute("href") ?? null,
      otherHref: links.find((a) => a.getAttribute("aria-current") !== "page")?.getAttribute("href") ?? null,
    };
  });

  let afterSelfClick = null;
  if (before.currentHref) {
    await page.click(`#site-menu a[href='${before.currentHref}']`);
    await page.waitForTimeout(500);
    afterSelfClick = await page.evaluate(() => ({
      path: location.pathname,
      panelInert: document.getElementById("site-menu").hasAttribute("inert"),
    }));
  }

  let afterRealNav = null;
  if (before.otherHref) {
    await page.getByRole("button", { name: "Menu" }).click();
    await page.waitForTimeout(700);
    await page.click(`#site-menu a[href='${before.otherHref}']`);
    await page.waitForURL(`**${before.otherHref}`, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);
    afterRealNav = { path: await page.evaluate(() => location.pathname) };
  }

  await context.close();
  return { before, afterSelfClick, afterRealNav };
}

/** No horizontal scroll at any position — several chapters bleed past the edge. */
async function checkOverflow(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  const result = await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    let max = 0;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 140));
      max = Math.max(max, document.documentElement.scrollWidth);
    }
    return { scrollWidth: max, clientWidth: document.documentElement.clientWidth };
  });
  await context.close();
  return { width, anyHorizontal: result.scrollWidth > result.clientWidth, ...result };
}

async function main() {
  const browser = await chromium.launch();
  const report = {
    measuredAt: new Date().toISOString(),
    url: URL,
    scrollLock: [],
    menu: {},
    navigation: {},
    overflow: [],
  };
  const failures = [];

  for (const spec of [
    { width: 1440 },
    { width: 390 },
    { width: 1440, reducedMotion: true },
    { width: 390, reducedMotion: true },
  ]) {
    const r = await checkScrollLock(browser, spec);
    report.scrollLock.push(r);
    console.log(
      `scroll lock ${r.viewport}px${r.reducedMotion ? " (reduced motion)" : ""} — ` +
        `wheel before open ${r.scrolledBefore}px, wheel while open ${r.scrollYAtOpen}→${r.afterWheelWhileOpen}, ` +
        `keys while open →${r.afterKeysWhileOpen}, wheel after close →${r.afterWheelWhenClosed}`,
    );
    if (
      !r.wheelWorksBeforeOpening ||
      !r.wheelBlockedWhileOpen ||
      !r.keyboardBlockedWhileOpen ||
      !r.wheelRestoredAfterClose
    ) {
      failures.push(`scroll lock broken at ${r.viewport}px${r.reducedMotion ? " (reduced motion)" : ""}`);
    }
  }

  for (const width of [390, 1440]) {
    const s = await checkSemantics(browser, width);
    report.menu[width] = s;
    console.log(
      `menu ${width}px — ${s.open.places} places (${s.open.hrefs.join(", ")}), current=${JSON.stringify(
        s.open.current,
      )}, focusedOnOpen=${s.open.focusedOnOpen?.text}, trap ${s.trap.count} focusables`,
    );

    if (s.open.places !== 3) failures.push(`${width}px: menu holds ${s.open.places} places, not 3`);
    if (JSON.stringify(s.open.hrefs) !== JSON.stringify(["/", "/mahua-vann", "/mahua-tola"])) {
      failures.push(`${width}px: place hrefs are ${JSON.stringify(s.open.hrefs)}, not the three routes`);
    }
    if (s.open.current[0] !== "page") {
      failures.push(`${width}px: Home is not marked aria-current="page" while on "/"`);
    }
    if (s.open.current.slice(1).some((c) => c === "page")) {
      failures.push(`${width}px: a lodge link is marked aria-current="page" while on the home route`);
    }
    if (s.open.ariaLabel !== "Menu") failures.push(`${width}px: trigger aria-label is "${s.open.ariaLabel}", not "Menu"`);
    if (s.open.ariaExpanded !== "true") failures.push(`${width}px: aria-expanded did not become "true" on open`);
    if (s.open.role !== "dialog" || s.open.modal !== "true") {
      failures.push(`${width}px: panel is not role="dialog" aria-modal="true"`);
    }
    if (s.afterEscape.ariaExpanded !== "false") failures.push(`${width}px: aria-expanded did not return to "false" after Escape`);
    if (!s.afterEscape.focusReturnedToTrigger) failures.push(`${width}px: focus did not return to the trigger after Escape`);
    if (!s.afterEscape.panelInert) failures.push(`${width}px: panel is not inert after closing`);
    if (s.trap.count !== 4) failures.push(`${width}px: panel holds ${s.trap.count} focusables, not 4 (Close + 3 places)`);
    if (s.trap.onLast?.href !== s.trap.last?.href) {
      failures.push(`${width}px: Tab did not reach the last focusable (${JSON.stringify(s.trap.last)}) before wrapping`);
    }
    if (s.trap.wrappedToFirst?.tag !== s.trap.first?.tag || s.trap.wrappedToFirst?.text !== s.trap.first?.text) {
      failures.push(`${width}px: Tab from the last focusable did not wrap to the first`);
    }

    report.overflow.push(await checkOverflow(browser, width));

    const nav = await checkNavigation(browser, width);
    report.navigation[width] = nav;
    console.log(
      `navigation ${width}px — self-click stayed at ${nav.afterSelfClick?.path}, ` +
        `real link took the browser to ${nav.afterRealNav?.path} (asked for ${nav.before.otherHref})`,
    );
    if (nav.afterSelfClick && nav.afterSelfClick.path !== nav.before.path) {
      failures.push(`${width}px: clicking the current page's own menu link navigated anyway (to ${nav.afterSelfClick.path})`);
    }
    if (nav.afterSelfClick && !nav.afterSelfClick.panelInert) {
      failures.push(`${width}px: the menu did not close after clicking the current page's own link`);
    }
    if (nav.afterRealNav && nav.afterRealNav.path !== nav.before.otherHref) {
      failures.push(
        `${width}px: following a real place link landed on ${nav.afterRealNav.path}, not ${nav.before.otherHref}`,
      );
    }
  }

  await browser.close();
  await mkdir(SHOTS, { recursive: true });
  await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT}`);

  if (failures.length > 0) {
    console.error(`FAILED: ${failures.length} problem(s).`);
    for (const f of failures) console.error(`  ${f}`);
    process.exitCode = 1;
  } else {
    console.log("PASS — 0 failures");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
