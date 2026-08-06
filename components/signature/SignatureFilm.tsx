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
 * ## Fail-safes
 *
 * - **No JavaScript**: the `poster` shows. A still tiger, never a broken box.
 * - **Reduced motion**: the poster, and nothing plays — not on scroll, not on
 *   hover. Consistent with every other decoration on this page.
 * - `preload="none"` so the 616 KB costs nothing until it is scrolled to.
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
  /** True once the film has run to its end and is holding the last frame. */
  const finished = useRef(false);
  /** The pointer must leave before a hover can replay it. */
  const armed = useRef(true);

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
    const el = ref.current;
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
    <video
      ref={ref}
      /*
       * `data-hoverable` is what the leaf cursor watches for, so the leaf warms to
       * gold over the tiger exactly as it does over a link. That is the page's
       * existing signal for "this answers you", and it is what makes the hover
       * discoverable rather than hidden.
       */
      data-hoverable
      data-signature-film
      aria-hidden="true"
      muted
      playsInline
      preload="none"
      poster={poster}
      width={width}
      height={height}
      onEnded={onEnded}
      onPointerEnter={() => {
        if (!armed.current || !finished.current || prefersReducedMotion()) return;
        armed.current = false;
        play();
      }}
      onPointerLeave={() => {
        armed.current = true;
      }}
      className={className}
      style={{
        // Erases the film's white ground against the page's cream. See the note
        // above for why this beats matching the cream in the render.
        mixBlendMode: "darken",
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
