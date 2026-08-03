import { ImageReveal } from "@/components/motion/ImageReveal";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type ExperienceCopy, type TwoTone } from "@/content/home";

type SplitFeatureCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
  readonly experiences: readonly ExperienceCopy[];
};

/**
 * The five photographs' real widths, for `srcset` (see `ui/Photo.tsx`).
 *
 * Bands 1 and 2 run a 12-column grid with a 56px gutter inside
 * `ChapterSurface`'s `max-w-[1600px]` / `px-6` / `md:px-12` container: the large
 * photograph is `col-span-7` plus the 9vw it reaches past the viewport edge
 * (~62vw at 1440), the small one laid over it is 34% / 32% of that, and band 3's
 * sticky photograph is `col-span-4` (~29vw). Rounded up.
 */
const SIZES = {
  /** `dawn` and `hammocks` — col-span-7 plus a 9vw bleed. */
  wide: "(min-width: 1024px) 63vw, (min-width: 768px) calc(100vw - 48px), calc(100vw - 24px)",
  /** `tigerTrack` — laid over band 1 at 34% of the photograph beneath it. */
  inlayWide:
    "(min-width: 1024px) 22vw, (min-width: 768px) calc((100vw - 48px) * 0.42), calc((100vw - 24px) * 0.42)",
  /** `canopy` — laid over band 2 at 32%. */
  inlayTall:
    "(min-width: 1024px) 21vw, (min-width: 768px) calc((100vw - 48px) * 0.4), calc((100vw - 24px) * 0.4)",
  /** `boardwalk` — the sticky col-span-4 beside the index. */
  sticky: "(min-width: 1024px) 30vw, calc(100vw - 48px)",
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
 *    says *rest* (`content/chapters.ts` says so in as many words).
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
 */
export function SplitFeature({ chapter, surface = false }: { chapter: Chapter; surface?: boolean }) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as SplitFeatureCopy;
  const [dawn, boardwalk, tigerTrack, canopy, hammocks] = chapter.media;

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        {/* Band 1 — copy left, imagery right. */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-14">
          <div className="lg:col-span-5">
            <Reveal>
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
            </Reveal>
          </div>

          <div className="relative -mr-6 pb-[22%] md:-mr-12 lg:col-span-7 lg:-mr-[9vw] lg:pb-[12%]">
            <Parallax strength={0.07}>
              <ImageReveal className="block aspect-[3/2] w-full lg:aspect-[16/9]">
                <Photo
                  id={dawn}
                  sizes={SIZES.wide}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </Parallax>
            {/* The cream padding is the separation between the two photographs —
                a border in the page's own paper, so the smaller one reads as
                laid on top rather than collaged into the larger. */}
            <div
              className="absolute bottom-0 left-[-6%] w-[42%] p-2 lg:w-[34%] lg:p-3"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <ImageReveal className="block aspect-square w-full" delay={0.15}>
                <Photo
                  id={tigerTrack}
                  sizes={SIZES.inlayWide}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </div>
          </div>
        </div>

        {/* Band 2 — imagery left, copy right. */}
        <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:items-center lg:gap-x-14">
          <div className="relative order-2 -ml-6 pb-[20%] md:-ml-12 lg:order-1 lg:col-span-7 lg:-ml-[9vw] lg:pb-[13%]">
            <Parallax strength={0.07}>
              <ImageReveal className="block aspect-[16/9] w-full">
                <Photo
                  id={hammocks}
                  sizes={SIZES.wide}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </Parallax>
            <div
              className="absolute right-[-6%] bottom-0 w-[40%] p-2 lg:w-[32%] lg:p-3"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <ImageReveal className="block aspect-[3/4] w-full" delay={0.15}>
                <Photo
                  id={canopy}
                  sizes={SIZES.inlayTall}
                  pictureClassName="block h-full w-full"
                  className="h-full w-full object-cover"
                />
              </ImageReveal>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <Reveal>
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
            </Reveal>
          </div>
        </div>

        {/* Band 3 — the index of experiences, imagery left again. */}
        <div className="mt-16 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-x-14">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-16">
              <Parallax strength={0.05}>
                <ImageReveal className="block aspect-[4/5] w-full lg:aspect-[3/4]">
                  <Photo
                    id={boardwalk}
                    sizes={SIZES.sticky}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </Parallax>
            </div>
          </div>

          <ol className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:col-span-8 lg:gap-y-12">
            {copy.experiences.map((experience, i) => (
              // `Reveal` renders a `<div>`, so it goes inside the `<li>` — a
              // `<div>` between `<ol>` and `<li>` is invalid markup, and the
              // browser's recovery from it is to reparent the list items.
              <li key={experience.title} className="border-t" style={{ borderColor: "var(--accent)" }}>
                <Reveal delay={0.05 * (i % 2)}>
                  <div className="pt-5">
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
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </ChapterSurface>
  );
}
