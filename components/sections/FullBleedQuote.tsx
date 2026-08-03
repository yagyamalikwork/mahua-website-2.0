import { SplitLines } from "@/components/motion/SplitLines";
import { FullBleed } from "@/components/ui/FullBleed";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey } from "@/content/home";

type QuoteCopy = { readonly quote: string };

/**
 * A photograph filling the viewport with one line laid *on* it — the reference's
 * fourth move, and the page's punctuation between chapters.
 *
 * `FullBleed` supplies the photograph and its parallax and takes no children by
 * design, so the line is a sibling laid over it rather than something passed into
 * it. That constraint is worth keeping: it is why no photograph on this page can
 * end up with text on it that nobody scrimmed.
 *
 * `scrim` is per-chapter because the two photographs are not remotely alike.
 * `tiger-golden-grass` is a bright noon frame and needs a heavy even wash;
 * `lodge-facade-night` is already night-lit and needs almost nothing. Both were
 * sampled from the rendered page rather than guessed — figures in the Task 7
 * report.
 *
 * The section is `min-h-[100svh]` with the photograph absolute inside it, not a
 * 100vh photograph with the text absolute on top. The difference only shows on a
 * landscape phone, where the second arrangement puts the quote through the
 * bottom of the frame and the first grows the section instead.
 */
export function FullBleedQuote({
  chapter,
  scrim,
}: {
  chapter: Chapter;
  scrim: ScrimStrength;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as QuoteCopy;

  return (
    <section
      id={chapter.id}
      className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-6 py-24 md:px-12 short:py-14"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div className="absolute inset-0 -z-10">
        <FullBleed id={chapter.media[0]} heightVh={100} />
      </div>
      <div className="absolute inset-0 -z-10">
        <Scrim {...scrim} />
      </div>

      <SplitLines
        as="p"
        slow
        className="max-w-[22ch] text-center font-[family-name:var(--font-display)] text-[clamp(1.9rem,4.6vw,3.9rem)] font-light leading-[1.16] tracking-[-0.01em] text-[color:var(--bg)] short:text-[clamp(1.5rem,3.6vw,2.4rem)]"
      >
        {copy.quote}
      </SplitLines>
    </section>
  );
}
