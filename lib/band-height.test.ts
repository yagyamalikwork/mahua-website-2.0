import { describe, expect, it } from "vitest";
import { BANDS } from "@/content/movements";
import { bandHeightVh, bandMinHeight } from "./band-height";

const CROSSING_WEIGHT = BANDS.find((b) => b.id === "into-the-day")!.weight;

describe("bandHeightVh / bandMinHeight", () => {
  it("assumes both crossing bands share a weight — the premise the scale is built on", () => {
    // components/ui/FullBleed.tsx (fix round 1) derives both crossing bands'
    // height from this module rather than hard-coding 100vh, but the two
    // crossing bands still only render at the same height *because* they
    // share a weight in content/movements.ts. If that weight ever diverges,
    // this is the test that should fail first.
    const day = BANDS.find((b) => b.id === "into-the-day")!;
    const dark = BANDS.find((b) => b.id === "into-the-dark")!;
    expect(dark.weight).toBe(day.weight);
  });

  it("derives every band's height from its own weight, not a second number", () => {
    for (const band of BANDS) {
      expect(bandHeightVh(band.id)).toBeCloseTo((band.weight / CROSSING_WEIGHT) * 100);
      expect(bandMinHeight(band.id)).toBe(`${bandHeightVh(band.id)}vh`);
    }
  });

  it("gives both crossing bands exactly one viewport (100vh) — what FullBleed assumes", () => {
    expect(bandHeightVh("into-the-day")).toBe(100);
    expect(bandHeightVh("into-the-dark")).toBe(100);
  });

  it("scales linearly: a band with double the weight gets double the height", () => {
    const heaviest = BANDS.reduce((a, b) => (b.weight > a.weight ? b : a));
    expect(bandHeightVh(heaviest.id)).toBeCloseTo((heaviest.weight / CROSSING_WEIGHT) * 100);
  });

  it("throws on an unknown band id rather than silently returning a height", () => {
    expect(() => bandHeightVh("not-a-real-band")).toThrow();
    expect(() => bandMinHeight("not-a-real-band")).toThrow();
  });
});
