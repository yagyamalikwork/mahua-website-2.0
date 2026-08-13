import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHAPTERS } from "@/content/chapters";
import { PLATE_SIZES, PlateGrid } from "./PlateGrid";

// The forest chapter: three portrait plates, the one board whose three-column
// tier is under test. Chosen from the real content so the test cannot drift
// from what the page actually renders. (If the spine's list export is not
// named CHAPTERS, read content/chapters.ts and use its actual export — do not
// build a synthetic chapter.)
const forest = CHAPTERS.find((c) => c.id === "forest");
if (!forest) throw new Error("content/chapters no longer carries a forest chapter");

describe("PlateGrid column reflow (spec 2026-08-13-image-sizing §1)", () => {
  it("holds a three-column board to two columns until xl, so plates keep their size", () => {
    const { container } = render(<PlateGrid chapter={forest} />);
    const grid = container.querySelector("[data-plate-grid]");
    expect(grid).not.toBeNull();
    // 3-across begins at 1280 (xl), not 1024 (lg): at 1024 a Forest plate is
    // 283px three-up against 421px at 1440 — 67% of its size, the client's
    // "images just get smaller". Two-up at 1024 is 444px.
    expect(grid!.className).toContain("xl:grid-cols-3");
    expect(grid!.className).not.toContain("lg:grid-cols-3");
  });

  it("serves the widened 1024-1279 band from the 50vw tier, not 34vw", () => {
    // A 2-column plate at 1024-1279 is ~0.5vw - 68px; a `(min-width: 1024px) 34vw`
    // tier would under-state it by ~30% and re-create §2 #6.
    expect(PLATE_SIZES[3]).toBe(
      "(min-width: 1600px) 480px, (min-width: 1280px) 34vw, (min-width: 640px) 50vw, calc(100vw - 48px)",
    );
  });
});
