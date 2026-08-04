"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** `rest` = never animated. `pending` = staged offscreen. `in` = settled. */
export type EnterState = "rest" | "pending" | "in";

/**
 * The one observer every entrance on the page goes through.
 *
 * The state machine is the fail-safe arrangement this project already relies
 * on, expressed without a tween library. The element renders at rest, so no
 * JavaScript and a thrown error both leave it visible. Only once script is
 * running, motion is wanted, and the element is confirmed **below the fold** is
 * it staged — and staging happens where nobody can see it. Anything already on
 * screen at mount stays `rest` forever, which is the fix for the flicker a
 * Playwright capture found on 4 Aug: settled text painting, then dropping out
 * of view and lifting back.
 *
 * Consumers write the returned `state` to a `data-enter` attribute; the CSS in
 * `app/globals.css` does the rest. Writing `data-enter="rest"` is as safe as
 * omitting the attribute — no rule under `[data-enter]` alone hides anything.
 *
 * **One usage rule.** The default `rootMargin` trims 12% off the bottom of the
 * viewport so an entrance fires when an element is meaningfully in view rather
 * than on its first pixel. That leaves a strip at the very foot of the page
 * with no scroll left to rescue it: an element shorter than 12vh and flush with
 * the document's bottom edge can be staged and never settle. Do not give an
 * entrance to a short, final element — a copyright line, a closing rule — or
 * pass it a `rootMargin` with no bottom trim.
 */
export function useInView<T extends HTMLElement>(options?: { rootMargin?: string }) {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<EnterState>("rest");

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    // Not a performance guard — a correctness one. Staging an element that is
    // already on screen means fading out something the visitor is looking at.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    // Old browsers get the page at rest rather than a page stuck at `pending`.
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("in");
            observer.disconnect();
            return;
          }
          // An observer always delivers a first callback, and for an element
          // already confirmed below the fold it reports "not intersecting" —
          // so this is where staging happens. Every state change living in the
          // callback is not only what `react-hooks/set-state-in-effect` asks
          // for; it means a late first callback (the visitor scrolled here
          // before the browser got round to us) reports `isIntersecting` and
          // settles the element outright, instead of staging something that is
          // already on screen and fading it out from under them.
          setState((current) => (current === "in" ? current : "pending"));
        }
      },
      { rootMargin: options?.rootMargin ?? "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.rootMargin]);

  return { ref, state };
}
