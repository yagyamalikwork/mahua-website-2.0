// Image density and empty space — the two client complaints that are numbers.
//
// The client rejected the previous build for "too few images" and "too much
// empty space". CLAUDE.md turns the second into non-negotiable #8: *no section
// may render more than 45% empty space at 1440x900*. Nothing measured it until
// this rig; one band of `field-days` had been called "~32%" by eye, which is
// exactly the kind of assurance this project has twice been embarrassed by.
//
// **The figure was 30% here until 5 Aug 2026, three days after CLAUDE.md moved
// it.** The rule changed on 4 Aug when this same rig, pointed at the reference
// site the client chose, scored it 58.1% mean empty against our 42.9% — the
// budget was stricter than the benchmark it existed to chase — and 45% is the
// midpoint the client picked. The constant here was never updated, so every run
// since has printed OVER against a number nothing enforces. It is corrected
// rather than reinterpreted: `passesMean` is the rule as CLAUDE.md #8 states it
// and as its own table of failing chapters applies it, and `worstEmptyPercent`
// is still reported beside it so the single emptiest screen in a chapter cannot
// hide inside a mean.
//
// ## The unit is a screen
//
// Occupancy is measured **per scroll position**: stop every 150px, hit-test the
// 1440x900 in front of you, record what share of it is occupied, move on. The
// complaint was "too much empty space", and what a visitor experiences as empty
// is a screen they have stopped on. Each chapter is then scored from the screens
// that fall inside it — the mean, and more usefully the worst.
//
// An earlier version stamped every screen's findings into one document-wide grid
// at `scrollY + y`. That is wrong wherever anything is pinned: a `position:
// sticky` photograph holds still in the viewport while the document scrolls
// past, so it gets stamped across hundreds of document rows it never occupied.
// The reference site pins several sections and the smear was plainly visible in
// the overlay.
//
// ## What counts as occupied
//
// Each screen is sampled on a 6px grid and every cell centre is **hit-tested**
// with `document.elementsFromPoint`, which returns what is painted there,
// topmost first. Walking that stack downwards, the cell is occupied if the first
// thing it meets is:
//
//   - **A photograph** — an `<img>`, `<svg>`, `<video>`, `<canvas>`, or an
//     element carrying a `background-image`.
//   - **A line of type** — the point falls inside a line box of some text node
//     inside that element, from `Range.getClientRects()`. A paragraph capped at
//     `max-w-[52ch]` is therefore credited with the width its lines actually
//     reach rather than the width of its column, and the space beside a short
//     last line counts as empty, which it is.
//
// The walk stops at the first **opaque background**. That is how the cream paper
// registers as empty, and how anything painted underneath it is ignored.
//
// Hit-testing rather than geometry, because geometry gets this wrong twice over:
// `getBoundingClientRect()` reports an element's box whether or not an ancestor's
// `overflow` shows any of it, and whether or not an opaque section is painted on
// top. An earlier geometric version of this rig scored the reference site 93.8%
// occupied by crediting a full-page background video no screen displayed.
//
// Deliberately **not** pixel-differencing against the background colour either.
// At the pixel level a paragraph is mostly paper — the gaps between words and
// inside letterforms would read as empty and text would score near zero.
//
// Deliberately **skipped**: `position: fixed` (the grain overlay). It belongs to
// no chapter. Hairline rules mostly fall between sample points and go uncounted.
// Both omissions push the occupancy figures down, which is the direction to err
// in when the question is "is this page too empty".
//
// `--overlay <path>` paints a screen's sample back over the live page and
// screenshots it (imagery red, type blue). That is the only real defence of the
// method: you can look at the frame and see whether it agrees with your eyes.
//
// ## Calibration
//
// A bare percentage means nothing without something to compare it to, and the
// 30% figure in CLAUDE.md was never derived from a measurement. Point the rig at
// the reference site the client named and the same method scores it too:
//
//   node scripts/measure_density.mjs --url https://thesujanlife.com/ --sections off \
//     --out docs/reviews/2026-08-03-chapters/density-reference.json
//
// Run against our own build (with `npx next start -p 3100` already up):
//   node scripts/measure_density.mjs --out docs/reviews/2026-08-03-chapters/density.json

import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-03-chapters/density.json");
const WIDTH = Number(flag("width", "1440"));
const HEIGHT = Number(flag("height", "900"));
/** `off` for a page whose sections we do not control — the reference site. */
const SECTIONS = flag("sections", "on") !== "off";
const OVERLAY = flag("overlay", "");

/** Hit-test resolution, in CSS px. 6 gives 240 x 150 samples per screen. */
const CELL = 6;
/** Distance between sampled scroll positions. */
const STEP = Number(flag("step", "150"));
/** Non-negotiable #8. */
const MAX_EMPTY = 45;

