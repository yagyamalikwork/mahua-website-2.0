import { Parallax } from "@/components/motion/Parallax";
import { media, type MediaId } from "@/lib/media";
import { PARALLAX_MAX } from "@/lib/motion";

/**
 * An edge-to-edge photograph with no text at all. `alt=""` plus
 * `role="presentation"` give it no accessible name, and no `children` prop
 * exists — nothing can be laid on top of it by mistake.
 *
 * `heightVh` — the container's height in viewport-height units. Defaults to a
 * full viewport (100). The day-arc used to derive this from a band's share of
 * the scroll timeline (`lib/band-height.ts`, removed 3 Aug 2026); callers now
 * pass whatever height their layout calls for.
 *
 * Parallax translates the wrapped element by up to (its own height * PARALLAX_MAX)
 * / 2 in either direction. Left alone, that would drag the image's edge past the
 * *container's* edge and uncover bare canvas at the extremes of the scroll-
 * through. So the image is oversized and recentred *before* Parallax ever
 * touches it: buffer on each side must be at least oversizeHeight *
 * PARALLAX_MAX / 2 (half the total translate range), solved here for a
 * comfortable (not knife-edge) margin. The oversize target is expressed
 * relative to `heightVh` (not a bare `100`) so the inequality still holds for
 * any container height, not just a full viewport.
 */
export function FullBleed({
  id,
  heightVh = 100,
  priority = false,
}: {
  id: MediaId;
  heightVh?: number;
  priority?: boolean;
}) {
  const entry = media(id);

  const oversizeVh = heightVh / (1 - PARALLAX_MAX) + 10;
  const bufferVh = (oversizeVh - heightVh) / 2;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: `${heightVh}vh` }}>
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
