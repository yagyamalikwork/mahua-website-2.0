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
 *
 * `roadClose` is the road region's dilate/erode radii (see `close()` below).
 * Vann's differ — see the comment at its `region()` call in `build()`.
 */
const MAPS = [
  {
    name: "vann",
    src: "reference/wp-media/property-pages/Mahua-website_Vann-pench-map.jpg",
    out: "lib/vann-map-art.ts",
    constant: "VANN_MAP_ART",
    mapRight: 800,
    roadClose: { dilate: 12, erode: 9 },
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
    roadClose: { dilate: 9, erode: 9 },
  },
];

const isPaper = (r, g, b) => r > 235 && g > 235 && b > 235;
const isRoad = (r, g, b) => r > 200 && g > 170 && b < 150;
const isCore = (r, g, b) => g > 110 && g < 205 && r < g - 35 && b < g - 55;
const isWater = (r, g, b) => b > 140 && b > r + 40 && g < b - 15;

/**
 * A true morphological close: dilate by `dilateRadius`, then erode by
 * `erodeRadius` (defaults to the same value, which is what makes it a real
 * close rather than a dilation — see below). The dilate step's threshold
 * (40, low) and the erode step's threshold (215, high) are symmetric around
 * 127.5, so with equal radii the boundary lands back where it started while
 * the holes stay filled. `blur().threshold(low)` alone, with no erode step,
 * is a dilation only, and leaves every region permanently fatter than the
 * geography.
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
 * `.blur(radius).threshold(n)` call. This is NOT because chaining "drops"
 * the threshold — it doesn't. sharp's own pipeline (src/pipeline.cc) always
 * runs threshold *before* blur within a single pipeline regardless of call
 * order ("Threshold - must happen before blurring, due to the utility of
 * blurring after thresholding"). So `.blur(r).threshold(40)` chained in one
 * pipeline actually runs threshold(40) FIRST — a no-op on the still-binary
 * 0/255 mask — and blurs SECOND, with nothing downstream to re-binarise the
 * result. That is why the chained version came out as continuous grey
 * rather than a clean dilation: not a dropped call, a reordered one. Forcing
 * each stage through its own `raw().toBuffer()` is what makes blur, then
 * threshold, actually run in THAT order — which is the order the intended
 * asymmetric dilate(40)/erode(215) close depends on.
 *
 * `erodeRadius` can be smaller than `dilateRadius`. That is a deliberate,
 * *im*perfect close: the erode step no longer fully undoes the dilate, so
 * the region ends up very slightly larger than the true geography — the
 * price of asking the dilate step to bridge a wider gap than the erode step
 * would, on its own, be safe to shrink back down from without eroding a
 * thin feature away entirely. See the Vann road's `roadClose` in `MAPS` for
 * why this is worth paying there and nowhere else on the page.
 */
async function close(mask, { width, height }, dilateRadius, erodeRadius = dilateRadius) {
  const blurredForDilate = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(dilateRadius)
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  const dilated = await sharp(blurredForDilate, { raw: { width, height, channels: 1 } })
    .threshold(40)
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  const blurredForErode = await sharp(dilated, { raw: { width, height, channels: 1 } })
    .blur(erodeRadius)
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

/**
 * `turdSize: 1000` filters out connected components below that pixel area
 * before potrace ever traces a contour — this is what keeps every icon glyph
 * (gate squares, forest-rest-house triangles, village dots, zone-number
 * badges, the small flower emblem) that happens to fall inside `mapRight`
 * from tracing as its own stray fleck of "dirt" next to the real geography.
 *
 * It was raised from 40, and 1000 is not a guess: swept in steps against
 * both maps' `park` region (the worst offender — up to 9 stray subpaths at
 * 40), every real speck died by turdSize=1000 while the largest surviving
 * fleck at turdSize=800 was still there. The floor for real content sits far
 * above that: Vann's `core` region has a genuine second lobe of the dark
 * core zone (not a speck — confirmed against the source artwork) that
 * survives untouched even at turdSize=3000, and both maps' `water` and
 * `road` main shapes are an order of magnitude larger still. 1000 sits with
 * headroom on both sides. Re-run `scripts/build_map.mjs` after touching this
 * and look at the previews (Step 7) — a value that is merely "high enough"
 * on today's artwork is not a promise it stays high enough on different art.
 */
function trace(png, turdSize = 1000) {
  return new Promise((res, rej) =>
    potrace.trace(png, { turdSize, optCurve: true, alphaMax: 1, threshold: 128 }, (e, svg) =>
      e ? rej(e) : res(/ d="([^"]*)"/.exec(svg)?.[1] ?? /d="([^"]*)"/.exec(svg)?.[1] ?? ""),
    ),
  );
}

async function region(data, info, mapRight, test, dilateRadius, erodeRadius = dilateRadius) {
  const mask = Buffer.alloc(info.width * info.height);
  for (let p = 0; p < mask.length; p++) {
    const i = p * info.channels;
    const inMap = p % info.width < mapRight;
    mask[p] = inMap && test(data[i], data[i + 1], data[i + 2]) ? 255 : 0;
  }
  return trace(await close(mask, info, dilateRadius, erodeRadius));
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
    // The largest dilate radius on the page: the village dots and their
    // labels sit directly on the road, and bridging them is what keeps it
    // continuous. Vann needs MORE dilate than erode here (`roadClose` in
    // `MAPS`): the "Kurai" village dot sits squarely on the road at roughly
    // (690, 207) in the 968px source, an 8px-tall gap that a symmetric
    // radius-9 close leaves the road split across (2 subpaths, confirmed by
    // scanning the raw mask row-by-row — the gap is real, not an artefact,
    // and it is NOT the "We're here!" callout, which sits well clear of the
    // road at x=560-610). Raising both radii together to bridge it doesn't
    // work: past radius ~14 the erode step starts eating the road itself
    // faster than the dilate step can feed it (this is a blur-based
    // approximation of a morphological close, not the real thing, and it
    // degrades non-monotonically — by radius 15 the whole road is gone).
    // Raising only the dilate radius, to 12, bridges the gap at a measured
    // cost: road width away from the gap goes from ~12-13px to ~15-17px
    // (checked at two cross-sections clear of the gap, y=350 and y=430).
    // That is a real, visible fattening, not nothing — but the alternative
    // is a road with a hole in it, which is worse. Tola's road needs no
    // asymmetry: its "3 subpaths" before the turdSize fix above was a
    // genuine ring (outer + inner boundary, 2 legitimate subpaths — see
    // `map-art.test.ts`) plus one small stray fragment turdSize now removes,
    // not a real gap.
    road: await region(data, info, map.mapRight, isRoad, map.roadClose.dilate, map.roadClose.erode),
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
