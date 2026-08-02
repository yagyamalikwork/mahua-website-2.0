import { contrastRatio, hexToRgb, relativeLuminance } from "./contrast";
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
 * A segment "crosses" the light/dark divide when its two background luminances are
 * this far apart. The gap is ~0.63–0.76 for the two real crossings (firstLight→
 * midMorning, dusk→night) and ≤0.09 for the other four, so 0.3 sits in a wide, safe
 * margin between them — see the sweep in day-surface.test.ts for the actual numbers.
 */
const CROSSING_LUMINANCE_GAP = 0.3;

function isCrossing(from: number, to: number): boolean {
  const a = relativeLuminance(hexToRgb(LIGHT_STATES[from].bg));
  const b = relativeLuminance(hexToRgb(LIGHT_STATES[to].bg));
  return Math.abs(a - b) > CROSSING_LUMINANCE_GAP;
}

/**
 * Smootherstep (Ken Perlin's), flat near both ends and steepest through the middle.
 * Applied only inside the two crossing segments (see isCrossing), so the background
 * spends less of the *scroll* sitting at the mid-luminance tone neither bracketing
 * state's text was designed for. eased(0) = 0 and eased(1) = 1 exactly, so segment
 * boundaries still land on the anchor colour precisely — no seam is introduced.
 *
 * This reshapes *timing*, not the colour path: every colour between the two
 * backgrounds is still visited (it's still a straight sRGB blend), so this alone
 * cannot rescue the single worst-contrast point — that's what CROSSING_TEXT is for.
 * It does shrink how much of the scroll sits in the low-margin band around it.
 */
function ease(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function easedT(from: number, to: number, t: number): number {
  return isCrossing(from, to) ? ease(t) : t;
}

/**
 * The background is one continuously bleeding surface, not seven blocks (spec section 4.1).
 * Interpolated in sRGB: every state is warm, so the path between any two never passes
 * through a cold tone — which the test suite verifies across the whole range.
 */
export function backgroundAt(progress: number): string {
  const { from, to, t } = segmentAt(progress);
  const et = easedT(from, to, t);
  const a = hexToRgb(LIGHT_STATES[from].bg);
  const b = hexToRgb(LIGHT_STATES[to].bg);
  const mix = a.map((channel, i) => channel + (b[i] - channel) * et);
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
