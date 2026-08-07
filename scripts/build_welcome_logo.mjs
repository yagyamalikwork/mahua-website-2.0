// Split the client's stacked logo into a flower that can turn and a wordmark
// that must not, for the welcome screen.
//
// Run: node scripts/build_welcome_logo.mjs
//
// Source: `Mahua-property-logos/Mahua-Resorts/Mahua-Resorts.png` — the client's
// own artwork, 2084x2084 with **real** transparency (90.3% of the canvas clear,
// corners at alpha 0; checked, because the lantern's PNG claimed an alpha channel
// and had none). The client asked on 8 Aug 2026 for *this* logo on the welcome
// rather than the header's horizontal lockup, with its flower doing the turn.
//
// **They pointed at the `.jpg`; this reads the `.png` beside it.** Same artwork,
// same directory, but a JPEG cannot carry transparency and would put a white
// square on cream. Nothing else differs.
//
// ## Why a horizontal cut is enough
//
// The logo stacks three things with clear paper between them, so the rows that
// contain ink fall into three bands and the gaps are the separators:
//
//     392-1175   the flower
//     1281-1494  MAHUA
//     1613-1690  RESORTS
//
// Band one is the flower; everything below it is the wordmark. **The bands are
// found, not written down** — a redrawn logo with different proportions re-splits
// itself, and one that no longer separates fails loudly here instead of shipping
// a wordmark with half a flower on top of it.
//
// ## What the geometry is for
//
// Both parts are emitted at their own tight crops, and `lib/welcome-logo.ts`
// carries each one's box as a fraction of the whole logo. The component lays them
// back out at exactly those fractions, so the reassembled logo is the client's
// original to the pixel — and only the flower rotates.

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "Mahua-property-logos", "Mahua-Resorts", "Mahua-Resorts.png");
const OUT_DIR = path.join(ROOT, "public", "brand");
const ART = path.join(ROOT, "lib", "welcome-logo.ts");

/** The widths the whole logo is drawn at. Must match `WELCOME_LOGO_WIDTHS` in the component. */
const DRAWN = { phone: 190, wide: 280 };
/** Screen densities to cover. */
const DENSITIES = [1, 2, 3];

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const alphaAt = (x, y) => data[(y * W + x) * C + 3];

// --- Find the bands of ink, and the gaps between them. ----------------------
const INK = 16;
const rowHasInk = [];
for (let y = 0; y < H; y++) {
  let n = 0;
  for (let x = 0; x < W; x++) {
    if (alphaAt(x, y) > INK) {
      n++;
      break;
    }
  }
  rowHasInk.push(n > 0);
}
const bands = [];
let start = null;
for (let y = 0; y <= H; y++) {
  if (y < H && rowHasInk[y] && start === null) start = y;
  else if ((y === H || !rowHasInk[y]) && start !== null) {
    bands.push([start, y - 1]);
    start = null;
  }
}
if (bands.length < 2) {
  throw new Error(
    `found ${bands.length} band(s) of ink — the flower and the wordmark are not separated by clear rows, ` +
      "so this script cannot split them and would ship one as part of the other",
  );
}

/** The tight box of the ink inside a range of rows. */
const boxOf = (y0, y1) => {
  let minX = W;
  let maxX = -1;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < W; x++) {
      if (alphaAt(x, y) <= INK) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  return { left: minX, top: y0, width: maxX - minX + 1, height: y1 - y0 + 1 };
};

const flower = boxOf(bands[0][0], bands[0][1]);
const word = boxOf(bands[1][0], bands.at(-1)[1]);
// The whole logo, as the client drew it — the union, so the reassembly keeps the
// original's spacing rather than a gap somebody chose.
const logo = {
  left: Math.min(flower.left, word.left),
  top: flower.top,
  right: Math.max(flower.left + flower.width, word.left + word.width),
  bottom: word.top + word.height,
};
const logoW = logo.right - logo.left;
const logoH = logo.bottom - logo.top;

// --- Encode. ---------------------------------------------------------------
await mkdir(OUT_DIR, { recursive: true });

