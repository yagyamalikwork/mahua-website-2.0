import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import { ENTER } from "@/lib/motion";

export type OpeningColumnCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
};

/**
 * One screen, bare cream, nothing but type.
 *
 * The page's one held breath, and what buys the right to be dense everywhere
 * else — restraint is a requirement here, not a preference (non-negotiable
 * #4). It carries no photograph on purpose: an image would make it a second
 * `ChapterIntro`, and a second anything is how these pages came to read as a
 * template.
 *
 * It is a quiet screen, so the rhythm rule (non-negotiable #10) requires
 * image-led shapes on both sides of it. Each spine places it between the
 * full-bleed hero and the map.
 */
export function OpeningColumn({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: OpeningColumnCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div className="mx-auto max-w-[62ch] text-center">
        <Enter>
          <div>
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} align="centre" />
            )}
            <TwoToneHeading heading={copy.heading} align="centre" className="mx-auto mt-7 max-w-[22ch]" />
          </div>
        </Enter>
        <Enter delay={ENTER.stagger}>
          <div className="mt-9 space-y-6">
            {copy.body.map((p, i) => (
              <p
                // Index is correct here because this list is static and never reorders,
                // filters or animates between states. See ChapterIntro for the established pattern.
                key={i}
                className="font-[family-name:var(--font-body)] text-[1.08rem] leading-[1.8] md:text-lg"
                style={{ color: "var(--dim)" }}
              >
                {p}
              </p>
            ))}
          </div>
        </Enter>
      </div>
    </ChapterSurface>
  );
}
