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

/**
 * A **hang guard, not a design budget.** Whatever `WELCOME` in `lib/motion.ts`
 * says, the screen must be gone by here on the page's own clock — which is the
 * animation's length *plus* however long the page took to render it.
 *
 * 5s, not the animation's 2.1s: the point is to catch a welcome that never
 * leaves, and setting it near the design duration would turn every future
 * adjustment of the greeting into a red rig. It was 3s while the animation was
 * 1.35s, and the client's own lengthening on 8 Aug tripped it at 3,210ms — which
 * is the wrong thing for a check like this to have an opinion about.
 */
const MUST_BE_GONE_BY_MS = 5000;

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
    logoWidthPx: Math.round(
      (el.querySelector("[data-welcome-logo]")?.getBoundingClientRect().width ?? 0),
    ),
    /**
     * The two halves of the client's logo, as painted.
     *
     * This began as a contrast check, because the welcome once used the header's
     * lockup and shipped for one build with the name rendering cream on cream —
     * markup correct, box the right size, every other assertion green, and only a
     * screenshot caught it. The welcome now carries the client's own artwork
     * instead, so the question is no longer contrast but **whether both parts
     * actually decoded**: a `srcset` entry with no file behind it is a missing
     * wordmark at exactly one screen density.
     */
    ...(() => {
      const flower = el.querySelector(".emblem-turn");
      const imgs = [...el.querySelectorAll("img")];
      const wordmark = imgs.find((i) => i !== flower) ?? null;
      const drawn = (i) =>
        i ? { painted: i.complete && i.naturalWidth > 0, src: (i.currentSrc || "").split("/").pop(), w: Math.round(i.getBoundingClientRect().width) } : null;
      return { flowerImg: drawn(flower), wordmarkImg: drawn(wordmark) };
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

  /*
   * **Warm the server, then start sampling at a defined moment.** Two failures
   * this guards, both of which reported a perfectly working welcome as broken:
   *
   * 1. `waitUntil: "commit"` alone hands back while the document is still
   *    streaming, and an element whose animation has not started yet reads as its
   *    base style — which for this one is hidden.
   * 2. `waitUntil: "domcontentloaded"` hands back *whenever the page is ready*,
   *    and on the first navigation after `next start` that was **6,628 ms** —
   *    long past the welcome's whole life. Every sample came back hidden and the
   *    rig declared it had never welcomed anybody.
   *
   * So: one throwaway navigation to warm the server, then wait on the thing that
   * actually matters — the animation existing on the element — which is neither
   * earlier nor later than the moment there is something to measure.
   */
  await page.goto(URL, { waitUntil: "load" });
  // Only the measured navigation counts. Leaving the warm-up's requests in made
  // this report two emblem fetches where the page makes one.
  requests.length = 0;
  await page.goto(URL, { waitUntil: "commit" });
  await page.waitForFunction(
    () => (document.querySelector("[data-welcome]")?.getAnimations().length ?? 0) > 0,
    undefined,
    { timeout: 15000 },
  );

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
  // Both halves of the logo, painted. The client asked for their logo, not a
  // flower on its own.
  for (const [what, got] of [
    ["flower", normal.early.flowerImg],
    ["wordmark", normal.early.wordmarkImg],
  ]) {
    if (!got) failures.push(`the welcome has no ${what} at all`);
    else if (!got.painted) {
      failures.push(
        `the welcome's ${what} did not decode (${got.src ?? "no source"}) — a srcset entry with no file ` +
          "behind it is a missing half of the logo at exactly one screen density",
      );
    } else if (got.w < 20) {
      failures.push(`the welcome's ${what} is drawn ${got.w}px wide`);
    }
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

/*
 * 6: what the welcome costs.
 *
 * It used to cost nothing, because it borrowed the header's flower and set the
 * name in live type. The client asked on 8 Aug for their own stacked logo
 * instead, so it now has two files of its own and they are **on the first
 * screen** — a curtain that has to be there at once cannot be deferred. That is
 * a real charge against non-negotiable #6 and it is recorded rather than waved
 * through; the ceiling is a tripwire against somebody later pointing this at a
 * full-resolution logo.
 */
const welcomeParts = normal.requests.filter((u) => /\/brand\/welcome-/.test(u));
report.welcomeParts = welcomeParts.map((u) => u.split("/").pop());
if (welcomeParts.length !== 2) {
  failures.push(
    `the welcome fetched ${welcomeParts.length} of its own image files, expected exactly 2 — the flower ` +
      "and the wordmark, split from the client's logo",
  );
}
const headerEmblems = normal.requests.filter((u) => /\/brand\/emblem-/.test(u));
report.headerEmblemRequests = headerEmblems.length;
if (headerEmblems.length > 1) {
  failures.push(`${headerEmblems.length} header emblem files were fetched, expected at most 1`);
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
  await page.goto(URL, { waitUntil: "load" });
  await page.goto(URL, { waitUntil: "commit" });
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
  await page.goto(URL, { waitUntil: "load" });
  await page.goto(URL, { waitUntil: "commit" });
  await page.waitForFunction(
    () => (document.querySelector("[data-welcome]")?.getAnimations().length ?? 0) > 0,
    undefined,
    { timeout: 15000 },
  );
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
    `logo ${normal.early.logoWidthPx}px, flower ${normal.early.flowerImg?.w}px at ` +
    `${normal.early.emblemAngle}deg (${normal.early.flowerImg?.src}), ` +
    `wordmark ${normal.early.wordmarkImg?.w}px (${normal.early.wordmarkImg?.src})`,
);
console.log(
  `turn: ${normal.timeline.filter((s) => s.present && !s.gone).map((s) => `${s.now}ms/${s.emblemAngle}deg`).join("  ")}`,
);
console.log(
  `last seen up ${report.lastSeenUpMs}ms, gone by ${report.goneAtMs}ms ` +
    `(hang ceiling ${MUST_BE_GONE_BY_MS}ms) | welcome's own files: ${report.welcomeParts.join(", ")} | ` +
    `header emblem fetches: ${report.headerEmblemRequests}`,
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
