import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoverflowCard } from "./CoverflowCard";

const experience = {
  title: "Kohka Lake",
  body: "An hour at the water near Pench.",
  mediaId: "vann-kohka-lake",
} as const;

// The card takes its wash as a prop; the six real figures live in
// `Coverflow.tsx`, keyed by photograph. See correction C.
const scrim = { flat: 0.5 } as const;

describe("CoverflowCard", () => {
  it("carries its own index into CSS, because every card shares one stylesheet", () => {
    const { container } = render(
      <CoverflowCard experience={experience} scrim={scrim} index={2} count={6} chapterId="field-days" />,
    );
    const card = container.querySelector("li");
    expect(card?.style.getPropertyValue("--i")).toBe("2");
  });

  it("shows the activity's own words", () => {
    render(<CoverflowCard experience={experience} scrim={scrim} index={2} count={6} chapterId="field-days" />);
    expect(screen.getByRole("heading", { name: "Kohka Lake" })).toBeInTheDocument();
    expect(screen.getByText(/An hour at the water/)).toBeInTheDocument();
  });

  it("points its arrows at its neighbours, and wraps at the ends", () => {
    const { container } = render(
      <CoverflowCard experience={experience} scrim={scrim} index={0} count={6} chapterId="field-days" />,
    );
    const links = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    // Card 0's "previous" is card 5 — the loop the client asked for, and the
    // whole reason the arrows are anchors rather than script.
    expect(links).toContain("#field-days-card-5");
    expect(links).toContain("#field-days-card-1");
  });

  it("names its arrows for a screen reader, since a chevron has no text", () => {
    render(<CoverflowCard experience={experience} scrim={scrim} index={0} count={6} chapterId="field-days" />);
    // Six cards each carry a pair, so a bare "Previous" would be announced twelve
    // times with nothing to tell them apart.
    expect(screen.getByRole("link", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /next/i })).toBeInTheDocument();
  });
});
