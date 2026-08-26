"use client";

import { useEffect, useRef } from "react";
import { ELFSIGHT_SCRIPT } from "@/lib/elfsight";

/**
 * How far ahead of the viewport the platform starts loading.
 *
 * **600px was reasoning in a doc comment, never measured, and a whole-branch
 * review found the failure it produced: the widget's own screenshots showed
 * two lodge pills and then only the "Free Tripadvisor Reviews Widget" badge —
 * zero review cards — at 390, 768 and 1440px
 * (`docs/reviews/2026-08-26-restructure/shots-task9/w1440-06-invitation.webp`).
 * That is the worst available failure state: the vendor's own advertising
 * paints and the client's reviews do not.**
 *
 * **Measured 27 Aug 2026** (`docs/reviews/2026-08-26-restructure/margin-sweep.md`
 * has the full sweep table and method): 600, 1200, 2000px and a
 * viewport-relative `100%` were each tried under Slow 4G + 4x CPU throttle,
 * at two scroll paces — this project's own already-committed "whole page
 * scrolled" pace (`scripts/measure_page.mjs`'s `scrollWholePage`, ~3.1s top
 * to bottom) and a slower, attentive-reader pace closer to how this page is
 * actually meant to be read (~27s top to bottom). **At the reading pace,
 * 600px still left the cards rendering ~1.0s after arrival; 1200px and
 * 2000px both rendered essentially exactly by arrival (≈4ms lag).** 1200px
 * is the smallest of the candidates that closed the gap, so it is what
 * shipped — not the largest one tried, and not a round number picked without
 * sweeping past it.
 *
 * **This does not make the widget appear instantly for every visitor, and
 * that is recorded rather than hidden.** At the FAST pace above, even 2000px
 * still lagged arrival by ~3.1s: the vendor's own fetch-and-render chain
 * (four sequential round-trips behind a 533 KB bundle,
 * `docs/reviews/2026-08-26-restructure/widget-network-cost.md`) takes longer
 * than that pace's entire top-to-bottom scroll, and no `rootMargin` can pull
 * a trigger earlier than the page finishing its own load. Widening the
 * margin further buys diminishing lead time and starts spending bytes on
 * visitors who never reach the foot of the page — see
 * `ReviewWidget`'s own doc comment for the `<link rel="preconnect">` that
 * now also ships alongside this, which shortens the round-trips themselves
 * rather than guessing the runway.
 */
const APPROACH_MARGIN = "1200px";

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
