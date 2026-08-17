import { Photo } from "@/components/ui/Photo";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import type { ExperienceCopy } from "@/content/home";
import { SITE } from "@/content/site";
import { coverflowNeighbours, coverflowTargetId } from "@/lib/coverflow";
import { COVERFLOW } from "@/lib/motion";

/**
 * How wide this card is actually drawn, at every viewport.
 *
 * **The card is bounded by the STAGE it is centred in, not by the viewport, and
 * that correction is 17 Aug 2026's.** In CSS the width is
 * `min(--coverflow-card-max, 100%, 100vw − 2 × --coverflow-gutter)`: never wider
 * than its solved cap, never wider than the box holding it, and never closer to
 * the screen's edge than the gutter. The middle term is the one that matters and
 * it is an invariant — a card cannot exceed its stage whatever `ChapterSurface`
 * does to its own padding.
 *
 * **It read `min(cardMaxPx, 100vw − 2 × stageGutterPx)` until then, and that was
 * a real defect on real screens.** `stageGutterPx` is 24 and the container is
 * `px-6 md:px-12`, so from 768px up the container takes 48px a side and the card
 * came out up to 48px WIDER than the stage. `margin-inline: auto` against
 * `left: 0; right: 0` with an over-constrained width resolves by CSS 2.1
 * §10.3.7 — the auto margins go to zero and the box is pushed to the inline
 * start — so every card sat 22-25.6px right of centre, with 47px of cream one
 * side and 1px the other, at every scroll position from 768px to 996px (the band
 * the card's cap put it in at the time — the cap is 1217px now, so the same
 * defect would have run from 768px all the way to 1313px). Nothing
 * measured it, because `check_coverflow.mjs` sampled 1440 and 390 and this
 * project's four fixed widths step straight over the band. That rig now sweeps
 * 360-1920 continuously and asserts the card's rendered width IS
 * `min(cardMax, stageWidth)` — see `docs/reviews/2026-08-16-coverflow/
 * rig-failures.md`.
 *
 * **`sizes` still has to spell the container's arithmetic out, and that is not
 * avoidable.** It is an HTML attribute evaluated before layout or custom
 * properties exist, so it cannot say `100%`. The three arms below are
 * `min(cardMaxPx, containerContentWidth)` written in `vw`, interpolated from
 * `COVERFLOW`'s own numbers so the two cannot drift by transcription:
 *
 * | viewport | container content | card |
 * |---|---|---|
 * | < 768px | `100vw − 48` | `100vw − 48` |
 * | 768-1313px | `100vw − 96` | `100vw − 96` |
 * | ≥ 1313px | `100vw − 96` | a flat 1217px |
 *
 * 1313 is exact, not rounded: `100vw − 96 ≥ 1217 ⟺ 100vw ≥ 1313`. The
 * container's own `max-w-[1600px]` never enters it — above 1696px the content box
 * holds at 1504px, which is still wider than `cardMaxPx`, and would only start to
 * bind if a future sweep took the card past 1504. `ui/Photo.tsx`'s comment is
 * explicit that a `sizes` must round *up* where it is unsure; nothing here is
 * unsure, because every arm is the layout's own arithmetic.
 *
 * Current value: `(min-width: 1313px) 1217px, (min-width: 768px)
 * calc(100vw - 96px), calc(100vw - 48px)`. **`cardMaxPx` has been swept twice —
 * 560 → 900 on 16 Aug 2026, and 900 → 1217 on 17 Aug against the client's
 * re-exported photographs** — and this line has not been touched either time.
 * That is the whole point of interpolating it from `COVERFLOW`: the breakpoint
 * and the width both moved by 400px and nothing here could drift, because there
 * is no second copy of the number to drift from.
 */
