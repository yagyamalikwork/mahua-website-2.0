import { ImageReveal } from "@/components/motion/ImageReveal";
import { SplitLines } from "@/components/motion/SplitLines";
import { Photo } from "@/components/ui/Photo";
import { Scrim } from "@/components/ui/Scrim";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey } from "@/content/home";

type HeroCopy = {
  readonly headline: string;
  readonly sub: string;
  readonly scrollCue: string;
};

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
 * 3. **`SplitLines` will not animate this headline**, by its own design — it is on
 *    screen at hydration, and animating settled text means dropping it out of
 *    view to lift it back. That was measured as a real flicker in Task 5.
 *
 * So the hero is still. The motion starts one screen down, which is also where
 * the visitor starts scrolling.
 *
 * Cream type over a photograph, not white: `--bg` is already the page's paper and
 * reads warmer over a dusk photograph than pure white does. Its contrast against
 * the scrim is measured in `docs/reviews/2026-08-04-task-7/`.
 */
export function Hero({ chapter }: { chapter: Chapter }) {
  // One documented narrowing per section: `Chapter.id` is widened to `string` on
  // the exported type, and nothing in the type system ties a `kind` to the shape
  // of the copy that kind renders. `content/home.test.ts` guards the join itself.
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as HeroCopy;

  return (
    <section
      id={chapter.id}
      className="relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div className="absolute inset-0 -z-10">
        <ImageReveal static className="h-full w-full">
          <Photo
            id={chapter.media[0]}
            decorative
            priority
            // The one photograph on the page that genuinely is the viewport, and
            // the only one whose arrival the visitor sits and waits for. At 390px
            // this now resolves to the 400w tier rather than the 1440w file.
            sizes="100vw"
            pictureClassName="block h-full w-full"
            className="h-full w-full object-cover"
          />
        </ImageReveal>
      </div>

      {/* `top` is set by the wordmark, which sits centred over the one blown-out
          patch of sky in the frame and is the tightest measurement on the page;
          `corner` is set by the headline, which crosses a white car and a lit
          veranda. Both raised until the *worst* pixel under the type cleared its
          floor — figures in docs/reviews/2026-08-04-task-7/contrast.json. */}
      <div className="absolute inset-0 -z-10">
        <Scrim top={0.92} bottom={0.5} corner={0.78} />
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-6 pb-14 md:px-12 md:pb-20 short:pb-8">
        <SplitLines
          as="h1"
          className="max-w-[15ch] font-[family-name:var(--font-display)] text-[clamp(2.6rem,6.6vw,5.75rem)] font-light leading-[1.02] tracking-[-0.015em] text-[color:var(--bg)] short:text-[clamp(2rem,5vw,3.25rem)]"
        >
          {copy.headline}
        </SplitLines>

        <p className="mt-6 max-w-[46ch] font-[family-name:var(--font-body)] text-lg leading-relaxed text-[color:var(--bg)] opacity-90 md:text-xl short:mt-3 short:text-base">
          {copy.sub}
        </p>

        <div className="mt-10 flex items-center gap-4 short:mt-5">
          <span
            aria-hidden="true"
            className="block h-px w-12 shrink-0"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <span className="font-[family-name:var(--font-label)] text-[0.65rem] uppercase tracking-[0.3em] text-[color:var(--bg)] opacity-85 md:text-xs">
            {copy.scrollCue}
          </span>
        </div>
      </div>
    </section>
  );
}
