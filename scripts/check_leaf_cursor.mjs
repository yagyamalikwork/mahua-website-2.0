// The leaf that follows the pointer — measured in a browser.
//
// Every claim this feature makes is a rendered outcome, and most of them are
// invisible when they break: a cursor that lags too far still looks like a
// cursor, a loop that never stops looks like nothing at all, and a chunk fetched
// on a phone shows up nowhere except somebody's data bill. So nothing here
// asserts that a mechanism is configured.
//
// Run it against a production build:
//
//   npm run build && npx next start -p 3100
//   node scripts/check_leaf_cursor.mjs
//
// Flags: --url --port --out

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";
import { CURSOR } from "../lib/motion.ts";
import { LEAF } from "../lib/leaf-art.ts";
import { PALETTE } from "../lib/palette.ts";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-05-signature/leaf-cursor.json");

const fails = [];
const fail = (m) => { fails.push(m); console.log(`   FAIL  ${m}`); };
const ok = (m) => console.log(`   ok    ${m}`);

/**
 * Where the leaf's tip is, from the element's own transform matrix.
 *
 * The matrix's translation is exactly what the loop wrote, and `transform-origin`
 * is a separate property that never enters it — so this is rotation- and
 * scale-independent, where a bounding box would grow as the leaf swings and quietly
 * report a moving tip that was not moving.
 */
const TIP = { x: LEAF.hotspot.x * LEAF.drawnWidth, y: LEAF.hotspot.y * CURSOR.sizePx };

const SEL = "[data-leaf-cursor]";
/**
 * **Wait, never assume.** The cursor arrives through a dynamic import, so it is
 * legitimately absent for the first few hundred milliseconds. A run that queried
 * too early reported no cursor at all against a perfectly good build.
 */
const settle = async (page) => {
  await page.waitForSelector(SEL, { state: "attached", timeout: 10_000 });
};

const report = { measuredAt: new Date().toISOString(), url: URL, cursor: CURSOR, tip: TIP };
const browser = await chromium.launch();

// ---------------------------------------------------------------------------
// 1. It is there on a fine pointer, and it has taken the arrow away.
// ---------------------------------------------------------------------------
{
  console.log("\n1. present on a fine pointer, and the arrow is gone");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);

  // The arrow only goes on the first pointer move, so that a failed chunk leaves
  // the visitor one. Before the move it must still be there.
  const before = await page.evaluate(() => getComputedStyle(document.documentElement).cursor);
  await page.mouse.move(700, 500);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => getComputedStyle(document.documentElement).cursor);
  const box = await page.$eval(SEL, (el) => {
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height), src: el.currentSrc.split("/").pop() };
  });
  report.present = { cursorBeforeFirstMove: before, cursorAfter: after, ...box };

  if (before === "none") fail("the arrow was taken away before the first pointer move — a failed chunk would leave no cursor at all");
  else ok(`the arrow survives until the first move (${before})`);

  if (after !== "none") fail(`after moving, the document cursor is "${after}" and not "none"`);
  else ok("the arrow is hidden once the leaf has landed");

  if (box.height !== CURSOR.sizePx) fail(`the leaf draws ${box.height}px tall, not CURSOR.sizePx (${CURSOR.sizePx})`);
  else ok(`draws ${box.width}x${box.height}, serving ${box.src}`);
  await page.close();
}

