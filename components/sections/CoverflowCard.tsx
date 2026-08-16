import { Photo } from "@/components/ui/Photo";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import type { ExperienceCopy } from "@/content/home";
import { SITE } from "@/content/site";
import { coverflowNeighbours, coverflowTargetId } from "@/lib/coverflow";
import { COVERFLOW } from "@/lib/motion";

/**
 * How wide this card is actually drawn, at every viewport.
 *
 * **Derived from `COVERFLOW`, never transcribed from it.** The card's width is
 * `min(cardMaxPx, 100vw − 2 × stageGutterPx)` — the same expression the `width`
 * in the markup below carries, written once in JavaScript and emitted into both
 * the `sizes` string and the inline style, so the number a browser lays the card
 * out at and the number `srcset` picks a file for cannot drift. `sizes` is an
 * HTML attribute evaluated before CSS custom properties are usable, so it
 * *cannot* read `var(--coverflow-card-max)`; template-literal interpolation at
 * build time is the only version of this promise that holds.
 *
 * The breakpoint is where the two arms of the `min()` cross:
 * `100vw − 2 × 24px ≥ 560px ⟺ 100vw ≥ 608px`. Exact, not rounded — above 608px
 * the card is a flat 560px, below it `calc(100vw − 48px)`. `ui/Photo.tsx`'s own
 * comment is explicit that a `sizes` must round *up* where it is unsure;
 * nothing here is unsure, because both arms are the layout's own arithmetic.
 *
 * Current value: `(min-width: 608px) 560px, calc(100vw - 48px)`.
 */
export const CARD_SIZES = `(min-width: ${COVERFLOW.cardMaxPx + 2 * COVERFLOW.stageGutterPx}px) ${COVERFLOW.cardMaxPx}px, calc(100vw - ${2 * COVERFLOW.stageGutterPx}px)`;

/**
 * The card's shape, and the box the photograph is `object-cover` inside.
 *
 * **16:9 is solved against the photographs, not chosen for the look.** Three of
 * the six frames the coverflow shows (`vann-kohka-lake`, `vann-potters-village`,
 * `vann-bird-watching` — the plan's correction A) are 2.29:1 panoramas already
 * cropped for `/mahua-vann`; their widest emitted tier is 768×335 = **2.2925**.
 * A `cover` box keeps `boxAspect / imageAspect` of a photograph's width, and
 * this project's own bound — `check_card_stack.mjs` assertion 6, which the
 * coverflow's rig inherits — is that no photograph loses more than 25% of its
 * width. So the box may not be narrower than `0.75 × 2.2925 = 1.7194`.
 *
 * 16:9 = 1.7778 clears that by 3.4%, keeping **77.5%** of the widest frame
 * (22.45% cropped, 2.55 points inside the ceiling). It is the standard ratio
 * closest above the bound; anything appreciably taller — 3:2 would crop 34.6%,
 * 4:5 would crop 65% — fails the bound outright.
 *
 * **This is a real constraint on the card's design, and it belongs to the
 * photographs rather than to the layout:** a portrait or square coverflow card
 * is not available while three of the six frames are 2.29:1. A card is
 * therefore short and wide, and its words have ~315px of height at 1440 and
 * ~192px at 390 — which is why the type below is `clamp()`ed rather than
 * stepped at breakpoints.
 *
 * The tallest frame in the set, `tiger-crossing-track` at 1.065:1, is *narrower*
 * than this box, so `cover` crops its height instead — unbounded by design, the
 * same convention `ROOM_CARD_MIN_BOX` records.
 *
 * `lib/sizes.test.ts` holds this to the `aspect-[16/9]` class below in both
 * directions; changing one without the other is a red test, not a soft
 * photograph found in a screenshot three tasks later.
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
  index: number;
  count: number;
  chapterId: string;
  /**
   * The titles of the cards the two arrows point at.
   *
   * **Optional, and `Coverflow.tsx` must nonetheless always pass them.** Six
   * cards carry a pair each, so twelve links would otherwise be announced as
   * "Previous" and "Next" twelve times over with nothing to tell them apart.
   * They are props rather than a lookup because this component must not reach
   * into `content/` for words that belong to a *different* card — the section
   * knows the running order; a card does not.
   */
  previousTitle?: string;
  nextTitle?: string;
}) {
  const { previous, next } = coverflowNeighbours(index, count);

  const arrow =
    "rule-in font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em] text-[color:var(--bg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bg)]";

  return (
    <li
      className="coverflow-card relative isolate flex aspect-[16/9] flex-col justify-end overflow-hidden p-5 md:p-7"
      style={
        {
          "--i": String(index),
          // The same arithmetic `CARD_SIZES` describes, and the reason it is
          // here rather than in `app/globals.css`: the two must move together,
          // and one file is the only place that can be true. Inline so a card
          // is correct as a plain block with no stylesheet of its own —
          // `Coverflow.tsx` positions it, it does not size it.
          width: `min(var(--coverflow-card-max), 100vw - 2 * var(--coverflow-gutter))`,
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

      {/* Named, because six unnamed `<nav>` landmarks on one page are six
          identical entries in a screen reader's landmark list. The activity's
          own title is the name — no new copy, and distinct by construction. */}
      <nav
        aria-label={experience.title}
        className="coverflow-arrows relative mt-4 flex items-center justify-between gap-6 border-t pt-3"
        // `--accent` gold, not cream: the hairline carries no text, and a rule
        // is the one thing non-negotiable #7 says gold IS for. The words above
        // and below it are cream, which is the half of that rule that binds.
        style={{ borderColor: "var(--accent)" }}
      >
        <a
          href={`#${coverflowTargetId(chapterId, previous)}`}
          aria-label={
            previousTitle ? `${SITE.coverflow.previous} — ${previousTitle}` : SITE.coverflow.previous
          }
          className={arrow}
        >
          {SITE.coverflow.previous}
        </a>
        <a
          href={`#${coverflowTargetId(chapterId, next)}`}
          aria-label={nextTitle ? `${SITE.coverflow.next} — ${nextTitle}` : SITE.coverflow.next}
          className={arrow}
        >
          {SITE.coverflow.next}
        </a>
      </nav>
    </li>
  );
}
