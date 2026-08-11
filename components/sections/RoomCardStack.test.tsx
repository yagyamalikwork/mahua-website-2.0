import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomCardStack } from "./RoomCardStack";
import { TOLA_COPY } from "@/content/mahua-tola";
import type { PropertyChapter } from "@/content/property-chapters";

const CHAPTER: PropertyChapter = {
  id: "tola-rooms",
  number: "05",
  label: "Rooms",
  shape: "showcase",
  media: [],
};
const COPY = TOLA_COPY.showcaseCopy!["tola-rooms"];

describe("RoomCardStack", () => {
  it("gives every room a card, in order", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    expect(container.querySelectorAll(".room-card")).toHaveLength(COPY.rooms.length);
    const indices = [...container.querySelectorAll<HTMLElement>(".room-card")].map((c) =>
      c.style.getPropertyValue("--i"),
    );
    expect(indices).toEqual(COPY.rooms.map((_, i) => String(i)));
  });

  /**
   * Every card must be a DIRECT child of the stack. `position: sticky` is
   * clamped to its containing block, so any wrapper between the two leaves the
   * card no slack and it renders exactly as if it were `static` — measured at
   * 0 of 4 cards ever pinned. The stack still looks alive, because the recede
   * runs regardless; it simply never stacks.
   */
  it("makes every card a direct child of the stack", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const stack = container.querySelector("ol.room-stack")!;
    expect(stack.children).toHaveLength(COPY.rooms.length);
    for (const child of stack.children) {
      expect(child.tagName).toBe("LI");
      expect(child).toHaveClass("room-card");
    }
  });

  it("tells the stack how many rooms it holds, so the deck depth resolves", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const stack = container.querySelector(".room-stack") as HTMLElement;
    expect(stack.style.getPropertyValue("--room-count")).toBe(String(COPY.rooms.length));
  });

  it("keeps the heading out of the stack, so it scrolls away normally", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const stack = container.querySelector(".room-stack")!;
    expect(stack.querySelector("h2")).toBeNull();
  });

  it("renders the chapter's own intro", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    expect(container.textContent).toContain(COPY.intro);
  });

  it("uses a list, so the rooms are announced as the four things they are", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    expect(container.querySelector("ol.room-stack")).toBeInTheDocument();
  });
});
