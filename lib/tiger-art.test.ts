import { describe, expect, it } from "vitest";
import { TIGER_PATHS, TIGER_VIEWBOX, type TigerPart } from "./tiger-art";

/**
 * The ink tiger's artwork.
 *
 * These hold it to being *well-formed*. **Not one of them can tell you whether it
 * looks like a tiger** — that is judged by eye against
 * `docs/reviews/2026-08-05-signature/tiger.png`, and by the client before it
 * ships. If the drawing is rejected only this file changes; the inking, the
 * placement and the fail-safes never see the geometry.
 */
describe("the ink tiger's artwork", () => {
  const [x, y, w, h] = TIGER_VIEWBOX.trim().split(/\s+/).map(Number);

  it("is a wide frame starting at the origin", () => {
    expect([x, y]).toEqual([0, 0]);
    // Couchant and in profile: a cat lying down is much wider than it is tall.
    expect(w).toBeGreaterThan(h);
  });

  it("inks in a contiguous order starting at zero", () => {
    // A gap leaves a silent pause mid-draw and a missing zero delays the whole
    // thing. Both look like the drawing is broken, and neither throws.
    const orders = [...new Set(TIGER_PATHS.map((p) => p.ink))].sort((a, b) => a - b);
    expect(orders[0]).toBe(0);
    orders.forEach((o, i) => expect(o).toBe(i));
  });

  it("draws the back line first and the stripes last", () => {
    // The order is the whole effect. An outline that appears after its own
    // markings reads as assembly rather than as drawing.
    expect(TIGER_PATHS.filter((p) => p.ink === 0)).toHaveLength(1);
    const last = Math.max(...TIGER_PATHS.map((p) => p.ink));
    const stripes = TIGER_PATHS.filter((p) => p.ink === last);
    expect(stripes.length).toBeGreaterThan(4);
    // Nothing that moves may be in the final wave: the living animations start
    // when the ink finishes, and a part still arriving would jump.
    expect(stripes.every((p) => !p.part)).toBe(true);
  });

  it("names every moving part exactly once", () => {
    // One eye, because this is a profile. Two ears, because the far one shows
    // behind the near one and turning both together is what reads as listening.
    const parts: TigerPart[] = ["chest", "tail", "ear-near", "ear-far", "eye"];
    for (const part of parts) {
      expect(TIGER_PATHS.filter((p) => p.part === part), `part "${part}"`).toHaveLength(1);
    }
    // And nothing else claims to be a part, which would animate silently.
    const named = TIGER_PATHS.filter((p) => p.part).map((p) => p.part);
    expect(new Set(named).size).toBe(parts.length);
  });

  it("holds real path data, all of it inside the frame", () => {
    for (const p of TIGER_PATHS) {
      expect(p.d.length).toBeGreaterThan(20);
      expect(p.d).toMatch(/^M/);
      const nums = p.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      // A path outside the viewBox is invisible at runtime and visible in no
      // other test.
      expect(Math.min(...xs), `${p.d.slice(0, 24)}… runs off the left`).toBeGreaterThanOrEqual(-2);
      expect(Math.max(...xs), `${p.d.slice(0, 24)}… runs off the right`).toBeLessThanOrEqual(w + 2);
      expect(Math.min(...ys), `${p.d.slice(0, 24)}… runs off the top`).toBeGreaterThanOrEqual(-2);
      expect(Math.max(...ys), `${p.d.slice(0, 24)}… runs off the bottom`).toBeLessThanOrEqual(h + 2);
    }
  });

  it("is one continuous stroke per path", () => {
    // A path that jumps mid-string inks as two strokes appearing at once, which
    // reads as a slide rather than as a hand drawing.
    for (const p of TIGER_PATHS) {
      expect(p.d.slice(1).match(/M/g) ?? [], `${p.d.slice(0, 24)}… lifts the pen`).toHaveLength(0);
    }
  });

  it("stays small enough to inline", () => {
    // It ships in the HTML, inside the initial transfer.
    const bytes = TIGER_PATHS.reduce((n, p) => n + p.d.length, 0);
    expect(bytes).toBeLessThan(12_000);
    expect(TIGER_PATHS.length).toBeGreaterThanOrEqual(20);
    expect(TIGER_PATHS.length).toBeLessThanOrEqual(50);
  });
});
