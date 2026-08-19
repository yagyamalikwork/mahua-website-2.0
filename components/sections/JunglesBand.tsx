import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { SplitLines } from "@/components/motion/SplitLines";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { Photo } from "@/components/ui/Photo";
import type { ChapterLike } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey } from "@/content/home";
import { JUNGLE_BAND } from "@/lib/motion";

export type JunglesCopy = {
  /** The line already there — the client's own ruling, kept verbatim. */
  readonly quote: string;
  /** `03 · The Forest`'s surviving paragraph, moved here when that chapter went. */
  readonly intro: string;
};

/** Edge to edge. The band is the viewport's width at every viewport. */
export const BAND_SIZES = "100vw";

/**
 * The band's shape — and it is the photograph's own, which is the point.
 * `aspect-[1440/611]` in the markup below; the arithmetic is on `JUNGLE_BAND`.
 */
export const BAND_BOX = JUNGLE_BAND.boxW / JUNGLE_BAND.boxH;

/**
 * `02 · The Jungles` — one cropped band of forest, with the words in the cream
 * above and below it.
 *
 * Client, 19 Aug 2026, on the 100svh full-bleed quote this replaces: *"it covers
 * the whole screen currently and feels too overwhelming… cropped from the
 * length, keeping the width, giving the section more room to breathe with the
 * newly created headroom and legroom, making it look sleeker."* Spec §3.
 *
 * ## The crop fixes a defect as well as a feeling
 *
 * At 100svh the browser scaled a 2.357:1 photograph to **2,706px** to cover a
 * 1.6:1 viewport, so the black panther at its left edge and the tiger at its
 * right were both off-screen, and it was served at ratio **0.53** — the softest
 * photograph on the site. At its own aspect nothing is cropped in either axis,
 * the drawn width is the element's width, and the ratio is 1.00 at 1440 with no
 * new file. See `JUNGLE_BAND` in `lib/motion.ts`.
 *
 * ## The words are in the cream, and that was decided by looking
 *
 * Spec §3 says the heading is *"the heading that is on this section"*, which
 * today means over the photograph. Both arrangements were built and looked at
 * rather than argued about — the on-the-band one first, and it is what these
 * three findings come from (`docs/reviews/2026-08-19-home-v2/shapes.md` §3).
 * Laid on the band, at 1440:
 *
 * - the heading's third line sits **on the black panther's head** — the left
 *   quarter is the only dark region a cream heading can go, and the panther is
 *   what is in it;
 * - the paragraph sits **on the tiger's face** — the right quarter is the only
 *   place a right-set column can go, and the tiger is what is in it;
 * - the wash needed to carry body copy over lit golden grass took the whole
 *   frame olive-grey, which is the mud `ui/Scrim.tsx` warns a flat wash produces.
 *
 * At 390 it is not a judgement call at all: the band is 390 x 166px, the type is
 * taller than that, and the paragraph's last line ran off the photograph onto the
 * cream **as cream type on cream** — invisible. A 2.357:1 band is simply not a
 * container for text on a phone.
 *
 * So the heading takes the headroom and the paragraph takes the legroom, which
 * is the client's own word for both, and the photograph is left whole and
 * unwashed. The reading order this produces is better than the one it replaces:
 * the chapter names itself, the heading sets the tone, the three cats appear,
 * and then the paragraph names the animals the visitor has just been looking at.
 *
 * **This section therefore carries no type over a photograph, and
 * `scripts/check_contrast_over_photos.mjs` has no run for it** — its
 * `quote · why-you-came` run was deleted rather than retargeted, and the three
 * `header scrolled · *` runs that used this chapter as their anchor moved to
 * `#invitation`, which is still a full-bleed photograph. Both are recorded
 * there. The type here is ink and `--dim` on cream, which `lib/palette.test.ts`
 * already guards.
 */
export function JunglesBand({
  chapter,
  surface = false,
}: {
  chapter: ChapterLike;
  surface?: boolean;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as JunglesCopy;

  return (
    <section
      id={chapter.id}
      // Not `ChapterSurface`, for the reason `LodgePanels` gives: that component
      // puts every child inside its padded container and this band has to reach
      // the edge of the screen. The padding, the surface swap and the `--bg`
      // redefinition are its, deliberately, so the creams still alternate and
      // `ImageReveal`'s mask still wipes in the right one.
      className="relative overflow-x-clip bg-[color:var(--bg)] py-14 md:py-16 lg:py-20"
      style={surface ? ({ "--bg": "var(--surface)" } as React.CSSProperties) : undefined}
    >
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">
        <Enter>
          <div>
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} />
            )}
            {/* Left-aligned and smaller than the centred quote it replaces — the
                client asked for both. `SplitLines` as an `h2` because it is the
                chapter's heading now rather than a pull-quote, and NOT
                `TwoToneHeading`: that component takes a `TwoTone`, and this line
                is a plain string in `content/home.ts` with no word marked to
                soften. Inventing one would be writing copy.

                The scale tops out at 2.8rem against the quote's 3.9rem and
                `TwoToneHeading`'s own 3.5rem, so it reads as a chapter heading
                that has been dialled back — which is what "smaller" has to mean
                on a page where every other chapter heading is the larger size. */}
            <SplitLines
              as="h2"
              className="mt-6 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.4vw,2.8rem)] font-light leading-[1.1] tracking-[-0.01em] text-[color:var(--text)]"
            >
              {copy.quote}
            </SplitLines>
          </div>
        </Enter>
      </div>

      {/* The band. Edge to edge, at the photograph's own aspect, and carrying
          nothing on it — no scrim, no type. `noZoom` for the same reason the
          panels have it: the home page's float translates a frame 6px upward on
          hover, which on a full-bleed band would open a 6px seam of cream along
          its bottom edge. The effect was built for a plate inside a margin. */}
      <div className="relative mt-8 aspect-[1440/611] w-full overflow-hidden md:mt-10">
        <ImageReveal noZoom className="h-full w-full">
          <Photo
            id={chapter.media[0]}
            sizes={BAND_SIZES}
            box={BAND_BOX}
            pictureClassName="block h-full w-full"
            className="h-full w-full object-cover"
          />
        </ImageReveal>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 md:px-12">
        <Enter>
          {/* `03 · The Forest`'s own paragraph, moved here when that chapter left
              the page (spec §3). That chapter's heading — "Three hundred birds,
              and the cats you came for" — is deliberately not here: the spec
              drops it with the section and keeps only this.

              Set to the right, which is a position and not an alignment: the
              block is pushed to the container's right edge and its text stays
              ragged-right, because four lines of ragged-LEFT body copy is a
              legibility cost paid for a compositional effect. */}
          <p
            className="mt-8 max-w-[52ch] font-[family-name:var(--font-body)] text-[1.02rem] leading-[1.72] md:mt-10 md:text-[1.08rem] lg:ml-auto"
            style={{ color: "var(--dim)" }}
          >
            {copy.intro}
          </p>
        </Enter>
      </div>
    </section>
  );
}
