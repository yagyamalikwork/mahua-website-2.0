import { Photo } from "@/components/ui/Photo";
import { roomCardAspect } from "@/lib/room-card";
import type { RoomEntryCopy } from "./RoomShowcase.types";

/**
 * One room, as a card in the stack.
 *
 * Every card is the same composition — the photograph stands beside the
 * words from `lg` up, above them below it — alternating which side the
 * photograph sits on (even cards left, odd cards right). Client ruling, 13
 * Aug 2026: the earlier two-composition design (`stacked`/`beside`, chosen
 * from the photograph's own aspect) is retired. See `docs/DECISIONS.md`
 * §17/§18 for the history and the ruling that ended it.
 *
 * **The photo area's aspect ratio is SOLVED per card, not hand-picked.**
 * `ROOM_CARD_MIN_BOX` bounds the floor below `lg` (a portrait photograph's
 * height crop) and `ROOM_PHOTO_KEEP` bounds the 25% width-crop rule
 * (`check_card_stack.mjs` assertion 6) above it, both read off the
 * photograph's own aspect (`roomCardAspect`) rather than a constant per
 * layout — see each export's own comment.
 *
 * Renders TWO `<li>` elements per room — a `.room-slot` and, immediately after it,
 * the `.room-card` itself — both **direct children** of `<ol class="room-stack">`.
 * See `.room-slot`'s comment in `app/globals.css` for why: `scripts/check_card_stack.mjs`
 * measures `ol.room-stack > li.room-card` directly (its rect, its computed opacity/
 * transform, its `firstElementChild`), so the card element itself cannot be nested a
 * level deeper — the slot has to be a *sibling*, not a wrapping parent, even though a
 * wrapping parent is the more obvious construction. Do not add a wrapper around the
 * card, and do not remove the sibling slot — both are load-bearing for different
 * reasons (see `app/globals.css`).
 */

/** Exported for `lib/sizes.test.ts`. One string now: every card is `beside`
 * (client ruling, 13 Aug 2026). 60% of the card at lg, 65% at xl — named
 * breakpoints in ascending order, never arbitrary `min-[...]` variants
 * (`docs/DECISIONS.md` §2 #23); 978px is 65% of the 1504px container cap.
 * The share appears in three places that must move together: here, the
 * `lg:w-[60%] xl:w-[65%]` classes below, and the `60cqw`/`65cqw` blocks in
 * `app/globals.css`. */
export const ROOM_CARD_SIZES =
  "(min-width: 1600px) 978px, (min-width: 1280px) 65vw, (min-width: 1024px) 60vw, calc(100vw - 48px)";

/** Below `lg` the card is a column and the wrapper's `aspect-ratio` is its only
 * definite axis: a landscape photograph shows whole (its own aspect), and the
 * one portrait is held to this floor so the words keep their room on a phone —
 * a height crop, unbounded by design (every documented crop constraint on this
 * page is about width). */
export const ROOM_CARD_MIN_BOX = 1.25;

/** The 25% width-crop bound (`check_card_stack.mjs` assertion 6), as the
 * fraction of a photograph's width that must survive. `--room-photo-aspect` is
 * SOLVED per card as `ROOM_PHOTO_KEEP x the photo's own aspect`, so the
 * `max-height` cap in `app/globals.css` holds the bound at every viewport
 * shape by construction — the 1024x1366 class of failure (§2 #42) cannot be
 * re-created by a new photograph or a new screen shape. A hand-picked
 * per-layout number is exactly what §2 #42 shipped. */
export const ROOM_PHOTO_KEEP = 0.75;

