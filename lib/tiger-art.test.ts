import { describe, expect, it } from "vitest";
import { TIGER_EYE_ORIGIN, TIGER_PATHS, TIGER_VIEWBOX, TIGER_WAVES } from "./tiger-art";

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

  it("uses every wave, contiguously, starting at zero", () => {
    // A gap is a silent pause mid-draw; a missing zero delays the whole thing.
    // Both look like the drawing is broken and neither throws.
    const waves = [...new Set(TIGER_PATHS.map((p) => p.ink))].sort((a, b) => a - b);
    expect(waves[0]).toBe(0);
    expect(waves).toHaveLength(TIGER_WAVES);
    waves.forEach((v, i) => expect(v).toBe(i));
  });

  it("draws its longest strokes first", () => {
    // The order is the whole effect: the lines that define the animal, then its
    // markings. An outline arriving after its own stripes reads as assembly.
    // Length is approximated from the control polygon, exactly as the build does.
    const length = (d: string) => {
      const n = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      let total = 0;
      for (let i = 2; i < n.length - 1; i += 2) total += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
      return total;
    };
    const mean = (wave: number) => {
      const inWave = TIGER_PATHS.filter((p) => p.ink === wave);
      return inWave.reduce((n, p) => n + length(p.d), 0) / inWave.length;
    };
    expect(mean(0)).toBeGreaterThan(mean(TIGER_WAVES - 1) * 3);
  });

  it("has eyes, and they finish arriving before they are asked to move", () => {
    const eyes = TIGER_PATHS.filter((p) => p.part === "eye");
    // Zero would ship a tiger that never blinks while every other test passed —
    // the build throws on it too, because a region that selects nothing is the
    // most likely thing to go wrong when the artwork is replaced.
    expect(eyes.length).toBeGreaterThanOrEqual(2);
    // And they must not still be inking when the blink starts.
    expect(Math.max(...eyes.map((p) => p.ink))).toBeLessThan(TIGER_WAVES - 1);
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
