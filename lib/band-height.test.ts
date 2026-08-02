import { describe, expect, it } from "vitest";
import { BANDS } from "@/content/movements";
import { bandMinHeight } from "./band-height";

const CROSSING_WEIGHT = BANDS.find((b) => b.id === "into-the-day")!.weight;

describe("bandMinHeight", () => {
  it("assumes both crossing bands share a weight — the premise the scale is built on", () => {
    // components/ui/FullBleed.tsx hard-codes both crossing bands to the same
    // fixed 100vh. bandMinHeight can only reproduce that exactly for both if
    // they share one weight; if content/movements.ts ever gives them different
    // weights, this is the test that should fail first.
    const day = BANDS.find((b) => b.id === "into-the-day")!;
    const dark = BANDS.find((b) => b.id === "into-the-dark")!;
    expect(dark.weight).toBe(day.weight);
  });

  it("derives every band's height from its own weight, not a second number", () => {
    for (const band of BANDS) {
      expect(bandMinHeight(band.id)).toBe(`calc(${band.weight} / ${CROSSING_WEIGHT} * 100vh)`);
    }
  });

  it("reproduces FullBleed's fixed 100vh exactly for both crossing bands", () => {
    expect(bandMinHeight("into-the-day")).toBe(`calc(${CROSSING_WEIGHT} / ${CROSSING_WEIGHT} * 100vh)`);
    expect(bandMinHeight("into-the-dark")).toBe(`calc(${CROSSING_WEIGHT} / ${CROSSING_WEIGHT} * 100vh)`);
  });

  it("throws on an unknown band id rather than silently returning a height", () => {
    expect(() => bandMinHeight("not-a-real-band")).toThrow();
  });
});
