import { hexToRgb } from "./contrast";
import { LIGHT_STATES } from "./palette";

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
 * Interpolated in sRGB: every state is warm, so the path between any two never passes
 * through a cold tone — which the test suite verifies across the whole range.
 */
export function backgroundAt(progress: number): string {
  const { from, to, t } = segmentAt(progress);
  const a = hexToRgb(LIGHT_STATES[from].bg);
  const b = hexToRgb(LIGHT_STATES[to].bg);
  const mix = a.map((channel, i) => channel + (b[i] - channel) * t);
  return `#${mix.map(toHex).join("")}`;
}

/**
 * Text snaps to the nearer state instead of blending. A blended text colour would sit
 * below the 4.5:1 floor for the whole middle of every transition (spec section 11).
 */
export function textAt(progress: number): string {
  const { from, to, t } = segmentAt(progress);
  return LIGHT_STATES[t < 0.5 ? from : to].text;
}
