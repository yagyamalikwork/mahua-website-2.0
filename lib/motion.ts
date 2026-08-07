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
   * How long the **longest** stroke of the ink tiger takes to draw.
   *
   * Shorter strokes take proportionally less, down to `tigerInkFloor`, because a
   * hand spends longer on a long line than on a short mark. With one duration for
   * all 162 strokes a five-unit dot took exactly as long as the animal's spine,
   * which is the opposite of how drawing works.
   *
   * This is the one thing on the page a visitor is meant to *watch happen* rather
   * than find already arrived, so law 4 does not bind it.
   */
  tigerInk: 0.7,
  /** The shortest any single stroke may take, so a small mark is still seen being made. */
  tigerInkFloor: 0.18,
  /**
   * The gap between one stroke starting and the next — **per stroke, not per
   * wave**, and much smaller than `tigerInk` so that strokes overlap continuously.
   *
   * It was 1.05s against a 0.9s duration, in eight waves of twenty. Measured frame
   * by frame, that drew twenty strokes at once, then left **nothing drawing at all
   * for ~0.15s**, eight times over — a stop-start stutter the client saw
   * immediately and described as jittery. The frame rate was never the problem:
   * two frames over 32ms in the whole eight seconds.
   *
   * At this value roughly ten strokes are mid-draw at any moment and there is
   * never a dead frame, which is what reads as a hand working rather than as
   * batches materialising.
   */
  tigerInkStagger: 0.045,
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
 * The leaf that follows the pointer.
 *
 * `follow` and `swing` are **per-frame easing factors, not seconds**: each frame
 * the leaf closes that fraction of the distance (or angle) still between it and
 * its target. That is what produces a lag which is large while the hand is moving
 * and gone the instant it stops — a fixed duration would keep the leaf drifting
 * after you had already arrived, which is the behaviour that makes a trailing
 * cursor feel broken rather than weightless.
 *
 * `maxLagPx` is a correctness cap, not a taste one. The leaf *replaces* the
 * arrow, so how far it may trail is how far the only visible cursor may sit from
 * the point that would actually be clicked.
 *
 * **It bounds the leaf against the last pointer position the loop was given, not
 * against where the hand is now** — and the difference matters when reading any
 * measurement of it. Between one frame and the next the hand keeps moving, so the
 * visible gap during a fast flick is this clamp *plus* a frame of the pointer's
 * own travel. Measured on 5 Aug 2026: a flick covering 86.7px per frame showed a
 * 98.7px gap, which is 12 + 86.7 exactly, and the frame the pointer stopped read
 * 12.0. No cursor can do better — the operating system's own arrow is a frame
 * behind the hand too. `scripts/check_leaf_cursor.mjs` subtracts the travel
 * before comparing, having first asserted the opposite and been wrong.
 *
 * Law 4 does not apply here for the same reason it does not apply to the sliding
 * rule: this is an answer to the visitor's own hand, not something arriving
 * unbidden. It is meant to be noticed. It is still bound by law 1 — `swing`
 * eases toward the target and never past it, so the leaf cannot wag.
 */
export const CURSOR = {
  /** CSS pixels, fixed. A cursor has one size at every zoom and every breakpoint. */
  sizePx: 28,
  follow: 0.22,
  swing: 0.12,
  maxLagPx: 12,
  /** How much the leaf lifts over something interactive. */
  hoverScale: 1.15,
  /** Seconds. Matches `DURATION.ruleIn`, so the lift and the rule beneath it read as one response. */
  hoverDuration: 0.4,
} as const;

/**
 * The welcome screen: the brand lockup on cream, the flower turning once, and
 * then it goes.
 *
 * **Seconds, and the whole thing is 2.1 of them.** The client asked first for
 * something "quick enough that it doesn't come as too long of a break", and then
 * on seeing it for "a few more milliseconds" — this is the second setting, chosen
 * from three measured options on 8 Aug 2026. The turn here is `turn`, not
 * `DURATION.emblemTurn`: the header's 2.4s half-turn is right for a mark that
 * arrives *alongside* the page, and a screen that stands in front of it for 2.4s
 * before it will even begin to fade is a wall.
 *
 * **There is room for this and it was measured.** The hero photograph lands at
 * ~3,987 ms on Slow 4G (non-negotiable #6), and the welcome is gone well before
 * it — so lengthening the greeting costs a visitor nothing they were not already
 * waiting for. That headroom is the reason a longer welcome was offered at all,
 * and it disappears the day the hero gets faster.
 *
 * **`hold` is a delay, not a keyframe percentage, and that is deliberate.** The
 * fade is one animation with `animation-delay: var(--welcome-hold)` and
 * `animation-fill-mode: both`, so these two numbers can be changed here without
 * anyone recomputing a percentage in `app/globals.css`. A keyframe set with
 * `63%` in it would silently mean something else the moment either number moved.
 *
 * The screen is **hidden in its base style and made visible only by the
 * animation's backwards fill.** That is the fail-safe: if animations never run —
 * an old browser, a stylesheet that failed, `prefers-reduced-motion`, anything —
 * the base style wins and the visitor gets the site with no welcome at all. The
 * opposite arrangement, visible by default and hidden by the animation, fails
 * into a cream screen with a logo on it and no way past. See `app/globals.css`.
 */
