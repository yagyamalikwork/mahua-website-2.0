"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DURATION, EASE, IMAGE_FROM, prefersReducedMotion } from "@/lib/motion";

/**
 * A photograph arriving: a mask wipes upward off it while the image itself
 * settles from slightly oversize down to rest.
 *
 * Same fail-safe arrangement as `SplitLines` — the mask is collapsed to nothing
 * in the server-rendered markup, so with no JavaScript the photograph is simply
 * there. Script only ever raises the mask in order to lower it again.
 *
 * `static` opts a photograph out entirely, for the one above the fold: the hero
 * image is the LCP element, and Lighthouse stops its timer on the *final* frame
 * of any animation applied to it. A 1.2s mask on the hero is 1.2s straight onto
 * the metric, and budgets beat effects (CLAUDE.md non-negotiable #6).
 */
export function ImageReveal({
  children,
  className,
  delay = 0,
  static: skipTween = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  static?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || skipTween) return;
    const inner = el.querySelector<HTMLElement>("[data-image-inner]");
    const mask = el.querySelector<HTMLElement>("[data-image-mask]");
    if (!inner || !mask) return;

    if (prefersReducedMotion()) {
      gsap.set([inner, mask], { clearProps: "transform" });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const onScreenAtMount = el.getBoundingClientRect().top < window.innerHeight;
    const trigger = onScreenAtMount
      ? {}
      : { scrollTrigger: { trigger: el, start: "top 85%", once: true } };

    const tl = gsap.timeline({ delay, ...trigger });
    // Origin top: the mask's lower edge rises, uncovering the photograph from
    // the bottom up.
    tl.fromTo(
      mask,
      { scaleY: 1, transformOrigin: "top" },
      { scaleY: 0, duration: DURATION.imageMask, ease: EASE.settle },
      0,
    ).fromTo(
      inner,
      { ...IMAGE_FROM },
      { scale: 1, duration: DURATION.revealSlow, ease: EASE.settle },
      0,
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set([inner, mask], { clearProps: "transform" });
    };
  }, [delay, skipTween]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`}>
      <div data-image-inner className="h-full w-full">
        {children}
      </div>
      {/* Collapsed at rest, so no-JS shows the photograph and not a cream panel. */}
      <div
        data-image-mask
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scale-y-0 origin-top bg-[var(--bg)]"
      />
    </div>
  );
}