export function RoomCard({
  room,
  index,
  onSurface,
  isLast = false,
  galleryId,
}: {
  room: RoomEntryCopy;
  index: number;
  /** True when the chapter itself is the deeper paper — the card then takes the lighter. */
  onSurface: boolean;
  /**
   * True when this is the deepest card in the stack. Nothing covers the last
   * card, so it must not run the recede: this card's own `.room-slot` sibling
   * is sized to `(room-count − i − 1) × card-height`, which is `0px` for the
   * last card — a named view-timeline with a zero-length range has no
   * progress to make, so it resolves to 100% immediately and the recede's END
   * keyframe applies from the first frame, not `view()` tracking flow
   * position (this card is never the timeline's own source; see
   * `app/globals.css`'s comment above `.room-stack`). Measured with the
   * exemption removed: the last card sat at `opacity: 0.55` / `scale: 0.94`
   * for nearly the entire time it was on screen — 35/36 samples at Vann@390,
   * 37/38 at Tola@1440, not a brief tail — with the already-dimmed deck
   * behind it bleeding through the whole time. See `app/globals.css`'s
   * `[data-room-card-last]` rule.
   */
  isLast?: boolean;
  /** The id of this room's gallery panel (`RoomCardStack` composes it). When
   * given, the photo becomes the panel's declarative popover trigger; when
   * absent the photo is just a photo. No listener either way. Task 6 wires
   * this — it is unused here, and no button may render before it: the
   * trigger's copy comes from `SITE.roomGallery`, which does not exist yet. */
  galleryId?: string;
}) {
  const aspect = roomCardAspect(room.mediaId);

  // Unique per card, not shared — see `.room-slot`'s comment in
  // `app/globals.css` for why every card needs its own named timeline rather
  // than all of them sharing one.
  const slotTimelineName = `--room-slot-${index}`;

  const photo = (
    <Photo
      id={room.mediaId}
      sizes={ROOM_CARD_SIZES}
      box={Math.max(aspect, ROOM_CARD_MIN_BOX)}
      pictureClassName="block h-full w-full"
      className="h-full w-full object-cover"
    />
  );

  return (
    <>
      <li
        aria-hidden="true"
        className="room-slot"
        style={
          {
            "--i": String(index),
            viewTimelineName: slotTimelineName,
          } as React.CSSProperties
        }
      />
      <li
        className={`room-card flex flex-col overflow-hidden lg:flex-row lg:items-stretch${
          index % 2 === 1 ? " lg:flex-row-reverse" : ""
        }`}
        data-card-layout="beside"
        data-room-card-last={isLast ? "" : undefined}
        style={
          {
            "--i": String(index),
            animationTimeline: slotTimelineName,
            // The opposite paper to the section, so the deck is visible against
            // it. Inside a `surface` chapter `--bg` is the deeper paper (see the
            // note on `--paper` in `app/layout.tsx`), which is why this reaches
            // for `--paper` and not `--bg`.
            backgroundColor: onSurface ? "var(--paper)" : "var(--surface)",
          } as React.CSSProperties
        }
      >
        {/*
         * `flex-none` (not `flex-1`): the aspect-ratio, not flex-grow,
         * decides this box's height below `lg` (and drops out of the running
         * above it, where `lg:items-stretch` on the card takes over sizing
         * this axis). `flex-1` and `aspect-ratio` fight over a flex item's
         * main-size — flex-1 usually wins, which is exactly how this box got
         * tall enough to crop a wide photograph's width in the first place.
         *
         * The wrapper is 60% of the card at `lg`, 65% at `xl` (`ROOM_CARD_SIZES`'s
         * own comment). At that width and the card's own full (stretched)
         * height, the box's OWN aspect can drop under the 25% width-crop
         * bound depending on the card's shape — see the `max-height` rule
         * this feeds, in `app/globals.css`, for the failure that solves and
         * the numbers behind it. Below `lg` it still needs the aspect-ratio:
         * there the card is a column and the photo would otherwise be full
         * height again.
         *
         * `min-h-0` is not decorative. A flex item's default `min-height` is
         * `auto`, which resolves to the LARGER of any explicit min-height and
         * an automatic, content-based minimum — and for a box whose only
         * child is a replaced element (the `<img>`, carrying real `width`/
         * `height` HTML attributes so the browser knows its aspect before a
         * byte arrives), that automatic minimum is derived from the IMAGE's
         * own aspect ratio, not this box's declared `aspect-ratio`. Below
         * `lg`, with width stretched to the card's full width, that content
         * minimum only exceeds the `aspect-ratio`-derived height for a
         * PORTRAIT photograph narrower than the box ratio — `tola-room-family`
         * (0.67:1) is the only one; every other room is wider than its own
         * box and never triggers it. Measured on the live page before this
         * line existed: at 390px the wrapper rendered 513px tall against the
         * 273.6px `aspect-ratio: 1.25` was supposed to produce (342 / 1.25) —
         * 239px of photograph eating into the card's fixed height where the
         * text block was budgeted to sit, and at 768px the wrapper alone
         * (1008px) already exceeded the entire 760px card. That is
         * `docs/reviews/2026-08-11-card-stack/README.md`'s "Family Suite fix"
         * section's defect: Family Suite's text was never both on screen and
         * undimmed, because `overflow-hidden` on `.room-card` was clipping it
         * every time. `min-h-0` removes the automatic minimum and lets the
         * declared `aspect-ratio` govern for every photograph, portrait
         * included — confirmed live: with it, the same wrapper renders
         * 273.6px, exactly `342 / 1.25`. At `lg` and up this is a no-op: both
         * axes are already definite there (`lg:w-[60%]` and the card's own
         * `lg:items-stretch` height), and a definite size leaves nothing for
         * min-height to clamp.
         */}
        <div
          className="min-h-0 flex-none lg:w-[60%] xl:w-[65%]"
          style={
            {
              aspectRatio: String(Math.max(aspect, ROOM_CARD_MIN_BOX)),
              // Same shape again, as a custom property: `app/globals.css`'s
              // `lg`-and-up rules for this box read it too, to cap this box's
              // height once `lg:items-stretch` (the card's own class, above)
              // takes over sizing this axis and `aspect-ratio` stops winning.
              // One JS value feeding both is what keeps the inline
              // `aspect-ratio` (below `lg`) and the CSS `max-height` (from
              // `lg` up) from ever disagreeing about the bound.
              "--room-photo-aspect": String(ROOM_PHOTO_KEEP * aspect),
            } as React.CSSProperties
          }
        >
          {/* Task 6 wraps `photo` in the gallery's popover-trigger button when
              `galleryId` is given (the copy for its aria-label arrives with
              `SITE.roomGallery` in the same task). In THIS task, render the
              photo bare — `galleryId` is never passed yet: */}
          {photo}
        </div>

        {/*
         * `shrink-0` (its own content size), not `flex-1`: with the photo now
         * `flex-none` above, the leftover height belongs at the FOOT of the
         * card (ordinary padding below a natural-height text block), not
         * split around the words themselves. `flex-1` here was tried and
         * rejected — it stretches this block to fill the whole remainder and
         * `justify-center` then centres the words inside it, which reads as
         * text floating in a void rather than a caption under a photograph.
         * `lg:flex-1` is unrelated: at `lg` and up the card is a ROW, so this
         * governs the WIDTH left over beside the photo, not height, and stays
         * needed.
         */}
        <div className="flex shrink-0 flex-col justify-center gap-3 px-6 py-6 md:px-10 lg:flex-1">
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
    </>
  );
}
