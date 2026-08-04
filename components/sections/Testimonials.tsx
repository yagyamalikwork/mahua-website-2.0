import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Parallax } from "@/components/motion/Parallax";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type GuestQuote, type TwoTone } from "@/content/home";

type GuestsCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
  readonly quotes: readonly GuestQuote[];
};

/**
 * The offset pair's real widths, for `srcset` (see `ui/Photo.tsx`). A 12-column
 * grid with a 32px gutter from 768px up inside `ChapterSurface`'s container, so
 * the wide one is `col-span-7` (~54vw) and the tall one `col-span-5` (~38vw);
 * both stack full-width below that. Rounded up.
 */
export const SIZES = {
  wide: "(min-width: 768px) 58vw, calc(100vw - 48px)",
  tall: "(min-width: 768px) 41vw, calc(100vw - 48px)",
} as const;

/**
 * The pair's box ratios, for the `object-cover` crop. Both photographs this
 * chapter carries are landscape and the tall slot is 4:5, so that one is drawn
 * nearly twice its box's width — `garden-path-lodge` was 903 px out of a 640
 * file at 1440x900 before this existed.
 */
export const BOXES = {
  /** `aspect-[3/2]`. */
  wide: 3 / 2,
  /** `aspect-[4/5]`. */
  tall: 4 / 5,
} as const;

/**
 * What guests said, under two photographs of the place they said it about.
 *
 * A testimonial block is the easiest section on any page to leave as three
 * paragraphs floating in space, and this chapter carries only one paragraph of
 * our own words plus three short quotes — so its two photographs are load
 * bearing, not decoration. They sit as an unequal, vertically offset pair
 * (roughly 7:5, the smaller one dropped) directly under the heading, and the
 * quotes run as three columns beneath them, each opened by a gold hairline.
 *
 * The quotes are verbatim from the live site's Tripadvisor widget. Nothing here
 * is written by us, `content/home.test.ts` refuses an unattributed one, and the
 * attribution renders the name, the source and the year as three separate spans
 * so that the separators between them are ornament rather than copy.
 */
export function Testimonials({ chapter, surface = false }: { chapter: Chapter; surface?: boolean }) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as GuestsCopy;
  const [wide, tall] = chapter.media;

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <Enter>
          <div className="flex flex-col items-center text-center">
            <TwoToneHeading heading={copy.heading} align="centre" className="max-w-[16ch]" />
            <p
              className="mt-7 max-w-[62ch] font-[family-name:var(--font-body)] text-[1.08rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.body[0]}
            </p>
          </div>
        </Enter>

        <div className="mt-14 grid gap-6 md:mt-16 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <Parallax strength={0.06}>
              <ImageReveal className="block aspect-[3/2] w-full">
                <Photo
                  id={wide}
                  sizes={SIZES.wide}
                  box={BOXES.wide}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </Parallax>
          </div>
          <div className="md:col-span-5 md:mt-16">
            <Parallax strength={0.09}>
              <ImageReveal className="block aspect-[4/5] w-full">
                <Photo
                  id={tall}
                  sizes={SIZES.tall}
                  box={BOXES.tall}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </Parallax>
          </div>
        </div>

        <ul className="mt-16 grid gap-x-10 gap-y-12 md:mt-20 md:grid-cols-3">
          {copy.quotes.map((quote, i) => (
            <li key={quote.name} className="border-t" style={{ borderColor: "var(--accent)" }}>
              <Enter delay={0.06 * i}>
                <figure className="pt-6">
                  <blockquote className="font-[family-name:var(--font-display)] text-[1.35rem] leading-[1.4] font-light text-[color:var(--text)] md:text-[1.5rem]">
                    {quote.quote}
                  </blockquote>
                  <figcaption className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.22em]">
                    <cite className="not-italic" style={{ color: "var(--text)" }}>
                      {quote.name}
                    </cite>
                    <span
                      aria-hidden="true"
                      className="block h-[3px] w-[3px] rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                    <span style={{ color: "var(--dim)" }}>{quote.source}</span>
                    <span style={{ color: "var(--dim)" }}>{quote.year}</span>
                  </figcaption>
                </figure>
              </Enter>
            </li>
          ))}
        </ul>
      </div>
    </ChapterSurface>
  );
}
