/**
 * The guests' reviews, as arithmetic — the parts of the carousel that can be
 * decided without a browser.
 *
 * Kept out of `components/sections/ReviewCarousel.tsx` for the reason
 * `lib/coverflow.ts` was kept out of the carousel it served: a component that
 * owns both its markup and its maths can only be checked by rendering it, and
 * the maths is the half that is easy to get quietly wrong. Everything here is a
 * pure function with a unit test.
 */

/** One circle in a rating row. `half` is a rating of x.5. */
export type RatingCircle = "full" | "half" | "empty";

/**
 * The rating as circles — client's own request, 20 Aug 2026: *"showing the
 * rating/stars as solid golden … for example 5 stars mean 5 circles and 4.5
 * means four and a half circles."*
 *
 * **Gold as a fill is legitimate here and it is worth saying why, because
 * non-negotiable #7 is otherwise absolute.** That rule is *"gold is decorative
 * only … it must never carry text"*: `--accent` (#BB8F2E) measures ~2.5:1 on
 * cream, so any text in it is unreadable and `--accent-text` exists for that
 * case. A rating circle is an ornament — a rule, a mark, a shape — which is
 * precisely what the rule reserves gold FOR. The pill button is the existing
 * precedent for gold as a fill rather than a line.
 *
 * **The circles are therefore never the only statement of the rating.** They
 * carry no text and cannot be read by anyone who does not see colour or shape,
 * so `ratingLabel` below is rendered beside them for a screen reader. A rating
 * is information, not decoration, and information that exists only as a
 * coloured shape does not exist for everyone.
 *
 * Rounds to the nearest half, because that is the only granularity the circles
 * can express — a 4.3 drawn as "four and a bit" is a shape nobody can read as a
 * number. Clamped to 0..outOf so a bad figure in `content/home.ts` produces a
 * wrong rating rather than a broken row.
 */
export function ratingCircles(rating: number, outOf = 5): RatingCircle[] {
  const halves = Math.round(Math.max(0, Math.min(outOf, rating)) * 2);
  return Array.from({ length: outOf }, (_, i) => {
    const filledHalves = Math.max(0, Math.min(2, halves - i * 2));
    return filledHalves === 2 ? "full" : filledHalves === 1 ? "half" : "empty";
  });
}

/**
 * What a screen reader hears in place of the circles.
 *
 * Written out rather than left to the shapes for the reason above. `4.5` rather
 * than `4½` because a screen reader reads the vulgar fraction inconsistently and
 * this is a number, not typography.
 */
export function ratingLabel(rating: number, outOf = 5): string {
  const rounded = Math.round(Math.max(0, Math.min(outOf, rating)) * 2) / 2;
  return `Rated ${rounded} out of ${outOf}`;
}

/**
 * The card's shape.
 *
 * **304px is measured, not chosen** — client, 20 Aug 2026: *"the cards should be
 * rectangles with same dimensions for the review we have placed for now."* The
 * three review blocks standing in `08 · The Invitation` render **304 x 122px** at
 * 1440x900, three across a 992px container with a 40px gap. The width is kept
 * exactly; the height is not, because he also asked for two rows that were not
 * there before — a rating and a "read more" — and a card cannot hold new rows at
 * an unchanged height.
 *
 * `vw` is the phone arm, and it exists for the same reason
 * `ExperienceCard.CARD_SIZES` has one: a peek of the next card is the only
 * affordance a clipped row has that its content continues, and a flat 304px card
 * inside a 312px frame leaves 8px of it. See `vw` below for the figure and for
 * where it came from.
 */
export const REVIEW_CARD = {
  widthPx: 304,
  heightPx: 208,
  /** The gap between two cards, which is also the gap the three blocks had. */
  gapPx: 40,
  /**
   * Below `widthPx / vw × 100` px of viewport, the card is this many `vw`.
   *
   * **78, which is `ExperienceCard`'s own figure, and taking it is deliberate.**
   * That strip solved the same problem one chapter earlier — a fixed-width card
   * in a clipped row on a phone — and 78 is what leaves a readable peek there.
   * 82 was tried here first and gives 17px of peek at 360px against 78's 31px;
   * a peek that thin reads as a card cut off by accident rather than as a row
   * that continues.
   */
  vw: 78,
  /** How many lines of the quote a card shows before it is cut. */
  quoteLines: 4,
} as const;

/** The exact width at which the flat cap takes over from the `vw` arm. */
export const REVIEW_CARD_FLAT_FROM = Math.ceil((REVIEW_CARD.widthPx * 100) / REVIEW_CARD.vw);

/**
 * Roughly how many characters of the quote face fit on one line of a 304px card.
 *
 * **Measured off the rendered page, and it is an estimate on purpose.** The
 * three blocks standing there today set their quotes at 18px/26px in the display
 * face and wrap at 304px: 75 characters took two lines, 88 took two, 92 took
 * three. That brackets a line at 44-48 characters; 46 is the middle.
 *
 * It cannot be exact, because where a line breaks depends on which characters
 * they are — "Mmm" and "iii" are not the same width — and no arithmetic on a
 * character count can know that. **So nothing correctness-bearing depends on
 * it.** The whole card is a link to the full review whether or not the estimate
 * fires, so the worst this can do is show or withhold a *label*;
 * `scripts/check_reviews.mjs` measures the real overflow in a browser and
 * reports any card where the two disagree.
 */
export const REVIEW_CHARS_PER_LINE = 46;

/**
 * Will this quote be cut by the card's own clamp?
 *
 * Client: *"add a clickable read more button on the reviews that get cut in the
 * middle."* — so the label is conditional, not universal. See
 * `REVIEW_CHARS_PER_LINE` for why this is an estimate and why that is safe.
 */
export function isQuoteClamped(quote: string): boolean {
  return quote.length > REVIEW_CARD.quoteLines * REVIEW_CHARS_PER_LINE;
}

/**
 * The fragment that opens one review's full text.
 *
 * Composed in one place so a link and the panel it opens cannot disagree about a
 * string neither of them spells out — the lesson `experienceCardId` records, and
 * before it `lib/coverflow.ts`.
 *
 * Indexed rather than named after the guest: two guests can share a first name
 * and a surname initial, and a duplicate `id` makes `:target` open whichever the
 * document happens to reach first.
 */
export function reviewPanelId(index: number): string {
  return `review-${index + 1}`;
}
