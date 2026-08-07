"use client";

import { useCallback, useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * A client-supplied animated illustration, as ten seconds of film that plays once
 * and settles.
 *
 * Two of them ship: the tiger at the foot of `04 · Days in the Field`, and the
 * potter closing `02 · Rooted like the mahua`. Both are drawn on white, both run
 * ten seconds, and both begin and end on the same pose — so the behaviour below
 * is written once rather than twice.
 *
 * ## It plays once. It never loops.
 *
 * Non-negotiable #5: the tiger arrives, performs, then dozes. A ten-second loop
 * running for as long as a visitor is on this part of the page is exactly the
 * permanent peripheral motion that rules out — and it decodes video the whole
 * time, on a page whose audience is mostly Indian mobile.
 *
 * The clip begins and ends on the same settled pose, so stopping on the final
 * frame looks deliberate rather than truncated.
 *
 * ## Hover replays it, but only once it has finished
 *
 * A deliberate hover is the visitor asking, which is a different thing from
 * motion happening at them. Two guards keep it from becoming a loop by other
 * means: it is ignored while the film is still playing, and the pointer must
 * **leave and return** before it can fire again. Without the second, a cursor
 * parked on the tiger would retrigger it forever.
 *
 * Touch devices have no hover and lose nothing — the film still plays once when
 * it is scrolled to.
 *
 * ## The still is an `<img loading="lazy">`, not a `poster` attribute
 *
 * **Because a `poster` is fetched immediately, however far down the page it is.**
 * `preload="none"` defers the video and does nothing for its poster, and there is
 * no lazy equivalent for one. Measured on 7 Aug 2026: the two films' posters —
 * `tiger-film-poster.webp` at 56 KB and `potter-film-poster.webp` at 47 KB — were
 * both fetched at ~28 ms at 390 and at 1440, ahead of the first screen's own
 * imagery, for two chapters a visitor has to scroll past several screens to
 * reach. **103 KB of roughly 460 KB of first-screen bytes**, on a page whose hero
 * is bandwidth-bound and misses its 2.5s budget by ~1,400 ms, and a larger lever
 * than anything measured in Plan 4 Task 6.
 *
 * So the still is a real image, layered under the film, and `loading="lazy"` does
 * the deferring — natively, with no JavaScript involved, which is what makes this
 * better than moving the fetch into the observer below rather than merely later.
 *
 * It is the element **in flow**, and the film is absolutely positioned over it, so
 * the box is the still's own intrinsic size and cannot collapse while a video
 * with no poster and `preload="none"` reports nothing to lay out.
 *
 * **It hides the moment the film paints, and that is not cosmetic.** Both carry
 * `mix-blend-mode: darken`; leaving the still beneath a playing film would blend
 * the two, ghosting a motionless tiger through the moving one wherever the film
 * is the lighter of the two. `visibility` rather than `display`, so the box keeps
 * its height. It comes back if the film errors.
 *
 * ## Fail-safes
 *
 * - **No JavaScript**: the still shows, lazily, exactly as it does with script.
 *   A still tiger, never a broken box.
 * - **A failed chunk**: the same. Nothing about the still depends on this
 *   component's own JavaScript having run.
 * - **Reduced motion**: the still, and nothing plays — not on scroll, not on
 *   hover. Consistent with every other decoration on this page.
 * - `preload="none"` so the ~650 KB costs nothing until it is scrolled to.
 *
 * ## The white background
 *
 * The film is drawn on white and blended with `mix-blend-mode: darken`, so every
 * pixel lighter than the page's cream is replaced by the cream and the rectangle
 * disappears. Measured across frames, the palest ink in the artwork sits at 242
 * against a cream of 233 — nine levels of margin, which is what makes this
 * survive video compression, where a background matched exactly would not.
 */
export function SignatureFilm({ src, poster, width, height, className }: {
  /** The encoded MP4, under `public/media/`. */
  src: string;
  /** Its final frame, shown before it plays and wherever it never will. */
  poster: string;
  width: number;
  height: number;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const still = useRef<HTMLImageElement>(null);
  /** True once the film has run to its end and is holding the last frame. */
  const finished = useRef(false);
  /** The pointer must leave before a hover can replay it. */
  const armed = useRef(true);

  /**
   * Swap between the still and the film. Exactly one of them is ever visible.
   *
   * **The film starts hidden, and that is a portability guard rather than a
   * nicety.** A `<video>` with `preload="none"` and no `poster` has no frame to
   * paint, and what a browser puts there instead is not specified — transparent
   * in Chrome, but browsers have historically painted an opaque black box. Under
   * `mix-blend-mode: darken` a black box is the worst possible value: it wins
   * every channel and blacks out the whole frame. Never showing the film until it
   * reports frames removes the question.
   *
   * `visibility` rather than `display`, so the box keeps its height either way.
   */
  const showFilm = useCallback((filmReady: boolean) => {
    if (still.current) still.current.style.visibility = filmReady ? "hidden" : "";
    if (ref.current) ref.current.style.visibility = filmReady ? "" : "hidden";
  }, []);

  const play = useCallback(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    finished.current = false;
    el.currentTime = 0;
    // Autoplay can be refused; a rejected promise here is not an error worth
    // surfacing, it just means the visitor keeps the poster.
    void el.play().catch(() => {});
  }, []);

  useEffect(() => {
    // The still, not the film: the film is `visibility: hidden` until it has
    // frames, and an observer is a poor place to depend on whether a hidden
    // element still reports geometry.
    const el = still.current;
    if (!el || prefersReducedMotion()) return;
    if (typeof IntersectionObserver === "undefined") return;

    // Plays the first time it is meaningfully on screen, and only then — the
    // same 12% trim the page's entrances use, so it does not fire on a sliver.
    let played = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !played) {
            played = true;
            play();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [play]);

  const onEnded = () => {
    finished.current = true;
    const el = ref.current;
    // Hold the last frame rather than snapping back to the first. `loop` is
    // deliberately absent, so this is only belt and braces against a browser that
    // rewinds on end.
    if (el) el.currentTime = el.duration;
  };

  return (
    /*
     * `relative` and nothing else. Deliberately **not** `isolate`: both children
     * blend with the page's cream, and isolating them would blend them with this
     * wrapper's transparent backdrop instead, which paints the white ground back.
     */
    <span className={`relative ${className ?? ""}`} data-signature-film-frame>
      {/*
       * The still, in flow, so the box has a height before any video does.
       *
       * A plain `<img>`, not `next/image`: this is a fixed-size decorative frame
       * with one source and no art direction, and the loader would wrap it in a
       * span of its own that the film would then have to be positioned against.
       * Same call as the leaf cursor, the emblem and the lantern.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={still}
        src={poster}
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="block h-auto w-full"
        style={{ mixBlendMode: "darken" }}
      />
      <video
        ref={ref}
        /*
         * `data-hoverable` is what the leaf cursor watches for, so the leaf warms
         * to gold over the tiger exactly as it does over a link. That is the
         * page's existing signal for "this answers you", and it is what makes the
         * hover discoverable rather than hidden. It sits on the film because the
         * film is the element on top and so the one a pointer meets.
         */
        data-hoverable
        data-signature-film
        aria-hidden="true"
        muted
        playsInline
        preload="none"
        width={width}
        height={height}
        onPlaying={() => showFilm(true)}
        onEnded={onEnded}
        onError={() => showFilm(false)}
        onPointerEnter={() => {
          if (!armed.current || !finished.current || prefersReducedMotion()) return;
          armed.current = false;
          play();
        }}
        onPointerLeave={() => {
          armed.current = true;
        }}
        className="absolute inset-0 block h-full w-full"
        style={{
          // Erases the film's white ground against the page's cream. See the note
          // above for why this beats matching the cream in the render.
          mixBlendMode: "darken",
          // Server-rendered hidden, and only script may reveal it — the same
          // discipline as the pinned collage and the leaf cursor's `cursor: none`.
          // See `showFilm`.
          visibility: "hidden",
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </span>
  );
}
