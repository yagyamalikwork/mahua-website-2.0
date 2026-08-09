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
 *
 * **`tight` + a wider measure, Task 15 (9/10 Aug 2026).** At 640px this is the
 * shortest chapter on either page (0.71 of a 900px screen), so
 * `measure_density.mjs` scores it on the single window centred over it —
 * `vann-forest` measured 72.6% empty, `tola-reserve` 72.1%. `ChapterSurface`'s
 * `tight` rhythm takes back the padding it does not need (see that
 * component's own comment); the body copy's own column widens from 62ch to
 * 92ch for the same reason non-negotiable #8's own precedent gives width to a
 * photograph — there is no photograph here to give it to, so it goes to the
 * only content this chapter has, its two paragraphs. A first pass at 78ch
 * (measured, not assumed) only brought `vann-forest` to 60.3% — a real
 * improvement, still over the ceiling — so the measure widened again rather
 * than declared close enough. The heading keeps its own tighter 22ch cap
 * (nested inside this wider column, so it is unaffected) — the display line
 * is meant to stay short; the prose was not.
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
    <ChapterSurface id={chapter.id} surface={surface} tight>
      <div className="mx-auto max-w-[92ch] text-center">
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
