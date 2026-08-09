import { FOREST_OVERLAY as ART } from "@/lib/forest-overlay";

/**
 * The `sizes` this backdrop is drawn at.
 *
 * It spans the section, which spans the viewport, so `100vw` is the honest
 * answer. Exported so `lib/sizes.test.ts` holds it to the same round-trip
 * guarantee as every other `sizes` string on the page.
 */
export const FOREST_BACKDROP_SIZES = "100vw";

/**
 * The client's forest-and-hornbills drawing, tinted right down and laid between
 * the cream and the content of `03 · The Forest`. Client request, 10 Aug 2026.
 *
 * ## What it is
 *
 * A near-flat wash the colour of the paper, with the drawing showing through at
 * `FOREST_OVERLAY.strength` — an endpaper rather than a picture. The hornbills
 * stay the darkest thing in it, which is right: they are the subject, and they
 * are native to Pench, which is Mahua Vann's park. The chapter's own copy says
 * "three hundred recorded birds".
 *
 * ## The three things that make it safe to put type on
 *
 * 1. **Contrast is enforced where the file is made, not here.**
 *    `scripts/build_forest_overlay.mjs` composites every pixel onto both creams,
 *    finds the darkest result, and throws if `PALETTE.dim` would fall under
 *    4.5:1 on it. Worst measured case: {@link FOREST_OVERLAY.worstContrast}:1.
 *    `scripts/check_contrast_over_photos.mjs` then measures the rendered page.
 * 2. **The tint is baked onto the cream**, so there is no blend mode and no
 *    opacity for anything else to compose with — and no alpha plane, which is
 *    what took the file from 282 KB to ~35 KB.
 * 3. **It is a real `<img>`, not a CSS background.** `measure_density.mjs`
 *    hit-tests with `elementsFromPoint`, which cannot see a section's own
 *    background; a CSS backdrop would have made the chapter score as bare paper
 *    while visibly carrying a drawing. That exact blindness was a defect on this
 *    project once already (`DECISIONS.md` §11).
 *
 * ## Failure
 *
 * If it never loads, the chapter is cream — which is what it was until today. It
 * is `aria-hidden`, takes no pointer events, and carries no script.
 */
export function ForestBackdrop({ surface = false }: { surface?: boolean }) {
  const base = `/brand/forest-overlay-${surface ? "paperDeep" : "paper"}`;

  return (
    <div
      aria-hidden="true"
      /*
       * **Anchored to the top at the drawing's own aspect, never stretched to the
       * section's.** `object-cover` was the obvious first move and it is wrong
       * here: the drawing is 1.79:1 and this chapter is 1.25:1 at 1440 and
       * **0.17:1 on a phone** — 390 wide by 2,251 tall. Covering that would zoom
       * roughly tenfold into a vertical sliver of foliage. At its own aspect the
       * drawing is a canopy the chapter stands under: 804px of an 1,153px section
       * at 1440, the top tenth on a phone, and never a distorted pixel.
       */
      className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
    >
      {/*
       * A plain `<img>`, not `next/image`: a fixed decorative wash with two
       * encoded widths and no art direction. Same call as the emblem, the leaf
       * and the lantern.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}-${ART.fallback}.webp`}
        srcSet={ART.widths.map((w) => `${base}-${w}.webp ${w}w`).join(", ")}
        sizes={FOREST_BACKDROP_SIZES}
        alt=""
        width={ART.width}
        height={ART.height}
        /*
         * Below the fold by several screens, and nothing depends on it — the
         * chapter is legible cream without it. Unlike the welcome's logo, there
         * is no reason for this to compete with anything on the first screen.
         */
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="block h-auto w-full"
        style={{
          /*
           * The drawing ends on undergrowth, and a hard horizontal edge across
           * the section would read as a seam rather than as paper. The mask
           * dissolves its last third into the cream — and it is a mask rather
           * than a gradient overlay because an overlay would have to know which
           * of the two creams it was covering, which is the coupling this whole
           * component is built to avoid.
           */
          maskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
        }}
      />
    </div>
  );
}