export const CARD_SIZES = `(min-width: ${COVERFLOW.cardMaxPx + 2 * COVERFLOW.stageGutterMdPx}px) ${COVERFLOW.cardMaxPx}px, (min-width: ${COVERFLOW.stageGutterMdFromPx}px) calc(100vw - ${2 * COVERFLOW.stageGutterMdPx}px), calc(100vw - ${2 * COVERFLOW.stageGutterPx}px)`;

/**
 * The card's shape, and the box the photograph is `object-cover` inside.
 *
 * **The 16 Aug derivation of this number is dead and the number survived it —
 * for a different reason, and with a great deal more room.** It used to read:
 * three of the six frames are 2.29:1 panoramas cropped for `/mahua-vann`, their
 * widest tier is 2.2925, this project's bound is that no photograph loses more
 * than 25% of its width (`check_card_stack.mjs` assertion 6, which the
 * coverflow's rig inherits), so the box may not be narrower than
 * `0.75 × 2.2925 = 1.7194` — and 16:9 was the only standard ratio above it, at
 * 22.45% cropped with 2.55 points to spare. It also concluded that **no portrait
 * or square card was available**.
 *
 * **The client re-exported all six frames at 1344 × 685 on 17 Aug 2026**, so the
 * widest tier is **1.9620** and the minimum box is `0.75 × 1.9620 = 1.4715`. 16:9
 * now crops **9.4%**, not 22.45%; 3:2 is available and crops 23.5%; and a box as
 * tall as 1.4715 would clear the bound. The old sentence about portrait cards no
 * longer holds.
 *
 * **16:9 is kept, and the reason is now the card's own words rather than the
 * crop.** Measured on the rendered card — the content block's height against the
 * card's content box, which is what decides whether the heading is clipped by
 * this element's own `overflow: hidden`:
 *
 * | box | crop | draw factor | resolution ceiling | free space at **390** | at 768 |
 * |---|---|---|---|---|---|
 * | **16/9 = 1.7778** | 9.4% | ×1.1036 | 1217px card | **23px** | 191px |
 * | 1344/685 = 1.9620 | 0% | ×1.0000 | 1344px card | **5px** | 156px |
 * | 3/2 = 1.5 | 23.5% | ×1.3080 | 1027px card | 59px | 261px |
 *
 * At 390 the words are **58%** of the card's height (they are 27% at 1440 — see
 * `Coverflow.tsx`'s `CARD_SCRIM`), so 390 is where a shorter box bites, and the
 * photographs' own ratio leaves five pixels there: one copy edit, one font
 * fallback, one longer activity title from a clipped heading, silently. And at
 * every box's own resolution ceiling the card is **685px tall** — the ceiling is
 * by definition the width at which the box's height equals the file's — so all
 * three leave the same 476px inside the card at 1440 and a wider box buys width
 * and nothing else.
 *
 * The tallest frame in the set is *narrower* than this box, so `cover` crops its
 * height instead — unbounded by design, the same convention `ROOM_CARD_MIN_BOX`
 * records.
 *
 * `lib/sizes.test.ts` holds this to the `aspect-[16/9]` class below in both
 * directions; changing one without the other is a red test, not a soft
 * photograph found in a screenshot three tasks later. `CoverflowCard.test.tsx`
 * holds it against `COVERFLOW.cardMaxPx` and the library's own file widths,
 * which is the half `lib/sizes.test.ts` cannot see.
 */
export const CARD_BOX = 16 / 9;

