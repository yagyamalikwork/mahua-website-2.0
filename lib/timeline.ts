import { BANDS } from "@/content/movements";
import type { LightStateId } from "./palette";

export type Stop = { readonly at: number; readonly state: LightStateId };

const TOTAL = BANDS.reduce((n, b) => n + b.weight, 0);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Two stops per band, both naming that band's own state. Identical consecutive
 * states hold the colour still for the band's full height; the colour therefore
 * only moves across a band boundary — and the two light/dark boundaries are
 * bracketed by crossing bands that carry no text (spec section 13).
 */
export const STOPS: readonly Stop[] = BANDS.flatMap((band, i) => {
  const start = BANDS.slice(0, i).reduce((n, b) => n + b.weight, 0) / TOTAL;
  const end = start + band.weight / TOTAL;
  return [
    { at: start, state: band.state },
    { at: end, state: band.state },
  ];
});

export function stopsAt(progress: number): { from: LightStateId; to: LightStateId; t: number } {
  const p = clamp01(progress);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (p >= a.at && p <= b.at) {
      const span = b.at - a.at;
      return { from: a.state, to: b.state, t: span === 0 ? 0 : (p - a.at) / span };
    }
  }
  const last = STOPS[STOPS.length - 1];
  return { from: last.state, to: last.state, t: 1 };
}

export function carriesTextAt(progress: number): boolean {
  const p = clamp01(progress);
  let acc = 0;
  for (const band of BANDS) {
    const end = (acc + band.weight) / TOTAL;
    if (p <= end) return band.carriesText;
    acc += band.weight;
  }
  return BANDS[BANDS.length - 1].carriesText;
}
