import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import type { MediaId } from "@/lib/media";
import { ENTER } from "@/lib/motion";

/** `hero` takes the row; `quiet` sits in a pair with air around it. */
export type ExperienceWeight = "hero" | "quiet";

export type ExperienceCopy = {
  readonly mediaId: MediaId;
  readonly name: string;
  readonly line: string;
  readonly weight: ExperienceWeight;
};

export type ExperiencePairCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly experiences: readonly ExperienceCopy[];
  /**
   * The offerings that are real but do not set the tone — karaoke, the
   * conference hall, indoor games. Client's ruling, 9 Aug: name them
   * honestly, in one quiet line, rather than either promoting or deleting
   * them. Omitted entirely when a property has nothing left over.
   */
  readonly alsoLine?: string;
};

export const EXPERIENCE_SIZES: Record<ExperienceWeight, string> = {
  hero: "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
  quiet: "(min-width: 1600px) 736px, (min-width: 640px) 50vw, calc(100vw - 48px)",
};

export const EXPERIENCE_BOXES: Record<ExperienceWeight, number> = { hero: 2 / 1, quiet: 4 / 5 };

const FRAME: Record<ExperienceWeight, string> = { hero: "aspect-[2/1]", quiet: "aspect-[4/5]" };

/**
 * The day, as six experiences at two weights.
 *
 * The two most cinematic take a full row; the rest sit in pairs, portrait, at
 * half the width. Two weights rather than one is the whole point — a grid of
 * six equal thumbnails is the live WordPress site's own tab widget, which is
 * what these pages are replacing.
 */
export function ExperiencePair({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: ExperiencePairCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            </div>
          </Enter>
          <Enter delay={ENTER.stagger}>
            <p
              className="max-w-[58ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </Enter>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-12 sm:grid-cols-2">
          {copy.experiences.map((e, i) => (
            <div key={e.name} className={e.weight === "hero" ? "sm:col-span-2" : ""}>
              <Enter delay={ENTER.stagger * (i % 2)}>
                <article>
                  <ImageReveal className={`block w-full ${FRAME[e.weight]}`}>
                    <Photo
                      id={e.mediaId}
                      sizes={EXPERIENCE_SIZES[e.weight]}
                      box={EXPERIENCE_BOXES[e.weight]}
                      pictureClassName="block h-full w-full"
                      className="h-full w-full object-cover"
                    />
                  </ImageReveal>
                  <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-light leading-tight text-[color:var(--text)] md:text-2xl">
                    {e.name}
                  </h3>
                  <p
                    className="mt-2 max-w-[46ch] font-[family-name:var(--font-body)] text-[1rem] leading-[1.7]"
                    style={{ color: "var(--dim)" }}
                  >
                    {e.line}
                  </p>
                </article>
              </Enter>
            </div>
          ))}
        </div>

        {copy.alsoLine && (
          <Enter>
            <p
              className="mt-12 max-w-[70ch] border-t pt-5 font-[family-name:var(--font-body)] text-sm italic"
              style={{ borderColor: "var(--accent)", color: "var(--dim)" }}
            >
              {copy.alsoLine}
            </p>
          </Enter>
        )}
      </div>
    </ChapterSurface>
  );
}
