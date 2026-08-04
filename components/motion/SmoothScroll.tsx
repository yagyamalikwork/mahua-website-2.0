"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Freeze and unfreeze the page. Anything that covers the viewport — the chapter
 * menu today — asks for this rather than reaching for CSS itself.
 *
 * It exists because **`overflow: hidden` is not a scroll lock on this page.**
 * Lenis intercepts the wheel and scrolls programmatically, and no CSS rule can
 * stop a script calling `scrollTo`. Setting `overflow: hidden` on `<html>` blocked
 * the keyboard and nothing else: with the menu open at 1440 the hidden page still
 * travelled ~1,485px on the wheel, and dismissing the menu returned the visitor to
 * a position they never chose. Only the component that owns scrolling can stop it,
 * so the lock lives here.
 */
export type ScrollControl = {
  lock: () => void;
  unlock: () => void;
};

const ScrollControlContext = createContext<ScrollControl | null>(null);

/** Null when rendered outside `SmoothScroll`; callers must cope. */
export function useScrollControl(): ScrollControl | null {
  return useContext(ScrollControlContext);
}

/**
 * Gives the page a little mass, so it reads as something with weight rather than a
 * document snapping between positions (spec section 4.3).
 *
 * Skipped entirely under prefers-reduced-motion: hijacked scrolling is itself motion,
 * and some visitors disable it for vestibular reasons. `lock`/`unlock` still work in
 * that case — there is no Lenis to stop, and the CSS rule alone *is* a real lock
 * there, precisely because native scrolling is what is running.
 *
 * **This component is in `app/layout.tsx`, so everything it imports is first-load
 * JS.** It used to import GSAP for two things: `gsap.ticker` to drive Lenis's
 * frame loop, and `lenis.on("scroll", ScrollTrigger.update)` to sync the two.
 * The first is a `requestAnimationFrame` — GSAP's ticker is one too. The second
 * is unnecessary because Lenis scrolls the real document, so the browser emits
 * ordinary `scroll` events and ScrollTrigger's own listener already sees them;
 * the recipe exists to save ScrollTrigger a frame, and a frame is not visible on
 * a drift capped at 15%. Between them they were putting 115 KB of tween library
 * in front of first paint for a page whose every scrubbed effect is below the
 * fold. GSAP now loads from `components/motion/scrub.ts`, on demand.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const previousOverflow = useRef<string | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenisRef.current = lenis;

    // `requestAnimationFrame` hands milliseconds, which is the unit `raf` wants.
    // GSAP's ticker handed seconds, hence the `* 1000` that used to be here.
    let frame = requestAnimationFrame(function tick(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Stable across renders, and reads the ref at call time so it is correct
  // whether it is called before or after the effect above has run.
  const control = useMemo<ScrollControl>(
    () => ({
      lock() {
        // The belt: stops the wheel, which is the only input Lenis is listening to.
        lenisRef.current?.stop();
        // The braces: covers the keyboard, and is the whole lock when Lenis is not
        // running — reduced motion, or before hydration.
        previousOverflow.current = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";
      },
      unlock() {
        document.documentElement.style.overflow = previousOverflow.current ?? "";
        previousOverflow.current = null;
        // Restarting matters as much as stopping. A page left with Lenis stopped
        // still scrolls by keyboard but not by wheel, which is worse than no lock
        // at all, and nothing on screen would say why.
        lenisRef.current?.start();
      },
    }),
    [],
  );

  return <ScrollControlContext.Provider value={control}>{children}</ScrollControlContext.Provider>;
}
