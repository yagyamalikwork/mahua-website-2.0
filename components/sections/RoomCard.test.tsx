import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { roomCardAspect } from "@/lib/room-card";
import { RoomCard } from "./RoomCard";
import type { RoomEntryCopy } from "./RoomShowcase.types";

// Every room card is `beside` since the client's 13 Aug 2026 ruling, so this
// fixture no longer needs to stand for a particular composition — only for
// "some room". `pool-daylight-forest` (home page, 1163x510 = 2.28:1) is a
// real MediaId; the name/line/facts below are this fixture's own invented
// copy, unrelated to that photograph's real content.
const ROOM: RoomEntryCopy = {
  mediaId: "pool-daylight-forest",
  name: "Cottage without Deck",
  line: "A private sit-out under cane.",
  facts: ["324 sq ft", "King bed"],
};

describe("RoomCard", () => {
  it("writes its index so the deck can step it down", () => {
    const { container } = render(<RoomCard room={ROOM} index={2} onSurface={false} />);
    const card = container.querySelector(".room-card") as HTMLElement;
    expect(card.style.getPropertyValue("--i")).toBe("2");
  });

  it("stands every photograph beside the words — the client's 13 Aug composition", () => {
    // vann-room-deluxe was the canonical STACKED card until the 13 Aug ruling.
    const { container } = render(
      <RoomCard room={{ ...ROOM, mediaId: "vann-room-deluxe" }} index={0} onSurface={false} />,
    );
    expect(container.querySelector("[data-card-layout]")?.getAttribute("data-card-layout")).toBe(
      "beside",
    );
  });

  it("alternates the photo's side: even cards left, odd cards right", () => {
    const even = render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    const odd = render(<RoomCard room={ROOM} index={1} onSurface={false} />);
    expect(even.container.querySelector(".room-card")?.className).not.toContain(
      "lg:flex-row-reverse",
    );
    expect(odd.container.querySelector(".room-card")?.className).toContain("lg:flex-row-reverse");
  });

  it("solves the crop bound from the photograph itself, not from a hand-picked box", () => {
    const { container } = render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    const wrapper = container.querySelector(".room-card > :first-child") as HTMLElement;
    const aspect = roomCardAspect(ROOM.mediaId);
    // Below lg the wrapper shows the photo whole (landscape) or the 1.25 floor
    // (portrait); at lg+ the cap reads 0.75 x natural via --room-photo-aspect.
    // `aspectRatio` is a standard CSS property, so both jsdom and real browsers
    // canonicalise a bare `<ratio>` to "N / 1" on read-back (confirmed against
    // jsdom directly — a custom property like `--room-photo-aspect` below is
    // NOT parsed by the `<ratio>` grammar and stays the literal string), hence
    // parsing the number back out rather than comparing the raw string.
    expect(Number.parseFloat(wrapper.style.aspectRatio)).toBeCloseTo(Math.max(aspect, 1.25), 10);
    expect(wrapper.style.getPropertyValue("--room-photo-aspect")).toBe(String(0.75 * aspect));
  });

  it("renders no gallery trigger when no galleryId is given", () => {
    const { container } = render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders the room's words", () => {
    render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    expect(screen.getByRole("heading", { name: "Cottage without Deck" })).toBeInTheDocument();
    expect(screen.getByText("A private sit-out under cane.")).toBeInTheDocument();
    expect(screen.getByText("324 sq ft · King bed")).toBeInTheDocument();
  });

  it("omits the shared-photograph note when there is none", () => {
    render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    expect(screen.queryByTestId("room-note")).not.toBeInTheDocument();
  });

  it("shows the shared-photograph note when there is one", () => {
    render(<RoomCard room={{ ...ROOM, note: "Shown: Suite." }} index={0} onSurface={false} />);
    expect(screen.getByTestId("room-note")).toHaveTextContent("Shown: Suite.");
  });

  it("carries no data-room-card-last attribute by default", () => {
    const { container } = render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    expect(container.querySelector(".room-card")).not.toHaveAttribute("data-room-card-last");
  });

  it("marks itself data-room-card-last when told it is the deepest card", () => {
    const { container } = render(<RoomCard room={ROOM} index={2} onSurface={false} isLast />);
    expect(container.querySelector(".room-card")).toHaveAttribute("data-room-card-last", "");
  });

  it("takes the opposite paper to its section, both ways round", () => {
    // The deck is only legible if a card contrasts with what it sits on. Both
    // values are guarded surfaces in `lib/palette.test.ts`, so no contrast
    // probe is added here — and deliberately no `data-contrast` hook either:
    // an attribute no rig reads is defect shape #36, a check that documents
    // itself as covering something it never sees.
    const onPaper = render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    expect(
      (onPaper.container.querySelector(".room-card") as HTMLElement).style.backgroundColor,
    ).toBe("var(--surface)");
    const onDeep = render(<RoomCard room={ROOM} index={0} onSurface />);
    expect(
      (onDeep.container.querySelector(".room-card") as HTMLElement).style.backgroundColor,
    ).toBe("var(--paper)");
  });
});
