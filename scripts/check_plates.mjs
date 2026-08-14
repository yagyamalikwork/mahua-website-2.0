// The plate boards — `PlateGrid`'s `forest`, `rooms` and `details` chapters on
// the home page — swept CONTINUOUSLY, in a real browser, never at four fixed
// shapes.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_plates.mjs
//   node scripts/check_plates.mjs --port 3100 --out docs/reviews/2026-08-13-image-sizing/plates.json
//
// **Why continuous.** The last three defects on this project all lived between
// fixed sample points (`docs/DECISIONS.md` §2 #45), and this board's own
// history is the proof: the 230% squeeze fired at 1366x768 and no rig sampled
// any short-and-normal-width viewport at all — every instrument on this
// project measured 390/768/1440/1920, and 768 was always a *width*, never a
// height. So this rig sweeps 900→1920 in 16px steps at two heights, plus the
// thirteen named shapes from `docs/reviews/2026-08-12-plate-squeeze/README.md`,
// rather than trusting another grid of fixed points not to have its own gaps.
//
// Three assertions, per plate, per sample (spec `2026-08-13-image-sizing-design.md`
// §1):
//
//   1. Distortion = 0, always. If the img's own computed `object-fit` is
//      `"cover"`, the crop is `PlateGrid`'s deliberate `plateFrame` box (the
//      "framed" case in the plate-squeeze README) and passes outright — a
//      framed board is SUPPOSED to crop. Otherwise the rendered box's aspect
//      ratio must equal the img's own natural aspect within 2%.
//   2. The floor — 14 Aug 2026, the real rule, replacing the 85%/65%
//      tolerance that let the client's re-test fail: at every sample
//      >=470px wide that computes to `roomy:`, EVERY plate's rendered width
//      must be >= that SAME plate's width at 1440x900 — measured live at
//      the start of THIS run, never a number written into this file. No
//      exemption for a board at its minimum column count: under the new
//      flex-wrap construction (`PlateGrid.tsx` — `flex: 1 1 REFpx` per
//      plate; CSS Grid's `auto-fit` was tried first and rejected, see that
//      file's own comment) a board that cannot hold a column at its
//      1440-reference width simply drops to fewer, wider columns, so a
//      board "already at 2" is not a special case any more — if one still
//      needs an exemption, that is itself a finding, not something to
//      preserve.
//
//      `FLOOR_EPS` is 0.004 (0.4 percentage points), not the old 0.003 —
//      widened by a documented, computed amount, not loosened to make a
//      build pass. `PlateGrid.tsx`'s `referenceWidth` rounds a board's CSS
//      floor DOWN from the exact per-column width at 1440 (to a whole pixel,
//      and clear of the tie `DECISIONS.md` §2 #45 already paid for once) —
//      which means the CSS floor itself, by construction, sits slightly
//      BELOW the width the browser actually renders at 1440 (the exact
//      value, with 1440's own small leftover redistributed across the
//      columns by `1fr`). A plate sampled right at the bottom of its
//      column-count band — one pixel short of dropping a column — legitimately
//      renders at that lower CSS floor, not at the exact 1440 figure. Worked
//      from the real numbers: Forest's floor is 420px against a 421.33px
//      live 1440 width (0.3165% short); Details' is 317px against 318px
//      (0.3145% short). Both exceed the old 0.003 epsilon; neither is a
//      shrink the client complained about — it is a sub-pixel artefact of
//      using a whole-pixel CSS value at all. 0.004 clears both with a small
//      margin to spare, nothing more.
//   3. The pocket cap, at samples that compute to `pocket:` (height <= 800 AND
//      width/height >= 2 — a sweep at height 768 legitimately crosses 2:1 past
//      1536px wide, where this is the assertion in force instead of the
//      floor): every plate's rendered height must be <= 24% of the viewport
//      height + 2px. Assertion 1 already runs on every sample regardless of
//      mode, so it is what enforces "natural aspect intact" here too; this
//      assertion adds only the height cap `ui/Plate.tsx`'s `pocket:max-h-[24vh]`
//      exists to guarantee.
//
// **The mode (`pocket:` / `roomy:`) is COMPUTED from the two numbers passed to
// `page.setViewportSize()`, never read off `getComputedStyle()` or
// `app/globals.css`.** A check that reads back the mechanism it was given
// proves nothing (`docs/DECISIONS.md` §2, the project's single most-repeated
// defect shape) — the formula below is a transcription of the CSS custom
// variants in `app/globals.css`, not a reference to them. It is `pocket`, else
// `roomy` — NOT-`pocket`, not a transcription of the CSS's own `roomy:` — see
// `computeMode`'s own comment for the one narrow band where that distinction
// matters and why it never fires here.
//
// Routes: `/`, `/mahua-vann`, `/mahua-tola` — every `[data-plate-grid]` on
// each. Only the home page carries any today (`forest`, `rooms`, `details`);
// the property pages are swept anyway so a board added there later is caught
// by the same instrument rather than needing a new one.

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
const OUT = flag("out", "docs/reviews/2026-08-13-image-sizing/plates.json");

