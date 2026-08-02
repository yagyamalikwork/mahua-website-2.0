import { Parallax } from "@/components/motion/Parallax";
import { media, type MediaId } from "@/lib/media";
import { PARALLAX_MAX } from "@/lib/motion";

/**
 * An edge-to-edge, viewport-height photograph with no text at all — what the two
 * light/dark crossing bands render (content/movements.ts's `carriesText: false`
 * bands). Text-free is the entire point: the light crosses between dark and cream
 * inside these, and no warm text colour stays legible mid-crossing (spec section
 * 13). `alt=""` plus `role="presentation"` give it no accessible name, and no
 * `children` prop exists — nothing can be laid on top of it by mistake.
 *
 * Parallax translates the wrapped element by up to (its own height * PARALLAX_MAX)
 * / 2 in either direction. Left alone, that would drag the image's edge past the
 * viewport's and uncover bare canvas at the extremes of the scroll-through. So the
 * image is oversized and recentred *before* Parallax ever touches it: buffer on
 * each side must be at least oversizeHeight * PARALLAX_MAX / 2, solved here for a
 * comfortable (not knife-edge) margin, and derived from PARALLAX_MAX itself so this
 * stays correct if that constant ever changes.
 */
export function FullBleed({ id, priority = false }: { id: MediaId; priority?: boolean }) {
  const entry = media(id);

  const oversizeVh = 100 / (1 - PARALLAX_MAX) + 10;
  const bufferVh = (oversizeVh - 100) / 2;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Parallax>
        <picture
          className="block w-full"
          style={{ height: `${oversizeVh}vh`, position: "relative", top: `-${bufferVh}vh` }}
        >
          <source srcSet={entry.avif} type="image/avif" />
          <source srcSet={entry.webp} type="image/webp" />
          <img
            src={entry.jpg}
            alt=""
            role="presentation"
            width={entry.width}
            height={entry.height}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? undefined : "async"}
            fetchPriority={priority ? "high" : undefined}
            className="h-full w-full object-cover"
            style={{
              backgroundImage: `url(${entry.blur})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </picture>
      </Parallax>
    </div>
  );
}
