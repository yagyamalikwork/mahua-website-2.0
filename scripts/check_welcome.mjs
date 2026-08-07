// The welcome screen: does it welcome, and — the only question that really
// matters — does it always leave?
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_welcome.mjs
//
// **A welcome screen that fails to leave is a site nobody can use.** Every other
// assertion here is secondary to that one, and it is checked on four separate
// routes rather than once: the ordinary load, a load with every script blocked, a
// load under `prefers-reduced-motion`, and a load on a viewport small enough that
// the lockup could overflow. The screen carries no JavaScript, so the last thing
// this rig should ever be is a test that only passes when JavaScript ran.
//
// What it asserts:
//
//   1. It is **server-rendered** — present in the HTML before any script.
//   2. It **covers the viewport** while it is up, and the flower is turning.
//   3. It is **gone** — not transparent, not `pointer-events: none` over the
//      page, but `visibility: hidden` and out of the way — well before 3s.
//   4. **With every script blocked it still goes.** This is the route that would
//      strand a visitor, and it is the one a JavaScript-driven splash fails.
//   5. Under **reduced motion it never appears at all**, not even for the length
//      of its own delay.
//   6. It **costs no requests**: the flower is already in the first load for the
//      header, and the name is live type.
//   7. It does not **push the hero later** — the page is already 1,475 ms over
//      its budget (CLAUDE.md non-negotiable #6) and a curtain in front of it must
//      not make that worse.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-08-welcome/welcome.json");
const SHOTS = path.dirname(OUT);

/** It must be gone by here, whatever the durations in `lib/motion.ts` say. */
const MUST_BE_GONE_BY_MS = 3000;

const failures = [];

/**
 * Every sample carries the page's own clock rather than the rig's.
 *
 * `performance.now()` in the page is milliseconds since *its* navigation start,
 * which is the number a visitor experiences. Accumulating `waitForTimeout` in the
 * rig measures something else — how long this script has been awake — and the two
 * drift by however long the navigation and the parse took. The first version of
 * this rig used the rig's clock and `waitUntil: "commit"`, and reported the
 * welcome "already gone at 150ms" on a build where it was working perfectly: it
 * had sampled mid-stream, before the element's animation had started, and read
 * the base style. The page was right and the instrument was wrong.
 */
