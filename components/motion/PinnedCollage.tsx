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
import { DURATION } from "@/lib/motion";

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
  footer,
}: {
  chapter: Chapter;
  /** Which margin takes the single photograph. Passed through when unpinned. */
  mirrored?: boolean;
  surface?: boolean;
  /**
   * Rendered last inside the section, below the pinned scene once it releases.
   *
   * **It goes into both branches.** `CollageStage` shows the pinned composition
   * above 1440px and `ChapterIntro` everywhere else, and a footer wired into only
   * one of them would be a chapter that has a film on a desktop and none on a
   * laptop — the exact width-dependent absence that made the pin itself look
   * broken to the client on 5 Aug.
   */
  footer?: React.ReactNode;
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
      flowing={
        <ChapterIntro chapter={chapter} mirrored={mirrored} surface={surface} footer={footer} />
      }
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
                  <Enter key={i} delay={DURATION.stagger * i}>
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

        {/*
         * After the pin releases, so it closes the chapter rather than travelling
         * through it. `StickyScene` reserves its own scroll above; this sits below
         * that, hard against the surface change into `03 · The Forest`.
         *
         * **The negative top margin is the drift's, not a taste decision, and it
         * is why this differs from `ChapterIntro`'s `lg:mt-4`.** The three
         * photographs are still displaced when the pin lets go — measured -81,
         * -57 and -32px at 1920x1080 at the scroll position where the potter is
         * actually read — and the footer is not part of the scene, so it does not
         * rise with them. Laid out 16px below the composition, it was **148px**
         * below the nearest photograph and 268px below the prose by the time
         * anyone saw it, alone in a band of cream. The client's words for that
         * were "it still feels pretty disconnected from the section".
         *
         * **The pull is a formula, not a number, because the space it cancels is
         * `items-center`'s and scales with the screen.** The flanks fill the
         * pinned screen and the centre column does not, so the room below the
         * prose is half the surplus — `(H - C) / 2` exactly, for screen height H
         * and centre-column ink C. Measured: 252px at 1080, 212px at 1000, 162px
         * at 900, 115px at 1440x860. A fixed pull safe at the shortest screen the
         * pin runs at therefore strands the potter on a tall one, and a fixed
         * pull tuned for 1080 puts it through the last paragraph at 1000. Both
         * were tried and both were measured doing exactly that.
         *
         * So: `50vh - C/2 - 56px`, which holds the gap at **56px at every screen
         * the pin runs at**, from 1440x860 to 2560x1440. Verified 56px at
         * 1920x1080, 1600x1000, 1600x900 and 1440x860.
         *
         * **C changes with width, and only at 1600.** `max-w-[1600px]` caps the
         * container, so every viewport at or above 1600 lays the prose out at one
         * width and C is 576px; at 1440 the column is 160px narrower, the copy
         * wraps to C = 630px. Hence two constants — 344 = 576/2 + 56, and
         * 371 = 630/2 + 56. Between 1440 and 1600 the container grows and the
         * narrow constant over-states C, which loses up to 27px of the pull; that
         * errs towards air rather than towards a collision, which is the only
         * direction worth erring in here.
         *
         * C is *rendered* copy, so a paragraph added to this chapter shortens the
         * gap by half a line and one removed lengthens it. That degrades gently
         * and needs no edit until it is visible.
         *
         * `relative` is load-bearing: `.sticky-scene-inner` is `position: sticky`
         * and so paints above non-positioned siblings whatever the DOM order, and
         * this now overlaps its bottom by up to 196px. Positioning the footer too
         * puts tree order back in charge. Nothing overlaps horizontally either
         * way — the potter is 220px centred in the middle column, ~187px clear of
         * both flanks — but that is a fact about today's widths, not a guarantee.
         *
         * All of it is safe *only* here. `CollageStage` shows this branch only
         * where the pin is live, so there is no route on which this margin
         * applies to a composition whose photographs never drifted.
         */}
        {footer && (
          <div className="relative -mb-14 mt-[calc(371px-50vh)] flex justify-center min-[1600px]:mt-[calc(344px-50vh)]">
            {footer}
          </div>
        )}
      </ChapterSurface>
    </CollageStage>
  );
}