/**
 * One screen, hit-tested. Runs in the page.
 *
 * A real function, not a source string: `page.evaluate("(a) => …", a)` makes
 * Playwright evaluate the string as an *expression*, which yields an
 * unserialisable function object and hands back `undefined`. The first run of
 * this rig did exactly that and reported an empty page.
 */
function sampleScreen(cell) {
  const cols = Math.ceil(window.innerWidth / cell);
  const rows = Math.ceil(window.innerHeight / cell);
  const image = [];
  const text = [];
  const textCache = new Map();

  const alphaOf = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return 0;
    const p = m[1].split(",").map((n) => parseFloat(n));
    return p.length < 4 ? 1 : p[3];
  };

  /**
   * The line boxes of every text node inside an element — not its block box, so
   * a short last line leaves real space beside it.
   *
   * Descendants included, not just direct children: a headline split into
   * per-word spans hit-tests to the innermost span, and if that span wraps
   * another the direct-children-only version finds no text and scores a fully
   * set headline as blank paper. Caught on the reference site, where it silently
   * discounted the two-tone headline its whole layout is built around.
   */
  const lineBoxes = (el) => {
    let boxes = textCache.get(el);
    if (boxes) return boxes;
    boxes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.nodeValue.trim()) continue;
      const parent = node.parentElement;
      if (parent) {
        const pcs = getComputedStyle(parent);
        if (pcs.visibility === "hidden" || Number(pcs.opacity) === 0) continue;
      }
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const b of range.getClientRects()) boxes.push(b);
    }
    textCache.set(el, boxes);
    return boxes;
  };

  for (let row = 0; row < rows; row++) {
    const y = row * cell + cell / 2;
    for (let col = 0; col < cols; col++) {
      const x = col * cell + cell / 2;
      const stack = document.elementsFromPoint(x, y);
      let kind = 0;
      for (const el of stack) {
        const cs = getComputedStyle(el);
        // The grain overlay and any fixed chrome belong to no chapter.
        if (cs.position === "fixed") continue;
        const tag = el.tagName.toLowerCase();
        if (tag === "img" || tag === "video" || tag === "svg" || tag === "canvas") {
          kind = 1;
          break;
        }
        if (cs.backgroundImage !== "none") {
          kind = 1;
          break;
        }
        let inText = false;
        for (const b of lineBoxes(el)) {
          if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) {
            inText = true;
            break;
          }
        }
        if (inText) {
          kind = 2;
          break;
        }
        // An opaque background hides everything painted beneath it.
        if (alphaOf(cs.backgroundColor) >= 0.98) break;
      }
      if (kind === 1) image.push(row * cols + col);
      else if (kind === 2) text.push(row * cols + col);
    }
  }
  // `scrollY` is read back rather than assumed: Lenis smooths the jump, so
  // `window.scrollTo` is a request and not an assignment.
  return { cols, rows, image, text, scrollY: Math.round(window.scrollY) };
}

/** Every distinct photograph the page has rendered, keyed by media id. */
function collectImages() {
  const ids = new Map();
  for (const img of document.querySelectorAll("img")) {
    if (!img.currentSrc) continue;
    const file = new URL(img.currentSrc, location.href).pathname.split("/").pop();
    const id = file
      .replace(/-\d+\.(avif|webp|jpg|jpeg|png)$/i, "")
      .replace(/\.(avif|webp|jpg|jpeg|png)$/i, "");
    const r = img.getBoundingClientRect();
    const prev = ids.get(id) || { id, instances: 0, area: 0 };
    prev.instances++;
    prev.area = Math.max(prev.area, Math.round(r.width * r.height));
    ids.set(id, prev);
  }
  return {
    distinct: [...ids.values()].sort((a, b) => b.area - a.area),
    imgElements: document.querySelectorAll("img").length,
    documentHeight: document.documentElement.scrollHeight,
  };
}

const pct = (n) => Number(n.toFixed(1));

/** Turns one screen's raw sample into percentages. */
function score(sample) {
  const total = sample.cols * sample.rows;
  const imagePercent = pct((sample.image.length / total) * 100);
  const typePercent = pct((sample.text.length / total) * 100);
  const occupied = pct(imagePercent + typePercent);
  return { at: sample.scrollY, occupied, empty: pct(100 - occupied), imagePercent, typePercent };
}

/**
 * Paints one screen's sample back over the live page and screenshots it —
 * imagery red, type blue.
 */
