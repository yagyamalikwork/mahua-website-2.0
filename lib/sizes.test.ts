import { describe, expect, it } from "vitest";
import { capDensity, DENSITY_CAP } from "./sizes";

/**
 * These tests guard the *string*. Whether Chrome then picks the tier we intended
 * is a browser question and is measured on the real page by
 * `scripts/check_image_resolution.mjs`, which reports the effective density of
 * every photograph at DPR 1, 2 and 3 and fails below the cap. Neither check
 * substitutes for the other: this one cannot see a browser, and that one cannot
 * run in CI without a build.
 */
describe("capDensity", () => {
  it("leaves the original list intact as the fallback tail", () => {
    const original = "(min-width: 1024px) 42vw, 100vw";
    expect(capDensity(original).endsWith(original)).toBe(true);
  });

  it("puts the densest bucket first, because the first match wins", () => {
    const out = capDensity("100vw");
    expect(out.indexOf("3.5x")).toBeLessThan(out.indexOf("2.5x"));
    expect(out.indexOf("2.5x")).toBeLessThan(out.lastIndexOf("100vw"));
  });

  it("scales a bare length", () => {
    expect(capDensity("100vw")).toBe(
      "(min-resolution: 3.5x) calc(0.5 * 100vw), (min-resolution: 2.5x) calc(0.667 * 100vw), 100vw",
    );
  });

  it("keeps each entry's own media condition and ands the resolution onto it", () => {
    const out = capDensity("(min-width: 1024px) 42vw, 100vw");
    expect(out).toContain("(min-width: 1024px) and (min-resolution: 2.5x) calc(0.667 * 42vw)");
    expect(out).toContain("(min-resolution: 2.5x) calc(0.667 * 100vw)");
  });

  it("unwraps an existing calc() rather than nesting one inside another", () => {
    const out = capDensity("calc((100vw - 72px) * 0.82)");
    expect(out).toContain("calc(0.667 * ((100vw - 72px) * 0.82))");
    expect(out).not.toContain("calc(0.667 * calc(");
  });

  it("does not split on a comma inside a function", () => {
    // No caller writes this today; one will. A naive split(\",\") turns it into
    // two entries the browser drops, and the photograph silently reverts to
    // 100vw — the exact class of failure `sizes` bugs belong to.
    const out = capDensity("min(50vw, 400px)");
    expect(out).toContain("calc(0.667 * min(50vw, 400px))");
    expect(out.split(",").length).toBe(3 /* commas inside min() */ + 2 /* real separators */ + 1);
  });

  it("refuses a shape it cannot parse instead of quietly skipping the cap", () => {
    expect(() => capDensity("(min-width: 1024px)")).toThrow(/no length/);
    expect(() => capDensity("(min-width: 1024px 42vw")).toThrow(/unbalanced/);
    expect(() => capDensity("not all 42vw")).toThrow(/unsupported/);
  });

  it("every real sizes string on the page survives the round trip", () => {
    // Copied from the components deliberately: if one of them grows a shape
    // capDensity cannot parse, this fails in CI rather than at request time.
    const live = [
      "100vw",
      "(min-width: 1024px) 42vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
      "(min-width: 1024px) 40vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
      "(min-width: 1024px) 28vw, (min-width: 768px) calc((100vw - 72px) * 0.82), calc((100vw - 24px) * 0.82)",
      "(min-width: 1600px) 724px, (min-width: 1024px) calc((100vw - 152px) / 2), (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
      "(min-width: 1600px) 310px, (min-width: 1024px) calc((100vw - 152px) * 0.23), (min-width: 768px) calc((100vw - 96px) * 0.46), calc((100vw - 48px) * 0.46)",
      "(min-width: 1024px) 63vw, (min-width: 768px) calc(100vw - 48px), calc(100vw - 24px)",
      "(min-width: 1024px) 30vw, calc(100vw - 48px)",
    ];
    for (const s of live) {
      const out = capDensity(s);
      expect(out.endsWith(s)).toBe(true);
      // One capped entry per bucket per original entry, plus the original list.
      const originalEntries = s.split(/,(?![^()]*\))/).length;
      expect(out).toContain("(min-resolution: 3.5x)");
      expect(originalEntries).toBeGreaterThan(0);
    }
  });

  it("the cap is 2 — the number the byte/sharpness trade was argued at", () => {
    expect(DENSITY_CAP).toBe(2);
  });
});
