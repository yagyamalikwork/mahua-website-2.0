// Turn the client's licensed tiger vector into the artwork the page inks in.
//
// Run: node scripts/build_tiger.mjs
//      node scripts/build_tiger.mjs --highlight   (debug render: parts in red)
//
// Source: `Tiger-illustrations/lying-tiger.svg`, supplied by the client on
// 5 Aug 2026 — 162 open, stroked paths on an 800x800 canvas, no fills, no
// embedded raster. Stroked and open is exactly what the effect needs: an open
// path has a length, and `stroke-dashoffset` can walk along it. A filled outline
// could only be faded or wiped.
//
// It replaced three hand-authored attempts of mine, kept as evidence in
// `docs/reviews/2026-08-05-signature/tiger-attempt*.png`. Hand-writing bezier
// coordinates for a quadruped produced outlines that were slightly wrong
// everywhere, which is precisely what reads as cheap.
//
// Four things are derived here rather than assumed:
//
//   1. **The crop.** The artwork sits in the middle of an 800x800 canvas with
//      half of it empty. A viewBox with that much air would size the tiger by its
//      padding, so the box is cut to the ink itself.
//   2. **Coordinate precision.** The export carries six decimal places on a
//      canvas 800 units wide — precision of a ten-thousandth of a pixel, paid for
//      in every byte of the HTML this inlines into.
//   3. **The ink order, from stroke length.** The longest strokes are the ones
//      that define the animal and the shortest are its markings, so drawing
//      longest-first is the order a hand actually works in — and it needs no
//      judgement about which line is which.
//   4. **Which paths are the eyes**, by where they sit once the crop is known.
//      Verified with `--highlight`, because a region guessed from a render is
//      exactly the sort of thing that silently selects nothing.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "Tiger-illustrations", "lying-tiger.svg");
const OUT = path.join(ROOT, "lib", "tiger-art.ts");
const HIGHLIGHT = process.argv.includes("--highlight");

/** Decimal places kept. One is a tenth of a unit on a ~760-unit canvas. */
const DP = 1;

/**
 * Where the eyes sit, as fractions of the cropped box.
 *
 * Only the eyes are treated as moving parts. The tail is not visible in this
 * pose, and the ears are drawn as strokes continuous with the skull — rotating
 * them would pull them away from lines they join, which is the risk of animating
 * borrowed artwork rather than artwork built to come apart. The breath is applied
 * to the whole drawing instead, where it cannot break a join.
 */
const EYE_REGIONS = [
  { x0: 0.618, x1: 0.682, y0: 0.2, y1: 0.315 },
  { x0: 0.712, x1: 0.788, y0: 0.195, y1: 0.315 },
];
/**
 * The longest a stroke may be and still be an eye.
 *
 * One box over both eyes selected twenty-nine paths — the brow markings sit in
 * the same band and are the same sort of short curved stroke. Two tighter boxes
 * plus a length cap is what separates an eye from the stripe above it.
 */
const EYE_MAX_LENGTH = 48;

const svg = await readFile(SRC, "utf8");

// --- 1. Every path, with the weight the artist gave it. --------------------
const raw = [];
for (const m of svg.matchAll(/<path([^>]*?)\sd="([^"]+)"/g)) {
  const width = Number(m[1].match(/stroke-width="([\d.]+)"/)?.[1] ?? 1);
  const nums = m[2].match(/-?\d+(?:\.\d+)?/g)?.map(Number);
  if (!nums || nums.length < 4) continue;
  raw.push({ width, nums, commands: m[2].match(/[MC]/g) ?? [] });
}
if (raw.length < 50) throw new Error(`Expected the artwork's ~162 paths, parsed ${raw.length}.`);

// --- 2. The ink's own bounding box. ----------------------------------------
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const p of raw) {
  for (let i = 0; i < p.nums.length - 1; i += 2) {
    if (p.nums[i] < minX) minX = p.nums[i];
    if (p.nums[i] > maxX) maxX = p.nums[i];
    if (p.nums[i + 1] < minY) minY = p.nums[i + 1];
    if (p.nums[i + 1] > maxY) maxY = p.nums[i + 1];
  }
}
const W = Math.ceil(maxX - minX);
const H = Math.ceil(maxY - minY);

