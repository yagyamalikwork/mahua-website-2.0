// Encode the client's watercolour lantern for the one that hangs into
// `06 · The Lantern Hour`.
//
// Run: node scripts/build_lantern.mjs
//
// Source: `reference/client-art/hanging-lantern.png`, supplied 7 Aug 2026 — a
// 2048x2048 PNG.
//
// **Its alpha channel is a lie and that is why this script exists.** The file has
// four channels, so every tool reports it as having transparency; every pixel in
// it is fully opaque and the corners are pure white. Dropping it on the page
// as-is would put a white square on cream. `lib/media.ts` never sees it — it is
// brand art, not a photograph — so nothing else in the pipeline would have
// caught that either.
//
// Three things this derives rather than assumes:
//
//   1. **The cut-out**, by flood fill *from the edges* rather than by a global
//      "white is transparent" threshold. The lantern has white highlights on its
//      glass and inside the ring at the top of the chain; a global threshold
//      punches holes through them. Only white connected to the border is
//      background.
//   2. **The pivot** — the top of the chain, found as the centre of ink in the
//      topmost inked row. A pendulum rotates about where it is hung from, and
//      hard-coding that would drift silently the moment the artwork is redrawn.
//      Exactly the reasoning behind the leaf's hotspot in `build_leaf.mjs`.
//   3. **The trim**, so the drawn art is flush to its box: the source is 62%
//      artwork and 38% white margin, and a component that positions the box would
//      otherwise be positioning mostly empty space.
//
// The alternative considered and rejected: `mix-blend-mode: darken`, which is how
// the two films' white backgrounds are erased (`docs/DECISIONS.md` §9). It works
// on white, but 9% of this artwork's own pixels are brighter than the cream in
// some channel and almost all of them are the flame. `darken` would have clamped
// exactly the part of the picture the lantern exists for. Measured, not guessed.

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "reference", "client-art", "hanging-lantern.png");
const OUT_DIR = path.join(ROOT, "public", "brand");
const ART = path.join(ROOT, "lib", "lantern-art.ts");

/**
 * The widest the lantern is ever drawn, in CSS pixels, and the densities to cover.
 *
 * Paired with a `sizes` attribute rather than `x` descriptors — unlike the leaf,
 * this one *does* change size with the breakpoint, which is the exact condition
 * `sizes` exists for. `lib/sizes.test.ts` checks the expression round-trips.
 */
const WIDTHS = [200, 320, 440, 640];

/** Background if every channel is at least this bright. Anti-aliased edges are darker and survive. */
const WHITE = 244;
/** Nearly-white ink touching cleared ground keeps partial alpha, so the watercolour edge stays soft. */
const FEATHER = 232;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h, channels: c } = info;
if (c !== 4) throw new Error(`expected RGBA, got ${c} channels`);

// --- Cut the background, from the edges inward. -----------------------------
const cleared = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) stack.push(x, x + (h - 1) * w);
for (let y = 0; y < h; y++) stack.push(y * w, w - 1 + y * w);

let clearedCount = 0;
while (stack.length) {
  const p = stack.pop();
  if (cleared[p]) continue;
  const i = p * c;
  if (data[i] < WHITE || data[i + 1] < WHITE || data[i + 2] < WHITE) continue;
  cleared[p] = 1;
  data[i + 3] = 0;
  clearedCount++;
  const x = p % w;
  const y = (p - x) / w;
  if (x > 0) stack.push(p - 1);
  if (x < w - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - w);
  if (y < h - 1) stack.push(p + w);
}
if (clearedCount < w * h * 0.2) {
  throw new Error(
    `only ${((100 * clearedCount) / (w * h)).toFixed(1)}% of the canvas was cleared — the source is not ` +
      "a drawing on a white ground any more, and this script would ship a white box",
  );
}

let feathered = 0;
for (let p = 0; p < w * h; p++) {
  if (cleared[p]) continue;
  const i = p * c;
  const min = Math.min(data[i], data[i + 1], data[i + 2]);
  if (min <= FEATHER) continue;
  const x = p % w;
  const y = (p - x) / w;
  const touchesGround =
    (x > 0 && cleared[p - 1]) ||
    (x < w - 1 && cleared[p + 1]) ||
    (y > 0 && cleared[p - w]) ||
    (y < h - 1 && cleared[p + w]);
  if (!touchesGround) continue;
  data[i + 3] = Math.round(255 * (1 - (min - FEATHER) / (255 - FEATHER)));
  feathered++;
}

