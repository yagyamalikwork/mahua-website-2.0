import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Parallax } from "@/components/motion/Parallax";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type ExperienceCopy, type TwoTone } from "@/content/home";
import { DURATION } from "@/lib/motion";

type SplitFeatureCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
  readonly experiences: readonly ExperienceCopy[];
};

/**
 * The six photographs' real widths, for `srcset` (see `ui/Photo.tsx`).
 *
 * Bands 1 and 2 run a 12-column grid with a 56px gutter inside
 * `ChapterSurface`'s `max-w-[1600px]` / `px-6` / `md:px-12` container: the large
 * photograph is `col-span-7` plus the 9vw it reaches past the viewport edge
 * (~62vw at 1440), the small one laid over it is 38% / 32% of that, the pool
 * beside band 2's line is `col-span-5` (~38vw), and band 3's sticky photograph
 * is `col-span-5` (~37vw). Rounded up.
 */
export const SIZES = {
  /** `dawn` and `hammocks` — col-span-7 plus a 9vw bleed. */
  wide: "(min-width: 1024px) 63vw, (min-width: 768px) calc(100vw - 48px), calc(100vw - 24px)",
  /** `tigerTrack` — laid over band 1 at 38% of the photograph beneath it. */
  inlayWide:
    "(min-width: 1024px) 25vw, (min-width: 768px) calc((100vw - 48px) * 0.42), calc((100vw - 24px) * 0.42)",
  /** `canopy` — laid over band 2 at 32%. */
  inlayTall:
    "(min-width: 1024px) 21vw, (min-width: 768px) calc((100vw - 48px) * 0.4), calc((100vw - 24px) * 0.4)",
  /** `pool` — in flow under band 2's line, col-span-5. */
  aside: "(min-width: 1024px) 40vw, calc(100vw - 48px)",
  /** `boardwalk` — the sticky column beside the index: col-span-6 from xl, 5 below it. */
  sticky: "(min-width: 1280px) 45vw, (min-width: 1024px) 35vw, calc(100vw - 48px)",
} as const;

/**
 * The same six slots' aspect ratios, for the `object-cover` crop `SIZES` cannot
 * see. Each mirrors the `aspect-[...]` classes on its own `ImageReveal`, widest
 * breakpoint first. Bands 1 and 2 share `SIZES.wide` but not their ratios —
 * band 1 is 3:2 until `lg`, band 2 is 16:9 throughout — which is why these are
 * six entries and not five.
 */
export const BOXES = {
  /** Band 1's `dawn`: `aspect-[3/2]`, then `lg:aspect-[16/9]`. */
  wideStacked: [
    [1024, 16 / 9],
    [0, 3 / 2],
  ],
  /** Band 2's `hammocks`: `aspect-[16/9]` at every width. */
  wide: 16 / 9,
  /** `aspect-square`. */
  inlayWide: 1,
  /** `aspect-[3/4]`. */
  inlayTall: 3 / 4,
  /** `aspect-[7/3]` at every width — `pool-daylight-forest` is a 2.28:1 letterbox. */
  aside: 7 / 3,
  /** `aspect-[4/5]` at every width — only the column it sits in changes. */
  sticky: 4 / 5,
} as const;

