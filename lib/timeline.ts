import { BANDS } from "@/content/movements";
import type { LightStateId } from "./palette";

export type Stop = { readonly at: number; readonly state: LightStateId };

const TOTAL = BANDS.reduce((n, b) => n + b.weight, 0);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Two stops per band: the band's start carries the *previous* band's state,
 * its end carries its own. A band therefore sweeps from what came before it
 * to itself across its own full width — bands whose state matches their
 * predecessor's hold the colour perfectly still, and every genuine
 * transition gets a whole band's width to happen in rather than being
 * squeezed into the zero-width seam between two bands. The two light/dark
 * transitions land inside crossing bands that carry no text (spec section 13).
 */
export const STOPS: readonly Stop[] = BANDS.flatMap((band, i) => {
  const start = BANDS.slice(0, i).reduce((n, b) => n + b.weight, 0) / TOTAL;
  const end = start + band.weight / TOTAL;
  const entering = i === 0 ? band.state : BANDS[i - 1].state;
  return [
    { at: start, state: entering },
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
