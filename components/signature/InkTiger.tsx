import { InkStage } from "@/components/motion/InkStage";
import { DURATION } from "@/lib/motion";
import { TIGER_PATHS, TIGER_VIEWBOX } from "@/lib/tiger-art";

/**
 * A field-guide tiger that draws itself onto the page.
 *
 * The artwork is the client's own licensed vector, built by
 * `scripts/build_tiger.mjs` — 162 open, stroked paths, cropped to their own ink
 * and ordered longest-first, which is the order a hand works in.
 *
 * ## `pathLength="1"` is what makes this free
 *
 * It normalises every path to a length of 1 whatever its real geometry, so
 * `stroke-dasharray: 1` with `stroke-dashoffset` going 1 → 0 draws any line with
 * **no JavaScript measuring anything**. The whole effect is one CSS transition
 * and a per-stroke delay.
 *
 * A path missing the attribute keeps its true length, so a dash array of 1 leaves
 * it fully drawn from the very start — it opts out of the animation silently
 * while looking perfectly correct in the markup. `scripts/check_ink_tiger.mjs`
 * counts them for exactly that reason.
 *
 * ## A server component
 *
 * The drawing is markup and its animation is CSS, so none of it needs to reach
 * the browser as JavaScript. `InkStage` is the thin client wrapper that supplies
 * the state, and it takes this as `children` so the artwork stays in the HTML —
 * the same arrangement `PinnedCollage` uses, and the reason the JS budget does
 * not move.
 *
 * ## Size, and why it is a fixed 150px rather than the 20vh the spec asked for
 *
 * Because the space it has to live in is fixed, and was measured rather than
 * assumed. `field-days` has **no 350x180 hole at its foot** — the clear band
 * below all of its content is 68px. The largest empty rectangle anywhere near the
 * bottom is 500x180 at the right-hand edge, and most of that is the section's own
 * 80px of bottom padding, which is empty by construction.
 *
 * A viewport-relative height would grow out of that rectangle on a tall screen
 * and collide with "Walks and cycling" — which is exactly what a 20vh version
 * did, drawing the tiger's head straight through two lines of copy.
 *
 * On a phone the bands stack, the drawing goes back in flow, and width is the
 * binding constraint instead.
 */
export function InkTiger() {
  return (
    <InkStage>
      <svg
        aria-hidden="true"
        data-ink-tiger
        viewBox={TIGER_VIEWBOX}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        /*
         * Three sizes, because the hole it sits in has three sizes.
         *
         * Between `lg` and `xl` the experience index is seven columns rather than
         * six, so its left sub-column reaches further right and a 292px-wide tiger
         * clipped "More than a hundred Kumhar families…" by a few pixels. Measured
         * at 1024, 1440 and 1920 — see `scripts/check_ink_tiger.mjs`.
         */
        className="pointer-events-none block h-auto w-full max-w-[560px] text-[color:var(--text)] sm:h-[110px] sm:w-auto xl:h-[150px]"
      >
        {TIGER_PATHS.map((p, i) => (
          <path
            key={i}
            d={p.d}
            /* The artist's own weight, kept. It is most of why this reads as
               hand-made rather than as a diagram. */
            strokeWidth={p.w}
            pathLength={1}
            {...(p.part ? { "data-part": p.part } : {})}
            style={{ "--ink-delay": `${p.ink * DURATION.tigerInkStagger}s` } as React.CSSProperties}
          />
        ))}
      </svg>
    </InkStage>
  );
}