// --- 3. Rewrite each path: translated to the origin, rounded, re-emitted. ---
//
// Only `M` and `C` appear in this artwork (asserted below), and every number in
// either is a coordinate — so the pairs can be shifted without tracking the pen.
const round = (n) => {
  const r = Number(n.toFixed(DP));
  return Number.isInteger(r) ? String(r) : String(r);
};
for (const p of raw) {
  if (p.commands.some((c) => c !== "M" && c !== "C")) {
    throw new Error(`Path uses ${p.commands.join("")}; only M and C can be shifted pair-wise.`);
  }
  const xy = [];
  for (let i = 0; i < p.nums.length - 1; i += 2) {
    xy.push([p.nums[i] - minX, p.nums[i + 1] - minY]);
  }
  // One M, then C in groups of three points.
  let d = `M${round(xy[0][0])} ${round(xy[0][1])}`;
  for (let i = 1; i < xy.length; i += 3) {
    const group = xy.slice(i, i + 3);
    if (group.length < 3) break;
    d += `C${group.map(([x, y]) => `${round(x)} ${round(y)}`).join(" ")}`;
  }
  p.d = d;
  p.points = xy;
  p.length = xy.slice(1).reduce((n, pt, i) => n + Math.hypot(pt[0] - xy[i][0], pt[1] - xy[i][1]), 0);
  p.box = {
    x0: Math.min(...xy.map((q) => q[0])), x1: Math.max(...xy.map((q) => q[0])),
    y0: Math.min(...xy.map((q) => q[1])), y1: Math.max(...xy.map((q) => q[1])),
  };
}

// --- 4. Ink order, longest stroke first. -----------------------------------
//
// **Per stroke, not in waves.** Bucketing 162 strokes into eight waves drew
// twenty at a time with dead air between the groups, which reads as a stutter
// rather than as a hand. Each stroke now gets its own place in the queue and its
// own duration, taken from how long the line actually is.
const byLength = [...raw].sort((a, b) => b.length - a.length);
const longest = byLength[0].length;
byLength.forEach((p, i) => {
  p.ink = i;
  // Normalised against the longest stroke, so the component can scale a duration
  // without knowing anything about this artwork's units.
  p.len = Math.round((p.length / longest) * 1000) / 1000;
});

// --- 5. The eyes. ----------------------------------------------------------
const inRegion = (b, r) =>
  b.x0 >= r.x0 * W && b.x1 <= r.x1 * W && b.y0 >= r.y0 * H && b.y1 <= r.y1 * H;
const eyes = raw.filter((p) => p.length <= EYE_MAX_LENGTH && EYE_REGIONS.some((r) => inRegion(p.box, r)));
for (const e of eyes) {
  e.part = "eye";
  // A part must have finished arriving before it is asked to move.
  // (order is already set; nothing to hold back now that strokes are individual)
}
if (eyes.length === 0) {
  throw new Error(
    `No paths fell inside the eye region — it selects nothing, which would ship a tiger that never blinks ` +
      `while every test passed. Re-run with --highlight and adjust EYE_REGION.`,
  );
}

const eyeBox = eyes.reduce(
  (acc, e) => ({
    x0: Math.min(acc.x0, e.box.x0), x1: Math.max(acc.x1, e.box.x1),
    y0: Math.min(acc.y0, e.box.y0), y1: Math.max(acc.y1, e.box.y1),
  }),
  { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity },
);
const eyeOrigin = {
  x: Number((((eyeBox.x0 + eyeBox.x1) / 2 / W) * 100).toFixed(2)),
  y: Number((((eyeBox.y0 + eyeBox.y1) / 2 / H) * 100).toFixed(2)),
};

