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
              <Plate id={plate.mediaId} plate={plate.plate} caption={plate.caption} />
            </div>
          ))}
        </div>
      </div>
    </ChapterSurface>
  );
}
