"use client";

import { useEffect, useRef } from "react";
import { EASE, PARALLAX_MAX, prefersReducedMotion } from "@/lib/motion";
import { loadScrubTools, whenNear } from "./scrub";

/**
 * Depth, not movement. Strength is hard-clamped (spec section 4.3, law 3).
 *
 * The one effect on this page that genuinely needs a tween library: it maps
 * scroll position to a transform continuously, frame by frame, which is
 * ScrollTrigger's job and which CSS has no reliable equivalent for today. So
 * GSAP stays — but it is fetched by `whenNear`, only once this particular
 * element is within a screen of the viewport, and never at all for a visitor
 * who asked for less motion. See `components/motion/scrub.ts`.
 *
 * **While the library is in flight the children render untransformed**, which is
 * also exactly the reduced-motion state. The fallback is therefore a code path
 * that is already exercised rather than a new one, and a failed chunk fetch
 * costs the page its parallax and nothing else.
 */
export function Parallax({
  children, strength = PARALLAX_MAX,
}: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let unmounted = false;
    let killTween = () => {};

    const stopWatching = whenNear(el, () => {
      loadScrubTools()
        // `ScrollTrigger` is not destructured because it is not referenced by
        // name here — `loadScrubTools` has already registered it as a plugin,
        // which is what makes the `scrollTrigger` key below mean anything.
        .then(({ gsap }) => {
          // The component can be gone by the time the chunk lands.
          if (unmounted) return;

          const capped = Math.min(Math.abs(strength), PARALLAX_MAX);

          // Function-based values + invalidateOnRefresh: GSAP re-evaluates these
          // on every ScrollTrigger refresh, so a resize or reflow re-measures
          // the height instead of animating against the height the element had
          // at mount.
          const tween = gsap.fromTo(
            el,
            { y: () => -(el.offsetHeight * capped) / 2 },
            {
              y: () => (el.offsetHeight * capped) / 2,
              ease: EASE.drift,
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );

          killTween = () => {
            tween.scrollTrigger?.kill();
            tween.kill();
            // Whatever the scrub was mid-way through, leave the element where
            // the layout puts it rather than where the tween last had it.
            gsap.set(el, { clearProps: "transform" });
          };
        })
        // A chunk that never arrives must cost the page its parallax and
        // nothing else — an unhandled rejection here would be a console error
        // on every visit with a flaky connection.
        .catch(() => {});
    });

    return () => {
      unmounted = true;
      stopWatching();
      killTween();
    };
  }, [strength]);

  // `data-parallax` is a measurement hook and nothing else: it is what lets
  // `scripts/check_entrances.mjs` find these ten elements and check that they
  // actually moved between two scroll positions. Without it the only way to
  // recognise a parallaxed element from outside is to look for the inline
  // transform GSAP writes — which is the shape of check this project has been
  // burned by eight times, confirming that a mechanism ran rather than that
  // anything moved.
  return <div ref={ref} data-parallax>{children}</div>;
}
