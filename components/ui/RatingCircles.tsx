import { ratingCircles, ratingLabel } from "@/lib/reviews";

/**
 * A guest's rating, drawn as gold circles — client's own shape, 20 Aug 2026:
 * *"showing the rating/stars as solid golden (the golden colour that we have
 * used on our website), for example 5 stars mean 5 circles and 4.5 means four
 * and a half circles."*
 *
 * **Gold as a fill, which non-negotiable #7 permits and only for this kind of
 * thing.** That rule reserves `--accent` (#BB8F2E) for *"rules, ornaments, the
 * emblem"* and forbids it carrying text, because it measures ~2.5:1 on cream.
 * A rating circle is an ornament. `ui/PillButton.tsx` is the existing precedent
 * for gold as a fill rather than a line — and note what that component had to do
 * about its label, which is the other half of the same rule.
 *
 * **The circles are never the whole statement.** They carry no text, so the row
 * is `aria-hidden` and a visually hidden sentence sits beside it. A rating is
 * information; information that exists only as a coloured shape does not exist
 * for everyone, and this is the one element on the page where that distinction
 * is load-bearing rather than pedantic.
 *
 * The half circle is a two-stop gradient inside a ring, not half a circle: the
 * ring is what keeps the empty half legible as *part of a rating* rather than as
 * a gap where a circle should be. Same reason the empty ones are rings and not
 * absences — five positions, always, so the row's length says "out of five"
 * without anybody writing it.
 */
export function RatingCircles({ rating, outOf = 5 }: { rating: number; outOf?: number }) {
  const circles = ratingCircles(rating, outOf);

  return (
    <p className="flex items-center gap-[5px]">
      <span aria-hidden="true" className="flex items-center gap-[5px]">
        {circles.map((circle, i) => (
          <span
            key={i}
            className="review-circle"
            /* The state is an attribute rather than three class names because
               `scripts/check_reviews.mjs` counts filled halves off the rendered
               page and needs a hook that survives the styling being changed. */
            data-circle={circle}
          />
        ))}
      </span>
      <span className="sr-only">{ratingLabel(rating, outOf)}</span>
    </p>
  );
}
