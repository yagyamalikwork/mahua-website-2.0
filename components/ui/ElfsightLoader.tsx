"use client";

import { useEffect, useRef } from "react";
import { ELFSIGHT_SCRIPT } from "@/lib/elfsight";

/**
 * How far ahead of the viewport the platform starts loading.
 *
 * Far enough that the widget has drawn by the time a visitor arrives at it, and
 * near enough that most visitors who never reach the foot of the page never pay
 * for it. 600px is roughly two-thirds of a laptop screen — one unhurried scroll
 * gesture's worth of warning on the page this sits at the bottom of.
 */
const APPROACH_MARGIN = "600px";

/**
 * Loads Elfsight's platform when the visitor comes near it, and not before.
 *
 * **This exists because `data-elfsight-app-lazy` does not defer the platform
 * script.** Measured 26 August 2026: 588 KB over 9 requests, fetched on `load`,
 * with the widget in the page's LAST chapter. `tripadvisorReviews.js` alone is
 * 533 KB — three times this whole site's own first-load JavaScript. It took
 * desktop initial transfer to 1,554 KB against non-negotiable #6's 1,500 KB
 * ceiling, and the hero's arrival from 4,616 ms to 5,377 ms.
 * `docs/reviews/2026-08-26-restructure/widget-network-cost.md` has the working.
 *
 * **Neither committed rig can see any of that**, and that is a property of the
 * platform rather than a bug: both read `PerformanceResourceTiming.transferSize`,
 * which is reported as 0 for a cross-origin response with no
 * `Timing-Allow-Origin` header, and Elfsight sends none. Both said PASS at
 * byte-identical figures with and without the widget mounted. **Do not "fix"
 * them to guess.** A guessed number is worse than a known gap; the CDP probe in
 * that evidence file is what can actually see this.
 *
 * ## Why this is allowed to be a client component when almost nothing here is
 *
 * It trades a few hundred bytes of our own JavaScript for 588 KB of somebody
 * else's, and the trade was measured in both directions rather than assumed.
 *
 * ## The guard is the DOM, not a module flag
 *
 * Two widgets on one page — which is exactly what the property pages will have
 * once `04 · Written About` lands — must load the platform once. The check is
 * for an existing `script[src]` in the document rather than a module-level
 * boolean, because a module flag is per-bundle state and the DOM is the thing
 * that actually decides whether a second request goes out.
 *
 * ## With no JavaScript, nothing here runs and nothing here breaks
 *
 * `ReviewWidget` renders its mount and its `<noscript>` line server-side; this
 * component contributes nothing to that markup. A visitor with script off sees
 * the fallback, exactly as they did before this existed.
 */
export function ElfsightLoader() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    if (document.querySelector(`script[src="${ELFSIGHT_SCRIPT}"]`)) return;

    const load = () => {
      if (document.querySelector(`script[src="${ELFSIGHT_SCRIPT}"]`)) return;
      const script = document.createElement("script");
      script.src = ELFSIGHT_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    };

    // No IntersectionObserver — a browser old enough to lack it is a browser we
    // would rather serve the reviews to slowly than not at all.
    if (typeof IntersectionObserver === "undefined") {
      load();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load();
      },
      { rootMargin: APPROACH_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <span ref={anchor} aria-hidden="true" />;
}
