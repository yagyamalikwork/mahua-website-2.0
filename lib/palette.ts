/**
 * The palette. One cream surface, not a scroll-driven sequence.
 *
 * The previous design moved the background through seven states as you scrolled.
 * It was retired on 3 Aug 2026: section heights had to be sized by colour ratio
 * rather than by content, which left the page sparse, and it pulled against both
 * the brand guidelines and the reference site, which are cream throughout.
 *
 * `gold` is decorative only — rules, ornaments, the emblem. It measures about
 * 2.5:1 on cream and must never carry text. `goldText` is the legible sibling.
 */
export type PaletteToken =
  | "paper" | "paperDeep" | "ink" | "dim" | "gold" | "goldText" | "brand" | "overlay";

export const PALETTE: Record<PaletteToken, string> = {
  paper: "#F1E9D7",
  paperDeep: "#E9DFC8",
  ink: "#31402C",
  dim: "#5A5240",
  gold: "#BB8F2E",
  goldText: "#7A5C18",
  /**
   * The wordmark brown from the client's supplied lockup — their ink, not ours.
   *
   * Sampled from `Mahua-property-logos/Mahua-Resorts/Mahua-Resorts.svg` rendered
   * at 300 DPI rather than eyedropped from a screenshot: it is the third most
   * common value in the whole artwork at 69,215 exact pixels, of which 64,730
   * are the two type bands — 49,456 in "MAHUA" and 15,274 in "RESORTS". Nothing
   * about it is a near-miss or an approximation. Measures 5.02:1 on `paper` and
   * 4.58:1 on `paperDeep`, so it clears the 4.5:1 body floor on both surfaces
   * and `palette.test.ts` holds it there.
   *
   * Distinct from `goldText` (#7A5C18), which is ours and exists so gold-looking
   * *links* stay legible. This one is the brand's, and the header wears it the
   * moment it has a cream background to sit on — which is the whole of the
   * client's 5 Aug request. Over a photograph the header stays cream, because
   * against the brightest pixel the rig has ever found under the header on the
   * hero — [71,78,68] at 1440, `docs/reviews/2026-08-04-task-7/` — this brown
   * measures **1.42:1** where cream measures 7.12:1. It is a colour for a cream
   * bar and nothing else.
   */
  brand: "#7F5C24",
  overlay: "#232B21",
} as const;
