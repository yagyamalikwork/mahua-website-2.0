import { ImageReveal } from "@/components/motion/ImageReveal";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
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
 * The three flanking photographs' real widths, for `srcset` (see `ui/Photo.tsx`).
 *
 * Below 1024px each one spans the container and bleeds 24px past one edge. From
 * 1024px the grid is `0.95fr 1.5fr 0.95fr` with a 40px gutter inside a
 * `max-w-[1600px]` container, so a flank is ~28% of the content width — and then
 * grows again by the 13vw / 11vw it reaches past the viewport edge. Rounded up to
 * whole vw, because over-stating costs a tier and under-stating ships softness.
 */
const SIZES = {
  /** The single flank: ~28% of content + a 13vw bleed. */
  solo: "(min-width: 1024px) 42vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
  /** The upper of the pair: ~28% of content + an 11vw bleed. */
  pairTop: "(min-width: 1024px) 40vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
  /** The lower of the pair: 70% of that column on desktop, 82% below it. */
  pairLower:
    "(min-width: 1024px) 28vw, (min-width: 768px) calc((100vw - 72px) * 0.82), calc((100vw - 24px) * 0.82)",
} as const;

/**
 * The reference's signature move: a two-tone display heading over a centred
 * column of prose, with photographs floating asymmetrically at both margins,
 * partially cropped by the viewport edge. Not a grid.
 *
 * **The images are in flow, not absolutely positioned.** That is the whole
 * difference between this and the build that got rejected. Absolute images
 * contribute no height, so the section ends up as tall as its text and the
 * photographs either overlap it or spill out of it; in flow, the section is as
 * tall as whichever column is tallest and there is imagery beside the text at
 * every scroll position through it. They reach past the viewport edge with a
 * negative margin and a matching width, clipped by `overflow-x-clip` on the
 * section — which, unlike `overflow-x: hidden`, does not turn the page into a
 * scroll container.
 *
 * **The three slots are fixed-ratio boxes with `object-cover`.** The two chapters
 * that use this layout carry photographs of quite different shapes (a 2:3
 * portrait shrine against a 16:9 bonfire), and ratio boxes are what stop the
 * composition being one column of 800px and one of 300px depending on which
 * chapter it is. Photographs are cropped, never distorted.
 *
 * `mirrored` flips which margin gets the single image and which gets the pair,
 * because the page uses this layout twice and two identical compositions read as
 * a template — which was the client's word for the last build.
 */
export function ChapterIntro({
  chapter,
  mirrored = false,
  surface = false,
}: {
  chapter: Chapter;
  mirrored?: boolean;
  surface?: boolean;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as IntroCopy;
  const [solo, pairTop, pairLower] = chapter.media;

  const soloColumn = mirrored ? "lg:col-start-3" : "lg:col-start-1";
  const pairColumn = mirrored ? "lg:col-start-1" : "lg:col-start-3";
  const soloBleed = mirrored
    ? "lg:-mr-[13vw] lg:w-[calc(100%+13vw)]"
    : "lg:-ml-[13vw] lg:w-[calc(100%+13vw)]";
  const pairBleed = mirrored
    ? "lg:-ml-[11vw] lg:w-[calc(100%+11vw)]"
    : "lg:-mr-[11vw] lg:w-[calc(100%+11vw)]";
  // The smaller of the pair pulls back towards the text rather than sitting flush
  // under the larger one — two stacked images with a shared edge is a grid again.
  const pairLowerPull = mirrored ? "lg:ml-auto" : "lg:mr-auto";

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <div className="flex flex-col gap-14 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.5fr)_minmax(0,0.95fr)] lg:items-start lg:gap-x-10">
          {/*
           * Single image at one margin.
           *
           * Two elements, and this is load bearing: the desktop bleed lives on
           * the grid item and the phone bleed on the wrapper inside it. Both on
           * one element means `lg:-ml-[13vw]` and the `lg:ml-0` that cancels the
           * phone bleed are two `margin-left` rules at the same breakpoint, and
           * which one wins is down to the order Tailwind happens to emit them
           * in. It emitted `ml-0` — so the width still grew by 13vw but the
           * margin did not pull back, and the photograph sat on top of the
           * chapter's own text. Caught in a browser, not by any test here.
           */}
          <div className={`${soloColumn} ${soloBleed} lg:row-start-1 lg:mt-10`}>
            <div className="-ml-6 w-[calc(100%+1.5rem)] md:-ml-12 md:w-[calc(100%+3rem)] lg:ml-0 lg:w-full">
              <Parallax strength={0.08}>
                <ImageReveal className="block aspect-[3/2] w-full lg:aspect-[7/9]">
                  <Photo
                    id={solo}
                    sizes={SIZES.solo}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </Parallax>
            </div>
          </div>

          {/* The chapter itself. Vertically centred against the taller flank so
              its slack reads as air beside photographs, not as a hole below it. */}
          <div className="lg:col-start-2 lg:row-start-1 lg:self-center lg:px-6">
            <Reveal>
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
            </Reveal>

            <div className="mx-auto mt-8 max-w-[56ch] space-y-5">
              {copy.body.map((paragraph, i) => (
                <Reveal key={i} delay={0.06 * i}>
                  <p
                    className={`font-[family-name:var(--font-body)] leading-[1.72] ${
                      i === 0 ? "text-[1.15rem] md:text-[1.22rem]" : "text-[1.02rem] md:text-lg"
                    }`}
                    style={{ color: i === 0 ? "var(--text)" : "var(--dim)" }}
                  >
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Two images at the opposite margin, at different widths and heights. */}
          <div className={`flex flex-col gap-10 ${pairColumn} ${pairBleed} lg:row-start-1 lg:gap-10`}>
            <div className="-mr-6 w-[calc(100%+1.5rem)] md:-mr-12 md:w-[calc(100%+3rem)] lg:mr-0 lg:w-full">
              <Parallax strength={0.1}>
                <ImageReveal className="block aspect-[3/2] w-full">
                  <Photo
                    id={pairTop}
                    sizes={SIZES.pairTop}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </Parallax>
            </div>
            <div className={`w-[82%] ${pairLowerPull} lg:w-[70%]`}>
              <Parallax strength={0.06}>
                <ImageReveal className="block aspect-[4/5] w-full">
                  <Photo
                    id={pairLower}
                    sizes={SIZES.pairLower}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </Parallax>
            </div>
          </div>
        </div>
      </div>
    </ChapterSurface>
  );
}
