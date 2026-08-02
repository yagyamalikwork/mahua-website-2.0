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
 *
 * Both crossing bands ("into-the-day", "into-the-dark") are pinned at `weight: 7`
 * on purpose and must stay equal — `components/ui/FullBleed.tsx` derives its own
 * height from this shared weight (via `lib/band-height.ts`'s `CROSSING_WEIGHT`),
 * so a full-bleed crossing photograph renders as exactly one viewport. Changing
 * one crossing band's weight without the other breaks that (see
 * `lib/band-height.test.ts`, which guards the equality directly).
 *
 * The other seven weights were retuned in Task 6 fix round 1 against measured
 * rendered content height at desktop widths (1440–2560px, after capping the
 * plate grids at `max-w-5xl` so that height stops growing with viewport width —
 * see the Task 6 fix-round-1 report for the measurements and the full working).
 * They are sized so no band's box is shorter than its own content (which would
 * make the box content-driven and break the height-equals-weight-share
 * invariant `lib/timeline.ts` depends on) while keeping the ≥70% light-band
 * share this file's test enforces. **These are still placeholder-copy weights**
 * — Plan 3's real copy will change every band's content height, and these
 * numbers should be re-measured and retuned against it, not assumed to survive
 * unchanged.
 */
export type Band = {
  readonly id: string;
  readonly state: LightStateId;
  readonly weight: number;
  readonly carriesText: boolean;
  readonly image?: MediaId;
};

export const BANDS: readonly Band[] = [
  { id: "mahua-falls",   state: "dawn",          weight:  7, carriesText: true },
  { id: "the-gate",      state: "firstLight",    weight:  9, carriesText: true },
  { id: "into-the-day",  state: "midMorning",    weight:  7, carriesText: false, image: "tiger-golden-grass" },
  { id: "the-residents", state: "midMorning",    weight: 15, carriesText: true },
  { id: "the-lodges",    state: "afternoon",     weight: 17, carriesText: true },
  { id: "rooted",        state: "lateAfternoon", weight: 13, carriesText: true },
  { id: "the-ritual",    state: "dusk",          weight: 14, carriesText: true },
  { id: "into-the-dark", state: "night",         weight:  7, carriesText: false, image: "mahua-tola-pool" },
  { id: "the-sky",       state: "night",         weight:  5, carriesText: true },
] as const;