// ---------------------------------------------------------------------------
// 2. Follow accuracy, and the swing. Sampled every frame, in the page.
// ---------------------------------------------------------------------------
{
  console.log("\n2. it follows, it lags no further than the cap, and it swings");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);

  await page.evaluate((tip) => {
    window.__samples = [];
    window.__p = null;
    let previous = null;
    document.addEventListener("pointermove", (e) => { window.__p = { x: e.clientX, y: e.clientY }; }, { passive: true });
    const loop = () => {
      const el = document.querySelector("[data-leaf-cursor]");
      if (el && window.__p) {
        const m = new DOMMatrix(getComputedStyle(el).transform);
        // How far the pointer itself moved since the previous frame. The leaf
        // cannot be closer than this to the hand's *current* position, because it
        // has not been given a frame in which to react to it — see the note on
        // the assertion below.
        const travel = previous ? Math.hypot(window.__p.x - previous.x, window.__p.y - previous.y) : 0;
        previous = { ...window.__p };
        window.__samples.push({
          t: performance.now(),
          travel,
          err: Math.hypot(m.e + tip.x - window.__p.x, m.f + tip.y - window.__p.y),
          deg: (Math.atan2(m.b, m.a) * 180) / Math.PI,
        });
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, TIP);

  // A fast lateral flick, which is where lag and swing are largest.
  await page.mouse.move(200, 500);
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__samples.length = 0; });
  await page.mouse.move(1240, 520, { steps: 12 });
  await page.waitForTimeout(120);
  const moving = await page.evaluate(() => window.__samples.slice());
  await page.waitForTimeout(900);
  const rested = await page.evaluate(() => window.__samples.slice(-12));

  const restErr = Math.max(...rested.map((s) => s.err));
  const maxDeg = Math.max(...moving.map((s) => Math.abs(s.deg)));
  const restDeg = Math.max(...rested.map((s) => Math.abs(s.deg)));

  /**
   * **The bound is the clamp plus one frame of the pointer's own travel**, and
   * the second term is not slack — it is unavoidable.
   *
   * `CURSOR.maxLagPx` clamps the leaf against the last pointer position the loop
   * was given. Between that frame and the next, the hand keeps moving, and no
   * cursor can be closer to the hand's current position than the distance it has
   * covered since anything last had a chance to react — the operating system's
   * own arrow included.
   *
   * The first version of this asserted against the clamp alone and read 98.7px on
   * a correct build. The arithmetic gave it away: 98.7 = 12 (the clamp, exact)
   * plus 86.7 (one Playwright step of pointer travel), and the frame the pointer
   * stopped read exactly 12.0. The check was comparing the leaf against a place
   * the hand had already left.
   *
   * It still cannot be satisfied by a broken clamp. Without one, the steady-state
   * lag of a 0.22-per-frame ease is travel / 0.22 — about 4.5 frames of travel,
   * roughly 390px here against a bound of 99px.
   */
  const worst = moving.reduce(
    (acc, s) => (s.err - s.travel > acc.excess ? { excess: s.err - s.travel, ...s } : acc),
    { excess: -Infinity, err: 0, travel: 0 },
  );
  report.follow = {
    samplesWhileMoving: moving.length,
    worstErrorPx: +worst.err.toFixed(2),
    pointerTravelThatFramePx: +worst.travel.toFixed(2),
    excessOverTravelPx: +worst.excess.toFixed(2),
    clampPx: CURSOR.maxLagPx,
    restErrorPx: +restErr.toFixed(2),
    maxSwingDeg: +maxDeg.toFixed(2),
    restSwingDeg: +restDeg.toFixed(2),
  };

  if (moving.length < 5) fail(`only ${moving.length} frames sampled during the flick — the sampler saw nothing to judge`);
  else ok(`${moving.length} frames sampled across the flick`);

  // One pixel of tolerance for sub-pixel rounding in the transform.
  if (worst.excess > CURSOR.maxLagPx + 1) {
    fail(
      `the leaf trailed ${worst.err.toFixed(1)}px while the pointer covered ${worst.travel.toFixed(1)}px that frame — ` +
        `${worst.excess.toFixed(1)}px of its own lag, past the ${CURSOR.maxLagPx}px clamp`,
    );
  } else {
    ok(
      `its own lag never exceeded ${worst.excess.toFixed(1)}px (clamp ${CURSOR.maxLagPx}px); ` +
        `worst frame ${worst.err.toFixed(1)}px total, of which ${worst.travel.toFixed(1)}px was the pointer's own travel`,
    );
  }

  if (restErr > 2) fail(`at rest the leaf sits ${restErr.toFixed(1)}px from the pointer`);
  else ok(`at rest it sits ${restErr.toFixed(2)}px from the pointer`);

  // A leaf that never rotates is the sticker the whole design exists to avoid.
  if (maxDeg < 4) fail(`the leaf barely rotated during a fast move (${maxDeg.toFixed(1)} degrees) — it is riding rigidly`);
  else ok(`swung ${maxDeg.toFixed(1)} degrees at speed`);

  if (restDeg > 1) fail(`the leaf never returned to upright — ${restDeg.toFixed(1)} degrees at rest`);
  else ok(`settled back to ${restDeg.toFixed(2)} degrees`);
  await page.close();
}

