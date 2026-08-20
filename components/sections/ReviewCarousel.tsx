import { RatingCircles } from "@/components/ui/RatingCircles";
import type { GuestQuote } from "@/content/home";
import { REVIEWS } from "@/lib/motion";
import { isQuoteClamped, REVIEW_CARD, reviewPanelId } from "@/lib/reviews";

/**
 * The guests' reviews at the foot of `08 · The Invitation`, as a carousel.
 *
 * Client, 20 Aug 2026: *"replace the placeholder reviews on the last section
 * with the Tripadvisor carousel widget, with slow auto-scrolling review cards
 * and the scroll pauses when the viewer hovers over the carousel; the cards
 * should be rectangles with same dimensions for the review we have placed for
 * now, showing the rating/stars as solid golden … add a clickable read more
 * button on the reviews that get cut in the middle, and when the viewer clicks
 * on it the popup window/gallery will show the complete text."*
 *
 * **It is not the Tripadvisor widget, and that was his own call once he had the
 * facts.** Their Content API returns five reviews per property and requires
 * their logo and green bubbles beside them; a third-party embed is their
 * JavaScript and their typography on a page that ships almost none of either.
 * More to the point, both properties are rated 4.0 and an unfiltered feed puts
 * the one-star reviews on the home page. So the reviews are a curated set the
 * client assembles from his own Tripadvisor management centre and they live in
 * `content/home.ts` like every other word on this site.
 *
 * ## Zero JavaScript, all three parts
 *
 * The movement is a CSS animation, the pause is `:hover`, and the full-text
 * panel is CSS `:target` — the construction `RoomCardStack`'s gallery was
 * rebuilt on when the Popover API was measured nesting its own panels
 * (`docs/DECISIONS.md` §18). Nothing here imports a client component, so nothing
 * here adds a byte to the first load.
 *
 * **`:target` costs the Escape key and focus restoration**, which the room
 * gallery's own note records and which is the honest price of the panel being
 * free. The close control is a real link and the backdrop is a real link, so it
 * is closable by pointer and by keyboard; it is the *keystroke* that is missing.
 *
 * ## Two modes, and one of them is meant to be deleted
 *
 * `REVIEWS.mode`. The client asked for a carousel that runs continuously and
 * pauses under the pointer; offered the alternative he said *"build both, and
 * you choose"*, so both are here and he rules on the real page. See `REVIEWS` in
 * `lib/motion.ts` for what each one does and for the non-negotiable #5 question
 * the continuous one raises — this site has nothing else on it that never stops.
 *
 * **The two modes are different compositions, not one composition with a
 * setting**, and the reason is structural rather than stylistic:
 *
 * - `loop` needs the track rendered **twice** so that translating the rail by
 *   exactly -50% lands the copy where the original was and the seam is
 *   invisible. Its container must therefore clip, which means it cannot also be
 *   a scroller.
 * - `settle` needs the container to BE a scroller, because with fifteen or more
 *   reviews a one-shot drift leaves most of them unreachable otherwise. Its
 *   track is rendered once.
 *
 * The duplicate track is `aria-hidden` **and** `inert`. `aria-hidden` alone over
 * a subtree full of links is an accessibility fault of its own — the links stay
 * in the tab order while being unannounced, so a keyboard visitor lands on
 * something that is not there. `inert` removes them from both.
 */
