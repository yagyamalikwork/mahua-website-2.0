// Build the brand emblem used in the site header from the client's vector logo.
//
// Run: node scripts/build_brand.mjs
//
// The supplied artwork (`Mahua property logos/Mahua Resorts/Mahua Resorts.svg`)
// is a 127 KB, 340-path, 14-colour Illustrator export of the *whole* lockup —
// the mahua flower above "MAHUA" above "RESORTS". Three problems make it wrong
// to drop straight into the header:
//
//   1. 127 KB is a sixth of the first-fold budget for one 40px mark, and the
//      header is above the fold on every page load.
//   2. The wordmark is set in brown (#7F5C24), which is unreadable over the
//      hero photograph the header sits on.
//   3. A vertical three-tier lockup does not fit a slim header bar.
//
// So we split it: the flower is rasterised here to a handful of small files,
// and the words are set live in Cinzel (already loaded, already used for every
// other label on the page) so they can take the cream the photograph needs and
// stay crisp at any size. Nothing is redrawn — the flower is the client's own
// artwork, rendered at 600 DPI and cropped to its own ink.
//
// Emitted widths cover a ~40px mark up to the 2x density cap in lib/sizes.ts,
// with headroom: a 3x phone gets the 160 and is capped there by `sizes`.

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "Mahua property logos", "Mahua Resorts", "Mahua Resorts.svg");
const OUT_DIR = path.join(ROOT, "public", "brand");
const WIDTHS = [80, 120, 160];

/** Rows of the rendered lockup that belong to the flower, not to the words. */
async function emblemBand(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const inked = [];
  for (let y = 0; y < info.height; y++) {
    let n = 0;
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 12) n++;
    }
    inked.push(n > 0);
  }

  // The lockup is three ink bands separated by clear space. The first is the
  // flower. Derived rather than hard-coded, so a re-supplied logo with different
  // spacing still crops correctly instead of silently slicing the artwork.
  const bands = [];
  let start = null;
  for (let y = 0; y <= inked.length; y++) {
    if (inked[y] && start === null) start = y;
    if (!inked[y] && start !== null) {
      bands.push([start, y - 1]);
      start = null;
    }
  }
  if (bands.length < 2) {
    throw new Error(`Expected the emblem and at least one word band, found ${bands.length}.`);
  }
  return bands[0];
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // Clear the directory first. Changing WIDTHS otherwise leaves the old files
  // on disk, where they look current and get committed — the same stale-artefact
  // trap that scripts/build_images.mjs had to grow a cleanup pass for.
  const expected = new Set([...WIDTHS.map((w) => `emblem-${w}.webp`), `emblem-${WIDTHS[1]}.png`]);
  for (const f of await readdir(OUT_DIR)) {
    if (!expected.has(f)) {
      await rm(path.join(OUT_DIR, f));
      console.log(`removed stale ${f}`);
    }
  }

  const rendered = await sharp(SRC, { density: 600 }).png().toBuffer();
  const { width, height } = await sharp(rendered).metadata();
  const [top, bottom] = await emblemBand(rendered);

  // Two passes on purpose: sharp resolves `extract` and `trim` in one pipeline
  // against the same source dimensions, and asking for both at once fails with
  // "bad extract area". Crop to the band first, then trim the transparent
  // margins left and right so the mark is flush to its own bounding box and the
  // header can size it directly.
  const band = await sharp(rendered)
    .extract({ left: 0, top, width, height: bottom - top + 1 })
    .toBuffer();
  const emblem = await sharp(band).trim().toBuffer();
  const cropped = await sharp(emblem).metadata();

  console.log(`source lockup ${width}x${height}, emblem rows ${top}-${bottom}`);
  console.log(`emblem cropped to ${cropped.width}x${cropped.height}`);

  const emitted = [];
  for (const w of WIDTHS) {
    // The mark is flat-colour vector art, so it takes hard compression without
    // visible loss where a photograph would not. `alphaQuality: 100` is kept:
    // the artwork sits over a photograph and a soft alpha edge shows.
    const webp = await sharp(emblem)
      .resize({ width: w })
      .webp({ quality: 78, alphaQuality: 100, effort: 6 })
      .toBuffer();
    await writeFile(path.join(OUT_DIR, `emblem-${w}.webp`), webp);
    emitted.push({ w, bytes: webp.length });
    console.log(`  emblem-${w}.webp ${(webp.length / 1024).toFixed(1)} KB`);
  }

  // One PNG, at the middle width, purely as the `<picture>` fallback. Emitting
  // three would be three files that a modern browser never requests; a browser
  // old enough to need PNG is on a connection that wants the smaller one.
  const fallbackWidth = WIDTHS[1];
  const png = await sharp(emblem)
    .resize({ width: fallbackWidth })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();
  await writeFile(path.join(OUT_DIR, `emblem-${fallbackWidth}.png`), png);
  console.log(`  emblem-${fallbackWidth}.png ${(png.length / 1024).toFixed(1)} KB (fallback only)`);

  // The header is above the fold on every load, so an emblem that quietly grew
  // would be paid for by every visitor. Budgeted on the WebP, since that is what
  // is actually fetched. AVIF is skipped deliberately: at these sizes its
  // container overhead makes it larger than WebP.
  const heaviest = Math.max(...emitted.map((e) => e.bytes));
  if (heaviest > 8 * 1024) {
    console.error(`\nEmblem WebP of ${(heaviest / 1024).toFixed(1)} KB exceeds the 8 KB header budget.`);
    process.exitCode = 1;
  }

  const aspect = cropped.width / cropped.height;
  await writeFile(
    path.join(ROOT, "lib", "brand-emblem.ts"),
    `// GENERATED FILE — do not edit by hand.\n` +
      `// Produced by scripts/build_brand.mjs from the client's vector lockup.\n` +
      `// Run \`node scripts/build_brand.mjs\` to regenerate.\n\n` +
      `export const EMBLEM = {\n` +
      `  widths: [${WIDTHS.join(", ")}] as const,\n` +
      `  /** The one width emitted as PNG, for the <picture> fallback. */\n` +
      `  fallback: ${fallbackWidth},\n` +
      `  /** Intrinsic aspect of the cropped mark, for a box that cannot shift. */\n` +
      `  aspectRatio: ${aspect.toFixed(4)},\n` +
      `  width: ${cropped.width},\n` +
      `  height: ${cropped.height},\n` +
      `} as const;\n`,
  );
  console.log("\nwrote lib/brand-emblem.ts");
}

await main();
