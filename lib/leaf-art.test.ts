import { describe, expect, it } from "vitest";
import { LEAF_PATHS, LEAF_VIEWBOX } from "./leaf-art";

/**
 * The leaf that follows the pointer, extracted from the client's own logo by
 * `scripts/build_leaf.mjs`.
 *
 * These hold the extraction to a *well-formed* result. Not one of them can tell
 * you whether the shape reads as a leaf at 24px — that is judged by eye against
 * `docs/reviews/2026-08-05-signature/leaf-24.png`, and if it fails, this file is
 * replaced by hand with a drawn mahua leaf keeping the same two exports. Every
 * assertion below applies just as well to a hand-drawn replacement.
 */
describe("the extracted leaf", () => {
  const [vx, vy, vw, vh] = LEAF_VIEWBOX.trim().split(/\s+/).map(Number);

  it("is framed square", () => {
    // The cursor swings the leaf about its stem. A non-square box would make the
    // mark shear as it rotates, because the two axes would scale differently.
    expect(vw).toBe(vh);
    expect(vw).toBeGreaterThan(0);
  });

  it("fills its own frame", () => {
    // A leaf adrift in a mostly-empty viewBox renders as a speck: the cursor
    // sizes the *box* to 24px, so anything the art does not fill is thrown away.
    //
    // This replaced an assertion that the viewBox was not at the origin, which was
    // over-fitted to the extraction it was written against — the drawn leaf that
    // shipped uses `0 0 100 100` and would have failed it for no reason. What
    // actually matters is coverage, and it is the same question either way: does
    // the drawing use the frame it asks for.
    const nums = LEAF_PATHS.flatMap((p) => p.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number));
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    expect(span / vw).toBeGreaterThan(0.7);
  });

  it("carries a body and at least one vein", () => {
    // A leaf with no veins is a blob. If the vein selection ever collapses, this
    // is what says so — the render still looks like *something*, which is why a
    // count is worth asserting.
    expect(LEAF_PATHS.filter((p) => !p.vein).length).toBeGreaterThanOrEqual(1);
    expect(LEAF_PATHS.filter((p) => p.vein).length).toBeGreaterThanOrEqual(1);
  });

  it("holds real path data, not a placeholder", () => {
    for (const p of LEAF_PATHS) {
      expect(p.d.length).toBeGreaterThan(20);
      expect(p.d).toMatch(/^[Mm]/);
    }
  });

  it("stays small enough to inline", () => {
    // It ships inside a JavaScript chunk, and the whole emblem raster it comes
    // from is 3.2-8.0 KB. A cursor must not cost more than the mark it was cut
    // out of.
    const bytes = LEAF_PATHS.reduce((n, p) => n + p.d.length, 0);
    expect(bytes).toBeLessThan(4000);
  });

  it("sits inside its own viewBox", () => {
    // Every path's first move must land inside the frame. A path outside it is
    // invisible at runtime and visible in no test but this one.
    for (const p of LEAF_PATHS) {
      const [x, y] = p.d.slice(1).split(/[ ,]/).slice(0, 2).map(Number);
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(vx - 1);
      expect(x).toBeLessThanOrEqual(vx + vw + 1);
      expect(y).toBeGreaterThanOrEqual(vy - 1);
      expect(y).toBeLessThanOrEqual(vy + vh + 1);
    }
  });
});
