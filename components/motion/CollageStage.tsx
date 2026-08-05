"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EASE, PARALLAX_MAX, prefersReducedMotion } from "@/lib/motion";
import { loadScrubTools, whenNear } from "./scrub";

/**
 * The one decision behind the pinned collage — *is the pin on?* — and the scrub
 * that only means anything once it is.
 *
 * It takes two finished compositions and picks between them. Both are built by
 * `PinnedCollage` on the server and handed here as props, which is not a
 * stylistic choice: this file is a client module, so anything it *imports*
 * lands in the browser bundle, and the pinned scene's `<Photo>` would drag
 * `lib/media-manifest.ts` — thirty-four entries, each with a base64 blur URI —
 * across the boundary with it. Passed as rendered children, the manifest stays
 * on the server where it already was. See `docs/reviews/2026-08-05-scroll-craft/`
 * for the byte count either way.
 *
 * ## The pin is server-rendered *off*, and only script may switch it on
 *
 * `StickyScene` is the one construct on this page that sizes a section from a
 * number rather than from its content, and a pin whose contents do not move is
 * two paid-for empty screens (see the note on `StickyScene`). Nothing moves
 * without JavaScript, so nothing may be pinned without it either: the server
 * snapshot is always `false`, so the markup a visitor gets before hydration —
 * and everything a visitor with JavaScript disabled will ever get — is the
 * ordinary flowing composition, reserving no scroll at all.
 *
 * The same switch is off for three more reasons, each of which would otherwise
 * cost a visitor screens of nothing:
 *
 *   - **reduced motion.** Not merely "the photographs hold still": the pin and
 *     the 2 screens of scroll it reserves both disappear, because a visitor who
 *     asked for less motion must not have to travel through empty screens to
 *     reach the next chapter. `app/globals.css` says the same thing a second
 *     time for `.sticky-scene` itself; this is the first line, and it is the one
 *     that also stops GSAP being fetched.
 *   - **no `IntersectionObserver`.** `whenNear` is how the tween library is
 *     fetched at all, and it declines on a browser without one — so the pin
 *     would hold a still composition for three screens. Same still state as
 *     reduced motion, which is a code path already exercised rather than a new
 *     one.
 *   - **the tween library never arriving.** A flaky connection, a blocked CDN,
 *     an aborted fetch on a slow phone — and `scrub.ts` memoises the rejected
 *     promise, so there is no second attempt for the rest of the visit. A pin
 *     that survives that is 1.9 screens of a composition in which nothing
 *     whatsoever moves, which is the paid-for empty screen this whole task
 *     exists to earn its way out of. So the failure un-pins, landing on the same
 *     still composition reduced motion and no-JS already produce. **A `catch`
 *     that only logged was the Important finding on this task's review**, and
 *     the state is checked by aborting both GSAP chunks at the network in
 *     `scripts/check_pinned_collage.mjs` and reading the section's height back —
 *     not by asserting that a catch block ran.
 *   - **a viewport the frozen composition does not fit.** The scene is exactly
 *     100vh and does not scroll inside itself; a chapter that overflows its own
 *     pin would paint over the chapter beneath it. `PIN_QUERY` is the measured
 *     floor at which the headline, the three paragraphs and both flanks fit one
 *     screen with room to spare — below it the page keeps the composition it has
 *     today, which is a good one.
 *
 * `useSyncExternalStore` rather than `useState` in an effect: it is the one hook
 * that can answer "false while rendering on the server, true once the browser
 * has looked" without either a hydration mismatch or a `setState` in an effect
 * body, and subscribing to the two media queries means a visitor who turns
 * reduced motion on, or drags the window narrow, loses the pin at once rather
 * than at the next navigation.
 */

/**
 * The viewport at which the frozen composition fits one screen.
 *
 * Measured, not guessed. At 1440x900 the centre column sets the chapter mark,
 * a two-line headline, the rule and all three paragraphs in ~765px, leaving
 * ~135px of slack; at 1280 the same copy needs ~910px because the centre column
 * is 350px wide and the headline wraps to three lines. So the floor is 1440,
 * not 1280. The height floor is what stops a short landscape window pinning a
 * scene taller than itself.
 */
export const PIN_QUERY = "(min-width: 1440px) and (min-height: 860px)";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Off on the server, and off during hydration, always. */
function neverOnTheServer(): boolean {
  return false;
}

