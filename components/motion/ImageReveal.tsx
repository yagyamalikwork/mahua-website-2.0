"use client";

import { useInView } from "./useInView";

/**
 * A photograph arriving: a mask wipes upward off it while the image itself
 * settles from slightly oversize down to rest.
 *
 * Same engine as `Enter` and the same fail-safe arrangement — the mask is
 * collapsed to nothing in the server-rendered markup by its own `scale-y-0`
 * class, so with no JavaScript the photograph is simply there. Script only ever
 * raises the mask in order to lower it again, and only after `useInView` has
 * confirmed the frame is below the fold. The movement itself is entirely CSS
 * (`app/globals.css`), from the numbers `app/layout.tsx` writes out of
 * `lib/motion.ts`: `IMAGE_FROM.scale` for how oversize the image starts,
 * `DURATION.imageMask` for the wipe, `DURATION.revealSlow` for the settle.
 *
 * `static` opts a photograph out entirely, for the one above the fold: the hero
 * image is the LCP element, and Lighthouse stops its timer on the *final* frame
 * of any animation applied to it. A 1.2s mask on the hero is 1.2s straight onto
 * the metric, and budgets beat effects (CLAUDE.md non-negotiable #6). It opts
 * out by never handing the element to the observer at all, so a static
 * photograph cannot be staged by any route.
 */
export function ImageReveal({
  children,
  className,
  delay = 0,
  static: skipTween = false,
  noZoom = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  static?: boolean;
  /**
   * Opt out of the homepage's hover zoom (`app/globals.css`, `[data-hover-zoom]`).
   *
   * For photographs that are a *backdrop* rather than an object — the hero, which
   * carries the headline on top of it. A background that reacts to the pointer is
   * restless, and non-negotiable #4 is that restraint is a requirement. Everything
   * that reads as a discrete photograph keeps the zoom.
   */
  noZoom?: boolean;
}) {
  const { ref, state } = useInView<HTMLDivElement>();
  const driven = !skipTween && state !== "rest";

  return (
    <div
      ref={skipTween ? undefined : ref}
      /*
       * `data-image-frame` is the hover-zoom's hook, and it is an attribute rather
       * than a structural selector on purpose: this project has twice had a rule
       * silently stop matching when markup moved (`DECISIONS.md` §2, #10 and #33).
       * The frame is already `overflow-hidden`, which is what lets a photograph
       * grow inside a boundary that does not move.
       */
      data-image-frame=""
      {...(noZoom ? { "data-no-zoom": "" } : {})}
      className={`relative overflow-hidden ${className ?? ""}`}
      {...(driven ? { "data-image-enter": state } : {})}
      style={delay ? ({ "--image-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      <div data-image-inner className="h-full w-full">
        {children}
      </div>
      {/* Collapsed at rest, so no-JS shows the photograph and not a cream panel.
          `scale-y-0` is what does it, and `components/motion/primitives.test.tsx`
          checks the class is still in the server markup — inverting this to a
          covered-at-rest mask would blank every photograph on the page. */}
      <div
        data-image-mask
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scale-y-0 origin-top bg-[var(--bg)]"
      />
    </div>
  );
}
