// Build-time image pipeline for Mahua Resorts.
//
// Reads the curation list below (id -> source path -> hand-written alt text),
// re-encodes each source into AVIF and WebP at up to three widths, a single
// JPEG fallback, and a tiny inline base64 blur placeholder, then writes
// `lib/media-manifest.ts` (TypeScript, `as const`) describing the result.
//
// Run: node scripts/build_images.mjs

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "media");
const MANIFEST_PATH = path.join(ROOT, "lib", "media-manifest.ts");

/**
 * The curated set. Task 1 selected 14 from reference/mockup-media only.
 * Task 3 roughly triples that: the client's first complaint about the
 * rejected build was "it got so less images," and re-reviewed the live
 * site's own reference/wp-media pool, previously dismissed as weaker —
 * at inset and grid sizes many of those shots hold up fine, and the client
 * explicitly asked for them to be used.
 *
 * Every candidate in both folders was opened and looked at by eye before
 * being added or rejected — see task-3-report.md for the full table,
 * the rejected list (duplicates re-exported from the brand-guidelines PDF
 * at a different crop, the two Murud/Bagh coastal shots, one image showing
 * a recognisable guest's face on consent grounds, and a handful of
 * near-identical "path through bamboo to a cottage" repeats), and the
 * per-category counts.
 *
 * `category` is the brand guidelines' own photography taxonomy (lanternHour
 * / forest / lodgeLife / details). `orientation` and `fullBleedSafe` feed
 * the Task 7 layouts directly — fullBleedSafe is only ever true when the
 * largest derivative this script actually emits is >= 1400px wide (CLAUDE.md
 * non-negotiable #10); never set it true for a narrower source.
 *
 * Alt text is written by hand, in British English, describing what is
 * actually in the frame — not filler.
 */
