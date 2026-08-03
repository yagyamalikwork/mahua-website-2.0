import { Reveal } from "@/components/motion/Reveal";
import { media, type MediaId } from "@/lib/media";

/**
 * A captioned photograph in the field-guide idiom — a numbered plate, not a hero
 * shot. `<picture>` offers AVIF then WebP ahead of the JPEG fallback; the manifest's
 * own width/height go on the `<img>` so the browser reserves the right box before a
 * single byte arrives (the manifest records the true emitted dimensions, not the
 * source file's — see lib/media.test.ts), and the manifest's blur placeholder sits
 * behind it as a CSS background so the wait reads as warm colour, not a white hole.
 *
 * Image and caption reveal together as one developing unit (spec section 4.3, law
 * 2) — the caption is not a separate reveal, it is part of the plate.
 */
export function Plate({
  id,
  caption,
  plate,
  priority = false,
}: {
  id: MediaId;
  caption?: string;
  plate?: string;
  priority?: boolean;
}) {
  const entry = media(id);

  return (
    <Reveal>
      <figure>
        <picture>
          <source srcSet={entry.avif} type="image/avif" />
          <source srcSet={entry.webp} type="image/webp" />
          <img
            src={entry.jpg}
            alt={entry.alt}
            width={entry.width}
            height={entry.height}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? undefined : "async"}
            fetchPriority={priority ? "high" : undefined}
            // `short:` (a viewport-height media variant, app/globals.css) caps
            // a plate's rendered height at short viewports (landscape phones)
            // instead of letting it hold its full width-derived height — a
            // full-width plate is the single largest content contributor in
            // any section that has one, and at short heights that height
            // alone can overflow the section around it. `w-auto` keeps the
            // aspect ratio intact; `mx-auto` recentres the now-narrower image
            // under its full-width caption.
            className="block h-auto w-full short:mx-auto short:h-auto short:max-h-[24vh] short:w-auto"
            style={{
              backgroundImage: `url(${entry.blur})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </picture>
        {caption && (
          <figcaption
            className="mt-4 max-w-[46ch] font-[family-name:var(--font-body)] text-base italic leading-relaxed short:mt-2"
            style={{ color: "var(--text)" }}
          >
            {plate && (
              <span className="mr-2 font-[family-name:var(--font-label)] text-xs not-italic uppercase tracking-[0.16em]">
                Plate {plate}
              </span>
            )}
            {caption}
          </figcaption>
        )}
      </figure>
    </Reveal>
  );
}
