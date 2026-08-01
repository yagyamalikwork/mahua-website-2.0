import { describe, expect, it } from "vitest";
import { DURATION, EASE, PARALLAX_MAX, REVEAL_FROM } from "./motion";

describe("the motion laws (spec section 4.3)", () => {
  it("keeps reveals between 800ms and 1400ms", () => {
    expect(DURATION.reveal).toBeGreaterThanOrEqual(0.8);
    expect(DURATION.reveal).toBeLessThanOrEqual(1.4);
    expect(DURATION.revealSlow).toBeGreaterThanOrEqual(0.8);
    expect(DURATION.revealSlow).toBeLessThanOrEqual(1.4);
  });

  it("caps parallax at 15%", () => {
    expect(PARALLAX_MAX).toBeLessThanOrEqual(0.15);
  });

  it("reveals things by developing them, not sliding them", () => {
    expect(REVEAL_FROM.scale).toBeGreaterThanOrEqual(0.94);
    expect(REVEAL_FROM.scale).toBeLessThan(1);
    expect(REVEAL_FROM).not.toHaveProperty("x");
    expect(REVEAL_FROM).not.toHaveProperty("y");
  });

  it("turns the logo slowly enough to be almost imperceptible", () => {
    expect(DURATION.logoRotation).toBeGreaterThanOrEqual(60);
  });

  it("nothing bounces", () => {
    const banned = /(elastic|bounce|back)/i;
    for (const [name, ease] of Object.entries(EASE)) {
      expect(banned.test(ease), `EASE.${name} = "${ease}" overshoots`).toBe(false);
    }
  });
});
