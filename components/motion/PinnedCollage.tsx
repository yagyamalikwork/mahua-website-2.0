import { CollageStage } from "@/components/motion/CollageStage";
import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { StickyScene } from "@/components/motion/StickyScene";
import { ChapterIntro } from "@/components/sections/ChapterIntro";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type TwoTone } from "@/content/home";

type IntroCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
};

/**
 * Screens of scroll the scene occupies, its own included — so **one** of them is
 * spent with the chapter held still and the photographs rising past it.
 *
 * **It was `STICKY_SCREENS_MAX` (three) until the client ruled on 5 Aug 2026,
 * and three was too many.** A pin buys scroll and this one adds no photographs,
 * so at three screens `rooted` spent ~1.9 extra screens showing the same three
 * images: page-wide imagery fell from 2.08 photographs per screen to 1.87, and
 * the join below it went from 61.7% to 64.9% empty. Against the client's very
 * first complaint — too few images — the pin was spending scroll to *reduce*
 * image density. Given the choice of shortening it, keeping it, feeding it more
 * photographs or dropping it, they chose to shorten: hold the headline, keep the
 * drift, stop buying scroll we cannot fill.
 *
 * `StickyScene` clamps this to `STICKY_SCREENS_MAX` whatever is written here;
 * the constant is exported so the test can assert against the clamp rather than
 * against a number copied out of this file.
 */
export const COLLAGE_SCREENS = 2;

/**
 * How far each photograph drifts, as a fraction of the scroll the pin reserves.
 *
 * **Three different numbers is the effect**, not a detail of it: the client's own
 * reading of the reference is "each moving at slightly different speeds", and
 * three identical rates read as one sliding sheet rather than as depth. Ordered
 * to match `chapter.media` — the tall flank, then the upper and lower halves of
 * the pair.
 *
 * The largest is the nearest and so the fastest. All three sit at or under
 * `PARALLAX_MAX`, which spec section 4.3 law 3 sets at 15%: past that a
 * photograph is moving rather than sitting at a depth, and CLAUDE.md
 * non-negotiable #4 is that if you notice the animation it is too fast.
 *
 * **These were 0.12 / 0.085 / 0.05 while the pin was three screens.** Halving
 * the pin halves the scroll these are a fraction *of*, so holding them would
 * have halved the travel with them — 104px, 74px and 43px, which is a twitch
 * rather than a drift. Raised to keep the effect the length of the pin bought.
 *
 * **Two sets of travel figures are correct, and they are not the same number.**
 * At 1440x900 the pin reserves 900px, so in *theory* the three travel 135px, 95px
 * and 54px end to end — reserved scroll times rate, which is the arithmetic this
 * file is responsible for. What `scripts/check_pinned_collage.mjs` and CLAUDE.md
 * record is **126 / 89 / 50px**, because the rig samples the pinned band between
 * the first and last offsets it can safely read and that band is 840px, not the
 * full 900. The rig's figures are the measured ones and are the ones to quote;
 * these are what the rates mean. Either way the three stay ~40px apart and still
 * read as three distances.
 *
 * The leader sits exactly on the cap, which is the ceiling and not a target —
 * there is no room left here, and a shorter pin than this one would have to
 * accept a smaller drift rather than a larger rate.
 */
export const COLLAGE_RATES = [0.15, 0.105, 0.06] as const;

/**
 * The three flanking photographs' real widths, for `srcset` (see `ui/Photo.tsx`).
 *
 * **Byte-identical to `ChapterIntro`'s**, and deliberately so: the pinned scene
 * uses the same three columns at the same fractions with the same bleeds, so it
 * lays its photographs out at exactly the same widths, and two different strings
 * describing one geometry is how they drift apart. What differs between the two
 * compositions is the *shape* of each box — see `BOXES` — and `sizes` describes a
 * width, not a shape.
 *
 * Checked at the widths the pin actually runs at: the solo flank is 42.1vw at
 * 1440, 40.5vw at 1280 and 36.7vw at 1920, so the `42vw` entry is honest at the
 * bottom of the range and over-stated above it, which is the direction to err in.
 */
export const SIZES = {
  /** The single flank: ~32% of content + a 13vw bleed. */
  solo: "(min-width: 1024px) 42vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
  /** The upper of the pair: ~32% of content + an 11vw bleed. */
  pairTop: "(min-width: 1024px) 40vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
  /** The lower of the pair: 86% of that column on desktop, 82% below it. */
  pairLower:
    "(min-width: 1024px) 35vw, (min-width: 768px) calc((100vw - 72px) * 0.82), calc((100vw - 24px) * 0.82)",
} as const;

