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
  sizes,
  frame,
  priority = false,
}: {
  id: MediaId;
  caption?: string;
  plate?: string;
  /**
   * How wide the plate is laid out. A plate has no width of its own — it fills
   * whatever grid cell it is dropped into, and `PlateGrid` picks its column
   * count from the photographs' orientations — so the rule has to come from the
   * caller. See `ui/Photo.tsx` on why a missing `sizes` is a 1440px download.
   */
  sizes?: string;
  /**
   * A common box for every plate in the grid, when the grid has decided its
   * plates must match. Absent, the photograph keeps its own shape and its own
   * height, which is right for a grid whose plates already agree.
   *
   * `className` is the ratio as a `roomy:` Tailwind class and `ratio` is the same
   * number for `sizes` (see `ui/Photo.tsx` on `box`); they are one object rather
   * than two props so a change to one cannot ship without the other.
   */
  frame?: { readonly className: string; readonly ratio: number };
  priority?: boolean;
}) {
  return (
    <ImageReveal>
      <figure>
        <Photo
          id={id}
          priority={priority}
          sizes={sizes}
          // Deliberately unconditional, while the frame it describes is `roomy:`
          // only. `CoverBox` speaks in viewport *widths* and this threshold is a
          // height and a shape, so the honest options are to over-state the box
          // or to leave landscape phones under-served; `ui/Photo.tsx` says which
          // way to round.
          box={frame?.ratio}
          pictureClassName={`block${frame ? ` w-full ${frame.className}` : ""}`}
          /*
           * Three states, and **every one of them names its own width**. That is
           * the fix for the defect the client reported on 12 Aug 2026 ("images
           * squeeze"), and it is not a style preference:
           *
           * this used to read `w-full … pocket:w-auto`, so on a short viewport
           * BOTH applied and which won was decided by the order Tailwind
           * happened to emit its variants in. `w-full` won, the 24vh cap
           * clamped the height anyway, and the photograph was squashed —
           * measured at up to **230% wider than its true shape** on a 1366x768
           * laptop. It never looked like a cascade bug; it looked like a broken
           * photograph. Keep the three states disjoint and no emission order can
           * reproduce it.
           *
           * `pocket:` is a landscape phone (short AND at least 2:1 — see
           * app/globals.css). There a full-width plate's own height can exceed
           * the whole screen, so it is capped at 24vh; `w-auto` keeps the shape
           * and `mx-auto` recentres it under its full-width caption. `roomy:` is
           * the exact complement and covers every laptop, tablet and zoom level,
           * where a plate is simply itself.
           */
          className={`block pocket:mx-auto pocket:h-auto pocket:max-h-[24vh] pocket:w-auto ${
            frame ? "roomy:h-full roomy:w-full roomy:object-cover" : "roomy:h-auto roomy:w-full"
          }`}
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
