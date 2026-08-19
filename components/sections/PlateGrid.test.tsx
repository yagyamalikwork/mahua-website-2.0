import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChapterLike } from "@/content/chapters";
import type { PlateGridCopy } from "./PlateGrid";
import { media, type MediaId } from "@/lib/media";
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
 * The three boards, as fixtures.
 *
 * **They were read off `content/chapters.ts` and `content/home.ts` until 19 Aug
 * 2026, and that was the better arrangement — this is a downgrade forced by the
 * v2 restructure, not an improvement.** `03 · The Forest`, `05 · The Rooms` and
 * `07 · Details` were the page's three plate boards; all three left the home
 * spine with the client's own restructure, `app/page.tsx` dropped its
 * `case "plateGrid"` arm, and `PlateGrid` is now routed from nowhere. Reading
 * the boards off the content dial is no longer possible because the boards are
 * not in it.
 *
 * What is preserved is the half that mattered: **the orientations still come
 * from `media()`**, so a re-crop that changed a photograph's orientation still
 * moves a column count here. Only the id lists are hand-held, and they are the
 * exact lists the three chapters carried at the commit before the restructure.
 *
 * **The right end state is retiring this file with its component**, as
 * `SplitFeature` and its test were retired together on 16 Aug 2026. These
 * fixtures exist so the suite stays green through one task, not so the boards
 * can live on as fiction.
 */
const RETIRED_BOARDS = {
  forest: ["tiger-pair-profile", "leopard-on-rock", "melanistic-leopard"],
  rooms: [
    "room-open-to-bamboo",
    "suite-tiger-painting",
    "room-hanging-chair-view",
    "hanging-chair-forest-deck",
  ],
  details: ["petal-bowl-map", "veranda-through-leaves", "lily-pond-fountain", "geese-garden-pond"],
} as const satisfies Record<string, readonly MediaId[]>;

const BOARD_IDS = ["forest", "rooms", "details"] as const;

const ROMAN = ["I", "II", "III", "IV"];

function boardChapter(id: (typeof BOARD_IDS)[number]): ChapterLike {
  return { id, media: RETIRED_BOARDS[id] };
}

function boardCopy(id: (typeof BOARD_IDS)[number]): PlateGridCopy {
  return {
    heading: { text: `The ${id} board`, dim: id },
    intro: `A fixture standing in for the ${id} chapter's own intro.`,
    plates: RETIRED_BOARDS[id].map((mediaId, i) => ({
      mediaId,
      plate: ROMAN[i],
      caption: `Plate ${ROMAN[i]}.`,
    })),
  };
}

function boardColumns(id: (typeof BOARD_IDS)[number]): number {
  const orientations = RETIRED_BOARDS[id].map((mediaId) => media(mediaId).orientation);
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
    const { container } = render(<PlateGrid chapter={boardChapter(id)} copy={boardCopy(id)} />);
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
