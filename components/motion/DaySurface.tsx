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
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
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
