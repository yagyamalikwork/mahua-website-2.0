"use client";

import { useEffect, useRef } from "react";
import { LEAF_PATHS, LEAF_VIEWBOX } from "@/lib/leaf-art";
import { CURSOR } from "@/lib/motion";
import { PALETTE } from "@/lib/palette";

/**
 * A mahua leaf hanging from the pointer, in place of the arrow.
 *
 * ## The three things that make it a leaf and not a sticker
 *
 * 1. **The stem tip is the pointer.** `lib/leaf-art.ts` puts the petiole at the
 *    top-left of a square viewBox, so the element's own origin goes at the
 *    pointer and the blade falls down and to the right — over nothing you are
 *    about to click, and with no offset arithmetic to get wrong.
 * 2. **It lags, and the lag dies.** Position eases by `CURSOR.follow` of the
 *    remaining distance each frame, so the leaf trails while the hand moves and
 *    is exactly on the point within a few frames of it stopping. The trail is
 *    clamped to `CURSOR.maxLagPx`, because the leaf is the only visible cursor
 *    and it may not sit further than that from where a click would land.
 * 3. **The angle carries its own inertia**, easing at the slower `CURSOR.swing`,
 *    so the blade swings behind the direction of travel and settles without
 *    overshooting. A leaf locked rigidly to the pointer reads as a sticker; this
 *    is the whole difference.
 *
 * ## Why none of this touches React state
 *
 * Pointer moves arrive faster than 60Hz. A `setState` per move would re-render
 * this component hundreds of times a second and make the page's own scroll
 * animations stutter. Everything lives in refs and one `requestAnimationFrame`
 * loop writing `el.style.transform` directly. React renders this once.
 *
 * **The loop stops itself.** Once the leaf has arrived and stopped swinging it
 * schedules no further frame, and the next `pointermove` starts it again. A
 * decorative loop running forever is invisible on a desktop and a real battery
 * cost on a laptop, and nothing about the page looks different when it regresses
 * — which is why `scripts/check_leaf_cursor.mjs` counts frames rather than
 * trusting this comment.
 *
 * ## Safety
 *
 * `cursor: none` is set **by this component, after it has mounted and painted**,
 * and never in server-rendered CSS. If this chunk fails to load or throws, the
 * visitor keeps their arrow. Same discipline as the pinned collage being
 * server-rendered off: script may take something away only once it has proved it
 * can put something back.
 *
 * `transform` is written directly and this element carries no Tailwind utility
 * at all — no `scale-*`, no `translate-*` — so there is nothing for it to compose
 * with. See the note above the image rules in `app/globals.css` for what happens
 * when that is not true.
 */
export function LeafCursor() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target = { x: -100, y: -100 };
    const at = { x: -100, y: -100 };
    let angle = 0;
    let angleTo = 0;
    let scale = 1;
    let scaleTo = 1;
    let frame = 0;
    let seen = false;

    const draw = () => {
      el.style.transform =
        `translate3d(${at.x.toFixed(2)}px, ${at.y.toFixed(2)}px, 0) ` +
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
      const el2 = event.target as Element | null;
      if (el2?.matches?.('input, textarea, [contenteditable="true"]')) {
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
    const onLeave = () => { el.style.opacity = "0"; };
    const onEnter = () => { if (seen) el.style.opacity = "1"; };

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
    <svg
      ref={ref}
      data-leaf-cursor
      aria-hidden="true"
      viewBox={LEAF_VIEWBOX}
      width={CURSOR.sizePx}
      height={CURSOR.sizePx}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        // Above the header and the menu overlay, which sit at 40 and 50.
        zIndex: 100,
        pointerEvents: "none",
        opacity: 0,
        // The lift and the warming to gold. The travel itself is written frame by
        // frame in the loop above and must not be transitioned — a transition on
        // `transform` here would fight the easing and turn the lag into a smear.
        transition: `opacity ${CURSOR.hoverDuration}s ease-out, color ${CURSOR.hoverDuration}s ease-out`,
      }}
    >
      {/*
       * The halo, and it is not decoration — it is what lets one leaf be legible
       * on every surface this page has.
       *
       * The blade is ink. On cream that reads perfectly and on `ChapterMenu`'s
       * overlay (#232B21) it is very nearly invisible, which for the *only*
       * visible cursor is a usability failure rather than an aesthetic one — the
       * menu is exactly where a visitor is aiming at links. Drawing the whole leaf
       * first in paper, stroked wide, puts a cream edge around every part of it.
       * On cream the halo blends into the page and disappears; on anything dark it
       * becomes the drawing. Nothing has to know which surface it is over.
       */}
      {LEAF_PATHS.map((p, i) => (
        <path
          key={`halo-${i}`}
          d={p.d}
          fill={p.role === "blade" ? PALETTE.paper : "none"}
          stroke={PALETTE.paper}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/*
       * `currentColor` on the blade and the stem, so the CSS in `app/globals.css`
       * can warm the whole leaf to gold over a link with one property, and the
       * colour stays in `lib/palette.ts` where every colour on this page lives.
       */}
      {LEAF_PATHS.filter((p) => p.role === "blade").map((p, i) => (
        <path key={`blade-${i}`} d={p.d} fill="currentColor" />
      ))}
      {LEAF_PATHS.filter((p) => p.role === "stem").map((p, i) => (
        <path
          key={`stem-${i}`}
          d={p.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
      ))}
      {/*
       * Veins are paper, because they sit *on* the blade and have to contrast with
       * it rather than with the page.
       */}
      {LEAF_PATHS.filter((p) => p.role === "vein").map((p, i) => (
        <path
          key={`vein-${i}`}
          d={p.d}
          fill="none"
          stroke={PALETTE.paper}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.5}
        />
      ))}
    </svg>
  );
}
