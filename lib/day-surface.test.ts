import { describe, expect, it } from "vitest";
import { LIGHT_STATES } from "./palette";
import { contrastRatio } from "./contrast";
import { backgroundAt, segmentAt, textAt } from "./day-surface";

describe("segmentAt", () => {
  it("starts in the first segment and ends in the last", () => {
    expect(segmentAt(0)).toEqual({ from: 0, to: 1, t: 0 });
    expect(segmentAt(1)).toEqual({ from: 5, to: 6, t: 1 });
  });

  it("clamps outside the 0..1 range", () => {
    expect(segmentAt(-5)).toEqual({ from: 0, to: 1, t: 0 });
    expect(segmentAt(99)).toEqual({ from: 5, to: 6, t: 1 });
  });

  it("sits mid-segment between two states", () => {
    // Six segments between seven states. Deliberately sampled mid-segment, not on a
    // boundary: progress * 6 at an exact boundary is floating-point ambiguous, and
    // Math.floor turns a 1-ulp error into an off-by-one segment.
    const third = segmentAt(2.5 / 6);
    expect(third.from).toBe(2);
    expect(third.to).toBe(3);
    expect(third.t).toBeCloseTo(0.5, 6);
  });
});

describe("backgroundAt", () => {
  it("returns the endpoint colours exactly", () => {
    expect(backgroundAt(0)).toBe(LIGHT_STATES[0].bg);
    expect(backgroundAt(1)).toBe(LIGHT_STATES[6].bg);
  });

  it("blends between neighbouring states", () => {
    const mid = backgroundAt(0.5 / 6); // halfway from dawn to first light
    expect(mid).not.toBe(LIGHT_STATES[0].bg);
    expect(mid).not.toBe(LIGHT_STATES[1].bg);
    expect(mid).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("never produces a cold background while blending", () => {
    // Integer loop counter, not repeated += 0.01. Accumulating 0.01 a hundred
    // times lands on 0.9900000000000007 and exits before ever testing p = 1.
    for (let i = 0; i <= 100; i++) {
      const p = i / 100;
      const hex = backgroundAt(p);
      const r = Number.parseInt(hex.slice(1, 3), 16);
      const b = Number.parseInt(hex.slice(5, 7), 16);
      expect(r, `progress ${p.toFixed(2)} produced cold ${hex}`).toBeGreaterThanOrEqual(b);
    }
  });
});

describe("textAt", () => {
  it("returns the endpoint states' text at the segment boundaries", () => {
    expect(textAt(0)).toBe(LIGHT_STATES[0].text);
    expect(textAt(1)).toBe(LIGHT_STATES[6].text);
  });

  it("keeps text legible against the blended background at every scroll position", () => {
    // The background blends continuously while text is chosen per-position.
    // Testing the seven endpoints alone misses the light/dark crossings entirely,
    // which is how a 1.85:1 stretch shipped: both halves were individually correct.
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const ratio = contrastRatio(textAt(p), backgroundAt(p));
      expect(ratio, `progress ${p.toFixed(3)}: ${textAt(p)} on ${backgroundAt(p)}`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });
});
