import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperienceStrip } from "@/components/sections/ExperienceStrip";
import { chapter } from "@/content/chapters";

describe("ExperienceStrip", () => {
  it("has no figure column — the tiger came off on 26 Aug 2026", () => {
    const { container } = render(<ExperienceStrip chapter={chapter("field-days")} />);
    expect(container.querySelector(".experience-figure")).toBeNull();
    expect(container.querySelector(".lg\\:col-span-5")).toBeNull();
    expect(container.querySelector(".lg\\:col-span-7")).toBeNull();
  });

  it("still renders all six cards", () => {
    const { container } = render(<ExperienceStrip chapter={chapter("field-days")} />);
    expect(container.querySelectorAll(".experience-card")).toHaveLength(6);
  });
});
