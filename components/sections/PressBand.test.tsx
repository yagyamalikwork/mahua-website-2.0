import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VANN_CHAPTERS, VANN_COPY } from "@/content/mahua-vann";
import { PressBand, type PressBandCopy } from "./PressBand";

const COPY: PressBandCopy = {
  heading: { text: "Written about", dim: "about" },
  articles: [
    {
      publication: "Condé Nast Traveller",
      headline: "Where to stay in Pench",
      standfirst: "From outdoor machans to luxury tents.",
      href: "https://www.cntraveller.in/story/where-to-stay-in-pench-national-park",
      linkLabel: "Read the article",
    },
  ],
};

describe("PressBand", () => {
  it("links out in a new tab, because it is somebody else's site", () => {
    const { container } = render(
      <PressBand chapter={{ id: "vann-press", shape: "press", media: [] }} copy={COPY} />,
    );
    const a = container.querySelector("a[href^='https://www.cntraveller.in']");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toContain("noreferrer");
  });

  it("carries the sliding hairline every link on this site carries", () => {
    // scripts/check_rule_in.mjs fails any link with neither `rule-in` nor an
    // explicit data-rule opt-out. Catching it here costs a second; catching
    // it in the browser rig costs a build and a server.
    const { container } = render(
      <PressBand chapter={{ id: "vann-press", shape: "press", media: [] }} copy={COPY} />,
    );
    for (const a of container.querySelectorAll("a[href]")) {
      expect(a.classList.contains("rule-in") || a.querySelector(".rule-in") !== null).toBe(true);
    }
  });

  it("names the publication and sets the headline", () => {
    const { getByText } = render(
      <PressBand chapter={{ id: "vann-press", shape: "press", media: [] }} copy={COPY} />,
    );
    expect(getByText("Condé Nast Traveller")).toBeTruthy();
    expect(getByText("Where to stay in Pench")).toBeTruthy();
  });

  it("renders with no articles at all — Mahua Tola has no press mentions", () => {
    // The client's own ruling, recorded at content/mahua-tola.ts's tola-press
    // entry: Tola has no press mentions and inventing three would be
    // fabrication, so "Written About" on that page is a heading over the
    // reviews widget and nothing else. A supported state, not a broken one.
    const { container } = render(
      <PressBand
        chapter={{ id: "tola-press", number: "04", label: "Written About", shape: "press", media: [] }}
        copy={{ heading: { text: "Written about", dim: "about" } }}
      >
        <div data-testid="widget" />
      </PressBand>,
    );
    // Not `getByText("Written about")`: `TwoToneHeading` (via `SplitLines`)
    // renders "Written" and "about" as separate word spans, which Testing
    // Library's node-level text matcher cannot see as one string — the same
    // reason `RoomCardStack.test.tsx` reaches for `container.textContent`
    // rather than `getByText` for anything that passes through a heading.
    expect(container.textContent).toContain("Written about");
    expect(container.querySelector("[data-testid=widget]")).not.toBeNull();
    expect(container.querySelector("article")).toBeNull();
  });

  it("still renders three articles where a property has them", () => {
    const vannPressChapter = VANN_CHAPTERS.find((c) => c.id === "vann-press");
    expect(vannPressChapter, "vann-press is not in VANN_CHAPTERS").toBeDefined();
    const { container } = render(
      <PressBand chapter={vannPressChapter!} copy={VANN_COPY.pressCopy!["vann-press"]} />,
    );
    expect(container.querySelectorAll("article")).toHaveLength(3);
  });

  it("renders the widget beneath the articles when a property has both — Mahua Vann's real composition", () => {
    // The two tests above each prove one arm of the branch in isolation.
    // Neither is what actually ships on Mahua Vann, where PropertyPage passes
    // BOTH three real articles AND the reviews widget as children — this is
    // the combination.
    const vannPressChapter = VANN_CHAPTERS.find((c) => c.id === "vann-press");
    const { container } = render(
      <PressBand chapter={vannPressChapter!} copy={VANN_COPY.pressCopy!["vann-press"]}>
        <div data-testid="widget" />
      </PressBand>,
    );
    expect(container.querySelectorAll("article")).toHaveLength(3);
    expect(container.querySelector("[data-testid=widget]")).not.toBeNull();
  });
});
