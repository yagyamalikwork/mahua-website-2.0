import { Parallax } from "@/components/motion/Parallax";
import { bandHeightVh } from "@/lib/band-height";
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
 * `bandId` — required, not optional — is the id this crossing band has in
 * `content/movements.ts`'s `BANDS` (e.g. `"into-the-day"`). The container's
 * height comes from `bandHeightVh(bandId)`, the same function every text
 * movement calls (`lib/band-height.ts`), rather than a hard-coded `h-screen`.
 * Fix round 1: an earlier version hard-coded `h-screen` here, which rendered
 * at exactly one viewport only because both crossing bands *happened* to carry
 * the same `weight` — nothing tied FullBleed's own markup to that fact, so
 * editing one crossing band's weight alone would have silently detached its
 * rendered height from what `lib/timeline.ts` assumes for it, which is
 * precisely the drift the whole plan exists to prevent. Both crossing bands
 * are still required to share a weight (`lib/band-height.test.ts` guards it),
 * but now that requirement is what keeps this component's own maths
 * self-consistent, not an unrelated coincidence it depended on blindly.
 *
 * Parallax translates the wrapped element by up to (its own height * PARALLAX_MAX)
 * / 2 in either direction. Left alone, that would drag the image's edge past the
 * *container's* edge and uncover bare canvas at the extremes of the scroll-
 * through. So the image is oversized and recentred *before* Parallax ever
 * touches it: buffer on each side must be at least oversizeHeight *
 * PARALLAX_MAX / 2 (half the total translate range), solved here for a
 * comfortable (not knife-edge) margin. The oversize target is expressed
 * relative to `containerVh` (not a bare `100`) so the inequality still holds
 * if a crossing band's height is ever anything other than one full viewport —
 * derived from the container's real height, not assumed to equal it.
 */
export function FullBleed({
  id,
  bandId,
  priority = false,
}: {
  id: MediaId;
  bandId: string;
  priority?: boolean;
}) {
  const entry = media(id);
  const containerVh = bandHeightVh(bandId);

  const oversizeVh = containerVh / (1 - PARALLAX_MAX) + 10;
  const bufferVh = (oversizeVh - containerVh) / 2;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: `${containerVh}vh` }}>
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
