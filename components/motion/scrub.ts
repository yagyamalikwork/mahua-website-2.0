"use client";

/**
 * The tween library, fetched only when something that scrubs is about to need it.
 *
 * **Entrances are CSS; scrubbing is GSAP.** After Plan 4 Task 2 the only work
 * left that GSAP is actually better at is mapping scroll position to a transform
 * continuously — `Parallax`, and the pinned collage after it. Everything that
 * simply arrives once and stops is a `transition` in `app/globals.css` driven by
 * `useInView`, and costs no library at all.
 *
 * Every scrubbed effect on this page is below the fold, so the library has no
 * business blocking first paint. The imports here are dynamic, which takes GSAP
 * and ScrollTrigger out of the set of scripts the document references — the
 * definition of first-load JS — and puts them in a chunk fetched later, or never
 * at all for a visitor who has asked for less motion.
 *
 * The promise is memoised, so ten `Parallax` mounts share one fetch and one
 * `registerPlugin`.
 *
 * Nothing here is imported statically anywhere. `components/motion/primitives.test.tsx`
 * checks that in both directions: no static import in any file, and a dynamic
 * one still present here — because deleting the import altogether would satisfy
 * a "no GSAP in the first load" rule by deleting the effect instead of deferring it.
 */

async function importScrubTools() {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}

export type ScrubTools = Awaited<ReturnType<typeof importScrubTools>>;

let pending: Promise<ScrubTools> | null = null;

/** The library, loaded once per page and shared by every scrubbed effect. */
export function loadScrubTools(): Promise<ScrubTools> {
  pending ??= importScrubTools();
  return pending;
}

/**
 * Run `then` once `el` is within a screen of the viewport, and never twice.
 *
 * A screen of margin, not zero, and the reason is correctness rather than
 * prefetching manners. ScrollTrigger sets a scrubbed element to the transform
 * its current scroll position implies the instant it is created — so a `Parallax`
 * initialised while it is on screen would visibly jump by up to half its
 * strength. Initialising it a screen early means that snap always happens where
 * nobody can see it, exactly as it does today when GSAP loads at hydration.
 *
 * With no `IntersectionObserver` there is no scrub, matching `useInView`'s
 * decision to leave the page at rest on a browser that has none. The still
 * state is the same one `prefers-reduced-motion` already gets, so the fallback
 * is a code path that is already exercised rather than a new one.
 *
 * Returns a function that stops the watch.
 */
export function whenNear(el: Element, then: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.disconnect();
        then();
        return;
      }
    },
    { rootMargin: "100% 0px 100% 0px" },
  );
  observer.observe(el);
  return () => observer.disconnect();
}
