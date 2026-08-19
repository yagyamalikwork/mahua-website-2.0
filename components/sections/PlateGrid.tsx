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
 * A board's column reflow — 14 Aug 2026, replacing a fixed breakpoint
 * (`sm:grid-cols-2 xl:grid-cols-3`, etc.) that only ever moved once (13 Aug)
 * and still let every plate keep shrinking continuously as the window
 * narrowed or the browser zoomed, because between whichever two breakpoints
 * were current a plate's width was still `N%` of the viewport. The client's
 * own re-test caught it — *"the images … still shrink with the smaller
 * screen size … also shrink when zoom value reaches 150% and above"* — and
 * his ruling replaces the tolerance entirely:
 *
 * **"A plate may never render narrower than its own width at 1440x900. A
 * board drops a column the moment holding that column count would take a
 * plate below that reference, and at one column the plate fills the
 * container."**
 *
 * **This is built on flexbox wrap, not CSS Grid's `auto-fit`, and that was
 * not the first thing tried.** `grid-template-columns: repeat(auto-fit,
 * minmax(min(REFpx, 100%), 1fr))` states the rule just as directly and was
 * the first build — one rule, immune to the defect shape `DECISIONS.md` §2
 * #23 and #44 both are (two rules on one element, resolved by framework
 * emission order). It measured correctly and it looked wrong: **Grid,
 * `auto-fit` collapses only the TRACKS that hold no item, and a track is
 * shared by every row** — so when a board's plate count is not a multiple of
 * its current column count, the trailing plate lands alone in a new row,
 * inside a track exactly as wide as its neighbours above, and every OTHER
 * track in that row still exists and is simply empty. Screenshotted at
 * 1024px: Forest (3 plates) at 2 columns left its third plate beside a bare
 * cream cell exactly as wide as the plate itself — non-negotiable #8's
 * "every screen must carry weight," failed by the fix meant to satisfy it.
 * Details (4 plates) at 3 columns did the same with its fourth. Neither is
 * hypothetical; both were seen, not merely reasoned about.
 *
 * Flexbox wrap does not have this failure mode, because it has no shared
 * track model at all: a wrapped line is sized independently of every other
 * line, so a lone trailing item is the ONLY thing on its line and
 * `flex-grow` gives it that whole line's leftover width. Each plate gets
 * `flex: 1 1 REFpx` — grow and shrink from a `REFpx` basis — on a
 * `flex flex-wrap` container:
 *
 *   - A line holds as many plates as fit at `REFpx` each before the next one
 *     would overflow, which is the identical arithmetic `grid-auto-fit` used
 *     for deciding a column count, so `referenceWidth`/`columnThreshold`/
 *     `plateSizesFor` below did not need to change at all — only the CSS
 *     property that consumes their output did.
 *   - Within a line, `flex-grow: 1` distributes any leftover width evenly —
 *     the same thing `1fr` did in the grid version, including the 1440px
 *     case where `REF` is deliberately a little under the exact fit.
 *   - A plate ALONE on its own line — the case that broke — has nothing to
 *     share the line with, so it alone receives 100% of the leftover width.
 *     A full-width orphan is not a stretch to disguise a bug; it is what
 *     "fills the container" already meant for the one-column case, now
 *     applied consistently to a partial last row too.
 *   - `flex-shrink: 1` from the same shorthand is what gets a board down to
 *     one full-width plate on a narrow phone: once `REFpx` would exceed the
 *     container, wrapping cannot help (there is nowhere to move a lone item
 *     to), so the item shrinks to the container's own width instead —
 *     literally the "fills the container" half of the client's ruling, the
 *     same outcome `min(REFpx, 100%)` gave under Grid, reached a different
 *     way. `min-width: 0` on each item is what lets that shrink go all the
 *     way down rather than stopping at the item's own content-based minimum,
 *     which is otherwise `auto` (i.e. "whatever the content needs") for a
 *     flex item by default.
 *
 * `REF` is derived below, per board, from the column count `plateColumns`
 * already computes and the real gap `COLUMN_GAP` renders at `lg` — and the
 * SAME `REF` feeds both each plate's `flex-basis` and `sizes`
 * (`plateSizesFor`), computed once per render in `PlateGrid` itself, so the
 * box a photograph is fetched for and the box it is laid out in cannot drift
 * apart.
 */

/**
 * `ChapterSurface`'s own container geometry, as numbers. `ChapterSurface`
 * only expresses this as Tailwind classes (`max-w-[1600px] px-6 md:px-12`),
 * and this file needs the pixel arithmetic those classes produce, not the
 * class names — if `ChapterSurface`'s own numbers ever move, these must move
 * with them; there is no way to derive one from the other.
 */
