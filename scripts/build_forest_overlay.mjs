// Turn the client's forest-and-hornbills drawing into a tint that can sit behind
// type, for `03 · The Forest`.
//
// Run: node scripts/build_forest_overlay.mjs
//
// Source: `Forest-illustrations/forest-overlay.jfif`, supplied 10 Aug 2026 — a
// 1024x572 JPEG of a line-drawn forest with three Malabar pied hornbills on a
// white sky. The birds are native to Pench, which is Mahua Vann's park, and the
// chapter's own copy says "three hundred recorded birds".
//
// ## Why it is not blended at runtime like the films
//
// The two films erase their white ground with `mix-blend-mode: darken`
// (DECISIONS §9). That is right for a figure floating on white and wrong here,
// for two measured reasons:
//
//   1. **The drawing bleeds dark to three of its four edges.** Its bottom corners
//      are (73,88,65) and (85,100,77), not white — it is a scene with a white
//      sky, not a figure on white. Under `darken` its lower two-thirds would be
//      solid dark green across the section, and non-negotiable #3 allows no dark
//      bands on cream.
//   2. **64.4% of its ink is dark** (luma < 110). Type over that is unreadable at
//      full strength whatever the blend mode.
//
// ## Why it is flattened onto the cream rather than served with alpha
//
// **This is worth 45x the bytes.** The same tint carried as a semi-transparent
// WebP is **282 KB** at 1024px — past non-negotiable #6's 200 KB ceiling for a
// single image, for a decoration. Almost all of that is the alpha plane: a full
// frame of fine foliage encoded as per-pixel opacity. Flattened onto the cream
// the result is a near-uniform field with a faint sage variation, which WebP
// takes to **~6 KB**. Measured, along with the options in between — a single flat
// ink colour with alpha still costs 116 KB.
//
// The price of flattening is that a file belongs to one cream. Both are emitted;
// they are ~6 KB each, and the component is handed the surface it stands on
// rather than anyone guessing which chapter sits where.

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PALETTE } from "../lib/palette.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "Forest-illustrations", "forest-overlay.jfif");
const OUT_DIR = path.join(ROOT, "public", "brand");
const ART = path.join(ROOT, "lib", "forest-overlay.ts");

/**
 * How strongly the drawing prints on the cream, at its darkest.
 *
 * The chapter's heading and its intro paragraph both sit over this, so the floor
 * below is what really sets it: this script throws if the page's lightest text
 * colour would fall under 4.5:1 on the darkest pixel the tint produces.
 */
const STRENGTH = 0.2;

/**
 * The darkest the drawing's ink may be before it becomes tint.
 *
 * **The floor is set by the single darkest pixel, and this drawing contains pure
 * black.** Without lifting it, one black outline anywhere in the frame drags
 * `STRENGTH` down to 0.11 — the darkest 1% of the ink dictating how strongly the
 * other 99% may print, and a wash too faint to be worth its bytes.
 *
 * Lifting the blacks to 60 costs the outlines a little bite and lets the mass of
 * foliage print at nearly double the strength for the same worst case.
 */
const INK_FLOOR = 60;

/** Encoded widths. Capped at the source's own resolution — never upscale into a file. */
const WIDTHS = [640, 1024];

/** The two creams a chapter can stand on. Each file is baked onto one of them. */
const SURFACES = [
  ["paper", PALETTE.paper],
  ["paperDeep", PALETTE.paperDeep],
];

