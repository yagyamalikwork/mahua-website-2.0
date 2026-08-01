"use client";

import { useEffect } from "react";
import { LIGHT_STATES } from "@/lib/palette";
import { backgroundAt, segmentAt, textAt } from "@/lib/day-surface";

/**
 * The clock. One continuously bleeding surface driven by document scroll progress
 * (spec section 4.1). Writes CSS variables rather than re-rendering React, so the
 * colour update costs nothing on the main thread.
 */
export function DaySurface() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      const { from, to, t } = segmentAt(progress);
      const nearer = LIGHT_STATES[t < 0.5 ? from : to];

      root.style.setProperty("--bg", backgroundAt(progress));
      root.style.setProperty("--text", textAt(progress));
      root.style.setProperty("--accent", nearer.accent);
      root.style.setProperty("--accent-text", nearer.accentText);
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
