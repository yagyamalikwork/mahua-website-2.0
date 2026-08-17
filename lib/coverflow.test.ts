import { describe, expect, it } from "vitest";
import { coverflowNeighbours, coverflowTargetId } from "./coverflow";

describe("coverflowNeighbours", () => {
  it("has no card before the first and none after the last", () => {
    // The client's own ruling, 18 Aug 2026: "let's make it linear and just keep
    // it 01 to 06 … no card placed before it … no card placed after it". This
    // reverses the 16 Aug wrap, which returned 5 and 0 for these two.
    expect(coverflowNeighbours(0, 6)).toEqual({ previous: null, next: 1 });
    expect(coverflowNeighbours(5, 6)).toEqual({ previous: 4, next: null });
  });

  it("still points at both neighbours in the middle of the run", () => {
    expect(coverflowNeighbours(2, 6)).toEqual({ previous: 1, next: 3 });
  });

  it("never returns a sentinel index a caller could use without checking", () => {
    // `-1` was the failure the retired wrapping form existed to avoid, and a
    // linear carousel could have reintroduced it by choice: `-1` is a `number`,
    // so `experiences[previous]` would compile and yield `undefined`. Nothing
    // here may be a number that is not a card.
    for (let i = 0; i < 6; i++) {
      const { previous, next } = coverflowNeighbours(i, 6);
      for (const n of [previous, next]) {
        if (n === null) continue;
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(6);
      }
    }
  });

  it("is its own inverse wherever both ends exist", () => {
    // Walking forward and back must return to where it started, which is what
    // makes the six anchors one chain rather than six independent pairs.
    for (let i = 0; i < 6; i++) {
      const { next } = coverflowNeighbours(i, 6);
      if (next === null) continue;
      expect(coverflowNeighbours(next, 6).previous).toBe(i);
    }
  });

  it("degenerates safely at a count of one", () => {
    // One activity is one card with no arrows at all — not a card whose two
    // arrows point at itself, which is what the wrapping form returned here.
    expect(coverflowNeighbours(0, 1)).toEqual({ previous: null, next: null });
  });
});

describe("coverflowTargetId", () => {
  it("composes one id shape, so a link and its target can never disagree", () => {
    expect(coverflowTargetId("field-days", 0)).toBe("field-days-card-0");
  });
});