// --- Trim to what is actually drawn. ----------------------------------------
let minX = w;
let minY = h;
let maxX = 0;
let maxY = 0;
for (let p = 0; p < w * h; p++) {
  if (data[p * c + 3] <= 8) continue;
  const x = p % w;
  const y = (p - x) / w;
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
}
const artW = maxX - minX + 1;
const artH = maxY - minY + 1;

// --- The pivot: the top of the chain, from the artwork's own ink. -----------
let pivot = null;
for (let y = minY; y <= maxY && !pivot; y++) {
  const xs = [];
  for (let x = minX; x <= maxX; x++) {
    if (data[(y * w + x) * c + 3] > 40) xs.push(x);
  }
  // Two pixels, so a stray speck cannot be mistaken for the chain.
  if (xs.length >= 2) {
    pivot = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2 - minX,
      y: y - minY,
    };
  }
}
if (!pivot) throw new Error("found no ink at the top of the lantern — is the source still a lantern?");

const cut = sharp(data, { raw: { width: w, height: h, channels: c } }).extract({
  left: minX,
  top: minY,
  width: artW,
  height: artH,
});

// --- Encode. ---------------------------------------------------------------
await mkdir(OUT_DIR, { recursive: true });

// Clear stale sizes first, so a changed WIDTHS cannot leave old files on disk
// looking current — the trap `build_images.mjs` and `build_brand.mjs` both grew
// a cleanup pass for.
const expected = new Set(WIDTHS.map((n) => `lantern-${n}.webp`));
for (const f of await readdir(OUT_DIR)) {
  if (f.startsWith("lantern-") && !expected.has(f)) {
    await rm(path.join(OUT_DIR, f));
    console.log(`removed stale ${f}`);
  }
}

for (const n of WIDTHS) {
  if (n > artW) {
    throw new Error(
      `asked for a ${n}px lantern from ${artW}px of drawn artwork — it would be upscaled and ship soft`,
    );
  }
  const buf = await cut
    .clone()
    .resize(n, null, { fit: "inside" })
    .webp({ quality: 86, alphaQuality: 90 })
    .toBuffer();
  await writeFile(path.join(OUT_DIR, `lantern-${n}.webp`), buf);
  console.log(`lantern-${n}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
}

// --- Emit the module the component reads. ----------------------------------
const round = (n) => Math.round(n * 1000) / 1000;
await writeFile(
  ART,
  `// GENERATED by scripts/build_lantern.mjs — do not edit by hand.
//
// The client's watercolour lantern, as hung under \`after-dark\` into
// \`06 · The Lantern Hour\`. Source artwork is
// \`reference/client-art/hanging-lantern.png\`; the encoded files are
// \`public/brand/lantern-*.webp\`.
//
// **This is the swap point.** A new drawing means dropping a new PNG over the
// source and re-running the script. Nothing else changes: the component reads
// only what is below, and \`lib/lantern-art.test.ts\` holds any replacement to the
// same guarantees — including that the source still needs its white ground cut,
// which is the thing about this artwork that no other check would notice.

export const LANTERN = {
  /** Encoded widths, in CSS pixels of drawn width. Paired with a \`sizes\` expression. */
  widths: [${WIDTHS.join(", ")}] as const,
  /** The one \`src\` a browser without \`srcset\` support would take. */
  fallback: ${WIDTHS[1]},
  /** Intrinsic size of the trimmed artwork, so nothing can disagree about its aspect. */
  width: ${artW},
  height: ${artH},
  /**
   * The top of the chain, as a fraction of the drawn box — the point the lantern
   * hangs from and therefore the point it swings about. Measured from the
   * artwork's own ink, not chosen. A pendulum pivoting anywhere else reads as a
   * picture being rotated rather than as an object hanging.
   */
  pivot: { x: ${round(pivot.x / artW)}, y: ${round(pivot.y / artH)} },
} as const;
`,
  "utf8",
);

console.log(
  `\ncleared ${((100 * clearedCount) / (w * h)).toFixed(1)}% of the canvas, feathered ${feathered} edge pixels` +
    `\ntrimmed ${w}x${h} -> ${artW}x${artH}, pivot ${round(pivot.x / artW)}, ${round(pivot.y / artH)}` +
    `\n-> lib/lantern-art.ts`,
);
