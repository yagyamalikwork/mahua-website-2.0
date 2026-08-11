import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomCard } from "./RoomCard";
import type { RoomEntryCopy } from "./RoomShowcase.types";

const WIDE: RoomEntryCopy = {
  mediaId: "vann-room-cottage-plain",
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
