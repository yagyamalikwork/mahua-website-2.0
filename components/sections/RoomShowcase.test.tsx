import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomShowcase, type RoomShowcaseCopy } from "./RoomShowcase";

const COPY: RoomShowcaseCopy = {
  heading: { text: "Twenty-six rooms, three shapes", dim: "shapes" },
  intro: "All handmade in mud and local wood.",
  rooms: [
    { mediaId: "vann-room-deluxe", name: "Deluxe", line: "Thirteen of them.", facts: ["225 sq ft", "Queen", "Garden"] },
    { mediaId: "suite-tiger-painting", name: "Cottage with Deck", line: "Eight, over the river.", facts: ["324 sq ft", "King", "River"] },
  ],
};

const chapter = { id: "vann-rooms", shape: "showcase", media: [] } as const;

describe("RoomShowcase", () => {
  it("sets each room's facts as one caption line, not a table", () => {
    // The specific defect this replaces: RoomsIndex drew Size/Bed/View as
    // three ruled <dt>/<dd> rows per room, four rooms deep. A datasheet is
    // not how a lodge sells a room.
    const { container, getByText } = render(<RoomShowcase chapter={chapter} copy={COPY} />);
    expect(container.querySelectorAll("dl, dt, dd")).toHaveLength(0);
    expect(getByText(/225 sq ft/)).toBeTruthy();
  });

  it("names every room it is given", () => {
    const { getByText } = render(<RoomShowcase chapter={chapter} copy={COPY} />);
    expect(getByText("Deluxe")).toBeTruthy();
    expect(getByText("Cottage with Deck")).toBeTruthy();
  });
});
