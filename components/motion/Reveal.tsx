"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DURATION, EASE, REVEAL_FROM, prefersReducedMotion } from "@/lib/motion";

/** Things develop, they do not fly in (spec section 4.3, law 2). */
export function Reveal({
  children, delay = 0, slow = false, static: skipTween = false,
}: { children: React.ReactNode; delay?: number; slow?: boolean; static?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // "If an effect cannot hit budget, the effect loses" (LCP budget, spec
    // section 11). Content that is on screen at first paint has no tween to
    // hide behind — Lighthouse's LCP timer waits for the *final* frame of the
    // fade, so animating it in is a straight tax on the metric. `static`
    // renders fully opaque from the first paint onward and never touches GSAP,
    // so it cannot cost a single millisecond of render delay. Below-the-fold
    // content keeps the fade untouched — nobody scrolling to it pays an LCP
    // price for it.
    if (skipTween) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, scale: 1 });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // GSAP's fromTo applies its "from" state the moment the ScrollTrigger is
    // created. Anything already on screen would therefore snap to invisible on
    // hydration and sit there until the visitor scrolls. Reveal it now instead;
    // only below-the-fold content waits for its trigger.
    const onScreenAtMount = el.getBoundingClientRect().top < window.innerHeight;

    const tween = gsap.fromTo(
      el,
      { ...REVEAL_FROM },
      {
        opacity: 1,
        scale: 1,
        delay,
        duration: slow ? DURATION.revealSlow : DURATION.reveal,
        ease: EASE.settle,
        ...(onScreenAtMount
          ? {}
          : { scrollTrigger: { trigger: el, start: "top 85%", once: true } }),
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay, slow, skipTween]);

  // Starts visible so the page is readable if JavaScript never runs.
  return <div ref={ref}>{children}</div>;
}