const CONTAINER_AT_1440 = 1344; // 1440 − md:px-12's 96px (48px each side)
const CONTAINER_CAP = 1504; // ChapterSurface's 1600px cap − the same 96px
const CONTAINER_CAP_VIEWPORT = 1600;
const MD_BREAKPOINT = 768; // px-6 (24px/side) becomes md:px-12 (48px/side) here
const LG_BREAKPOINT = 1024; // COLUMN_GAP's base gap becomes its `lg:` gap here
const PAD_BASE = 48; // px-6, both sides, below `md`
const PAD_MD = 96; // md:px-12, both sides, at/above `md`

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
 * `COLUMN_GAP`'s own two gap widths, in real pixels — PARSED out of its own
 * Tailwind class string rather than duplicated by hand. Two catalogued
 * defects on this project (`DECISIONS.md` §2 #23, #44) were exactly the shape
 * a hand-duplicated number invites: two descriptions of the same rule, one
 * edited and the other not. There is only one number here now — `COLUMN_GAP`'s
 * own string — and this reads it rather than repeating it.
 *
 * Falls back to `COLUMN_GAP[2]`'s gap for a column count this file has no
 * entry for, matching `PLATE_SIZES`'s own historical fallback: the 2-column
 * tier is the widest (safest) of the three, so an unrecognised column count
 * is over-served rather than under-served.
 */
export function gapPx(columns: number): { readonly base: number; readonly lg: number } {
  const classes = COLUMN_GAP[columns] ?? COLUMN_GAP[2];
  const base = /(?:^|\s)gap-x-(\d+)(?:\s|$)/.exec(classes);
  const lg = /(?:^|\s)lg:gap-x-(\d+)(?:\s|$)/.exec(classes);
  if (!base || !lg) {
    throw new Error(`gapPx: could not parse a base and an lg: gap out of ${JSON.stringify(classes)}`);
  }
  // Tailwind's default spacing scale: token N is N × 0.25rem = N × 4px.
  return { base: Number(base[1]) * 4, lg: Number(lg[1]) * 4 };
}

/**
 * A board's plate width at 1440×900 — the client's own reference viewport —
 * rounded so the CSS floor built from it can never tie the line-wrap
 * boundary math at 1440 itself (the width at which `columns` plates first
 * fit on one flex line together — see `columnThreshold` below).
 *
 * `exact` is the width `columns` plates would have if they divided
 * `CONTAINER_AT_1440` with zero slack. When it is fractional (three columns:
 * 421.33px) a bare `Math.floor` already buys real headroom below the tie —
 * `(1344 + 40) / (421 + 40) = 3.0022`, comfortably clear of 3.0, not merely
 * equal to it. When it is a WHOLE number (two columns: 652px flat; four:
 * 318px flat — both today) a bare floor is a no-op, and the boundary sits
 * EXACTLY on `columns.0` — the identical tie a fractional value would sit on
 * if used unrounded, just arrived at a different way. Subtracting one more
 * pixel after the floor closes that gap in both cases the same way, rather
 * than only in the case that happens to need it least.
 *
 * **This is `Math.floor(exact) - 1`, not `Math.ceil(exact) - 2`.** Both give
 * the identical 420px for three columns (floor(421.33) = ceil(421.33) - 1).
 * They diverge only where `exact` is already whole, and there `-1` is the
 * smaller, sufficient step: it still clears the tie with real margin
 * (`(1344 + 40) / (651 + 40) = 2.0029` for two columns; `(1344 + 24) / (317 +
 * 24) = 4.0117` for four), and it halves how far the CSS floor sits
 * below the width the browser actually renders at 1440 — which matters
 * because `scripts/check_plates.mjs` asserts a plate is never narrower than
 * THAT rendered width, not narrower than this constant. See its own comment
 * on `FLOOR_EPS` for the exact shortfall this leaves and why it is
 * unavoidable at a whole pixel, not a rounding choice made carelessly.
 */
export function referenceWidth(columns: number, gapLg: number): number {
  if (columns < 2) {
    throw new Error(`referenceWidth: only meaningful for a board that can drop a column, got ${columns}`);
  }
  const exact = (CONTAINER_AT_1440 - gapLg * (columns - 1)) / columns;
  return Math.floor(exact) - 1;
}

/**
 * The viewport width at which a board FIRST holds `columns` columns — the
 * smallest viewport whose container can fit `columns` plates at `ref`px with
 * `columns - 1` real gaps between them, `ChapterSurface`'s own container
 * padding (steps at `md`, 768) and the gap this column count really renders
 * at that viewport (steps at `lg`, 1024).
 *
 * A container's width only ever increases with viewport width, and does so
 * linearly within each padding/gap regime, so exactly one of the three
 * regimes below is ever self-consistent for a given target — tried widest
 * viewport range first only for readability; the loop finds whichever one
 * actually contains its own answer.
 */
export function columnThreshold(
  columns: number,
  ref: number,
  gap: { readonly base: number; readonly lg: number },
): number {
  const regimes: readonly (readonly [pad: number, g: number, lo: number, hi: number])[] = [
    [PAD_BASE, gap.base, 0, MD_BREAKPOINT],
    [PAD_MD, gap.base, MD_BREAKPOINT, LG_BREAKPOINT],
    [PAD_MD, gap.lg, LG_BREAKPOINT, CONTAINER_CAP_VIEWPORT],
  ];
  for (const [pad, g, lo, hi] of regimes) {
    const v = columns * ref + (columns - 1) * g + pad;
    if (v >= lo && v < hi) return v;
  }
  throw new Error(
    `columnThreshold: ${columns} columns at ref=${ref} never fits below the 1600px container cap`,
  );
}

/**
 * `sizes`, built from the SAME `ref`/`gap` each plate's `flex-basis` uses
 * (the caller computes both once and passes them in — see `PlateGrid`
 * below) — the standing rule that a layout and its `sizes` cannot describe
 * different boxes.
 *
 * Real, regime-aware thresholds (`columnThreshold`) mark where each
 * column-count band genuinely begins. The WIDTH inside a band is
 * deliberately NOT regime-aware: it always assumes the smaller padding
 * (48px) and this board's smaller, below-`lg` gap, even across the part of
 * the band where the real values are larger. Both real values can only make
 * the true container SMALLER than this assumes, never bigger, so the claimed
 * width is always >= the real rendered width — `ui/Photo.tsx`'s "round up,
 * never down" rule, carried through a continuously-reflowing board rather
 * than a fixed breakpoint. It is not the tightest possible ladder (a fully
 * regime-aware version would add an entry at every `md`/`lg` crossing inside
 * every band too); it is provably safe and short enough to read.
 *
 * The topmost entry (`>= 1600px`) is the one exception: `ChapterSurface`'s
 * container is capped there and never grows further, so there is no further
 * regime left to be safe against, and this uses the REAL `lg` gap for a
 * tight, exact value instead of the safe approximation.
 */
export function plateSizesFor(
  columns: number,
  ref: number,
  gap: { readonly base: number; readonly lg: number },
): string {
  const entries: string[] = [];

  const capWidth = (CONTAINER_CAP - gap.lg * (columns - 1)) / columns;
  entries.push(`(min-width: ${CONTAINER_CAP_VIEWPORT}px) ${Math.ceil(capWidth)}px`);

  for (let k = columns; k >= 2; k--) {
    const threshold = columnThreshold(k, ref, gap);
    const x = PAD_BASE + gap.base * (k - 1);
    entries.push(`(min-width: ${threshold}px) calc((100vw - ${x}px) / ${k})`);
  }

  entries.push(`calc(100vw - ${PAD_BASE}px)`);
  return entries.join(", ");
}

/**
 * A board's plate width at 1440×900, per column count — see `referenceWidth`
 * for how each is derived. Precomputed here, for the boards that exist today
 * (2, 3, 4 columns), purely so external code — `lib/sizes.test.ts`'s coverage
 * sweep, this file's own unit test — can import a value rather than call a
 * function; `PlateGrid` itself computes the identical number live, from the
 * chapter it is actually rendering, with this exact function, so the two can
 * never drift apart.
 */
export const PLATE_REF: Record<number, number> = Object.fromEntries(
  [2, 3, 4].map((columns) => [columns, referenceWidth(columns, gapPx(columns).lg)]),
);

/**
 * A plate's real `sizes`, per column count — see `plateSizesFor` for how each
 * is built. `1` is the one case that is NOT reflow-eligible at all: a
 * single-plate grid never splits into columns at any width (there is only
 * ever one `grid-cols-1` cell), so it keeps the container's own width, full
 * stop — no `50vw` tier, because there is no breakpoint at which it shares
 * its row. 1504px is `ChapterSurface`'s 1600px cap minus its `md:px-12`
 * gutter; the two narrower tiers are that same container's own width below
 * the 1600px cap and below `md`'s 768px, respectively. See `PlateGrid`'s own
 * `columns === 1` branch.
 */
export const PLATE_SIZES: Record<number, string> = {
  1: "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
  ...Object.fromEntries(
    [2, 3, 4].map((columns) => [columns, plateSizesFor(columns, PLATE_REF[columns], gapPx(columns))]),
  ),
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
 * The column count a board's photographs earn — never a constant. Three 2:3
 * portraits of cats want three columns; four 16:9 room interiors in four
 * columns are 330px wide and read as thumbnails, so those get two.
 *
 * A single landscape plate still passed `landscapes > orientations.length / 2`
 * (1 > 0.5), which reserved two columns for one photograph and left the
 * second sitting empty — measured on Mahua Vann's one-plate `vann-dining` at
 * 78% empty screen (`docs/reviews/2026-08-08-property-pages/`). Every other
 * caller already has `orientations.length >= columns`, because the "else"
 * branch below sets `columns` to `orientations.length` itself; one plate is
 * the only count the "if" branch's fixed `2` could ever exceed.
 */
export function plateColumns(orientations: readonly ("landscape" | "portrait" | "square")[]): number {
  const landscapes = orientations.filter((o) => o === "landscape").length;
  return orientations.length === 1 ? 1 : landscapes > orientations.length / 2 ? 2 : orientations.length;
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
  /*
   * **`as unknown as` since 19 Aug 2026, and the double cast is a symptom worth
   * reading rather than a style choice.** `chapterCopy` returns the union of
   * every entry in `content/home.ts`, and until that day at least one of them —
   * `forest`, `rooms`, `details` — carried `plates`, so the single cast
   * overlapped. The v2 restructure removes all three boards from the home spine,
   * so no member of that union has `intro` and `plates` any more and TypeScript
   * correctly refuses the narrowing.
   *
   * Nothing routes to this component now: `app/page.tsx` dropped its
   * `case "plateGrid"` arm with the kind, and no property page ever used it. The
   * honest end state is retiring this file the way `SplitFeature` was retired on
   * 16 Aug 2026 — component, test and `lib/sizes.test.ts` rows together — and
   * this cast is a deliberate placeholder until that decision is made, not a
   * repair. **If a chapter is ever routed here again, its copy must be passed
   * through the `copy` prop or this lookup will throw at render.**
   */
  const resolvedCopy = copy ?? (chapterCopy(chapter.id as ChapterCopyKey) as unknown as PlateGridCopy);
  const { plates } = resolvedCopy;

  const orientations = plates.map((p) => media(p.mediaId).orientation);
  const columns = plateColumns(orientations);
  const frame = plateFrame(orientations);

  /**
   * `columns === 1` keeps its own simple path — a one-plate grid never splits
   * into columns at any width (there is only ever one `grid-cols-1` cell), so
   * it has no column to drop and none of the reflow machinery below applies:
   * `plateSizes` is the container's own width, full stop, and `itemFlexBasis`
   * stays undefined so the container keeps its base `grid grid-cols-1`
   * classes rather than becoming a flex-wrap row.
   *
   * For every other board, `ref`/`gap` are computed exactly once and feed
   * BOTH `itemFlexBasis` (each plate's `flex-basis`, below) and `plateSizes`
   * (`plateSizesFor`) from the same value — the standing rule that a layout
   * and its `sizes` cannot be allowed to describe different boxes.
   */
  let plateSizes: string;
  let itemFlexBasis: number | undefined;
  if (columns === 1) {
    plateSizes = PLATE_SIZES[1];
    itemFlexBasis = undefined;
  } else {
    const gap = gapPx(columns);
    const ref = referenceWidth(columns, gap.lg);
    plateSizes = plateSizesFor(columns, ref, gap);
    itemFlexBasis = ref;
  }

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
          data-plate-grid={chapter.id}
          // `gap-y-12`/`COLUMN_GAP`'s `gap-x-*` are display-mode-agnostic —
          // the same `gap`/`column-gap`/`row-gap` properties space a
          // `flex-wrap` row exactly as they spaced a grid, so only the
          // display mode itself needs to switch. `columns === 1` keeps
          // `grid grid-cols-1` (there is only ever one cell, nothing to
          // wrap); every other board is `flex flex-wrap` — see the module
          // comment above for why that, and not `grid-template-columns:
          // repeat(auto-fit, …)`, is what ships.
          className={`mt-10 gap-y-12 md:mt-12 ${COLUMN_GAP[columns] ?? COLUMN_GAP[2]} ${
            itemFlexBasis === undefined ? "grid grid-cols-1" : "flex flex-wrap"
          }`}
        >
          {plates.map((plate, i) => (
            <div
              key={plate.mediaId}
              style={
                {
                  // Every other plate hangs lower. An inline custom property
                  // rather than a class, because the offset is per-index and
                  // Tailwind only ships classes it can see written out in full.
                  "--stagger": i % 2 === 1 ? "3.5rem" : "0rem",
                  // `flex-grow: 1` (from the `1` in `flex: 1 1 …`) is what a
                  // plate stranded alone on the last line needs to fill it —
                  // see the module comment. `minWidth: 0` overrides a flex
                  // item's default `min-width: auto`, which would otherwise
                  // floor this at the plate's own content size and block the
                  // shrink a narrow phone needs.
                  ...(itemFlexBasis !== undefined
                    ? { flex: `1 1 ${itemFlexBasis}px`, minWidth: 0 }
                    : {}),
                } as React.CSSProperties
              }
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
