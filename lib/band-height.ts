import { BANDS } from "@/content/movements";

function weightOf(id: string): number {
  const band = BANDS.find((b) => b.id === id);
  if (!band) throw new Error(`Unknown band id: ${id}`);
  return band.weight;
}

/**
 * The scale that turns a band's `weight` (content/movements.ts) into a real CSS
 * height, derived from `BANDS` itself rather than a hand-picked number.
 *
 * `components/ui/FullBleed.tsx` renders the two crossing bands ("into-the-day",
 * "into-the-dark") as edge-to-edge photographs: a full-bleed crossing
 * photograph is designed to *be* one screen. Both crossing bands share the same
 * `weight` in `BANDS` (`lib/band-height.test.ts` guards that equality directly,
 * and it is the premise this file is built on), so that shared weight is
 * exactly the number of weight-units one viewport represents. One weight-unit
 * is therefore `100 / <that shared weight> vh` — not a magic constant, but a
 * ratio read out of the same data the light timeline (`lib/timeline.ts`) uses.
 *
 * Every other band's height follows the same scale, `weight / CROSSING_WEIGHT`
 * of a viewport, matching the fraction of total scroll `lib/timeline.ts`
 * computes for it (`weight / TOTAL`). Rendered layout and the light's stops
 * are therefore always the same shape, scaled by the same two numbers, so the
 * colour can never fall out of step with the content (Task 6's binding
 * constraint).
 *
 * Fix round 1: `FullBleed` used to hard-code `h-screen` independently of this
 * module — the two crossing bands only ever matched by coincidence (both
 * happening to carry `weight: 7`), not by any mechanism that would keep them
 * matching if one crossing band's weight were ever edited alone. `FullBleed`
 * now calls `bandHeightVh` itself (see components/ui/FullBleed.tsx), so there
 * is one function computing every band's height, crossing bands included.
 */
const CROSSING_WEIGHT = weightOf("into-the-day");

/**
 * A band's height in vh, as a plain number — what `FullBleed` needs in order
 * to do its own parallax-buffer arithmetic (`bandMinHeight` below wraps this
 * as a CSS string, which isn't usable in a numeric calculation).
 */
export function bandHeightVh(id: string): number {
  return (weightOf(id) / CROSSING_WEIGHT) * 100;
}

/**
 * The one place a band's `weight` becomes a CSS length. Every movement
 * component calls this rather than writing its own height, so the rendered
 * page can never type a band's height a second time and drift from what
 * `lib/timeline.ts` assumes.
 */
export function bandMinHeight(id: string): string {
  return `${bandHeightVh(id)}vh`;
}
