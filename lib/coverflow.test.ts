import { describe, expect, it } from "vitest";
import { coverflowNeighbours, coverflowTargetId, coverflowWindow } from "./coverflow";

describe("coverflowNeighbours", () => {
  it("wraps both ways so the arrows can loop", () => {
    // The client asked for exactly this: "after 6 the 1 card comes back or visa-versa".
    expect(coverflowNeighbours(0, 6)).toEqual({ previous: 5, next: 1 });
    expect(coverflowNeighbours(5, 6)).toEqual({ previous: 4, next: 0 });
    expect(coverflowNeighbours(2, 6)).toEqual({ previous: 1, next: 3 });
  });

  it("is its own inverse — next then previous returns to where it started", () => {
    // Guards the modulo arithmetic against the classic `(i - 1) % n` sign bug,
    // which returns -1 for i = 0 in JavaScript and would point an arrow at no card.
    for (let i = 0; i < 6; i++) {
      const { next } = coverflowNeighbours(i, 6);
      expect(coverflowNeighbours(next, 6).previous).toBe(i);
    }
  });

  it("degenerates safely at a count of one", () => {
    expect(coverflowNeighbours(0, 1)).toEqual({ previous: 0, next: 0 });
  });
});

describe("coverflowWindow", () => {
  it("gives every card an equal window and the last one ends at the end", () => {
    const windows = Array.from({ length: 6 }, (_, i) => coverflowWindow(i, 6));
    const widths = windows.map((w) => w.end - w.start);
    for (const w of widths) expect(w).toBeCloseTo(widths[0], 10);
    expect(windows[0].start).toBe(0);
    expect(windows[5].end).toBe(100);
  });

  it("overlaps neighbours, because a card must be leaving while the next arrives", () => {
    // No overlap means a gap where nothing is centred — a blank stage mid-scroll.
    expect(coverflowWindow(1, 6).start).toBeLessThan(coverflowWindow(0, 6).end);
  });
});

describe("coverflowTargetId", () => {
  it("composes one id shape, so a link and its target can never disagree", () => {
    expect(coverflowTargetId("field-days", 0)).toBe("field-days-card-0");
  });
});
