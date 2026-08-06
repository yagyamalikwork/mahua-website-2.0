// The lantern that hangs into `06 · The Lantern Hour`: does it hang where it
// should, swing when pushed, and — the part that matters most — stop?
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_lantern.mjs
//
// Nine things, and each one is a claim about behaviour rather than about
// configuration. The distinction is this project's most expensive lesson
// (`docs/DECISIONS.md` §2): a check that the pendulum's constants are declared,
// or that a listener is attached, would pass on a lantern nailed to the wall.
//
//   1. It is server-rendered, decorative and untouchable — present in the HTML
//      with no JavaScript at all, `aria-hidden`, `pointer-events: none`.
//   2. It rotates about the top of its own chain, not the middle of its box.
//   3. It crosses the boundary, so it hangs *from* the photograph above.
//   4. It is drawn at the size `LANTERN_FIT` promises, at every width — the
//      assertion whose absence let a build ship 128px wide where 200 was meant.
//   5. It covers no word at any width, and is absent only in the one band that
//      has no room for it.
//   6. **A push swings it**, measured as real rotation in a real browser.
//   7. **It oscillates** — crosses back through vertical rather than easing one
//      way, which is the difference between a pendulum and a tween.
//   8. **It comes to rest, and the frame loop stops with it.** Counted by
//      patching `requestAnimationFrame`, because "settled" and "still running
//      forever at 0.0001 degrees" look identical in a screenshot and cost the
//      same battery as a full swing.
//   9. Reduced motion and a coarse pointer both keep the lantern and lose the
//      swing entirely.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-07-lantern/lantern.json");

const failures = [];

/** The band `LANTERN_FIT` hides it in — the only band it may be absent from. */
const HIDDEN = (w) => w >= 1024 && w <= 1279;
/** The width `LANTERN_FIT` promises at each viewport. */
const EXPECTED_WIDTH = (w) => (w >= 1440 ? 200 : w >= 1280 ? 128 : w >= 768 ? 168 : 128);

const SHAPES = [
  [390, 844], [768, 1024], [1024, 800], [1120, 900], [1279, 900],
  [1280, 800], [1439, 900], [1440, 900], [1920, 1080], [2560, 1440],
];

/** Degrees of rotation on an element, read off its rendered transform. */
const ANGLE_OF = () => {
  const el = document.querySelector("#lantern-hour [data-hanging-lantern]");
  if (!el) return null;
  const t = getComputedStyle(el).transform;
  if (t === "none") return 0;
  const m = new DOMMatrixReadOnly(t);
  return Number(((Math.atan2(m.b, m.a) * 180) / Math.PI).toFixed(4));
};

/** Bring the lantern into view and settle the page. */
async function reveal(page, height) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
  });
  const top = await page.evaluate(() => {
    const s = document.getElementById("lantern-hour");
    return Math.round(s.getBoundingClientRect().top + window.scrollY);
  });
  await page.evaluate((y) => window.scrollTo(0, y), top - Math.round(height * 0.2));
  await page.waitForTimeout(900);
}

/** Drag the pointer across the lantern, the way a hand would knock it. */
async function push(page) {
  const box = await page.evaluate(() => {
    const el = document.querySelector("#lantern-hour [data-hanging-lantern]");
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const y = box.y + box.h * 0.45;
  await page.mouse.move(box.x - 40, y);
  // Several steps rather than one jump: the push is computed from pointer
  // *velocity*, and a single teleport gives one enormous dt-less sample that a
  // real hand never produces.
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(box.x - 40 + ((box.w + 80) * i) / 8, y);
    await page.waitForTimeout(16);
  }
}

const browser = await chromium.launch();

// ------------------------------------------------- 1, 3, 4, 5: where it hangs

const fit = [];
for (const [width, height] of SHAPES) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await reveal(page, height);

  const r = await page.evaluate(() => {
    const section = document.getElementById("lantern-hour");
    const el = section.querySelector("[data-hanging-lantern]");
    if (!el) return { drawn: false };
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    if (box.width === 0 || style.display === "none") return { drawn: false };
    const s = section.getBoundingClientRect();
    const words = [];
    for (const n of section.querySelectorAll("p, h2, h3, span, a")) {
      if (n.children.length > 0 || !n.textContent.trim()) continue;
      const b = n.getBoundingClientRect();
      if (b.height === 0) continue;
      if (b.right > box.left && b.left < box.right && b.bottom > box.top && b.top < box.bottom) {
        words.push(n.textContent.trim().slice(0, 30));
      }
    }
    return {
      drawn: true,
      widthPx: Math.round(box.width),
      reachesIntoPhotographPx: Math.round(s.top - box.top),
      pointerEvents: style.pointerEvents,
      ariaHidden: el.getAttribute("aria-hidden"),
      loading: el.getAttribute("loading"),
      transformOrigin: style.transformOrigin,
      overWords: words,
    };
  });

  fit.push({ width, height, shouldHide: HIDDEN(width), ...r });

  if (HIDDEN(width)) {
    if (r.drawn) failures.push(`${width}px: the lantern is drawn in the band that has no room for it`);
  } else if (!r.drawn) {
    failures.push(`${width}px: no lantern at all`);
  } else {
    if (r.widthPx !== EXPECTED_WIDTH(width)) {
      failures.push(
        `${width}px: the lantern is ${r.widthPx}px wide, expected ${EXPECTED_WIDTH(width)}px — a width ` +
          "rule lost the cascade, which is exactly what shipped on 7 Aug when this check did not exist",
      );
    }
    if (r.overWords.length) {
      failures.push(`${width}px: the lantern covers ${r.overWords.map((t) => `"${t}"`).join(", ")}`);
    }
    if (r.reachesIntoPhotographPx <= 0) {
      failures.push(
        `${width}px: the lantern starts ${-r.reachesIntoPhotographPx}px below the section's top edge — ` +
          "it is sitting in the chapter, not hanging from the photograph above it",
      );
    }
    if (r.pointerEvents !== "none") {
      failures.push(`${width}px: pointer-events is ${r.pointerEvents} — it will eat clicks on the copy beneath`);
    }
    if (r.ariaHidden !== "true") failures.push(`${width}px: the lantern is not aria-hidden`);
    if (r.loading !== "lazy") failures.push(`${width}px: the lantern is not lazily loaded`);
  }
  await context.close();
}

