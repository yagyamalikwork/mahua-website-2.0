import { preload } from "react-dom";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Parallax } from "@/components/motion/Parallax";
import { SplitLines } from "@/components/motion/SplitLines";
import { Photo, servedSizes } from "@/components/ui/Photo";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import type { ChapterLike } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey } from "@/content/home";
import { media } from "@/lib/media";
import { HERO_DRIFT } from "@/lib/motion";

export type HeroCopy = {
  readonly headline: string;
  readonly sub: string;
  readonly scrollCue: string;
};

/**
 * The hero's box: the full viewport, `min-h-[100svh]` with the photograph
 * `absolute inset-0` inside it. `100vw` is its width; `HERO_BOX` is its height,
 * and the two together are what `lib/sizes.ts` turns into the width the browser
 * actually draws. Used by both the preload and the `<img>`, through one call.
 */
export const HERO_SIZES = "100vw";
/**
 * **`100 * HERO_DRIFT.oversize`, not 100, since 21 Aug 2026.** The photograph is
 * drawn taller than the viewport so its drift has somewhere to go, and `box` has
 * to describe the box that is actually drawn or `sizes` under-states it.
 *
 * **Both the `<img>` and the `preload()` below read this one constant**, which
 * is what keeps them asking for the same candidate. They must: a preload that
 * names a different width from the one the `<picture>` then chooses makes the
 * page fetch the hero twice, and `scripts/measure_first_fold.mjs` fails a run
 * where any photograph is downloaded at two widths.
 *
 * It changes no file in practice — `sizes` already resolved to the library's
 * widest tier at every viewport — but stating the wrong box would be a figure
 * `check_image_resolution.mjs` reasons from.
 */
export const HERO_BOX = {
  viewportHeightVh: 100 * HERO_DRIFT.oversize,
} as const;

/**
 * The photograph fills the viewport; the headline sits bottom-left in cream
 * display serif. Nothing competes with it.
 *
 * Three deliberate absences:
 *
 * 1. **Parallax at half strength, since 21 Aug 2026 — and this point used to say
 *    "none".** The old reasoning was that this photograph is the LCP element and
 *    that the effect is "all risk, no visible return" because the hero is leaving
 *    by the time anyone scrolls. The risk half was always overstated in its own
 *    sentence: a scrubbed transform costs nothing until the visitor scrolls, so
 *    the arrival clock never sees it. The return half was a judgement, and the
 *    client made the opposite one — the drift is the whole of the "floating"
 *    effect he asked for. `HERO_DRIFT` carries the strength and what it crops.
 * 2. **`<ImageReveal static>`.** Lighthouse stops the LCP timer on the *final*
 *    frame of any animation applied to the element, so a 1.2s mask here is 1.2s
 *    straight onto the metric (CLAUDE.md non-negotiable #6).
 * 3. **`SplitLines` will not animate this headline**, by its own design — it is
 *    on screen at hydration, and animating settled text means dropping it out of
 *    view to lift it back. That was measured as a real flicker in Task 5.
 *
 *    **A `curtained` variant that staged it behind the welcome screen shipped
 *    for one day, 20-21 Aug 2026, and the client removed it.** He had asked for
 *    a *"3D effect"* here and this was the wrong reading of it: what he meant was
 *    the closing chapter's depth — its photograph drifting while its words stay
 *    still — not a line-by-line rise. The machinery is gone rather than left
 *    switched off; the effect he wanted is point 1 above, reversed.
 *
 * So the hero's words are still, and its photograph is not.
 *
 * Cream type over a photograph, not white: `--bg` is already the page's paper and
 * reads warmer over a dusk photograph than pure white does. Its contrast against
 * the scrim is measured in `docs/reviews/2026-08-04-task-7/`.
 *
 * **`scrim` is a prop, not a constant, because it is a property of the
 * photograph, not of this component.** `DEFAULT_SCRIM` below is the home
 * page's own figure, tuned against `reception-path-dusk` and unchanged since
 * — every existing caller that passes no `scrim` gets it exactly as before.
 * Reusing this component for Mahua Vann's hero (9 Aug 2026, task 8) with that
 * same fixed scrim over a *different* photograph — a bright ochre veranda
 * wall — measured the headline's worst word ("hour", the one furthest from
 * the corner wedge) at 2.79:1 against the 3.0 floor: a real, silent failure,
 * because the one rig that checks this (`scripts/check_contrast_over_photos.mjs`)
 * is hardcoded to the home page's own section ids and never reaches this
 * page's hero at all. Raising `corner` alone to 0.88 (measured the same way
 * the original figure was: worst pixel under the type, raised until it
 * clears) brings it to 3.07. See `docs/reviews/2026-08-08-property-pages/`.
 */
export const DEFAULT_SCRIM: ScrimStrength = {
  top: 0.92,
  bottom: 0.5,
  corner: 0.78,
};

