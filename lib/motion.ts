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
  /**
   * The delay before a smaller photograph laid over the corner of a larger one
   * begins its own entrance: `SplitFeature`'s tiger-track and canopy inlays,
   * `LodgeCards`' secondary photograph. Long enough that the primary photograph
   * has visibly started settling before the one sitting on top of it follows —
   * `imageMask` (1.2s) is most of that photograph's own wipe, so 0.15s reads as
   * "just after", not "at the same time".
   */
  imageInlayDelay: 0.15,
  /**
   * The delay before `SplitFeature`'s pool letterbox follows the display
   * sentence above it. Its own value rather than `imageInlayDelay`'s, because it
   * is not an inlay (see that token) — there is no second photograph underneath
   * it to wait on, only the paragraph's own `Enter` above it in the same column,
   * so the gap reads shorter.
   */
  imageAsideDelay: 0.1,
  /** Delay between successive lines of a headline, not between words. */
  lineStagger: 0.09,
  /**
   * Delay between successive items in a stacked group, multiplied by index so
   * item *n* enters `stagger * n` after the first: `ChapterIntro` and
   * `PinnedCollage`'s body paragraphs, `Testimonials`' guest quotes.
   */
  stagger: 0.06,
  /**
   * The same idea as `stagger`, at a shorter interval, for `SplitFeature`'s
   * experience index. That list runs two columns from `sm:grid-cols-2`, so
   * `i % 2` only ever staggers a visual pair sitting side by side rather than a
   * run down one column — a smaller gap is what keeps the pair reading as one
   * movement instead of two.
   */
  columnStagger: 0.05,
  /**
   * The hairline sliding in under a link on hover or focus.
   *
   * Shorter than `ENTER.duration` on purpose, and the only movement on the page
   * allowed to be quicker than an entrance. Law 4 — "if you notice the animation,
   * it is too fast" — is about things arriving unbidden. This one is an *answer*
   * to something the visitor just did, and an answer that takes as long as an
   * arrival reads as lag. Being noticed is its whole job.
   */
  ruleIn: 0.4,
  /**
   * One half-turn of the brand emblem as the page arrives, and then it is still.
   *
   * `logoRotation: 75` lived here until 5 Aug 2026 — seventy-five *seconds* per
   * revolution, from a permanent slow spin nobody built and its test asserting
   * only that it stayed above sixty. The client narrowed the idea that day to
   * "once on load, then still", which is also what CLAUDE.md non-negotiable #5
   * already says about the tiger: permanent peripheral motion contradicts
   * "seduce, not convert". A dead token whose guard describes the opposite
   * behaviour from the one that ships is worse than no token, so it went the way
   * `EASE.settle` went rather than being left as an invitation.
   *
   * Long, because it must not read as a spin. `app/layout.tsx` writes it out as
   * `--emblem-turn-duration` and `app/globals.css` reads it back.
   */
  emblemTurn: 2.4,
} as const;

/**
 * GSAP easing strings. Deceleration only — no overshoot family is permitted.
 *
 * **Only for what GSAP still drives, which is scrubbing.** `settle`
 * (`power2.out`) lived here until 5 Aug 2026 and was the entrance curve for
 * `SplitLines`, while every other entrance used `ENTER.ease` in CSS. That is two
 * easings for one idea: at a quarter of the way through, `power2.out` has
 * travelled ~76% and `ENTER.ease` ~58%, so a headline and the photograph beside
 * it arrived on visibly different curves. Restraint is a requirement (CLAUDE.md
 * non-negotiable #4) and one page gets one entrance curve, so `settle` is gone
 * rather than merely unused — an unused export is an invitation.
 *
 * `drift` is `none` because a scrubbed effect is already eased by the scroll
 * itself; easing it twice is what makes parallax feel like it is lagging.
 */
export const EASE = {
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
  /**
   * Seconds between successive items in a group — `PlateGrid`'s intro
   * paragraph following its heading, `LodgeCards`' fact block following its
   * photographs.
   */
  stagger: 0.08,
  /**
   * Decelerating, no overshoot. **The page's one entrance curve** — every
   * entrance there is reads it through `--enter-ease`: the block settle, the
   * photograph mask and settle, and the headline's per-line rise. See the note
   * on `EASE` for why there is no second one.
   */
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