// --------------------------------------------- 2, 6, 7, 8: does it swing, and stop

const swing = await (async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Count frames from before the page's own scripts run, so nothing is missed.
  await page.addInitScript(() => {
    window.__raf = 0;
    const real = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => {
      window.__raf++;
      return real(cb);
    };
  });

  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await reveal(page, 900);

  const origin = await page.evaluate(() => {
    const el = document.querySelector("#lantern-hour [data-hanging-lantern]");
    return { origin: getComputedStyle(el).transformOrigin, height: el.getBoundingClientRect().height };
  });

  const atRestBefore = await page.evaluate(ANGLE_OF);

  /**
   * Frames per second over a window.
   *
   * **Measured against a control, because this page always has a frame loop
   * running.** Lenis drives its smooth scroll from `requestAnimationFrame` and
   * never stops, so a raw count after the lantern settles is dominated by
   * something that has nothing to do with the lantern — the first version of this
   * check read 189 frames "still running" on a lantern that had correctly gone to
   * sleep. What is true is that the lantern's loop should add frames while it
   * swings and add none once it stops.
   */
  const rate = async (ms) => {
    const a = await page.evaluate(() => window.__raf);
    await page.waitForTimeout(ms);
    const b = await page.evaluate(() => window.__raf);
    return Number((((b - a) * 1000) / ms).toFixed(1));
  };

  const idleRate = await rate(1500);

  // The frames a human reads. At rest first, so the two can be compared.
  await mkdir(path.dirname(OUT), { recursive: true });
  await page.screenshot({ path: path.join(path.dirname(OUT), "lantern-1440-at-rest.png") });

  await push(page);
  // Around a quarter of the 1.6s period after the push, which is where the
  // amplitude peaks.
  await page.waitForTimeout(380);
  await page.screenshot({ path: path.join(path.dirname(OUT), "lantern-1440-mid-swing.png") });
  // Sample the rotation densely enough to see it cross vertical.
  const samples = [];
  const swingRate = await (async () => {
    const a = await page.evaluate(() => window.__raf);
    const started = Date.now();
    for (let i = 0; i < 25; i++) {
      samples.push(await page.evaluate(ANGLE_OF));
      await page.waitForTimeout(80);
    }
    const b = await page.evaluate(() => window.__raf);
    return Number((((b - a) * 1000) / (Date.now() - started)).toFixed(1));
  })();
  for (let i = 0; i < 65; i++) {
    samples.push(await page.evaluate(ANGLE_OF));
    await page.waitForTimeout(80);
  }

  // Well past the ~6.7s the envelope needs, then read the rate again.
  await page.waitForTimeout(3000);
  const restRate = await rate(1500);
  const atRestAfter = await page.evaluate(ANGLE_OF);

  await context.close();
  return { origin, atRestBefore, atRestAfter, samples, idleRate, swingRate, restRate };
})();

const peak = Math.max(...swing.samples.map(Math.abs));
// Sign changes past a threshold: a tween eased one way and back has none; a
// pendulum has several. The threshold keeps sensor noise around zero out of it.
const crossings = (() => {
  let n = 0;
  let sign = 0;
  for (const a of swing.samples) {
    if (Math.abs(a) < 0.4) continue;
    const s = Math.sign(a);
    if (sign !== 0 && s !== sign) n++;
    sign = s;
  }
  return n;
})();

