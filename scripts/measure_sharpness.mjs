// Are the photographs actually sharp?
//
// `scripts/check_image_resolution.mjs` answers "did the browser fetch a file big
// enough". That is a property of the request, and this project has now shipped
// six defects whose common shape is a check that confirmed something was
// *configured* rather than that behaviour had *changed*. This is the outcome
// counterpart: it screenshots the real page and measures how much detail is left
// in the pixels a visitor looks at.
//
// ## The measure
//
// Variance of the Laplacian, the standard focus measure. Convolve the greyscale
// crop with the 3x3 Laplacian kernel — a second-derivative operator, so it
// responds to edges and ignores flat regions and overall brightness — and take
// the variance of the result. A blurred photograph has smooth gradients and a low
// variance; a sharp one has hard edges and a high one. It is not comparable
// across different pictures (a picture of fog scores low however sharp it is), so
// it is only ever quoted here as a *ratio between two captures of the same crop
// of the same photograph*, which is exactly the before/after question.
//
// ## Why the crop
//
// A full 390x844 screenshot is mostly scrim, cream and type, and type is sharp
// whatever the photograph is doing. The crops are named regions over the part of
// the frame the argument is about — the tiger's face, the lamps along the
// reception path — so the number moves with the thing being judged.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/measure_sharpness.mjs --out docs/reviews/2026-08-05-cover-sizes/after
//
// `--label before|after` only names the files; the comparison is done by
// `--compare <dirA> <dirB>`, which re-reads two runs off disk and prints the
// ratio per crop.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

/**
 * Each crop is a fraction of the 390x844 viewport, chosen over the subject of
 * the photograph rather than over its scrim. `anchor` is the section the page
 * scrolls to first; the hero needs none.
 */
const CROPS = [
  {
    name: "hero-reception-path",
    anchor: null,
    // The lanterns and the path's edge, left of centre, clear of the headline.
    box: { x: 0.08, y: 0.18, w: 0.62, h: 0.3 },
  },
  {
    name: "tiger-face",
    anchor: "#why-you-came",
    // The cat's head and shoulders. Stops short of the quote at y ~= 0.44:
    // display serif is razor sharp whatever the photograph is doing, and a few
    // lines of it inside the crop would swamp the measure and hide the answer.
    box: { x: 0.15, y: 0.24, w: 0.65, h: 0.18 },
  },
];

/** Variance of the Laplacian of a greyscale buffer. */
function laplacianVariance(data, width, height) {
  const out = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const v =
        -4 * data[i] + data[i - 1] + data[i + 1] + data[i - width] + data[i + width];
      out.push(v);
    }
  }
  if (out.length === 0) return 0;
  const mean = out.reduce((a, b) => a + b, 0) / out.length;
  return out.reduce((a, b) => a + (b - mean) ** 2, 0) / out.length;
}

async function score(file) {
  const { data, info } = await sharp(file)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return laplacianVariance(data, info.width, info.height);
}

async function capture(outDir, url, dpr) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: dpr,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1200);

  await mkdir(outDir, { recursive: true });
  const results = [];

  for (const crop of CROPS) {
    if (crop.anchor) {
      await page.evaluate((sel) => {
        document.querySelector(sel)?.scrollIntoView({ block: "start", behavior: "instant" });
      }, crop.anchor);
    } else {
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    // Lazy images near the viewport plus the mask primitives both settle within
    // a few hundred ms; 1.5s is slack, not a guess at a race.
    await page.waitForTimeout(1500);

    const screen = path.join(outDir, `${crop.name}-screen.png`);
    await page.screenshot({ path: screen });

    const cropFile = path.join(outDir, `${crop.name}-crop.png`);
    await page.screenshot({
      path: cropFile,
      clip: {
        x: Math.round(crop.box.x * 390),
        y: Math.round(crop.box.y * 844),
        width: Math.round(crop.box.w * 390),
        height: Math.round(crop.box.h * 844),
      },
    });

    // Which file the browser actually chose for this crop's photograph, so the
    // sharpness number and the byte cost sit in one row.
    const served = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((i) => i.currentSrc && i.getBoundingClientRect().height > 300)
        .map((i) => new URL(i.currentSrc).pathname),
    );

    results.push({
      crop: crop.name,
      laplacianVariance: Number((await score(cropFile)).toFixed(1)),
      served,
    });
    console.log(`${crop.name}: ${results.at(-1).laplacianVariance}  ${served.join(" ")}`);
  }

  await browser.close();
  await writeFile(
    path.join(outDir, "sharpness.json"),
    `${JSON.stringify({ measuredAt: new Date().toISOString(), url, dpr, results }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote ${path.join(outDir, "sharpness.json")}`);
}

async function compare(a, b) {
  const read = async (d) => JSON.parse(await readFile(path.join(d, "sharpness.json"), "utf8"));
  const [x, y] = await Promise.all([read(a), read(b)]);
  console.log("crop                        before      after   ratio");
  for (const before of x.results) {
    const after = y.results.find((r) => r.crop === before.crop);
    if (!after) continue;
    const ratio = after.laplacianVariance / before.laplacianVariance;
    console.log(
      `${before.crop.padEnd(24)} ${String(before.laplacianVariance).padStart(9)} ${String(
        after.laplacianVariance,
      ).padStart(10)}   ${ratio.toFixed(2)}x`,
    );
    console.log(`  served  before: ${before.served.join(" ")}`);
    console.log(`          after:  ${after.served.join(" ")}`);
  }
}

const compareAt = args.indexOf("--compare");
if (compareAt >= 0) {
  await compare(args[compareAt + 1], args[compareAt + 2]);
} else {
  await capture(
    path.resolve(ROOT, flag("out", "docs/reviews/2026-08-05-cover-sizes/after")),
    flag("url", `http://localhost:${flag("port", "3100")}/`),
    Number(flag("dpr", "1")),
  );
}