/**
 * The three slots' aspect ratios — the other half of `SIZES`, and the reason the
 * chapter's photographs are ordered the way they are in `content/chapters.ts`.
 *
 * These are **shallower crops than `ChapterIntro`'s**, and that is the point.
 * `rooted` carries two 700px-wide files and one 1300px one, and a 3:2 photograph
 * in `ChapterIntro`'s 7:9 portrait slot is drawn 1.93x its box's
 * width — which is how `potters-hands` came to be served at 0.61 source pixels
 * per CSS pixel at 1440 and 0.51 at 1920 (`docs/reviews/2026-08-05-density/
 * image-resolution.json`). Choosing the boxes for this composition meant
 * choosing them for these three photographs: the 1300px file takes the one tall
 * slot, the two 700px files sit in landscape frames drawn at their box's own
 * width, and all three clear 1.1 at every viewport the pin runs at.
 *
 * Each entry mirrors the `aspect-[...]` class on the `ImageReveal` below it, and
 * `lib/sizes.test.ts` compares the two sets rather than trusting this comment.
 */
export const BOXES = {
  /** `aspect-[4/5]`. */
  solo: 4 / 5,
  /** `aspect-[3/2]`. */
  pairTop: 3 / 2,
  /** `aspect-[3/2]`. */
  pairLower: 3 / 2,
} as const;

/**
 * The reference site's signature effect, and the client's own description of it:
 * *"the centre text stays frozen in place for a long stretch of scrolling, while
 * old family and wildlife photographs float up past it on the left and right
 * sides, each moving at slightly different speeds. It feels like a memory album
 * drifting by around a still headline."*
 *
 * **`rooted` is the one chapter that earns a pin.** It is the page's memory
 * chapter — the tree the brand is named for, the Gond and the potters of
 * Pachdhar — so drifting archive imagery reads there as meaning rather than as
 * decoration. `StickyScene` was built in Plan 3 and deliberately never mounted,
 * on the rule that a pinned scene which just sits there is a paid-for empty
 * screen. A chapter held still while three photographs rise past it at three
 * speeds is that scene's content advancing, which is the only thing that rule
 * asks for.
 *
 * ## Two compositions, one chapter
 *
 * This renders both and hands them to `CollageStage`, which decides. Unpinned —
 * on the server, with no JavaScript, under reduced motion, on a browser with no
 * `IntersectionObserver`, and at every viewport narrower or shorter than
 * `PIN_QUERY` — the chapter is the ordinary `ChapterIntro` it has always been,
 * reserving no extra scroll. That is not a degraded fallback built for this
 * task; it is the composition the page shipped yesterday, measured at 35.3%
 * empty, and every one of those routes lands on a path the page already
 * exercises.
 *
 * The pinned scene is the same three columns at the same widths, with two
 * differences that matter: the flanks are cropped shallower so the two 700px
 * photographs are drawn near their own resolution (see `BOXES`), and the whole
 * thing is vertically centred in exactly one screen, because that is what a pin
 * holds still.
 *
 * ## Why the drift is on its own wrapper
 *
 * `[data-drift]` is a measurement hook first and a selector second, exactly as
 * `[data-parallax]` is: it is what lets `scripts/check_pinned_collage.mjs` find
 * these three elements in a real browser and check that they moved, by different
 * amounts, while the headline beside them did not. Recognising a drifting
 * photograph from outside by the inline transform GSAP writes would be a check
 * that a mechanism was configured — the shape this project has been burned by
 * nine times.
 *
 * It is also a separate element from the `ImageReveal` inside it. The drift is a
 * `transform`; the entrance is a `scale` on a different element. Tailwind v4
 * compiles `scale-*` to the `scale` property, which *composes* with `transform`
 * rather than replacing it, and a mask that silently never wiped is precisely
 * how this page shipped broken for the length of one build on 5 Aug 2026.
 */
