"use client";

import { useEffect, useRef } from "react";
import { LEAF } from "@/lib/leaf-art";
import { CURSOR } from "@/lib/motion";

/**
 * The client's hand-drawn mahua leaf, hanging from the pointer in place of the
 * arrow.
 *
 * ## The three things that make it a leaf and not a sticker
 *
 * 1. **The leaf's tip is the pointer.** `LEAF.hotspot` is the apex, measured from
 *    the artwork's own ink by `scripts/build_leaf.mjs`, and the image is offset by
 *    that fraction so the tip lands exactly where a click would — the same
 *    arrangement an arrow cursor has, where the point is the hotspot and the body
 *    trails behind it.
 * 2. **It lags, and the lag dies.** Position eases by `CURSOR.follow` of the
 *    remaining distance each frame, so the leaf trails while the hand moves and is
 *    on the point within a few frames of it stopping. The trail is clamped to
 *    `CURSOR.maxLagPx`, because this is the *only* visible cursor and it may not
 *    sit further than that from where a click would land.
 * 3. **The angle carries its own inertia**, easing at the slower `CURSOR.swing`,
 *    so the blade swings behind the direction of travel and settles without
 *    overshooting. It rotates about the tip, so the body swings beneath the
 *    pointer like something hanging from it. That weave is the whole difference
 *    between a leaf and a sticker, and it is what the client asked to keep when
 *    the artwork changed.
 *
 * ## Why none of this touches React state
 *
 * Pointer moves arrive faster than 60Hz. A `setState` per move would re-render
 * hundreds of times a second and make the page's own scroll animations stutter.
 * Everything lives in refs and one `requestAnimationFrame` loop writing
 * `el.style.transform` directly. React renders this once.
 *
 * **The loop stops itself.** Once the leaf has arrived and stopped swinging it
 * schedules no further frame, and the next `pointermove` starts it again. A
 * decorative loop running forever is invisible on a desktop and a real cost on a
 * laptop battery, and nothing about the page looks different when it regresses —
 * which is why `scripts/check_leaf_cursor.mjs` counts frames rather than trusting
 * this comment.
 *
 * ## Safety
 *
 * `cursor: none` is set **by this component, after it has mounted and painted**,
 * and never in server-rendered CSS. If this chunk fails to load or throws, the
 * visitor keeps their arrow. Same discipline as the pinned collage being
 * server-rendered off: script may take something away only once it has proved it
 * can put something back.
 *
 * `transform` is written directly and this element carries no Tailwind utility at
 * all — no `scale-*`, no `translate-*` — so there is nothing for it to compose
 * with. See the note above the image rules in `app/globals.css` for what happens
 * when that is not true.
 */
