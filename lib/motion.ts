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
   * `PinnedCollage`'s body paragraphs, and the guest quotes — which sit at the
   * foot of `Invitation` since 19 Aug 2026, where they were `Testimonials`' own
   * until that component was retired with the `guests` chapter.
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
 * The `05 · Experiences` card strip — `components/sections/ExperienceStrip.tsx`.
 *
 * **It replaced `COVERFLOW` on 19 Aug 2026, and the replacement is a demotion in
 * kind rather than a retune.** That dial carried a pin length, a neighbour's
 * scale, its shift, its veil and a solved card cap, because the coverflow was a
 * scroll-driven animation whose every frame had to be computed. A strip is a
 * native `overflow-x: auto` scroller: the browser does the whole of it, so the
 * only numbers left are the ones that describe a card and the space between two
 * of them.
 *
 * `docs/DECISIONS.md` §20 is what the retired dial was for and what each of its
 * five numbers had been swept against; nothing here inherits any of them.
 *
 * **Every number below is the client's own design document's** —
 * `Brand&Design-Guidelines/mahua-home-v2-dusk.html`, whose `.strip-wrap`/`.card`
 * rules set `flex: 0 0 min(300px, 78vw)` and `gap: 20px`. They are transcribed
 * rather than derived because they came from him; what IS derived from them is
 * `ExperienceCard`'s `CARD_SIZES` breakpoint and `app/globals.css`'s card width,
 * so the two copies of "300" that used to be possible are one.
 *
 * The one number that is NOT his is the card's own aspect: his document draws a
 * `3/3.6` figure with a body of type beneath it, and this card carries its words
 * on the photograph — see `ExperienceStrip.tsx` for why a cream page cannot take
 * his dark foot, and `ExperienceCard.tsx`'s `CARD_BOX` for what the 0.74 costs
 * the six photographs.
 */
export const STRIP = {
  /**
   * The widest a card is ever drawn.
   *
   * **340, and it is 300 in the client's own design document — the difference is
   * non-negotiable #8 and it was swept, not guessed.** His
   * `.card { flex: 0 0 min(300px, 78vw) }` measured `05 · Experiences` at
   * **45.4% empty, over his own 45% ceiling**, because a strip is a short chapter
   * and the header band above it is structurally sparse: one heading, one
   * paragraph, a 300px drawing, and 1,344px of width to spend them across. The
   * only lever this chapter has is the size of its photographs, exactly as the
   * coverflow's was (`docs/DECISIONS.md` §20.4), so it was swept:
   *
   * | `cardMaxPx` | `field-days` mean / worst | page mean | cards at 1440 |
   * |---|---|---|---|
   * | 300 (his) | **45.4% / 45.4%** — over | 38.4% | 4 whole + a 64px sliver |
   * | 320 | 42.4% / 42.4% | 38.3% | 4 whole + **4px** — no peek at all |
   * | **340** | **39.6% / 39.6%** | **38.2%** | **3 whole + 84% of a fourth** |
   * | 360 | 39.8% / 39.8% | 38.0% | 3 whole + 62% of a fourth |
   *
   * 340 is chosen over 320 twice over: 320 clears the ceiling by 2.6pp, which is
   * inside the density rig's own ±3-7pp sampling error (`docs/DECISIONS.md` §5a),
   * and at exactly 1440 it leaves a **4px** sliver of the fifth card — no peek at
   * all, on the one width the client tests on. It is chosen over 360 because the
   * two are indistinguishable on density (0.2pp, well inside that same error) and
   * 340 shows more of the fourth card.
   *
   * **It is a FIXED width rather than a share of the container**, which is the
   * whole difference between a strip and a grid, and that shape is his and is
   * unchanged.
   *
   * **It is also within every photograph's own width, which the coverflow's cap
   * never was.** The five cropped frames are 710 / 542 / 493 / 493 / 444px wide
   * (`scripts/build_images.mjs`), so a 340px card is served at 1.31-2.09 source
   * pixels per CSS pixel at DPR 1 — the first time this chapter has had margin
   * rather than a ceiling, and `potters-hands` at 444px is what bounds any
   * further rise. At DPR 2 it asks for 680 and not one of the six clears it; that
   * is the standing ask in `docs/OWED-ORIGINALS.md`, not a reason to shrink the
   * card.
   */
  cardMaxPx: 340,
  /**
   * The card's width below the cap, as a percentage of the viewport.
   *
   * His document's `78vw`, unchanged by the sweep above. The cap binds from
   * 436px up (`ceil(340 / 0.78)`), so this arm is only ever what a phone gets —
   * 304px at 390 — and the 38px of the next card it leaves showing past a 342px
   * container is the best affordance the strip has at that width.
   */
  cardVw: 78,
  /** The space between two cards. His document's `gap: 20px`. */
  gapPx: 20,
  /**
   * The card's own shape, as two integers — 37/50 = 0.74:1.
   *
   * `ExperienceCard`'s `CARD_BOX` is `cardBoxW / cardBoxH` and its
   * `aspect-[37/50]` class is the same pair written for Tailwind;
   * `lib/sizes.test.ts` holds those two to each other in both directions.
   *
   * **Retuning it does not buy a legal crop.** Five of the six photographs are
   * 1.5:1 or wider, this project bounds a width crop at 25%, and the narrowest
   * box that bound allows for a 1.5:1 frame is 1.1265 — a landscape box. So
   * every portrait ratio is equally illegal by `cover`, and the crops are made
   * by hand in the image pipeline instead. See `CARD_BOX`.
   */
  cardBoxW: 37,
  cardBoxH: 50,
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
 * strip's own box is measured against (`ExperienceCard.tsx`'s `CARD_BOX`);
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
 * **`boxW`/`boxH` are `jungle-cats-stitch`'s own emitted dimensions.** They were
 * the band's box until 20 Aug 2026 — box aspect equal to image aspect, so
 * `object-fit: cover` cropped neither axis — and they are still what every crop
 * figure below is measured against, but they are no longer a `sizes` box. See
 * `minHeightVw` for what replaced them and why.
 *
 * **The words went back onto the photograph on 20 Aug 2026, which reverses the
 * 19 Aug arrangement, and the client has seen both.** His instruction: *"I
 * wanted you to place and align all the text for 02-The Jungles on the image as
 * it was on the earlier tiger image with the 3D raised effect… the image itself
 * should look like the background for this section, exactly like we have done
 * for the last section."*
 *
 * That is also the fix for why 19 Aug moved them off. The band was then a box of
 * a FIXED aspect with `overflow: hidden`, so at 390 it was 390 x 166px, the
 * heading was cut off at the top and the paragraph's last line ran off the
 * bottom of the photograph onto cream **as cream type on cream**. The section is
 * now built the way `components/sections/Invitation.tsx` is — the photograph is
 * an absolutely positioned background with a `Scrim` over it, and the section's
 * height is its own content against a floor — and a section built that way
 * cannot clip its text, it grows. That is the whole difference between the
 * client's instruction and what failed.
 *
 * Two figures kept from the arrangement it replaces, because both still bind:
 *
 * - At 100svh, `FullBleed` oversized the picture to 127.6vh for parallax and
 *   `cover` drew this 2.357:1 photograph **2,706px wide from a 1,440px file** at
 *   1440x900 — ratio 0.53, the softest on the site — with the panther at its
 *   left edge and the tiger at its right both outside the viewport. Nothing here
 *   goes near a `viewportHeightVh` box again.
 * - At 1920 the band is drawn 1,920px from the same 1,440px file (ratio 0.75)
 *   and `check_image_resolution.mjs` reports it `atLibraryCeiling` rather than
 *   as a failure — the library has nothing wider. Holding the band at 1,440px
 *   with cream either side would fix that number and breach non-negotiable #8 in
 *   the same move, which is the trade the plate boards already settled
 *   (`DECISIONS.md` §19: at one column the plate fills the container).
 */
