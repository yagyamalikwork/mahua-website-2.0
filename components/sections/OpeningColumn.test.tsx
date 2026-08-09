import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpeningColumn, type OpeningColumnCopy } from "./OpeningColumn";

const COPY: OpeningColumnCopy = {
  heading: { text: "The forest Kipling never saw", dim: "never" },
  body: ["First paragraph.", "Second paragraph."],
};

describe("OpeningColumn", () => {
  it("sets every paragraph it is given", () => {
    const { getByText } = render(
      <OpeningColumn chapter={{ id: "vann-forest", shape: "column", media: [] }} copy={COPY} />,
    );
    expect(getByText("First paragraph.")).toBeTruthy();
    expect(getByText("Second paragraph.")).toBeTruthy();
  });

  it("carries no photograph at all", () => {
    // The point of the shape. It is the page's one held breath, and an image
    // creeping into it turns it into another ChapterIntro — which is the
    // section the redesign exists to stop repeating.
    const { container } = render(
      <OpeningColumn chapter={{ id: "vann-forest", shape: "column", media: [] }} copy={COPY} />,
    );
    expect(container.querySelectorAll("img, picture, svg")).toHaveLength(0);
  });
});
