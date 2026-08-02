/**
 * THE DIAL for timing. "It feels too fast" is one edit here, not fifty across components.
 *
 * The motion laws (spec section 4.3):
 *   1. Nothing bounces — everything decelerates and stops.
 *   2. Things develop, they do not fly in — fade up from 96% scale, never a lateral slide.
 *   3. Depth, not movement — parallax caps at 15%.
 *   4. If you notice the animation, it is too fast.
 */

/** Seconds, matching GSAP's unit. */
export const DURATION = {
  reveal: 1.0,
  revealSlow: 1.4,
  stagger: 0.06,
  colourBleed: 0.6,
  logoRotation: 75,
} as const;

/** GSAP easing strings. Deceleration only — no overshoot family is permitted. */
export const EASE = {
  settle: "power2.out",
  drift: "none",
} as const;

export const PARALLAX_MAX = 0.15;

export const REVEAL_FROM = { opacity: 0, scale: 0.96 } as const;

/** True when the visitor has asked their device to reduce motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