if (HIGHLIGHT) {
  const debug =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">` +
    raw.map((p) =>
      `<path d="${p.d}" fill="none" stroke="${p.part === "eye" ? "#D22" : "#31402C"}" ` +
      `stroke-width="${p.part === "eye" ? p.width * 2 : p.width}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ).join("") +
    EYE_REGIONS.map((r) =>
      `<rect x="${r.x0 * W}" y="${r.y0 * H}" width="${(r.x1 - r.x0) * W}" height="${(r.y1 - r.y0) * H}" ` +
      `fill="none" stroke="#D22" stroke-width="2" stroke-dasharray="8 6"/>`,
    ).join("") + `</svg>`;
  const out = path.join(ROOT, "docs/reviews/2026-08-05-signature/tiger-parts-highlight.png");
  await sharp(Buffer.from(debug), { density: 300 }).resize(900).png().flatten({ background: "#F1E9D7" }).toFile(out);
  console.log(`${eyes.length} path(s) selected as eyes -> ${path.relative(ROOT, out)}`);
}

// --- 6. Emit. --------------------------------------------------------------
const entries = raw
  .slice()
  .sort((a, b) => a.ink - b.ink || b.length - a.length)
  .map((p) => `  { d: "${p.d}", w: ${p.width}, ink: ${p.ink}, len: ${p.len}${p.part ? `, part: "${p.part}"` : ""} },`);

const bytes = raw.reduce((n, p) => n + p.d.length, 0);

await writeFile(
  OUT,
  `// GENERATED by scripts/build_tiger.mjs — do not edit by hand.
//
// The client's licensed tiger vector (\`Tiger-illustrations/lying-tiger.svg\`,
// supplied 5 Aug 2026), cropped to its own ink, rounded, and ordered so the
// drawing arrives the way a hand would make it.
//
// **Open, stroked paths are why the effect is possible.** An open path has a
// length, so \`stroke-dashoffset\` can walk along it and the line appears to be
// drawn. A filled outline — which most vector line art is — could only fade or be
// wiped.
//
// \`ink\` is a stroke's **place in the queue**, derived from its length: the
// longest strokes define the animal and the shortest are its markings, so
// longest-first is both the order a hand works in and a rule that needs no
// judgement about which line is which.
//
// \`len\` is that length normalised against the longest stroke, so a component can
// give a long line longer to draw than a short mark without knowing anything
// about this artwork's units.
//
// \`w\` is the artist's own stroke weight, kept. It is what stops the drawing
// reading as a diagram.
//
// **Swap point.** A new drawing means dropping a new SVG over the source and
// re-running the script. Nothing else changes.

export type TigerPart = "eye";

export type TigerPath = {
  /** The \`d\` attribute, cropped to the ink and rounded to ${DP} decimal place. */
  d: string;
  /** The artist's own stroke weight, in viewBox units. */
  w: number;
  /** This stroke's place in the drawing order, 0-based. Longest first. */
  ink: number;
  /** Its length as a fraction of the longest stroke, for a proportional duration. */
  len: number;
  /** Set only on the parts that move; matches a keyframe in \`app/globals.css\`. */
  part?: TigerPart;
};

export const TIGER_VIEWBOX = "0 0 ${W} ${H}";

/** How many strokes the drawing is made of. */
export const TIGER_STROKES = ${raw.length};

/**
 * The centre of the eyes' combined ink, as percentages of the viewBox.
 *
 * The blink squashes **every eye stroke toward this one line**, not each stroke
 * about its own middle. Both eyes sit at nearly the same height, so one shared
 * origin closes them together — where per-path origins would pull the strokes of
 * a single eye apart from each other, which reads as a glitch rather than a lid.
 */
export const TIGER_EYE_ORIGIN = { x: ${eyeOrigin.x}, y: ${eyeOrigin.y} };

export const TIGER_PATHS: readonly TigerPath[] = [
${entries.join("\n")}
];
`,
  "utf8",
);

console.log(
  `${raw.length} paths | viewBox 0 0 ${W} ${H} | ${eyes.length} eye path(s)\n` +
    `path data ${(bytes / 1024).toFixed(1)} KB (was ${(svg.length / 1024).toFixed(1)} KB of SVG)\n` +
    `-> lib/tiger-art.ts`,
);