/**
 * Copy one side, imagery the other — three times over, and the side alternates
 * every time. The brief asks for the sides to alternate *between instances*; the
 * page only has one instance of this layout, so the alternation happens inside
 * it, which is also what stops a chapter carrying five photographs and six
 * experiences from reading as one long column.
 *
 * The three bands map onto what the chapter actually says:
 *
 * 1. The dawn drive — the heading and the first paragraph, against the guide at
 *    sunrise with the tiger on the track laid over its corner.
 * 2. "Then the day slows right down" — the half most lodges leave out, set large
 *    beside the hammocks, which are the only photograph in the whole library that
 *    says *rest* (`content/chapters.ts` says so in as many words), with the pool
 *    in daylight under the line itself. That column held one display sentence and
 *    nothing else, and it is half the width of the chapter.
 * 3. The six experiences, as a numbered index beside the boardwalk.
 *
 * The small photograph in bands 1 and 2 is absolutely positioned and therefore
 * contributes no height, so its cluster carries bottom padding to make room for
 * it. Without that it would either hang out of the section or push the band's
 * height past what its own photograph needs.
 *
 * Band 3's photograph is `lg:sticky`: the visitor travels the length of a
 * six-item index and the photograph holds. `position: sticky`, not
 * `StickyScene` — nothing here needs a section taller than its own content, and
 * that component is the one thing left on the page that could give it one.
 *
 * It grew from `col-span-4` to five columns, and to six from `xl`, on 5 Aug
 * 2026. Six short entries with air between them cannot fill 1440px on their own
 * — those screens measured 57-60% empty against non-negotiable #8's 45% — so
 * what carries them is the photograph, and at four columns it was 411px wide.
 * The split stays 5/7 between 1024 and 1280, where the index's two columns are
 * narrow enough already; only the width that appears above 1280 is reallocated.
 * The photograph is then the taller of the two on a wide desktop, so the pin has
 * travel at the narrow end of `lg` and none at the wide end.
 */