async function writeOverlay(page, at, file) {
  await page.evaluate((y) => window.scrollTo(0, y), at);
  await page.waitForTimeout(600);
  const sample = await page.evaluate(sampleScreen, CELL);
  await page.evaluate(
    ({ image, text, cols, cell }) => {
      const box = document.createElement("div");
      box.id = "__density_overlay";
      box.style.cssText = "position:fixed;inset:0;z-index:99999;pointer-events:none;";
      const cv = document.createElement("canvas");
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
      cv.style.cssText = "width:100%;height:100%;";
      const ctx = cv.getContext("2d");
      const paint = (list, colour) => {
        ctx.fillStyle = colour;
        for (const i of list) ctx.fillRect((i % cols) * cell, Math.floor(i / cols) * cell, cell, cell);
      };
      paint(image, "rgba(220,40,40,0.34)");
      paint(text, "rgba(30,80,220,0.34)");
      box.appendChild(cv);
      document.body.appendChild(box);
    },
    { image: sample.image, text: sample.text, cols: sample.cols, cell: CELL },
  );
  await page.waitForTimeout(200);
  // WebP, because sixteen 1440x900 PNGs of a photographic page is 20 MB and the
  // same set is under 3 MB with nothing lost that anyone reads these for.
  const png = `${file}.png`;
  await page.screenshot({ path: png });
  await sharp(png).webp({ quality: 84 }).toFile(`${file}.webp`);
  await unlink(png);
  await page.evaluate(() => document.getElementById("__density_overlay")?.remove());
}

