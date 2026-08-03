import { media, type MediaId } from "@/lib/media";

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
 */
export function Photo({
  id,
  className,
  style,
  pictureClassName,
  pictureStyle,
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
  /** Above the fold: eager, high priority, no async decode. */
  priority?: boolean;
  /** No accessible name — the photograph is backdrop, not content. */
  decorative?: boolean;
}) {
  const entry = media(id);

  return (
    <picture className={pictureClassName} style={pictureStyle}>
      <source srcSet={entry.avif} type="image/avif" />
      <source srcSet={entry.webp} type="image/webp" />
      {/* A plain <img>, not next/image: the manifest is already sized, compressed
          and budgeted by scripts/build_images.mjs, and next/image would add a
          runtime loader in front of work that is finished. */}
      <img
        src={entry.jpg}
        alt={decorative ? "" : entry.alt}
        {...(decorative ? { role: "presentation" as const } : {})}
        width={entry.width}
        height={entry.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? undefined : "async"}
        fetchPriority={priority ? "high" : undefined}
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
