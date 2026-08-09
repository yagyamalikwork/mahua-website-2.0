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
 *
 * **`tight` + larger type, Task 15 (9/10 Aug 2026) — and a stacked layout
 * that was tried and reverted.** At 545px (0.61 of a 900px screen) this was
 * the emptiest chapter on either page — `measure_density.mjs` scored
 * `vann-press` at 88.4%, sandwiched between the tail of `vann-day` and the
 * head of `vann-invitation` with almost nothing in the window that was a
 * photograph. `tight` padding plus one step of larger type (`text-xl`→
 * `text-2xl`, `0.98rem`→`1.05rem`, the standfirst's cap dropped from 44ch)
 * brought it to 87.2% — measured, not assumed.
 *
 * A single-column, publication-beside-copy layout was tried next, on the
 * theory that a `lg:grid-cols-3` grid put every line in a column a third of
 * the screen wide. Measured, it made the chapter *taller* (0.57 → 0.85
 * screens) and *emptier* (87.2% → 89.6%): a headline and a one-sentence
 * standfirst are short strings that do not stretch to fill a wider box, they
 * just sit in more of it, and the extra vertical rhythm the stacked rows
 * added diluted the same words over more area. Reverted for that reason —
 * see `docs/reviews/2026-08-09-property-redesign/README.md` for both
 * readings. `vann-press` is reported there as a chapter the ceiling could
 * not be brought inside of without either enlarging three press citations
 * past what "set quietly" (this component's own opening line) means, or
 * inventing content non-negotiable #6 already forbids.
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
    <ChapterSurface id={chapter.id} surface={surface} tight>
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
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-light leading-snug text-[color:var(--text)]">
                  {article.headline}
                </h3>
                <p
                  className="mt-3 font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.7]"
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
