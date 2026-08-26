import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperienceStrip } from "@/components/sections/ExperienceStrip";
import { chapter } from "@/content/chapters";

describe("ExperienceStrip", () => {
  it("has no figure column — the tiger came off on 26 Aug 2026", () => {
    const { container } = render(<ExperienceStrip chapter={chapter("field-days")} />);
    expect(container.querySelector(".experience-figure")).toBeNull();
  });

  it("is a 5/7 header band — heading narrow, paragraph wide, fix round 1 of 26 Aug 2026", () => {
    // The tiger's grid was 7/5 (copy/film). Removing the film alone, then a
    // one-column attempt that measured worse, both came and went the same day
    // — see the component's own top-of-file comment and
    // docs/reviews/2026-08-26-restructure/ for the swept alternatives (6/6,
    // 7/5) this shape beat on density. Exactly one of each column, and the
    // right content in each: the heading in the narrow slot, the paragraph in
    // the wide one.
    const { container } = render(<ExperienceStrip chapter={chapter("field-days")} />);
    const headingCol = container.querySelector(".lg\\:col-span-5");
    const paragraphCol = container.querySelector(".lg\\:col-span-7");
    expect(headingCol).not.toBeNull();
    expect(paragraphCol).not.toBeNull();
    expect(headingCol?.querySelector("h2")).not.toBeNull();
    expect(paragraphCol?.querySelector("p")).not.toBeNull();
    expect(container.querySelectorAll(".lg\\:col-span-5")).toHaveLength(1);
    expect(container.querySelectorAll(".lg\\:col-span-7")).toHaveLength(1);
  });

  it("still renders all six cards", () => {
    const { container } = render(<ExperienceStrip chapter={chapter("field-days")} />);
    expect(container.querySelectorAll(".experience-card")).toHaveLength(6);
  });
});