function summarise(list) {
  if (list.length === 0) return null;
  const sorted = [...list].sort((a, b) => a.empty - b.empty);
  return {
    screens: list.length,
    meanEmptyPercent: pct(list.reduce((n, s) => n + s.empty, 0) / list.length),
    medianEmptyPercent: sorted[Math.floor(sorted.length / 2)].empty,
    bestEmptyPercent: sorted[0].empty,
    worstEmptyPercent: sorted[sorted.length - 1].empty,
    worstAt: sorted[sorted.length - 1].at,
    overBudget: list.filter((s) => s.empty > MAX_EMPTY).length,
  };
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(2000);

  // A cookie banner is chrome, not content, and would be counted on every
  // screen it floats over.
  for (const label of [/accept/i, /agree/i, /got it/i, /allow all/i]) {
    const button = page.getByRole("button", { name: label }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => {});
      await page.waitForTimeout(600);
    }
  }

  // Settle every reveal before measuring anything: a masked photograph
  // mid-wipe would be measured as smaller than it is.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.7);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 300));
    }
    await new Promise((r) => setTimeout(r, 1200));
  });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});

  const imagery = await page.evaluate(collectImages);
  const docHeight = imagery.documentHeight;

  let sections = [];
  if (SECTIONS) {
    sections = await page.evaluate(() =>
      Array.from(document.querySelectorAll("main section[id]")).map((s) => {
        const b = s.getBoundingClientRect();
        return {
          id: s.id,
          top: Math.round(b.top + window.scrollY),
          bottom: Math.round(b.bottom + window.scrollY),
          height: Math.round(b.height),
        };
      }),
    );
    if (sections.length === 0) throw new Error("Found no `main section[id]` to measure.");
  }

  // Every scroll position a visitor could stop on, at STEP resolution.
  const screens = [];
  const lastStop = Math.max(0, docHeight - HEIGHT);
  for (let y = 0; ; y += STEP) {
    const at = Math.min(y, lastStop);
    await page.evaluate((to) => window.scrollTo(0, to), at);
    await page.waitForTimeout(420);
    screens.push(score(await page.evaluate(sampleScreen, CELL)));
    if (at >= lastStop) break;
  }
  if (screens.every((s) => s.occupied === 0)) {
    throw new Error("Measured no content at all — the rig is broken, not the page.");
  }

  const chapters = sections.map((s) => {
    // Screens wholly inside the chapter. A chapter shorter than one screen never
    // has any, so fall back to the screen centred on it — which is what a
    // visitor sees there, boundaries and all.
    let inside = screens.filter((w) => w.at >= s.top - 1 && w.at + HEIGHT <= s.bottom + 1);
    const wholeScreensAvailable = inside.length > 0;
    if (!wholeScreensAvailable) {
      const centre = s.top + s.height / 2 - HEIGHT / 2;
      let best = screens[0];
      for (const w of screens) if (Math.abs(w.at - centre) < Math.abs(best.at - centre)) best = w;
      inside = [best];
    }
    const stats = summarise(inside);
    return {
      id: s.id,
      heightPx: s.height,
      screensTall: Number((s.height / HEIGHT).toFixed(2)),
      wholeScreensAvailable,
      ...stats,
      /** The rule: non-negotiable #8, applied to the chapter as CLAUDE.md states it. */
      passesMean: stats.meanEmptyPercent <= MAX_EMPTY,
      /** Not the rule, and reported anyway — a mean can bury one very empty screen. */
      passesWorst: stats.worstEmptyPercent <= MAX_EMPTY,
    };
  });

  const spans = (y) =>
    sections
      .filter((s) => s.bottom > y && s.top < y + HEIGHT)
      .map((s) => s.id)
      .join(" / ") || null;
  const emptiest = [...screens].sort((a, b) => b.empty - a.empty).slice(0, 5);

  const report = {
    measuredAt: new Date().toISOString(),
    url: URL,
    viewport: `${WIDTH}x${HEIGHT}`,
    method:
      `Per scroll position, every ${STEP}px. At each one the ${WIDTH}x${HEIGHT} viewport is ` +
      `hit-tested on a ${CELL}px grid via document.elementsFromPoint; a cell counts as occupied ` +
      `if the topmost thing painted there — before any opaque background — is a photograph ` +
      `(img/video/svg/canvas or a background-image) or a line box of type from ` +
      `Range.getClientRects(). position:fixed is skipped. Percentages are of the screen, not of ` +
      `the document, so nothing pinned is double-counted.`,
    imagery: {
      distinctImages: imagery.distinct.length,
      imgElements: imagery.imgElements,
      documentHeightPx: docHeight,
      screensOfScroll: Number((docHeight / HEIGHT).toFixed(1)),
      imagesPerScreen: Number((imagery.distinct.length / (docHeight / HEIGHT)).toFixed(2)),
      ids: imagery.distinct,
    },
    page: {
      ...summarise(screens),
      meanImagePercent: pct(screens.reduce((n, s) => n + s.imagePercent, 0) / screens.length),
      meanTypePercent: pct(screens.reduce((n, s) => n + s.typePercent, 0) / screens.length),
    },
    chapters,
    emptiestScreens: emptiest.map((w) => ({ at: w.at, empty: w.empty, spans: spans(w.at) })),
    screens,
  };

  if (OVERLAY) {
    await mkdir(path.dirname(OVERLAY), { recursive: true });
    const base = OVERLAY.replace(/\.(png|webp)$/, "");
    await writeOverlay(page, emptiest[0].at, `${base}-worst-${emptiest[0].at}`);
    const sorted = [...screens].sort((a, b) => a.empty - b.empty);
    const mid = sorted[Math.floor(sorted.length / 2)];
    await writeOverlay(page, mid.at, `${base}-median-${mid.at}`);
    // One frame per chapter, at that chapter's own worst screen — the picture
    // behind every row of the table.
    for (const c of chapters) await writeOverlay(page, c.worstAt, `${base}-${c.id}`);
    console.log(`Wrote overlays to ${base}-*.webp`);
  }

  await context.close();
  await browser.close();

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `${report.imagery.distinctImages} distinct images over ${report.imagery.screensOfScroll} ` +
      `screens of scroll (${report.imagery.imagesPerScreen}/screen), ` +
      `${imagery.imgElements} <img> elements`,
  );
  console.log(
    `${report.page.screens} screens sampled — empty space best ${report.page.bestEmptyPercent}%, ` +
      `median ${report.page.medianEmptyPercent}%, mean ${report.page.meanEmptyPercent}%, ` +
      `worst ${report.page.worstEmptyPercent}%; ${report.page.overBudget} over the ${MAX_EMPTY}% budget`,
  );
  console.log(
    `the average screen is ${report.page.meanImagePercent}% imagery and ` +
      `${report.page.meanTypePercent}% type`,
  );

  if (chapters.length) {
    console.log(`\nchapter          tall  screens  mean empty  worst empty   (budget ${MAX_EMPTY}%)`);
    for (const c of chapters) {
      console.log(
        `${c.id.padEnd(15)} ${String(c.screensTall).padStart(4)}  ${String(c.screens).padStart(7)}  ` +
          `${String(c.meanEmptyPercent).padStart(9)}%  ${String(c.worstEmptyPercent).padStart(9)}%` +
          `${c.passesMean ? "" : "  OVER"}${c.passesMean && !c.passesWorst ? "  (worst screen over)" : ""}` +
          `${c.wholeScreensAvailable ? "" : "  (no whole screen fits)"}`,
      );
    }
    const over = chapters.filter((c) => !c.passesMean);
    console.log(
      over.length
        ? `\n${over.length} chapter(s) over the ${MAX_EMPTY}% budget: ${over.map((c) => c.id).join(", ")}`
        : `\nall ${chapters.length} chapters inside the ${MAX_EMPTY}% budget`,
    );
  }
  console.log("\nemptiest screens:");
  for (const w of report.emptiestScreens) {
    console.log(`  y=${String(w.at).padStart(6)}  ${String(w.empty).padStart(5)}% empty  ${w.spans ?? ""}`);
  }
  console.log(`\nWrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
