import { Photo } from "@/components/ui/Photo";
import { roomCardLayout, type RoomCardLayout } from "@/lib/room-card";
import type { RoomEntryCopy } from "./RoomShowcase.types";

/**
 * One room, as a card in the stack.
 *
 * Two compositions, chosen by `roomCardLayout` from the photograph's own aspect
 * rather than by a field in the content file:
 *
 * - **stacked** — the photograph lies across the top, words in a band beneath.
 *   Five of the seven rooms, all 2.29:1 or wider.
 * - **beside** — the photograph stands next to the words from `lg` up, above
 *   them below it. `suite-tiger-painting` (1.50:1) and `tola-room-family`
 *   (0.67:1, portrait).
 *
 * **The photo area is deliberately wider than every wide photograph it holds**,
 * so what a crop takes is height and never width. Every documented crop
 * constraint on this page is horizontal — `vann-room-cottage-plain` names a
 * sit-out and a cane chair near its frame edges — and a room interior survives
 * a trimmed ceiling far better than a trimmed wall.
 *
 * Renders an `<li>` — this is a direct child of the `<ol class="room-stack">`
 * the stack mounts (Task 5). `position: sticky` is clamped to its containing
 * block, so any wrapper element between this card and the stack leaves it zero
 * slack: measured in Chrome 151 over four cards, wrapped never pinned, direct
 * children pinned 3 of 4. Do not add a wrapper.
 */

/** Exported for `lib/sizes.test.ts`, like every other section's. */
export const ROOM_CARD_SIZES: Record<RoomCardLayout, string> = {
  stacked: "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 144px), calc(100vw - 48px)",
  beside: "(min-width: 1024px) 46vw, calc(100vw - 48px)",
};

/**
 * The photo area's aspect per composition — what `coverSizes` widens against.
 * Wider than the widest photograph (2.45:1) on purpose; see the note above.
 */
export const ROOM_CARD_BOXES: Record<RoomCardLayout, number> = {
  stacked: 2.9,
  beside: 0.86,
};

export function RoomCard({
  room,
  index,
  onSurface,
  isLast = false,
}: {
  room: RoomEntryCopy;
  index: number;
  /** True when the chapter itself is the deeper paper — the card then takes the lighter. */
  onSurface: boolean;
  /**
   * True when this is the deepest card in the stack. Nothing covers the last
   * card, so it must not run the recede: `view()`'s exit phase tracks the
   * card's own flow position, not its stuck one, and fires on the last card
   * even though no sibling ever overlaps it, dropping it to the same reduced
   * opacity as the already-dimmed deck behind it while it is still the
   * visible top card — two translucent cards over one another, text bleeding
   * through both. See `app/globals.css`'s `[data-room-card-last]` rule.
   */
  isLast?: boolean;
}) {
  const layout = roomCardLayout(room.mediaId);
  const beside = layout === "beside";

  return (
    <li
      className={`room-card flex overflow-hidden ${
        beside ? "flex-col lg:flex-row lg:items-stretch" : "flex-col"
      }`}
      data-card-layout={layout}
      data-room-card-last={isLast ? "" : undefined}
      style={
        {
          "--i": String(index),
          // The opposite paper to the section, so the deck is visible against
          // it. Inside a `surface` chapter `--bg` is the deeper paper (see the
          // note on `--paper` in `app/layout.tsx`), which is why this reaches
          // for `--paper` and not `--bg`.
          backgroundColor: onSurface ? "var(--paper)" : "var(--surface)",
        } as React.CSSProperties
      }
    >
      <div className={beside ? "min-h-0 flex-1 lg:w-[46%] lg:flex-none" : "min-h-0 flex-1"}>
        <Photo
          id={room.mediaId}
          sizes={ROOM_CARD_SIZES[layout]}
          box={ROOM_CARD_BOXES[layout]}
          pictureClassName="block h-full w-full"
          className="h-full w-full object-cover"
        />
      </div>

      <div
        className={`flex shrink-0 flex-col justify-center gap-3 px-6 py-6 md:px-10 ${
          beside ? "lg:flex-1" : ""
        }`}
      >
        <h3 className="font-[family-name:var(--font-display)] text-2xl font-light leading-tight text-[color:var(--text)] md:text-3xl">
          {room.name}
        </h3>
        <p
          className="max-w-[46ch] font-[family-name:var(--font-body)] text-[1.02rem] leading-[1.7]"
          style={{ color: "var(--dim)" }}
        >
          {room.line}
        </p>
        <p
          className="border-t pt-3 font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
          style={{ borderColor: "var(--accent)", color: "var(--accent-text)" }}
        >
          {room.facts.join(" · ")}
        </p>
        {room.note && (
          <p
            data-testid="room-note"
            className="font-[family-name:var(--font-body)] text-xs italic"
            style={{ color: "var(--dim)" }}
          >
            {room.note}
          </p>
        )}
      </div>
    </li>
  );
}
