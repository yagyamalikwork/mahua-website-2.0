import { ImageReveal } from "@/components/motion/ImageReveal";
import { Photo } from "@/components/ui/Photo";
import type { MediaId } from "@/lib/media";

/**
 * A captioned photograph in the field-guide idiom — a numbered plate, not a hero
 * shot. The `<picture>` itself is `Photo`; this adds the frame, the caption and
 * the arrival.
 *
 * Image and caption reveal together as one developing unit (spec section 4.3, law
 * 2) — the caption is not a separate reveal, it is part of the plate. Task 7
 * swapped the `Reveal` fade for `ImageReveal`'s mask: a cream mask wiping upward
 * off a plate is legible as motion from across the room, and "no scroll
 * animation" was one of the three things the client rejected the last build for.
 * A fade at 3% opacity per frame is not.
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
  return (
    <ImageReveal>
      <figure>
        <Photo
          id={id}
          priority={priority}
          pictureClassName="block"
          // `short:` (a viewport-height media variant, app/globals.css) caps a
          // plate's rendered height at short viewports (landscape phones)
          // instead of letting it hold its full width-derived height — a
          // full-width plate is the single largest content contributor in any
          // section that has one, and at short heights that height alone can
          // overflow the section around it. `w-auto` keeps the aspect ratio
          // intact; `mx-auto` recentres the now-narrower image under its
          // full-width caption.
          className="block h-auto w-full short:mx-auto short:h-auto short:max-h-[24vh] short:w-auto"
        />
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
    </ImageReveal>
  );
}
