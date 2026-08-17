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
 * | 768-1440px | `100vw − 96` | `100vw − 96` |
 * | ≥ 1440px | `100vw − 96` | a flat 1344px |
 *
 * 1440 is exact, not rounded: `100vw − 96 ≥ 1344 ⟺ 100vw ≥ 1440`. The
 * container's own `max-w-[1600px]` never enters it — above 1696px the content box
 * holds at 1504px, which is still wider than `cardMaxPx`, and would only start to
 * bind if a future sweep took the card past 1504. `ui/Photo.tsx`'s comment is
 * explicit that a `sizes` must round *up* where it is unsure; nothing here is
 * unsure, because every arm is the layout's own arithmetic.
 *
 * Current value: `(min-width: 1440px) 1344px, (min-width: 768px)
 * calc(100vw - 96px), calc(100vw - 48px)`. **`cardMaxPx` has been swept three
 * times — 560 → 900 on 16 Aug 2026, 900 → 1217 on 17 Aug against the client's
 * re-exported photographs, and 1217 → 1344 on 18 Aug when he chose the
 * photographs' own ratio for the box** — and this line has not been touched once.
 * That is the whole point of interpolating it from `COVERFLOW`: the breakpoint
 * and the width have both moved by hundreds of pixels and nothing here could
 * drift, because there is no second copy of either number to drift from.
 *
 * **The card exactly fills its stage at 1440 now, and that is arithmetic rather
 * than a coincidence**: the breakpoint is `cardMaxPx + 2 × stageGutterMdPx`, and
 * `ChapterSurface`'s container at 1440 is `1440 − 96 = 1344`. So 1440 is both the
 * width at which the cap starts to bind and the width at which the container
 * stops being the binding term — they meet, they do not cross, and there is no
 * band in between for a card to be wider than the box holding it.
 *
 * **A fourth bound joined these three on 18 Aug 2026 and it is NOT in this
 * string: the stage's own height.** A card that would be taller than the pinned
 * stage is narrowed until it fits (`app/globals.css`, `--cf-stage-h`), which
 * `sizes` cannot express — it has no access to the viewport's height. It is safe
 * to leave out because it can only ever make the card *smaller*: `sizes` then
 * over-states, which costs a tier of bytes on a short viewport and never ships a
 * soft photograph, and `ui/Photo.tsx` records that as the correct direction to be
 * wrong in. `check_image_resolution.mjs` is what would report the cost.
 */
export const CARD_SIZES = `(min-width: ${COVERFLOW.cardMaxPx + 2 * COVERFLOW.stageGutterMdPx}px) ${COVERFLOW.cardMaxPx}px, (min-width: ${COVERFLOW.stageGutterMdFromPx}px) calc(100vw - ${2 * COVERFLOW.stageGutterMdPx}px), calc(100vw - ${2 * COVERFLOW.stageGutterPx}px)`;

