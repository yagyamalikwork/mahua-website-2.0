/**
 * THE DIAL for timing. "It feels too fast" is one edit here, not fifty across components.
 *
 * The motion laws (spec section 4.3):
 *   1. Nothing bounces — everything decelerates and stops.
 *   2. Things develop, they do not fly in — a settle, never a lateral slide.
 *      Narrowed 5 Aug 2026 to permit a short vertical rise. See ENTER below.
 *   3. Depth, not movement — parallax caps at 15%.
 *   4. If you notice the animation, it is too fast.
 */

/** Seconds, matching GSAP's unit. */
export const DURATION = {
  reveal: 1.0,
  revealSlow: 1.4,
  /** A mask wiping upward off a photograph as it enters. */
  imageMask: 1.2,
  /** Delay between successive lines of a headline, not between words. */
  lineStagger: 0.09,
  stagger: 0.06,
  logoRotation: 75,
} as const;

/** GSAP easing strings. Deceleration only — no overshoot family is permitted. */
export const EASE = {
  settle: "power2.out",
  drift: "none",
} as const;

export const PARALLAX_MAX = 0.15;

/**
 * The entrance vocabulary, taken from the reference site rather than invented.
 *
 * Measured on thesujanlife.com on 5 Aug 2026: live elements sat at translateY
 * 14.1px and 17.9px with a scale of 1.0013, and **`perspective: none` on every
 * one of them**. What the client described as a "3D raise" is a short rise, a
 * whisper of scale and a slow ease — there is no perspective anywhere in it,
 * and building literal 3D would look wrong beside the thing it is copying.
 *
 * `rise` narrows spec section 4.3 law 2 rather than breaking it. The law says
 * things develop and never fly in, and the retired `REVEAL_FROM` enforced that
 * by having no offset at all. A 16px vertical settle is developing. A lateral
 * slide is still flying in, and `ENTER` has no `x` for one.
 *
 * These are CSS values, not GSAP ones — `app/layout.tsx` writes them onto
 * `<html>` as `--enter-*` custom properties so the numbers live here and only
 * here, and `app/globals.css` reads them back.
 */
export const ENTER = {
  rise: "16px",
  scale: 0.994,
  /** Seconds. Slow enough that the movement is felt rather than seen. */
  duration: 0.9,
  /** Seconds between successive items in a group. */
  stagger: 0.08,
  /** Decelerating, no overshoot — the CSS equivalent of `EASE.settle`. */
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/**
 * A photograph settles *down* to rest from slightly oversize. Scaling up on
 * entry reads as a zoom-in gimmick; settling down reads as the image coming to
 * rest. Law 2 binds here exactly as it binds `ENTER` — no `x`, no `y`.
 *
 * A CSS value like `ENTER`'s: `app/layout.tsx` writes it onto <html> as
 * `--image-from-scale`, alongside `--image-mask-duration` (`DURATION.imageMask`)
 * and `--image-settle-duration` (`DURATION.revealSlow`), and `app/globals.css`
 * reads all three back. The number lives here and only here.
 */
export const IMAGE_FROM = { scale: 1.08 } as const;

/**
 * The most screens of scroll a pinned scene may consume.
 *
 * This is a motion token because it is scroll *distance*, but it exists for a
 * layout reason: the day-arc was retired on 3 Aug 2026 because section heights
 * were set by a number rather than by their content, which is what left the page
 * empty. A pinned scene is the one remaining construct that can do that again,
 * so its rope is short and `StickyScene` clamps to it.
 */
export const STICKY_SCREENS_MAX = 3;

/** True when the visitor has asked their device to reduce motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
