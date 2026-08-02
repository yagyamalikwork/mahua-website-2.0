"use client";

import { useEffect } from "react";
import { surfaceAt } from "@/lib/day-surface";

/**
 * The clock. One continuously bleeding surface driven by document scroll progress
 * (spec section 4.1). Writes CSS variables rather than re-rendering React, so the
 * colour update costs nothing on the main thread.
 *
 * A pure applicator: all colour derivation (which text, which accent, contrast
 * floors during the light/dark crossings) lives in `surfaceAt` — this component
 * imports no palette internals and re-derives none of that logic itself, so it
 * cannot drift out of sync with it.
 */
export function DaySurface() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      // `lib/timeline.ts`'s stops are fractions of *content* height
      // (cumulativeWeight / totalWeight, i.e. offsetTop / scrollHeight) — not
      // fractions of *scrollable distance* (scrollY / (scrollHeight -
      // innerHeight)). Those two denominators differ by exactly one viewport,
      // so reporting scrollY/scrollable systematically over-reads progress by
      // up to a viewport's worth of content near the bottom of the page. What
      // the band layout actually means by "progress" is "which part of the
      // document is in the middle of the screen" — the viewport's vertical
      // centre, expressed as a fraction of total content height. See the
      // task-7 report for the empirical proof this lands on dawn at scrollY 0
      // and night at max scroll despite never reaching exactly 0 or 1.
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const progress =
        scrollable > 0
          ? (window.scrollY + window.innerHeight / 2) / document.body.scrollHeight
          : 0;
      const surface = surfaceAt(progress);

      root.style.setProperty("--bg", surface.bg);
      root.style.setProperty("--text", surface.text);
      root.style.setProperty("--accent", surface.accent);
      root.style.setProperty("--accent-text", surface.accentText);
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        apply();
        queued = false;
      });
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