// ---------------------------------------------------------------------------
// 3. The loop stops. The battery check.
// ---------------------------------------------------------------------------
{
  console.log("\n3. the animation loop stops when the hand does");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // Counted from before any of the page's own script runs.
  await page.addInitScript(() => {
    window.__raf = 0;
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => { window.__raf++; return original(cb); };
  });
  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);

  // **Lenis runs a permanent rAF loop of its own**, so an absolute count proves
  // nothing. The baseline is this page with the pointer untouched; the cursor has
  // never started. Anything above that afterwards is the cursor's own loop.
  const idleStart = await page.evaluate(() => window.__raf);
  await page.waitForTimeout(1000);
  const baseline = (await page.evaluate(() => window.__raf)) - idleStart;

  await page.mouse.move(400, 400);
  await page.mouse.move(900, 700, { steps: 10 });
  await page.waitForTimeout(1500); // well past any settle

  const restStart = await page.evaluate(() => window.__raf);
  await page.waitForTimeout(1000);
  const afterRest = (await page.evaluate(() => window.__raf)) - restStart;

  report.loop = { baselineFramesPerSecond: baseline, framesPerSecondAfterResting: afterRest };
  // A cursor loop still running would roughly double the count.
  if (afterRest > baseline * 1.35 + 5) {
    fail(`the loop is still running with the pointer at rest: ${afterRest} frames/s against a ${baseline} frames/s baseline`);
  } else {
    ok(`stops when the pointer does — ${afterRest} frames/s against a ${baseline} frames/s baseline`);
  }
  await page.close();
}

// ---------------------------------------------------------------------------
// 4. Gold over a link, and not over prose.
// ---------------------------------------------------------------------------
{
  console.log("\n4. it warms over something interactive, and only there");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);

  await page.mouse.move(700, 600);
  await page.waitForTimeout(500);
  const overProse = await page.$eval(SEL, (el) => ({ filter: getComputedStyle(el).filter, over: el.dataset.over }));

  const link = await page.$("[aria-controls='site-menu']");
  const lb = await link.boundingBox();
  await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2);
  await page.waitForTimeout(700);
  const overLink = await page.$eval(SEL, (el) => ({ filter: getComputedStyle(el).filter, over: el.dataset.over }));

  report.warm = { overProse, overLink };

  if (overProse.filter !== "none") fail(`over prose the leaf is already filtered (${overProse.filter})`);
  else ok("over prose it is the drawing's own colour");

  if (overLink.filter === "none" || overLink.over !== "true") {
    fail(`over a link the leaf did not warm (filter ${overLink.filter}, data-over ${overLink.over})`);
  } else {
    ok(`over a link it warms toward ${PALETTE.gold} (${overLink.filter.split(")")[0]})...)`);
  }
  await page.close();
}

// ---------------------------------------------------------------------------
// 5. A focused text field gets the I-beam back.
// ---------------------------------------------------------------------------
{
  console.log("\n5. typing gets the I-beam back");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await settle(page);
  await page.mouse.move(700, 500);
  await page.waitForTimeout(300);

  // The home page has no text field yet; a booking form is a stated future page,
  // so the behaviour is written and checked now against an injected one rather
  // than discovered later on a form nobody tested this against.
  const state = await page.evaluate(() => {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "rig-input";
    document.body.append(input);
    input.focus();
    const el = document.querySelector("[data-leaf-cursor]");
    const focused = { visibility: getComputedStyle(el).visibility, cursor: getComputedStyle(document.documentElement).cursor };
    input.blur();
    return { focused, blurred: { visibility: getComputedStyle(el).visibility, cursor: getComputedStyle(document.documentElement).cursor } };
  });
  report.textField = state;

  if (state.focused.visibility !== "hidden" || state.focused.cursor === "none") {
    fail(`with a text field focused the leaf is ${state.focused.visibility} and the cursor is "${state.focused.cursor}"`);
  } else {
    ok("the leaf hides and the I-beam returns");
  }
  if (state.blurred.visibility === "hidden" || state.blurred.cursor !== "none") {
    fail(`after blurring, the leaf is ${state.blurred.visibility} and the cursor is "${state.blurred.cursor}"`);
  } else {
    ok("and both come back on blur");
  }
  await page.close();
}

