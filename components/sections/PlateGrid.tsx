import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Plate } from "@/components/ui/Plate";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { ChapterLike } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type PlateCopy, type TwoTone } from "@/content/home";
import { media } from "@/lib/media";
import { ENTER } from "@/lib/motion";

export type PlateGridCopy = {
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
export const PLATE_SIZES: Record<number, string> = {
  // A one-plate grid never splits into columns at any width (there is only
  // ever one `grid-cols-1` cell), so this is the container's own width, full
  // stop — no `50vw` tier, because there is no breakpoint at which this plate
  // shares its row. 1504px is `ChapterSurface`'s 1600px cap minus its
  // `md:px-12` gutter; the two narrower tiers are that same container's own
  // width below the 1600px cap and below `md`'s 768px, respectively.
  1: "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
  2: "(min-width: 1600px) 736px, (min-width: 640px) 50vw, calc(100vw - 48px)",
  3: "(min-width: 1600px) 480px, (min-width: 1024px) 34vw, (min-width: 640px) 50vw, calc(100vw - 48px)",
  // 4-up runs a tighter gutter than the other two (see `COLUMN_GAP`), so its
  // plates are wider than the 40px-gutter arithmetic would give: 360px inside
  // the 1504px container at 1600, not 352.
  4: "(min-width: 1600px) 360px, (min-width: 1280px) 26vw, (min-width: 640px) 50vw, calc(100vw - 48px)",
};

/**
 * The gutter, per column count.
 *
 * Four plates across a 1344px container is the one arrangement where the gutter
 * is a material share of the row: at `gap-x-10` each plate is 306px wide and the
 * four of them cover 85% of a 1440px screen, and the *details* chapter measured
 * 58% empty largely because that is all the width its photography was allowed to
 * claim (CLAUDE.md non-negotiable #8; `docs/reviews/2026-08-05-density/`). Two
 * and three plates have room to breathe and keep the wider gutter.
 */
const COLUMN_GAP: Record<number, string> = {
  2: "gap-x-8 lg:gap-x-10",
  3: "gap-x-8 lg:gap-x-10",
  4: "gap-x-5 lg:gap-x-6",
};

/**
 * The common box a grid imposes when its plates disagree about their shape.
 *
 * A field-guide plate matches its neighbours — that is what makes a row of them
 * read as one board rather than as four photographs that happened to land near
 * each other. *Details* carried a 2:3 portrait, a 2:3 portrait, a square and a
 * 3:2 landscape, staggered, and the row ended in a ragged shelf with the bottom
 * right of the screen empty. It is a density argument and a design argument at
 * the same time, which is the only kind worth acting on.
 *
 * **The frame is `roomy:` only**, and `pocket:` is its exact complement, so on a
 * landscape phone the plate keeps the auto height `ui/Plate.tsx` caps there
 * rather than fighting it. See `app/globals.css`.
 *
 * **It was `tall:` until 12 Aug 2026 and that was the bug the client reported.**
 * `tall:` is `(min-height: 801px)`, so the frame switched OFF — and the 24vh cap
 * switched on — on a 1366x768 laptop, a 1024x768 tablet and any browser zoomed
 * past ~110%. `roomy:` is keyed to the viewport's shape instead, so only a phone
 * held sideways gets the compact treatment.
 *
 * The portrait box is 5:8 rather than the 2:3 of the photographs that ask for
 * it, and that extra height is the difference between *details* measuring 45.7%
 * empty and 42%: four plates across a 1440px screen can only ever cover 88% of
 * its width, so their height is the one variable left. 5:8 is as tall as
 * `petal-bowl-map` (700px, the narrowest source on the page) can be drawn
 * without being served under its own box.
 */
export const PLATE_FRAME = {
  portrait: { className: "roomy:aspect-[5/8]", ratio: 5 / 8 },
  square: { className: "roomy:aspect-square", ratio: 1 },
  landscape: { className: "roomy:aspect-[3/2]", ratio: 3 / 2 },
} as const;

/**
 * The box, if any, for a set of plates.
 *
 * Grids whose plates already agree — *forest*'s three portraits, *rooms*' four
 * landscapes — get none, and so cannot be changed by this at all. Where they
 * disagree the majority shape wins, and a tie goes to the portrait: it is the
 * taller box, and height is what a plate row is short of.
 */
export function plateFrame(
  orientations: readonly ("landscape" | "portrait" | "square")[],
): (typeof PLATE_FRAME)[keyof typeof PLATE_FRAME] | undefined {
  if (new Set(orientations).size <= 1) return undefined;
  const count = (o: (typeof orientations)[number]) => orientations.filter((x) => x === o).length;
  const ranked = (["portrait", "square", "landscape"] as const)
    .map((o) => ({ o, n: count(o) }))
    .sort((a, b) => b.n - a.n);
  return PLATE_FRAME[ranked[0].o];
}

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
export function PlateGrid({
  chapter,
  copy,
  surface = false,
  backdrop,
}: {
  chapter: ChapterLike;
  copy?: PlateGridCopy;
  surface?: boolean;
  /**
   * Laid between the cream and this chapter's content — see `ChapterSurface`.
   *
   * A slot rather than a lookup by `chapter.id`, for the same reason
   * `ChapterIntro`'s `footer` and `hanging` are: this component renders four
   * different chapters across three routes and none of them should have to know
   * which one it is.
   */
  backdrop?: React.ReactNode;
}) {
  const resolvedCopy = copy ?? (chapterCopy(chapter.id as ChapterCopyKey) as PlateGridCopy);
  const { plates } = resolvedCopy;

  const orientations = plates.map((p) => media(p.mediaId).orientation);
  const landscapes = orientations.filter((o) => o === "landscape").length;
  // A single landscape plate still passed `landscapes > plates.length / 2`
  // (1 > 0.5), which reserved two columns for one photograph and left the
  // second sitting empty — measured on Mahua Vann's one-plate `vann-dining`
  // at 78% empty screen (docs/reviews/2026-08-08-property-pages/). Every
  // other caller already has `plates.length >= columns`, because the "else"
  // branch below sets `columns` to `plates.length` itself; one plate is the
  // only count the "if" branch's fixed `2` could ever exceed.
  const columns = plates.length === 1 ? 1 : landscapes > plates.length / 2 ? 2 : plates.length;
  const frame = plateFrame(orientations);

  // `columns === 1` adds no breakpoint override at all: the grid's own base
  // class is already `grid-cols-1`, and a real column split at `sm`/`lg`/`xl`
  // for a single plate would reopen the same empty-cell bug the `columns`
  // clamp above exists to close.
  const columnClass =
    columns === 1
      ? ""
      : columns === 2
        ? "sm:grid-cols-2"
        : columns === 3
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : "sm:grid-cols-2 xl:grid-cols-4";

  // A chapter with five plates would fall through to the four-column rule,
  // the widest of the four and therefore the safe miss.
  const plateSizes = PLATE_SIZES[columns] ?? PLATE_SIZES[2];

  return (
    <ChapterSurface id={chapter.id} surface={surface} backdrop={backdrop}>
      <div>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={resolvedCopy.heading} className="mt-6 max-w-[16ch]" />
            </div>
          </Enter>
          <Enter delay={ENTER.stagger}>
            <p
              /*
               * The hook `scripts/check_contrast_over_photos.mjs` finds this by.
               * An attribute, not a structural selector: `#forest p` also matches
               * `ChapterMark`'s two gold paragraphs, and pointing the rig at that
               * had it measuring the chapter number as though it were body copy.
               * The same class of mistake — a contrast target found by structure —
               * once left cream type over a photograph unchecked for days with the
               * suite green (`DECISIONS.md` §2, instance 10).
               */
              data-contrast="plate-intro"
              className="max-w-[58ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {resolvedCopy.intro}
            </p>
          </Enter>
        </div>

        <div
          className={`mt-10 grid grid-cols-1 gap-y-12 md:mt-12 ${COLUMN_GAP[columns] ?? COLUMN_GAP[2]} ${columnClass}`}
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
                frame={frame}
              />
            </div>
          ))}
        </div>
      </div>
    </ChapterSurface>
  );
}
