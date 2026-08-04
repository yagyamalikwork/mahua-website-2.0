// Worst-pixel contrast for every text run laid over a photograph.
//
// CLAUDE.md: "Text laid over a photograph (hero, full-bleed quotes) needs its own
// check — a scrim or equivalent, verified by a contrast test against the actual
// rendered result, not assumed from the image looking dark enough." `lib/
// palette.test.ts` cannot do this: it knows two flat colours, and a photograph is
// neither. Only a browser can answer it.
//
// Task 7 built this measurement and left it in a scratchpad, which is how
// `verification.json` came to disagree with the report it was evidence for. It
// lives here now so the committed numbers can be re-derived by anyone.
//
// **Method.** For each run: scroll it into view, hide every text node in its
// container (so nothing reflows), screenshot the viewport, crop to each of the
// run's own boxes, and take the BRIGHTEST SINGLE PIXEL — the worst case for cream
// type. Not the mean, not the 99th percentile. Headlines are measured per word
// (`[data-word]`) so an empty gutter beside a short line cannot flatter the
// result. Deliberately not `page.screenshot({ clip })`, whose origin is ambiguous
// once the page has scrolled.
//
// Re-run whenever a scrim, a photograph, or the file served for one changes:
//   npx next start -p 3100 &
//   node scripts/check_contrast_over_photos.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-04-task-7/contrast-over-photos.json");
const WIDTHS = flag("widths", "390,768,1440,1920").split(",").map(Number);

/** The type colour over every photograph on the page — cream, not white. */
const CREAM = [0xf1, 0xe9, 0xd7];

const luminance = (rgb) =>
  rgb
    .map((c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : Math.pow((c / 255 + 0.055) / 1.055, 2.4)))
    .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);

const ratio = (rgb) => {
  const [hi, lo] = [luminance(rgb), luminance(CREAM)].sort((a, b) => b - a);
  return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
};

/**
 * `min` is 3.0 for display type (WCAG large text) and 4.5 for body and links.
 * `container` is what gets its text hidden — hiding only the run itself would
 * leave its neighbours in the crop and measure cream against cream.
 */
const RUNS = [
  { name: "header · menu", min: 4.5, at: "#arrival", container: "header", sel: "[aria-controls='chapter-menu']" },
  {
    name: "header · wordmark",
    min: 4.5,
    at: "#arrival",
    container: "header",
    // Targeted by attribute, not by structure. `header > div > p` was the
    // selector until 5 Aug 2026, when the wordmark became part of a flower+name
    // lockup and stopped being a `<p>`. Nothing failed — the run simply reported
    // "not visible", which this script used to treat as neither pass nor fail.
    sel: '[data-contrast="brand-wordmark"]',
  },
  { name: "hero · headline", min: 3, at: "#arrival", container: "#arrival", sel: "#arrival h1 [data-word]" },
  { name: "hero · sub", min: 4.5, at: "#arrival", container: "#arrival", sel: "#arrival > div > p" },
  { name: "hero · scroll cue", min: 4.5, at: "#arrival", container: "#arrival", sel: "#arrival div.flex > span:nth-child(2)" },
  { name: "quote · why-you-came", min: 3, at: "#why-you-came", container: "#why-you-came", sel: "#why-you-came [data-word]" },
  { name: "quote · after-dark", min: 3, at: "#after-dark", container: "#after-dark", sel: "#after-dark [data-word]" },
  { name: "invitation · heading", min: 3, at: "#invitation", container: "#invitation", sel: "#invitation h2 span" },
  { name: "invitation · body", min: 4.5, at: "#invitation", container: "#invitation", sel: "#invitation p" },
];

async function measure(page, run) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    window.scrollTo(0, (el?.getBoundingClientRect().top ?? 0) + window.scrollY);
  }, run.at);
  // Long enough for parallax and any reveal to have finished; the measurement is
  // of the settled frame, which is the one the visitor reads.
  await page.waitForTimeout(1500);

  const boxes = await page.evaluate(
    ({ sel }) =>
      Array.from(document.querySelectorAll(sel))
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width > 2 && r.height > 2 && r.top >= 0 && r.bottom <= window.innerHeight)
        .map((r) => ({
          x: Math.max(0, Math.floor(r.x)),
          y: Math.max(0, Math.floor(r.y)),
          w: Math.ceil(r.width),
          h: Math.ceil(r.height),
        })),
    { sel: run.sel },
  );
  if (boxes.length === 0) return { name: run.name, min: run.min, worst: null, boxes: 0, pass: null };

  await page.evaluate(({ container }) => {
    // `button` matters: the header's own run *is* a button, and leaving it
    // visible measures its cream label against cream and reports 1.06:1.
    const tags = ["h1", "h2", "p", "span", "a", "cite", "button"];
    for (const e of document.querySelectorAll(tags.map((t) => `${container} ${t}`).join(", "))) {
      e.style.visibility = "hidden";
    }
  }, { container: run.container });
  await page.waitForTimeout(150);
  const shot = await page.screenshot();
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("[style*='visibility']")) e.style.visibility = "";
  });

  let worst = Number.POSITIVE_INFINITY;
  let brightest = [0, 0, 0];
  for (const b of boxes) {
    const { data, info } = await sharp(shot)
      .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      const px = [data[i], data[i + 1], data[i + 2]];
      const r = ratio(px);
      if (r < worst) {
        worst = r;
        brightest = px;
      }
    }
  }
  return { name: run.name, min: run.min, worst, brightest, boxes: boxes.length, pass: worst >= run.min };
}

async function main() {
  const browser = await chromium.launch();
  const report = { measuredAt: new Date().toISOString(), url: URL, widths: {} };
  let failures = 0;
  /**
   * A target this script was asked to measure and could not find.
   *
   * Counted separately and still fatal. Until 5 Aug 2026 an unfindable target
   * printed "not visible" and was neither a pass nor a failure, so when the
   * header wordmark stopped being a `<p>` the check quietly stopped running and
   * the suite stayed green — cream type over a photograph, unmeasured, for as
   * long as nobody read the log. A contrast target that cannot be located is a
   * broken check, and a broken check is worse than a failing one because it
   * looks like success.
   */
  let missing = 0;

  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : width === 768 ? 1024 : 900 },
    });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const rows = [];
    for (const run of RUNS) rows.push(await measure(page, run));
    report.widths[width] = rows;

    console.log(`--- ${width}px ---`);
    for (const r of rows) {
      if (r.pass === false) failures++;
      if (r.pass === null) missing++;
      console.log(
        `  ${r.name.padEnd(24)} floor ${String(r.min).padEnd(4)} worst ${String(r.worst).padEnd(6)} ${
          r.pass === null ? "NOT FOUND" : r.pass ? "ok" : "FAIL"
        }`,
      );
    }
    await context.close();
  }

  await browser.close();
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT}`);

  if (failures > 0) {
    console.error(`FAILED: ${failures} text run(s) below their contrast floor over a photograph.`);
    process.exitCode = 1;
  }

  if (missing > 0) {
    console.error(
      `FAILED: ${missing} target(s) could not be found on the page. Either the markup moved and the ` +
        `selector needs updating, or the run genuinely no longer exists and should be deleted from RUNS. ` +
        `A target that is silently skipped is an unmeasured piece of type over a photograph.`,
    );
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