if (swing.atRestBefore !== 0) {
  failures.push(`the lantern was already at ${swing.atRestBefore} degrees before anything touched it`);
}
if (peak < 1) {
  failures.push(
    `pushing the lantern moved it ${peak} degrees — it is not swinging. The push is computed from ` +
      "pointer velocity against a cached box; a stale box or a dead listener both look like this",
  );
}
if (crossings < 2) {
  failures.push(
    `the lantern crossed vertical ${crossings} time(s) — it swung one way and eased back rather than ` +
      "oscillating, which is a tween wearing a pendulum's name",
  );
}
if (Math.abs(swing.atRestAfter) > 0.3) {
  failures.push(`the lantern settled at ${swing.atRestAfter} degrees rather than hanging plumb`);
}
// The sensitivity check first. Without it the two assertions below would both
// pass on a lantern with no loop at all — "it adds no frames at rest" is trivially
// true of something that never ran. This is the "would this still pass if the
// feature were deleted?" question, asked in code.
if (swing.swingRate <= swing.idleRate + 8) {
  failures.push(
    `the frame rate while swinging (${swing.swingRate}/s) is no higher than the page's idle rate ` +
      `(${swing.idleRate}/s) — the lantern's own loop is not visible in the counter, so the rest check ` +
      "below proves nothing either way",
  );
}
if (swing.restRate > swing.idleRate + 8) {
  failures.push(
    `the frame rate ${swing.restRate}/s after the lantern came to rest is above the page's idle ` +
      `${swing.idleRate}/s — its loop is still running, so it arrives and performs but never dozes ` +
      "(non-negotiable #5)",
  );
}
{
  // The pivot must be the top of the chain. A `transform-origin` left at its
  // default is `50% 50%`, which reads as a picture being turned.
  const [, yPart] = swing.origin.origin.split(" ");
  const originY = Number.parseFloat(yPart);
  if (!Number.isFinite(originY) || originY > swing.origin.height * 0.1) {
    failures.push(
      `transform-origin is ${swing.origin.origin} on a ${Math.round(swing.origin.height)}px lantern — ` +
        "it is not pivoting from the top of its chain",
    );
  }
}

// ------------------------------------------- 9: reduced motion, coarse pointer

async function stillnessRun(label, options) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await reveal(page, 900);
  const present = await page.evaluate(() => Boolean(document.querySelector("#lantern-hour [data-hanging-lantern]")));
  if (!present) {
    failures.push(`${label}: the lantern is gone entirely — it should still hang, just not swing`);
    await context.close();
    return { present: false };
  }
  await push(page);
  await page.waitForTimeout(700);
  const moved = Math.abs(await page.evaluate(ANGLE_OF));
  await context.close();
  if (moved > 0.05) failures.push(`${label}: the lantern swung to ${moved} degrees when pushed`);
  return { present: true, movedDeg: moved };
}

const reduced = await stillnessRun("reduced motion", { reducedMotion: "reduce" });
const coarse = await stillnessRun("coarse pointer", { hasTouch: true, isMobile: true });

// ------------------------------------------------------------- no JavaScript

const noJs = await (async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const r = await page.evaluate?.(() => null).catch(() => null);
  const present = (await page.locator("#lantern-hour [data-hanging-lantern]").count()) > 0;
  await context.close();
  if (!present) {
    failures.push(
      "no JavaScript: the lantern is absent — it must be server-rendered and merely still, the way " +
        "the pinned collage degrades",
    );
  }
  return { present, r };
})();

await browser.close();

const report = {
  measuredAt: new Date().toISOString(),
  url: URL,
  method:
    "Rotation read from the rendered transform of [data-hanging-lantern] in a real browser, sampled " +
    "every 80ms for 7.2s after dragging the pointer across it. Frames counted by patching " +
    "requestAnimationFrame before the page's own scripts run. Fit swept across ten viewport shapes.",
  fit,
  swing: {
    peakDeg: Number(peak.toFixed(2)),
    crossingsOfVertical: crossings,
    settledAtDeg: swing.atRestAfter,
    transformOrigin: swing.origin.origin,
    /** Frames per second: the page idle, while the lantern swings, and after it stops. */
    framesPerSecond: { idle: swing.idleRate, swinging: swing.swingRate, atRest: swing.restRate },
    samples: swing.samples,
  },
  reducedMotion: reduced,
  coarsePointer: coarse,
  noJs,
  failures,
  verdict: failures.length === 0 ? "pass" : "fail",
};

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

for (const f of fit) {
  console.log(
    `${String(f.width).padStart(4)}x${String(f.height).padEnd(4)}  ` +
      (f.drawn
        ? `${String(f.widthPx).padStart(3)}px, ${f.reachesIntoPhotographPx}px into the photograph, ${f.overWords.length} words covered`
        : "absent"),
  );
}
console.log(
  `\npushed: peak ${peak.toFixed(2)}deg, crossed vertical ${crossings}x, settled at ${swing.atRestAfter}deg`,
);
console.log(
  `frames/s: page idle ${swing.idleRate}, swinging ${swing.swingRate}, after rest ${swing.restRate}`,
);
console.log(
  `reduced motion ${reduced.movedDeg ?? "-"}deg | coarse pointer ${coarse.movedDeg ?? "-"}deg | no-JS present ${noJs.present}`,
);
console.log(`\n${report.verdict.toUpperCase()}`);
for (const f of failures) console.log(`  - ${f}`);
console.log(`\n-> ${OUT}`);

process.exitCode = failures.length === 0 ? 0 : 1;
