// The pinned collage, measured rather than inspected.
//
// Plan 4 Task 3c mounts `StickyScene` for the first time and hangs three
// scrubbed drifts off it. Every claim in that sentence is invisible to a unit
// test: jsdom has no layout, no sticky positioning, no scroll and no GSAP. And
// every one of them is the shape this project has been burned by nine times — a
// check that confirms a *mechanism was configured* rather than that *behaviour
// changed*. `[data-drift="0.12"]` being in the markup says nothing about whether
// a photograph moved.
//
// So nothing below reads an attribute and calls it a finding. Each check is a
// pair of rendered positions, read out of a real browser at real scroll offsets:
//
//   1. **The headline is frozen.** Its position *in the viewport* is read at
//      several scroll offsets across the pin. A headline that is not pinned
//      travels one-for-one with the scroll; a pinned one does not move at all.
//   2. **The photographs drift, and not together.** Each `[data-drift]` element's
//      position in the viewport is read at the same offsets. A drift of zero is
//      the library never arriving; three equal drifts are one sliding sheet
//      rather than three depths.
//   3. **The pin lets go.** Past the end of the scene the headline must leave the
//      screen, or the chapter is stuck to the viewport for the rest of the page.
//   4. **Reduced motion reserves nothing.** The chapter's height is compared
//      against the same page with the pin on: it must be shorter by roughly the
//      scroll the pin reserved, not merely still.
//   5. **No JavaScript is readable.** Rendered text and painted photographs in a
//      context with `javaScriptEnabled: false` — not the server markup inspected
//      from outside — plus the same height check as (4).
//
// Run (with `npm run build && npx next start -p 3100` already up):
//   node scripts/check_pinned_collage.mjs
//   node scripts/check_pinned_collage.mjs --out docs/reviews/<date>/collage.json

import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-05-scroll-craft/collage.json");
const SHOTS = path.dirname(OUT);
const CHAPTER = flag("chapter", "rooted");
/** The viewport the pin is designed for, and the one density is measured at. */
const WIDTH = Number(flag("width", "1440"));
const HEIGHT = Number(flag("height", "900"));
/** How still "frozen" has to be, in CSS px, over the whole pin. */
const FROZEN_TOLERANCE = 2;
/** The least two photographs' travels may differ by and still read as two depths. */
const MIN_RATE_SPREAD = 20;

const failures = [];

async function open(browser, { reducedMotion = false, javaScript = true, width = WIDTH } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: HEIGHT },
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    javaScriptEnabled: javaScript,
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(javaScript ? 2500 : 800);
  return { context, page };
}

/**
 * Where the section starts, how tall it is, and — separately — where its pinned
 * scene starts and how tall *it* is, all in document space.
 *
 * The scene is reported in its own right because the section is taller than it
 * by the chapter's vertical padding, and the pinned band is a property of the
 * scene alone: sticky takes hold when the scene's top reaches the top of the
 * screen and lets go when its bottom reaches the bottom. Deriving the band from
 * the section instead means sampling outside it by however much padding happens
 * to be, and everything on screen moves with the page out there. That is not
 * hypothetical — it is what this rig did until the pin was shortened on 5 Aug
 * 2026, at which point the margin it allowed for exceeded the padding and it
 * reported a perfectly frozen headline as having moved 40px.
 */
const SECTION_METRICS = (id) => {
  const section = document.getElementById(id);
  if (!section) return null;
  const box = section.getBoundingClientRect();
  const scene = section.querySelector(".sticky-scene");
  const sceneBox = scene?.getBoundingClientRect();
  return {
    top: Math.round(box.top + window.scrollY),
    height: Math.round(box.height),
    documentHeight: document.documentElement.scrollHeight,
    screens: Number((box.height / window.innerHeight).toFixed(2)),
    hasScene: Boolean(scene),
    /** The scroll the pin reserves: everything past the one screen it shows. */
    reservedScroll: sceneBox ? Math.round(sceneBox.height - window.innerHeight) : 0,
    sceneTop: sceneBox ? Math.round(sceneBox.top + window.scrollY) : null,
    sceneHeight: sceneBox ? Math.round(sceneBox.height) : 0,
    drifters: section.querySelectorAll("[data-drift]").length,
  };
};

/**
 * Viewport-space positions of the frozen headline and every drifting photograph.
 *
 * Viewport space and not document space, deliberately: "frozen" is a claim about
 * where a thing sits on the *screen* while the document moves underneath it, and
 * a document-space reading of a pinned element changes by exactly the scroll,
 * which would make a pinned headline look like it was travelling at full speed.
 */
