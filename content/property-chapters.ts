import type { MediaId } from "@/lib/media";

/**
 * The shapes a property page's spine may use.
 *
 * A *shape*, not a *kind*: the field exists so that two adjacent moments can
 * be forbidden from looking alike. The pages this replaced shipped with three
 * consecutive sections opening on the identical eyebrow-heading-paragraph-grid
 * move, and the client's word for the result was "templaty" — which is exactly
 * what one section component applied down a page produces. See
 * `findRepeatedShape` below; it is the fix, and it is mechanical.
 */
/*
 * **`"pair"` until 26 August 2026.** The client replaced both property pages'
 * activity sections with the home page's own card strip — *"replace it with
 * the exact same copy-pasted activities carousel from our homepage … for now
 * just place the entire carousel as it is."* `ExperiencePair.tsx` is deleted
 * rather than left unrouted: a shape in this union that nothing renders is a
 * shape the next reader will believe in. See `docs/DECISIONS.md` §22.
 */
export type PropertyShape =
  | "fullBleed"
  | "column"
  | "map"
  | "showcase"
  | "strip"
  | "press"
  | "invitation";

export type PropertyChapter = {
  id: string;
  number?: string;
  label?: string;
  shape: PropertyShape;
  media: readonly MediaId[];
};

/**
 * The shapes that carry a screen on their photography.
 *
 * `press` is deliberately absent: it is a band of publication wordmarks and
 * type, which is quiet in the eye however much information it holds. That is
 * why `invitation` carries the sister lodge's photograph — on Mahua Vann the
 * two sit adjacent, and a type-led band followed by a type-led close would
 * satisfy the no-repeated-shape rule while breaking the older rhythm rule
 * (CLAUDE.md non-negotiable #10). The two rules are independent and both bind.
 */
export const PROPERTY_IMAGE_LED_SHAPES: readonly PropertyShape[] = [
  "fullBleed",
  "map",
  "showcase",
  "strip",
  "invitation",
];

/** Mirrors `FULL_BLEED_KINDS` in `content/chapters.ts` — non-negotiable #11. */
export const PROPERTY_FULL_BLEED_SHAPES: readonly PropertyShape[] = ["fullBleed"];

/**
 * The first place two adjacent moments share a shape, or `undefined`.
 *
 * Returns the offenders rather than a boolean so the failure message can name
 * them: a test that says only "false is not true" costs a reader ten minutes
 * of counting sections by hand.
 */
export function findRepeatedShape(
  chapters: readonly PropertyChapter[],
): { first: string; second: string; shape: PropertyShape } | undefined {
  for (let i = 0; i < chapters.length - 1; i++) {
    if (chapters[i].shape === chapters[i + 1].shape) {
      return { first: chapters[i].id, second: chapters[i + 1].id, shape: chapters[i].shape };
    }
  }
  return undefined;
}
