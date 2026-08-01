import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb, relativeLuminance } from "./contrast";
import { LIGHT_STATES, lightState } from "./palette";

const HEX = /^#[0-9A-F]{6}$/;

describe("LIGHT_STATES", () => {
  it("has exactly seven states in narrative order, dawn to night", () => {
    expect(LIGHT_STATES).toHaveLength(7);
    expect(LIGHT_STATES.map((s) => s.id)).toEqual([
      "dawn", "firstLight", "midMorning", "afternoon", "lateAfternoon", "dusk", "night",
    ]);
  });

  it("uses uppercase 6-digit hex everywhere", () => {
    for (const s of LIGHT_STATES) {
      for (const key of ["bg", "text", "accent", "accentText"] as const) {
        expect(s[key], `${s.id}.${key}`).toMatch(HEX);
      }
    }
  });

  it("ends where it began", () => {
    expect(lightState("night").bg).toBe(lightState("dawn").bg);
  });
});

describe("accessibility (spec section 11)", () => {
  it("clears 4.5:1 for body text at every state", () => {
    for (const s of LIGHT_STATES) {
      expect(contrastRatio(s.text, s.bg), `${s.id}: text on bg`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("clears 4.5:1 for link text at every state", () => {
    for (const s of LIGHT_STATES) {
      expect(contrastRatio(s.accentText, s.bg), `${s.id}: accentText on bg`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("the page stays warm (spec section 9 — client constraint)", () => {
  it("has no cold background: red channel never below blue", () => {
    for (const s of LIGHT_STATES) {
      const [r, , b] = hexToRgb(s.bg);
      expect(r, `${s.id} bg is cold (#16232B-style blue-black is banned)`).toBeGreaterThanOrEqual(b);
    }
  });

  it("keeps cream as the home key: at least four of seven states are light", () => {
    const light = LIGHT_STATES.filter((s) => relativeLuminance(hexToRgb(s.bg)) > 0.5);
    expect(light.length).toBeGreaterThanOrEqual(4);
  });
});
