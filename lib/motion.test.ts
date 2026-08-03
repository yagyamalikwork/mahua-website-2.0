import { describe, expect, it } from "vitest";
import {
  DURATION,
  EASE,
  IMAGE_FROM,
  PARALLAX_MAX,
  REVEAL_FROM,
  STICKY_SCREENS_MAX,
} from "./motion";

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

  it("keeps the image mask within the reveal range", () => {
    expect(DURATION.imageMask).toBeGreaterThanOrEqual(0.8);
    expect(DURATION.imageMask).toBeLessThanOrEqual(1.4);
  });

  it("staggers headline lines slowly enough to read as one movement", () => {
    expect(DURATION.lineStagger).toBeGreaterThan(0.04);
    expect(DURATION.lineStagger).toBeLessThan(0.15);
  });

  it("settles images downward in scale, never upward", () => {
    expect(IMAGE_FROM.scale).toBeGreaterThan(1);
    expect(IMAGE_FROM.scale).toBeLessThanOrEqual(1.12);
  });

  it("never slides a photograph in laterally either", () => {
    // Law 2 is a law about all entrances, not just `REVEAL_FROM`'s. Without this
    // the sibling token is free to grow an `x` that the suite would not notice.
    expect(IMAGE_FROM).not.toHaveProperty("x");
    expect(IMAGE_FROM).not.toHaveProperty("y");
  });

  it("keeps a pinned scene's rope short", () => {
    // A pinned section reserves scroll height a number chose rather than the
    // content — the construct that made the rejected build sparse. Three screens
    // is already generous; more is a section padding itself out.
    expect(STICKY_SCREENS_MAX).toBeGreaterThanOrEqual(1);
    expect(STICKY_SCREENS_MAX).toBeLessThanOrEqual(3);
  });

  it("nothing bounces", () => {
    const banned = /(elastic|bounce|back)/i;
    for (const [name, ease] of Object.entries(EASE)) {
      expect(banned.test(ease), `EASE.${name} = "${ease}" overshoots`).toBe(false);
    }
  });
});
