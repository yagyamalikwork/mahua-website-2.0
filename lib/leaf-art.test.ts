import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LEAF } from "./leaf-art";
import { CURSOR } from "./motion";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The client's hand-drawn leaf, as worn by the cursor.
 *
 * These hold any replacement artwork to the guarantees the cursor depends on.
 * None of them can tell you whether the drawing is *good* — that is judged by
 * eye against `docs/reviews/2026-08-05-signature/supplied-leaf-{cream,dark}.png`,
 * which show it at 28, 56 and 84px on both surfaces the page has.
 */
describe("the leaf the cursor wears", () => {
  it("ships every width it advertises", () => {
    // A width in `srcset` with no file behind it is a broken image at exactly one
    // screen density — invisible on the machine of whoever last touched it.
    for (const w of LEAF.widths) {
      const file = path.join(ROOT, "public", "brand", `leaf-${w}.webp`);
      expect(() => statSync(file), `public/brand/leaf-${w}.webp is missing`).not.toThrow();
      expect(statSync(file).size).toBeGreaterThan(200);
    }
  });

  it("carries enough resolution for a 2x screen", () => {
    // The cursor is gated on a fine pointer, so 3x phones never see it, but a
    // retina laptop is the common case and drawing 28px from a 28px file would
    // be visibly soft. This is the same failure that shipped a blurred hero in
    // August — a `sizes`/resolution mismatch that no test could see.
    expect(Math.max(...LEAF.widths)).toBeGreaterThanOrEqual(CURSOR.sizePx * 2);
  });

  it("puts the pointer on the leaf's tip, not in the middle of it", () => {
    // The component positions the image by its own box and offsets by this
    // fraction, so the hotspot *is* the anchor. A hotspot near the centre would
    // hang the leaf's whole body over whatever is being pointed at, and every
    // follow-accuracy check in the browser rig would still pass while measuring
    // the wrong point.
    expect(LEAF.hotspot.x).toBeLessThan(0.25);
    expect(LEAF.hotspot.y).toBeLessThan(0.25);
  });

  it("keeps a portrait aspect, so the leaf hangs rather than lies down", () => {
    expect(LEAF.height).toBeGreaterThan(LEAF.width);
    // And a plausible one. A leaf far longer than it is wide is the blade of
    // grass an earlier attempt at this shipped.
    expect(LEAF.width / LEAF.height).toBeGreaterThan(0.5);
  });

  it("stays light enough to be free", () => {
    // It counts against the initial page transfer, not the JavaScript budget,
    // and there is room — but a cursor has no business being heavier than the
    // brand emblem in the header, which is 3.2-8.0 KB.
    for (const w of LEAF.widths) {
      const file = path.join(ROOT, "public", "brand", `leaf-${w}.webp`);
      expect(statSync(file).size).toBeLessThan(12_000);
    }
  });
});
