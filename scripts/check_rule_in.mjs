// The hairline that slides in under a link — measured in a browser.
//
// Everything interesting about this feature is a rendered outcome. The class
// being on the element proves nothing: a Tailwind `after:` utility composing with
// the pseudo-element's `transform` would leave the markup looking perfect and the
// rule permanently collapsed, which is the exact shape of the defect that shipped
// image masks that never wiped (docs/DECISIONS.md §2, #6/#7).
//
// So this reads the rendered matrix, and it samples the rule *mid-travel* — the
// one check that separates "it slides" from "it snaps". Both halves are needed:
// a running transition alone passes for a rule that jumps to 1 in a single frame
// on a zero-length curve, and endpoint sampling alone passes for a rule with no
// transition at all.
//
// Run it against a production build:
//
//   npm run build && npx next start -p 3100
//   node scripts/check_rule_in.mjs
//
// Flags: --url --port --out

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { DURATION } from "../lib/motion.ts";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-05-signature/rule-in.json");

const fails = [];
const fail = (m) => { fails.push(m); console.log(`   FAIL  ${m}`); };
const ok = (m) => console.log(`   ok    ${m}`);

/** scaleX out of a computed `matrix(a, b, c, d, e, f)`. `none` means untransformed. */
const scaleX = (t) => (!t || t === "none" ? 1 : Number(t.match(/matrix\(([-\d.]+)/)?.[1] ?? NaN));

const readAfter = (page, sel) =>
  page.$eval(sel, (el) => getComputedStyle(el, "::after").transform);

const report = { measuredAt: new Date().toISOString(), url: URL, ruleInDuration: DURATION.ruleIn };
const browser = await chromium.launch();

// ---------------------------------------------------------------------------
// 1. Coverage. The contract that cannot drift.
// ---------------------------------------------------------------------------
{
  console.log("\n1. every link and text control is covered");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "networkidle" });

  // The menu's seven links live in a panel that is `inert` until it opens, so
  // they must be on screen for this to mean anything. Opening it is also what
  // puts the rule on the dark overlay for check 6.
  await page.click("[aria-controls='chapter-menu']");
  await page.waitForTimeout(600);

  const uncovered = await page.$$eval("a[href], button", (els) =>
    els
      .filter((el) => (el.textContent ?? "").trim().length > 0)
      .filter(
        (el) =>
          !el.classList.contains("rule-in") &&
          !el.querySelector(".rule-in") &&
          !el.hasAttribute("data-rule"),
      )
      .map((el) => `<${el.tagName.toLowerCase()}> "${(el.textContent ?? "").trim().slice(0, 40)}"`),
  );
  const covered = await page.$$eval(
    "a[href], button",
    (els) => els.filter((el) => (el.textContent ?? "").trim().length > 0).length,
  );
  report.coverage = { total: covered, uncovered };

  if (uncovered.length > 0) {
    fail(
      `${uncovered.length} of ${covered} links/controls carry neither \`rule-in\` nor \`data-rule\`: ` +
        uncovered.join(", "),
    );
  } else {
    ok(`all ${covered} links and text controls carry the rule or an explicit opt-out`);
  }
  await page.close();
}

// ---------------------------------------------------------------------------
// 2-5. At rest, mid-travel, complete, and by keyboard.
// ---------------------------------------------------------------------------
{
  console.log("\n2-5. the rule is collapsed, travels, completes, and answers the keyboard");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "networkidle" });

  const SEL = "[aria-controls='chapter-menu']";

  const rest = scaleX(await readAfter(page, SEL));
  report.rest = rest;
  if (rest > 0.02) fail(`at rest the rule is already drawn (scaleX ${rest.toFixed(3)})`);
  else ok(`at rest the rule is collapsed (scaleX ${rest.toFixed(3)})`);

  // Hover, then find the real transition and *seek* it rather than racing the
  // wall clock.
  //
  // The first version of this read the computed matrix a moment after hovering
  // and asserted it sat between 0 and 1. That is a race, and it was caught being
  // one: on a byte-identical build it read 0.597 on one run and 0.000 on the
  // next, so it could fail correct code and — far worse — pass broken code on a
  // lucky sample. Pausing the animation and setting `currentTime` to 40% of its
  // own duration is deterministic, and it still cannot be satisfied by a rule
  // that snaps: a rule with no transition has no animation object to seek, and
  // one with a zero duration reports `duration: 0` here.
  //
  // Two seek points rather than one, and the assertion is that the rule *grew*
  // between them. A single sample has to be bounded against fixed limits, and
  // those limits depend on how front-loaded the easing is: `ENTER.ease` has
  // already travelled 92% of the way at 40% of its time, which sits close enough
  // to a `< 0.98` bound to false-fail on a curve tweak nobody would think to
  // check. Monotonic growth between two interior points is true of every
  // decelerating curve and false of everything that snaps.
  await page.hover(SEL);
  const probe = await page.$eval(SEL, (el) => {
    const a = el
      .getAnimations({ subtree: true })
      .find((x) => x.transitionProperty === "transform" && x.effect?.pseudoElement === "::after");
    if (!a) return null;
    const duration = a.effect.getComputedTiming().duration;
    a.pause();
    const at = (fraction) => {
      a.currentTime = duration * fraction;
      return getComputedStyle(el, "::after").transform;
    };
    const early = at(0.15);
    const late = at(0.55);
    a.play();
    return { early, late, duration };
  });

  if (!probe) {
    report.travel = null;
    fail("hovering started no transform transition on the rule's ::after — it snaps");
  } else {
    const early = scaleX(probe.early);
    const late = scaleX(probe.late);
    report.travel = { durationMs: probe.duration, atFifteenPercent: early, atFiftyFivePercent: late };

    if (!(probe.duration > 0)) {
      fail(`the rule's transition has no duration (${probe.duration}ms) — it snaps`);
    } else if (!(early > 0.02 && early < 0.98 && late > 0.02 && late < 0.98)) {
      fail(
        `the rule is not travelling: scaleX ${early.toFixed(3)} at 15% and ${late.toFixed(3)} at 55% ` +
          `of its ${probe.duration}ms — at least one endpoint is already at rest`,
      );
    } else if (late <= early) {
      fail(`the rule did not grow between 15% and 55%: ${early.toFixed(3)} then ${late.toFixed(3)}`);
    } else {
      ok(
        `travels over ${probe.duration}ms — scaleX ${early.toFixed(3)} at 15%, ${late.toFixed(3)} at 55%`,
      );
    }
  }

  await page.waitForTimeout(DURATION.ruleIn * 1000 + 200);
  const done = scaleX(await readAfter(page, SEL));
  report.complete = done;
  if (done < 0.98) fail(`the rule never completed (scaleX ${done.toFixed(3)})`);
  else ok(`completes at scaleX ${done.toFixed(3)}`);

  // Keyboard. `:focus-visible` does not match a programmatic `.focus()`, so this
  // has to be a real Tab — which is also the only way it proves what it claims.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(DURATION.ruleIn * 1000 + 200);
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-controls"));
  await page.waitForTimeout(DURATION.ruleIn * 1000 + 200);
  const byKeyboard = scaleX(await readAfter(page, SEL));
  report.keyboard = { focused, scaleX: byKeyboard };
  if (focused !== "chapter-menu") {
    fail(`the first Tab landed on ${focused ?? "nothing"}, not the menu trigger`);
  } else if (byKeyboard < 0.98) {
    fail(`keyboard focus did not draw the rule (scaleX ${byKeyboard.toFixed(3)})`);
  } else {
    ok(`keyboard focus reaches the same state as hover (scaleX ${byKeyboard.toFixed(3)})`);
  }
  await page.close();
}

