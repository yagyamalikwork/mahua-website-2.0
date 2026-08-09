import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
