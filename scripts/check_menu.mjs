// The chapter menu, driven rather than inspected.
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

/** Semantics, focus and keyboard navigation — unchanged from fix round 1. */
async function checkSemantics(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  await page.getByRole("button", { name: "Menu" }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/w${width}-menu-open.png` });

  const open = await page.evaluate(() => {
    const panel = document.getElementById("chapter-menu");
    return {
      links: panel.querySelectorAll("a[href^='#']").length,
      labels: [...panel.querySelectorAll("a[href^='#']")].map((a) =>
        a.textContent.replace(/\s+/g, " ").trim(),
      ),
      ariaExpanded: document.querySelector("[aria-controls='chapter-menu']").getAttribute("aria-expanded"),
      focusedOnOpen: document.activeElement?.textContent?.trim(),
      role: panel.getAttribute("role"),
      modal: panel.getAttribute("aria-modal"),
    };
  });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  const afterEscape = await page.evaluate(() => ({
    ariaExpanded: document.querySelector("[aria-controls='chapter-menu']").getAttribute("aria-expanded"),
    focusReturnedToTrigger:
      document.activeElement === document.querySelector("[aria-controls='chapter-menu']"),
    panelInert: document.getElementById("chapter-menu").hasAttribute("inert"),
  }));

  await page.keyboard.press("Enter");
  await page.waitForTimeout(700);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const target = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1800);
  const navigated = await page.evaluate(() => {
    const el = location.hash ? document.querySelector(location.hash) : null;
    return {
      hash: location.hash,
      scrollY: Math.round(window.scrollY),
      panelInert: document.getElementById("chapter-menu").hasAttribute("inert"),
      sectionTopFromViewport: el ? Math.round(el.getBoundingClientRect().top) : null,
    };
  });

  await context.close();
  return { open, afterEscape, keyboardTarget: target, navigated };
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
  const report = { measuredAt: new Date().toISOString(), url: URL, scrollLock: [], menu: {}, overflow: [] };

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
  }

  for (const width of [390, 1440]) {
    report.menu[width] = await checkSemantics(browser, width);
    report.overflow.push(await checkOverflow(browser, width));
  }

  await browser.close();
  await mkdir(SHOTS, { recursive: true });
  await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT}`);

  const failures = report.scrollLock.filter(
    (r) =>
      !r.wheelWorksBeforeOpening ||
      !r.wheelBlockedWhileOpen ||
      !r.keyboardBlockedWhileOpen ||
      !r.wheelRestoredAfterClose,
  );
  if (failures.length > 0) {
    console.error(`FAILED: scroll lock broken in ${failures.length} configuration(s).`);
    for (const f of failures) console.error(`  ${JSON.stringify(f)}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
