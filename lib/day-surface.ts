import { contrastRatio, hexToRgb } from "./contrast";
import { CROSSING_TEXT, LIGHT_STATES } from "./palette";

const SEGMENTS = LIGHT_STATES.length - 1; // six gaps between seven states

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Which pair of light states a scroll progress falls between, and how far across. */
export function segmentAt(progress: number): { from: number; to: number; t: number } {
  const p = clamp01(progress);
  const scaled = p * SEGMENTS;
  const from = Math.min(Math.floor(scaled), SEGMENTS - 1);
  return { from, to: from + 1, t: scaled - from };
}

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();

/**
 * The background is one continuously bleeding surface, not seven blocks (spec section 4.1).
 * Interpolated in sRGB, linearly against scroll progress across all six segments —
 * including the two that cross the light/dark divide (firstLight→midMorning,
 * dusk→night). An earlier version eased those two crossings through smootherstep
 * (flat at both ends, steepest through the middle) to shrink how much of the scroll
 * sat at the low-margin mid-luminance band; client review reported that easing as an
 * abrupt, snappy transition — crawl/rush/crawl reads as a seam even though the pixel
 * step size stays small. Plain linear blending removes that rush: the rate of colour
 * change is now constant across every segment, all six behave identically, and the
 * worst-case contrast point survives unchanged because it is a property of the
 * palette (see CROSSING_TEXT), not of the timing curve.
 *
 * Every state is warm, so the path between any two never passes through a cold
 * tone — which the test suite verifies across the whole range.
 */
export function backgroundAt(progress: number): string {
  const { from, to, t } = segmentAt(progress);
  const a = hexToRgb(LIGHT_STATES[from].bg);
  const b = hexToRgb(LIGHT_STATES[to].bg);
  const mix = a.map((channel, i) => channel + (b[i] - channel) * t);
  return `#${mix.map(toHex).join("")}`;
}

const LEGIBLE = 4.5;

/** The candidate with the highest measured contrast against `bg`. */
function bestAgainst(candidates: readonly string[], bg: string): string {
  return candidates.reduce((best, candidate) =>
    contrastRatio(candidate, bg) > contrastRatio(best, bg) ? candidate : best,
  );
}

/**
 * Prefers the two states' own designed colours, and only reaches for the
 * CROSSING_TEXT legibility floor when neither of those clears 4.5:1. Without this
 * tier, a flat "pick whichever of all four candidates wins" would occasionally
 * swap out an already-legible designed colour (e.g. night's cream text scores
 * below pure white against its own near-black background) for no reason — a
 * needless, undesigned departure from the palette at points that already worked.
 */
function legibleAgainst(primary: readonly string[], bg: string): string {
  const best = bestAgainst(primary, bg);
  if (contrastRatio(best, bg) >= LEGIBLE) return best;
  return bestAgainst([CROSSING_TEXT.deep, CROSSING_TEXT.pale], bg);
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
 * background (spec section 11) rather than by which half of the segment progress
 * sits in — a fixed rule can't track a continuously moving background. The two
 * bracketing states' own designed colours are always tried first; the
 * CROSSING_TEXT black/white pair only steps in when neither clears 4.5:1, which in
 * practice is just the two segments crossing the light/dark divide (see
 * `legibleAgainst`), so nothing changes about the four segments that already
 * worked. `accent` stays decorative-only and snaps to the nearer state, as before
 * — it is never used as text and carries no contrast requirement.
 */
export function surfaceAt(progress: number): Surface {
  const { from, to, t } = segmentAt(progress);
  const bg = backgroundAt(progress);
  const fromState = LIGHT_STATES[from];
  const toState = LIGHT_STATES[to];
  const nearer = t < 0.5 ? fromState : toState;

  return {
    bg,
    text: legibleAgainst([fromState.text, toState.text], bg),
    accent: nearer.accent,
    accentText: legibleAgainst([fromState.accentText, toState.accentText], bg),
  };
}

/**
 * Text colour at this scroll position. See `surfaceAt` — kept as a named export
 * because `lib/day-surface.test.ts` and the contrast sweep script target it directly.
 */
export function textAt(progress: number): string {
  return surfaceAt(progress).text;
}