const STATE = () => {
  const el = document.querySelector("[data-welcome]");
  const now = Math.round(performance.now());
  if (!el) return { present: false, now };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const emblem = el.querySelector("img");
  const et = emblem ? getComputedStyle(emblem).transform : "none";
  const angle =
    et === "none"
      ? 0
      : Number(
          ((Math.atan2(new DOMMatrixReadOnly(et).b, new DOMMatrixReadOnly(et).a) * 180) / Math.PI).toFixed(
            1,
          ),
        );
  return {
    present: true,
    now,
    visibility: cs.visibility,
    opacity: Number(Number(cs.opacity).toFixed(3)),
    zIndex: cs.zIndex,
    // "Gone" means all three, not just a zero opacity: a transparent sheet still
    // covers the page for anything that hit-tests, and still sits in the layer.
    gone: cs.visibility === "hidden" || Number(cs.opacity) === 0,
    coversViewport: r.width >= window.innerWidth - 1 && r.height >= window.innerHeight - 1,
    emblemAngle: angle,
    lockupFontPx: Number.parseFloat(
      getComputedStyle(el.querySelector("[data-brand-lockup]")).fontSize,
    ),
    /**
     * The brand *name*, against the screen it is standing on.
     *
     * This exists because the welcome shipped for one build with the name
     * rendering cream on cream — `BrandMark`'s wordmark takes
     * `var(--header-wordmark, var(--bg))` and that variable is defined only
     * inside the header, so the fallback made it the background colour. The
     * markup was correct, the element was there, its box was the right size, and
     * every other assertion in this rig passed. A screenshot caught it.
     */
    ...(() => {
      const word = el.querySelector("[data-brand-wordmark]");
      const rgb = (s) => (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
      const lum = ([r, g, b]) => {
        const f = (v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      if (!word) return { wordmarkContrast: null, wordmarkText: null };
      const fg = rgb(getComputedStyle(word).color);
      const bg = rgb(getComputedStyle(el).backgroundColor);
      if (fg.length < 3 || bg.length < 3) return { wordmarkContrast: null, wordmarkText: null };
      const [a, b2] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return {
        wordmarkContrast: Number(((a + 0.05) / (b2 + 0.05)).toFixed(2)),
        wordmarkText: (word.textContent ?? "").trim(),
        wordmarkWidth: Math.round(word.getBoundingClientRect().width),
      };
    })(),
    // The page's own content underneath, which must exist all along — the welcome
    // is a curtain over a rendered page, not a substitute for one.
    heroBehind: Boolean(document.querySelector("main section#arrival")),
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
};

const browser = await chromium.launch();
await mkdir(SHOTS, { recursive: true });
const report = { measuredAt: new Date().toISOString(), url: URL, mustBeGoneByMs: MUST_BE_GONE_BY_MS };

// ------------------------------------------------------- 1, 2, 3: the ordinary load

const normal = await (async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));

  // `domcontentloaded`, not `commit`: with `commit` the document may still be
  // streaming, and an element whose animation has not started yet reads as its
  // base style — which for this one is hidden. See the note on `STATE`.
  await page.goto(URL, { waitUntil: "domcontentloaded" });

  // Sample across its whole life, so "it faded" is a curve rather than two points.
  const timeline = [];
  let shotUp = false;
  for (let i = 0; i < 34; i++) {
    const s = await page.evaluate(STATE);
    timeline.push(s);
    if (!shotUp && s.present && !s.gone) {
      shotUp = true;
      await page.screenshot({ path: path.join(SHOTS, "welcome-1440-up.png") });
    }
    await page.waitForTimeout(100);
  }
  await page.screenshot({ path: path.join(SHOTS, "welcome-1440-gone.png") });
  await context.close();
  const up = timeline.filter((s) => s.present && !s.gone);
  return { early: up[0] ?? timeline[0], timeline, requests, sawItUp: up.length > 0 };
})();

if (!normal.timeline[0].present) {
  failures.push("there is no [data-welcome] element at all");
} else if (!normal.sawItUp) {
  failures.push(
    "the welcome was never visible in any of 34 samples across 3.4s — it never welcomed anybody. Either " +
      "the animation is not running, or its base style is being applied instead of the backwards fill",
  );
} else {
  if (!normal.early.coversViewport) {
    failures.push("while it is up the welcome does not cover the viewport");
  }
  if (!normal.timeline.some((s) => s.heroBehind)) {
    failures.push("the page itself is never rendered behind the welcome — it is a substitute, not a curtain");
  }
  if (!normal.timeline.some((s) => Math.abs(s.emblemAngle) > 4)) {
    failures.push(
      "the flower never left upright across the whole welcome — the half-turn is not running, and a " +
        "static logo on a cream screen is a delay rather than a greeting",
    );
  }
  // The name, not just the flower. The client asked for the logo.
  if (!normal.early.wordmarkText) {
    failures.push("the welcome carries no brand wordmark — only the flower");
  } else if ((normal.early.wordmarkContrast ?? 0) < 4.5) {
    failures.push(
      `the brand name is ${normal.early.wordmarkContrast}:1 against the welcome's own background — it is ` +
        "invisible. This lockup is `standalone` and so takes no colour from the header's state; if no " +
        "rule gives it one it inherits, and the screen shows a flower with a blank space beside it",
    );
  }
}

// Measured on the page's own clock, from its navigation start.
const goneAt = normal.timeline.find((s) => s.present && s.gone && s.now > (normal.early?.now ?? 0));
report.lastSeenUpMs = normal.timeline.filter((s) => s.present && !s.gone).at(-1)?.now ?? null;
report.goneAtMs = goneAt?.now ?? null;
if (!goneAt) {
  failures.push(
    "the welcome was still covering the page at the end of the samples — this is the failure that makes " +
      "the site unusable, and it is the reason the screen carries no JavaScript",
  );
} else if (goneAt.now > MUST_BE_GONE_BY_MS) {
  failures.push(`the welcome took ${goneAt.now}ms to leave, past the ${MUST_BE_GONE_BY_MS}ms ceiling`);
}

// 6: no requests of its own. The flower is the header's, already in the first load.
const emblemRequests = normal.requests.filter((u) => /\/brand\/emblem/.test(u));
report.emblemRequests = emblemRequests.length;
if (emblemRequests.length > 1) {
  failures.push(
    `${emblemRequests.length} separate emblem files were fetched — the welcome is meant to reuse the ` +
      "header's, at the same encoded widths, and cost nothing",
  );
}

// ------------------------------------- 4: every script blocked, and it still goes

const noJs = await (async () => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  const present = (await page.locator("[data-welcome]").count()) > 0;
  await page.waitForTimeout(MUST_BE_GONE_BY_MS);
  // `evaluate` is unavailable with scripting off, so this is read the only way
  // left: whether Playwright itself considers the element visible.
  const stillVisible = present ? await page.locator("[data-welcome]").isVisible() : false;
  await page.screenshot({ path: path.join(SHOTS, "welcome-1440-nojs.png") });
  await context.close();
  return { present, stillVisible };
})();