const FRAME = (id) => {
  const section = document.getElementById(id);
  if (!section) return null;
  const heading = section.querySelector("h1, h2, h3");
  return {
    scrollY: Math.round(window.scrollY),
    heading: heading ? Math.round(heading.getBoundingClientRect().top) : null,
    photographs: [...section.querySelectorAll("[data-drift]")].map((el) => ({
      rate: Number(el.dataset.drift),
      top: Math.round(el.getBoundingClientRect().top),
    })),
  };
};

async function readAt(page, y, id) {
  await page.evaluate((to) => window.scrollTo(0, to), y);
  // Lenis smooths the jump, so `scrollTo` is a request rather than an
  // assignment. Wait for it to settle and read `scrollY` back rather than
  // assuming the page went where it was told.
  await page.waitForTimeout(700);
  return page.evaluate(FRAME, id);
}

const browser = await chromium.launch();

// ------------------------------------------------------------- the pinned run

const { context, page } = await open(browser);
const pinned = await page.evaluate(SECTION_METRICS, CHAPTER);
if (!pinned) throw new Error(`no #${CHAPTER} on the page — the rig is broken, not the page`);

/**
 * Where the pin holds — read off the scene itself, not off the section, and with
 * a margin small enough to stay inside a one-screen pin. Sticky takes hold when
 * the scene's top reaches the top of the screen and lets go `reservedScroll`
 * later. Sampled at the two ends and three points between, because a single pair
 * of readings cannot tell a frozen headline from one that happens to be in the
 * same place at both.
 */
const BAND_MARGIN = 30;
const pinStart = pinned.sceneTop + BAND_MARGIN;
const pinEnd = pinned.sceneTop + pinned.reservedScroll - BAND_MARGIN;
const samples = [];
for (let i = 0; i <= 4; i++) {
  samples.push(await readAt(page, Math.round(pinStart + ((pinEnd - pinStart) * i) / 4), CHAPTER));
}

// The frame behind the numbers: the last screen of the pin, where the
// photographs have risen as far as they go. WebP, like every other shot in
// docs/reviews — the PNG is a step on the way and does not survive it.
await mkdir(SHOTS, { recursive: true });
const tmpShot = path.join(SHOTS, "_collage-tmp.png");
await page.screenshot({ path: tmpShot });
await sharp(tmpShot).webp({ quality: 84 }).toFile(path.join(SHOTS, `collage-${WIDTH}-pin-end.webp`));
await unlink(tmpShot);

const headingTops = samples.map((s) => s.heading);
const headingRange = Math.max(...headingTops) - Math.min(...headingTops);
const scrollTravelled = samples[samples.length - 1].scrollY - samples[0].scrollY;

const travels = pinned.drifters
  ? samples[0].photographs.map((first, i) => {
      const tops = samples.map((s) => s.photographs[i].top);
      return {
        rate: first.rate,
        travelPx: Math.round(Math.max(...tops) - Math.min(...tops)),
        // Positive means it ended higher up the screen than it started, which is
        // the "floating up past the headline" the client described.
        rose: tops[0] > tops[tops.length - 1],
        tops,
      };
    })
  : [];

// Past the end of the scene the headline must be gone from the screen.
const afterRelease = await readAt(page, pinned.top + pinned.height + HEIGHT, CHAPTER);
await context.close();

// ----------------------------------------------------- reduced motion, no-JS

const reduced = await (async () => {
  const { context: c, page: p } = await open(browser, { reducedMotion: true });
  const metrics = await p.evaluate(SECTION_METRICS, CHAPTER);
  await c.close();
  return metrics;
})();

const noJs = await (async () => {
  const { context: c, page: p } = await open(browser, { javaScript: false });
  const metrics = await p.evaluate(SECTION_METRICS, CHAPTER);
  const readable = await p.evaluate((id) => {
    const section = document.getElementById(id);
    const heading = section?.querySelector("h1, h2, h3");
    const images = [...(section?.querySelectorAll("img") ?? [])];
    return {
      heading: (heading?.textContent ?? "").replace(/\s+/g, " ").trim(),
      words: (section?.textContent ?? "").trim().split(/\s+/).length,
      photographs: images.length,
      // A photograph that is present but not painted is not readable.
      painted: images.filter((img) => {
        const box = img.getBoundingClientRect();
        const cs = getComputedStyle(img);
        return box.width > 40 && box.height > 40 && Number(cs.opacity) > 0.9;
      }).length,
    };
  }, CHAPTER);
  await c.close();
  return { ...metrics, ...readable };
})();

/**
 * The chunks carrying GSAP, matched on the library's own internals rather than
 * on a filename — the chunk names are content hashes, and a bundled copy never
 * contains the string "gsap" in its module path. Same technique, and the same
 * `_gsap` marker, as `scripts/measure_js_budget.mjs`.
 */
async function gsapChunkNames() {
  const dir = path.join(process.cwd(), ".next/static/chunks");
  const found = [];
  for (const name of await readdir(dir)) {
    if (!name.endsWith(".js")) continue;
    const text = await readFile(path.join(dir, name), "utf8").catch(() => "");
    if (/_gsap\b/.test(text)) found.push(name);
  }
  return found;
}

