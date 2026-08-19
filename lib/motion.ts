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
 * The menu tiles lifting under the pointer — the client's "3D raise effect",
 * asked for on 11 Aug 2026.
 *
 * **Hand-caused, so law 1 does not forbid it**, on the same reasoning as the
 * lantern's swing and the films' hover-replay: motion a visitor *asks for* by
 * moving their pointer is an answer, not an interruption. Nothing here runs
 * unbidden, and there is no loop to leave running — a CSS transition settles
 * and stops.
 *
 * **It is genuinely dimensional and deliberately small.** `tilt` is what makes
 * it read as 3D rather than as a card sliding upward, and 2.5° is about a
 * third of what looks impressive in isolation. That is on purpose: the tile is
 * a large photograph, so the same angle that would be invisible on a button is
 * plenty here, and non-negotiable #4 governs — if you notice the animation
 * rather than the lift, it is too much. Raise `tilt` and it starts to read as a
 * novelty rather than as depth.
 *
 * `duration` matches `DURATION.ruleIn` so the lift and the hairline that slides
 * in beneath the tile's name are one gesture, not two events.
 */
export const RAISE = {
  /** Seconds. */
  duration: 0.4,
  /** CSS pixels the tile rises toward the viewer. */
  risePx: 8,
  /** Degrees the tile tips its top edge back. The 3D of the effect. */
  tiltDeg: 2.5,
  /** The perspective the tilt is read through. Larger is flatter; this is a gentle lens. */
  perspectivePx: 900,
  /** A hair of scale, so the lift reads as "nearer" and not only as "higher". */
  scale: 1.015,
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
/**
 * The page's scroll feel — `components/motion/SmoothScroll.tsx`.
 *
 * These were hard-coded in the component until 12 Aug 2026, which is the one thing
 * this project's architecture rule forbids: no component holds a duration. Moved
 * here when the client asked for the scroll to be "smoother and softer".
 *
 * `duration` is how long the page keeps gliding after the wheel stops. It is the
 * dial that decides whether scrolling feels soft or feels *late*: too long and the
 * page carries on after the reader has stopped asking, which reads as lag rather
 * than as smoothness. 1.1 was brisk; 1.4 is soft and still arrives when you expect.
 *
 * `ease` replaces Lenis's default exponential-out, which starts abruptly and then
 * has a very long tail. A quartic-out leaves at a gentler rate and settles sooner,
 * which is the shape "softer" actually describes.
 *
 * `wheelMultiplier` below 1 takes the edge off each wheel notch, so a single
 * aggressive flick travels less far. This is the part that makes a trackpad feel
 * unhurried rather than skittish.
 */
export const SCROLL = {
  duration: 1.4,
  wheelMultiplier: 0.9,
  /** Quartic out: leaves gently, settles without a long tail. */
  ease: (t: number) => 1 - Math.pow(1 - t, 4),
} as const;

/**
 * The slow zoom a homepage photograph makes while the pointer is on it.
 *
 * Client request, 12 Aug 2026: *"very smooth, slow and soft zoom in… the border or
 * outline size remain the same and the image zooms inside the same boundary."* So
 * the frame never moves — `ImageReveal` is already `overflow-hidden` — and only the
 * picture inside it grows.
 *
 * **1.06 and not more.** Non-negotiable #4 says if you notice the animation it is
 * too fast, and a zoom is noticed by its *rate*, not its distance: 6% over nearly
 * two seconds is a photograph breathing, while the same 6% in 300ms is a twitch.
 * The long `out` duration is what makes it read as soft; the shorter `back` is
 * because a photograph should return promptly once the pointer leaves rather than
 * following the visitor around the page.
 *
 * Hand-caused motion, so it is exempt from the page's restraint rules in the same
 * way the lantern's swing is — nothing moves until a visitor asks. It still goes
 * under `prefers-reduced-motion`, because the visitor asking for less motion is a
 * different request from the visitor pointing at a photograph.
 */
export const PHOTO_ZOOM = {
  scale: 1.06,
  out: 1.8,
  back: 0.9,
  ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
} as const;

/**
 * The homepage photographs' float — the client's request, 15 Aug 2026.
 *
 * *"Very slightly lift and rise towards the viewer and no tilt, which will give
 * the images a float like effect."* So this is `RAISE` with the rotation taken
 * out: a plate rises toward the reader and casts a little more shadow, and never
 * tips. The tilt is what makes the menu's lodge tiles read as *cards being
 * picked up*; a photograph on this page is meant to read as lifting off the
 * paper, which is a different gesture and a quieter one.
 *
 * **It rides on top of the hover zoom rather than replacing it** — the client
 * kept that explicitly. The zoom is on the `<picture>` inside the frame and this
 * is on the frame itself, so the two never touch the same element and cannot
 * compose into something neither was measured at.
 *
 * `rise` is 6px against `RAISE`'s 8: "very slightly" was the brief, and the
 * frames here are far larger than a menu tile, so the same distance reads as
 * more movement. The shadow is what sells *toward the viewer* rather than merely
 * *upward* — in `--overlay`, the palette's dark green, because a neutral shadow
 * on this cream goes grey and cold (the same finding as `RAISE`'s own).
 *
 * Slower than `RAISE`'s 0.4s, because a float is a drift and a card being picked
 * up is not; quicker on the way back, so a photograph settles rather than
 * following the visitor around the page — the same asymmetry as `PHOTO_ZOOM`.
 */
export const FLOAT = {
  risePx: 6,
  out: 0.7,
  back: 0.5,
  /** Opacity of the `--overlay` shadow at full lift. */
  shadowAlpha: 0.18,
  shadowBlurPx: 28,
  shadowDropPx: 14,
} as const;

export const STICKY_SCREENS_MAX = 3;

/**
 * The rooms card stack — `components/sections/RoomCardStack.tsx`.
 *
 * Every number here is spent against one measured budget: the *slack* between
 * the sticky header and the booking bar, which is **706px on a 390x844 phone**
 * and 724px at 1440x900. The phone is the tighter case, which is a first on
 * this page, so nothing here may be tuned against a desktop screenshot.
 *
 * `barReserve` is a constant rather than the bar's published height on purpose.
 * `PropertyBar` returns `null` over the hero, the invitation and the footer, so
 * a live measurement would flip between 0 and 69 as the visitor scrolls, and
 * card height is computed from it — every card in the chapter would resize, and
 * a resizing card moves the page under the reader's hand.
 * `scripts/check_card_stack.mjs` measures the real bar at four widths and fails
 * if it outgrows this, so the drift a constant invites is caught rather than
 * shipped.
 */
export const ROOM_STACK = {
  /** Vertical offset added per card, so the read cards leave a visible deck. */
  deckStep: 14,
  /** Breathing room between the deepest card and the booking bar. */
  gutter: 24,
  /** Past this a card stops reading as a card and starts reading as a section. */
  heightMax: 760,
  /** A covered card's scale at full recede. */
  scaleMin: 0.94,
  /** A covered card's opacity at full recede. */
  dim: 0.55,
  /** Space held for the booking bar. Measured 63px at 390, 69px from 768. */
  barReserve: 72,
} as const;

/**
 * The `04 · Days in the Field` coverflow — `components/sections/Coverflow.tsx`.
 *
 * Client request, 16 Aug 2026: *"the next and previous cards sit out of focus on
 * left and right respectively behind the center card."* So a neighbour is
 * smaller, shifted out past the centre card's edge, and veiled — three quiet
 * changes rather than one loud one, which is the same restraint `ROOM_STACK`'s
 * recede is built with.
 *
 * **`sideVeil` is scrim, not opacity, and the distinction is load-bearing.** A
 * card's type sits ON its own photograph (the client's second ruling the same
 * day — `FullBleedQuote`'s shape). Fading the whole card would fade that type
 * against the frame beneath it, so the depth cue would be working against the
 * contrast floor CLAUDE.md sets for text over a photograph. Adding scrim
 * recedes the photograph and RAISES cream type's contrast. Do not "simplify"
 * this back to an opacity — an earlier draft of this dial carried `sideDim` and
 * it was wrong; `motion.test.ts` asserts that lever cannot grow back, because
 * the "simplification" is exactly what a future editor would reach for.
 *
 * **No rotation and no blur.** A `rotateY` is the thing most coverflows reach
 * for and it is the thing this page cannot have: it is the tilt the client
 * explicitly did not want on the photographs a day earlier (`FLOAT`, above), and
 * a blur costs a compositor layer per card for an effect non-negotiable #4 would
 * call noticeable. Depth here is scale and veil, the way the deck's is.
 *
 * `screens` is the pin's length INCLUDING its own screen, matching
 * `StickyScene`'s `screens` so the two mean the same thing on this page. Both it
 * and `cardMaxPx` were **swept** rather than picked — `screens` on 16 Aug 2026
 * (`docs/reviews/2026-08-16-coverflow/density-sweep.md`) and `cardMaxPx` twice,
 * the second time on 17 Aug against the client's re-exported photographs
 * (`docs/reviews/2026-08-16-coverflow/geometry.md` §2). See each one's own note.
 */
export const COVERFLOW = {
  /**
   * Screens of scroll the chapter's stage occupies, including its own.
   *
   * **3 since 18 Aug 2026 — the client asked for the carousel to be slower**, and
   * this is the whole of that answer: *"the scroll now feels very snappy, replace
   * it with the smoother scroll effect we used previously with the smaller card
   * size in the carousel … but just make it a bit slower this time."* The
   * snapping he is describing is gone from `app/globals.css`, and pace is now a
   * longer pin. It is `STICKY_SCREENS_MAX`, so this dial is spent.
   *
   * **Re-swept at 2 / 2.5 / 3 on the linear deck, and the direction REVERSED.**
   * Four production builds, four density runs, `field-days` empty space:
   *
   * | screens | pin | centre-to-centre | mean | worst | page mean | images/screen |
   * |---|---|---|---|---|---|---|
   * | 2 | 1,007px | 201.4px | 30.6% | 44.4% | 36.2% | 2.18 |
   * | 2.5 | 1,457px | 291.4px | 29.5% | 44.4% | 35.9% | 2.12 |
   * | **3** | **1,907px** | **381.4px** | **29.1%** | **44.4%** | **35.6%** | **2.07** |
   *
   * The 16 Aug sweep read the opposite — mean 48.4 → 48.9 → 49.3% — and both are
   * right about their own build. **The card was 900px then and is 1217px now**, so
   * a pin screen used to be emptier than the chapter's average and is now denser
   * than it. That is a property of the composition rather than of this dial, which
   * is why the sweep was re-run rather than quoted.
   *
   * **The worst screen does not move at any length**, which is the one thing that
   * did hold from the earlier sweep: this changes how many screens the pin spends,
   * never what is on the emptiest of them.
   *
   * **What it costs is `imagesPerScreen`, 2.18 → 2.07.** That is the figure
   * non-negotiable #9 says to look at rather than at the chapter, and `rooted`'s
   * own history is this same trade in the same units, decided the other way — the
   * difference being that a longer pin there bought nothing anyone had asked for.
   * If 3 reads as too slow, 2.5 is one number and costs nothing else measured.
   */
  screens: 3,
  /** A neighbour's scale at full offset. */
  sideScale: 0.82,
  /** How far a neighbour sits from centre, as a percentage of a card's width. */
  sideShiftPct: 62,
  /** Extra `--overlay` wash over a neighbour at full offset. Never an opacity — see above. */
  sideVeil: 0.4,
  /**
   * The card's own shape, as the two integers the six photographs are exported
   * at — **1344 × 685, since 18 Aug 2026.**
   *
   * `CoverflowCard`'s `CARD_BOX` is `cardBoxW / cardBoxH`, and its
   * `aspect-[1344/685]` class is the same pair written for Tailwind;
   * `lib/sizes.test.ts` holds those two to each other in both directions. The
   * ratio lives here rather than only in the component because `app/globals.css`
   * needs it as well: since 18 Aug the card is bounded by the stage's HEIGHT as
   * well as its width (see `stageGutterYPx`), and turning an available height
   * into an available width is exactly this ratio.
   *
   * **It was 16/9 until 18 Aug 2026, and the change crops nothing.** The client
   * was given four card sizes with a measured sharpness for each and chose
   * *wider only, stay sharp*: **1344 × 685, +10% area, sharpness 1.00**, against
   * 1344 × 754 (+22%, 0.91) and 1344 × 823 (+33%, 0.83). At 16/9 the same files
   * were cropped 9.4% and drawn 1.1036 × the card's own width, which is what
   * capped the card at 1217 — see `cardMaxPx`.
   */
  cardBoxW: 1344,
  cardBoxH: 685,
  /**
   * The widest a card is ever drawn — reached once the container it sits in is
   * this wide, i.e. above `this + 2 × stageGutterMdPx` (1440px). Below that the
   * card fills its container; see `stageGutterPx` and `CoverflowCard`'s
   * `CARD_SIZES`.
   *
   * **This is the only lever this chapter's density has, and it is SOLVED against
   * the photographs rather than chosen.** 1344 is the exact largest card every
   * one of the six frames can still fill at full resolution, and
   * `CoverflowCard.test.tsx` asserts both that figure and the rule that produced
   * it. Read that test before changing this number.
   *
   * ## The client's request, and the files that made it possible
   *
   * 17 Aug 2026: *"as big as the Room Type cards from the property pages"* —
   * 1344 × 685 at 1440 — *"if the previous and next cards are flowing out of the
   * canvas of our website it is completely fine, it adds to the depth."* The same
   * day he re-exported all six card photographs at **1344 × 685 (1.9620:1)**,
   * where three had been 1163 × 508 (2.2925:1) crops made for `/mahua-vann`. Every
   * ceiling figure this comment used to carry belonged to those files.
   *
   * ## The cap is resolution, not taste
   *
   * `object-fit: cover` in `CARD_BOX` draws a photograph wider than its box
   * whenever the photograph is wider than the box — `cardWidth × imageAspect /
   * CARD_BOX`. **Since 18 Aug 2026 the box IS the photographs' own ratio, so that
   * factor is exactly 1.000 and the ceiling is the file's own width, 1344.** At
   * the 16/9 box it carried until then the factor was 1.1036 and the ceiling
   * `1344 / 1.1036 = 1217.8`. Past the ceiling they ship soft on an ordinary
   * 100%-scaled laptop, which is the screen the client tests on, and
   * `scripts/check_image_resolution.mjs` will **NOT** stop you: a photograph
   * already served its widest file is `atLibraryCeiling`, a class that rig reports
   * and does not enforce. That is why the guard is a unit test.
   *
   * ## The sweep, 17 Aug 2026 — and the chapter finally clears the ceiling
   *
   * Four real builds, four real density runs, `check_image_resolution.mjs` at
   * every arm (0 under-served throughout), on the build that carries the
   * recomposed header band and the 16/9 box:
   *
   * | `cardMaxPx` | card at 1440 | `field-days` mean | worst | page mean | page worst |
   * |---|---|---|---|---|---|
   * | 900 (what shipped 16 Aug) | 900 × 506 | 47.1% | 55.0% | 38.4% | 77.8% |
   * | 1000 | 1000 × 563 | 40.7% | 51.2% | 37.6% | 75.2% |
   * | 1100 | 1100 × 619 | 33.8% | 46.5% | 36.6% | 71.8% |
   * | **1217** | **1217 × 685** | **26.3%** | **41.0%** | **35.5%** | **71.4%** |
   *
   * About **−4.4 points of worst-screen empty per 100px of card, and it costs no
   * scroll whatsoever** — the wrapper's height is `screens × 100svh` and has
   * nothing to do with the card's size, so the chapter is ~2.7 screens at every
   * arm. **At 1217 `field-days` passed non-negotiable #8 for the first time**:
   * `passesWorst` true, 0 screens over budget, against three chapters over the
   * ceiling before that work.
   *
   * (The 1217 row was swept at 1218 — one pixel above the integer ceiling, where
   * the browser is asked for 1344.2px of a 1344px file. Shipped at 1217 so the
   * test can state the ceiling exactly; the final figures are the gate run's.)
   *
   * **1217 → 1344 on 18 Aug 2026 is NOT another 127px of the same sweep**, and
   * reading it as one over-predicts it. The card grew 10.4% in width and the box
   * lost its 9.4% crop in the SAME edit, so the photograph is now drawn at exactly
   * the card's width where it used to be drawn 1.1036 × past it: the card is
   * bigger and the pixels it asks for are unchanged, which is the whole of *"stay
   * sharp"*. What that was worth is measured, one change at a time, in
   * `docs/reviews/2026-08-16-coverflow/wider.md`.
   *
   * **It was 560 for a day in Aug 2026**, on the strength of a comment saying it
   * "matches `ROOM_STACK.heightMax`'s reasoning" — an analogy to a different
   * component in a different composition, measured against nothing. That is this
   * project's own named repeat defect (`DECISIONS.md` §18, §19, §20.4: a number
   * picked in a plan is read downstream as a bound and reported spent rather than
   * swept), and at 560 the chapter measured 70.7% / 83.1%.
   *
   * ## What the shape cost, and what now has to earn it back
   *
   * The 17 Aug reading of this box was *declined*, on one number: at 390 the
   * card's own words left **5px** of clearance inside a 1.9620 box against 23px
   * inside 16:9, in an `overflow: hidden` box that would clip a heading silently
   * (`docs/reviews/2026-08-16-coverflow/geometry.md` §2.3). The client chose the
   * shape anyway on 18 Aug, so that clearance is now something this page has to
   * hold rather than something it inherits — which is why `check_coverflow.mjs`
   * grew **assertion 12**, the card's own words measured against the card's own
   * box across the whole continuous width sweep. Do not change the type on this
   * card, or this ratio, without re-running it.
   */
  cardMaxPx: 1344,
  /**
   * The container's own horizontal padding — `ChapterSurface`'s `px-6`, and the
   * least cream a card may leave between itself and the viewport's edge.
   *
   * **These three numbers describe `ChapterSurface`, not the coverflow, and
   * they are here for exactly one reason.** A card's width is
   * `min(cardMaxPx, 100%)` in CSS — bounded by the stage it is centred in,
   * whatever that stage's own padding turns out to be — but `CARD_SIZES` cannot
   * say `100%`: `sizes` is an HTML attribute, evaluated before CSS custom
   * properties or layout exist, so the only way for it to name the same width
   * the browser will draw is to spell the container's arithmetic out in `vw`.
   * These are that arithmetic, in one place, interpolated into the one string.
   *
   * **They were `stageGutterPx: 24` alone until 17 Aug 2026, and that single
   * number was the defect.** The card's width was `min(cardMaxPx, 100vw − 2 ×
   * 24px)` while `ChapterSurface`'s container is `md:px-12` — 48px a side —
   * from 768px up, so from 768px to 996px the card came out up to 48px WIDER
   * than the stage holding it. `margin-inline: auto` against `left: 0; right:
   * 0` is then over-constrained, CSS 2.1 §10.3.7 resolves it by pushing the box
   * to the inline start, and every card sat 22-25px right of centre with 47px
   * of cream on one side and 1px on the other, at every scroll position, across
   * a 228px band that no rig on this project had ever looked at
   * (`docs/reviews/2026-08-16-coverflow/rig-failures.md`).
   *
   * The repair is that CSS no longer reads any of these for the card's width —
   * `min(cardMaxPx, 100%)` cannot exceed its stage whatever the padding does,
   * which is an invariant rather than a threshold. If a future edit changes
   * `ChapterSurface`'s padding, the layout stays correct and only these three
   * go stale; the symptom would be a photograph served one tier soft, and
   * `scripts/check_image_resolution.mjs` is what reports it.
   */
  stageGutterPx: 24,
  /** The same container's padding from `md` up — `ChapterSurface`'s `md:px-12`. */
  stageGutterMdPx: 48,
  /** …and the width it switches at, which is Tailwind's own `md`. */
  stageGutterMdFromPx: 768,
  /**
   * The cream above and below the card INSIDE the pinned stage — 18 Aug 2026.
   *
   * Client: *"If the images cannot go taller, remove some of the buffer space
   * from top and bottom of the carousel to make it look tighter and fuller
   * horizontally."* They cannot go taller: 685px is the file's own height and
   * `cardMaxPx` is already at the ceiling (`CoverflowCard.test.tsx`).
   *
   * **This number did not exist before, and its absence is the whole point.** The
   * stage was `100svh − header` and the card was whatever its width made it, so
   * the cream between them was a REMAINDER — 54px at 1440x900, 8px at 1440x800,
   * and NEGATIVE at 1440x760, where the card was already taller than the box
   * clipping it. `app/globals.css`'s own note recorded that as the reason not to
   * touch the stage's height, and it was right about the danger and wrong about
   * the conclusion: a remainder cannot be a dial, so the fix is to stop it being
   * a remainder. The card is now bounded by the stage's height as well as its
   * width, and this is the gap that bound leaves.
   *
   * At 1440x900 that turns 54px of cream into 24 at each end of the chapter —
   * which is 60px out of the pin's two joins, at no cost to the card, because at
   * 1440 the card is not the term that binds. On a viewport short enough for it to
   * bind, the card SHRINKS and this gap is what it shrinks to leave. Nothing
   * clips at any height, which `check_coverflow.mjs` assertion 13 sweeps
   * continuously from 600 to 1200 rather than at three presets — this project has
   * now shipped five defects that lived between fixed samples (`DECISIONS.md` §2
   * #44-45, #52-53, §20.7).
   *
   * **It is not free scroll and it is not free pin.** The pin's length is
   * `screens × 100svh − stageHeight`, so a shorter stage is a LONGER pin inside
   * the same track — 1,907px → 1,967px at 1440x900, i.e. 3% slower per card. The
   * chapter's own height does not change at all.
   */
  stageGutterYPx: 24,
} as const;

/**
 * `01 · The Lodges` as two panels — `components/sections/LodgePanels.tsx`,
 * 19 Aug 2026, the stakeholders' restructure (spec §2).
 *
 * Model: the ecotriip.co India/Africa split the client supplied as a screenshot
 * — two photographs side by side, each carrying a small region label, the
 * lodge's name, a sentence and a button.
 *
 * **`boxW/boxH` is a CROP decision before it is a composition one, and 4:3 is
 * the shallowest end of what the reference shows.** Both photographs are
 * 1440 x 960 (1.5:1), and `object-fit: cover` in a box TALLER than the
 * photograph crops its width by `1 − boxAspect / 1.5`:
 *
 * | box | crop | verdict |
 * |---|---|---|
 * | 3/2 = 1.5 | 0% | not a panel — it is the photograph, uncropped |
 * | **4/3 = 1.333** | **11.1%** | **chosen** — the reference's own ~1.3:1 |
 * | 5/4 = 1.25 | 16.7% | inside the bound, taller than the reference |
 * | 9/8 = 1.125 | 25.0% | exactly ON this project's width-crop bound |
 * | 3/4 = 0.75 | 50.0% | what spec §2's *"each full-height"* would cost |
 *
 * The 25% figure is `check_card_stack.mjs` assertion 6's bound, which the
 * coverflow's own box was solved against (`CoverflowCard.tsx`'s `CARD_BOX`);
 * it binds the WIDTH crop only, height being unbounded by the same convention.
 * **Spec §2's "each full-height" is therefore not buildable on these two files**
 * — a full-height panel at 1440x900 is roughly 0.75:1 and would throw away half
 * of each photograph — and the task brief's own measurement of the reference
 * screenshot (~1.3:1, not portrait) is what is built. See
 * `docs/reviews/2026-08-19-home-v2/shapes.md`.
 *
 * `twoUpFromPx` is Tailwind's `lg`, and it is here to be interpolated into the
 * `sizes` string rather than into a class: a Tailwind variant has to appear
 * literally in the source for the utility to be emitted at all, so the class
 * stays `lg:grid-cols-2` and `lib/sizes.test.ts` is what holds the two together.
 *
 * **It is `lg` and not the `md` spec §2 asks for, and that was measured rather
 * than preferred.** At 768 two panels are 376px wide and 282px tall, and a
 * label, a lodge's name, a sentence at a readable size and a pill do not fit in
 * 282px: the block measured 296px and was clipped at the top by the panel's own
 * `overflow: hidden` — the type ran off the photograph, which is this project's
 * repeat defect between fixed sample widths, found here by a solver reporting
 * "type top at 8% of panel height" where 1440 read 41%. Stacking to `lg` gives
 * 768-1023 two 4:3 panels at the full width of the screen, which is both legible
 * and denser than the side-by-side pair it replaces. The cost is that the split
 * the client saw in the screenshot only appears on a laptop, which is the lens
 * he named on 12 Aug 2026.
 */
export const LODGE_PANELS = {
  /** The panel's shape, as the `aspect-[4/3]` class in the markup. */
  boxW: 4,
  boxH: 3,
  /** The viewport at which the two panels stop stacking — Tailwind's `lg`. */
  twoUpFromPx: 1024,
} as const;

/**
 * `02 · The Jungles` — `components/sections/JunglesBand.tsx`, 19 Aug 2026
 * (spec §3).
 *
 * The client, on the 100svh full-bleed quote this replaces: *"it covers the
 * whole screen currently and feels too overwhelming… cropped from the length,
 * keeping the width, giving the section more room to breathe with the newly
 * created headroom and legroom, making it look sleeker."*
 *
 * **These two integers are `jungle-cats-stitch`'s own emitted dimensions, and
 * that is the entire point of them.** The band's box is the photograph's box, so
 * `object-fit: cover` crops it in neither axis and the width the browser draws
 * is the width of the element — which is what takes this photograph from the
 * softest on the site to exactly served, with no new file:
 *
 * | | drawn at 1440x900 | file | ratio |
 * |---|---|---|---|
 * | 100svh full-bleed (before) | 2,706px | 1,440 | **0.53** |
 * | its own aspect (after) | 1,440px | 1,440 | **1.00** |
 *
 * The before figure is what a `viewportHeightVh` box costs: `FullBleed`
 * oversizes to 127.6vh for parallax, so at 1440x900 the picture is 1,148px tall
 * and `cover` scales a 2.357:1 photograph until it covers that — 2,706px wide,
 * of which the visitor sees 1,440. **Both cats at the frame's edges are outside
 * the viewport in that arrangement**, which is a composition defect as much as a
 * resolution one: the black panther is in the left ~15% and the tiger in the
 * right ~25% of the photograph.
 *
 * At 1920 the band is drawn 1,920px from the same 1,440px file (ratio 0.75) and
 * `check_image_resolution.mjs` reports it as `atLibraryCeiling` rather than as a
 * failure — the library has nothing wider. Holding the band at 1,440px with
 * cream either side would fix that number and breach non-negotiable #8 in the
 * same move, which is the trade the plate boards already settled (`DECISIONS.md`
 * §19: at one column the plate fills the container).
 */
export const JUNGLE_BAND = {
  /** `jungle-cats-stitch`'s emitted width, as the `aspect-[1440/611]` class. */
  boxW: 1440,
  /** Its emitted height. 1440/611 = 2.357:1. */
  boxH: 611,
} as const;

/** True when the visitor has asked their device to reduce motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
