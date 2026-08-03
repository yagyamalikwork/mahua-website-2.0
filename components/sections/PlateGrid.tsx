import { Reveal } from "@/components/motion/Reveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Plate } from "@/components/ui/Plate";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type PlateCopy, type TwoTone } from "@/content/home";
import { media } from "@/lib/media";

type PlateGridCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly plates: readonly PlateCopy[];
};

/**
 * A plate's real width, per column count, for `srcset` (see `ui/Photo.tsx`).
 *
 * This has to be derived alongside `columns` below rather than written once,
 * which is the whole reason the rule lives here: a plate in the four-up *details*
 * grid is ~346px at 1600 and a plate in the two-up *rooms* grid is ~732px, and a
 * single `sizes` string covering both would hand the small ones a file twice the
 * width they need. Measured off `ChapterSurface`'s container (`max-w-[1600px]`,
 * `px-6` / `md:px-12`) and this grid's `gap-x-8` / `lg:gap-x-10`, rounded up.
 */
const PLATE_SIZES: Record<number, string> = {
  2: "(min-width: 1600px) 736px, (min-width: 640px) 50vw, calc(100vw - 48px)",
  3: "(min-width: 1600px) 480px, (min-width: 1024px) 34vw, (min-width: 640px) 50vw, calc(100vw - 48px)",
  4: "(min-width: 1600px) 352px, (min-width: 1280px) 25vw, (min-width: 640px) 50vw, calc(100vw - 48px)",
};

/**
 * Numbered, captioned plates in the field-guide idiom — the guidelines' own move
 * rather than the reference's, and the page uses it three times.
 *
 * **The column count comes from the photographs, not from a constant.** Three
 * 2:3 portraits of cats want three columns; four 16:9 room interiors in four
 * columns are 330px wide and read as thumbnails, so those get two. Deciding it
 * from the orientations the chapter actually carries is what keeps one component
 * serving `forest` (3 portraits), `rooms` (4 landscapes) and `details` (a
 * portrait, a portrait, a square and a landscape) without any of the three
 * looking like it was laid out for one of the others.
 *
 * The alternating vertical offset is a specimen board, not a spreadsheet — it is
 * also what stops four ragged-height plates leaving a shelf of dead space along
 * the bottom of the row.
 *
 * The header is two columns, heading left and intro right, deliberately unlike
 * `ChapterIntro`'s centred header: the page shows these two layouts alternately
 * and they must not blur into each other.
 */
export function PlateGrid({ chapter, surface = false }: { chapter: Chapter; surface?: boolean }) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as PlateGridCopy;
  const { plates } = copy;

  const landscapes = plates.filter((p) => media(p.mediaId).orientation === "landscape").length;
  const columns = landscapes > plates.length / 2 ? 2 : plates.length;

  const columnClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 xl:grid-cols-4";

  // A chapter with one plate, or five, would fall through to the two-column
  // rule, which is the widest of the three and therefore the safe miss.
  const plateSizes = PLATE_SIZES[columns] ?? PLATE_SIZES[2];

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Reveal>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p
              className="max-w-[58ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </Reveal>
        </div>

        <div
          className={`mt-14 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-16 lg:gap-x-10 ${columnClass}`}
        >
          {plates.map((plate, i) => (
            <div
              key={plate.mediaId}
              // Every other plate hangs lower. An inline custom property rather
              // than a class, because the offset is per-index and Tailwind only
              // ships classes it can see written out in full.
              style={{ "--stagger": i % 2 === 1 ? "3.5rem" : "0rem" } as React.CSSProperties}
              className="lg:mt-[var(--stagger)]"
            >
              <Plate
                id={plate.mediaId}
                plate={plate.plate}
                caption={plate.caption}
                sizes={plateSizes}
              />
            </div>
          ))}
        </div>
      </div>
    </ChapterSurface>
  );
}