export function LeafCursor() {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target = { x: -200, y: -200 };
    const at = { x: -200, y: -200 };
    let angle = 0;
    let angleTo = 0;
    let scale = 1;
    let scaleTo = 1;
    let frame = 0;
    let seen = false;

    // The tip sits at the pointer, so the image is drawn up and left by wherever
    // the tip is inside its own box. Read once — it cannot change without a
    // reload, and it is a fraction of a size this component fixes.
    const offsetX = LEAF.hotspot.x * LEAF.drawnWidth;
    const offsetY = LEAF.hotspot.y * CURSOR.sizePx;

    const draw = () => {
      el.style.transform =
        `translate3d(${(at.x - offsetX).toFixed(2)}px, ${(at.y - offsetY).toFixed(2)}px, 0) ` +
        `rotate(${angle.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    };

    const step = () => {
      const dx = target.x - at.x;
      const dy = target.y - at.y;

      at.x += dx * CURSOR.follow;
      at.y += dy * CURSOR.follow;

      // Clamp the trail. Easing alone lets the gap grow without bound during a
      // fast flick across a wide screen, and the leaf is the only cursor there
      // is — past this distance it stops being a pointer and becomes a comet.
      const lagX = target.x - at.x;
      const lagY = target.y - at.y;
      const lag = Math.hypot(lagX, lagY);
      if (lag > CURSOR.maxLagPx) {
        const pull = 1 - CURSOR.maxLagPx / lag;
        at.x += lagX * pull;
        at.y += lagY * pull;
      }

      // The blade swings toward where the hand is going, and hangs straight down
      // when it is still. 32 degrees at full tilt: enough to read as weight,
      // little enough that the leaf never points back up its own stem.
      const speed = Math.hypot(dx, dy);
      angleTo = speed > 0.4 ? Math.max(-32, Math.min(32, dx * 0.9)) : 0;
      angle += (angleTo - angle) * CURSOR.swing;
      scale += (scaleTo - scale) * CURSOR.swing;

      draw();

      // Stop, rather than idle. Both the position and the swing must have
      // settled; checking only one leaves the loop alive whenever the leaf is
      // still rotating back to rest.
      const moving = Math.hypot(target.x - at.x, target.y - at.y) > 0.1;
      const swinging = Math.abs(angleTo - angle) > 0.1 || Math.abs(scaleTo - scale) > 0.001;
      frame = moving || swinging ? requestAnimationFrame(step) : 0;
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };

    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!seen) {
        // Land it under the pointer on the very first move rather than flying in
        // from the corner it was parked in.
        seen = true;
        at.x = target.x;
        at.y = target.y;
        el.style.opacity = "1";
        // Only now does the arrow go. If this component had never got this far —
        // a failed chunk, a thrown error — the visitor still has one.
        document.documentElement.style.cursor = "none";
      }
      wake();
    };

    // `pointerover` rather than `mouseover`: it fires for pen and touch too, and
    // this component only ever runs on a fine pointer anyway.
    const onOver = (event: PointerEvent) => {
      const over = (event.target as Element | null)?.closest?.(
        'a[href], button, [role="button"], summary, label, [data-photo]',
      );
      scaleTo = over ? CURSOR.hoverScale : 1;
      el.dataset.over = over ? "true" : "false";
      wake();
    };

    // Typing is the one time the leaf is in the way: an I-beam says where the
    // caret will land and a leaf does not.
    const onFocusIn = (event: FocusEvent) => {
      const focused = event.target as Element | null;
      if (focused?.matches?.('input, textarea, [contenteditable="true"]')) {
        el.style.visibility = "hidden";
        document.documentElement.style.cursor = "";
      }
    };
    const onFocusOut = () => {
      el.style.visibility = "";
      if (seen) document.documentElement.style.cursor = "none";
    };

    // Leaving the document entirely — out of the window, or into a devtools pane
    // — parks the leaf rather than freezing it mid-flight at the edge.
    const onLeave = () => {
      el.style.opacity = "0";
    };
    const onEnter = () => {
      if (seen) el.style.opacity = "1";
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    draw();

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      if (frame) cancelAnimationFrame(frame);
      document.documentElement.style.cursor = "";
    };
  }, []);

  return (
    /*
     * A plain `<img>`, not `next/image`. This is a fixed-size decorative mark with
     * one job and two encoded widths; the loader would add a query-string round
     * trip and a wrapper element for a 2.5 KB file that must be on screen the
     * instant the pointer moves.
     */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      data-leaf-cursor
      alt=""
      aria-hidden="true"
      src={`/brand/leaf-${LEAF.fallback}.webp`}
      /*
       * Density descriptors, and deliberately **not** a `sizes` attribute.
       *
       * `sizes` exists to tell the browser how large an image will be *when that
       * depends on layout*. A cursor is the same size at every breakpoint, so the
       * only open question is screen density, and `1x`/`2x`/`3x` answers exactly
       * that with nothing to get wrong. `w` descriptors here would have required a
       * `sizes` expression, and `lib/sizes.test.ts` rightly refused to let one
       * exist unchecked — but the round-trip guarantees it enforces are all about
       * viewport expressions this image does not have.
       *
       * `scripts/build_leaf.mjs` encodes at exact multiples of `LEAF.drawnWidth`,
       * so each descriptor is honest rather than approximate.
       */
      srcSet={LEAF.widths
        .map((w, i) => `/brand/leaf-${w}.webp ${i + 1}x`)
        .join(", ")}
      width={LEAF.drawnWidth}
      height={CURSOR.sizePx}
      decoding="async"
      fetchPriority="low"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        // Above the header and the menu overlay, which sit at 40 and 50.
        zIndex: 100,
        pointerEvents: "none",
        opacity: 0,
        // The rotation pivots on the tip, so the leaf swings beneath the pointer
        // rather than about its own middle.
        transformOrigin: `${LEAF.hotspot.x * 100}% ${LEAF.hotspot.y * 100}%`,
        // The lift and the warming to gold. The travel itself is written frame by
        // frame in the loop above and must not be transitioned — a transition on
        // `transform` here would fight the easing and turn the lag into a smear.
        transition: `opacity ${CURSOR.hoverDuration}s ease-out, filter ${CURSOR.hoverDuration}s ease-out`,
      }}
    />
  );
}