/**
 * The failure this rig exists for second: **the tween library never arrives.**
 *
 * A flaky connection, a blocked CDN, an aborted fetch on a slow phone — and
 * `scrub.ts` memoises the rejected promise, so there is no second attempt. If
 * the scene stays pinned through that, the visitor scrolls a whole screen of a
 * composition in which nothing whatsoever moves: the paid-for empty screen that
 * `StickyScene`'s own comment forbids and that this entire task exists to earn
 * its way out of.
 *
 * So the chunks are aborted at the network, the page is scrolled to within a
 * screen of the chapter (which is what makes `whenNear` attempt the import at
 * all), and the *rendered height of the section* is what is read back. Not
 * whether a catch block ran.
 */
const gsapBlocked = await (async () => {
  const names = await gsapChunkNames().catch(() => null);
  if (!names || names.length === 0) {
    return { ran: false, reason: "no .next/static/chunks carrying GSAP — is this a local build?" };
  }
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await ctx.newPage();
  let blocked = 0;
  await page.route("**/*.js", (route) => {
    const file = new global.URL(route.request().url()).pathname.split("/").pop();
    if (!names.includes(file)) return route.continue();
    blocked++;
    return route.abort("failed");
  });
  await page.goto(URL, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(2000);
  // Within one screen of the scene is where `whenNear` fires and the import is
  // attempted — and therefore where it fails.
  const top = await page.evaluate((id) => {
    const s = document.getElementById(id);
    return Math.round(s.getBoundingClientRect().top + window.scrollY);
  }, CHAPTER);
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, top - HEIGHT));
  await page.waitForTimeout(2500);
  const metrics = await page.evaluate(SECTION_METRICS, CHAPTER);
  await ctx.close();
  return { ran: true, chunks: names.length, blocked, ...metrics };
})();

// A narrow window must not pin either — the frozen composition does not fit one.
const narrow = await (async () => {
  const { context: c, page: p } = await open(browser, { width: 1280 });
  const metrics = await p.evaluate(SECTION_METRICS, CHAPTER);
  await c.close();
  return metrics;
})();

await browser.close();

// ------------------------------------------------------------- the assertions

if (!pinned.hasScene) failures.push(`#${CHAPTER} has no .sticky-scene at ${WIDTH}x${HEIGHT} — nothing is pinned`);
if (pinned.drifters === 0) failures.push(`#${CHAPTER} has no [data-drift] photographs`);

if (headingRange > FROZEN_TOLERANCE) {
  failures.push(
    `the headline moved ${headingRange}px in the viewport across ${scrollTravelled}px of scroll — it is not frozen`,
  );
}
// The other half: "frozen" is only a finding if the page really scrolled under
// it. Stated as a share of the scroll the pin reserves rather than as a screen,
// because the pin's length is a design decision that has already changed once —
// it was three screens until the client shortened it on 5 Aug 2026, and a fixed
// one-screen floor would have failed a perfectly good two-screen pin for the
// arithmetic reason that this rig leaves a margin at each end of the band.
const reservedScroll = pinned.reservedScroll;
if (scrollTravelled < reservedScroll * 0.6) {
  failures.push(
    `only ${scrollTravelled}px of scroll happened inside the pin, which reserves ${reservedScroll}px — ` +
      "the headline held still because nothing moved",
  );
}

for (const t of travels) {
  if (t.travelPx < 20) {
    failures.push(
      `the photograph at rate ${t.rate} drifted ${t.travelPx}px across the whole pin — the deferred GSAP import never arrived, or the scrub is dead`,
    );
  }
  if (!t.rose) {
    failures.push(`the photograph at rate ${t.rate} sank rather than floating up past the headline`);
  }
}

const distinct = [...new Set(travels.map((t) => t.travelPx))];
if (travels.length > 1 && distinct.length !== travels.length) {
  failures.push(
    `two photographs drifted exactly the same distance (${travels.map((t) => t.travelPx).join(", ")}px) — that reads as one sliding sheet, not as depth`,
  );
}
const sorted = [...travels].sort((a, b) => a.travelPx - b.travelPx);
for (let i = 1; i < sorted.length; i++) {
  const gap = sorted[i].travelPx - sorted[i - 1].travelPx;
  if (gap < MIN_RATE_SPREAD) {
    failures.push(
      `two photographs drifted ${sorted[i - 1].travelPx}px and ${sorted[i].travelPx}px — ${gap}px apart is not "slightly different speeds", it is the same speed`,
    );
  }
}

if (afterRelease.heading !== null && afterRelease.heading > -200 && afterRelease.heading < HEIGHT) {
  failures.push(
    `the headline was still on screen ${HEIGHT}px past the end of the chapter (top ${afterRelease.heading}) — the pin never let go`,
  );
}