/**
 * The card's shape, and the box the photograph is `object-cover` inside.
 *
 * **It is the photographs' own ratio since 18 Aug 2026 — 1344/685 = 1.9620 — so
 * it crops them not at all.** The client was given four card sizes with a
 * measured sharpness for each and chose *wider only, stay sharp*:
 *
 * | | card at 1440 | area | sharpness |
 * |---|---|---|---|
 * | 16/9, `cardMaxPx` 1217 | 1217 × 685 | — | 1.00 |
 * | **chosen** | **1344 × 685 (1.9620)** | **+10%** | **1.00** |
 * | rejected | 1344 × 754 (1.7825) | +22% | 0.91 |
 * | rejected | 1344 × 823 (1.6331) | +33% | 0.83 |
 *
 * The two rejected rows are what a *taller* card costs: `cover` in a box
 * narrower than the photograph draws it `imageAspect / CARD_BOX` times the
 * card's own width, so a 754px-tall card asks for 1,478px of a 1,344px file and
 * the browser simply serves what it has. **A ratio is a sharpness decision on
 * this card, not only a composition one**, and that is why the four options were
 * put to him as a table rather than as a picture.
 *
 * ## What the two earlier derivations said, kept because the shape is the lesson
 *
 * **16 Aug.** Three of the six frames were 2.29:1 panoramas cropped for
 * `/mahua-vann`; this project's bound is that no photograph loses more than 25%
 * of its width (`check_card_stack.mjs` assertion 6, which the coverflow's rig
 * inherits), so the box could not be narrower than `0.75 × 2.2925 = 1.7194`, and
 * 16:9 was the only standard ratio above it. It also concluded that **no portrait
 * or square card was available**.
 *
 * **17 Aug.** The client re-exported all six at 1344 × 685, so the minimum box
 * became `0.75 × 1.9620 = 1.4715` and three ratios were available. 16:9 was kept
 * anyway, on the card's own words rather than on the crop — measured on the
 * rendered card, the content block's height against the card's content box:
 *
 * | box | crop | draw factor | resolution ceiling | free space at **390** | at 768 |
 * |---|---|---|---|---|---|
 * | 16/9 = 1.7778 | 9.4% | ×1.1036 | 1217px card | **23px** | 191px |
 * | **1344/685 = 1.9620** | **0%** | **×1.0000** | **1344px card** | **5px** | 156px |
 * | 3/2 = 1.5 | 23.5% | ×1.3080 | 1027px card | 59px | 261px |
 *
 * **That 5px is the one real cost of the client's choice, and it is now guarded
 * rather than argued about.** At 390 the words are 58% of the card's height (27%
 * at 1440 — see `Coverflow.tsx`'s `CARD_SCRIM`), so 390 is where a shorter box
 * bites, and five pixels is one copy edit or one font fallback from a heading
 * clipped by this element's own `overflow: hidden`, silently.
 * `scripts/check_coverflow.mjs`'s **assertion 12** measures the words' own box
 * against the card's across the whole 360-1920px sweep, which is the only
 * instrument that can see it. It is also why the type is centred *in the space
 * above the arrows* rather than absolutely over the whole card: a centred block
 * and a bottom-anchored rule cannot collide if the rule is what bounds the space
 * the block is centred in.
 *
 * And at every box's own resolution ceiling the card is **685px tall** — the
 * ceiling is by definition the width at which the box's height equals the file's
 * — so a wider box buys width and nothing else. All three rows above leave the
 * same 476px of card inside a 1440px screen.
 *
 * The tallest frame in the set is *narrower* than this box, so `cover` crops its
 * height instead — unbounded by design, the same convention `ROOM_CARD_MIN_BOX`
 * records. With all six at exactly 1344 × 685 nothing is cropped in either axis
 * today, which is the first time that has been true of any box on this page.
 *
 * **Derived from `COVERFLOW`, not written here.** The same two integers are what
 * `app/globals.css` uses to turn the stage's available HEIGHT into an available
 * width, and a second copy of a ratio is a ratio that can drift.
 * `lib/sizes.test.ts` holds this to the `aspect-[1344/685]` class below in both
 * directions; changing one without the other is a red test, not a soft
 * photograph found in a screenshot three tasks later. `CoverflowCard.test.tsx`
 * holds it against `COVERFLOW.cardMaxPx` and the library's own file widths,
 * which is the half `lib/sizes.test.ts` cannot see.
 */
