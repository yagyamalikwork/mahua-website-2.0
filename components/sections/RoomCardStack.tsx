import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { PropertyChapter } from "@/content/property-chapters";
import { ENTER } from "@/lib/motion";
import { RoomCard } from "./RoomCard";
import type { RoomShowcaseCopy } from "./RoomShowcase.types";

/**
 * The rooms, as a stack of cards the visitor scrolls through.
 *
 * Client request, 11 Aug 2026: "pile up, with recede" — each card sticks below
 * the header while the next rises over it, and a covered card scales down and
 * dims so the deck reads as depth rather than as stacked paper.
 *
 * **It carries no JavaScript.** The stacking is `position: sticky`; the recede
 * is a CSS scroll-driven animation, but not off each card's own view timeline —
 * a sticky element's own `view()` timeline freezes while it is actually stuck,
 * which would only let a covered card dim after it had already scrolled out of
 * view (measured; see `app/globals.css`'s comment above `.room-stack`). Each
 * card instead reads a NAMED timeline (`--room-slot-N`) sourced from its own
 * non-sticky `.room-slot` sibling below, published into scope here via
 * `timelineScope`. There is no hook here, no scroll listener and no
 * `"use client"` — which is what let this ship against 3.7 KB of budget
 * headroom.
 *
 * The mechanics live in `app/globals.css` under `.room-stack`; the numbers live
 * in `lib/motion.ts` as `ROOM_STACK`. Neither is written here.
 */
export function RoomCardStack({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: RoomShowcaseCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            </div>
          </Enter>
          <Enter delay={ENTER.stagger}>
            <p
              className="max-w-[58ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </Enter>
        </div>

        {/*
         * `--room-count` is what makes the deck depth a calculation rather than
         * a number per property: Vann has three rooms and Tola four, so their
         * decks are 28px and 42px and their cards differ in height by 14px.
         * Written here because this is the only place that knows the count.
         *
         * `timelineScope` lists every card's own named view-timeline
         * (`--room-slot-0`, `--room-slot-1`, …, one per room — `RoomCard.tsx`).
         * Each is declared on a `.room-slot` sibling and consumed by its
         * `.room-card` sibling, not by an ancestor — see `.room-slot`'s comment
         * in `app/globals.css` for why siblings, and why this property is what
         * lets a sibling's declaration reach a sibling's consumer at all.
         */}
        <ol
          className="room-stack mt-10 md:mt-12"
          style={
            {
              "--room-count": String(copy.rooms.length),
              timelineScope: Array.from(
                { length: copy.rooms.length },
                (_, i) => `--room-slot-${i}`,
              ).join(", "),
            } as React.CSSProperties
          }
        >
          {copy.rooms.map((room, i) => (
            <RoomCard
              key={room.name}
              room={room}
              index={i}
              onSurface={surface}
              isLast={i === copy.rooms.length - 1}
            />
          ))}
        </ol>
      </div>
    </ChapterSurface>
  );
}
