import { describe, expect, it } from "vitest";
import { LIGHT_STATES } from "./palette";
import { contrastRatio, hexToRgb } from "./contrast";
import { carriesTextAt } from "@/lib/timeline";
import { backgroundAt, textAt } from "./day-surface";

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

  it("keeps text legible wherever text is actually on screen", () => {
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      if (!carriesTextAt(p)) continue; // crossing bands carry no words
      const ratio = contrastRatio(textAt(p), backgroundAt(p));
      expect(ratio, `progress ${p.toFixed(3)}: ${textAt(p)} on ${backgroundAt(p)}`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it("never falls back to a cold colour, because it never needs to", () => {
    // spec section 9. Plan 1 needed pure black/white through the crossings;
    // moving the crossings into text-free bands removes that need entirely.
    // Strict inequality, not >=: every designed text/accentText colour in
    // LIGHT_STATES is strictly warm (red channel above blue), so >= would
    // silently let an achromatic fallback (#000000 or #FFFFFF, where red
    // equals blue) slip through as "not cold" — which is exactly the colour
    // pair this test exists to catch.
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      if (!carriesTextAt(p)) continue;
      const [r, , b] = hexToRgb(textAt(p));
      expect(r, `progress ${p.toFixed(3)} used cold text ${textAt(p)}`).toBeGreaterThan(b);
    }
  });
});