const ROUTES = ["/", "/mahua-vann", "/mahua-tola"];

/** 1440x900 first — the reference every floor ratio is measured against. */
const REFERENCE_SHAPE = [1440, 900];

/**
 * The sweep: 900→1920 continuous at two heights, plus the thirteen named
 * shapes from the plate-squeeze evidence table. Deduplicated so a named shape
 * that happens to land on a continuous step is not measured twice.
 */
function buildShapes() {
  const seen = new Set();
  const shapes = [];
  const push = (w, h) => {
    const key = `${w}x${h}`;
    if (seen.has(key)) return;
    seen.add(key);
    shapes.push([w, h]);
  };
  for (const h of [900, 768]) {
    for (let w = 900; w <= 1920; w += 16) push(w, h);
    // 900 and 1920 differ by 1020, not a multiple of the 16px step, so the loop
    // above lands on ...1892, 1908 and stops — 1920 itself is never swept at
    // either height, and the named shapes below supply only 1920x1080, not
    // 1920x900 or 1920x768. Pushed explicitly so the range is genuinely closed,
    // matching this plan's own rationale for sweeping continuously rather than
    // trusting a grid of points not to have gaps at its own edges.
    push(1920, h);
  }
  const NAMED = [
    [1920, 1080],
    [1512, 945],
    [1440, 900],
    [1440, 801],
    [1440, 800],
    [1366, 768],
    [1280, 720],
    [1024, 768],
    [1180, 820],
    [1152, 720],
    [960, 600],
    [844, 390],
    [932, 430],
  ];
  for (const [w, h] of NAMED) push(w, h);
  return shapes;
}
const SHAPES = buildShapes();

/**
 * `app/globals.css`'s `pocket:` / `roomy:` pair, transcribed, not read back.
 *
 * `pocket` is exactly `app/globals.css`'s own `(max-height: 800px) and
 * (min-aspect-ratio: 2/1)`. `roomy` here is "else" — NOT-`pocket` — which is
 * `height > 800 OR width/height < 2`. That is **not** a literal transcription
 * of the CSS's own `roomy:` variant, which is `(min-height: 801px) OR
 * (max-aspect-ratio: 1999/1000)` — i.e. `height > 800 OR aspect <= 1.999`. The
 * two disagree on the half-open aspect band `[1.999, 2.0)` at `height <= 800`:
 * a viewport there is NOT-`pocket` (aspect < 2 fails `pocket`'s own `>= 2`) but
 * also fails the real `roomy:`'s `<= 1.999` bound, so `app/globals.css`
 * matches NEITHER variant and this function calls it `roomy` anyway.
 *
 * Left as "else roomy" rather than a third `unknown` mode because the band is
 * unreachable at any INTEGER viewport size: for a band width of
 * `0.001 * height` to contain an integer, `height` would need to exceed 1000,
 * and `pocket`'s own `height <= 800` caps it well below that — confirmed
 * against every shape this rig actually sweeps, none of which lands there.
 * If a future sweep ever adds a height above 1000, this stops being safe to
 * assume and the band needs its own branch.
 */
function computeMode(width, height) {
  return height <= 800 && width / height >= 2 ? "pocket" : "roomy";
}

/**
 * A plate may never render narrower than its own width at 1440x900 — the
 * client's 14 Aug 2026 ruling, replacing the 85%/65% tolerance that shipped
 * a board he could still watch shrink. No exemption: see assertion 2's own
 * comment above for why a board at its minimum column count is no longer a
 * special case, and for exactly what `FLOOR_EPS` covers and why it moved.
 */
