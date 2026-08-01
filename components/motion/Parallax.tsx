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
    const shift = el.offsetHeight * capped;

    const tween = gsap.fromTo(el, { y: -shift / 2 }, {
      y: shift / 2,
      ease: EASE.drift,
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [strength]);

  return <div ref={ref}>{children}</div>;
}
