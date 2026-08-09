import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import { ENTER } from "@/lib/motion";

export type PressArticleCopy = {
  readonly publication: string;
  readonly headline: string;
  readonly standfirst: string;
  readonly href: string;
  readonly linkLabel: string;
};

export type PressBandCopy = {
  readonly heading: TwoTone;
  readonly articles: readonly PressArticleCopy[];
};

/**
 * What other people have written, set quietly.
 *
 * The most credible thing on the page and it was not there at all until this
 * redesign — the live site carries three for Mahua Vann and the crawl had
 * them all along. Publication names are set as type rather than as logo
 * images: three foreign wordmarks in three foreign typefaces is the one thing
 * that would make a cream page look like a press kit.
 *
 * This shape is type-led and therefore counts as a *quiet* screen for the
 * rhythm rule — see `PROPERTY_IMAGE_LED_SHAPES`.
 */
export function PressBand({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: PressBandCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <Enter>
          <div>
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} />
            )}
            <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
          </div>
        </Enter>

        <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 md:mt-12 lg:grid-cols-3">
          {copy.articles.map((article, i) => (
            <Enter key={article.href} delay={ENTER.stagger * i}>
              <article className="border-t pt-5" style={{ borderColor: "var(--accent)" }}>
                <p
                  className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
                  style={{ color: "var(--accent-text)" }}
                >
                  {article.publication}
                </p>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-light leading-snug text-[color:var(--text)]">
                  {article.headline}
                </h3>
                <p
                  className="mt-3 max-w-[44ch] font-[family-name:var(--font-body)] text-[0.98rem] leading-[1.7]"
                  style={{ color: "var(--dim)" }}
                >
                  {article.standfirst}
                </p>
                <a
                  href={article.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rule-in mt-5 inline-block pb-1 font-[family-name:var(--font-label)] text-[0.68rem] uppercase tracking-[0.22em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                  style={{ color: "var(--accent-text)" }}
                >
                  {article.linkLabel}
                </a>
              </article>
            </Enter>
          ))}
        </div>
      </div>
    </ChapterSurface>
  );
}
