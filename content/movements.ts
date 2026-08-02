import type { MediaId } from "@/lib/media";
import type { LightStateId } from "@/lib/palette";

/**
 * The page as a sequence of bands, in scroll order. Both the layout and the light
 * timeline read this, so they cannot disagree about where a movement starts.
 *
 * `carriesText: false` marks a crossing band: a full-bleed photograph with no words
 * on it. Spec section 13 requires the two light/dark crossings to happen here and
 * nowhere else, because no warm text colour can stay legible against a background
 * halfway between forest green and cream.
 *
 * `weight` is relative scroll height (unitless). The cream movements carry the most
 * content and are weighted well above the two dark bookends, so the page reads as
 * warm daylight with brief dark visits at either end — not a 50/50 split (spec
 * section 9: light bands must hold at least 70% of total scroll height).
 */
export type Band = {
  readonly id: string;
  readonly state: LightStateId;
  readonly weight: number;
  readonly carriesText: boolean;
  readonly image?: MediaId;
};

export const BANDS: readonly Band[] = [
  { id: "mahua-falls",   state: "dawn",          weight:  8, carriesText: true },
  { id: "the-gate",      state: "firstLight",    weight:  8, carriesText: true },
  { id: "into-the-day",  state: "midMorning",    weight:  7, carriesText: false, image: "tiger-golden-grass" },
  { id: "the-residents", state: "midMorning",    weight: 18, carriesText: true },
  { id: "the-lodges",    state: "afternoon",     weight: 24, carriesText: true },
  { id: "rooted",        state: "lateAfternoon", weight: 18, carriesText: true },
  { id: "the-ritual",    state: "dusk",          weight: 18, carriesText: true },
  { id: "into-the-dark", state: "night",         weight:  7, carriesText: false, image: "mahua-tola-pool" },
  { id: "the-sky",       state: "night",         weight:  8, carriesText: true },
] as const;
