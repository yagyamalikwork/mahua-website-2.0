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
const SRC = path.join(ROOT, "Forest-illustrations", "forest-overlay-2.png");
const OUT_DIR = path.join(ROOT, "public", "brand");
const ART = path.join(ROOT, "lib", "forest-overlay.ts");

/**
 * The darkest the drawing's ink may be before it becomes tint — **the one dial**.
 *
 * The strength is not set here. It is solved for, below, as the strongest tint
 * that still clears the contrast floor, so the only thing left to choose is how
 * much of the drawing's own range to keep. That matters because the floor is set
 * by the *single darkest pixel* and this drawing contains pure black: one black
 * outline anywhere in the frame otherwise dictates how strongly the other 99% of
 * it may print.
 *
 * Measured, at a constant worst-case contrast of 4.55:1 on the deeper cream:
 *
 * | ink floor | solved strength | mean ink laid down |
 * |---|---|---|
 * | 60 | 0.201 | 0.085 |
 * | 120 | 0.458 | 0.134 |
 * | **160** | **1.060** | **0.218** |
 *
 * So lifting the blacks from 60 to 160 makes the drawing **2.6x more present for
 * exactly the same worst case**. It shipped at 60 on 10 Aug and the client's
 * verdict was "it is almost not visible" — which was the arithmetic's fault, not
 * the drawing's. Past ~160 the outlines lose their bite and it starts to read as
 * fog rather than as a drawing; 120 keeps more line and less presence, if this is
 * ever judged too heavy.
 */
const INK_FLOOR = 20;

/**
 * The worst contrast the tint may leave for `PALETTE.dim`, the page's lighter
 * body colour. A hair above the 4.5 the guidelines require, so that rounding in
 * the encoder cannot take it under.
 */
const FLOOR = 4.55;

/** Encoded widths. Capped at the source's own resolution — never upscale into a file. */
/**
 * Encoded widths, capped at the source's own resolution.
 *
 * **1600 is the top, not 2400**, even though the 2752px source could carry it.
 * This is a near-flat texture: a 1920 screen drawing the 1600 file upscales it
 * 1.2x, which is invisible here and would not be on a photograph. The 2400 file
 * cost 149 KB against 1600's 92 for no difference anyone can see, on a
 * decoration several screens below the fold.
 */
const WIDTHS = [640, 1024, 1600];

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

/**
 * **Does this artwork suit the job?** Reported, not assumed, because the answer
 * decided the whole design once already.
 *
 * A tint under type is capped by the contrast floor: on the deeper cream the
 * darkest any pixel may be is about rgb(205,198,184). Everything gets compressed
 * into that narrow band — so a **dense** drawing arrives as flat mush and a
 * **sparse** one arrives as clean line work, at the same average luminance. What
 * the eye reads here is line contrast, not area fill.
 *
 * The first drawing was 75% inked and the client's verdict was that it was almost
 * not visible; raising the strength dial from 160 to 190 moved the average inked
 * pixel from luma 221.4 to 221.7, which is nothing. It was never a tuning
 * problem. The brief for a replacement is in `docs/DECISIONS.md` §15.
 */
const COVERAGE_CEILING = 0.45;
let inked = 0;
for (let p = 0; p < W * H; p++) {
  const i = p * C;
  if (Math.min(data[i], data[i + 1], data[i + 2]) < 246) inked++;
}
const coverage = inked / (W * H);
console.log(`source ${W}x${H}, ${(100 * coverage).toFixed(1)}% inked`);
if (coverage > COVERAGE_CEILING) {
  console.warn(
    `  WARNING: ${(100 * coverage).toFixed(1)}% ink coverage, over the ${(100 * COVERAGE_CEILING).toFixed(0)}% ` +
      "this reads well at. A dense drawing squeezed into the contrast floor's narrow band arrives as mush " +
      "however the dials are set — see the note above.",
  );
}
if (W < 2400) {
  console.warn(
    `  WARNING: ${W}px wide. The section spans the viewport, so anything under ~2400 is stretched on a ` +
      "large screen, and non-negotiable #11 sets 1400 as the floor for edge-to-edge imagery.",
  );
}

/** Map [0,255] onto [INK_FLOOR,255] — lifts the blacks, leaves the white sky alone. */
const lift = (v) => INK_FLOOR + (v * (255 - INK_FLOOR)) / 255;

/**
 * **The drawing is solved in two segments, and both keep the same guarantee.**
 *
 * The second artwork (10 Aug) separates cleanly: pale outline foliage, and the
 * three hornbills as the only solid darks — 11.9% of the frame against 35.6% in
 * the first. That separation is what makes this worth doing.
 *
 * A single strength is capped by the darkest pixel anywhere, so the birds were
 * holding the whole drawing to 0.135 and the foliage came out a whisper. Solving
 * each segment against the *same* 4.55:1 floor lets each take the most it can
 * carry: the birds land at the floor, which is where they should be, and the
 * pale foliage — which starts far lighter — gets a much larger multiplier before
 * it reaches the same limit.
 *
 * **Nothing is relaxed.** Both targets are the body-copy floor, so every pixel of
 * the result still clears it, and the final assertion below still measures the
 * whole image. This is not the earlier attempt that gave the birds a lower bar
 * and was rightly rejected at 2.1:1.
 */
