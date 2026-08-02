// Build-time image pipeline for Mahua Resorts.
//
// Reads the curation list below (id -> source path -> hand-written alt text),
// re-encodes each source into AVIF and WebP at up to three widths, a single
// JPEG fallback, and a tiny inline base64 blur placeholder, then writes
// `lib/media-manifest.ts` (TypeScript, `as const`) describing the result.
//
// Run: node scripts/build_images.mjs

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "media");
const MANIFEST_PATH = path.join(ROOT, "lib", "media-manifest.ts");

/**
 * The curated set. Selected by eye from reference/mockup-media (the earlier
 * design mockups) and reference/wp-media (the live site crawl); mockup-media
 * is markedly better and every entry below comes from it. Capped at 14.
 *
 * Alt text is written by hand, in British English, describing what is
 * actually in the frame — not filler. See task-1-report.md for the full
 * curation rationale, rejected candidates, and the note on the missing
 * hand-drawn Pench location map (not present in either source folder).
 */
const CURATION = [
  {
    id: "lantern-bridge-dusk",
    src: "reference/mockup-media/lantern-lit-wooden-bridge-at-mahua-vann-at-dusk-b3e98363b8.jpg",
    alt: "A lantern-lit wooden bridge leading into Mahua Vann's forest canopy at dusk.",
  },
  {
    id: "tiger-golden-grass",
    src: "reference/mockup-media/a-bengal-tiger-moving-through-tall-golden-grass-b07148cf9b.jpg",
    alt: "A Bengal tiger moving through tall golden grass in the Pench forest.",
  },
  {
    id: "tiger-yawning",
    src: "reference/mockup-media/tiger-yawning-in-the-undergrowth-07140d7db1.jpg",
    alt: "A tiger yawning low in golden undergrowth, whiskers catching the light.",
  },
  {
    id: "leopard-on-rock",
    src: "reference/mockup-media/leopard-resting-on-a-rock-among-trees-7693cb2ddb.jpg",
    alt: "A leopard resting on a rock, framed by slender trees in dense forest.",
  },
  {
    id: "melanistic-leopard",
    src: "reference/mockup-media/melanistic-leopard-in-a-tree-4653568499.jpg",
    alt: "A melanistic leopard perched watchfully in the fork of a tree.",
  },
  {
    id: "mahua-vann-room",
    src: "reference/mockup-media/mud-walled-room-with-tiled-roof-and-forest-view-at-mahu-2e5022462f.jpg",
    alt: "A mud-walled room at Mahua Vann with a tiled roof and forest views through open windows.",
  },
  {
    id: "mahua-tola-suite",
    src: "reference/mockup-media/family-suite-with-terracotta-roof-and-jungle-textiles-a-19a0ef4a39.jpg",
    alt: "A family suite at Mahua Tola with a terracotta roof and jungle-print textiles.",
  },
  {
    id: "bonfire-dinner",
    src: "reference/mockup-media/bonfire-dinner-under-lantern-lit-trees-111c897880.jpg",
    alt: "A bonfire dinner laid beneath lantern-lit trees under a starlit sky.",
  },
  {
    id: "veranda-dusk",
    src: "reference/mockup-media/lantern-lit-veranda-walkway-at-dusk-24dbe6defa.jpg",
    alt: "A lantern-lit veranda walkway threading through the gardens at dusk.",
  },
  {
    id: "mahua-tola-pool",
    src: "reference/mockup-media/the-pool-at-mahua-tola-lit-by-lanterns-at-dusk-e564617ce9.jpg",
    alt: "The pool at Mahua Tola lit by lanterns against a fading dusk sky.",
  },
  {
    id: "guide-sunrise",
    src: "reference/mockup-media/a-guide-scanning-the-canopy-with-binoculars-at-sunrise-400151ad6e.jpg",
    alt: "A guide scanning the forest canopy with binoculars in the early sunrise light.",
  },
  {
    id: "bush-breakfast",
    src: "reference/mockup-media/guests-birdwatching-over-bush-breakfast-beside-the-safa-7f7e228366.jpg",
    alt: "Guests birdwatching over a bush breakfast laid out beside the safari vehicle.",
  },
  {
    id: "sound-healing",
    src: "reference/mockup-media/sound-healing-session-by-candlelight-a65d35e28c.jpg",
    alt: "A sound healing session by candlelight, singing bowls set before a seated guest.",
  },
  {
    id: "potters-hands",
    src: "reference/mockup-media/mahua-brand-guidelines-v1-forest-24-63f192761b.jpg",
    alt: "A potter's clay-covered hands shaping a vessel on the wheel.",
  },
];

/** Nominal responsive tiers. A tier narrower than the source is skipped — never upscale. */
const WIDTHS = [960, 1440, 1920];
const AVIF_QUALITY = 55;
const WEBP_QUALITY = 72;
const JPG_QUALITY = 78;
const BLUR_WIDTH = 24;

