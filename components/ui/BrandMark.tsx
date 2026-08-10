import { EMBLEM } from "@/lib/brand-emblem";
import { HOME } from "@/content/home";

/**
 * The mahua flower beside the name — the header lockup.
 *
 * The client supplied the brand artwork as a single 127 KB, 340-path,
 * 14-colour Illustrator export stacking the flower above "MAHUA" above
 * "RESORTS" in brown. None of that survives contact with this position on the
 * page, so the lockup is assembled from two parts instead:
 *
 * - **The flower is the client's own artwork**, not a redraw.
 *   `scripts/build_brand.mjs` renders their vector at 600 DPI, finds the flower
 *   by scanning the artwork's own ink bands, and emits it at three widths
 *   (3.2-8.0 KB). Shipping the source SVG would have spent a sixth of the
 *   first-fold budget on one 40px mark.
 * - **The words are set live**, in the display serif the header used before the
 *   logo existed. The artwork's brown is unreadable over the hero photograph —
 *   1.42:1 against the brightest pixel the contrast rig has ever found under
 *   this lockup — so live type takes the cream the photograph needs, stays crisp
 *   at any size, and is selectable and searchable.
 *
 *   **It takes the brown back the moment the bar is cream.** That is the client's
 *   5 Aug request and the reason `PALETTE.brand` exists: the objection was never
 *   to the colour, it was to the colour over a photograph, and past the hero
 *   there is no photograph. `--header-wordmark` is set by
 *   `app/globals.css` from the header's own state, so nothing here knows which
 *   state it is in and no colour is written in this file.
 *
 * Horizontal rather than stacked, at the client's direction: flower, then name,
 * on one line. Everything is sized in `em` from the wordmark, so the whole
 * lockup scales from the single font-size step on the root element and the
 * flower can never drift out of proportion with the type beside it.
 */

/**
 * Exported so `lib/sizes.test.ts` holds it to the same round-trip guarantee as
 * every other `sizes` string on the page. The mark is drawn at 1.75em of a
 * 13-24px wordmark, so ~23px on a phone and ~42px from `md`.
 */
export const EMBLEM_SIZES = "(min-width: 768px) 44px, 28px";

export function BrandMark({ className }: { className?: string }) {
  const base = `/brand/emblem`;

  return (
    <span
      className={`flex items-center gap-[0.45em] font-[family-name:var(--font-display)] text-[10px] font-light uppercase leading-none min-[360px]:text-[11px] min-[400px]:text-[13px] sm:gap-[0.5em] sm:text-lg md:text-2xl ${className ?? ""}`}
    >
      {/*
       * `shrink-0` belongs here, not on the `<img>`. The flex item is the
       * `<picture>`, and without it the mark was squeezed to 23px at 430 and to
       * *nothing at all* at 360 — the wordmark won the space fight and the logo
       * silently vanished. Visible only by measuring the rendered width; the
       * markup looked correct.
       */}
      <picture className="shrink-0">
        <source
          type="image/webp"
          srcSet={EMBLEM.widths.map((w) => `${base}-${w}.webp ${w}w`).join(", ")}
          sizes={EMBLEM_SIZES}
        />
        {/*
         * Decorative: the name sits beside it in real text, so announcing the
         * mark as well would read the brand twice. Explicit width/height keeps
         * the header from reflowing when it lands — it overlays the LCP element.
         */}
        <img
          src={`${base}-${EMBLEM.fallback}.png`}
          alt=""
          aria-hidden="true"
          width={EMBLEM.width}
          height={EMBLEM.height}
          decoding="async"
          fetchPriority="low"
          /*
           * `emblem-turn` is the half-turn the mark makes once as the page
           * arrives — keyframes and the reduced-motion still state both in
           * `app/globals.css`, duration from `DURATION.emblemTurn`. It is on the
           * `<img>` and not the `<picture>` because the `<picture>` is the flex
           * item whose width the row is fighting over, and a rotation is a
           * transform on a box the layout has already decided.
           */
          className="emblem-turn h-[1.75em] w-auto shrink-0"
        />
      </picture>

      {/*
       * Tracking eases in with the type size. At 11px on a 320px phone the
       * lockup has about 95px of centre column to live in once "Menu" and the
       * pill have taken theirs, and 0.14em tracking was enough on its own to
       * push the whole page into horizontal scroll.
       */}
      {/*
       * `data-contrast` is the hook `scripts/check_contrast_over_photos.mjs`
       * finds this by. It used to be found structurally, as `header > div > p`,
       * and when this lockup replaced the plain wordmark the selector matched
       * nothing — the rig reported "not visible" and counted it as neither a
       * pass nor a failure, so cream type over a photograph went unchecked and
       * CI stayed green. An attribute the markup has to keep on purpose cannot
       * drift the same way.
       */}
      {/*
       * `data-header-tint` is the other hook, and it is an attribute for the same
       * reason: it is what `app/globals.css` gives the colour transition to, and
       * a structural selector would have to reach past `SiteMenu`'s panel,
       * which is also inside the header and is cream in both states.
       */}
      <span
        data-contrast="brand-wordmark"
        data-header-tint="wordmark"
        className="whitespace-nowrap tracking-[0.02em] min-[360px]:tracking-[0.08em] min-[400px]:tracking-[0.14em] sm:tracking-[0.24em] md:tracking-[0.3em]"
      >
        {HOME.nav.brand}
      </span>
    </span>
  );
}