/**
 * One activity, as a photograph with its own words laid on it.
 *
 * **The client's second ruling of 16 Aug 2026** — *"like section between the
 * 01-The Lodges and 02-Rooted Like The Mahua, where we have an image with text
 * on it"* — which is `components/sections/FullBleedQuote.tsx`, and this
 * inherits its arrangement deliberately: **the card is the box and the
 * photograph is absolute inside it**, not a photograph with text absolutely on
 * top. That distinction only shows on a landscape phone, where the second
 * arrangement puts the type through the bottom of the frame and the first grows
 * the box instead. See the plan's correction C.
 *
 * **This knows nothing about animation, position or its neighbours' geometry.**
 * It is built in flow, on purpose: a card that is correct as a plain block is a
 * card whose failures once `Coverflow.tsx` pins it are certainly the
 * animation's. `RoomCard` was debugged the other way round and it cost a fix
 * round (`docs/DECISIONS.md` §17).
 *
 * ## Three things here that are not free to change
 *
 * 1. **Every word on the card is `var(--bg)` cream.** `var(--text)` ink on a
 *    photograph is exactly the failure CLAUDE.md's contrast rule exists to
 *    prevent, and `--accent-text` gold is legible on cream and *only* on cream
 *    (non-negotiable #7 — it measured 3.43:1 on the menu's glass and 2.0:1 on
 *    the footer's brown). The one gold thing on a normal card of this site — a
 *    `ChapterMark`'s hairline — is deliberately absent for that reason.
 * 2. **The wash is a prop, and the six real figures are solved in Task 8**
 *    against the rendered page, per photograph, keyed by `MediaId` in
 *    `Coverflow.tsx`. Six frames are six exposures; one figure for all of them
 *    is what `Scrim`'s own comment records as having produced mud.
 * 3. **The veil is scrim over the photograph, never opacity on the card.**
 *    `COVERFLOW.sideVeil`, not a `sideDim`: this card's type sits ON its own
 *    photograph, so fading the card would fade the type against the frame
 *    beneath it and the depth cue would be fighting the legibility floor. More
 *    wash recedes the photograph *and* raises cream type's contrast.
 *
 * ## What this card deliberately does NOT carry: its own scroll target
 *
 * The plan's Task 5 sketch put `<a id={coverflowTargetId(...)}>` inside the
 * card. **Task 1's probe measured that placement wrong and it is not built
 * here** — `docs/reviews/2026-08-16-coverflow/task-1-timeline-probe.md` §8. The
 * targets are zero-size boxes absolutely positioned *in the tall wrapper*, at
 * `header-height − 100svh + (i + 1) × step-px`, because an anchor inside the
 * sticky stage has no document offset that corresponds to the moment its card
 * is centred: the naive placement lands with a **slope** of −66 + 11·i px, and
 * a nudge tuned on card 3 is 33px out at both ends. `Coverflow.tsx` (Task 6)
 * owns those targets. This card composes the *href* from the same
 * `coverflowTargetId` they will use, which is the whole reason that helper
 * exists — a link and its target cannot disagree about an id neither of them
 * spells out.
 */