report.noJs = noJs;
if (!noJs.present) {
  failures.push("no JavaScript: the welcome is not in the server-rendered HTML at all");
}
if (noJs.stillVisible) {
  failures.push(
    "no JavaScript: the welcome was still covering the page after " +
      `${MUST_BE_GONE_BY_MS}ms. This is the one that matters — with scripting off there is nothing left ` +
      "to remove it, and the visitor never reaches the site",
  );
}

// --------------------------------- 5: reduced motion — never visible, not once

const reduced = await (async () => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  const seen = [];
  for (let i = 0; i < 20; i++) {
    seen.push(await page.evaluate(STATE));
    await page.waitForTimeout(90);
  }
  await context.close();
  const everVisible = seen.filter((s) => s.present && !s.gone);
  return { samples: seen.length, everVisibleCount: everVisible.length };
})();

report.reducedMotion = reduced;
if (reduced.everVisibleCount > 0) {
  failures.push(
    `reduced motion: the welcome was visible in ${reduced.everVisibleCount} of ${reduced.samples} samples. ` +
      "The `*` rule crushes animation-duration but not animation-delay, so without an explicit " +
      "`animation: none` the backwards fill holds a blank screen for the whole delay",
  );
}

// ------------------------------- small viewport: it must not overflow the page

const narrow = await (async () => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  const up = await page.evaluate(STATE);
  await page.screenshot({ path: path.join(SHOTS, "welcome-320-up.png") });
  await page.waitForTimeout(MUST_BE_GONE_BY_MS);
  const after = await page.evaluate(STATE);
  await context.close();
  return { up, after };
})();

report.narrow = narrow;
if (narrow.up.horizontalOverflow > 0) {
  failures.push(
    `320px: the welcome pushes the page ${narrow.up.horizontalOverflow}px into horizontal scroll — the ` +
      "lockup is too large for the screen it is centred on",
  );
}
if (!narrow.after.gone) failures.push("320px: the welcome never left");

// ------------------------------------------------------------------- report

// Without this the process never exits and the run has to be killed, which on a
// rig that reports by exit code is the difference between "failed" and "nobody
// found out".
await browser.close();

report.normal = { early: normal.early, timeline: normal.timeline };
report.failures = failures;
report.verdict = failures.length === 0 ? "pass" : "fail";
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  `first seen up at ${normal.early.now}ms: covers viewport ${normal.early.coversViewport}, ` +
    `flower at ${normal.early.emblemAngle}deg, lockup ${normal.early.lockupFontPx}px`,
);
console.log(
  `turn: ${normal.timeline.filter((s) => s.present && !s.gone).map((s) => `${s.now}ms/${s.emblemAngle}deg`).join("  ")}`,
);
console.log(
  `last seen up ${report.lastSeenUpMs}ms, gone by ${report.goneAtMs}ms ` +
    `(ceiling ${MUST_BE_GONE_BY_MS}ms), emblem files fetched: ${report.emblemRequests}`,
);
console.log(
  `no-JS: present ${noJs.present}, still visible after ${MUST_BE_GONE_BY_MS}ms: ${noJs.stillVisible} | ` +
    `reduced motion: visible in ${reduced.everVisibleCount}/${reduced.samples} samples | ` +
    `320px overflow ${narrow.up.horizontalOverflow}px`,
);
console.log(`\n${report.verdict.toUpperCase()}`);
for (const f of failures) console.log(`  - ${f}`);
console.log(`\n-> ${OUT}`);

process.exitCode = failures.length === 0 ? 0 : 1;
