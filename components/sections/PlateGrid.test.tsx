import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHAPTERS } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey } from "@/content/home";
import { media } from "@/lib/media";
import {
  gapPx,
  PLATE_REF,
  PLATE_SIZES,
  plateColumns,
  plateSizesFor,
  PlateGrid,
  referenceWidth,
} from "./PlateGrid";

/**
 * The three real boards, read off `content/home.ts` rather than hand-listed —
 * a synthetic chapter or a hard-coded column count could drift from what the
 * page actually renders, exactly the mistake this file's own predecessor
 * warned against. `plateColumns` (the same function `PlateGrid` calls) is
 * what turns real orientations into a real column count.
 */
const BOARD_IDS = ["forest", "rooms", "details"] as const;

function boardColumns(id: (typeof BOARD_IDS)[number]): number {
  const copy = chapterCopy(id as ChapterCopyKey);
  if (!("plates" in copy) || !copy.plates) throw new Error(`chapter ${id} carries no plates`);
  const orientations = copy.plates.map((p) => media(p.mediaId).orientation);
  return plateColumns(orientations);
}

describe("PlateGrid column reflow — 14 Aug 2026, the real rule", () => {
  it("gives each real board the column count the page actually uses", () => {
    // Pinned so a future content edit that moves a photograph's orientation
    // is a decision, not a silent drift — exactly `sizes.test.ts`'s own
    // rationale for its tripwire count.
    expect(boardColumns("forest")).toBe(3);
    expect(boardColumns("rooms")).toBe(2);
    expect(boardColumns("details")).toBe(4);
  });

  it("derives REF strictly below each board's exact 1440 fit — never a tie", () => {
    // Forest: (1344 - 40*2)/3 = 421.33, floor - 1 = 420.
    // Rooms:  (1344 - 40*1)/2 = 652 flat, floor - 1 = 651.
    // Details:(1344 - 24*3)/4 = 318 flat, floor - 1 = 317.
    expect(referenceWidth(3, gapPx(3).lg)).toBe(420);
    expect(referenceWidth(2, gapPx(2).lg)).toBe(651);
    expect(referenceWidth(4, gapPx(4).lg)).toBe(317);
    expect(PLATE_REF).toEqual({ 2: 651, 3: 420, 4: 317 });
  });

  it("emits sizes built from the SAME ref/gap the column count uses, per board", () => {
    expect(PLATE_SIZES[3]).toBe(
      "(min-width: 1600px) 475px, (min-width: 1436px) calc((100vw - 112px) / 3), " +
        "(min-width: 968px) calc((100vw - 80px) / 2), calc(100vw - 48px)",
    );
    expect(PLATE_SIZES[2]).toBe(
      "(min-width: 1600px) 732px, (min-width: 1438px) calc((100vw - 80px) / 2), calc(100vw - 48px)",
    );
    expect(PLATE_SIZES[4]).toBe(
      "(min-width: 1600px) 358px, (min-width: 1436px) calc((100vw - 108px) / 4), " +
        "(min-width: 1095px) calc((100vw - 88px) / 3), (min-width: 702px) calc((100vw - 68px) / 2), " +
        "calc(100vw - 48px)",
    );
    // The one-column board is untouched — no reflow, no calc() ladder.
    expect(PLATE_SIZES[1]).toBe(
      "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
    );
  });

  it("plateSizesFor is exactly what PLATE_SIZES precomputed — the two cannot drift", () => {
    for (const columns of [2, 3, 4] as const) {
      const gap = gapPx(columns);
      expect(plateSizesFor(columns, PLATE_REF[columns], gap)).toBe(PLATE_SIZES[columns]);
    }
  });

  it.each(BOARD_IDS)("renders %s as flex-wrap with every plate's own REF as its flex-basis", (id) => {
    const chapter = CHAPTERS.find((c) => c.id === id);
    if (!chapter) throw new Error(`content/chapters no longer carries a ${id} chapter`);
    const { container } = render(<PlateGrid chapter={chapter} />);
    const grid = container.querySelector("[data-plate-grid]") as HTMLElement | null;
    expect(grid).not.toBeNull();

    // No fixed breakpoint class survives — the whole point of the rework —
    // and no CSS Grid at all: `auto-fit` was tried and rejected (see the
    // module comment) because a track is shared across every row, so a
    // trailing plate that doesn't fill a full row is left beside an empty
    // cell rather than growing into the space. Flex-wrap has no shared-track
    // model, so a lone trailing plate is alone on its own line and grows to
    // fill it.
    expect(grid!.className).not.toMatch(/grid-cols-(2|3|4)\b/);
    expect(grid!.className).not.toContain("xl:grid-cols");
    expect(grid!.className).not.toContain("sm:grid-cols");
    expect(grid!.className).toContain("flex");
    expect(grid!.className).toContain("flex-wrap");
    expect(grid!.className).not.toContain("grid-cols-1");
    expect(grid!.style.gridTemplateColumns).toBe("");

    const columns = boardColumns(id);
    const ref = referenceWidth(columns, gapPx(columns).lg);
    for (const child of Array.from(grid!.children)) {
      const style = (child as HTMLElement).style;
      expect(style.flexGrow).toBe("1");
      expect(style.flexShrink).toBe("1");
      expect(style.flexBasis).toBe(`${ref}px`);
      expect(style.minWidth).toBe("0px");
    }
  });

  it("keeps the true one-plate board (columns === 1) off flex-wrap entirely", () => {
    // Forest/rooms/details all reflow; a genuine one-plate chapter must not —
    // it has no column to drop, so it stays on the simple `grid grid-cols-1`
    // path with no `flex`/`flex-basis` machinery at all. `plateColumns`
    // itself is the unit under test here, not a rendered chapter, since no
    // real chapter on the current spine carries exactly one plate.
    expect(plateColumns(["landscape"])).toBe(1);
  });
});