const CURATION = [
  // ---- lanternHour: dusk and after — flame, filament and firelight ----
  {
    id: "lantern-bridge-dusk",
    src: "reference/mockup-media/lantern-lit-wooden-bridge-at-mahua-vann-at-dusk-b3e98363b8.jpg",
    alt: "A lantern-lit wooden bridge leading into Mahua Vann's forest canopy at dusk.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "bonfire-dinner",
    src: "reference/mockup-media/bonfire-dinner-under-lantern-lit-trees-111c897880.jpg",
    alt: "A bonfire dinner laid beneath lantern-lit trees under a starlit sky.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Was "veranda-dusk". Merged 4 Aug 2026 with the near-identical
    // "veranda-through-leaves" (mahua-brand-guidelines-v1-forest-15), which was
    // the same photograph at 700px against this one's 960px. The surviving
    // entry keeps the larger source and the more accurate of the two captions —
    // the veranda really is glimpsed through foreground leaves.
    id: "veranda-through-leaves",
    src: "reference/mockup-media/lantern-lit-veranda-walkway-at-dusk-24dbe6defa.jpg",
    alt: "A lantern-lit veranda glimpsed through leaves at dusk, a rattan lampshade glowing above the tables.",
    category: "lanternHour",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "mahua-tola-pool",
    src: "reference/mockup-media/the-pool-at-mahua-tola-lit-by-lanterns-at-dusk-e564617ce9.jpg",
    alt: "The pool at Mahua Tola lit by lanterns against a fading dusk sky.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  // "lantern-boardwalk-map" (mockup-media, mahua-brand-guidelines-v1-forest-14)
  // was removed 4 Aug 2026: perceptual hashing showed it is *pixel-identical*
  // to "lantern-bridge-dusk" above, which the mockup pack had also exported
  // under a descriptive name. Its alt text described a hand-painted forest map
  // that is not in the frame. See the duplicate guard in lib/media.test.ts.
  {
    id: "reception-path-dusk",
    src: "reference/wp-media/DSC00063-scaled.jpg",
    alt: "The path to a lantern-lit reception veranda at dusk, banana leaves catching the last light.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "birding-cairn-dusk",
    src: "reference/wp-media/DSC09540-scaled.jpg",
    alt: "A cairn of hand-painted bird names beside the path to a lantern-lit veranda at dusk.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "lodge-facade-night",
    src: "reference/wp-media/TWD5223-scaled.jpg",
    alt: "A two-storey lodge building lit against the night sky, framed by bamboo.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  // The 700px duplicate of "veranda-through-leaves" lived here until 4 Aug 2026.
  {
    id: "petal-table-night",
    src: "reference/video-stills/petal-table-night.png",
    alt: "A candlelit table strewn with bougainvillea petals on the night lawn, the lit veranda beyond.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "bonfire-circle-night",
    src: "reference/video-stills/bonfire-circle-night.png",
    alt: "A bonfire burning inside a ring of bamboo benches, the forest dark beyond the firelight.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },

  // ---- forest: wildlife from the lodges' own drives at Pench and Tadoba ----
  {
    id: "tiger-golden-grass",
    src: "reference/mockup-media/a-bengal-tiger-moving-through-tall-golden-grass-b07148cf9b.jpg",
    alt: "A Bengal tiger moving through tall golden grass in the Pench forest.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    // Was "tiger-yawning", from a source file named "tiger-yawning-in-the-
    // undergrowth". The photograph is nothing of the kind — it is a close side
    // profile, mouth shut, with a second cat's flank behind it. Merged 4 Aug
    // 2026 with the pixel-identical 700px "tiger-pair-profile"
    // (mahua-brand-guidelines-v1-forest-17); this 900px source survives under
    // that entry's accurate caption. Both were in the same plate grid, so the
    // Forest chapter would have shown one photograph twice, side by side.
    id: "tiger-pair-profile",
    src: "reference/mockup-media/tiger-yawning-in-the-undergrowth-07140d7db1.jpg",
    alt: "A tiger in close profile, a second cat's flank passing just behind it.",
    category: "forest",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "leopard-on-rock",
    src: "reference/mockup-media/leopard-resting-on-a-rock-among-trees-7693cb2ddb.jpg",
    alt: "A leopard resting on a rock, framed by slender trees in dense forest.",
    category: "forest",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "melanistic-leopard",
    src: "reference/mockup-media/melanistic-leopard-in-a-tree-4653568499.jpg",
    alt: "A melanistic leopard perched watchfully in the fork of a tree.",
    category: "forest",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  // Two more removed 4 Aug 2026, both re-exports from the v1 guidelines pack:
  // "tiger-approaching-grass" (forest-01) is the same walk-through-grass frame
  // as "tiger-golden-grass" at two-thirds the width, and "tiger-pair-profile"
  // (forest-17) is the 700px twin of the entry above.
  {
    id: "forest-boardwalk-daylight",
    src: "reference/wp-media/RAG1474-scaled.jpg",
    alt: "A timber boardwalk threading through forest, tangled vines framing the foreground.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "forest-trail-canopy",
    src: "reference/wp-media/DSC00170-scaled.jpg",
    alt: "A sunlit trail tunnelling beneath an arch of forest canopy.",
    category: "forest",
    orientation: "landscape",
    // Dense foliage compresses badly: at 1440 its WebP lands at 203 KB even at
    // the quality floor. Capped at 960 and dropped from full-bleed rather than
    // shipped over budget or visibly soft.
    maxWidth: 960,
    fullBleedSafe: false,
  },
  {
    id: "tiger-crossing-track",
    src: "reference/wp-media/Mahua-Website-Images_Homepage_Pench.jpg",
    alt: "A tiger crossing the track ahead of a safari jeep and its watching guests.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },

  // ---- lodgeLife: people mid-moment, candid, unposed ----
  {
    id: "mahua-vann-room",
    src: "reference/mockup-media/mud-walled-room-with-tiled-roof-and-forest-view-at-mahu-2e5022462f.jpg",
    alt: "A mud-walled room at Mahua Vann with a tiled roof and forest views through open windows.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "mahua-tola-suite",
    src: "reference/mockup-media/family-suite-with-terracotta-roof-and-jungle-textiles-a-19a0ef4a39.jpg",
    alt: "A family suite at Mahua Tola with a terracotta roof and jungle-print textiles.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "guide-sunrise",
    src: "reference/mockup-media/a-guide-scanning-the-canopy-with-binoculars-at-sunrise-400151ad6e.jpg",
    alt: "A guide scanning the forest canopy with binoculars in the early sunrise light.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  // "bush-breakfast" (mockup-media, guests-birdwatching-over-bush-breakfast-...jpg)
  // was removed on a guest-consent basis: a guest's face is fully lit, in
  // focus, and recognisable. That is a consent question, not a quality one —
  // Mahua may hold a release for that guest, but this pipeline does not know
  // that, so the image is excluded rather than assumed clear. See
  // task-3-report.md for the fuller reasoning.
  {
    id: "sound-healing",
    src: "reference/mockup-media/sound-healing-session-by-candlelight-a65d35e28c.jpg",
    alt: "A sound healing session by candlelight, singing bowls set before a seated guest.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "room-hanging-chair-view",
    src: "reference/wp-media/1600x900-pench-17.jpg",
    alt: "A mud-walled room opening onto a private balcony with a hanging cane chair among the trees.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "hanging-chair-forest-deck",
    src: "reference/wp-media/1600x900-pench-18.jpg",
    alt: "A hanging cane chair on a private wooden deck above the forest stream.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "bungalow-exterior-palms",
    src: "reference/wp-media/701998_499472406750031_483614617_o.jpg",
    alt: "A tiled-roof bungalow with young palms rising in front of its veranda.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "suite-tiger-painting",
    src: "reference/wp-media/Cottage-with-deck-2-scaled.jpg",
    alt: "A mud-walled suite with a painted cat's face above the bed and doors open to a forest deck.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    // These two had each other's source file until 4 Aug 2026: JAS05507 is the
    // lawn and JAS06485 is the bedroom, and the ids said the opposite. Nothing
    // in the suite could see it — the tests check that a file exists and is
    // under budget, not that the words describe the picture. Caught by eye,
    // during an audit of all 35 against their captions.
    id: "room-open-to-bamboo",
    src: "reference/wp-media/JAS06485-scaled.jpg",
    alt: "A room with a dark timber dado and terracotta beams, its doors open to a wall of bamboo.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "lawn-picnic-golden-hour",
    src: "reference/wp-media/JAS05507-HDR-scaled.jpg",
    alt: "Picnic tables and umbrellas set out on the lawn as the trees turn gold.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "hammocks-shade",
    src: "reference/video-stills/hammocks-shade.png",
    alt: "Two rope hammocks slung between slender trees in dappled afternoon shade.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  // "stargazing-telescope" (mockup-media, mahua-brand-guidelines-v1-forest-23-...jpg)
  // was also removed on a guest-consent basis on re-review: dim night
  // lighting makes two of the three figures unrecognisable, but the third
  // (left, glasses and beard visible) has discernible features under
  // low-but-not-negligible ambient light, and it is not clear from the frame
  // whether that figure is a guest or the naturalist. Excluded rather than
  // guessed — see task-3-report.md.
  {
    id: "garden-path-lodge",
    src: "reference/wp-media/3B84C808-5785-4721-82CD-5F6B68F83EE3-scaled.jpg",
    alt: "A stone path through palms and bamboo towards the lodge's reception rooms.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "pool-daylight-forest",
    src: "reference/wp-media/newsletter-banner.png",
    alt: "The pool by daylight, banana leaves and forest closing around the water.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },

  // ---- details: the small things guests remember — clay, flowers, shrines, hands ----
  {
    id: "potters-hands",
    src: "reference/mockup-media/mahua-brand-guidelines-v1-forest-24-63f192761b.jpg",
    alt: "A potter's clay-covered hands shaping a vessel on the wheel.",
    category: "details",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "petal-bowl-map",
    src: "reference/mockup-media/mahua-brand-guidelines-v1-forest-25-42377ab0ca.jpg",
    alt: "Rose petals afloat in a stone bowl before a lantern-lit forest map.",
    category: "details",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "forest-shrine-incense",
    src: "reference/mockup-media/mahua-brand-guidelines-v1-forest-26-cfc851210f.jpg",
    alt: "Incense smoke rising from a small forest shrine beneath a hanging lamp.",
    category: "details",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "lily-pond-fountain",
    src: "reference/wp-media/IMG_0175.jpg",
    alt: "Water lilies crowding a stone fountain, the lawn stretching out beyond.",
    category: "details",
    orientation: "square",
    fullBleedSafe: false,
  },
  {
    id: "geese-garden-pond",
    src: "reference/wp-media/vcccc-scaled.jpg",
    alt: "A family of geese paddling across a garden pond beneath overhanging leaves.",
    category: "details",
    orientation: "landscape",
    fullBleedSafe: true,
  },
];

/**
 * Nominal responsive tiers. A tier narrower than the source is skipped —
 * never upscale. Capped at 1440, not 1920: 1440px already clears the
 * >=1400px full-bleed threshold (CLAUDE.md non-negotiable #10), and several
 * of the busiest Task 3 sources (dense foliage, bamboo, tangled vines)
 * cannot hit the 200 KB budget at 1920 even at floor quality — the extra
 * pixels aren't worth the budget they cost. See encodeUnderBudget below.
 */
const WIDTHS = [960, 1440];
const AVIF_QUALITY = 55;
const WEBP_QUALITY = 72;
const JPG_QUALITY = 78;
const BLUR_WIDTH = 24;

// CLAUDE.md non-negotiable #6: "largest image < 200 KB" is a hard budget,
// not a target hit by eye on the 14 images this pipeline started with. Some
// of the wp-media sources brought in for Task 3 are far busier (leaf
// canopy, bamboo, tangled vines) than the original curated set and blew
// well past 200 KB at AVIF_QUALITY/WEBP_QUALITY on their largest tier. Step
// quality down per-encode until the budget is met instead of hand-tuning a
// magic constant for today's photo set — this keeps the guarantee true for
// whatever gets curated next, too. WebP compresses these high-frequency
// textures noticeably worse than AVIF at a given quality, so it gets a
// lower floor to work with — it's the older-browser fallback, not the
// format most visitors actually download.
const MAX_DERIVATIVE_BYTES = 200 * 1024;
const QUALITY_STEP = 5;
const AVIF_QUALITY_FLOOR = 30;
const WEBP_QUALITY_FLOOR = 20;
// The JPEG fallback used to be encoded once at a fixed quality with no
// budget check at all — every other format stepped down to meet the 200 KB
// cap, JPEG just didn't. That gap is exactly how 1440px JPEGs for the
// busiest Task 3 sources (forest-trail-canopy, garden-path-lodge, and
// others — dense foliage and bamboo again) ended up 1.5-2x over budget even
// after the 1920 tier was removed. Same floor-stepping treatment as AVIF/
// WebP now applies. mozjpeg holds up worse than AVIF at very low quality
// (visible blocking, not just softness), so its floor sits higher than
// WebP's — this is the fallback of last resort, not the format most
// visitors download, so some quality loss at the floor is an acceptable
// trade against a hard 200 KB ceiling.
const JPG_QUALITY_FLOOR = 35;

// Filenames that landed over MAX_DERIVATIVE_BYTES even at their quality
// floor, collected as buildOne() runs. A non-empty list at the end of
// main() sets a non-zero process.exitCode — previously an oversized file
// only ever got a console.warn, which a CI run (or a human skimming
// terminal output) can miss entirely. That is exactly how the JPEG-never-
// budgeted bug shipped in the first place: nothing failed loudly.
const overBudgetFiles = [];

async function encodeUnderBudget(resized, format, startQuality, floorQuality, extraOptions = {}) {
  let quality = startQuality;
  let result;
  for (;;) {
    const pipeline = resized.clone();
    result =
      format === "avif"
        ? await pipeline.avif({ quality, ...extraOptions }).toBuffer({ resolveWithObject: true })
        : format === "webp"
          ? await pipeline.webp({ quality, ...extraOptions }).toBuffer({ resolveWithObject: true })
          : await pipeline.jpeg({ quality, ...extraOptions }).toBuffer({ resolveWithObject: true });
    if (result.data.length <= MAX_DERIVATIVE_BYTES || quality <= floorQuality) break;
    // Clamp to floorQuality rather than always subtracting a full QUALITY_STEP:
    // when (startQuality - floorQuality) isn't a multiple of QUALITY_STEP, an
    // unclamped decrement overshoots and the *next* iteration encodes one
    // full step below the configured floor before the `quality <= floorQuality`
    // check above ever sees it — e.g. WebP (72 -> 20, step 5) bottomed out at
    // 17, JPEG (78 -> 35, step 5) at 33. Clamping guarantees the floor is the
    // lowest quality this function ever actually encodes at.
    quality = Math.max(quality - QUALITY_STEP, floorQuality);
  }
  return { ...result, quality };
}

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
  // `maxWidth` is a per-entry escape valve for a source that cannot be served
  // at a given tier inside the 200 KB budget without dropping below its quality
  // floor. Capping the tier is honest — the image simply is not offered wide —
  // where shipping it over budget, or below the floor, would not be.
  const ceiling = Math.min(srcMeta.width, entry.maxWidth ?? Number.POSITIVE_INFINITY);
  const fittingWidths = WIDTHS.filter((w) => w <= ceiling);
  const widthsToGenerate = fittingWidths.length > 0 ? fittingWidths : [srcMeta.width];

  const produced = [];
  for (const width of widthsToGenerate) {
    const resized = sharp(srcBuffer).resize({ width, withoutEnlargement: true });

    // `.metadata()` reads the *input* header and never runs the pixel
    // pipeline, so it cannot be used to learn what a queued `.resize()`
    // will actually emit. `.toBuffer({ resolveWithObject: true })` returns
    // `{ data, info }`, where `info.width`/`info.height` are the true
    // dimensions of the bytes just encoded — read those back instead of
    // re-deriving (and re-guessing) dimensions separately.
    const avifResult = await encodeUnderBudget(resized, "avif", AVIF_QUALITY, AVIF_QUALITY_FLOOR);
    const avifBuffer = avifResult.data;
    const avifInfo = avifResult.info;
    const avifName = `${entry.id}-${width}.avif`;
    await writeFile(path.join(OUT_DIR, avifName), avifBuffer);
    if (avifBuffer.length > MAX_DERIVATIVE_BYTES) {
      console.warn(
        `  ! ${avifName}: ${(avifBuffer.length / 1024).toFixed(1)} KB at floor quality ${avifResult.quality} — still over the 200 KB budget`,
      );
      overBudgetFiles.push({ name: avifName, bytes: avifBuffer.length, quality: avifResult.quality });
    }

    const webpResult = await encodeUnderBudget(resized, "webp", WEBP_QUALITY, WEBP_QUALITY_FLOOR);
    const webpBuffer = webpResult.data;
    const webpName = `${entry.id}-${width}.webp`;
    await writeFile(path.join(OUT_DIR, webpName), webpBuffer);
    if (webpBuffer.length > MAX_DERIVATIVE_BYTES) {
      console.warn(
        `  ! ${webpName}: ${(webpBuffer.length / 1024).toFixed(1)} KB at floor quality ${webpResult.quality} — still over the 200 KB budget`,
      );
      overBudgetFiles.push({ name: webpName, bytes: webpBuffer.length, quality: webpResult.quality });
    }

    produced.push({
      width,
      avifName,
      webpName,
      avifBytes: avifBuffer.length,
      webpBytes: webpBuffer.length,
      avifQuality: avifResult.quality,
      webpQuality: webpResult.quality,
      actualWidth: avifInfo.width,
      actualHeight: avifInfo.height,
    });
  }

  // Largest tier actually produced becomes the manifest's canonical entry
  // and the JPEG fallback. Its dimensions come from the buffer sharp just
  // encoded (captured above), not from re-reading the source.
  const largest = produced.reduce((a, b) => (b.width > a.width ? b : a));

  const jpgResized = sharp(srcBuffer).resize({ width: largest.width, withoutEnlargement: true });
  const jpgResult = await encodeUnderBudget(jpgResized, "jpeg", JPG_QUALITY, JPG_QUALITY_FLOOR, {
    mozjpeg: true,
  });
  const jpgBuffer = jpgResult.data;
  const jpgName = `${entry.id}-${largest.width}.jpg`;
  await writeFile(path.join(OUT_DIR, jpgName), jpgBuffer);
  if (jpgBuffer.length > MAX_DERIVATIVE_BYTES) {
    console.warn(
      `  ! ${jpgName}: ${(jpgBuffer.length / 1024).toFixed(1)} KB at floor quality ${jpgResult.quality} — still over the 200 KB budget`,
    );
    overBudgetFiles.push({ name: jpgName, bytes: jpgBuffer.length, quality: jpgResult.quality });
  }

  const blurBuffer = await sharp(srcBuffer)
    .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
    .blur()
    .webp({ quality: 40 })
    .toBuffer();
  const blur = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

  // Full-bleed eligibility is a hard rule (CLAUDE.md non-negotiable #10): an
  // entry curated as fullBleedSafe: true must actually emit a derivative
  // >= 1400px wide, not just claim a big enough source. Curation intent
  // (the CURATION array) and reality (what sharp actually encoded) can
  // drift if a source gets swapped later, so check both here rather than
  // trusting the hand-set flag through to the manifest unverified.
  if (entry.fullBleedSafe && largest.actualWidth < 1400) {
    throw new Error(
      `${entry.id}: curated fullBleedSafe: true but the largest derivative is only ${largest.actualWidth}px`,
    );
  }

  return {
    id: entry.id,
    alt: entry.alt,
    width: largest.actualWidth,
    height: largest.actualHeight,
    avif: `/media/${largest.avifName}`,
    webp: `/media/${largest.webpName}`,
    jpg: `/media/${jpgName}`,
    blur,
    category: entry.category,
    orientation: entry.orientation,
    fullBleedSafe: entry.fullBleedSafe,
    _widthsGenerated: produced.map((p) => p.width),
    _largestAvifBytes: largest.avifBytes,
    // Includes the JPEG fallback now that it is budget-checked too — this
    // used to only look at avif/webp bytes, which is how a 636 KB JPEG sat
    // on disk while this figure quietly reported everything as compliant.
    _largestDerivativeBytes: Math.max(
      ...produced.map((p) => Math.max(p.avifBytes, p.webpBytes)),
      jpgBuffer.length,
    ),
    // Every file this entry actually wrote to OUT_DIR at every tier — not
    // just the largest tier recorded in the manifest above. This is the
    // per-entry contribution to the "what should exist" set that
    // cleanupStaleFiles() uses to find files the current curation list and
    // WIDTHS would not produce.
    _allFilenames: [...produced.flatMap((p) => [p.avifName, p.webpName]), jpgName],
    // Per-tier, per-format quality actually used, for the build log. This
    // used to exist only in a console.log line, gone the moment the
    // terminal scrolled past it — nobody could tell, weeks later, whether a
    // given derivative was crisp at quality 55 or scraped its floor at 30.
    _tiers: produced.map((p) => ({
      width: p.width,
      avifQuality: p.avifQuality,
      avifBytes: p.avifBytes,
      webpQuality: p.webpQuality,
      webpBytes: p.webpBytes,
    })),
    _jpgQuality: jpgResult.quality,
    _jpgBytes: jpgBuffer.length,
  };
}

function tsStringLiteral(s) {
  return JSON.stringify(s);
}

function renderManifest(entries) {
  const lines = [];
  lines.push("// GENERATED FILE — do not edit by hand.");
  lines.push("// Produced by scripts/build_images.mjs from reference/mockup-media and reference/wp-media.");
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
    lines.push(`    category: ${tsStringLiteral(e.category)},`);
    lines.push(`    orientation: ${tsStringLiteral(e.orientation)},`);
    lines.push(`    fullBleedSafe: ${e.fullBleedSafe},`);
    lines.push("  },");
  }
  lines.push("] as const;");
  lines.push("");
  return lines.join("\n");
}

// Deletes anything sitting in OUT_DIR that the current CURATION list and
// WIDTHS would not produce. The manifest this run is about to write is the
// authority on what should exist — `expectedFilenames` is built from exactly
// what buildOne() wrote for every entry actually in CURATION this run, at
// every tier it generated (not just the tier the manifest records), so
// nothing still-referenced can be swept up here. This closes a gap flagged
// as a deferred minor in Plan 2: a source removed from CURATION, or a WIDTHS
// tier removed (as happened when 1920 was dropped for budget reasons),
// previously left its old derivatives on disk forever with nothing to ever
// clean them up.
//
// Assumption this relies on: nothing but this script ever writes into
// OUT_DIR (public/media/). A hand-placed favicon, OG image, or any other
// file dropped straight into public/media/ outside this pipeline will be
// silently deleted on the next run — it won't be in any entry's
// `_allFilenames`. Keep any such file in a different directory under
// public/.
async function cleanupStaleFiles(expectedFilenames) {
  const existing = await readdir(OUT_DIR);
  const stale = existing.filter((f) => !expectedFilenames.has(f));
  for (const f of stale) {
    await rm(path.join(OUT_DIR, f));
  }
  return stale;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const results = [];
  const expectedFilenames = new Set();
  for (const entry of CURATION) {
    process.stdout.write(`Building ${entry.id} <- ${entry.src} ... `);
    const result = await buildOne(entry);
    results.push(result);
    for (const filename of result._allFilenames) expectedFilenames.add(filename);
    console.log(
      `widths [${result._widthsGenerated.join(", ")}], largest derivative ${(result._largestDerivativeBytes / 1024).toFixed(1)} KB`,
    );
  }

  const stale = await cleanupStaleFiles(expectedFilenames);
  if (stale.length > 0) {
    console.log(`\nRemoved ${stale.length} stale file(s) no longer produced by the current curation list/WIDTHS:`);
    for (const f of stale) console.log(`  - ${f}`);
  } else {
    console.log("\nNo stale files found in public/media.");
  }

  const manifestSource = renderManifest(results);
  await writeFile(MANIFEST_PATH, manifestSource, "utf8");
  console.log(`\nWrote ${MANIFEST_PATH}`);

  const largest = results.reduce((a, b) =>
    b._largestDerivativeBytes > a._largestDerivativeBytes ? b : a,
  );
  console.log(
    `Largest derivative overall: ${largest.id} at ${(largest._largestDerivativeBytes / 1024).toFixed(1)} KB`,
  );
  // Fail loudly. Previously an oversized derivative only produced a console
  // warning, which CI and a human skimming output both miss — that is exactly
  // how a 636 KB file and an unbudgeted JPEG encoder both shipped unnoticed.
  if (overBudgetFiles.length > 0) {
    console.error(
      `\nFAILED: ${overBudgetFiles.length} derivative(s) exceed the 200 KB budget ` +
        `(CLAUDE.md non-negotiable #6) even at their quality floor:`,
    );
    for (const f of overBudgetFiles) {
      console.error(`  ${f.name} — ${(f.bytes / 1024).toFixed(1)} KB at quality ${f.quality}`);
    }
    console.error(
      `Cap the offending entry with \`maxWidth\` so it is not offered at that tier, ` +
        `or drop it. Do not lower the quality floor.`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
