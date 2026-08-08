import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { PillButton } from "@/components/ui/PillButton";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import { ENTER } from "@/lib/motion";

export type FieldNotesCopy = {
  readonly heading: TwoTone;
  readonly gettingThere: readonly { readonly label: string; readonly value: string }[];
  readonly address: string;
  readonly bookLabel: string;
  readonly enquireLabel: string;
  readonly siblingLabel: string;
};

/**
 * The field notes register's close — getting there, the address, and the
 * one quiet ask of the whole page. No photography: this band is built to be
 * scanned, and the gear-change from the story above it is legibility and
 * density, not colour or motion.
 */
export function FieldNotes({
  chapter,
  copy,
  bookHref,
  enquireHref,
  siblingHref,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: FieldNotesCopy;
  bookHref: string;
  enquireHref: string;
  siblingHref: string;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-20">
        <Enter>
          <div>
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} />
            )}
            <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            <dl className="mt-8 space-y-4">
              {copy.gettingThere.map((fact) => (
                <div key={fact.label} className="border-t pt-3" style={{ borderColor: "var(--accent)" }}>
                  <dt
                    className="font-[family-name:var(--font-label)] text-[0.65rem] uppercase tracking-[0.2em]"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {fact.label}
                  </dt>
                  <dd
                    className="mt-1 font-[family-name:var(--font-body)] text-[1.02rem]"
                    style={{ color: "var(--text)" }}
                  >
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 font-[family-name:var(--font-body)] text-sm" style={{ color: "var(--dim)" }}>
              {copy.address}
            </p>
          </div>
        </Enter>

        <Enter delay={ENTER.stagger}>
          <div className="flex flex-col items-start gap-6 lg:justify-center">
            <div className="flex flex-wrap items-center gap-4">
              <PillButton href={bookHref} size="large" external>
                {copy.bookLabel}
              </PillButton>
              <PillButton href={enquireHref} size="large">
                {copy.enquireLabel}
              </PillButton>
            </div>
            <a
              href={siblingHref}
              className="rule-in rule-in--rest inline-block pb-1 font-[family-name:var(--font-label)] text-[0.7rem] uppercase tracking-[0.22em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
              style={{ color: "var(--accent-text)" }}
            >
              {copy.siblingLabel}
            </a>
          </div>
        </Enter>
      </div>
    </ChapterSurface>
  );
}
