/**
 * One mahua leaf, drawn for the cursor that follows the pointer.
 *
 * ## Why this is drawn and not extracted
 *
 * It was extracted first. The client's logo
 * (`Mahua-property-logos/Mahua-Resorts/Mahua-Resorts.svg`) really does contain
 * eight leaves as real vector paths — four `#465E44`, four `#2B3F2A`, veined —
 * and a script pulled one out cleanly, byte-identical to their artwork. That was
 * the right instinct and the result is kept as evidence at
 * `docs/reviews/2026-08-05-signature/leaf-extracted-{24,96,300}.png`.
 *
 * **It does not survive being shrunk to 24px.** Those leaves are stylised to sit
 * in a rosette: short, wide, symmetrical, meant to be read eight at a time in a
 * ring, with no stem and no clear point because in the logo both are hidden under
 * the petals. At cursor size the extraction is a dark green blob and its veins
 * disappear entirely. Compare `leaf-extracted-24.png` with `leaf-24.png`.
 *
 * So this is drawn to be read *small and alone*, which is a different problem
 * from being read *large and in a ring*:
 *
 * - **A stem.** The whole conceit is a leaf hanging from the pointer, and the
 *   only thing that says "hanging" is a visible petiole running back to the
 *   anchor point.
 * - **A point.** A rounded blob reads as a bead. The taper is what makes it a
 *   leaf at 24px.
 * - **Long, not round.** A real *Madhuca longifolia* leaf is elliptic-oblong and
 *   leathery, so this is truer to the tree than the logo's rosette is.
 *
 * ## The geometry the cursor depends on
 *
 * The viewBox is square so the leaf can swing about its stem without shearing,
 * and the **stem tip sits at the top-left corner**, with the body falling down
 * and to the right. `LeafCursor` puts the SVG's own origin at the pointer and so
 * needs no offset maths: the tip is the pointer, and nothing hangs over what you
 * are about to click.
 *
 * ## Swap point
 *
 * If a better leaf arrives — from an illustrator, or from a re-supplied logo with
 * a leaf drawn for small sizes — replace this file. Nothing else changes: two
 * exports, and every assertion in `lib/leaf-art.test.ts` applies to a replacement
 * as much as it does to this.
 */

export type LeafPath = {
  /** The `d` attribute. */
  d: string;
  /**
   * What the path is, because each is painted differently.
   *
   * `blade` is filled; `stem` and `vein` are stroked. They are three roles rather
   * than a `vein: boolean` because the stem lies *outside* the blade and the veins
   * lie *on* it, so they cannot take the same colour: veins have to contrast with
   * the blade they sit on, and the stem has to contrast with the page.
   */
  role: "blade" | "stem" | "vein";
};

export const LEAF_VIEWBOX = "0 0 100 100";

export const LEAF_PATHS: readonly LeafPath[] = [
  // The petiole. Drawn first so the filled blade lands on top of where the two
  // meet and the join needs no mitring. Short: a long stem pulls the blade away
  // from the pointer and the leaf stops reading as attached to it.
  { d: "M5 5 C 12 11, 22 21, 31 30", role: "stem" },
  // The blade: two cubics either side of the stem-to-tip axis, bulging equally.
  //
  // Half-width is 15 units against an 88-unit axis — a width-to-length ratio of
  // about 0.35, which is *Madhuca longifolia* and not a blade of grass. The first
  // attempt was half that and read as a feather. Control points sit at a third and
  // two thirds along the axis, offset by 4/3 of the half-width, because a cubic
  // only reaches three quarters of the way to its controls.
  { d: "M31 30 C 37 65, 57 86, 92 93 C 86 58, 66 37, 31 30 Z", role: "blade" },
  // The midrib, on the same axis, stopping a shade inside the tip.
  { d: "M34 34 C 48 50, 68 72, 86 88", role: "vein" },
  // Three side veins on the lower flank, and only that flank: at cursor size a
  // full pinnate network fills in to a smudge, and an asymmetric leaf reads as one
  // caught at an angle rather than as a mistake.
  //
  // Each ends at ~80% of the blade's half-width at that point, angled toward the
  // tip. They ran past the outline entirely in the first version — a vein outside
  // its own leaf, which no test would have caught and one glance did.
  { d: "M48 48 Q 44 51, 44 56", role: "vein" },
  { d: "M60 60 Q 56 65, 54 71", role: "vein" },
  { d: "M72 73 Q 69 78, 67 82", role: "vein" },
];
