import { describe, expect, it } from "vitest";
import { DURATION } from "./motion";
import { TIGER_EYE_ORIGIN, TIGER_PATHS, TIGER_STROKES, TIGER_VIEWBOX } from "./tiger-art";

/**
 * The ink tiger's artwork, generated from the client's licensed vector by
 * `scripts/build_tiger.mjs`.
 *
 * These hold **any** replacement drawing to what the effect needs, which is the
 * point of a swap point: drop a new SVG over the source, re-run the script, and
 * these say whether the result can still be inked, blinked and afforded.
 *
 * None of them can tell you whether it looks like a tiger. That is
 * `docs/reviews/2026-08-05-signature/supplied-tiger-lying.png` and a pair of eyes.
 */
describe("the ink tiger's artwork", () => {
  const [x, y, w, h] = TIGER_VIEWBOX.trim().split(/\s+/).map(Number);

  it("is cropped to its own ink, and wider than it is tall", () => {
    // The source sits in the middle of an 800x800 canvas with half of it empty.
    // A viewBox carrying that air would size the tiger by its padding.
    expect([x, y]).toEqual([0, 0]);
    // Couchant and in profile: a cat lying down is much wider than it is tall.
    expect(w / h).toBeGreaterThan(1.4);
  });

  it("gives every stroke its own place in the queue, with no gaps", () => {
    // **Per stroke, not in waves.** Eight waves of twenty drew batches with dead
    // air between them, which reads as a stutter rather than as a hand. A gap or
    // a duplicate here would put two strokes on the same instant, which is that
    // defect returning one pair at a time.
    const order = TIGER_PATHS.map((p) => p.ink).sort((a, b) => a - b);
    expect(order).toHaveLength(TIGER_STROKES);
    order.forEach((v, i) => expect(v).toBe(i));
  });

  it("draws its longest strokes first, and gives them longer to draw", () => {
    // The order is the whole effect: the lines that define the animal, then its
    // markings. An outline arriving after its own stripes reads as assembly.
    const byOrder = [...TIGER_PATHS].sort((a, b) => a.ink - b.ink);
    expect(byOrder[0].len).toBe(1);
    expect(byOrder[byOrder.length - 1].len).toBeLessThan(0.2);
    // Monotonic: each stroke is no longer than the one before it.
    for (let i = 1; i < byOrder.length; i++) {
      expect(byOrder[i].len).toBeLessThanOrEqual(byOrder[i - 1].len);
    }
    // And `len` is a real fraction, since the component scales a duration by it.
    for (const p of TIGER_PATHS) {
      expect(p.len).toBeGreaterThan(0);
      expect(p.len).toBeLessThanOrEqual(1);
    }
  });

  it("has eyes at all", () => {
    // Zero would ship a tiger that never blinks while every other test passed —
    // the build throws on it too, because a region that selects nothing is the
    // most likely thing to go wrong when the artwork is replaced.
    expect(TIGER_PATHS.filter((p) => p.part === "eye").length).toBeGreaterThanOrEqual(2);
  });

  it("finishes every stroke before the living phase is allowed to begin", () => {
    // `InkTiger` writes `--ink-total` and `app/globals.css` holds the breath and
    // the blink back by it. If any stroke were still arriving after that, a part
    // would start moving while it was being drawn — which looks like a glitch and
    // which no browser check would attribute to the arithmetic here.
    const inkTotal = (TIGER_STROKES - 1) * DURATION.tigerInkStagger + DURATION.tigerInk;
    const duration = (len: number) =>
      DURATION.tigerInkFloor + (DURATION.tigerInk - DURATION.tigerInkFloor) * len;

    for (const p of TIGER_PATHS) {
      const finishes = p.ink * DURATION.tigerInkStagger + duration(p.len);
      expect(finishes, `stroke ${p.ink} still drawing at ${finishes.toFixed(2)}s`).toBeLessThanOrEqual(
        inkTotal + 0.001,
      );
    }
  });

  it("blinks about a point on the eyes themselves", () => {
    // Both eyes squash toward one shared line. If this drifted to the middle of
    // the drawing the blink would squash the whole animal, which is a thing no
    // unit test would notice and one glance would.
    const eyes = TIGER_PATHS.filter((p) => p.part === "eye");
    const xs = eyes.flatMap((p) => p.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number).filter((_, i) => i % 2 === 0));
    const ys = eyes.flatMap((p) => p.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number).filter((_, i) => i % 2 === 1));
    expect(TIGER_EYE_ORIGIN.x).toBeGreaterThanOrEqual((Math.min(...xs) / w) * 100);
    expect(TIGER_EYE_ORIGIN.x).toBeLessThanOrEqual((Math.max(...xs) / w) * 100);
    expect(TIGER_EYE_ORIGIN.y).toBeGreaterThanOrEqual((Math.min(...ys) / h) * 100);
    expect(TIGER_EYE_ORIGIN.y).toBeLessThanOrEqual((Math.max(...ys) / h) * 100);
  });

  it("keeps the artist's own stroke weights", () => {
    // One uniform weight reads as a diagram. The supplied drawing varies from 2
    // to 13, and that variation is most of why it looks hand-made.
    const weights = new Set(TIGER_PATHS.map((p) => p.w));
    expect(weights.size).toBeGreaterThan(2);
    for (const p of TIGER_PATHS) expect(p.w).toBeGreaterThan(0);
  });

  it("holds real path data, all of it inside the frame", () => {
    for (const p of TIGER_PATHS) {
      expect(p.d).toMatch(/^M/);
      expect(p.d.length).toBeGreaterThan(12);
      const nums = p.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(-1);
      expect(Math.max(...xs)).toBeLessThanOrEqual(w + 1);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(-1);
      expect(Math.max(...ys)).toBeLessThanOrEqual(h + 1);
    }
  });

  it("is one continuous stroke per path", () => {
    // A path that lifts the pen inks as two strokes appearing at once, which
    // reads as a slide rather than as a hand drawing. It is also what makes
    // `pathLength="1"` mean one thing rather than several.
    for (const p of TIGER_PATHS) {
      expect(p.d.slice(1).match(/M/g) ?? []).toHaveLength(0);
    }
  });

  it("stays small enough to inline in the document", () => {
    // It ships inside the HTML, so it lands in the initial transfer. The source
    // was 56.6 KB of SVG; cropping and rounding brought the path data to ~17 KB,
    // which compresses to a few.
    const bytes = TIGER_PATHS.reduce((n, p) => n + p.d.length, 0);
    expect(bytes).toBeLessThan(24_000);
  });
});
