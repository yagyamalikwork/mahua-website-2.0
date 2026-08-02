"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, PARALLAX_MAX, prefersReducedMotion } from "@/lib/motion";

/** Depth, not movement. Strength is hard-clamped (spec section 4.3, law 3). */
export function Parallax({
  children, strength = PARALLAX_MAX,
}: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);

    const capped = Math.min(Math.abs(strength), PARALLAX_MAX);

    // Function-based values + invalidateOnRefresh: GSAP re-evaluates these on
    // every ScrollTrigger refresh, so a resize or reflow re-measures the height
    // instead of animating against the height the element had at mount.
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
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [strength]);

  return <div ref={ref}>{children}</div>;
}
