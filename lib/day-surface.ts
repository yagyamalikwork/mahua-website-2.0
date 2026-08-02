import { contrastRatio, hexToRgb } from "./contrast";
import { lightState } from "./palette";
import { stopsAt } from "./timeline";

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();

/**
 * The background is one continuously bleeding surface, not seven blocks (spec section 4.1).
 * Interpolated in sRGB, linearly against scroll progress across every stop in the timeline —
 * including the two crossings that cross the light/dark divide (firstLight→midMorning,
 * dusk→night). An earlier version eased those two crossings through smootherstep
 * (flat at both ends, steepest through the middle) to shrink how much of the scroll
 * sat at the low-margin mid-luminance band; client review reported that easing as an
 * abrupt, snappy transition — crawl/rush/crawl reads as a seam even though the pixel
 * step size stays small. Plain linear blending removes that rush: the rate of colour
 * change is now constant across every stop, and both crossings now land entirely
 * inside text-free bands (content/movements.ts: `into-the-day`, `into-the-dark`), so
 * the mid-luminance stretch this blend passes through never has to carry text.
 *
 * Every state is warm, so the path between any two never passes through a cold
 * tone — which the test suite verifies across the whole range.
 */
export function backgroundAt(progress: number): string {
  const { from, to, t } = stopsAt(progress);
  const a = hexToRgb(lightState(from).bg);
  const b = hexToRgb(lightState(to).bg);
  const mix = a.map((channel, i) => channel + (b[i] - channel) * t);
  return `#${mix.map(toHex).join("")}`;
}

/** The candidate with the highest measured contrast against `bg`. */
function bestAgainst(candidates: readonly string[], bg: string): string {
  return candidates.reduce((best, candidate) =>
    contrastRatio(candidate, bg) > contrastRatio(best, bg) ? candidate : best,
  );
}

export type Surface = {
  readonly bg: string;
  readonly text: string;
  readonly accent: string;
  readonly accentText: string;
};

/**
 * The single accessor for "what does the page look like at this scroll position."
 * Text and link colour are chosen by measured contrast against the actual blended
 * background (spec section 11) rather than by which half of the stop's progress
 * sits in — a fixed rule can't track a continuously moving background. Only the two
 * bracketing states' own designed colours are ever candidates: with the light/dark
 * crossings confined to text-free bands (spec section 13), text is never on screen
 * while the background sits at the mid-luminance point that used to require a
 * black/white fallback, so no fallback tier exists any more — see
 * lib/day-surface.test.ts "never falls back to a cold colour". `accent` stays
 * decorative-only and snaps to the nearer state, as before — it is never used as
 * text and carries no contrast requirement.
 */
export function surfaceAt(progress: number): Surface {
  const { from, to, t } = stopsAt(progress);
  const bg = backgroundAt(progress);
  const fromState = lightState(from);
  const toState = lightState(to);
  const nearer = t < 0.5 ? fromState : toState;

  return {
    bg,
    text: bestAgainst([fromState.text, toState.text], bg),
    accent: nearer.accent,
    accentText: bestAgainst([fromState.accentText, toState.accentText], bg),
  };
}

/**
 * Text colour at this scroll position. See `surfaceAt` — kept as a named export
 * because `lib/day-surface.test.ts` and the contrast sweep script target it directly.
 */
export function textAt(progress: number): string {
  return surfaceAt(progress).text;
}
