import { WELCOME_LOGO as LOGO } from "@/lib/welcome-logo";

/**
 * The two `sizes` strings, exported so `lib/sizes.test.ts` holds them to the same
 * round-trip guarantee as every other one on the page.
 *
 * Each part is drawn at its own fraction of the whole logo, and those fractions
 * come from the artwork — see `lib/welcome-logo.ts`. Written out rather than
 * computed at module scope so the strings a reviewer reads are the strings the
 * browser gets.
 */
export const WELCOME_FLOWER_SIZES = "(min-width: 768px) 162px, 110px";
export const WELCOME_WORDMARK_SIZES = "(min-width: 768px) 280px, 190px";

/**
 * The welcome: the client's own stacked logo on cream, its flower turning once,
 * and then it goes. Client request, 8 Aug 2026.
 *
 * ## It is the client's real logo, in two pieces
 *
 * **Not the header's lockup.** The header assembles a horizontal mark from the
 * flower plus live type, because the client's brown is unreadable over the hero
 * photograph (see `BrandMark`). None of that applies here: this is cream, there is
 * no photograph, and the client asked for the actual logo — flower above MAHUA
 * above RESORTS, as they drew it.
 *
 * It arrives as two images because **the flower has to turn and the words must
 * not**. `scripts/build_welcome_logo.mjs` finds the split by scanning the
 * artwork's own bands of ink rather than by a hard-coded line, and records each
 * part's box as a fraction of the whole. Laying them back out at those fractions
 * reproduces the client's logo exactly; the only thing that differs is that one
 * of the two can rotate.
 *
 * The source is the `.png`, not the `.jpg` the client linked — same artwork in
 * the same folder, but a JPEG cannot carry transparency and would put a white
 * square on cream.
 *
 * ## It still has no JavaScript
 *
 * Everything in the previous version holds and is the reason this is safe: the
 * screen is server-rendered, a CSS animation takes it away, and **its base style
 * is hidden** so that an animation which never runs means no welcome rather than
 * a cream wall with no way past. Rules under `[data-welcome]` in
 * `app/globals.css`; durations in `lib/motion.ts` as `WELCOME`.
 *
 * ## Bytes
 *
 * ~20 KB at 1x, and none of it in the first load: both parts are `loading="lazy"`
 * — which is safe here *because* they are decorative and the screen fails towards
 * being absent. The header's own flower is a different, smaller file and is
 * untouched.
 */
export function WelcomeScreen() {
  const part = (
    name: "flower" | "wordmark",
    geo: { x: number; y: number; w: number; h: number; widths: readonly number[] },
    sizes: string,
    className: string,
  ) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={name}
      src={`/brand/welcome-${name}-${geo.widths[0]}.webp`}
      srcSet={geo.widths.map((w) => `/brand/welcome-${name}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      alt=""
      aria-hidden="true"
      /*
       * **Not `loading="lazy"` — but not for the reason you would guess, and the
       * guess was measured and wrong.** These two are the only thing on the first
       * screen a visitor sees, so deferring them is wrong on its face; the
       * hypothesis was also that lazy images, requested only once layout is known,
       * were landing mid-flight against the hero and stealing bandwidth from it.
       * Medians of five, one build apart: **lazy 4,306 ms, eager 4,31x ms.** No
       * difference. The welcome's cost to the hero is the bytes and the two
       * requests themselves, not when they are asked for, and no arrangement of
       * these attributes recovers it — see `docs/DECISIONS.md` §14.
       *
       * `fetchPriority="low"` stays: they must never outrank the hero's own
       * preload.
       */
      decoding="async"
      fetchPriority="low"
      className={className}
      style={{
        position: "absolute",
        left: `${geo.x * 100}%`,
        top: `${geo.y * 100}%`,
        width: `${geo.w * 100}%`,
        height: `${geo.h * 100}%`,
      }}
    />
  );

  return (
    <div
      data-welcome
      /*
       * `aria-hidden`: a decorative curtain over content that is already in the
       * DOM and already announced. A screen reader should be reading the page,
       * not a logo on its way out.
       */
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 flex items-center justify-center bg-[color:var(--bg)]"
    >
      <div
        data-welcome-logo
        className="relative w-[190px] md:w-[280px]"
        style={{ aspectRatio: `${LOGO.width} / ${LOGO.height}` }}
      >
        {/*
         * `emblem-turn` is the header's own keyframe set, so the two can never
         * describe different turns; only the duration differs, overridden under
         * `[data-welcome]` in `app/globals.css`. It rotates about its own centre,
         * which for an absolutely-positioned box is the default — the flower is
         * a radial mark and has no other sensible pivot.
         */}
        {part("flower", LOGO.flower, WELCOME_FLOWER_SIZES, "emblem-turn")}
        {part("wordmark", LOGO.wordmark, WELCOME_WORDMARK_SIZES, "")}
      </div>
    </div>
  );
}