const hex = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const luminance = ([r, g, b]) => {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

/** Map [0,255] onto [INK_FLOOR,255] — lifts the blacks, leaves the white sky alone. */
const lift = (v) => INK_FLOOR + (v * (255 - INK_FLOOR)) / 255;

const alpha = new Float32Array(W * H);
const ink = new Uint8Array(W * H * 3);
for (let p = 0; p < W * H; p++) {
  const i = p * C;
  const r = lift(data[i]);
  const g = lift(data[i + 1]);
  const b = lift(data[i + 2]);
  alpha[p] = (1 - Math.min(r, g, b) / 255) * STRENGTH;
  ink[p * 3] = Math.round(r);
  ink[p * 3 + 1] = Math.round(g);
  ink[p * 3 + 2] = Math.round(b);
}

/** Flatten onto one cream, and report the darkest pixel it produces. */
const flatten = (creamHex) => {
  const cream = hex(creamHex);
  const out = Buffer.alloc(W * H * 3);
  let darkest = null;
  let lum = 1;
  for (let p = 0; p < W * H; p++) {
    const a = alpha[p];
    const px = [0, 1, 2].map((k) => cream[k] * (1 - a) + ink[p * 3 + k] * a);
    for (let k = 0; k < 3; k++) out[p * 3 + k] = Math.round(px[k]);
    const l = luminance(px);
    if (l < lum) {
      lum = l;
      darkest = px.map(Math.round);
    }
  }
  return { out, darkest };
};

// --- The floor, before anything is written to disk. --------------------------
const FLOOR = 4.5;
const worst = [];
const flattened = {};
for (const [name, creamHex] of SURFACES) {
  const { out, darkest } = flatten(creamHex);
  flattened[name] = out;
  for (const [tName, tHex] of [
    ["text", PALETTE.ink],
    ["dim", PALETTE.dim],
  ]) {
    worst.push({
      surface: name,
      text: tName,
      on: darkest,
      ratio: Number(contrast(hex(tHex), darkest).toFixed(2)),
    });
  }
}

const failed = worst.filter((w) => w.ratio < FLOOR);
if (failed.length) {
  throw new Error(
    `STRENGTH ${STRENGTH} puts type under ${FLOOR}:1 on the darkest part of the drawing:\n` +
      failed
        .map((f) => `  ${f.text} on ${f.surface}: ${f.ratio}:1 over rgb(${f.on.join(",")})`)
        .join("\n") +
      "\nLower STRENGTH, raise INK_FLOOR, or ask for a lighter drawing.",
  );
}

// --- Encode. -----------------------------------------------------------------
await mkdir(OUT_DIR, { recursive: true });
const expected = new Set(
  SURFACES.flatMap(([n]) => WIDTHS.map((w) => `forest-overlay-${n}-${w}.webp`)),
);
for (const f of await readdir(OUT_DIR)) {
  if (f.startsWith("forest-overlay-") && !expected.has(f)) {
    await rm(path.join(OUT_DIR, f));
    console.log(`removed stale ${f}`);
  }
}

let heaviest = 0;
for (const [name] of SURFACES) {
  for (const w of WIDTHS) {
    if (w > W) throw new Error(`asked for ${w}px from a ${W}px source — it would bake softness in`);
    const buf = await sharp(flattened[name], { raw: { width: W, height: H, channels: 3 } })
      .resize(w, null, { fit: "inside" })
      .webp({ quality: 80 })
      .toBuffer();
    await writeFile(path.join(OUT_DIR, `forest-overlay-${name}-${w}.webp`), buf);
    heaviest = Math.max(heaviest, buf.length);
    console.log(`forest-overlay-${name}-${w}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
  }
}

// --- Emit the module. --------------------------------------------------------
const worstRatio = Math.min(...worst.map((w) => w.ratio));
await writeFile(
  ART,
  [
    "// GENERATED by scripts/build_forest_overlay.mjs — do not edit by hand.",
    "//",
    "// The client's forest-and-hornbills drawing, tinted right down and flattened",
    "// onto the cream so it can lie under the type of `03 · The Forest`. Source is",
    "// `Forest-illustrations/forest-overlay.jfif`; the encoded files are",
    "// `public/brand/forest-overlay-{paper,paperDeep}-*.webp`.",
    "//",
    "// **The strength is enforced at build time, not asserted here.** The script",
    "// composites every pixel onto both creams, finds the darkest result, and",
    "// throws if `PALETTE.dim` would fall under 4.5:1 on it. Worst measured case",
    `// at the strength below: **${worstRatio}:1**.`,
    "//",
    "// **Two files, one per cream, because the tint is baked rather than blended.**",
    "// That flattening is what takes it from 282 KB to ~6 KB — see the build script.",
    "//",
    `// **The source is only ${W}px wide** and nothing wider is emitted; upscaling`,
    "// into the file would bake softness in and hide it. The browser therefore",
    "// stretches it on a wide screen, which is tolerable for a near-flat texture",
    "// and would not be for a photograph. Non-negotiable #11 sets 1400px as the",
    "// floor for edge-to-edge imagery; a re-render at 2800px would remove the",
    "// compromise for about 20 KB.",
    "",
    "export const FOREST_OVERLAY = {",
    "  /** Encoded widths. Capped at the source's own resolution. */",
    `  widths: [${WIDTHS.join(", ")}] as const,`,
    "  /** The one `src` a browser without `srcset` support would take. */",
    `  fallback: ${WIDTHS[WIDTHS.length - 1]},`,
    "  /** Intrinsic size of the drawing. */",
    `  width: ${W},`,
    `  height: ${H},`,
    "  /** How strongly its darkest ink prints on the cream. */",
    `  strength: ${STRENGTH},`,
    "  /** Blacks are lifted to this before becoming tint — see the build script. */",
    `  inkFloor: ${INK_FLOOR},`,
    "  /** Worst-case contrast of the page's text colours over the darkest part of it. */",
    `  worstContrast: ${worstRatio},`,
    "} as const;",
    "",
  ].join("\n"),
  "utf8",
);

console.log(
  `\nheaviest file ${(heaviest / 1024).toFixed(1)} KB — strength ${STRENGTH}, ink floor ${INK_FLOOR}`,
);
console.log("worst contrast over the darkest ink:");
for (const w of worst) {
  console.log(`  ${w.text.padEnd(5)} on ${w.surface.padEnd(10)} ${w.ratio}:1  over rgb(${w.on.join(",")})`);
}
console.log("\n-> lib/forest-overlay.ts");
