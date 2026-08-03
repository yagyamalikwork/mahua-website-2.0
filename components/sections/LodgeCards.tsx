import { ImageReveal } from "@/components/motion/ImageReveal";
import { Reveal } from "@/components/motion/Reveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type LodgeCopy, type TwoTone } from "@/content/home";

type LodgesCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly lodges: readonly LodgeCopy[];
};

/**
 * The two properties, two photographs each. This is the first cream screen the
 * visitor reaches and the one that has to prove the page is not the old template,
 * so both lodges lead with a large photograph and carry a second laid over its
 * corner — the asymmetric pair, not a card with a thumbnail.
 *
 * `content/chapters.ts` states that the four images are ordered
 * `[Vann exterior, Vann room, Tola pool, Tola suite]` and that this component
 * reads them positionally, so the pair for lodge *n* is `media[2n]` and
 * `media[2n + 1]`. Written as a slice of the pair rather than as four named
 * constants precisely so that adding a third lodge later is a content change.
 *
 * The overlap alternates side between the two cards. The links are absolute URLs
 * to the properties' own pages on the live site, so they are ordinary external
 * links and say so.
 */
export function LodgeCards({ chapter, surface = false }: { chapter: Chapter; surface?: boolean }) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as LodgesCopy;

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <Reveal>
          <div className="flex flex-col items-center text-center">
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} align="centre" />
            )}
            <TwoToneHeading heading={copy.heading} align="centre" className="mt-6 max-w-[16ch]" />
            <p
              className="mt-7 max-w-[62ch] font-[family-name:var(--font-body)] text-[1.08rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-16 md:mt-20 lg:grid-cols-2 lg:gap-x-14">
          {copy.lodges.map((lodge, i) => {
            const primary = chapter.media[i * 2];
            const secondary = chapter.media[i * 2 + 1];
            const overlapLeft = i % 2 === 1;

            return (
              <article key={lodge.name}>
                <div className="relative pb-[26%] lg:pb-[22%]">
                  <ImageReveal className="block aspect-[4/3] w-full">
                    <Photo
                      id={primary}
                      pictureClassName="block h-full w-full"
                      className="h-full w-full object-cover"
                    />
                  </ImageReveal>
                  <div
                    className={`absolute bottom-0 w-[46%] p-2 lg:p-3 ${
                      overlapLeft ? "left-[-4%]" : "right-[-4%]"
                    }`}
                    style={{ backgroundColor: "var(--bg)" }}
                  >
                    <ImageReveal className="block aspect-[4/3] w-full" delay={0.15}>
                      <Photo
                        id={secondary}
                        pictureClassName="block h-full w-full"
                        className="h-full w-full object-cover"
                      />
                    </ImageReveal>
                  </div>
                </div>

                <Reveal delay={0.08}>
                  <div className="mt-8">
                    <h3 className="font-[family-name:var(--font-display)] text-[clamp(1.8rem,3vw,2.5rem)] font-light leading-tight text-[color:var(--text)]">
                      {lodge.name}
                    </h3>

                    <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-[family-name:var(--font-label)] text-[0.65rem] uppercase tracking-[0.2em]">
                      {[lodge.place, lodge.gate, lodge.rooms].map((fact, f) => (
                        <li key={fact} className="flex items-center gap-3">
                          {f > 0 && (
                            <span
                              aria-hidden="true"
                              className="block h-[3px] w-[3px] rounded-full"
                              style={{ backgroundColor: "var(--accent)" }}
                            />
                          )}
                          <span style={{ color: "var(--accent-text)" }}>{fact}</span>
                        </li>
                      ))}
                    </ul>

                    <p
                      className="mt-6 max-w-[52ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
                      style={{ color: "var(--text)" }}
                    >
                      {lodge.body}
                    </p>

                    <a
                      href={lodge.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-7 inline-block border-b pb-1 font-[family-name:var(--font-label)] text-[0.7rem] uppercase tracking-[0.22em] hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                      style={{ color: "var(--accent-text)", borderColor: "var(--accent)" }}
                    >
                      {lodge.cta}
                    </a>
                  </div>
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </ChapterSurface>
  );
}
