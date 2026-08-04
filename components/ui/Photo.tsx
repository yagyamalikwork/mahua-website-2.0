import { media, type MediaId } from "@/lib/media";
import { capDensity } from "@/lib/sizes";

/**
 * The page's one `<picture>`.
 *
 * AVIF, then WebP, then the JPEG fallback; the manifest's own width/height on the
 * `<img>` so the browser reserves the right box before a byte arrives (the
 * manifest records the true *emitted* dimensions — see lib/media.test.ts), and
 * the manifest's blur data-URI behind it as a CSS background so the wait reads as
 * warm colour rather than a white hole.
 *
 * `Plate` and `FullBleed` both grew their own copy of this markup before Task 7;
 * both now defer to it, so a change to how photographs are served is one edit and
 * not three. The escape hatches exist because those two need genuinely different
 * boxes around the same `<picture>`:
 *
 * - `decorative` strips the accessible name for photographs that are pure
 *   backdrop (`FullBleed` lays no text on its own image, but sections do lay text
 *   over it, and that text is the accessible content).
 * - `pictureClassName` / `pictureStyle` size the `<picture>` itself, which is what
 *   `FullBleed` oversizes and recentres so parallax never uncovers bare canvas.
 *
 * ## `sizes` is not optional, and it is not decoration
 *
 * Until 4 Aug 2026 this component served one fixed file per photograph — the
 * largest tier the pipeline emitted — so a 390px phone downloaded the 1440-wide
 * hero, 192 KB for a 390px box. Measured on Slow 4G (1.6 Mbps, 150 ms RTT, 4x
 * CPU) that photograph's `responseEnd` was **4,954 ms**, against CLAUDE.md
 * non-negotiable #6's 2.5s budget, and Chrome reported LCP as 1,536 ms because it
 * resolved to a paragraph rather than to the photograph. The budget passed on the
 * metric while the visitor waited five seconds.
 *
 * A `srcset` alone does not fix that. Without `sizes` the browser assumes the
 * image is the full viewport width and picks accordingly, so a 340px plate in a
 * 4-up grid still pulls a 1440 file. **Every caller passes a `sizes` that
 * describes its own layout**, written next to the classes that create that
 * layout, because those two things have to change together.
 *
 * The rules deliberately round *up*. Over-stating a box costs a tier at worst;
 * under-stating it ships a visibly soft photograph, and softness is the one
 * failure mode this page cannot afford.
 *
 * `100vw` is the default only because it is the safe answer — it is right for the
 * three full-bleed screens and wasteful everywhere else.
 *
 * ## What the caller writes is not quite what ships
 *
 * Every `sizes` here goes through `lib/sizes.ts`'s `capDensity` first, which
 * prepends entries that hold screens denser than 2x to roughly 2x. Callers still
 * describe their own box honestly and only their own box; the density trade is
 * made in one place, with the measurements that justify it, rather than smuggled
 * into eight components' `sizes` strings where nobody could see it.
 */
export function Photo({
  id,
  className,
  style,
  pictureClassName,
  pictureStyle,
  sizes = "100vw",
  priority = false,
  decorative = false,
}: {
  id: MediaId;
  /** Classes for the `<img>`. */
  className?: string;
  /** Extra inline styles for the `<img>`, merged over the blur placeholder. */
  style?: React.CSSProperties;
  pictureClassName?: string;
  pictureStyle?: React.CSSProperties;
  /**
   * How wide this photograph is actually laid out, as a CSS `sizes` list.
   * Round up, never down. See the note above.
   */
  sizes?: string;
  /** Above the fold: eager, high priority, no async decode. */
  priority?: boolean;
  /** No accessible name — the photograph is backdrop, not content. */
  decorative?: boolean;
}) {
  const entry = media(id);
  const served = capDensity(sizes);

  const srcSet = (format: "avif" | "webp") =>
    entry.sources.map((s) => `${s[format]} ${s.width}w`).join(", ");

  return (
    <picture className={pictureClassName} style={pictureStyle}>
      <source srcSet={srcSet("avif")} sizes={served} type="image/avif" />
      <source srcSet={srcSet("webp")} sizes={served} type="image/webp" />
      {/* A plain <img>, not next/image: the manifest is already sized, compressed
          and budgeted by scripts/build_images.mjs, and next/image would add a
          runtime loader in front of work that is finished.

          The JPEG is deliberately single-width. It is the fallback for a browser
          with neither AVIF nor WebP, which is a rounding error of this site's
          traffic, and four more tiers of it would be four more encodes and four
          more files on disk to serve nobody. */}
      <img
        src={entry.jpg}
        alt={decorative ? "" : entry.alt}
        {...(decorative ? { role: "presentation" as const } : {})}
        width={entry.width}
        height={entry.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? undefined : "async"}
        // Explicitly low for everything below the fold, not merely absent.
        // Chrome fetches lazy images well before they enter the viewport — its
        // threshold widens on slow connections, which is precisely when it hurts
        // — and `bungalow-exterior-palms`, a full screen down in the *lodges*
        // chapter, was landing at 5,109 ms in the same pipe the hero was waiting
        // on. A priority hint does not stop the request; it stops it outranking
        // the one photograph the visitor is looking at.
        fetchPriority={priority ? "high" : "low"}
        className={className}
        style={{
          backgroundImage: `url(${entry.blur})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          ...style,
        }}
      />
    </picture>
  );
}