// ---------------------------------------------------------------------------
// 6. Reduced motion: no leaf, and the visitor keeps their own cursor.
// ---------------------------------------------------------------------------
{
  console.log("\n6. reduced motion leaves the visitor their own cursor");
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.mouse.move(700, 500);
  await page.waitForTimeout(1200);

  const state = await page.evaluate(() => ({
    leaf: !!document.querySelector("[data-leaf-cursor]"),
    cursor: getComputedStyle(document.documentElement).cursor,
  }));
  report.reducedMotion = state;

  if (state.leaf) fail("a leaf is rendered under prefers-reduced-motion");
  else ok("no leaf is rendered");
  if (state.cursor === "none") fail("the arrow was taken away under prefers-reduced-motion");
  else ok(`the visitor keeps their own cursor (${state.cursor})`);
  await context.close();
}

// ---------------------------------------------------------------------------
// 7. A coarse pointer pays nothing. Asserted on the network.
// ---------------------------------------------------------------------------
{
  console.log("\n7. a phone never fetches any of it");

  const load = async (context) => {
    const page = await context.newPage();
    const js = new Map();
    const images = [];
    const pending = [];
    page.on("response", (res) => {
      const url = res.url();
      if (url.endsWith(".js")) {
        // The transferred size, not `content-length` — a chunked response has no
        // such header and reports 0, which would let an empty measurement pass as
        // a saving.
        pending.push(
          res
            .request()
            .sizes()
            .then((s) => js.set(url.split("/").pop(), s.responseBodySize))
            .catch(() => js.set(url.split("/").pop(), 0)),
        );
      }
      if (/\/brand\/leaf-/.test(url)) images.push(url.split("/").pop());
    });
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await Promise.all(pending);
    const coarse = await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches);
    const leaf = await page.evaluate(() => !!document.querySelector("[data-leaf-cursor]"));
    await page.close();
    return { js, images, coarse, leaf };
  };

  const fineContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const fine = await load(fineContext);
  await fineContext.close();

  const phoneContext = await browser.newContext({ ...devices["Pixel 5"] });
  const phone = await load(phoneContext);
  await phoneContext.close();

  // **The emulation has to be real, or this whole check is vacuous.** A phone
  // context that still reports a fine pointer would render the cursor and pass a
  // naive byte comparison for the wrong reason.
  if (!phone.coarse) {
    fail("the phone context still reports a fine pointer — this check proves nothing as written");
  } else {
    ok("the phone context reports a coarse pointer");
  }

  const onlyOnDesktop = [...fine.js.keys()].filter((k) => !phone.js.has(k));
  const savedKB = onlyOnDesktop.reduce((n, k) => n + (fine.js.get(k) ?? 0), 0) / 1024;
  report.coarsePointer = {
    fineRendersLeaf: fine.leaf,
    phoneRendersLeaf: phone.leaf,
    phoneLeafImages: phone.images,
    fineLeafImages: fine.images,
    chunksOnlyOnDesktop: onlyOnDesktop,
    savedKB: +savedKB.toFixed(1),
  };

  if (phone.leaf) fail("a leaf is rendered on a coarse pointer");
  else ok("no leaf is rendered on a coarse pointer");

  if (phone.images.length > 0) fail(`a phone fetched the leaf artwork: ${phone.images.join(", ")}`);
  else ok("a phone fetches none of the leaf artwork");

  if (fine.images.length === 0) {
    fail("a desktop fetched no leaf artwork either — the comparison above proves nothing");
  } else {
    ok(`a desktop fetches ${fine.images.join(", ")}`);
  }

  if (onlyOnDesktop.length === 0) {
    fail("no JavaScript chunk is desktop-only — the cursor is not behind a dynamic import at all");
  } else {
    ok(`${onlyOnDesktop.length} chunk(s) a phone never requests, ${savedKB.toFixed(1)} KB`);
  }
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
