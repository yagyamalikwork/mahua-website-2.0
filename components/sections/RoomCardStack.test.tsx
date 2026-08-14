import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROOM_GALLERY_CLOSED, roomGalleryId, RoomCardStack } from "./RoomCardStack";
import { VANN_COPY } from "@/content/mahua-vann";
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
   * 0 of 4 cards ever pinned.
   *
   * **Each card now has a `.room-slot` sibling immediately before it — also a
   * direct child, not a wrapper.** Fix round, 11 Aug 2026
   * (`docs/reviews/2026-08-11-card-stack/task-6-fix-report.md`, "defect A"):
   * a plain, unwrapped stack pins its cards correctly (the paragraph above
   * still holds), but a sticky element's own `view()` timeline was found to
   * FREEZE while the element is stuck, so the recede was invisible for as
   * long as a card was actually pinned — only "catching up" once the whole
   * deck unstuck at the very end. The fix needs a genuinely different,
   * non-sticky element to drive each card's timeline. It has to be a SIBLING
   * rather than a wrapping ancestor (the more obvious construction) because
   * `scripts/check_card_stack.mjs` measures `ol.room-stack > li.room-card`
   * directly — nesting the card a level deeper would mean the rig measures
   * the wrong, never-pinned box. Do not collapse the slot back into a single
   * `<li>` per room, and do not turn it into a wrapper: both defeat the fix
   * for different reasons (see `.room-slot`'s comment in `app/globals.css`).
   */
  it("gives every card a sibling slot, both direct children of the stack", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const stack = container.querySelector("ol.room-stack")!;
    expect(stack.children).toHaveLength(COPY.rooms.length * 2);
    for (let i = 0; i < COPY.rooms.length; i++) {
      const slot = stack.children[i * 2];
      const card = stack.children[i * 2 + 1];
      expect(slot.tagName).toBe("LI");
      expect(slot).toHaveClass("room-slot");
      expect(slot).not.toHaveClass("room-card");
      expect(card.tagName).toBe("LI");
      expect(card).toHaveClass("room-card");
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

  /**
   * Fix round 1: only the deepest card may be marked `data-room-card-last`.
   * Nothing covers it, so the CSS recede must be switched off for it alone
   * (`app/globals.css`'s `[data-room-card-last]` rule) — otherwise it dims
   * and shrinks while still the visible top card, over an already-dimmed
   * deck, and the tail of the chapter reads as two translucent, overlapping
   * cards. Exercised at both room counts the two properties actually ship —
   * Vann's three and Tola's four — because a fix that only works for one
   * count is not a fix.
   */
  it.each([
    ["Vann (3 rooms)", VANN_COPY.showcaseCopy!["vann-rooms"]],
    ["Tola (4 rooms)", TOLA_COPY.showcaseCopy!["tola-rooms"]],
  ])("marks only the deepest card as last, for %s", (_label, copy) => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={copy} />);
    const cards = [...container.querySelectorAll<HTMLElement>(".room-card")];
    expect(cards).toHaveLength(copy.rooms.length);

    const flagged = cards.filter((c) => c.hasAttribute("data-room-card-last"));
    expect(flagged).toHaveLength(1);
    expect(flagged[0]).toBe(cards[cards.length - 1]);
  });

  // Was `popover="auto"` until image-sizing Task 7's fix (14 Aug 2026):
  // measured, in a real browser, to nest the gallery's arrows rather than
  // replace panels — the mechanism is `RoomCardStack.tsx`'s own comment.
  // `:target` needs no `popover` attribute at all; the panel's `id` alone is
  // what a fragment link addresses.
  it("renders one gallery panel per room, shown by :target", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const panels = container.querySelectorAll(".room-gallery");
    expect(panels.length).toBe(COPY.rooms.length);
    panels.forEach((p, i) => {
      expect(p.getAttribute("popover")).toBeNull();
      expect(p.getAttribute("role")).toBe("dialog");
      expect(p.getAttribute("tabindex")).toBe("-1");
      expect(p.id).toBe(roomGalleryId(CHAPTER.id, i));
      // Panels live OUTSIDE the <ol>: the stack's children stay slot,card,...
      expect(p.closest("ol")).toBeNull();
    });
  });

  it("wires every card's photo as its own panel's declarative fragment link", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const triggers = container.querySelectorAll("ol.room-stack a[href^='#room-gallery-']");
    expect(triggers.length).toBe(COPY.rooms.length);
    triggers.forEach((t, i) => {
      expect(t.getAttribute("href")).toBe(`#${roomGalleryId(CHAPTER.id, i)}`);
    });
  });

  it("gives every panel a real light-dismiss backdrop, hidden from assistive tech and the tab order", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const backdrops = container.querySelectorAll(".room-gallery-backdrop");
    expect(backdrops.length).toBe(COPY.rooms.length);
    backdrops.forEach((b) => {
      expect(b.tagName).toBe("A");
      expect(b.getAttribute("href")).toBe(`#${ROOM_GALLERY_CLOSED}`);
      expect(b.getAttribute("aria-hidden")).toBe("true");
      expect(b.getAttribute("tabindex")).toBe("-1");
    });
  });

  it("steps through the rooms with arrows that wrap at both ends, and closes to a sentinel no element carries", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const n = COPY.rooms.length;
    const panels = [...container.querySelectorAll(".room-gallery")];
    panels.forEach((p, i) => {
      const [prev, next, close] = [...p.querySelectorAll(".room-gallery-box a")];
      expect(prev.getAttribute("href")).toBe(`#${roomGalleryId(CHAPTER.id, (i + n - 1) % n)}`);
      expect(next.getAttribute("href")).toBe(`#${roomGalleryId(CHAPTER.id, (i + 1) % n)}`);
      expect(close.getAttribute("href")).toBe(`#${ROOM_GALLERY_CLOSED}`);
      // Not "#" alone (which the fragment-navigation algorithm special-cases
      // to "scroll to the top of the document") and not any room's own id
      // (which would just reopen that room instead of closing anything).
      expect(close.getAttribute("href")).not.toBe("#");
    });
    // The sentinel's own contract, checked against the WHOLE document the way
    // the live-page rig does (`document.getElementById`), not narrowed to
    // `.room-gallery` elements only — a sentinel claimed by, say, a chapter
    // wrapper or an unrelated future element would defeat "close" exactly as
    // badly as one claimed by another gallery panel, and a scoped query
    // could not see that.
    expect(container.querySelector(`#${ROOM_GALLERY_CLOSED}`)).toBeNull();
  });
});