// ---------------------------------------------------------------------------
// 6. Reduced motion — the rule stays, only the travel goes.
// ---------------------------------------------------------------------------
{
  console.log("\n6. reduced motion keeps the signal and drops the travel");
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });

  const SEL = "[aria-controls='chapter-menu']";
  await page.hover(SEL);
  const immediate = scaleX(await readAfter(page, SEL));
  const running = await page.$eval(SEL, (el) =>
    el
      .getAnimations({ subtree: true })
      .some((a) => a.effect?.pseudoElement === "::after" && a.playState === "running"),
  );
  report.reducedMotion = { scaleX: immediate, running };

  if (immediate < 0.98) {
    fail(`under reduced motion the rule did not appear (scaleX ${immediate.toFixed(3)})`);
  } else if (running) {
    fail("under reduced motion the rule still animates");
  } else {
    ok(`appears instantly and does not animate (scaleX ${immediate.toFixed(3)})`);
  }
  await context.close();
}

// ---------------------------------------------------------------------------
// 7. Perceptible on both surfaces it appears on.
// ---------------------------------------------------------------------------
{
  console.log("\n7. the rule is perceptible on cream and on the dark overlay");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "networkidle" });

  // Not a WCAG text ratio — it carries no text. A relative-luminance delta is the
  // right question for "can you see a hairline against what is behind it".
  const lum = ([r, g, b]) => {
    const f = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (c) => c.match(/\d+/g).slice(0, 3).map(Number);

  const surfaces = [];

  // Cream: a resting rule that sits on paper in an ordinary chapter. Matched
  // by class alone, not `a.rule-in--rest`: on the home page the resting rule
  // is on the lodge links' own `<a>`, but on the property pages it is on the
  // label `<span>` inside the sibling banner's anchor (the anchor wraps a
  // photograph too, and a full-banner-width resting hairline would be wrong).
  // The measurement is the same either way — the rule's colour against the
  // section behind it.
  await page.$eval(".rule-in--rest", (el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(400);
  surfaces.push(
    await page.$eval(".rule-in--rest", (el) => ({
      where: "cream",
      rule: getComputedStyle(el, "::after").backgroundColor,
      behind: getComputedStyle(el.closest("section") ?? document.body).backgroundColor,
    })),
  );

  // The dark overlay: a chapter link inside the open menu panel.
  await page.click("[aria-controls='chapter-menu']");
  await page.waitForTimeout(600);
  surfaces.push(
    await page.$eval("#chapter-menu a .rule-in", (el) => ({
      where: "menu overlay",
      rule: getComputedStyle(el, "::after").backgroundColor,
      behind: getComputedStyle(document.getElementById("chapter-menu")).backgroundColor,
    })),
  );

  report.surfaces = surfaces.map((s) => ({ ...s, delta: Math.abs(lum(parse(s.rule)) - lum(parse(s.behind))) }));
  for (const s of report.surfaces) {
    if (s.delta < 0.15) {
      fail(`on ${s.where} the rule (${s.rule}) is barely visible against ${s.behind} — delta ${s.delta.toFixed(3)}`);
    } else {
      ok(`on ${s.where} the rule stands off its background by ${s.delta.toFixed(3)}`);
    }
  }
  await page.close();
}

await browser.close();

report.failures = fails;
report.verdict = fails.length ? "fail" : "pass";
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`\nWrote ${OUT}`);

if (fails.length > 0) {
  console.error(`\nFAILED — ${fails.length}:\n${fails.map((f) => `  ${f}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`\nPASS — 0 failures`);
}
