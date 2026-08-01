"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DURATION, EASE, REVEAL_FROM, prefersReducedMotion } from "@/lib/motion";

/** Things develop, they do not fly in (spec section 4.3, law 2). */
export function Reveal({
  children, delay = 0, slow = false,
}: { children: React.ReactNode; delay?: number; slow?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, scale: 1 });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.fromTo(el, { ...REVEAL_FROM }, {
      opacity: 1,
      scale: 1,
      delay,
      duration: slow ? DURATION.revealSlow : DURATION.reveal,
      ease: EASE.settle,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay, slow]);

  // Starts visible so the page is readable if JavaScript never runs.
  return <div ref={ref}>{children}</div>;
}
