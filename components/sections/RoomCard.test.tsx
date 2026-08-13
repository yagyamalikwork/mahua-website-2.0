import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomCard } from "./RoomCard";
import type { RoomEntryCopy } from "./RoomShowcase.types";

// Repointed 13 Aug 2026: vann-room-cottage-plain was 1440x588 = 2.45:1 (stacked)
// until Task 3's crop (the "crop and zoom to fit their half" ruling) shipped it
// at 1184x789 = 1.50:1 — now in the `beside` population, so it can no longer
// stand for a wide/stacked fixture. pool-daylight-forest (home page, untouched
// by that crop) is 1163x510 = 2.28:1; the name/line/facts below are this
// fixture's own invented copy, unrelated to that photograph's real content —
// only the aspect ratio is under test here.
const WIDE: RoomEntryCopy = {
  mediaId: "pool-daylight-forest",
  name: "Cottage without Deck",
  line: "A private sit-out under cane.",
  facts: ["324 sq ft", "King bed"],
};

const PORTRAIT: RoomEntryCopy = {
  mediaId: "tola-room-family",
  name: "Family Suite",
  line: "Two interconnected rooms.",
  facts: ["450 sq ft"],
};

describe("RoomCard", () => {
  it("writes its index so the deck can step it down", () => {
    const { container } = render(<RoomCard room={WIDE} index={2} onSurface={false} />);
    const card = container.querySelector(".room-card") as HTMLElement;
    expect(card.style.getPropertyValue("--i")).toBe("2");
  });

  it("lays a wide photograph across the top", () => {
    const { container } = render(<RoomCard room={WIDE} index={0} onSurface={false} />);
    expect(container.querySelector(".room-card")).toHaveAttribute("data-card-layout", "stacked");
  });

  it("stands a portrait photograph beside the words", () => {
    const { container } = render(<RoomCard room={PORTRAIT} index={0} onSurface={false} />);
    expect(container.querySelector(".room-card")).toHaveAttribute("data-card-layout", "beside");
  });

  it("renders the room's words", () => {
    render(<RoomCard room={WIDE} index={0} onSurface={false} />);
    expect(screen.getByRole("heading", { name: "Cottage without Deck" })).toBeInTheDocument();
    expect(screen.getByText("A private sit-out under cane.")).toBeInTheDocument();
    expect(screen.getByText("324 sq ft · King bed")).toBeInTheDocument();
  });

  it("omits the shared-photograph note when there is none", () => {
    render(<RoomCard room={WIDE} index={0} onSurface={false} />);
    expect(screen.queryByTestId("room-note")).not.toBeInTheDocument();
  });

  it("shows the shared-photograph note when there is one", () => {
    render(<RoomCard room={{ ...WIDE, note: "Shown: Suite." }} index={0} onSurface={false} />);
    expect(screen.getByTestId("room-note")).toHaveTextContent("Shown: Suite.");
  });

  it("carries no data-room-card-last attribute by default", () => {
    const { container } = render(<RoomCard room={WIDE} index={0} onSurface={false} />);
    expect(container.querySelector(".room-card")).not.toHaveAttribute("data-room-card-last");
  });

  it("marks itself data-room-card-last when told it is the deepest card", () => {
    const { container } = render(
      <RoomCard room={WIDE} index={2} onSurface={false} isLast />,
    );
    expect(container.querySelector(".room-card")).toHaveAttribute("data-room-card-last", "");
  });

  it("takes the opposite paper to its section, both ways round", () => {
    // The deck is only legible if a card contrasts with what it sits on. Both
    // values are guarded surfaces in `lib/palette.test.ts`, so no contrast
    // probe is added here — and deliberately no `data-contrast` hook either:
    // an attribute no rig reads is defect shape #36, a check that documents
    // itself as covering something it never sees.
    const onPaper = render(<RoomCard room={WIDE} index={0} onSurface={false} />);
    expect(
      (onPaper.container.querySelector(".room-card") as HTMLElement).style.backgroundColor,
    ).toBe("var(--surface)");
    const onDeep = render(<RoomCard room={WIDE} index={0} onSurface />);
    expect(
      (onDeep.container.querySelector(".room-card") as HTMLElement).style.backgroundColor,
    ).toBe("var(--paper)");
  });
});