const FLOOR_ROOMY = 1;
const FLOOR_EPS = 0.004; // ~0.4 percentage points — see assertion 2's own comment for the derivation
/** Below this, no board's own container can hold even one column at its
 * reference width — Forest's own floor (420px) plus the narrowest gutter
 * (48px) is 468px, rounded up. The continuous sweep never samples below
 * 900px wide anyway; this guards a future sweep that does. */
const MIN_FLOOR_SAMPLE_WIDTH = 470;
const DISTORTION_PCT = 2;
const DISTORTION_EPS = 0.05;
const POCKET_CAP_EPS = 1; // px of slack for subpixel layout

const failures = [];
const note = (label, msg) => failures.push(`${label}: ${msg}`);

/** Two `requestAnimationFrame`s — lets a resize's layout settle before reading it. */
async function settleFrames(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/**
 * Every `[data-plate-grid]` board on the current page, at the current
 * viewport. Column count is the number of distinct rounded `rect.left`
 * values among a board's own plate cells (its direct children) — read off
 * the page, not off `PlateGrid.tsx`'s `columns` variable, which the browser
 * never sees. Per plate: the `<img>`'s own rendered box, its natural size,
 * and its computed `object-fit`.
 */
async function measureBoards(page) {
  return page.evaluate(() => {
    const boards = {};
    for (const boardEl of document.querySelectorAll("[data-plate-grid]")) {
      const boardId = boardEl.getAttribute("data-plate-grid");
      const cells = Array.from(boardEl.children);
      const lefts = cells.map((c) => Math.round(c.getBoundingClientRect().left));
      const columns = new Set(lefts).size;
      const plates = cells.map((cell) => {
        const img = cell.querySelector("img");
        if (!img) return null;
        const r = img.getBoundingClientRect();
        const cs = getComputedStyle(img);
        return {
          width: r.width,
          height: r.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          objectFit: cs.objectFit,
        };
      });
      boards[boardId] = { columns, plates };
    }
    return { innerWidth: window.innerWidth, innerHeight: window.innerHeight, boards };
  });
}

/** Poll for every plate `<img>` (there may be none, on the property routes) to load. */
async function waitForPlateImages(page, timeoutMs = 8000) {
  const start = Date.now();
  for (;;) {
    const allLoaded = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-plate-grid] img")).every(
        (img) => img.naturalWidth > 0,
      ),
    );
    if (allLoaded) return true;
    if (Date.now() - start > timeoutMs) return false;
    await page.waitForTimeout(150);
  }
}

/**
 * Distortion, per plate. The rendered box must be real (non-zero) before
 * anything else is asked of it — checked first, ahead of the `object-fit`
 * branch below, so a collapsed `<picture>` box on a framed board (`details`
 * today) cannot pass by virtue of never being inspected. `object-fit: cover`
 * is then the deliberate `plateFrame` crop and passes outright; otherwise the
 * rendered box's aspect must equal the photograph's own natural aspect within
 * `DISTORTION_PCT`.
 */
function checkDistortion(plate) {
  if (!plate) return { ok: false, reason: "no <img> in this plate cell" };
  if (!plate.naturalWidth || !plate.naturalHeight) {
    return { ok: false, reason: "naturalWidth/Height is 0 — image never finished loading" };
  }
  if (!plate.width || !plate.height) {
    return { ok: false, reason: "rendered width/height is 0" };
  }
  if (plate.objectFit === "cover") return { ok: true, framed: true, pctOff: 0 };
  const naturalAspect = plate.naturalWidth / plate.naturalHeight;
  const renderedAspect = plate.width / plate.height;
  const pctOff = Math.abs(renderedAspect / naturalAspect - 1) * 100;
  return { ok: pctOff <= DISTORTION_PCT + DISTORTION_EPS, pctOff, naturalAspect, renderedAspect };
}

const browser = await chromium.launch();

// ------------------------------------------------------------- warm the server
//
// This project has a catalogued defect (`scripts/check_welcome.mjs`'s own
// comment) where the first navigation after `next start` took 6,628ms — long
// enough that a sample taken against it lands mid-compile, not on the page a
// visitor sees. One throwaway navigation per route, discarded, before any
// route is measured for real.
for (const route of ROUTES) {
  const warm = await browser.newContext();
  const warmPage = await warm.newPage();
  await warmPage.goto(`${BASE}${route}`, { waitUntil: "load" });
  await warm.close();
}

