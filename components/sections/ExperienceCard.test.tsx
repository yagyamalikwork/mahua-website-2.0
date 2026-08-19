import { describe, expect, it } from "vitest";
import { CARD_BOX, CARD_SIZES } from "./ExperienceCard";
import { chapter } from "@/content/chapters";
import { chapterCopy } from "@/content/home";
import { media, type MediaId } from "@/lib/media";
import { STRIP } from "@/lib/motion";

/**
 * The half of this card that `lib/sizes.test.ts` cannot see.
 *
 * That file holds `CARD_SIZES` and `CARD_BOX` to the markup and to each other —
 * a closed loop of three constants, all of which can be internally consistent
 * while every photograph in the strip is served at half the resolution it needs
 * or cropped twice over. What closes it is the LIBRARY: the real widths and real
 * aspects of the six files `content/home.ts` names.
 *
 * **This is the same gap `CoverflowCard.test.tsx` was written for and the reason
 * generalises past the component that taught it** (`docs/DECISIONS.md` §20.6): a
 * photograph already served its widest tier is classed `atLibraryCeiling` by
 * `check_image_resolution.mjs`, which that rig *reports* and does not enforce.
 * So a card cap raised past what the files can fill fails silently — green rig,
 * green build, six visibly soft cards on the one screen the client tests on.
 */
describe("the strip's card, against the photographs it actually draws", () => {
  const experiences = (
    chapterCopy("field-days") as { experiences: readonly { mediaId: MediaId; title: string }[] }
  ).experiences;

  it("draws six cards, and names six frames the chapter declares", () => {
    // The floor `content/chapters.test.ts` sets on `MIN_MEDIA`, from the other
    // end: that file checks the chapter's list, this checks the cards.
    expect(experiences).toHaveLength(6);
    const declared = chapter("field-days").media;
    for (const e of experiences) expect(declared).toContain(e.mediaId);
  });

  it("never asks any of the six for more pixels than its file has", () => {
    // `cover` in a box the same shape as the photograph draws it at exactly the
    // card's own width, so this is the whole resolution question at DPR 1.
    for (const e of experiences) {
      const m = media(e.mediaId);
      expect(m.width, `${e.title} (${e.mediaId}) is ${m.width}px in a ${STRIP.cardMaxPx}px card`).toBeGreaterThanOrEqual(
        STRIP.cardMaxPx,
      );
    }
  });

  it("crops none of the six by more than a quarter of its width, at render", () => {
    /*
     * **This project's 25% width-crop bound, and the assertion this whole
     * chapter turns on.**
     *
     * Five of the six frames were 1.5:1 or wider until 19 Aug 2026 and a 0.74
     * card takes 50.7-62.3% of such a frame's width. There is no portrait card
     * ratio at which they are legal — the bound rearranges to "the box may not
     * be narrower than 0.75 × the file's aspect", which for a 1.5:1 frame is
     * 1.1265, a LANDSCAPE box. They are legal here only because
     * `scripts/build_images.mjs` cuts each one to 0.74 by hand, with the file
     * open, before any tier is emitted.
     *
     * So what this measures is that the pipeline crop and the card's box have
     * not drifted apart. A window re-cut in that script, or `CARD_BOX` retuned
     * here, and the box starts cropping a second time on top of the crop
     * somebody chose — which is invisible in a screenshot of a photograph that
     * was already cropped, and is exactly the failure the bound exists for.
     *
     * Height is unbounded by the same convention this project has applied since
     * the room cards: every documented crop constraint on this page is about
     * width. `star-talks` is the one frame that loses height here — 9.9%, off a
     * night sky.
     */
    for (const e of experiences) {
      const m = media(e.mediaId);
      const imageAspect = m.width / m.height;
      // Wider than the box: `cover` fills the height and crops the width.
      const widthCrop = imageAspect > CARD_BOX ? 1 - CARD_BOX / imageAspect : 0;
      expect(
        widthCrop,
        `${e.title} (${e.mediaId}, ${m.width}x${m.height}, ${imageAspect.toFixed(3)}:1) loses ${(widthCrop * 100).toFixed(1)}% of its width in a ${CARD_BOX.toFixed(3)} box`,
      ).toBeLessThanOrEqual(0.25);
    }
  });

  it("keeps the pipeline's own crops within a pixel of the card's shape", () => {
    /*
     * The tighter half of the assertion above, and it is not the same test.
     *
     * 25% would be satisfied by a frame at 0.99:1 in a 0.74 box — a card
     * quietly throwing away a quarter of five photographs a person had already
     * chosen the window of. Every pipeline crop is solved to 0.74 to the nearest
     * whole source pixel, so the served aspects are 0.7394-0.7404, and anything
     * outside a hair of that is a crop window someone edited without re-deriving
     * its width. `star-talks` is exempt by name because it is the one frame that
     * is NOT cut here — it arrived portrait.
     */
    for (const e of experiences) {
      if (e.mediaId === "star-talks") continue;
      const m = media(e.mediaId);
      expect(
        Math.abs(m.width / m.height - CARD_BOX),
        `${e.title} (${e.mediaId}) is ${(m.width / m.height).toFixed(4)}:1 against the card's ${CARD_BOX}`,
      ).toBeLessThan(0.002);
    }
  });

  it("spells the card's own width list, with the breakpoint the cap really binds at", () => {
    // `78vw ≥ 340 ⟺ 100vw ≥ 435.9`, so the flat arm has to start at 436 and not
    // at 435: at 435 the `vw` arm would still be the smaller of the two and
    // `sizes` would over-state. Interpolated from `STRIP` in the component,
    // checked as a string here — the two ends of the same number, which is what
    // caught nothing when the density sweep moved the card from 300 to 340 and
    // both ends moved together, as designed.
    expect(CARD_SIZES).toBe("(min-width: 436px) 340px, 78vw");
  });
});
