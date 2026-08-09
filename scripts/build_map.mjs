// The two park maps, redrawn in the cream palette from the client's own
// artwork. Run: node scripts/build_map.mjs
//
// The geography is theirs and is TRACED, never hand-drawn: DECISIONS.md §8
// records three hand-authored tigers failing because hand-written bezier
// coordinates are slightly wrong everywhere, which is what reads as cheap.
// Only the colour and the type change, and the type is not here at all — every
// label lives in content/, because it is copy.
//
// Four things were learned by looking at the output of this pipeline rather
// than by reasoning about it (spec §5), and each is load-bearing:
//
//   1. potrace fills the DARK areas. A white-on-black mask traces the
//      inverse — the first run produced a solid gold rectangle. Hence
//      `.negate()` before tracing.
//   2. The place names sit ON the regions, so a colour mask is perforated by
//      its own type. `close()` below is a real morphological close (dilate,
//      then erode) which fills them. A plain blur+threshold is a dilation
//      only and leaves the shape permanently fattened.
//   3. The legend and compass must be cropped off or their swatches trace as
//      stray specks out in the paper.
//   4. The park's extent is recovered as "not paper and not road", NOT by
//      matching green — matching green re-introduces (2) at the outline,
//      where it is most visible.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import potrace from "potrace";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * `mapRight` crops the legend and compass off by x, in source pixels. Read it
 * off the artwork: it is the left edge of the legend's colour swatches.
 */
const MAPS = [
  {
    name: "vann",
    src: "reference/wp-media/property-pages/Mahua-website_Vann-pench-map.jpg",
    out: "lib/vann-map-art.ts",
    constant: "VANN_MAP_ART",
    mapRight: 800,
  },
  {
    name: "tola",
    src: "reference/wp-media/property-pages/Mahua-website_Tola-tadoba-map2.jpg",
    out: "lib/tola-map-art.ts",
    constant: "TOLA_MAP_ART",
    // Measured directly off the artwork (968x484 source): the legend's
    // leftmost swatch (the "National park entry gate" brown square) starts
    // at x=668. The map's own geography — including the "Nagpur to
    // Gadchiroli" label and arrow, the furthest-right map content — ends by
    // x=606. 660 sits just below the legend with clean margin on both sides.
    mapRight: 660,
  },
];

const isPaper = (r, g, b) => r > 235 && g > 235 && b > 235;
const isRoad = (r, g, b) => r > 200 && g > 170 && b < 150;
const isCore = (r, g, b) => g > 110 && g < 205 && r < g - 35 && b < g - 55;
const isWater = (r, g, b) => b > 140 && b > r + 40 && g < b - 15;

/**
 * A true morphological close: dilate by `radius`, then erode by the same.
 *
 * `blur().threshold(low)` alone is a dilation, and leaves every region
 * permanently fatter than the geography. Doing both halves puts the boundary
 * back where it started while keeping the holes filled.
 *
 * `.toColourspace("b-w")` before every `raw().toBuffer()` below is not
 * decorative: this sharp build silently promotes a single-channel `b-w` raw
 * source to 3-channel sRGB the moment `.blur()` or `.threshold()` touches it,
 * so the buffer handed back is three times the length the next step's
 * `{ raw: { channels: 1 } }` reconstruction assumes. Without forcing it back
 * to one channel here, that reconstruction reads real pixels off the wrong
 * offsets — it does not throw, it just produces a mask that traces as
 * garbage or nothing (this is exactly how the Pench "core" region first
 * traced to 0 chars: not an empty mask, a misread one).
 *
 * `blur` and `threshold` are also materialised as two SEPARATE pipelines
 * below, each ending its own `raw().toBuffer()`, rather than chained in one
 * `.blur(radius).threshold(n)` call. Chained in one pipeline, this sharp
 * build silently drops the `.threshold()` — the buffer that comes out is
 * still the continuous blurred greyscale, never binarised. That is not cosmetic:
 * it is the difference between the intended asymmetric dilate (threshold 40)
 * / erode (threshold 215) and an unweighted double blur, and it is why the
 * road — thin, and the one region depending on the erode step being strict —
 * traced to 0 chars even after the channel fix above.
 */
async function close(mask, { width, height }, radius) {
  const blurredForDilate = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(radius)
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  const dilated = await sharp(blurredForDilate, { raw: { width, height, channels: 1 } })
    .threshold(40)
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  const blurredForErode = await sharp(dilated, { raw: { width, height, channels: 1 } })
    .blur(radius)
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  return sharp(blurredForErode, { raw: { width, height, channels: 1 } })
    .threshold(215)
    .toColourspace("b-w")
    .negate() // potrace fills the dark; the region must be black on white.
    .png()
    .toBuffer();
}

function trace(png) {
  return new Promise((res, rej) =>
    potrace.trace(png, { turdSize: 40, optCurve: true, alphaMax: 1, threshold: 128 }, (e, svg) =>
      e ? rej(e) : res(/ d="([^"]*)"/.exec(svg)?.[1] ?? /d="([^"]*)"/.exec(svg)?.[1] ?? ""),
    ),
  );
}

async function region(data, info, mapRight, test, radius) {
  const mask = Buffer.alloc(info.width * info.height);
  for (let p = 0; p < mask.length; p++) {
    const i = p * info.channels;
    const inMap = p % info.width < mapRight;
    mask[p] = inMap && test(data[i], data[i + 1], data[i + 2]) ? 255 : 0;
  }
  return trace(await close(mask, info, radius));
}

async function build(map) {
  const src = path.join(ROOT, map.src);
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });

  const regions = {
    // "Not paper and not road" — swallows the labels, the callout and the
    // water, so the outline comes back whole rather than perforated.
    park: await region(data, info, map.mapRight, (r, g, b) => !isPaper(r, g, b) && !isRoad(r, g, b), 5),
    core: await region(data, info, map.mapRight, isCore, 5),
    water: await region(data, info, map.mapRight, isWater, 2),
    // The largest radius on the page: the village dots and their labels sit
    // directly on the road, and bridging them is what keeps it continuous.
    road: await region(data, info, map.mapRight, isRoad, 9),
  };

  for (const [name, d] of Object.entries(regions)) {
    if (!d || d.length < 200) {
      throw new Error(
        `${map.name}: "${name}" traced to ${d.length} chars. A region that fails to trace must fail ` +
          `the build loudly, not render an empty cream rectangle.`,
      );
    }
  }

  const body = `// GENERATED FILE — do not edit by hand.
// Produced by scripts/build_map.mjs from ${map.src}.
// Run \`node scripts/build_map.mjs\` to regenerate.
//
// Region outlines only. Every label, gate, village and legend entry is copy
// and lives in content/, per CLAUDE.md's architecture rule.

export const ${map.constant} = {
  viewBox: { width: ${map.mapRight}, height: ${info.height} },
  regions: {
${Object.entries(regions)
  .map(([k, d]) => `    ${k}: ${JSON.stringify(d)},`)
  .join("\n")}
  },
} as const;
`;

  await writeFile(path.join(ROOT, map.out), body, "utf8");
  console.log(
    `${map.name}: ${Object.entries(regions)
      .map(([k, d]) => `${k} ${d.length}c`)
      .join(", ")}  ->  ${map.out}`,
  );
}

for (const map of MAPS) await build(map);