const report = {
  measuredAt: new Date().toISOString(),
  url: BASE,
  method:
    "Swept every route's [data-plate-grid] boards continuously — 900-1920px wide in 16px steps at " +
    "heights 900 and 768, plus the 13 named shapes from the plate-squeeze evidence table — in a real " +
    "browser, reducedMotion, against a production build. Column count and pocket:/roomy: mode are both " +
    "computed live from the sampled numbers, never read off CSS. The 1440x900 reference (each plate's own " +
    "width and column count) is captured at the start of each route's run, not hard-coded.",
  shapesSwept: SHAPES.length,
  routes: [],
  failures: [],
  verdict: "pending",
};

for (const routePath of ROUTES) {
  const label = routePath === "/" ? "/" : routePath;
  const context = await browser.newContext({
    viewport: { width: REFERENCE_SHAPE[0], height: REFERENCE_SHAPE[1] },
    // Entrances off — rects are stable. The sanctioned use of reduced motion
    // for measurement, per CLAUDE.md's "Verification" section: this rig reads
    // layout geometry, not the entrance animation, and a mid-animation sample
    // would misreport a plate that has not settled to its rest size yet.
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${BASE}${routePath}`, { waitUntil: "load" });

  // The welcome screen covers the page for ~2.1s (non-negotiable #5 / the
  // welcome) — pointer-events: none, so it never blocks measurement, but its
  // geometry is not what a visitor is looking at. Waited out with margin,
  // same pattern as check_card_stack.mjs.
  await page.waitForTimeout(2600);

  // Scroll the full page once so every lazy plate <img> loads, then confirm.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
  });
  const loaded = await waitForPlateImages(page);
  if (!loaded) {
    note(label, "not every [data-plate-grid] img reached naturalWidth > 0 within 8s");
  }

  // --------------------------------------------------------- the reference pass
  //
  // 1440x900, captured live, right now, on this run's own build — never a
  // number written into this file. Every floor ratio below is measured
  // against this.
  const referenceRaw = await measureBoards(page);
  const reference = {};
  for (const [boardId, board] of Object.entries(referenceRaw.boards)) {
    reference[boardId] = {
      columns: board.columns,
      widths: board.plates.map((p) => (p ? p.width : null)),
    };
  }

  if (routePath === "/" && Object.keys(reference).length === 0) {
    // A silent rig is worse than no rig — `docs/DECISIONS.md` §2's whole
    // catalogue is checks that confirmed nothing. The home page is known to
    // carry three PlateGrid chapters (forest, rooms, details) today; finding
    // none here means the [data-plate-grid] hook itself broke, not that the
    // page has nothing to check.
    note(label, "no [data-plate-grid] boards found on / — Task 1's attribute may be missing");
  }

  // ---------------------------------------------------------- the full sweep
  const boardStats = {};
  let routeWorstDistortionPct = 0;
  let routeWorstDistortionInfo = null;
  let pocketSamples = 0;
  let roomyFloorSamples = 0;

  for (const [width, height] of SHAPES) {
    await page.setViewportSize({ width, height });
    await settleFrames(page);
    const sample = await measureBoards(page);
    const mode = computeMode(width, height);
    if (mode === "pocket") pocketSamples++;

    for (const [boardId, boardSample] of Object.entries(sample.boards)) {
      const refBoard = reference[boardId];
      if (!refBoard) {
        note(label, `board "${boardId}" appeared at ${width}x${height} but not in the 1440x900 reference`);
        continue;
      }
      boardStats[boardId] ??= {
        refColumns: refBoard.columns,
        worstDistortionPct: 0,
        worstDistortionSample: null,
        worstFloorRatio: null,
        worstFloorSample: null,
        floorUsedAtWorst: null,
        worstPocketOverPx: 0,
        worstPocketSample: null,
      };
      const stats = boardStats[boardId];
      if (width >= MIN_FLOOR_SAMPLE_WIDTH && mode === "roomy") roomyFloorSamples++;

      boardSample.plates.forEach((plate, i) => {
        const plateLabel = `board="${boardId}" plate=${i}`;

        // --------------------------------------------------- assertion 1
        const d = checkDistortion(plate);
        if (!d.ok) {
          note(
            label,
            `assertion 1: ${plateLabel} at ${width}x${height} — ` +
              (d.reason ?? `distortion ${d.pctOff.toFixed(2)}% (rendered ${d.renderedAspect.toFixed(3)}:1 ` +
                `vs natural ${d.naturalAspect.toFixed(3)}:1, mode ${mode})`),
          );
        }
        if (d.pctOff !== undefined && d.pctOff > stats.worstDistortionPct) {
          stats.worstDistortionPct = d.pctOff;
          stats.worstDistortionSample = { width, height };
        }
        if (d.pctOff !== undefined && d.pctOff > routeWorstDistortionPct) {
          routeWorstDistortionPct = d.pctOff;
          routeWorstDistortionInfo = { board: boardId, plate: i, width, height, pctOff: d.pctOff };
        }

        if (!plate) return; // nothing further to measure for a cell with no <img>

        // --------------------------------------------------- assertion 2
        if (width >= MIN_FLOOR_SAMPLE_WIDTH && mode === "roomy") {
          const refWidth = refBoard.widths[i];
          const floor = FLOOR_ROOMY;
          if (!refWidth) {
            // A falsy reference width (no <img> in that cell at 1440x900, or a
            // reference-pass rect.width of 0) used to mean this plate's floor
            // was never checked at any of the 141 samples, with nothing in the
            // output to say so — the same "?? 0" / "0 under-served" shape this
            // project has shipped before. A skipped plate is now a failure, not
            // a silent pass.
            note(
              label,
              `assertion 2: ${plateLabel} — no usable 1440x900 reference width (refWidth=${refWidth}) — ` +
                "floor cannot be checked at any sample",
            );
          } else {
            const ratio = plate.width / refWidth;
            if (stats.worstFloorRatio === null || ratio < stats.worstFloorRatio) {
              stats.worstFloorRatio = ratio;
              stats.worstFloorSample = { width, height, renderedWidth: plate.width, refWidth };
              stats.floorUsedAtWorst = floor;
            }
            if (ratio < floor - FLOOR_EPS) {
              note(
                label,
                `assertion 2: ${plateLabel} at ${width}x${height} — floor ratio ${ratio.toFixed(3)} < ` +
                  `${floor} (rendered ${plate.width.toFixed(1)}px vs 1440 reference ${refWidth.toFixed(1)}px)`,
              );
            }
          }
        }

        // --------------------------------------------------- assertion 3
        if (mode === "pocket") {
          const cap = 0.24 * height + 2;
          const over = plate.height - cap;
          if (over > stats.worstPocketOverPx) {
            stats.worstPocketOverPx = over;
            stats.worstPocketSample = { width, height, renderedHeight: plate.height, cap };
          }
          if (over > POCKET_CAP_EPS) {
            note(
              label,
              `assertion 3: ${plateLabel} at ${width}x${height} — height ${plate.height.toFixed(1)}px > ` +
                `24%-of-viewport cap ${cap.toFixed(1)}px`,
            );
          }
        }
      });
    }
  }

  const boardsOut = {};
  for (const [boardId, s] of Object.entries(boardStats)) {
    boardsOut[boardId] = {
      referenceColumns: s.refColumns,
      referenceWidths: reference[boardId].widths,
      worstDistortionPct: Number(s.worstDistortionPct.toFixed(3)),
      worstDistortionSample: s.worstDistortionSample,
      worstFloorRatio: s.worstFloorRatio === null ? null : Number(s.worstFloorRatio.toFixed(4)),
      worstFloorSample: s.worstFloorSample,
      floorUsedAtWorst: s.floorUsedAtWorst,
      worstPocketOverPx: Number(s.worstPocketOverPx.toFixed(2)),
      worstPocketSample: s.worstPocketSample,
    };
  }

  report.routes.push({
    route: routePath,
    boardsFound: Object.keys(reference),
    samples: SHAPES.length,
    pocketSamples,
    roomyFloorSamples,
    worstDistortionPct: Number(routeWorstDistortionPct.toFixed(3)),
    worstDistortion: routeWorstDistortionInfo,
    boards: boardsOut,
  });

  console.log(
    `${routePath.padEnd(14)} boards=${Object.keys(reference).join(",") || "(none)"} ` +
      `samples=${SHAPES.length} worstDistortion=${routeWorstDistortionPct.toFixed(2)}% ` +
      Object.entries(boardsOut)
        .map(([id, b]) => `${id}:floor=${b.worstFloorRatio ?? "n/a"}`)
        .join(" "),
  );

  await context.close();
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
