"use client";

import { useEffect, useRef } from "react";
import { LANTERN } from "@/lib/lantern-art";
import { LANTERN as SWING } from "@/lib/motion";

/**
 * The `sizes` this lantern is drawn at. Must stay in step with `LANTERN_FIT`
 * below; `lib/lantern-art.test.ts` compares the two rather than trusting anyone
 * to remember.
 *
 * Exported so `lib/sizes.test.ts` holds it to the same round-trip guarantee as
 * every other `sizes` string on the page. Plain pixel widths rather than a `vw`
 * expression, because this is a fixed-size ornament at each breakpoint — the same
 * reasoning as `EMBLEM_SIZES` in `ui/BrandMark.tsx`.
 */
export const LANTERN_SIZES =
  "(min-width: 1440px) 200px, (min-width: 1280px) 128px, (min-width: 768px) 168px, 128px";

/**
 * How large the lantern is at each width, and the one band where it is not drawn
 * at all. **Every number here was measured, not chosen.**
 *
 * The lantern hangs from the section's top edge down the middle of the chapter,
 * so what it needs is clear paper between that edge and the first thing in the
 * column below it. That room is not a constant: `ChapterIntro` centres its prose
 * vertically against the flanking photographs (`lg:self-center`), the flanks grow
 * with the viewport's width, and so the prose starts lower the wider the window.
 * Measured on the built page, and independent of viewport *height* at every one:
 *
 * | width | room | drawn | hangs | clear by |
 * |-------|------|-------|-------|----------|
 * | 1024  |  80px | — | — | nothing fits |
 * | 1120  |  96px | — | — | nothing fits |
 * | 1280  | 196px | 128px | 179px | 17px |
 * | 1366  | 243px | 128px | 179px | 64px |
 * | 1440  | 286px | 200px | 283px |  3px |
 * | 1920  | 393px | 200px | 283px | 110px |
 *
 * **Below `lg` the question does not arise**: the composition stacks, the first
 * thing under the section's edge is a photograph rather than the chapter's
 * heading, and the lantern hangs over the bonfire — which is where it looks best
 * of all, its own flame above the fire.
 *
 * **1024-1279 is the one band with no answer, and it is hidden there.** The room
 * runs from 80 to 196px; the smallest lantern worth drawing needs 179px, and a
 * 60px one would be a smudge. Hiding it is the honest failure: the alternative
 * measured on 7 Aug was a lantern printed through the words "The other half of
 * the day", which is worse than an ornament that is simply absent. Raised with
 * the client rather than buried — if that band matters, the fix is to hang it
 * over the bonfire flank there as the stacked layout already does.
 */
/**
 * **Every band is a closed interval, and that is deliberate.** The first version
 * of this used Tailwind's own `md:` and `xl:` alongside an arbitrary
 * `min-[1440px]:`, and the lantern came out 128px wide at 1920 — Tailwind emitted
 * the arbitrary rule *before* the named one, so at 1920 both matched, they had
 * equal specificity, and `xl:w-[128px]` won on source order. Overlapping
 * min-width rules only work if you can predict how the framework sorts them.
 * Disjoint rules do not care.
 */
export const LANTERN_FIT = [
  "block h-auto",
  "w-[128px]",
  "[@media(min-width:768px)_and_(max-width:1023px)]:w-[168px]",
  "[@media(min-width:1024px)_and_(max-width:1279px)]:hidden",
  "[@media(min-width:1280px)_and_(max-width:1439px)]:w-[128px]",
  "[@media(min-width:1440px)]:w-[200px]",
].join(" ");

/**
 * The client's watercolour lantern, hung out of the night photograph above
 * `06 · The Lantern Hour` and swinging when a visitor pushes it.
 *
 * ## What makes it hang rather than sit
 *
 * **It rotates about the top of its own chain.** `LANTERN.pivot` is measured from
 * the artwork's ink by `scripts/build_lantern.mjs` — the centre of the topmost
 * inked row — and becomes this element's `transform-origin`. Rotating about the
 * middle of the box, which is what a `transform-origin` left at its default would
 * do, reads as a picture being turned rather than as an object hanging from
 * something. That is the same reasoning as the leaf cursor's hotspot, and it is
 * the whole difference here.
 *
 * ## Why a pendulum is allowed at all
 *
 * Non-negotiable #4 is that peripheral motion is a fault, and #5 that a thing may
 * arrive, perform, and must then doze. A damped oscillator satisfies both without
 * being managed: pushed, it swings; left alone, it comes to rest and **the frame
 * loop stops itself**, exactly as the leaf cursor's does. There is no timer, no
 * idle loop, and no state to reset — its rest is the same still lantern the
 * server renders.
 *
 * It is also, like the sliding rule and the leaf, an answer to the visitor's own
 * hand. Spec section 4.3 law 4 — nothing may move unbidden — is not engaged by
 * something that only moves when pushed.
 *
 * ## Three things that would each have been a defect
 *
 * 1. **The step is real elapsed time, not one frame.** A fixed per-frame step
 *    swings at half speed on a 30Hz laptop and double on a 120Hz display, and
 *    "the lantern is faster on better hardware" is not a thing anyone thinks to
 *    check. `SWING.maxStep` caps it so a backgrounded tab does not resume with
 *    one enormous step and fling the lantern into its clamp.
 * 2. **`pointer-events: none`.** The lantern hangs *over* the chapter's copy at
 *    the client's request. Without this it would silently eat clicks and text
 *    selection across a band of the paragraph beneath it — invisible in every
 *    screenshot. The push is therefore hit-tested geometrically against a cached
 *    box rather than by hovering the element, which it is not able to receive.
 * 3. **It listens only while it is on screen.** An `IntersectionObserver` adds
 *    and removes the pointer listener, so a visitor reading the top of the page
 *    is not paying for pointer maths against an ornament eight screens below.
 *
 * ## Safety
 *
 * Server-rendered, still, at rest. No JavaScript, a failed chunk, a browser with
 * no `IntersectionObserver`, `prefers-reduced-motion` — every one of those routes
 * ends with a lantern hanging quietly, which is the picture the client asked for
 * with the interaction as the addition rather than the substance. Script may only
 * add the swing.
 *
 * `transform` is written directly by the loop, and this element carries no
 * Tailwind transform utility — no `rotate-*`, no `scale-*` — so there is nothing
 * for it to compose with. See the note above the image rules in
 * `app/globals.css` for what happens when that is not true.
 */
