import { describe, expect, it } from "vitest";
import {
  isQuoteClamped,
  ratingCircles,
  ratingLabel,
  REVIEW_CARD,
  REVIEW_CARD_FLAT_FROM,
  REVIEW_CHARS_PER_LINE,
  reviewPanelId,
} from "./reviews";

describe("the rating, as circles", () => {
  it("draws a whole number as that many solid circles", () => {
    expect(ratingCircles(5)).toEqual(["full", "full", "full", "full", "full"]);
    expect(ratingCircles(4)).toEqual(["full", "full", "full", "full", "empty"]);
    expect(ratingCircles(3)).toEqual(["full", "full", "full", "empty", "empty"]);
  });

  it("draws a half as four and a half — the client's own example", () => {
    // 20 Aug 2026: "5 stars mean 5 circles and 4.5 means four and a half circles."
    expect(ratingCircles(4.5)).toEqual(["full", "full", "full", "full", "half"]);
  });

  it("rounds to the nearest half, because a circle cannot express a third", () => {
    // A 4.3 drawn as "four and a bit" is a shape nobody can read as a number.
    expect(ratingCircles(4.3)).toEqual(ratingCircles(4.5));
    expect(ratingCircles(4.2)).toEqual(ratingCircles(4));
    expect(ratingCircles(4.75)).toEqual(ratingCircles(5));
  });

  it("survives a figure that should never have been written", () => {
    // A bad number in `content/home.ts` must produce a wrong rating, never a
    // row of the wrong length or a crash on the page's closing screen.
    expect(ratingCircles(9)).toHaveLength(5);
    expect(ratingCircles(-2)).toEqual(["empty", "empty", "empty", "empty", "empty"]);
    expect(ratingCircles(Number.NaN)).toHaveLength(5);
  });

  it("always draws `outOf` circles, whatever the rating", () => {
    for (const r of [0, 0.5, 1, 2.5, 3.7, 5]) expect(ratingCircles(r)).toHaveLength(5);
  });

  it("says the rating in words as well as in shapes", () => {
    // The circles carry no text. A rating is information, and information that
    // exists only as a coloured shape does not exist for everyone.
    expect(ratingLabel(4.5)).toBe("Rated 4.5 out of 5");
    expect(ratingLabel(5)).toBe("Rated 5 out of 5");
    expect(ratingLabel(4.3)).toBe("Rated 4.5 out of 5");
  });

  it("agrees with itself — the label and the circles round the same way", () => {
    // Two roundings, one number. They were written separately and this is the
    // only thing stopping them drifting apart.
    for (const r of [0, 0.4, 0.5, 2.24, 2.26, 3.75, 4.3, 4.9, 5]) {
      const filled = ratingCircles(r).reduce(
        (n, c) => n + (c === "full" ? 1 : c === "half" ? 0.5 : 0),
        0,
      );
      expect(ratingLabel(r)).toBe(`Rated ${filled} out of 5`);
    }
  });
});

describe("the card's shape", () => {
  it("keeps the 304px the three standing review blocks measure", () => {
    // Client: "the cards should be rectangles with same dimensions for the
    // review we have placed for now." Measured at 1440x900: 304 x 122, three
    // across a 992px container with a 40px gap.
    expect(REVIEW_CARD.widthPx).toBe(304);
    expect(REVIEW_CARD.gapPx).toBe(40);
  });

  it("is taller than the blocks it replaces, and that is the client's own two rows", () => {
    // A card cannot hold a rating row and a read-more row at an unchanged height.
    expect(REVIEW_CARD.heightPx).toBeGreaterThan(122);
  });

  it("hands over from the vw arm to the flat cap at a whole pixel", () => {
    // The same rule `ExperienceCard.CARD_SIZES` records: the breakpoint rounds
    // UP to the first whole pixel at which the cap binds, so the `vw` arm is
    // never asked to describe a card the cap has already taken over.
    expect((REVIEW_CARD.vw / 100) * REVIEW_CARD_FLAT_FROM).toBeGreaterThanOrEqual(
      REVIEW_CARD.widthPx,
    );
    expect((REVIEW_CARD.vw / 100) * (REVIEW_CARD_FLAT_FROM - 1)).toBeLessThan(
      REVIEW_CARD.widthPx,
    );
  });
});

describe("when a review shows a read-more", () => {
  const line = "x".repeat(REVIEW_CHARS_PER_LINE);

  it("leaves a quote that fits inside the clamp alone", () => {
    expect(isQuoteClamped("The place is secluded.")).toBe(false);
    expect(isQuoteClamped([line, line, line].join(" ").slice(0, 120))).toBe(false);
  });

  it("marks one that runs past the card's last line", () => {
    expect(isQuoteClamped("y".repeat(REVIEW_CARD.quoteLines * REVIEW_CHARS_PER_LINE + 1))).toBe(
      true,
    );
  });

  it("is an estimate, and nothing correctness-bearing may depend on it", () => {
    // The whole card is a link to the full review whether or not this fires, so
    // the worst a wrong answer here can do is show or withhold a LABEL. This
    // test exists to keep that true: if the threshold ever becomes the thing
    // that decides whether a guest can read the rest of a review, it needs a
    // browser measurement, not a character count.
    //
    // `scripts/check_reviews.mjs` measures the real overflow and reports any
    // card where the two disagree.
    expect(isQuoteClamped("")).toBe(false);
  });
});

describe("the panel a review opens", () => {
  it("numbers panels from one, and never repeats", () => {
    // Indexed rather than named after the guest: two guests can share a name,
    // and a duplicate id makes `:target` open whichever the document reaches
    // first.
    const ids = [0, 1, 2, 3].map(reviewPanelId);
    expect(ids).toEqual(["review-1", "review-2", "review-3", "review-4"]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