export function ReviewCarousel({ reviews }: { reviews: readonly GuestQuote[] }) {
  if (reviews.length === 0) return null;
  const looping = REVIEWS.mode === "loop";

  return (
    <>
      <div
        className="reviews"
        data-reviews-mode={REVIEWS.mode}
        /*
         * The count, so the animation's duration is `secondsPerCard` × the
         * number of cards rather than a fixed figure. Adding reviews must not
         * make the carousel faster, and a duration written in the stylesheet
         * would do exactly that. It is a custom property rather than an inline
         * `animation-duration` because the rules that read it live beside the
         * rest of the composition in `app/globals.css`, where a future editor
         * looking at this effect will actually be.
         */
        style={{ "--reviews-count": reviews.length } as React.CSSProperties}
      >
        {/* A scrollable region needs a name and a way in from the keyboard —
            the rule `check_experience_strip.mjs` assertion 10 records for the
            strip next door. In `loop` the container does not scroll, so neither
            applies; in `settle` it is the only way to reach card fifteen. */}
        <div
          className="reviews-rail"
          {...(looping
            ? {}
            : { tabIndex: 0, role: "group", "aria-label": "What guests have said" })}
        >
          <ul className="reviews-track">
            {reviews.map((review, i) => (
              <ReviewCard key={i} review={review} index={i} />
            ))}
          </ul>
          {looping && (
            <ul className="reviews-track" aria-hidden="true" inert>
              {reviews.map((review, i) => (
                <ReviewCard key={`echo-${i}`} review={review} index={i} echo />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * The full text of every review, as panels — **rendered outside the carousel and
 * outside the section's `<Enter>`, and both of those are load-bearing.**
 *
 * `position: fixed` escapes an ancestor's `overflow` clipping only while no
 * ancestor carries a `transform`, a `filter` or a `mask`. The rail carries a
 * transform on every frame of the loop and the carousel carries an edge mask, so
 * a panel rendered inside either would be clipped to the width of a card and
 * would travel with the marquee. `Enter` sets a transform too, on the whole
 * block, for as long as it is staged.
 *
 * Same reason `RoomCardStack` renders its gallery outside its cards, arrived at
 * from a different direction — there the ancestor was a sticky card, here it is
 * an animation. **The rule generalises: a `position: fixed` panel belongs at the
 * top of the section, not next to the thing that opens it.**
 */
export function ReviewPanels({ reviews }: { reviews: readonly GuestQuote[] }) {
  return (
    <>
      {reviews.map((review, i) => (
        <ReviewPanel key={i} review={review} index={i} />
      ))}
    </>
  );
}

/**
 * One review, as the rectangle the client asked for.
 *
 * **The whole card is the link, and that is what makes the read-more label
 * safe.** Whether a quote is cut is decided by `isQuoteClamped`, a character
 * count, and a character count cannot know where a line actually breaks — see
 * its own note. If it is ever wrong, the worst outcome is a card that is cut and
 * does not say so, and the guest can still open it, because the surface they
 * would click is the link either way. Nothing correctness-bearing rests on an
 * estimate.
 */
function ReviewCard({
  review,
  index,
  echo = false,
}: {
  review: GuestQuote;
  index: number;
  /** The duplicate track's copy — see the note on the component. */
  echo?: boolean;
}) {
  const clamped = isQuoteClamped(review.quote);

  return (
    <li className="review-card">
      <a
        className="review-card-link"
        href={`#${reviewPanelId(index)}`}
        /* The accessible name says whose review and that opening it shows the
           rest — "Read more" nine times over is a screen reader's list of nine
           identical links. */
        aria-label={`Read ${review.name}'s full review`}
        {...(echo ? { tabIndex: -1 } : {})}
      >
        {review.rating !== undefined && <RatingCircles rating={review.rating} />}

        {/* `data-contrast`, not a structural selector: this is cream type over
            the page's darkest photograph, so it is governed by the contrast rule,
            and `scripts/check_contrast_over_photos.mjs` needs a hook that
            survives the block being recomposed. */}
        <blockquote data-contrast="review-quote" className="review-quote">
          <p>{review.quote}</p>
        </blockquote>

        <p data-contrast="review-attribution" className="review-attribution">
          <cite className="not-italic">{review.name}</cite>
          <span aria-hidden="true" className="review-dot" />
          <span>{review.source}</span>
          <span>{review.year}</span>
        </p>

        {clamped && (
          <span aria-hidden="true" className="review-more">
            Read more
          </span>
        )}
      </a>
    </li>
  );
}

/**
 * The full text of one review, in a panel opened by `:target`.
 *
 * Ink on paper, never a translucent wash — §16's lesson, the same one the room
 * gallery's panel carries: a lightbox holding a paragraph of text has to be a
 * surface `lib/palette.test.ts` already guarantees, not a wash over a photograph
 * whose contrast nobody has solved.
 */
function ReviewPanel({ review, index }: { review: GuestQuote; index: number }) {
  return (
    <div id={reviewPanelId(index)} className="review-full" role="dialog" aria-label={`${review.name}'s review`}>
      {/* A real element and a real link, not `::backdrop` — that pseudo-element
          exists only for top-layer popover/dialog elements, which this
          deliberately is not. Its `aria-hidden` is safe because the panel's own
          close control below is a second link to the same place. */}
      <a className="review-full-backdrop" href="#invitation" aria-hidden="true" tabIndex={-1} />
      <div className="review-full-box">
        {review.rating !== undefined && <RatingCircles rating={review.rating} />}
        <blockquote className="review-full-quote">
          <p>{review.quote}</p>
        </blockquote>
        <p className="review-full-attribution">
          <cite className="not-italic">{review.name}</cite>
          <span aria-hidden="true" className="review-dot" />
          <span>{review.source}</span>
          <span>{review.year}</span>
        </p>
        <a className="review-full-close" href="#invitation">
          Close
        </a>
      </div>
    </div>
  );
}