export function HangingLantern({ className = LANTERN_FIT }: { className?: string }) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion keeps the lantern and loses the swing. Read once: a visitor
    // who changes this mid-visit gets it on the next load, and re-arming a live
    // listener for that is more moving parts than the case deserves.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Nothing to push with. A coarse pointer would otherwise fire this on every
    // scroll-drag, which is motion arriving unbidden by another name.
    if (!window.matchMedia?.("(pointer: fine)").matches) return;

    let angle = 0;
    let vel = 0;
    let frame = 0;
    let last = 0;

    /**
     * The lantern's resting box, cached.
     *
     * Deliberately not read inside the pointer handler: that handler runs at
     * pointer rate and the loop writes `transform`, so reading layout there is a
     * read-after-write across two tasks — the classic thrash. Refreshed on the
     * events that can actually move it instead.
     *
     * It is the *unswung* box, so the hit test ignores up to 14 degrees of tilt.
     * That is a deliberate approximation: this is "push the lantern", not a
     * precision target, and a box that chased the swing would make the lantern
     * harder to catch the more it was already moving.
     */
    let box: DOMRect | null = null;
    const measure = () => {
      box = el.getBoundingClientRect();
    };

    const draw = () => {
      el.style.transform = `rotate(${angle.toFixed(3)}deg)`;
    };

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, SWING.maxStep);
      last = now;

      // Damped harmonic motion on the small-angle approximation. Linear, so
      // degrees work as well as radians — both sides scale together.
      const acc = -SWING.stiffness * angle - SWING.damping * vel;
      vel += acc * dt;
      angle += vel * dt;

      if (angle > SWING.maxAngleDeg) {
        angle = SWING.maxAngleDeg;
        if (vel > 0) vel = 0;
      } else if (angle < -SWING.maxAngleDeg) {
        angle = -SWING.maxAngleDeg;
        if (vel < 0) vel = 0;
      }

      draw();

      // Both conditions, not either. A pendulum passing through vertical at speed
      // has an angle of zero and is emphatically not at rest; stopping on the
      // angle alone would freeze it mid-swing, at the one position where the
      // freeze is least visible and most wrong.
      if (Math.abs(angle) < SWING.restDeg && Math.abs(vel) < SWING.restVel) {
        angle = 0;
        vel = 0;
        draw();
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(step);
    };

    let prevX = 0;
    let prevT = 0;
    const onMove = (event: PointerEvent) => {
      if (!box) return;
      const now = event.timeStamp;
      const dx = event.clientX - prevX;
      const dt = (now - prevT) / 1000;
      prevX = event.clientX;
      prevT = now;
      // First move of a visit has no previous sample to differentiate against.
      if (dt <= 0 || dt > 0.2) return;

      const inside =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom;
      if (!inside) return;

      // Speed across the lantern becomes angular velocity. Sign follows the hand,
      // so pushing right swings it right.
      vel += (dx / dt) * SWING.pushScale;
      wake();
    };

    // Only while it is on screen — see the note above.
    let listening = false;
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) {
        measure();
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure);
      } else {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", measure);
        window.removeEventListener("resize", measure);
      }
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => listen(entries[0].isIntersecting), {
            rootMargin: "200px",
          });
    if (observer) observer.observe(el);
    else listen(true);

    el.dataset.lanternReady = "true";

    return () => {
      observer?.disconnect();
      listen(false);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    /*
     * A plain `<img>`, not `next/image`. This is a fixed-size decorative mark
     * with four encoded widths and no art direction; the loader would add a
     * query-string round trip and a wrapper element that would then need its own
     * `transform-origin`. Same call as the leaf cursor and the emblem.
     */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      data-hanging-lantern
      alt=""
      aria-hidden="true"
      src={`/brand/lantern-${LANTERN.fallback}.webp`}
      srcSet={LANTERN.widths.map((w) => `/brand/lantern-${w}.webp ${w}w`).join(", ")}
      sizes={LANTERN_SIZES}
      width={LANTERN.width}
      height={LANTERN.height}
      /*
       * Eight screens below the fold, so it must never be in the first load. This
       * is the attribute the two film posters cannot have — see CLAUDE.md
       * non-negotiable #6 — and the reason this ornament costs nothing until it
       * is nearly on screen.
       */
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className={className}
      style={{
        // The top of the chain. The lantern swings from where it is hung.
        transformOrigin: `${LANTERN.pivot.x * 100}% ${LANTERN.pivot.y * 100}%`,
        // It hangs over the copy at the client's request and must not take a
        // click, a caret or a text selection from it.
        pointerEvents: "none",
      }}
    />
  );
}