function pinWanted(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  // No observer, no `whenNear`, no tween library, nothing to advance through the
  // pin. See `components/motion/scrub.ts`.
  if (typeof IntersectionObserver === "undefined") return false;
  if (prefersReducedMotion()) return false;
  return window.matchMedia(PIN_QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const lists = [window.matchMedia(PIN_QUERY), window.matchMedia(REDUCED_MOTION_QUERY)];
  for (const list of lists) list.addEventListener?.("change", onChange);
  return () => {
    for (const list of lists) list.removeEventListener?.("change", onChange);
  };
}

export function CollageStage({
  children,
  flowing,
}: {
  /** The pinned scene. Rendered only when the pin is on. */
  children: React.ReactNode;
  /** The same chapter, unpinned. Rendered on the server and everywhere else. */
  flowing: React.ReactNode;
}) {
  const wantsPin = useSyncExternalStore(subscribe, pinWanted, neverOnTheServer);
  /**
   * Sticky, and deliberately one-way. `loadScrubTools` memoises its promise, so
   * once the chunk has failed it has failed for the rest of the visit — there is
   * nothing to retry and no state worth returning to.
   */
  const [scrubFailed, setScrubFailed] = useState(false);
  const pinned = wantsPin && !scrubFailed;
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = host.current;
    if (!root || !pinned) return;

    const scene = root.querySelector<HTMLElement>(".sticky-scene");
    const drifters = [...root.querySelectorAll<HTMLElement>("[data-drift]")];
    if (!scene || drifters.length === 0) return;

    let unmounted = false;
    let killTweens = () => {};

    // A screen early, so the snap ScrollTrigger applies when it creates a
    // scrubbed tween happens where nobody can see it — the same reason
    // `Parallax` waits, spelled out in `scrub.ts`.
    const stopWatching = whenNear(scene, () => {
      loadScrubTools()
        .then(({ gsap }) => {
          // The chunk can land after the component has gone.
          if (unmounted) return;

          /**
           * Half the distance this photograph travels across the whole pin.
           *
           * The basis is the scroll the pin *reserves* — the scene's height less
           * one screen — and not each photograph's own height, which is what
           * `Parallax` uses. That is the difference between a collage and ten
           * unrelated drifts: one scroll distance, three multipliers, so the
           * photographs read as three depths of the same movement rather than as
           * three elements each doing their own thing at a rate that happens to
           * depend on how tall they are.
           *
           * A function, not a number, and paired with `invalidateOnRefresh`, so
           * a resize re-measures rather than animating against the height the
           * scene had when the tween was built.
           */
          const half = (rate: number) =>
            (Math.max(scene.offsetHeight - window.innerHeight, 0) * rate) / 2;

          const tweens = drifters.map((el) => {
            // Re-clamped here as well as at the call site. The attribute is the
            // measurement hook the browser rig reads, so it is also the value a
            // future edit is most likely to change without looking at the cap.
            const rate = Math.min(Math.abs(Number(el.dataset.drift) || 0), PARALLAX_MAX);
            return gsap.fromTo(
              el,
              { y: () => half(rate) },
              {
                y: () => -half(rate),
                ease: EASE.drift,
                scrollTrigger: {
                  // The pinned band exactly: from the scroll position where the
                  // scene's top reaches the top of the screen (which is where
                  // `position: sticky` takes hold) to the one where its bottom
                  // reaches the bottom (where sticky lets go).
                  trigger: scene,
                  start: "top top",
                  end: "bottom bottom",
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              },
            );
          });

          killTweens = () => {
            for (const tween of tweens) {
              tween.scrollTrigger?.kill();
              tween.kill();
            }
            // Leave the photographs where the layout puts them, not where the
            // scrub last had them.
            gsap.set(drifters, { clearProps: "transform" });
          };
        })
        // A chunk that never arrives takes the pin with it. Anything thrown
        // while building the tweens lands here too, and means the same thing:
        // nothing is going to advance through this pin, so the scroll it
        // reserves is not earned and must be given back.
        //
        // The state change is inside the callback rather than in the effect
        // body, which is what `react-hooks/set-state-in-effect` asks for and
        // also simply where it belongs — this is a failure arriving, not a
        // decision the effect could have made when it ran.
        .catch(() => {
          if (!unmounted) setScrubFailed(true);
        });
    });

    return () => {
      unmounted = true;
      stopWatching();
      killTweens();
    };
  }, [pinned]);

  if (!pinned) return <>{flowing}</>;

  return <div ref={host}>{children}</div>;
}
