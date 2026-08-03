// Did the responsive-image change soften anything?
//
// A `srcset` is only as good as its `sizes`, and an under-stated `sizes` is
// invisible in code review and invisible in a test — it shows up as a slightly
// soft photograph on one viewport width and not another. This walks the whole
// page at several widths and, for every `<img>`, compares the file the browser
// actually chose (`currentSrc` -> `naturalWidth`) against the pixels it has to
// fill (`clientWidth` x devicePixelRatio).
//
// A ratio below 1.0 means the browser is upscaling: the photograph is soft.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_image_resolution.mjs --out docs/reviews/2026-08-04-task-7/image-resolution.json

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-04-task-7/image-resolution.json");

const VIEWPORTS = [
  { width: 390, height: 844, dpr: 1 },
  { width: 390, height: 844, dpr: 3 },
  { width: 768, height: 1024, dpr: 1 },
  { width: 1440, height: 900, dpr: 1 },
  { width: 1920, height: 1080, dpr: 1 },
];

// `img.naturalWidth` is useless here: once an image is chosen from a `srcset`
// with `w` descriptors, the HTML spec has the browser correct the intrinsic
// dimensions by the selected candidate's density, so `naturalWidth` comes back
// equal to the CSS layout width for *every* image and every ratio is exactly
// 1.00. The first version of this rig did that and reported a page-wide 0.33 at
// DPR 3 that was an artefact, not a photograph. The chosen file's real width is
// read off its own filename instead — the pipeline names every derivative
// `<id>-<width>.<ext>` — and the widest candidate offered is read off the
// `<source>`'s srcset, so a shortfall can be attributed to the right cause.
const REPORT = `(() => {
  const widthOf = (url) => {
    const m = /-(\\d+)\\.(?:avif|webp|jpg)$/.exec(new URL(url, location.href).pathname);
    return m ? Number(m[1]) : null;
  };
  const out = [];
  for (const img of document.querySelectorAll("img")) {
    if (!img.currentSrc) continue;
    const needed = Math.round(img.clientWidth * window.devicePixelRatio);
    if (needed === 0) continue;
    const fileWidth = widthOf(img.currentSrc);
    if (!fileWidth) continue;

    const source = img.parentElement && img.parentElement.querySelector('source[type="image/avif"]');
    const offered = source
      ? source.srcset.split(",").map((c) => Number(/(\\d+)w\\s*$/.exec(c.trim())?.[1] || 0))
      : [];
    const widest = offered.length ? Math.max.apply(null, offered) : fileWidth;

    out.push({
      file: new URL(img.currentSrc).pathname,
      fileWidth,
      widestOffered: widest,
      cssWidth: Math.round(img.clientWidth),
      needed,
      ratio: Number((fileWidth / needed).toFixed(2)),
      // True when nothing wider exists for this photograph — the shortfall is
      // the image library's ceiling, not an under-stated \`sizes\`.
      atLibraryCeiling: fileWidth >= widest,
    });
  }
  return out;
})()`;

async function main() {
  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
    });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
      await new Promise((r) => setTimeout(r, 800));
    });
    await page.waitForLoadState("networkidle").catch(() => {});

    const images = await page.evaluate(REPORT);
    // The only failure this rig owns: a photograph served smaller than its box
    // while a wider file for it existed. That is an under-stated `sizes`.
    const understated = images.filter((i) => i.ratio < 1 && !i.atLibraryCeiling);
    // Separately worth knowing, and not fixable here: the library has nothing
    // wider. Six sources top out between 541px and 1000px.
    const ceiling = images.filter((i) => i.ratio < 1 && i.atLibraryCeiling);

    results.push({
      viewport: `${vp.width}x${vp.height}@${vp.dpr}x`,
      images: images.length,
      softestServed: images.slice().sort((a, b) => a.ratio - b.ratio)[0] ?? null,
      understatedSizes: understated,
      atLibraryCeiling: ceiling.map((c) => ({ file: c.file, needed: c.needed, ratio: c.ratio })),
    });
    console.log(
      `${vp.width}x${vp.height}@${vp.dpr}x — ${images.length} images, ` +
        `${understated.length} under-served by \`sizes\`, ${ceiling.length} at the library's ceiling`,
    );
    await context.close();
  }

  await browser.close();
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    `${JSON.stringify({ measuredAt: new Date().toISOString(), url: URL, results }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote ${OUT}`);

  const total = results.reduce((n, r) => n + r.understatedSizes.length, 0);
  if (total > 0) {
    console.error(`FAILED: ${total} photograph(s) served below their box with a wider file available.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