const BIRD_MAX = 70;
const isBird = new Uint8Array(W * H);
let birdPixels = 0;

/** The lifted drawing, and each pixel's ink fraction — 0 for the sky, 1 for black. */
/** The lifted drawing, and each pixel's ink fraction — 0 for the sky, 1 for the darkest foliage. */
const inkFraction = new Float32Array(W * H);
const ink = new Uint8Array(W * H * 3);
for (let p = 0; p < W * H; p++) {
  const i = p * C;
  const r = lift(data[i]);
  const g = lift(data[i + 1]);
  const b = lift(data[i + 2]);
  inkFraction[p] = 1 - Math.min(r, g, b) / 255;
  if (Math.min(data[i], data[i + 1], data[i + 2]) < BIRD_MAX) {
    isBird[p] = 1;
    birdPixels++;
  }
  ink[p * 3] = Math.round(r);
  ink[p * 3 + 1] = Math.round(g);
  ink[p * 3 + 2] = Math.round(b);
}
if (birdPixels === 0) {
  throw new Error(
    `nothing in the source is darker than ${BIRD_MAX} — this artwork has no solid darks, so there is no ` +
      "second segment and the birds cannot be the accent the client asked for",
  );
}

/**
 * The worst contrast this strength would leave, on the darker of the two creams.
 *
 * `paperDeep` is always the binding surface — it is the darker ground, so the
 * same ink lands closer to the text on it. Solving against it covers both.
 */
const worstAt = (strength, birds) => {
  const cream = hex(PALETTE.paperDeep);
  let lo = 1;
  let darkest = null;
  for (let p = 0; p < W * H; p++) {
    if (Boolean(isBird[p]) !== birds) continue;
    // **Clamped.** `inkFraction` can be ~1 and the solved strength can exceed 1,
    // so the product must be capped or the composite goes negative — which fed
    // `luminance` nonsense and had the solver reporting -32:1 over
    // rgb(-181,-174,-157). It never bit while the blacks were lifted high enough
    // to keep every strength under 1; the second drawing, with its own range
    // preserved, walked straight into it.
    const a = Math.min(1, inkFraction[p] * strength);
    // `Math.round`, because that is what `flatten` writes into the file. Solving
    // against the un-rounded float and asserting against the rounded byte is two
    // instruments measuring different things, and they duly disagreed by 0.01 —
    // the solver returning a strength the final check then rejected.
    const px = [0, 1, 2].map((k) => Math.round(cream[k] * (1 - a) + ink[p * 3 + k] * a));
    const l = luminance(px);
    if (l < lo) {
      lo = l;
      darkest = px;
    }
  }
  return contrast(hex(PALETTE.dim), darkest);
};

/**
 * **The strength is solved, not chosen.** Binary search for the strongest tint
 * that still clears `FLOOR`, so the contrast guarantee is exact rather than
 * hand-tuned and the only thing anyone has to decide is `INK_FLOOR`.
 *
 * Hand-tuning is what left this at 0.2 when 1.06 was available at the same worst
 * case, and the client saw a drawing that was "almost not visible".
 */
const solve = (birds) => {
  let lo = 0.005;
  let hi = 8;
  if (worstAt(lo, birds) < FLOOR) {
    throw new Error(
      `even the faintest tint leaves ${worstAt(lo, birds).toFixed(2)}:1 over the ` +
        `${birds ? "birds" : "foliage"} — it cannot go under type at all`,
    );
  }
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (worstAt(mid, birds) >= FLOOR) lo = mid;
    else hi = mid;
  }
  // Rounded **down**, never to nearest: rounding up hands back a strength
  // fractionally stronger than the one proved to clear the floor.
  return Math.floor(lo * 1000) / 1000;
};

const STRENGTH = solve(false);
const STRENGTH_BIRDS = solve(true);

const alpha = new Float32Array(W * H);
for (let p = 0; p < W * H; p++) {
  alpha[p] = inkFraction[p] * (isBird[p] ? STRENGTH_BIRDS : STRENGTH);
}

/** Flatten onto one cream, and report the darkest pixel it produces. */
const flatten = (creamHex) => {
  const cream = hex(creamHex);
  const out = Buffer.alloc(W * H * 3);
  let darkest = null;
  let lum = 1;
  for (let p = 0; p < W * H; p++) {
    const a = Math.min(1, alpha[p]);
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
  `\nheaviest file ${(heaviest / 1024).toFixed(1)} KB — foliage ${STRENGTH}, birds ${STRENGTH_BIRDS} (${((100 * birdPixels) / (W * H)).toFixed(1)}% of the frame), ink floor ${INK_FLOOR}`,
);
console.log("worst contrast over the darkest ink:");
for (const w of worst) {
  console.log(`  ${w.text.padEnd(5)} on ${w.surface.padEnd(10)} ${w.ratio}:1  over rgb(${w.on.join(",")})`);
}
console.log("\n-> lib/forest-overlay.ts");
