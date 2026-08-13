import { Photo } from "@/components/ui/Photo";
import { roomCardAspect } from "@/lib/room-card";
import type { CoverBox } from "@/lib/sizes";
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
 * height crop) and `ROOM_PHOTO_KEEP` (plus `ROOM_PHOTO_MARGIN`) bounds the
 * 25% width-crop rule (`check_card_stack.mjs` assertion 6) above it, both
 * read off the photograph's own WORST-CASE aspect (`roomCardAspect`, which
 * reads every emitted tier, not only the canonical one) rather than a
 * constant per layout — see each export's own comment. The same solved
 * quantity also feeds the `<Photo>`'s `box` prop below `lg` and up, so
 * `sizes` never under-states what `object-cover` actually draws once the cap
 * narrows the box past the photograph's own shape (image-sizing Task 4
 * review, Critical 2, 14 Aug 2026).
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
 * SOLVED per card as `(ROOM_PHOTO_KEEP + ROOM_PHOTO_MARGIN) x the photo's own
 * WORST-CASE aspect`, so the `max-height` cap in `app/globals.css` holds the
 * bound at every viewport shape by construction — the 1024x1366 class of
 * failure (§2 #42) cannot be re-created by a new photograph or a new screen
 * shape. A hand-picked per-layout number is exactly what §2 #42 shipped.
 *
 * This constant alone is the rig's own number (0.75 kept = 25% lost) and
 * nothing more — the margin that makes it safe to solve against lives
 * separately, in `ROOM_PHOTO_MARGIN`, so this one stays legible as "the bound
 * the rig enforces" rather than a number already hedged by an unstated
 * amount. */
export const ROOM_PHOTO_KEEP = 0.75;

/**
 * Deliberate headroom on top of `ROOM_PHOTO_KEEP`, in the same units (a
 * fraction of the photograph's width). Solving `--room-photo-aspect` at
 * EXACTLY `ROOM_PHOTO_KEEP` is not safe, even once `roomCardAspect` is solved
 * against the worst emitted tier (above) — a SEPARATE, dominant source of
 * error survives that fix, and it lives in the RIG, not in the CSS.
 *
 * **Corrected 14 Aug 2026 (image-sizing Task 4 review, second fix round): the
 * first version of this comment blamed Chromium's `LayoutUnit` (1/64px)
 * rounding `max-height` UP, which would shrink the box's aspect — wrong
 * mechanism, wrong sign, and ~64x too small. Reconstructed against the real,
 * committed geometry and it does not reproduce.** `docs/reviews/
 * 2026-08-11-card-stack/card-stack.json`'s Vann@1280x1024/"Deluxe" row is the
 * clean case: box `723.4181518554688 x 634.57373046875` (the SHIPPED,
 * margined box — read to confirm which card and shape this works from, not
 * as the zero-margin figure itself). Chromium in fact FLOORS the
 * `calc()`, not rounds up — a zero-margin target height of `723.4181.../
 * 1.125 = 643.0384px` floors to `643.03125px`, giving box aspect `1.1250124`
 * and, measured against the served file's TRUE aspect (`vann-room-deluxe`
 * only emits three tiers, 400/640/762, and at this width the widest — 762x508
 * = exactly 1.5 — is what serves it): `(1 −
 * 1.1250124/1.5) × 100 = 24.9992%` — a PASS, by a hair. Quantisation is
 * neutral-to-helpful here, not the failure mode.
 *
 * **What actually breaks a zero-margin build is `check_card_stack.mjs`'s own
 * measuring instrument.** Assertion 6 reads `img.naturalWidth`/
 * `naturalHeight` — and once a `w`-descriptor `srcset` has picked a
 * candidate, the HTML spec has the browser correct BOTH properties by that
 * candidate's own "used density" for this particular box
 * (`check_image_resolution.mjs`'s header comment names the same mechanism:
 * "naturalWidth comes back equal to the CSS layout width for every image").
 * The corrected pair is not any tier's real pixel dimensions — it is a
 * synthetic value, and each of the two numbers is independently rounded to
 * an integer before JS ever reads it. Dividing both by the same density
 * preserves their RATIO only up to that final, independent rounding; after
 * it, the measured ratio can drift from the served file's true aspect by a
 * residual no enumeration of `entry.sources` can see, because the number
 * being measured was never one of those tiers' own dimensions to begin
 * with — this is why the fix above (worst-case tier) narrows but cannot
 * close the gap alone.
 *
 * Measured, not assumed: the SAME Vann@1280x1024/"Deluxe" row's own
 * `naturalWidth`/`naturalHeight` are `1094`/`729` — `1.5006859`, not the
 * file's real `1.5`. Zero margin against the worst emitted tier (`1.5`,
 * correctly solved) but the RIG's measured aspect (`1.5006859`): the SAME
 * floored box aspect (`1.1250124`) now reads `(1 − 1.1250124/1.5006859) ×
 * 100 = 25.0334%` — over the ceiling, on the geometry the rig actually
 * reads, not on the geometry the CSS actually produces.
 *
 * The relative error is `(1.5006859 − 1.5) / 1.5 ≈ 4.573×10⁻⁴` — roughly
 * **64 times** the `7.2×10⁻⁶` the retired comment computed from a mechanism
 * that never reproduced. Absorbing it needs `margin ≥ ROOM_PHOTO_KEEP × ε ≈
 * 0.75 × 4.573×10⁻⁴ ≈ 3.43×10⁻⁴` (the `× ROOM_PHOTO_KEEP` matters: at the
 * worst tier, `widthKept = (KEEP + margin) / (1 + ε)`, and staying `≥ KEEP`
 * needs `margin ≥ KEEP × ε`, not `margin ≥ ε` alone). `0.01` clears that by
 * **~29×** — not the "~1,400×" the retired comment claimed, which combined
 * both errors (the wrong ε and the missing `× KEEP`) into a number ~50x more
 * generous than the real one. 29x is still ample against a single
 * measurement's own rounding noise, and `0.01` costs at most 1% more of a
 * photograph's own width than the bound strictly requires — invisible
 * against the review's own live measurement (12–24% crop across the current
 * library, worst case 24.03%, comfortably under the 25% ceiling at both
 * binding shapes).
 */
export const ROOM_PHOTO_MARGIN = 0.01;

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
  // The one number `--room-photo-aspect` and the `<Photo>`'s own `box` both
  // solve from — see `ROOM_PHOTO_MARGIN`'s comment for why the margin is
  // needed on top of the rig's bare 0.75, and Critical 2's note on `box`
  // below for why the SAME quantity has to feed both.
  const photoTarget = ROOM_PHOTO_KEEP + ROOM_PHOTO_MARGIN;

  // Unique per card, not shared — see `.room-slot`'s comment in
  // `app/globals.css` for why every card needs its own named timeline rather
  // than all of them sharing one.
  const slotTimelineName = `--room-slot-${index}`;

  const photo = (
    <Photo
      id={room.mediaId}
      sizes={ROOM_CARD_SIZES}
      // Corrected 14 Aug 2026 (image-sizing Task 4 review, Critical 2): a
      // single number here, `Math.max(aspect, ROOM_CARD_MIN_BOX)`, told
      // `coverSizes` the rendered box has the SAME aspect as the photograph —
      // true below `lg`, where that is exactly the CSS `aspect-ratio` this
      // wrapper carries, but wrong from `lg` up, where the wrapper is capped
      // to `photoTarget × aspect` (or, when the cap does not bind, the card's
      // own stretched shape — always narrower than the photograph's aspect
      // either way, since the wrapper is only 60–65% of the card's width).
      // `cover` then draws the photograph WIDER than the box regardless, and
      // `sizes` described only the box, not the draw — under-serving
      // resolution by up to `1/ROOM_PHOTO_KEEP ≈ 1.33×` (33%) in the worst
      // case the cap itself allows, and by 9.3% in the specific case
      // measured live: 1440x900 Vann, box 873.6x699, drawn `699 × 1.5006 =
      // 1049px`, but `sizes` resolved a 960-wide file
      // (`check_image_resolution.mjs`, `atLibraryCeiling: false`). A breakpointed box,
      // matching the CSS cap's own `(min-width: 1024px)` turn-on, tells
      // `coverSizes` to assume the WORST case (the cap's own ratio) for every
      // width the cap can apply to, rather than the box's true — and always
      // wider — un-capped aspect. Corrected 14 Aug 2026 (image-sizing Task 4
      // review, second fix round): this used to say over-assuming crop "can
      // only over-serve a tier, never under-serve one" because `grow()`
      // "rounds up only" — false. `lib/sizes.ts`'s `scale()` applies an
      // ordinary `Math.round` to 3dp, which rounds down as readily as up
      // (`lib/sizes.ts:176`); the growth factor here can land marginally
      // under the true worst case. Also true and worth stating plainly: this
      // `box` solves from `roomCardAspect`'s WORST-TIER aspect, but
      // `Photo.tsx`'s `servedSizes` (which this feeds) computes its own
      // `imageAspect` from `media(id).width/height` — the CANONICAL tier,
      // `components/ui/Photo.tsx:15` — so the requested growth sits ~0.11%
      // below the true worst-tier case for a photograph whose tiers disagree
      // (`vann-room-cottage-plain`'s own worked case: worst tier 1.502347 vs
      // canonical 1.500634). Neither gap is being ignored, only sized: both
      // are two-orders-of-magnitude smaller than the review's own measured
      // 1.108 headroom at the tighter binding shape, so the guarantee this
      // comment makes is "asks for enough resolution with wide margin," not
      // "asks for the mathematically maximal amount" — this comment used to
      // promise the stronger claim the code does not deliver. Below `lg` this
      // is unchanged: the wrapper's aspect IS `Math.max(aspect,
      // ROOM_CARD_MIN_BOX)`, no assumption involved.
      box={
        [
          [1024, photoTarget * aspect],
          [0, Math.max(aspect, ROOM_CARD_MIN_BOX)],
        ] as CoverBox
      }
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
        // `lg:flex-row-reverse` is VISUAL reordering only, by design — it
        // never changes DOM order. The photo wrapper stays `card.firstChild`
        // and the words block stays `card.children[1]` on every card, odd or
        // even: `.room-card[data-card-layout="beside"] > :first-child`'s
        // `max-height` cap (`app/globals.css`) and `check_card_stack.mjs`'s
        // assertions 6 and 8 both key off DOM position, not visual side.
        // Reordering the JSX to "match" the reversed layout would silently
        // apply the crop cap to the words block instead of the photo on
        // every odd card, and would hand assertion 8's text sweep the
        // photograph.
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
              // The `lg`-and-up cap's own target, as a custom property:
              // `app/globals.css`'s `lg`-and-up rules for this box read it,
              // to cap this box's height once `lg:items-stretch` (the card's
              // own class, above) takes over sizing this axis and
              // `aspect-ratio` stops winning. `photoTarget` — not the bare
              // `ROOM_PHOTO_KEEP` — is what keeps this bound real rather than
              // exact-with-zero-margin; see `ROOM_PHOTO_MARGIN`'s own comment
              // for the rounding it exists to absorb. One JS value feeding
              // both this and the `<Photo>`'s `box` above is what keeps the
              // inline `aspect-ratio` (below `lg`), the CSS `max-height`
              // (from `lg` up) and `sizes`' own assumption from ever
              // disagreeing about the bound.
              "--room-photo-aspect": String(photoTarget * aspect),
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
