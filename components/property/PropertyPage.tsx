import { ChapterIntro, type ChapterIntroCopy } from "@/components/sections/ChapterIntro";
import { FieldNotes, type FieldNotesCopy } from "@/components/sections/FieldNotes";
import { FullBleedQuote, type FullBleedQuoteCopy } from "@/components/sections/FullBleedQuote";
import { Hero, type HeroCopy } from "@/components/sections/Hero";
import { PlateGrid, type PlateGridCopy } from "@/components/sections/PlateGrid";
import { RoomsIndex, type RoomsIndexCopy } from "@/components/sections/RoomsIndex";
import { SiteHeader } from "@/components/ui/SiteHeader";
import type { ScrimStrength } from "@/components/ui/Scrim";
import type { PropertyChapter, PropertyChapterKind } from "@/content/property-chapters";

/** The chapters that render on cream rather than on a photograph — mirrors `CREAM_KINDS` in `app/page.tsx`. */
const CREAM_KINDS: readonly PropertyChapterKind[] = ["chapterIntro", "plateGrid", "roomsIndex", "fieldNotes"];

export type PropertyPageCopy = {
  readonly heroCopy?: HeroCopy;
  readonly chapterIntroCopy?: Record<string, ChapterIntroCopy>;
  readonly plateGridCopy?: Record<string, PlateGridCopy>;
  readonly fullBleedQuoteCopy?: Record<string, FullBleedQuoteCopy>;
  readonly roomsIndexCopy?: Record<string, RoomsIndexCopy>;
  readonly fieldNotesCopy?: Record<string, FieldNotesCopy>;
};

/**
 * The property pages' spine, rendered. Mirrors `app/page.tsx`'s `renderChapter`
 * + `Home`, generalised over which property is being shown — the two routes
 * differ only in the chapters and copy they pass in.
 *
 * Kept separate from `app/page.tsx`'s own dispatcher rather than merged with
 * it: the home page's switch carries home-only decorations (the lantern, the
 * two films' footers, the pinned-collage branch) that have no meaning here,
 * and folding both into one generic dispatcher would mean every kind
 * threading props neither page needs.
 */
export function PropertyPage({
  chapters,
  copy,
  scrim,
  bookHref,
  bookLabel,
  enquireHref,
  siblingHref,
  nav,
}: {
  chapters: readonly PropertyChapter[];
  copy: PropertyPageCopy;
  /** Per-chapter scrim for `fullBleedQuote` chapters — mirrors `QUOTE_SCRIM` in `app/page.tsx`. */
  scrim: Record<string, ScrimStrength>;
  bookHref: string;
  /**
   * The header pill's label. An explicit prop rather than derived from
   * `copy.fieldNotesCopy` with a fallback string: every other content lookup
   * on this page (`chapterCopy`, `media`, `chapter`) throws on a miss rather
   * than silently substituting a value, and a hard-coded "Book" fallback
   * here would be the one exception — never actually exercised, since both
   * properties' copy always supplies it, and a maintenance trap if that ever
   * stops being true.
   */
  bookLabel: string;
  enquireHref: string;
  siblingHref: string;
  nav: { menu: string; menuTitle: string; menuClose: string; menuHint: string };
}) {
  let cream = 0;

  return (
    <>
      <SiteHeader
        ctaHref={`#${chapters[chapters.length - 1].id}`}
        ctaLabel={bookLabel}
        chapters={chapters}
        nav={nav}
      />
      <main>
        {chapters.map((chapter) => {
          const surface = CREAM_KINDS.includes(chapter.kind) ? cream++ % 2 === 1 : false;

          switch (chapter.kind) {
            case "hero":
              return <Hero key={chapter.id} chapter={chapter} copy={copy.heroCopy} />;
            case "chapterIntro":
              return (
                <ChapterIntro
                  key={chapter.id}
                  chapter={chapter}
                  copy={copy.chapterIntroCopy?.[chapter.id]}
                  surface={surface}
                />
              );
            case "plateGrid":
              return (
                <PlateGrid
                  key={chapter.id}
                  chapter={chapter}
                  copy={copy.plateGridCopy?.[chapter.id]}
                  surface={surface}
                />
              );
            case "fullBleedQuote":
              return (
                <FullBleedQuote
                  key={chapter.id}
                  chapter={chapter}
                  copy={copy.fullBleedQuoteCopy?.[chapter.id]}
                  scrim={scrim[chapter.id] ?? { flat: 0.4, centre: 0.4 }}
                />
              );
            case "roomsIndex": {
              const roomsCopy = copy.roomsIndexCopy?.[chapter.id];
              if (!roomsCopy) throw new Error(`No roomsIndex copy for "${chapter.id}"`);
              return <RoomsIndex key={chapter.id} chapter={chapter} copy={roomsCopy} surface={surface} />;
            }
            case "fieldNotes": {
              const notesCopy = copy.fieldNotesCopy?.[chapter.id];
              if (!notesCopy) throw new Error(`No fieldNotes copy for "${chapter.id}"`);
              return (
                <FieldNotes
                  key={chapter.id}
                  chapter={chapter}
                  copy={notesCopy}
                  bookHref={bookHref}
                  enquireHref={enquireHref}
                  siblingHref={siblingHref}
                  surface={surface}
                />
              );
            }
            default: {
              const unhandled: never = chapter.kind;
              throw new Error(`No section component for property chapter kind: ${String(unhandled)}`);
            }
          }
        })}
      </main>
    </>
  );
}
