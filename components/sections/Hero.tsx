import { preload } from "react-dom";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { SplitLines } from "@/components/motion/SplitLines";
import { Photo, servedSizes } from "@/components/ui/Photo";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import type { ChapterLike } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey } from "@/content/home";
import { media } from "@/lib/media";

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
export const HERO_BOX = { viewportHeightVh: 100 } as const;

/**
 * The photograph fills the viewport; the headline sits bottom-left in cream
 * display serif. Nothing competes with it.
 *
 * Three deliberate absences:
 *
 * 1. **No parallax.** This photograph is the LCP element. Parallax is a scrubbed
 *    transform, so it costs nothing until the visitor scrolls — by which time the
 *    hero is leaving anyway. All risk, no visible return.
 * 2. **`<ImageReveal static>`.** Lighthouse stops the LCP timer on the *final*
 *    frame of any animation applied to the element, so a 1.2s mask here is 1.2s
 *    straight onto the metric (CLAUDE.md non-negotiable #6).
 * 3. **`SplitLines` will not animate this headline off the scroll**, by its own
 *    design — it is on screen at hydration, and animating settled text means
 *    dropping it out of view to lift it back. That was measured as a real
 *    flicker in Task 5.
 *
 *    **Since 20 Aug 2026 it does animate it off the welcome screen instead**, on
 *    the client's report that the effect was not noticeable here — it was not
 *    happening here. `curtained` is the opt-in and
 *    `components/motion/useCurtainReveal.ts` is the argument; the short version
 *    is that the flicker above is a statement about a visitor who can see the
 *    headline, and for the length of the welcome curtain there is no such
 *    visitor. Nothing about the photograph changed: points 1 and 2 are untouched
 *    and `<ImageReveal static>` is still what keeps the LCP timer clean.
 *
 * So the hero photograph is still, and its headline moves once, as the welcome
 * lifts. Everything else starts one screen down, which is also where the visitor
 * starts scrolling.
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
export const DEFAULT_SCRIM: ScrimStrength = { top: 0.92, bottom: 0.5, corner: 0.78 };

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
  const resolvedCopy = copy ?? (chapterCopy(chapter.id as ChapterCopyKey) as HeroCopy);
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
    imageSrcSet: heroImage.sources.map((s) => `${s.avif} ${s.width}w`).join(", "),
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
        <ImageReveal static noZoom className="h-full w-full">
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
            pictureClassName="block h-full w-full"
            className="h-full w-full object-cover"
          />
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
        {/*
         * **`curtained slow` — client, 20 Aug 2026:** *"the 3D effect on the
         * section where our website opens (The Journey Begins) … is not
         * noticeable as it is on the last section."* Measured before it was
         * believed, and he was understating it: this headline's lines travelled
         * **0px**, because `useInView` refuses to stage anything already on
         * screen at mount and this is the one headline that always is.
         *
         * `curtained` is the exception `components/motion/useCurtainReveal.ts`
         * exists for, and the welcome screen is the whole reason it is safe —
         * the staging happens behind an opaque curtain and the rise begins
         * three-quarters of the way through that curtain's fade. **Point 3
         * below still holds and is not being argued with**: a headline on screen
         * with somebody looking at it is still left alone, and if hydration
         * arrives after the curtain has started to thin, the hook declines and
         * this headline behaves exactly as it did before.
         *
         * `slow` because the travel is the page's largest — 92px of type rises
         * ~108px at 1440 — and `DURATION.reveal` over that distance reads as a
         * jump where 1.4s reads as the page opening. It is also the only reveal
         * on the page that starts partly hidden, so a longer one puts more of
         * itself in plain sight: ~1.24s visible against ~0.84s.
         */}
        <SplitLines
          as="h1"
          curtained
          slow
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
