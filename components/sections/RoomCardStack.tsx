import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { PropertyChapter } from "@/content/property-chapters";
import { SITE } from "@/content/site";
import { ENTER } from "@/lib/motion";
import { RoomCard } from "./RoomCard";
import type { RoomShowcaseCopy } from "./RoomShowcase.types";

/** One id shape, composed in exactly one place. Task 7's rigs and the tests
 * both re-derive it; a card's trigger and its panel can never disagree. */
export function roomGalleryId(chapterId: string, index: number) {
  return `room-gallery-${chapterId}-${index}`;
}

/** Exported for `lib/sizes.test.ts`. The enlarged photo is `object-contain`
 * inside ~88vw x ~78svh, so its drawn width is min(88vw, 78svh x aspect) —
 * ~80vw for the 3:2 rooms on a 1440x900 screen, less for the portrait; 80vw
 * over-states the portrait's need, which is the safe direction (`ui/Photo.tsx`
 * says which way to round). */
export const GALLERY_SIZES = "(min-width: 768px) 80vw, calc(100vw - 32px)";

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
              galleryId={roomGalleryId(chapter.id, i)}
            />
          ))}
        </ol>

        {/* The gallery: one native-popover panel per room, in the top layer, so
            no card's overflow/transform can clip it. `popover="auto"` gives
            open/close, Esc, click-outside light-dismiss AND at-most-one-open —
            which is what makes the arrows navigation: opening the neighbour
            closes this panel. All user-agent behaviour; no script. The page can
            still scroll behind an open panel (Lenis bypasses CSS locks, §2 #9)
            — known, client-informed, accepted 13 Aug 2026. */}
        {copy.rooms.map((room, i) => {
          const n = copy.rooms.length;
          return (
            <div
              key={`gallery-${room.name}`}
              id={roomGalleryId(chapter.id, i)}
              popover="auto"
              role="dialog"
              aria-label={`${room.name} — ${SITE.roomGallery.open}`}
              className="room-gallery"
            >
              <figure>
                <Photo
                  id={room.mediaId}
                  sizes={GALLERY_SIZES}
                  pictureClassName="block"
                  className="mx-auto h-auto max-h-[78svh] w-auto max-w-[88vw]"
                />
                <figcaption className="mt-4 flex items-baseline justify-between gap-6">
                  <span className="font-[family-name:var(--font-display)] text-xl text-[color:var(--text)]">
                    {room.name}
                  </span>
                  <span
                    className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {room.facts.join(" · ")}
                  </span>
                </figcaption>
              </figure>
              <div className="mt-4 flex justify-between gap-6 border-t pt-3" style={{ borderColor: "var(--accent)" }}>
                {n > 1 && (
                  <button
                    type="button"
                    popoverTarget={roomGalleryId(chapter.id, (i + n - 1) % n)}
                    className="rule-in font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                  >
                    {SITE.roomGallery.previous}
                  </button>
                )}
                {n > 1 && (
                  <button
                    type="button"
                    popoverTarget={roomGalleryId(chapter.id, (i + 1) % n)}
                    className="rule-in font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                  >
                    {SITE.roomGallery.next}
                  </button>
                )}
                <button
                  type="button"
                  popoverTarget={roomGalleryId(chapter.id, i)}
                  popoverTargetAction="hide"
                  className="rule-in font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                >
                  {SITE.roomGallery.close}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ChapterSurface>
  );
}
