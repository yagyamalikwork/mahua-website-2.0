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
 * **The photo area's aspect ratio is enforced, not left to whatever the flex
 * layout leaves over** (fix round, 11 Aug 2026 — `docs/reviews/2026-08-11-card-stack/
 * task-6-fix-report.md`'s "defect B"). Before this, `ROOM_CARD_BOXES` only fed
 * `sizes` (which *file* to fetch); nothing constrained the rendered box, and up to
 * 66.6% of a photograph's width was being cropped away. See `ROOM_CARD_BOXES`'s own
 * comment for the exact numbers and why both values are the minimum that clears the
 * 25% bound, not "as wide as possible".
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

/** Exported for `lib/sizes.test.ts`, like every other section's. */
export const ROOM_CARD_SIZES: Record<RoomCardLayout, string> = {
  stacked: "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 144px), calc(100vw - 48px)",
  beside: "(min-width: 1024px) 60vw, calc(100vw - 48px)",
};

/**
 * The photo area's ENFORCED MINIMUM aspect ratio per composition, applied to
 * the rendered box via CSS `aspect-ratio` (not just fed to `sizes` as before —
 * fix round, 11 Aug 2026, "defect B"). A box at least this wide (relative to
 * its height) loses no more than 25% of a photograph's width to crop — the
 * bound `docs/superpowers/specs/2026-08-11-room-card-stack-design.md` §3 sets.
 *
 * **Both values are the minimum that satisfies that 25% bound for the widest
 * photograph in the layout, not "wider than everything" the way the retired
 * 2.9/0.86 pair was** (2.9 covered every stacked photo with room to spare, but
 * spare room is exactly what created a large gap between the photo and the
 * words at narrow widths — see the note on `RoomCard`'s photo wrapper for why
 * a looser bound was the fix, not a tighter one).
 *
 * `stacked: 2.0` — widest stacked photograph is `vann-room-cottage-plain` at
 * 2.45:1 (1440×588). `1 − 2.0/2.45 = 18.3%` lost, inside the 25% bound with
 * margin; `vann-room-deluxe`/`tola-room-deluxe`/`tola-room-suite`/
 * `tola-room-camping` (all 2.29:1) lose 12.6%.
 *
 * `beside: 1.25` — widest `beside` photograph is `suite-tiger-painting` at
 * 1.50:1 (1440×961). `1 − 1.25/1.50 = 16.7%` lost. `tola-room-family` (0.67:1,
 * portrait) is already narrower than 1.25, so it crops height only regardless
 * — unaffected by this number.
 *
 * (0.86, the value this replaced on 11 Aug 2026, covered the portrait but not
 * `suite-tiger-painting` — up to 48.6% lost, one of `check_card_stack.mjs`'s
 * two original failures.)
 *
 * **"applied via CSS `aspect-ratio`" above is only the whole truth below `lg`.**
 * At `lg` and up, `beside`'s wrapper switches to `lg:w-[60%]` of a card whose
 * height is `lg:items-stretch`-ed to the card's own full (fixed) height —
 * both axes definite, so the browser uses the stretched height and
 * `aspect-ratio` is overridden outright, not just outweighed. That was never
 * enforced at four review widths and failed hard outside them — 51.1% lost
 * on an iPad Pro portrait (1024×1366), against the 25% bound this whole
 * export exists to satisfy. `app/globals.css`'s `max-height` rule on the
 * `beside` wrapper (scoped `@media (min-width: 1024px)`, reading this same
 * number back through `--room-photo-aspect`, set below) is what makes the
 * floor real at `lg` and up too — see that rule's comment for the mechanism.
 */
export const ROOM_CARD_BOXES: Record<RoomCardLayout, number> = {
  stacked: 2.0,
  beside: 1.25,
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
}) {
  const layout = roomCardLayout(room.mediaId);
  const beside = layout === "beside";

  // Unique per card, not shared — see `.room-slot`'s comment in
  // `app/globals.css` for why every card needs its own named timeline rather
  // than all of them sharing one.
  const slotTimelineName = `--room-slot-${index}`;

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
        className={`room-card flex overflow-hidden ${
          beside ? "flex-col lg:flex-row lg:items-stretch" : "flex-col"
        }`}
        data-card-layout={layout}
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
         * `flex-none` (not the old `flex-1`): the aspect-ratio, not
         * flex-grow, decides this box's height below `lg` (and its width
         * above it for `stacked`, which is always this shape). `flex-1` and
         * `aspect-ratio` fight over a flex item's main-size — flex-1 usually
         * wins, which is exactly how this box got tall enough to crop a wide
         * photograph's width in the first place.
         *
         * `beside` widens to 60% of the card at `lg` and up (from the 46%
         * every earlier draft used) and drops the aspect-ratio there in favour
         * of `lg:items-stretch` on the card (unchanged, above): at 60% wide and
         * the card's own full height, the box's OWN aspect already clears the
         * 25% bound (≈19–21% lost across the four review widths — see
         * `ROOM_CARD_BOXES`'s comment) with no shrinking needed, so the
         * photograph fills the card top-to-bottom instead of leaving a band of
         * plain paper beneath it. Below `lg` it still needs the aspect-ratio:
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
         * (0.67:1) is the only one; every other room, `beside` or `stacked`,
         * is wider than its own box and never triggers it. Measured on the
         * live page before this line existed: at 390px the wrapper rendered
         * 513px tall against the 273.6px `aspect-ratio: 1.25` was supposed to
         * produce (342 / 1.25) — 239px of photograph eating into the card's
         * fixed height where the text block was budgeted to sit, and at 768px
         * the wrapper alone (1008px) already exceeded the entire 760px card.
         * That is `docs/reviews/2026-08-11-card-stack/README.md`'s "Family Suite
         * fix" section's defect: Family Suite's text was never both on screen and undimmed,
         * because `overflow-hidden` on `.room-card` was clipping it every
         * time. `min-h-0` removes the automatic minimum and lets the declared
         * `aspect-ratio` govern for every photograph, portrait included —
         * confirmed live: with it, the same wrapper renders 273.6px, exactly
         * `342 / 1.25`. At `lg` and up this is a no-op: both axes are already
         * definite there (`lg:w-[60%]` and the card's own `lg:items-stretch`
         * height), and a definite size leaves nothing for min-height to clamp.
         */}
        <div
          className={`min-h-0 ${beside ? "flex-none lg:w-[60%]" : "flex-none"}`}
          style={
            {
              aspectRatio: String(ROOM_CARD_BOXES[layout]),
              // Same number again, as a custom property: `app/globals.css`'s
              // `lg`-and-up rule for `beside` cards reads it too, to cap this
              // box's height once `lg:items-stretch` (the card's own class,
              // above) takes over sizing this axis and `aspect-ratio` stops
              // winning. One JS value feeding both is what keeps the inline
              // `aspect-ratio` (below `lg`) and the CSS `max-height` (from
              // `lg` up) from ever disagreeing about the bound — see that
              // rule's own comment for why a second, independently-chosen
              // number here reopened this exact defect once already.
              "--room-photo-aspect": String(ROOM_CARD_BOXES[layout]),
            } as React.CSSProperties
          }
        >
          <Photo
            id={room.mediaId}
            sizes={ROOM_CARD_SIZES[layout]}
            box={ROOM_CARD_BOXES[layout]}
            pictureClassName="block h-full w-full"
            className="h-full w-full object-cover"
          />
        </div>

        {/*
         * `shrink-0` (its own content size), not `flex-1`: with the photo now
         * `flex-none` above, the leftover height belongs at the FOOT of the
         * card (ordinary padding below a natural-height text block), not
         * split around the words themselves. `flex-1` here was tried and
         * rejected — it stretches this block to fill the whole remainder and
         * `justify-center` then centres the words inside it, which reads as
         * text floating in a void rather than a caption under a photograph.
         * `lg:flex-1` on `beside` is unrelated: at `lg` and up the card is a
         * ROW, so this governs the WIDTH left over beside the photo, not
         * height, and stays needed.
         */}
        <div
          className={
            beside
              ? "flex shrink-0 flex-col justify-center gap-3 px-6 py-6 md:px-10 lg:flex-1"
              : // Tighter at `lg` and up ONLY — see `ROOM_STACK.textReserve` in
                // `lib/motion.ts`: the photo's height ceiling frees a fixed
                // budget for this block, and every px this padding gives up is
                // a px the photo gets back. `gap-3`/`py-6` (this block's
                // ordinary size, unchanged below `lg`, where the ceiling never
                // binds) versus `lg:gap-2 lg:py-4` measured a 24px saving —
                // recovered as photograph, not spent on more cream, and it is
                // that recovery, not the reserve number alone, that gets
                // `vann-rooms`/`tola-rooms` back under the 45% ceiling
                // (non-negotiable #8) after the photo stopped over-cropping.
                "flex shrink-0 flex-col justify-center gap-3 py-6 px-6 md:px-10 lg:gap-2 lg:py-4"
          }
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
    </>
  );
}