export function SplitFeature({
  chapter,
  surface = false,
  footer,
}: {
  chapter: Chapter;
  surface?: boolean;
  /**
   * Rendered at the foot of the section, on its own ground line. `field-days`
   * passes the ink tiger; nothing else uses it.
   *
   * A slot rather than a `chapter.id` check inside this component. Every chapter
   * section here is self-contained and never reaches into another, and *which*
   * chapter carries the tiger is a decision belonging to the page's spine — where
   * the density figures that chose it can be seen next to the chapters they
   * describe.
   */
  footer?: React.ReactNode;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as SplitFeatureCopy;
  const [dawn, boardwalk, tigerTrack, canopy, hammocks, pool] = chapter.media;

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      {/* `relative` so a `footer` can be anchored into band 3's existing empty
          column rather than adding a band of its own — see the note there. */}
      <div className="relative">
        {/* Band 1 — copy left, imagery right. */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-14">
          <div className="lg:col-span-5">
            <Enter>
              <div>
                {chapter.number && chapter.label && (
                  <ChapterMark number={chapter.number} label={chapter.label} />
                )}
                <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[14ch]" />
                <p
                  className="mt-8 max-w-[52ch] font-[family-name:var(--font-body)] text-[1.08rem] leading-[1.72] md:text-lg"
                  style={{ color: "var(--text)" }}
                >
                  {copy.body[0]}
                </p>
              </div>
            </Enter>
          </div>

          <div className="relative -mr-6 pb-[22%] md:-mr-12 lg:col-span-7 lg:-mr-[9vw] lg:pb-[12%]">
            <Parallax strength={0.07}>
              <ImageReveal className="block aspect-[3/2] w-full lg:aspect-[16/9]">
                <Photo
                  id={dawn}
                  sizes={SIZES.wide}
                  box={BOXES.wideStacked}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </Parallax>
            {/* The cream padding is the separation between the two photographs —
                a border in the page's own paper, so the smaller one reads as
                laid on top rather than collaged into the larger. */}
            <div
              className="absolute bottom-0 left-[-6%] w-[42%] p-2 lg:w-[38%] lg:p-3"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <ImageReveal className="block aspect-square w-full" delay={DURATION.imageInlayDelay}>
                <Photo
                  id={tigerTrack}
                  sizes={SIZES.inlayWide}
                  box={BOXES.inlayWide}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </div>
          </div>
        </div>

        {/* Band 2 — imagery left, copy right. */}
        <div className="mt-14 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:items-center lg:gap-x-14">
          <div className="relative order-2 -ml-6 pb-[20%] md:-ml-12 lg:order-1 lg:col-span-7 lg:-ml-[9vw] lg:pb-[13%]">
            <Parallax strength={0.07}>
              <ImageReveal className="block aspect-[16/9] w-full">
                <Photo
                  id={hammocks}
                  sizes={SIZES.wide}
                  box={BOXES.wide}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </Parallax>
            <div
              className="absolute right-[-6%] bottom-0 w-[40%] p-2 lg:w-[32%] lg:p-3"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <ImageReveal className="block aspect-[3/4] w-full" delay={DURATION.imageInlayDelay}>
                <Photo
                  id={canopy}
                  sizes={SIZES.inlayTall}
                  box={BOXES.inlayTall}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <Enter>
              <div>
                <span
                  aria-hidden="true"
                  className="block h-px w-16"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                <p className="mt-7 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.8rem,3.4vw,3rem)] font-light leading-[1.18] text-[color:var(--text)]">
                  {copy.body[1]}
                </p>
              </div>
            </Enter>
            {/* The line and the thing it describes. A letterbox rather than a
                second full frame: it belongs to the sentence above it, and a
                square here would compete with the hammocks across the gutter. */}
            <div className="mt-9">
              <Parallax strength={0.05}>
                <ImageReveal className="block aspect-[7/3] w-full" delay={DURATION.imageAsideDelay}>
                  <Photo
                    id={pool}
                    sizes={SIZES.aside}
                    box={BOXES.aside}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </Parallax>
            </div>
          </div>
        </div>

        {/* Band 3 — the index of experiences, imagery left again. */}
        <div className="mt-14 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-x-14">
          <div className="lg:col-span-5 xl:col-span-6">
            <div className="lg:sticky lg:top-16">
              <Parallax strength={0.05}>
                <ImageReveal className="block aspect-[4/5] w-full">
                  <Photo
                    id={boardwalk}
                    sizes={SIZES.sticky}
                    box={BOXES.sticky}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </Parallax>
            </div>
          </div>

          <ol className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:col-span-7 lg:gap-y-9 xl:col-span-6">
            {copy.experiences.map((experience, i) => (
              // `Enter` renders a `<div>`, so it goes inside the `<li>` — a
              // `<div>` between `<ol>` and `<li>` is invalid markup, and the
              // browser's recovery from it is to reparent the list items.
              <li key={experience.title} className="border-t" style={{ borderColor: "var(--accent)" }}>
                <Enter delay={DURATION.columnStagger * (i % 2)}>
                  <div className="pt-4">
                    <p
                      className="font-[family-name:var(--font-label)] text-[0.68rem] uppercase tracking-[0.24em]"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-light leading-tight text-[color:var(--text)] md:text-[1.7rem]">
                      {experience.title}
                    </h3>
                    <p
                      className="mt-3 font-[family-name:var(--font-body)] text-[1rem] leading-[1.68]"
                      style={{ color: "var(--dim)" }}
                    >
                      {experience.body}
                    </p>
                  </div>
                </Enter>
              </li>
            ))}
          </ol>
        </div>

        {/*
         * **Absolutely positioned from `lg`, so it contributes no height.**
         *
         * In flow it added ~250px of new band that was almost entirely cream, and
         * the measurement was unambiguous: `field-days` went from 41.5% to 44.4%
         * mean empty and its worst screen from 52.4% to 63.9%. It bought scroll
         * without filling anything — the exact failure non-negotiable #9 records
         * against the pinned collage.
         *
         * Band 3's row is as tall as the sticky photograph beside it, so the index
         * column already ends in a deep band of empty paper. Anchoring the drawing
         * into that existing space is what fills a screen instead of adding one,
         * and it is the same device the inlay photographs above use for the same
         * reason.
         *
         * Below `lg` the bands stack and there is no spare column to sit in, so it
         * stays in flow — on a phone the chapter is dense already and the tiger is
         * scaled by width rather than height.
         */}
        {/* `-bottom-16` against the section's own `lg:py-20`: the drawing sits
            inside that 80px of padding with 16px of air beneath it. At the full
            -20 its lowest stroke landed exactly on the boundary between the two
            cream surfaces, which reads as a collision rather than a choice — the
            artwork is cropped tight to its ink, so its box edge *is* its lowest
            line. */}
        {footer && (
          <div className="mt-12 flex justify-center lg:pointer-events-none lg:absolute lg:right-0 lg:-bottom-16 lg:mt-0 lg:justify-end">
            {footer}
          </div>
        )}
      </div>
    </ChapterSurface>
  );
}
