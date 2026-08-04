import { EMBLEM } from "@/lib/brand-emblem";
import { HOME } from "@/content/home";

/**
 * The mahua flower over the name — the client's lockup, at header scale.
 *
 * The supplied artwork stacks the flower above "MAHUA" above "RESORTS" in a
 * brown serif. Two of those three parts are rebuilt rather than shipped as
 * drawn, for reasons that only apply to this position on this page:
 *
 * - **The words are set live**, in the same Cinzel already loaded for every
 *   other label on the page, instead of being part of the image. The header
 *   overlays the hero photograph, and the artwork's brown (`#7F5C24`) is
 *   unreadable on it; live type takes the cream the photograph needs, stays
 *   crisp at any size, and is selectable and searchable. Setting `MAHUA` and
 *   `RESORTS` on one line is the standard reduction of a stacked lockup to a
 *   bar — three tiers at 40px would be illegible.
 * - **The flower is the client's own artwork**, not a redraw:
 *   `scripts/build_brand.mjs` renders the vector at 600 DPI, crops it to its
 *   own ink and emits it at three widths (3.2–8.0 KB). The 127 KB source SVG
 *   would have been a sixth of the first-fold budget for one small mark.
 *
 * Sized in `em` so the whole lockup scales from one font-size on the parent,
 * and given an explicit `width`/`height` so it reserves its box before the
 * image arrives — the header sits over the LCP element and must not shift it.
 */
/**
 * Exported so `lib/sizes.test.ts` can hold it to the same round-trip guarantee
 * as every other `sizes` string on the page. The mark is drawn at 2.2em of a
 * 13-17px parent, so ~29px on a phone and ~44px from `md` — the emblem is flat
 * illustration and does not need the density the photographs do.
 */
export const EMBLEM_SIZES = "(min-width: 768px) 44px, 32px";

export function BrandMark({ className }: { className?: string }) {
  const base = `/brand/emblem`;

  return (
    <span className={`flex flex-col items-center gap-[0.5em] ${className ?? ""}`}>
      <picture>
        <source
          type="image/webp"
          srcSet={EMBLEM.widths.map((w) => `${base}-${w}.webp ${w}w`).join(", ")}
          sizes={EMBLEM_SIZES}
        />
        <img
          src={`${base}-${EMBLEM.fallback}.png`}
          alt=""
          aria-hidden="true"
          width={EMBLEM.width}
          height={EMBLEM.height}
          decoding="async"
          fetchPriority="low"
          className="h-[2.2em] w-auto md:h-[2.6em]"
        />
      </picture>

      {/*
       * The emblem is decorative and hidden; this is the accessible name.
       *
       * Stacked below `sm` and on one line above it. That is not only a fit
       * fix — the client's own lockup sets MAHUA over RESORTS, so the narrow
       * layout is the more faithful of the two. On one line at 320px the words
       * came within 12px of the "Plan your stay" pill and pushed the page into
       * horizontal scroll; two lines clear it with room.
       *
       * Split here rather than stored as two strings in `content/`: how a name
       * wraps is presentation, and `HOME.nav.brand` stays the single copy of it.
       */}
      {/*
       * `sm:gap-[0.95em]` and not something smaller: at 0.34em tracking, the
       * space between two words has to beat the space between two letters or
       * the pair reads as "MAHUARESORTS". Letter-spacing already adds a trailing
       * gap after the final A, so the flex gap is the visible difference.
       */}
      <span className="flex flex-col items-center gap-[0.3em] font-[family-name:var(--font-label)] text-[0.62em] font-medium uppercase leading-none text-[color:var(--bg)] sm:flex-row sm:gap-[0.95em]">
        {HOME.nav.brand.split(/\s+/).map((word) => (
          <span key={word} className="whitespace-nowrap tracking-[0.26em] md:tracking-[0.34em]">
            {word}
          </span>
        ))}
      </span>
    </span>
  );
}
