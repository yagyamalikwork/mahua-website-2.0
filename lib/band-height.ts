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
 * `components/ui/FullBleed.tsx` — already built and reviewed in Task 5 — hard-
 * codes its two crossing bands ("into-the-day", "into-the-dark") to exactly one
 * viewport (`h-screen`, 100vh): a full-bleed crossing photograph is designed to
 * *be* one screen. Both crossing bands currently share the same `weight` in
 * `BANDS` (the ordering test in content/movements.test.ts already requires the
 * day to run forwards without dictating equal weights, so this file's own test
 * guards the assumption directly), so that shared weight is exactly the number
 * of weight-units FullBleed's fixed height already represents. One weight-unit
 * is therefore `100 / <that shared weight> vh` — not a magic constant, but a
 * ratio read out of the same data the light timeline (`lib/timeline.ts`) uses.
 *
 * Every other band's height follows the same scale, `weight / CROSSING_WEIGHT`
 * of a viewport, matching the fraction of total scroll `lib/timeline.ts`
 * computes for it (`weight / TOTAL`). Rendered layout and the light's stops
 * are therefore always the same shape, scaled by the same two numbers, so the
 * colour can never fall out of step with the content (Task 6's binding
 * constraint).
 */
const CROSSING_WEIGHT = weightOf("into-the-day");

export const VH_PER_WEIGHT = 100 / CROSSING_WEIGHT;

/**
 * The one place a band's `weight` becomes a CSS length. Every movement
 * component calls this rather than writing its own height, so the rendered
 * page can never type a band's height a second time and drift from what
 * `lib/timeline.ts` assumes.
 */
export function bandMinHeight(id: string): string {
  return `calc(${weightOf(id)} / ${CROSSING_WEIGHT} * 100vh)`;
}