async function buildOne(entry) {
  const srcPath = path.join(ROOT, entry.src);
  const srcBuffer = await readFile(srcPath);
  const srcMeta = await sharp(srcBuffer).metadata();
  if (!srcMeta.width || !srcMeta.height) {
    throw new Error(`${entry.id}: could not read dimensions of ${entry.src}`);
  }

  // Never upscale: only emit tiers that fit within the source's native width.
  // If the source is narrower than every configured tier (several of the
  // strongest curated shots are ~900px wide), fall back to one derivative at
  // the source's own width rather than emitting nothing for that image.
  const fittingWidths = WIDTHS.filter((w) => w <= srcMeta.width);
  const widthsToGenerate = fittingWidths.length > 0 ? fittingWidths : [srcMeta.width];

  const produced = [];
  for (const width of widthsToGenerate) {
    const resized = sharp(srcBuffer).resize({ width, withoutEnlargement: true });

    const avifBuffer = await resized.clone().avif({ quality: AVIF_QUALITY }).toBuffer();
    const avifName = `${entry.id}-${width}.avif`;
    await writeFile(path.join(OUT_DIR, avifName), avifBuffer);

    const webpBuffer = await resized.clone().webp({ quality: WEBP_QUALITY }).toBuffer();
    const webpName = `${entry.id}-${width}.webp`;
    await writeFile(path.join(OUT_DIR, webpName), webpBuffer);

    produced.push({ width, avifName, webpName, avifBytes: avifBuffer.length });
  }

  // Largest tier actually produced becomes the manifest's canonical entry
  // and the JPEG fallback.
  const largest = produced.reduce((a, b) => (b.width > a.width ? b : a));
  const largestMeta = await sharp(srcBuffer)
    .resize({ width: largest.width, withoutEnlargement: true })
    .metadata();

  const jpgBuffer = await sharp(srcBuffer)
    .resize({ width: largest.width, withoutEnlargement: true })
    .jpeg({ quality: JPG_QUALITY, mozjpeg: true })
    .toBuffer();
  const jpgName = `${entry.id}-${largest.width}.jpg`;
  await writeFile(path.join(OUT_DIR, jpgName), jpgBuffer);

  const blurBuffer = await sharp(srcBuffer)
    .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
    .blur()
    .webp({ quality: 40 })
    .toBuffer();
  const blur = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

  return {
    id: entry.id,
    alt: entry.alt,
    width: largestMeta.width,
    height: largestMeta.height,
    avif: `/media/${largest.avifName}`,
    webp: `/media/${largest.webpName}`,
    jpg: `/media/${jpgName}`,
    blur,
    _widthsGenerated: produced.map((p) => p.width),
    _largestAvifBytes: largest.avifBytes,
  };
}

function tsStringLiteral(s) {
  return JSON.stringify(s);
}

function renderManifest(entries) {
  const lines = [];
  lines.push("// GENERATED FILE — do not edit by hand.");
  lines.push("// Produced by scripts/build_images.mjs from reference/mockup-media.");
  lines.push("// Run `node scripts/build_images.mjs` to regenerate.");
  lines.push("");
  lines.push("export const MANIFEST = [");
  for (const e of entries) {
    lines.push("  {");
    lines.push(`    id: ${tsStringLiteral(e.id)},`);
    lines.push(`    alt: ${tsStringLiteral(e.alt)},`);
    lines.push(`    width: ${e.width},`);
    lines.push(`    height: ${e.height},`);
    lines.push(`    avif: ${tsStringLiteral(e.avif)},`);
    lines.push(`    webp: ${tsStringLiteral(e.webp)},`);
    lines.push(`    jpg: ${tsStringLiteral(e.jpg)},`);
    lines.push(`    blur: ${tsStringLiteral(e.blur)},`);
    lines.push("  },");
  }
  lines.push("] as const;");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const results = [];
  for (const entry of CURATION) {
    process.stdout.write(`Building ${entry.id} <- ${entry.src} ... `);
    const result = await buildOne(entry);
    results.push(result);
    console.log(
      `widths [${result._widthsGenerated.join(", ")}], largest AVIF ${(result._largestAvifBytes / 1024).toFixed(1)} KB`,
    );
  }

  const manifestSource = renderManifest(results);
  await writeFile(MANIFEST_PATH, manifestSource, "utf8");
  console.log(`\nWrote ${MANIFEST_PATH}`);

  const largest = results.reduce((a, b) => (b._largestAvifBytes > a._largestAvifBytes ? b : a));
  console.log(
    `Largest AVIF overall: ${largest.id} at ${(largest._largestAvifBytes / 1024).toFixed(1)} KB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
