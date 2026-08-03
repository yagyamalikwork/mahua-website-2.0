import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb } from "./contrast";
import { PALETTE } from "./palette";

const HEX = /^#[0-9A-F]{6}$/;

describe("PALETTE", () => {
  it("uses uppercase 6-digit hex for every token", () => {
    for (const [name, value] of Object.entries(PALETTE)) {
      expect(value, name).toMatch(HEX);
    }
  });

  it("stays warm — red is never below blue", () => {
    // The client's standing constraint. A cold value anywhere drains the warmth
    // the whole brand rests on.
    for (const [name, value] of Object.entries(PALETTE)) {
      const [r, , b] = hexToRgb(value);
      expect(r, `${name} (${value}) is cold`).toBeGreaterThanOrEqual(b);
    }
  });

  it("clears 4.5:1 for body text and links on both paper surfaces", () => {
    for (const surface of [PALETTE.paper, PALETTE.paperDeep]) {
      expect(contrastRatio(PALETTE.ink, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(PALETTE.goldText, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("clears 4.5:1 for dim secondary text on the base paper", () => {
    expect(contrastRatio(PALETTE.dim, PALETTE.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps gold decorative — it is not required to pass as text", () => {
    // `gold` is for rules, ornaments and the emblem. `goldText` is the legible
    // sibling. Asserting gold passes would be wrong; asserting the pair differ
    // stops someone collapsing them later.
    expect(PALETTE.gold).not.toBe(PALETTE.goldText);
  });
});