const parts = [
  { name: "welcome-flower", box: flower },
  { name: "welcome-wordmark", box: word },
];

const expected = new Set();
for (const { name, box } of parts) {
  const maxDrawn = Math.ceil((DRAWN.wide * box.width) / logoW);
  for (const d of DENSITIES) expected.add(`${name}-${maxDrawn * d}.webp`);
}
for (const f of await readdir(OUT_DIR)) {
  if (/^welcome-(flower|wordmark)-/.test(f) && !expected.has(f)) {
    await rm(path.join(OUT_DIR, f));
    console.log(`removed stale ${f}`);
  }
}

const emitted = {};
for (const { name, box } of parts) {
  const maxDrawn = Math.ceil((DRAWN.wide * box.width) / logoW);
  const widths = DENSITIES.map((d) => maxDrawn * d).filter((w) => w <= box.width);
  if (widths.length === 0) {
    throw new Error(`${name}: even 1x (${maxDrawn}px) is wider than the ${box.width}px of artwork there`);
  }
  for (const w of widths) {
    const buf = await sharp(SRC)
      .extract(box)
      .resize(w, null, { fit: "inside" })
      /*
       * **`alphaQuality` is the expensive dial here, not `quality`.** libwebp
       * moves towards a lossless alpha plane as this approaches 100, and at 92 it
       * nearly doubled both files — the flower encoded at 11.0 KB where 86/80
       * gives ~5 KB of visually identical mark. On a logo that is flat colour on
       * transparency the alpha is a hard edge that survives compression well; it
       * is the *colour* that would show artefacts, and 86 is generous there.
       *
       * This matters because these two files are on the first screen and are
       * charged against the hero — see `docs/DECISIONS.md` §14.
       */
      .webp({ quality: 86, alphaQuality: 80 })
      .toBuffer();
    await writeFile(path.join(OUT_DIR, `${name}-${w}.webp`), buf);
    console.log(`${name}-${w}.webp  ${(buf.length / 1024).toFixed(1)} KB`);
  }
  emitted[name] = { widths, maxDrawn };
}

// --- Emit the module the component reads. ----------------------------------
const f3 = (n) => Number(n.toFixed(4));
const rel = (box) => ({
  x: f3((box.left - logo.left) / logoW),
  y: f3((box.top - logo.top) / logoH),
  w: f3(box.width / logoW),
  h: f3(box.height / logoH),
});

await writeFile(
  ART,
  `// GENERATED by scripts/build_welcome_logo.mjs — do not edit by hand.
//
// The client's stacked logo, split so the flower can turn and the wordmark
// cannot. Source is \`Mahua-property-logos/Mahua-Resorts/Mahua-Resorts.png\`; the
// encoded parts are \`public/brand/welcome-{flower,wordmark}-*.webp\`.
//
// **The fractions are the client's own layout**, measured off the artwork's ink
// rather than chosen, so re-laying the two parts out at these positions
// reproduces the original logo exactly. Redraw the logo, re-run the script, and
// everything below follows it.

export const WELCOME_LOGO = {
  /** The whole logo's intrinsic box, so nothing can disagree about its aspect. */
  width: ${logoW},
  height: ${logoH},
  /** Drawn widths of the whole logo, by breakpoint. The parts scale with it. */
  drawn: { phone: ${DRAWN.phone}, wide: ${DRAWN.wide} },
  /** The part that turns. Position and size as fractions of the logo's box. */
  flower: { ...${JSON.stringify(rel(flower))}, widths: [${emitted["welcome-flower"].widths.join(", ")}] as const },
  /** The part that must not. */
  wordmark: { ...${JSON.stringify(rel(word))}, widths: [${emitted["welcome-wordmark"].widths.join(", ")}] as const },
} as const;
`,
  "utf8",
);

console.log(
  `\n${bands.length} ink bands -> flower ${flower.width}x${flower.height}, wordmark ${word.width}x${word.height}` +
    `\nlogo box ${logoW}x${logoH}\n-> lib/welcome-logo.ts`,
);