export function PinnedCollage({
  chapter,
  mirrored = false,
  surface = false,
}: {
  chapter: Chapter;
  /** Which margin takes the single photograph. Passed through when unpinned. */
  mirrored?: boolean;
  surface?: boolean;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as IntroCopy;
  const [solo, pairTop, pairLower] = chapter.media;

  const soloColumn = mirrored ? "col-start-3" : "col-start-1";
  const pairColumn = mirrored ? "col-start-1" : "col-start-3";
  const soloBleed = mirrored
    ? "-mr-[13vw] w-[calc(100%+13vw)]"
    : "-ml-[13vw] w-[calc(100%+13vw)]";
  const pairBleed = mirrored
    ? "-ml-[11vw] w-[calc(100%+11vw)]"
    : "-mr-[11vw] w-[calc(100%+11vw)]";
  // The smaller of the pair pulls back towards the text rather than sitting
  // flush under the larger one — two stacked images with a shared edge is a grid.
  const pairLowerPull = mirrored ? "ml-auto" : "mr-auto";

  return (
    <CollageStage
      flowing={<ChapterIntro chapter={chapter} mirrored={mirrored} surface={surface} />}
    >
      <ChapterSurface id={chapter.id} surface={surface}>
        <StickyScene screens={COLLAGE_SCREENS}>
          {/*
           * `h-full` against the scene's own 100vh, and `items-center` so each
           * column is centred in the screen independently. The gap inside the
           * pair is 2.9vw rather than a fixed number of pixels because that is
           * what keeps the two columns the same height as each other from 1440
           * to 2560 — the pair's two frames and the solo's one grow at different
           * rates, and a fixed gap only balances at one width.
           */}
          <div className="grid h-full grid-cols-[minmax(0,1.15fr)_minmax(0,1.3fr)_minmax(0,1.15fr)] items-center gap-x-10">
            {/*
             * The `max-h-*` on each frame is a guard, not a layout. At every
             * viewport the pin actually runs at these never bind — at 1440x900
             * the three frames are 84.2vh, 42.8vh and 36.8vh tall — and the
             * declared `BOXES` are therefore the real boxes. What they catch is
             * the shape of window nobody designs for and someone eventually
             * drags: the flanks grow with `vw`, so at 2560x900 the solo frame
             * would be 985px tall inside a 900px scene and would paint over the
             * chapter below. A photograph may not be taller than the screen it
             * is pinned in. Clamping shortens a box without narrowing it, so the
             * crop gets *shallower* than `BOXES` declares and the browser is
             * asked for slightly more resolution than it needs — the safe
             * direction, and the only one worth erring in here.
             */}
            <div className={`${soloColumn} ${soloBleed} row-start-1`}>
              <div data-drift={COLLAGE_RATES[0]}>
                <ImageReveal className="block aspect-[4/5] max-h-[88vh] w-full">
                  <Photo
                    id={solo}
                    sizes={SIZES.solo}
                    box={BOXES.solo}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </div>
            </div>

            {/* The frozen centre. Nothing here is handed to the scrub. */}
            <div className="col-start-2 row-start-1 px-6">
              <Enter>
                <div className="flex flex-col items-center">
                  {chapter.number && chapter.label && (
                    <ChapterMark number={chapter.number} label={chapter.label} align="centre" />
                  )}
                  <TwoToneHeading
                    heading={copy.heading}
                    align="centre"
                    className="mt-6 max-w-[18ch]"
                  />
                  <span
                    aria-hidden="true"
                    className="mt-8 block h-px w-16"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                </div>
              </Enter>

              {/*
               * One body size rather than `ChapterIntro`'s two, and a little
               * tighter. The chapter has to be held still inside a single screen
               * here instead of being allowed to run as long as it likes, and
               * dropping the opening paragraph from 1.15rem to the size of the
               * other two is the whole of what buys the room. Nothing is cut.
               */}
              <div className="mx-auto mt-8 max-w-[56ch] space-y-4">
                {copy.body.map((paragraph, i) => (
                  <Enter key={i} delay={0.06 * i}>
                    <p
                      className="font-[family-name:var(--font-body)] text-[1.02rem] leading-[1.65]"
                      style={{ color: i === 0 ? "var(--text)" : "var(--dim)" }}
                    >
                      {paragraph}
                    </p>
                  </Enter>
                ))}
              </div>
            </div>

            <div className={`flex flex-col gap-[2.9vw] ${pairColumn} ${pairBleed} row-start-1`}>
              <div data-drift={COLLAGE_RATES[1]}>
                <ImageReveal className="block aspect-[3/2] max-h-[45vh] w-full">
                  <Photo
                    id={pairTop}
                    sizes={SIZES.pairTop}
                    box={BOXES.pairTop}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </div>
              <div className={`w-[86%] ${pairLowerPull}`}>
                <div data-drift={COLLAGE_RATES[2]}>
                  <ImageReveal className="block aspect-[3/2] max-h-[39vh] w-full">
                    <Photo
                      id={pairLower}
                      sizes={SIZES.pairLower}
                      box={BOXES.pairLower}
                      pictureClassName="block h-full w-full"
                      className="h-full w-full object-cover"
                    />
                  </ImageReveal>
                </div>
              </div>
            </div>
          </div>
        </StickyScene>
      </ChapterSurface>
    </CollageStage>
  );
}
