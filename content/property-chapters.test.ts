import { describe, expect, it } from "vitest";
import { findRepeatedShape, type PropertyChapter } from "./property-chapters";

const chapter = (id: string, shape: PropertyChapter["shape"]): PropertyChapter => ({
  id,
  shape,
  media: [],
});

describe("findRepeatedShape", () => {
  it("finds nothing in a spine that never repeats itself", () => {
    expect(
      findRepeatedShape([chapter("a", "fullBleed"), chapter("b", "column"), chapter("c", "map")]),
    ).toBeUndefined();
  });

  it("names both offenders when two adjacent moments share a shape", () => {
    // The whole anti-template rule. This is the failure the redesign exists
    // to make impossible: /mahua-vann shipped on 9 Aug with three consecutive
    // sections opening on the identical eyebrow-heading-paragraph-grid move.
    expect(
      findRepeatedShape([
        chapter("a", "fullBleed"),
        chapter("b", "showcase"),
        chapter("c", "showcase"),
      ]),
    ).toEqual({ first: "b", second: "c", shape: "showcase" });
  });

  it("allows a shape to return once something else has intervened", () => {
    expect(
      findRepeatedShape([
        chapter("a", "fullBleed"),
        chapter("b", "column"),
        chapter("c", "fullBleed"),
      ]),
    ).toBeUndefined();
  });
});