export function CoverflowCard({
  experience,
  scrim,
  index,
  count,
  chapterId,
  previousTitle,
  nextTitle,
}: {
  experience: ExperienceCopy;
  /**
   * The wash between this photograph and the cream type on it.
   *
   * **Ship-blocking placeholder until Task 8.** `Coverflow.tsx` passes a
   * deliberately *heavy* `{ flat: 0.5 }` for all six today; Task 8 solves each
   * one against the rendered page, raising it until the worst single pixel
   * under the type clears its floor and no further, and adds a run per card to
   * `scripts/check_contrast_over_photos.mjs` (that table is hand-written and
   * discovers nothing — a card absent from it is a card nobody has checked).
   * Heavy fails towards legible-but-muddy, which a reviewer sees; light fails
   * towards illegible, which they may not.
   */
  scrim: ScrimStrength;
  /** Which activity this is — its number, its words, and the card(s) it points at. */
  index: number;
  count: number;
  chapterId: string;
  /**
   * The titles of the cards the arrows point at.
   *
   * **Optional, and `Coverflow.tsx` must nonetheless always pass the ones that
   * exist.** Ten links would otherwise be announced as "Previous" and "Next"
   * five times each with nothing to tell them apart. They are props rather than
   * a lookup because this component must not reach into `content/` for words
   * that belong to a *different* card — the section knows the running order; a
   * card does not.
   *
   * The first card has no `previousTitle` and the last no `nextTitle`, because
   * neither has the arrow that would carry it (`coverflowNeighbours`).
   */
  previousTitle?: string;
  nextTitle?: string;
}) {
  const { previous, next } = coverflowNeighbours(index, count);

  /**
   * Which of the two special parts on the stage this card plays, if any.
   *
   * A sticky stage is on screen for its own height of scroll before it locks and
   * again after it lets go, and the two end cards are held at CENTRE across those
   * two stretches — so activity 1 is what a visitor meets when the chapter
   * arrives and activity 6 is still there as it leaves, rather than the stage
   * riding in and out empty. `app/globals.css` addresses both by this attribute.
   *
   * **It was four roles until 18 Aug 2026**: two wrap-around ghosts were held at
   * the flanks at those same two moments, and the client has now seen the loop
   * and ruled it out (*"let's make it linear and just keep it 01 to 06"*). The
   * ghosts and their two roles are gone; **these two are not, and the separation
   * is exactly why they survived it.** The holds were moved off the ghosts and
   * onto the two real end cards on 17 Aug, so that they did not depend on the
   * ghosts — see `docs/reviews/2026-08-16-coverflow/linear.md`.
   *
   * **A role, not a position, and that is 17 Aug 2026's correction.** The CSS said
   * `:first-child` / `:last-child`, which meant "the two ghosts" only because the
   * ghosts happened to be both the outermost cards and the cards that held; the
   * step arithmetic split those two facts apart. Those selectors would happen to
   * be correct again now that the deck is six cards and nothing else, which is
   * precisely the coincidence `.room-card[data-room-card-last]`'s own recorded
   * lesson says not to build on.
   *
   * It is derived here rather than passed in because it is a pure function of two
   * props this card already has.
   */
  const role = index === 0 ? "hold-first" : index === count - 1 ? "hold-last" : undefined;

  const arrow =
    "rule-in font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em] text-[color:var(--bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bg)]";

  return (
    <li
      className="coverflow-card relative isolate flex aspect-[16/9] flex-col justify-end overflow-hidden p-5 md:p-7"
      data-cf={role}
      style={
        {
          "--i": String(index),
          // The width `CARD_SIZES` above describes, and the reason it is here
          // rather than in `app/globals.css`: the two must move together, and
          // one file is the only place that can be true. Inline so a card is
          // correct as a plain block with no stylesheet of its own —
          // `Coverflow.tsx` positions it, it does not size it.
          //
          // **`100%` is the term that was missing, and it is the whole of 17
          // Aug 2026's fix.** It resolves against the stage — the flex
          // container in flow, the sticky containing block once the effect is
          // on — so a card can never be wider than the box it is centred in,
          // whatever padding `ChapterSurface` puts around it. The viewport term
          // stays as a floor on cream at the screen's edge; the cap is the
          // photographs' own resolution ceiling (`COVERFLOW.cardMaxPx`).
          width: `min(var(--coverflow-card-max), 100%, 100vw - 2 * var(--coverflow-gutter))`,
          // The one dark colour on the page, under the photograph rather than
          // over it — so a card is a card before a byte of imagery arrives,
          // and the blur placeholder is never a white hole. `FullBleedQuote`
          // does exactly this.
          backgroundColor: "var(--overlay)",
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 -z-10">
        <Photo
          id={experience.mediaId}
          sizes={CARD_SIZES}
          box={CARD_BOX}
          // The words on this card ARE its accessible content, exactly as with
          // `FullBleed` under a quote — see `ui/Photo.tsx`'s note on
          // `decorative`. Announcing the alt text as well would read the
          // activity twice, once as a caption of a place and once as a
          // description of a picture of it.
          decorative
          pictureClassName="block h-full w-full"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 -z-10">
        <Scrim {...scrim} />
      </div>
      {/* The veil that recedes a neighbour. Its opacity is keyframed by
          `app/globals.css` off `--coverflow-side-veil` (Task 6) — a CSS
          animation outranks this inline `opacity: 0`, which is what keeps the
          card unveiled in flow, with no stylesheet and under reduced motion.
          It is a wash over the photograph, never an opacity on the card. */}
      <div
        aria-hidden="true"
        className="coverflow-veil pointer-events-none absolute inset-0 -z-10"
        style={{ backgroundColor: "var(--overlay)", opacity: 0 }}
      />

      {/* `data-contrast` rather than a structural selector: Task 8's six runs in
          `check_contrast_over_photos.mjs` need a hook that survives this block
          being re-composed, which is the lesson that file's own
          `brand-wordmark` comment records — a run whose selector went stale
          reported "not visible" and was neither a pass nor a failure. */}
      <div data-contrast="coverflow-card" className="relative">
        <p className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em] text-[color:var(--bg)]">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.15rem,2.6vw,1.75rem)] font-light leading-tight tracking-[-0.01em] text-[color:var(--bg)]">
          {experience.title}
        </h3>
        {/* `clamp()`, not a breakpoint step: the card's height is its width
            divided by 16/9 and therefore continuous, so the type that has to
            fit inside it must be continuous too. A stepped size is what leaves
            a card legible at 1440 and clipped at 1100 — the shape of defect
            this project has now shipped twice between its fixed sample widths
            (`DECISIONS.md` §2 #44-45, #52-53). */}
        <p className="mt-2 max-w-[42ch] font-[family-name:var(--font-body)] text-[clamp(0.76rem,1.32vw,0.98rem)] leading-[1.55] text-[color:var(--bg)]">
          {experience.body}
        </p>
      </div>

      {/*
        Named, because five unnamed `<nav>` landmarks on one page are five
        identical entries in a screen reader's landmark list. The activity's own
        title is the name — no new copy, and distinct by construction.

        **An end of the carousel is an end, 18 Aug 2026.** The first card renders
        no "previous" and the last renders no "next", because there is no such
        card to point at (`coverflowNeighbours`). An arrow that wrapped round
        would be the loop the client has just asked to be rid of, arriving by a
        different route — his own sentence for how to get back is *"they will
        have to scroll back to card 01"*.

        Rendering a *disabled* arrow instead was considered and rejected: it is a
        control that announces itself and then refuses, on a card where the only
        other affordance is the scroll the visitor is already using. The rule
        above stays whole either way — it is the card's own hairline, not the
        arrows' — and the `<nav>` itself goes only if a card has no arrows at
        all, which no six-activity chapter produces.
      */}
      {(previous !== null || next !== null) && (
        <nav
          aria-label={experience.title}
          className="coverflow-arrows relative mt-4 flex items-center justify-between gap-6 border-t pt-3"
          // `--accent` gold, not cream: the hairline carries no text, and a rule
          // is the one thing non-negotiable #7 says gold IS for. The words above
          // and below it are cream, which is the half of that rule that binds.
          style={{ borderColor: "var(--accent)" }}
        >
          {previous !== null && (
            <a
              href={`#${coverflowTargetId(chapterId, previous)}`}
              aria-label={
                previousTitle
                  ? `${SITE.coverflow.previous} — ${previousTitle}`
                  : SITE.coverflow.previous
              }
              className={arrow}
            >
              {SITE.coverflow.previous}
            </a>
          )}
          {next !== null && (
            // `ml-auto` as well as `justify-between`: with both arrows present
            // the two are identical, and on the FIRST card — where "next" is the
            // only child — `justify-between` would put it at the inline start,
            // under the words, where a "next" reads as a "previous" that has
            // lost its label.
            <a
              href={`#${coverflowTargetId(chapterId, next)}`}
              aria-label={nextTitle ? `${SITE.coverflow.next} — ${nextTitle}` : SITE.coverflow.next}
              className={`${arrow} ml-auto`}
            >
              {SITE.coverflow.next}
            </a>
          )}
        </nav>
      )}
    </li>
  );
}