export const JUNGLE_BAND = {
  /** `jungle-cats-stitch`'s emitted width. */
  boxW: 1440,
  /** Its emitted height. 1440/611 = 2.357:1. */
  boxH: 611,
  /**
   * The band's floor, as a percentage of the viewport's WIDTH — the
   * `min-h-[31vw]` class in `JunglesBand.tsx`, which `lib/sizes.test.ts` holds
   * to this number by reading the component's own source.
   *
   * **This is the crop, and it is the client's third request of 20 Aug 2026**:
   * *"I like that you have cropped the image length and made it thinner, but I
   * would like for you to crop it a bit more on its length."* The photograph's
   * own height at full width is 100/2.357 = **42.4vw**, which is what the band
   * was; 31vw takes another **26.8%** off its length. Nothing is cropped
   * horizontally at any width where the band is at its floor, which is the half
   * that matters: this is a stitched composite with a black panther at its left
   * edge and a tiger at its right, so height is the only axis it can lose.
   *
   * **A width unit, not a height one, and that is deliberate.** The band's shape
   * is then a property of the band rather than of the visitor's screen: it is
   * the same crop of the same photograph on a 1440x900 laptop, a 1366x768 one
   * and a phone held sideways. Keying a photograph's geometry to viewport height
   * is what CLAUDE.md's `short:`/`pocket:` note is about, and a `vh` floor here
   * would also make the box's own aspect depend on the viewport's — which is
   * exactly the coupling `coverAspectFloor` below exists to avoid.
   */
  minHeightVw: 31,
  /**
   * The smallest aspect ratio the band's box is ever asked to be, for `sizes`.
   *
   * **The band is a floor plus its own words, not a fixed shape** (20 Aug 2026 —
   * the section grows rather than clipping, which is the entire point of the
   * rebuild), so there is no one ratio to hand `coverSizes`. What it needs is a
   * LOWER bound: `cover` draws `boxWidth x max(1, imageAspect / boxAspect)`, so
   * under-stating the box's aspect over-states the pixels drawn, and
   * `ui/Photo.tsx`'s rule is that a `sizes` rounds up where it is unsure.
   *
   * 0.6 is that bound with room. Measured on the built page across a thirteen-
   * width sweep, the band's own box aspect runs **0.74 at 360x844** — its
   * tallest and narrowest case, where the words plus the header's clearance are
   * a long way past the floor — 0.85 at 390, 1.69 at 768, 2.77 at 1024, and
   * exactly 3.23 (the floor) from 1100 up. Figures in
   * `docs/reviews/2026-08-19-home-v2/panels-and-band.md`. The margin between
   * 0.74 and 0.6 is what a later edit to `content/home.ts`'s two paragraphs is
   * allowed to spend before this stops being true;
   * `scripts/check_image_resolution.mjs` is the gate that says so, and it is the
   * only gate — a growing box produces no `aspect-*` class for
   * `lib/sizes.test.ts`'s ratio tripwire to read.
   *
   * **What the margin costs is one file tier on a DPR-1 phone, and that was
   * checked.** At 0.6 the band asks for 393vw, so every viewport fetches the
   * 1,440px file — the library's widest, and the right answer everywhere from
   * 768 up and on any phone at DPR 2 or more, where the drawn width alone
   * demands more than 1,440. Only a DPR-1 handset over-fetches, by one tier.
   */
  coverAspectFloor: 0.6,
} as const;

/** True when the visitor has asked their device to reduce motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