export const CARD_BOX = COVERFLOW.cardBoxW / COVERFLOW.cardBoxH;

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

  /**
   * The label size shared by the number and the two arrows.
   *
   * **`vw` below its own cap, and that is the whole of the small-screen fix.**
   * Below `md` the card is `100vw − 48` wide and therefore
   * `(100vw − 48) / 1.9620` TALL, so its height is very nearly proportional to
   * the viewport — while type set in `rem` is not proportional to anything. That
   * mismatch is what put "NEXT" on the cream *below* the card at 390 the day this
   * box became 1344/685 (18 Aug 2026, read off a screenshot; every rig on this
   * project passed the same build). Sizing all four of the card's type roles in
   * `vw` under their `rem` caps makes the words a roughly constant FRACTION of
   * the card at every width below ~550px, so a fit at 390 is a fit at 360 as
   * well. `check_coverflow.mjs` assertion 12 is what says so.
   */
  const label = "text-[clamp(0.5rem,2.3vw,0.62rem)]";

  const arrow = `rule-in font-[family-name:var(--font-label)] ${label} uppercase tracking-[0.2em] text-[color:var(--bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bg)]`;

  return (
    <li
      // **No `justify-end` since 18 Aug 2026 — the words are centred.** The
      // client: *"Move the text to the center with 3D effect for all cards like
      // the Tiger image with text that comes after 01-The Lodges or the image
      // that comes before 06-The Lantern Hour."* Those two are `why-you-came`
      // and `after-dark`, both `FullBleedQuote`, and what they have in common is
      // the COMPOSITION — type centred on a photograph — not the type scale: a
      // `FullBleedQuote` is one display line of 1.9-3.9rem and cannot hold a
      // number, a title and a sentence. So this card takes the arrangement and
      // keeps its own three parts. **The "3D effect" is what the carousel
      // already does** — scale, shift and veil on the neighbours (`COVERFLOW`) —
      // and nothing here changes it.
      //
      // The words block below is `flex-1`, so it takes every pixel the arrows do
      // not and centres its content in that. **Centring it over the whole card
      // instead was considered and rejected on arithmetic**: at 390 the card is
      // 342 x 174 and the arrows are ~40 of the 134px of content box, so an
      // absolutely-centred block and a bottom-anchored rule would sit a couple of
      // pixels apart at best and overlap at worst, inside an `overflow: hidden`
      // box. Bounding the centred space by the arrows makes a collision
      // impossible rather than unlikely.
      //
      // **The padding is `vw` below `md` for the same reason the type is** — see
      // `label`. `3.6vw` reaches 27.6px just under 768, where `md:p-7` takes over
      // at 28, so the two meet rather than step.
      className="coverflow-card relative isolate flex aspect-[1344/685] flex-col overflow-hidden p-[3.6vw] md:p-7"
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
          //
          // **The fourth term is 18 Aug 2026's, and it is the stage's HEIGHT.**
          // `(100svh − header − 2 × gutter-y) × CARD_BOX` is the widest card
          // whose own height still leaves the gutter the pinned stage is now
          // built around (`app/globals.css`, `--cf-stage-h`). Without it,
          // shortening the stage would clip the card on a laptop 100px shorter
          // than the one it was tuned on — this project's own repeat defect, a
          // value correct at one sample and wrong at another. With it, a short
          // viewport gets a SMALLER photograph rather than a cropped one, which
          // is the direction a page should fail in.
          //
          // It is written in `svh`/`px` rather than read from `--cf-stage-h`
          // deliberately: that property is declared inside `@supports
          // (animation-timeline: view())` and this element must size itself
          // correctly with no stylesheet of its own at all.
          width: `min(var(--coverflow-card-max), 100%, 100vw - 2 * var(--coverflow-gutter), (100svh - var(--header-height, 0px) - 2 * var(--coverflow-gutter-y)) * var(--coverflow-card-box-w) / var(--coverflow-card-box-h))`,
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
      <div
        data-contrast="coverflow-card"
        className="relative flex flex-1 flex-col items-center justify-center text-center"
      >
        {/* `text-indent` equal to the tracking, which is not a nicety on a
            centred label: letter-spacing is applied AFTER the last glyph too, so
            a centred two-character number sits half a space left of true centre
            without it. The chapter marks elsewhere on this page are left-aligned
            and never had to care. */}
        <p
          className={`font-[family-name:var(--font-label)] ${label} uppercase tracking-[0.32em] text-[color:var(--bg)] [text-indent:0.32em]`}
        >
          {String(index + 1).padStart(2, "0")}
        </p>
        {/* The display face, as `FullBleedQuote` sets its own line. The clamp's
            CEILING rose from 1.75rem to 2.25rem on 18 Aug 2026: at 1440 the card
            is 685px tall with ~490px of unused height inside it, so a centred
            title at 28px read as a caption that had wandered into the middle
            rather than as the card's subject.

            **Its floor came DOWN in the same edit, 1.15rem to 0.85rem, and the
            `vw` term went up.** Not a taste change — see `label`. The floor is
            what a 342 x 174 card at 390px actually has room for once the arrows
            are subtracted, and the steeper `vw` is what keeps the title the same
            fraction of the card at 360 as at 500. It reaches 2.25rem at ~818px,
            where the card is 722 x 368 and has room for it. */}
        <h3 className="mt-[1.8vw] font-[family-name:var(--font-display)] text-[clamp(0.85rem,4.4vw,2.25rem)] font-light leading-tight tracking-[-0.01em] text-[color:var(--bg)] md:mt-2">
          {experience.title}
        </h3>
        {/* `clamp()`, not a breakpoint step: the card's height is its width
            divided by `CARD_BOX` and therefore continuous, so the type that has
            to fit inside it must be continuous too. A stepped size is what leaves
            a card legible at 1440 and clipped at 1100 — the shape of defect
            this project has now shipped twice between its fixed sample widths
            (`DECISIONS.md` §2 #44-45, #52-53).

            `mx-auto` as well as `max-w`: a centred block whose own measure is
            left-aligned inside it is centred type that is not on the card's
            centre line, which is the thing this whole change is about. */}
        <p className="mx-auto mt-[2.4vw] max-w-[46ch] font-[family-name:var(--font-body)] text-[clamp(0.6rem,2.85vw,0.98rem)] leading-[1.55] text-[color:var(--bg)] md:mt-3">
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

        **The arrows did NOT move when the words did, 18 Aug 2026**, and that is
        a decision. The client asked for the *text* to be centred; these are
        navigation, and a rule with a label under each end reads as the foot of a
        card wherever the words are. Left in flow after a `flex-1` words block,
        so the card still has exactly one bottom-anchored element and the centred
        block is bounded by it — see the note on the `<li>`. It also keeps the
        thing `linear.md` §4.3 read by eye and liked: on the last card the
        hairline runs the full width with "PREVIOUS" alone beneath it, which
        reads as deliberate rather than as broken.
      */}
      {(previous !== null || next !== null) && (
        <nav
          aria-label={experience.title}
          className="coverflow-arrows relative mt-[3vw] flex items-center justify-between gap-6 border-t pt-[2vw] md:mt-4 md:pt-3"
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