// Reduced motion and no-JS must lose the pin AND the scroll it reserved.
for (const [name, m] of [
  ["reduced motion", reduced],
  ["no JavaScript", noJs],
  ["1280px wide", narrow],
]) {
  if (m.hasScene) failures.push(`${name}: the scene is still pinned`);
  // Stated as a share of the scroll the pin reserves, not as "within one screen
  // of the pinned height". The unpinned composition is not the pinned one, so
  // the two heights never differ by exactly the reservation — what has to be
  // true is that most of it is gone. The absolute form was right for a
  // three-screen pin and wrong for the two-screen one the client asked for.
  if (pinned.height - m.height < reservedScroll * 0.6) {
    failures.push(
      `${name}: #${CHAPTER} is ${m.height}px tall against ${pinned.height}px pinned, only ` +
        `${pinned.height - m.height}px shorter — the pin reserves ${reservedScroll}px and most of it ` +
        "is still there, so a visitor travels through empty screens",
    );
  }
}

// A pin whose scrub never loaded is a pin holding a still composition.
if (!gsapBlocked.ran) {
  failures.push(`the blocked-GSAP check did not run: ${gsapBlocked.reason}`);
} else {
  if (gsapBlocked.blocked === 0) {
    failures.push(
      "the blocked-GSAP check aborted no requests — the page never asked for the library, so the check proved nothing",
    );
  }
  if (gsapBlocked.hasScene) {
    failures.push(
      `GSAP blocked: the scene is still pinned and #${CHAPTER} is ${gsapBlocked.height}px tall — ` +
        "a screen of a composition in which nothing can move, and `scrub.ts` memoises the rejected " +
        "promise so it will never retry",
    );
  }
  if (pinned.height - gsapBlocked.height < reservedScroll * 0.6) {
    failures.push(
      `GSAP blocked: #${CHAPTER} is ${gsapBlocked.height}px against ${pinned.height}px pinned — the ` +
        `${reservedScroll}px the pin reserves survived a failure that makes it worthless`,
    );
  }
}

if (noJs.photographs < 3 || noJs.painted < 3) {
  failures.push(
    `no JavaScript: ${noJs.painted}/${noJs.photographs} photographs painted in #${CHAPTER}, expected 3`,
  );
}
if (!noJs.heading) failures.push("no JavaScript: the chapter has no readable headline");
if (noJs.words < 100) failures.push(`no JavaScript: only ${noJs.words} words in #${CHAPTER}`);

// ------------------------------------------------------------------- report

const report = {
  measuredAt: new Date().toISOString(),
  url: URL,
  chapter: CHAPTER,
  viewport: `${WIDTH}x${HEIGHT}`,
  method:
    "Viewport-space positions of the chapter's heading and of every [data-drift] photograph, read " +
    "at five scroll offsets across the pinned band of a real browser. Frozen is a range of " +
    `<=${FROZEN_TOLERANCE}px while the page scrolls under it; drift is the range of each ` +
    "photograph's own positions over the same offsets. Reduced motion, no-JS and a narrow window " +
    "are compared on the section's rendered height, not on whether an attribute is present.",
  pinned,
  scrollTravelled,
  heading: { tops: headingTops, rangePx: headingRange },
  travels,
  afterRelease,
  reduced,
  noJs,
  gsapBlocked,
  narrow,
  failures,
  verdict: failures.length === 0 ? "pass" : "fail",
};

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  `#${CHAPTER} at ${WIDTH}x${HEIGHT}: ${pinned.screens} screens tall, ` +
    `${pinned.hasScene ? "pinned" : "NOT pinned"} over ${pinned.reservedScroll}px of reserved scroll, ` +
    `${pinned.drifters} drifting photographs`,
);
console.log(
  `headline held within ${headingRange}px while ${scrollTravelled}px of page scrolled beneath it`,
);
for (const t of travels) console.log(`  rate ${t.rate}  drifted ${t.travelPx}px  ${t.rose ? "up" : "DOWN"}`);
console.log(
  `GSAP blocked (${gsapBlocked.blocked ?? 0} chunk requests aborted): ${gsapBlocked.height}px / scene ${gsapBlocked.hasScene}`,
);
console.log(
  `reduced motion ${reduced.height}px / scene ${reduced.hasScene} | ` +
    `no-JS ${noJs.height}px / ${noJs.painted} photographs / ${noJs.words} words | ` +
    `1280px ${narrow.height}px / scene ${narrow.hasScene} | pinned ${pinned.height}px`,
);
console.log(`\n${report.verdict.toUpperCase()}`);
for (const f of failures) console.log(`  - ${f}`);
console.log(`\n-> ${OUT}`);

process.exitCode = failures.length === 0 ? 0 : 1;
