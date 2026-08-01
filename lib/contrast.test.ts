import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb, relativeLuminance } from "./contrast";

describe("hexToRgb", () => {
  it("parses with and without the leading hash", () => {
    expect(hexToRgb("#F1E9D7")).toEqual([241, 233, 215]);
    expect(hexToRgb("232B21")).toEqual([35, 43, 33]);
  });

  it("throws on malformed input", () => {
    expect(() => hexToRgb("#FFF")).toThrow();
    expect(() => hexToRgb("not a colour")).toThrow();
  });
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 10);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10);
  });

  it("pins each channel coefficient independently", () => {
    // A pure primary zeroes the other two channels, so the result IS that
    // channel's coefficient. Swapping any two coefficients breaks these.
    expect(relativeLuminance([255, 0, 0])).toBeCloseTo(0.2126, 10);
    expect(relativeLuminance([0, 255, 0])).toBeCloseTo(0.7152, 10);
    expect(relativeLuminance([0, 0, 255])).toBeCloseTo(0.0722, 10);
  });

  it("takes the linear branch below the 0.03928 threshold", () => {
    // 10/255 = 0.0392157, just under the threshold, so this must divide by
    // 12.92 rather than taking the gamma branch. Nothing else in the suite
    // reaches this branch with a non-zero value.
    expect(relativeLuminance([10, 0, 0])).toBeCloseTo(0.2126 * (10 / 255 / 12.92), 12);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 6);
  });

  it("is 1 for a colour against itself", () => {
    expect(contrastRatio("#BB8F2E", "#BB8F2E")).toBeCloseTo(1, 10);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio("#31402C", "#F1E9D7")).toBeCloseTo(
      contrastRatio("#F1E9D7", "#31402C"),
      10,
    );
  });
});
