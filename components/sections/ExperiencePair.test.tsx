import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperiencePair, type ExperiencePairCopy } from "./ExperiencePair";

const COPY: ExperiencePairCopy = {
  heading: { text: "The day at Vann", dim: "day" },
  intro: "Morning and evening game drives.",
  experiences: [
    { mediaId: "vann-tiger", name: "Jungle Safari", line: "Open vehicles, before dawn.", weight: "hero" },
    { mediaId: "vann-kohka-lake", name: "Kohka Lake", line: "Still water at the forest's edge.", weight: "quiet" },
  ],
  alsoLine: "Also: cycling, swimming, karaoke, and a conference hall that seats forty.",
};

const chapter = { id: "vann-day", shape: "pair", media: [] } as const;

describe("ExperiencePair", () => {
  it("names every experience and sets its line", () => {
    const { getByText } = render(<ExperiencePair chapter={chapter} copy={COPY} />);
    expect(getByText("Jungle Safari")).toBeTruthy();
    expect(getByText("Still water at the forest's edge.")).toBeTruthy();
  });

  it("carries the also-line, so nothing is hidden from a planner", () => {
    // The client's ruling: the six that carry the brand get real space, and
    // karaoke and the conference hall are named honestly rather than deleted.
    const { getByText } = render(<ExperiencePair chapter={chapter} copy={COPY} />);
    expect(getByText(/conference hall that seats forty/)).toBeTruthy();
  });

  it("omits the also-line entirely when there is nothing left to name", () => {
    const { container } = render(
      <ExperiencePair chapter={chapter} copy={{ ...COPY, alsoLine: undefined }} />,
    );
    expect(container.textContent).not.toContain("Also:");
  });
});