export function Hero({
  chapter,
  copy,
  scrim = DEFAULT_SCRIM,
}: {
  chapter: ChapterLike;
  copy?: HeroCopy;
  scrim?: ScrimStrength;
}) {
  // One documented narrowing per section: `Chapter.id` is widened to `string` on
  // the exported type, and nothing in the type system ties a `kind` to the shape
  // of the copy that kind renders. `content/home.test.ts` guards the join itself.
  const resolvedCopy =
    copy ?? (chapterCopy(chapter.id as ChapterCopyKey) as HeroCopy);
  const heroImage = media(chapter.media[0]);

  // `react-dom`'s `preload`, not a `<link>` in the JSX. A hand-written
  // `<link rel="preload">` renders exactly where it sits in the tree — measured
  // at byte 9,632 of the document, three lines above the `<picture>` it was
  // meant to get ahead of, which buys nothing. `preload()` is hoisted into
  // `<head>`, so the preload scanner meets it in the first kilobyte.
  //
  // Measured on Slow 4G at 412px/DPR 1.75 before this: the hero was 65 KB and
  // took 1,874 ms to arrive, because twelve requests were sharing six HTTP/1.1
  // connections and it was getting roughly a sixth of the pipe. That is an
  // ordering problem, not a byte problem, and no amount of re-encoding fixes it.
  //
  // `imageSizes` **must** be the same string `Photo` emits, and `type` the same
  // format the first `<source>` offers, or the preload fetches a candidate the
  // `<picture>` then declines and the page pays for the hero twice.
  // `scripts/measure_first_fold.mjs` fails the run if any photograph is ever
  // downloaded at two widths in one load, which is what that mistake looks like.
  // `href` is required by the API and ignored by the browser whenever
  // `imageSrcSet` carries `w` descriptors.
  preload(heroImage.avif, {
    as: "image",
    type: "image/avif",
    imageSrcSet: heroImage.sources
      .map((s) => `${s.avif} ${s.width}w`)
      .join(", "),
    imageSizes: servedSizes(chapter.media[0], HERO_SIZES, HERO_BOX),
    fetchPriority: "high",
  });

  return (
    <section
      id={chapter.id}
      className="relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div className="absolute inset-0 -z-10">
        <ImageReveal static noZoom className="drift-frame h-full w-full">
          {/*
            **The drift — client, 21 Aug 2026, at half strength by his own
            choice.** He asked for the closing chapter's depth here too: the
            photograph moving while the words stay still, which is what lifts the
            type off the frame. `HERO_DRIFT` carries why it is half and what the
            crop costs.

            **Point 1 above is narrowed rather than overturned.** It said no
            parallax on this photograph, on the grounds that it is the LCP
            element and the effect is "all risk, no visible return" — the risk
            half is answered (the tween library is fetched only when the element
            is within a screen, and scrubs nothing until the visitor scrolls, so
            the arrival clock never sees it), and the client has ruled on the
            return half, which was always a judgement rather than a measurement.
            Points 2 and 3 stand untouched: `static` still keeps a 1.2s mask off
            the LCP timer, and the headline still does not move.
          */}
          <Parallax strength={HERO_DRIFT.strength}>
            <Photo
              id={chapter.media[0]}
              decorative
              priority
              // The one photograph on the page that genuinely is the viewport, and
              // the only one whose arrival the visitor sits and waits for. It is
              // also the one whose tier is a deliberate trade rather than an
              // arithmetic result — see the note on `HERO_SIZES`.
              sizes={HERO_SIZES}
              box={HERO_BOX}
              pictureClassName="block w-full"
              /* Oversized and re-centred before `Parallax` touches it, from the
                 one dial — see `HERO_DRIFT` and `driftOversize`. */
              pictureStyle={{
                height: `${HERO_DRIFT.oversize * 100}%`,
                position: "relative",
                top: `-${((HERO_DRIFT.oversize - 1) / 2) * 100}%`,
              }}
              className="h-full w-full object-cover"
            />
          </Parallax>
        </ImageReveal>
      </div>

      {/* `top` is set by the wordmark, which sits centred over the one blown-out
          patch of sky in the frame and is the tightest measurement on the page;
          `corner` is set by the headline, which crosses a white car and a lit
          veranda (home page) or a lit ochre wall (Mahua Vann). Both raised
          until the *worst* pixel under the type cleared its floor — figures in
          docs/reviews/2026-08-04-task-7/contrast.json and, for Vann's own hero,
          docs/reviews/2026-08-08-property-pages/. */}
      <div className="absolute inset-0 -z-10">
        <Scrim {...scrim} />
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-6 pb-14 md:px-12 md:pb-20 short:pb-8">
        <SplitLines
          as="h1"
          className="max-w-[15ch] font-[family-name:var(--font-display)] text-[clamp(2.6rem,6.6vw,5.75rem)] font-light leading-[1.02] tracking-[-0.015em] text-[color:var(--bg)] short:text-[clamp(2rem,5vw,3.25rem)]"
        >
          {resolvedCopy.headline}
        </SplitLines>

        <p className="mt-6 max-w-[46ch] font-[family-name:var(--font-body)] text-lg leading-relaxed text-[color:var(--bg)] opacity-90 md:text-xl short:mt-3 short:text-base">
          {resolvedCopy.sub}
        </p>

        <div className="mt-10 flex items-center gap-4 short:mt-5">
          <span
            aria-hidden="true"
            className="block h-px w-12 shrink-0"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <span className="font-[family-name:var(--font-label)] text-[0.65rem] uppercase tracking-[0.3em] text-[color:var(--bg)] opacity-85 md:text-xs">
            {resolvedCopy.scrollCue}
          </span>
        </div>
      </div>
    </section>
  );
}
