"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Calls back each time the element **re-enters** the viewport, having left it.
 *
 * Separate from `useInView` on purpose. That hook drives thirty-seven entrances
 * and deliberately never un-stages anything — an entrance that replayed would be
 * a page that flickers as you scroll back up. This is additive, opt-in, and the
 * ink tiger is its only consumer: it stirs when you return to it, which is the
 * last phase of the state machine the original spec described.
 *
 * **It never fires on the first entry.** That arrival is the tiger being drawn,
 * which `InkStage` owns; a stir on top of it would restart the living phase
 * before the ink had finished.
 *
 * The latch matters as much as the observer. An `IntersectionObserver` can
 * deliver repeat callbacks for a still-visible element, and without `seen` every
 * one of them would restart the living phase — a tiger that never dozes, which is
 * exactly the permanent motion non-negotiable #5 forbids.
 */
export function useReenter<T extends HTMLElement>(onReenter: () => void) {
  const ref = useRef<T | null>(null);
  const seen = useRef(false);
  const latest = useRef(onReenter);

  /*
   * Kept fresh in an effect rather than assigned during render, which React's own
   * lint rule rejects. A ref rather than an effect dependency on purpose: putting
   * `onReenter` in the deps below would tear down and rebuild the observer
   * whenever the callback identity changed, and rebuilding it resets `seen` —
   * a tiger that forgets it ever left the screen.
   */
  useEffect(() => {
    latest.current = onReenter;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    // Old browsers get a tiger that simply stays drawn.
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          seen.current = true;
          continue;
        }
        if (seen.current) {
          seen.current = false;
          latest.current();
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
