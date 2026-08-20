"use client";

import { useEffect, useState } from "react";
import { CURTAIN_LINES, prefersReducedMotion } from "@/lib/motion";
import type { EnterState } from "./useInView";

/**
 * The entrance for the one element on the page that `useInView` will not touch:
 * a headline that is **already on screen when the page loads**.
 *
 * `useInView` returns `rest` forever for anything above the fold, and it is
 * right to — staging settled text means dropping it out of view in front of
 * somebody who is looking at it, which was measured as a real flicker on 4 Aug
 * 2026 and is why that guard exists. This hook does not weaken that rule; it
 * covers the one case where the premise is false. **The welcome screen is an
 * opaque cream curtain over the entire viewport for `WELCOME.hold`**, so during
 * that window nobody is looking at the hero, and the staging is unobservable
 * rather than merely quick.
 *
 * Client, 20 Aug 2026, having watched the page: *"the 3D effect on the section
 * where our website opens (The Journey Begins) … is not noticeable as it is on
 * the last section."* Measured before it was believed — the hero headline's
 * lines travel **0px**, because they are never staged at all. This is what makes
 * the effect exist there.
 *
 * ## Three properties, and all three are load-bearing
 *
 * 1. **It never stages late.** If hydration has not happened by
 *    `CURTAIN_LINES.stageBy` — a slow phone, a cold cache, a long main-thread
 *    task — the hook returns `rest` and the headline behaves exactly as it did
 *    before this file existed. The reveal is a thing that happens when it can
 *    happen invisibly, never a thing the visitor is shown mid-flight. That is
 *    the 4 Aug finding kept intact rather than argued with.
 * 2. **It costs LCP nothing, by construction rather than by luck.** The words
 *    are server-rendered at rest and painted at rest; this hook only moves them
 *    *after* hydration, by which point the browser has already recorded that
 *    paint. A CSS-only version — an `animation` with a backwards fill — would
 *    have been simpler and would have hidden the page's largest text for two
 *    seconds, which on a page whose LCP element is text every single time
 *    (CLAUDE.md non-negotiable #6) is straight onto the metric.
 * 3. **Reduced motion gets nothing**, checked here as well as in the CSS, for
 *    the same reason `useInView` checks it: the second line stops a stranded
 *    `pending` from ever being written, rather than relying on a rule to undo
 *    it.
 *
 * The staging itself is deferred by one frame rather than written in the effect
 * body. That is partly `react-hooks/set-state-in-effect`, and partly that the
 * browser must paint the staged state before the settled one is written or the
 * transition has nothing to run from — a frame is the cheapest guarantee of
 * that, and there is nearly half a second of curtain left to spend on it.
 */
export function useCurtainReveal(enabled: boolean): EnterState {
  const [state, setState] = useState<EnterState>("rest");

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;

    /*
     * **The curtain's own clock, not the document's, and the difference is
     * 380ms — most of the effect.**
     *
     * `performance.now()` counts from navigation; the welcome screen's fade is a
     * CSS animation that starts when the element is first painted, which was
     * measured at **382ms** on a local production build. Timed off
     * `performance.now()` the rise began at 1,964ms while the curtain was still
     * fully opaque and had **13px of its 108px left** by the time the curtain
     * cleared at 2,449ms — the whole movement spent behind the thing it was
     * meant to arrive out of. Traced frame by frame before it was believed.
     *
     * `Animation.currentTime` is the browser's own reading of how far into that
     * animation the page is, delay included, so both numbers in `CURTAIN_LINES`
     * mean exactly what their comments say they mean.
     *
     * **No curtain, no reveal.** That is the fail-safe rather than a special
     * case: this whole exception is licensed by something opaque covering the
     * viewport while the words are moved. On a page that does not mount the
     * welcome screen there is nothing hiding the staging, so the honest answer
     * is the one `useInView` already gives — leave it alone.
     */
    const curtain = document.querySelector("[data-welcome]");
    if (!curtain) return;
    const [fade] = curtain.getAnimations?.() ?? [];
    const elapsed = () =>
      typeof fade?.currentTime === "number" ? fade.currentTime : performance.now();

    if (elapsed() >= CURTAIN_LINES.stageBy * 1000) return;

    let settle: ReturnType<typeof setTimeout> | undefined;
    const stage = requestAnimationFrame(() => {
      setState("pending");
      settle = setTimeout(
        () => setState("in"),
        Math.max(0, CURTAIN_LINES.delay * 1000 - elapsed()),
      );
    });

    return () => {
      cancelAnimationFrame(stage);
      if (settle !== undefined) clearTimeout(settle);
    };
  }, [enabled]);

  return state;
}
