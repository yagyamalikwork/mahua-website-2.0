import { Parallax } from "@/components/motion/Parallax";
import { Photo } from "@/components/ui/Photo";
import type { MediaId } from "@/lib/media";
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
/**
 * The box's width. Its *height* is `oversizeVh` and varies with `heightVh`, so
 * it is passed as `box` at the call site rather than baked in here.
 */
export const FULL_BLEED_SIZES = "100vw";

export function FullBleed({
  id,
  heightVh = 100,
  priority = false,
}: {
  id: MediaId;
  heightVh?: number;
  priority?: boolean;
}) {
  const oversizeVh = heightVh / (1 - PARALLAX_MAX) + 10;
  const bufferVh = (oversizeVh - heightVh) / 2;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: `${heightVh}vh` }}>
      <Parallax>
        <Photo
          id={id}
          decorative
          priority={priority}
          // Edge to edge, so the *box* is 100vw — and `100vw` alone was the
          // wrong answer for four days, because the box is not what gets drawn.
          // This picture is `oversizeVh` tall and `object-cover`, so on a
          // portrait phone a 3:2 frame is scaled until its height covers ~1,077
          // px and is drawn 1,617 px wide inside a 390 px box. `box` is what
          // lets `lib/sizes.ts` ask for that rather than for 390.
          sizes={FULL_BLEED_SIZES}
          box={{ viewportHeightVh: oversizeVh }}
          pictureClassName="block w-full"
          pictureStyle={{
            height: `${oversizeVh}vh`,
            position: "relative",
            top: `-${bufferVh}vh`,
          }}
          className="h-full w-full object-cover"
        />
      </Parallax>
    </div>
  );
}