export const WELCOME = {
  /** The flower's half-turn. Shorter than the header's, on purpose. */
  turn: 1.2,
  /** How long the screen stands before it begins to leave. A short beat past `turn`, so the logo is settled before it goes. */
  hold: 1.45,
  /** The fade itself. */
  fade: 0.65,
} as const;

/**
 * The lantern that hangs out of `after-dark` into `06 · The Lantern Hour`, and
 * swings when a visitor pushes it.
 *
 * **A pendulum is the one kind of peripheral motion this page is allowed**,
 * because it is the one kind that ends. Non-negotiable #5 asks for a thing that
 * arrives,
 * performs and then dozes; a damped oscillator does precisely that without being
 * told to, and its rest state is the same still hanging lantern the server
 * renders. There is no timer and no loop to leave running — see the note on the
 * component for how the frame loop kills itself.
 *
 * Simulated as a damped harmonic oscillator on the small-angle approximation,
 * `θ'' = -k·θ - d·θ'`, integrated per frame against real elapsed time rather than
 * per frame flat. A fixed step would swing at half speed on a 30Hz laptop and at
 * double on a 120Hz display, and "the lantern swings faster on nicer hardware" is
 * not a thing anyone would think to check.
 *
 * `stiffness` sets the period: `2π/√k` = **1.6s** here, which is about what a
 * lantern hung on half a metre of chain actually does. Slower reads as
 * underwater; faster reads as a nervous twitch.
 *
 * `damping` is `2ζ√k` for a damping ratio ζ of **0.14**, which settles it in
 * about three and a half swings and roughly 6.7 seconds. That is the dial to
 * turn if it feels too lively; larger stops it sooner.
 *
 * **ζ was 0.1 for one build and 0.1 was wrong**, and the reason is worth keeping.
 * A real lantern on a chain swings far longer than this, so under-damping is the
 * physically honest choice — but the amplitude envelope decays as `e^(-ζωt)`, and
 * at 0.1 a 10-degree push takes **13.5 seconds** to fall under the rest threshold.
 * That is thirteen seconds of frame loop and of peripheral movement in the corner
 * of someone's eye, which is non-negotiable #4 lost on a technicality. Restraint
 * beats accuracy here, as it does everywhere else on this page.
 *
 * `maxAngleDeg` is a hard clamp, not a target. It exists because `pushScale`
 * turns pointer speed into angular velocity and a pointer can be flicked
 * arbitrarily fast; without it a hard swipe would spin the lantern over its own
 * chain, which is funny once and broken thereafter.
 *
 * `restDeg` / `restVel` are the thresholds the loop stops below. Both, not one:
 * a pendulum passing through vertical at speed has an angle of zero and is not
 * at rest, and stopping there would freeze it mid-swing. They are set as a
 * matched pair — at an amplitude of `restDeg` the peak velocity of this
 * oscillator is `restDeg × √k` = 0.98 deg/s, so `restVel` of 1.0 is the same
 * moment expressed the other way and neither threshold is the one that always
 * fires. 0.25 degrees moves the foot of a 200px lantern by 1.3px.
 */
export const LANTERN = {
  /** Sets the period: 2π/√k seconds. 15.4 is a 1.6s swing. */
  stiffness: 15.4,
  /** 2ζ√k, for ζ = 0.14. Larger settles sooner. */
  damping: 1.099,
  /** Degrees. A clamp against a fast flick, not the amplitude to aim for. */
  maxAngleDeg: 14,
  /** Degrees of swing per pixel-per-second of pointer speed across the lantern. */
  pushScale: 0.045,
  /** Degrees below which, with `restVel` also met, the loop stops. */
  restDeg: 0.25,
  /** Degrees per second below which, with `restDeg` also met, the loop stops. */
  restVel: 1,
  /**
   * Seconds. The longest step the integrator will take, so a backgrounded tab
   * returning after a minute resumes rather than launching the lantern into its
   * clamp with one enormous step.
   */
  maxStep: 0.05,
} as const;

/**
 * The ink tiger's living phase — seconds per cycle, and how long it lives before
 * it dozes.
 *
 * **Only two things move, and that is the artwork's doing rather than a choice.**
 * The client's drawing has no visible tail in this pose, and its ears are strokes
 * continuous with the skull, so rotating them would drag lines away from the ones
 * they join. What is left is a blink — the eyes are separable — and a breath
 * applied to the whole drawing at once, where it cannot break a join.
 *
 * **The two periods must not be simple multiples of one another.** Two movements
 * landing on a common beat read as a mechanism; on unrelated beats they read as
 * an animal. `motion.test.ts` holds them apart.
 *
 * `phase` is why this can doze with **no JavaScript timer**: each part runs a
 * whole number of cycles and fills forwards, and the eyes take a final animation
 * delayed past all of them. It arrives, performs, then dozes — non-negotiable #5,
 * and the reason nothing is left running in the background afterwards.
 */
export const LIVING = {
  /** A slow, shallow rise and fall of the whole animal. */
  breath: 4.3,
  /** Long between blinks. A cat at rest blinks rarely, and often not at all. */
  blink: 5.9,
  /** Seconds of living before the eyes close for good. */
  phase: 24,
} as const;

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
