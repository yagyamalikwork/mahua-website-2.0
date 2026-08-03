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
  | "paper" | "paperDeep" | "ink" | "dim" | "gold" | "goldText" | "overlay";

export const PALETTE: Record<PaletteToken, string> = {
  paper: "#F1E9D7",
  paperDeep: "#E9DFC8",
  ink: "#31402C",
  dim: "#5A5240",
  gold: "#BB8F2E",
  goldText: "#7A5C18",
  overlay: "#232B21",
} as const;
