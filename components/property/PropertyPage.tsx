import { ExperiencePair, type ExperiencePairCopy } from "@/components/sections/ExperiencePair";
import { FullBleedQuote, type FullBleedQuoteCopy } from "@/components/sections/FullBleedQuote";
import { Hero, type HeroCopy } from "@/components/sections/Hero";
import { OpeningColumn, type OpeningColumnCopy } from "@/components/sections/OpeningColumn";
import { PressBand, type PressBandCopy } from "@/components/sections/PressBand";
import { PropertyMap, type PropertyMapCopy } from "@/components/sections/PropertyMap";
import { RoomShowcase, type RoomShowcaseCopy } from "@/components/sections/RoomShowcase";
import { PropertyBar } from "@/components/property/PropertyBar";
import { PropertyInvitation, type PropertyInvitationCopy } from "@/components/property/PropertyInvitation";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { FullBleed } from "@/components/ui/FullBleed";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import { SiteHeader } from "@/components/ui/SiteHeader";
import type { PropertyChapter, PropertyShape } from "@/content/property-chapters";

export type PropertyPageCopy = {
  readonly heroCopy?: HeroCopy;
  readonly columnCopy?: Record<string, OpeningColumnCopy>;
  readonly mapCopy?: Record<string, PropertyMapCopy>;
  readonly showcaseCopy?: Record<string, RoomShowcaseCopy>;
  readonly pairCopy?: Record<string, ExperiencePairCopy>;
  readonly pressCopy?: Record<string, PressBandCopy>;
  readonly quoteCopy?: Record<string, FullBleedQuoteCopy>;
  readonly invitationCopy?: Record<string, PropertyInvitationCopy>;
};

/** The shapes that carry a screen on cream rather than on a photograph. */
const CREAM_SHAPES: readonly PropertyShape[] = ["column", "map", "showcase", "pair", "press", "invitation"];

/**
 * A bare full-bleed photograph carrying the chapter's own number/label
 * instead of a quote — the third of `fullBleed`'s three jobs (see the long
 * comment in the switch below). No chapter in either spine reaches this as
 * of 9 Aug 2026: every non-hero `fullBleed` chapter on both pages carries a
 * `quoteCopy` entry, and `content/mahua-vann.test.ts` /
 * `content/mahua-tola.test.ts` both require one. Kept anyway, because the
 * alternative is a `fullBleed` chapter with nowhere to go the day a future
 * one *doesn't* carry a quote — and this codebase does not paper over that
 * with a silent fallback.
 */
function PlainFullBleed({ chapter, scrim }: { chapter: PropertyChapter; scrim?: ScrimStrength }) {
  return (
    <section
      id={chapter.id}
      className="relative isolate flex min-h-[100svh] w-full items-end overflow-hidden px-6 pb-14 md:px-12 md:pb-20"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div className="absolute inset-0 -z-10">
        <FullBleed id={chapter.media[0]} heightVh={100} />
      </div>
      <div className="absolute inset-0 -z-10">
        <Scrim {...(scrim ?? { flat: 0.4, centre: 0.4 })} />
      </div>
      {chapter.number && chapter.label && <ChapterMark number={chapter.number} label={chapter.label} />}
    </section>
  );
}

/**
 * A property page's spine, rendered. Mirrors `app/page.tsx`'s own dispatcher,
 * generalised over which property is being shown — the two routes differ
 * only in the chapters and copy they pass in.
 *
 * Kept separate from `app/page.tsx`'s own dispatcher rather than merged with
 * it: the home page's switch carries home-only decorations (the lantern, the
 * two films' footers, the pinned-collage branch) that have no meaning here,
 * and folding both into one generic dispatcher would mean every shape
 * threading props neither page needs.
 */
export function PropertyPage({
  chapters,
  copy,
  scrim,
  bookHref,
  bar,
  siblingHref,
  nav,
}: {
  chapters: readonly PropertyChapter[];
  copy: PropertyPageCopy;
  /**
   * Per-chapter scrim, keyed by chapter id — mirrors `QUOTE_SCRIM` in
   * `app/page.tsx`. Covers both the hero chapter and any `fullBleedQuote`
   * chapter: a hero photograph needs the same per-photograph tuning a
   * quote's backdrop does, and an entry missing for either falls through to
   * that section's own built-in default.
   */
  scrim: Record<string, ScrimStrength>;
  bookHref: string;
  /**
   * The header's pill and `PropertyBar`'s own — one short label ("Book") and
   * the property's name, exactly the shape `VANN_BAR` / `TOLA_BAR` export.
   * Distinct from `PropertyInvitationCopy.bookLabel` ("Book Mahua Vann"),
   * which is the closing chapter's own longer call to action.
   */
  bar: { name: string; bookLabel: string };
  siblingHref: string;
  nav: { menu: string; menuTitle: string; menuClose: string; menuHint: string };
}) {
  let cream = 0;

  const lastChapter = chapters[chapters.length - 1];
  // `PropertyBar`'s own contact block is sourced from the closing chapter's
  // invitation copy rather than a separate prop — the same single record
  // (`VANN_CONTACT` / `TOLA_CONTACT`) then backs both the invitation and the
  // bar, and the two can never disagree about a phone number, which is
  // exactly what those constants' own doc comments promise.
  const barContact = copy.invitationCopy?.[lastChapter.id]?.contact;
  if (!barContact) {
    throw new Error(`No invitation copy for "${lastChapter.id}" to source PropertyBar's contact from`);
  }

  return (
    <>
      <SiteHeader
        ctaHref={`#${lastChapter.id}`}
        ctaLabel={bar.bookLabel}
        chapters={chapters}
        nav={nav}
      />
      <main>
        {chapters.map((chapter, index) => {
          const surface = CREAM_SHAPES.includes(chapter.shape) ? cream++ % 2 === 1 : false;

          switch (chapter.shape) {
            case "fullBleed": {
              /*
               * `fullBleed` covers three different jobs, disambiguated in
               * this order:
               *
               * 1. The first chapter is always the hero — both spines assert
               *    `chapters[0].shape === "fullBleed"` and open on a hero id
               *    (content/mahua-vann.test.ts, content/mahua-tola.test.ts).
               *    Checked before anything content-shaped, so a hero can
               *    never be shadowed by a chapter id that happens to also
               *    collide with a `quoteCopy` key — a hero needs `HeroCopy`
               *    (headline/sub/scrollCue) and a scrim built from
               *    top/bottom/corner, neither of which a quote's copy or
               *    scrim shape can stand in for.
               * 2. Every other `fullBleed` chapter on both pages carries a
               *    `quoteCopy` entry today — both content test files' "keeps
               *    every chapter's copy joined to the spine it renders
               *    under" test requires one for any non-hero `fullBleed`
               *    chapter, and `vann-table`/`tola-table`'s own doc comments
               *    in their content files confirm the quote text is meant to
               *    show over the photograph, not stand in for a caption on a
               *    photograph that shows nothing of its own. This is the
               *    branch every real chapter beyond the hero takes.
               * 3. `PlainFullBleed` below is the fallback for a `fullBleed`
               *    chapter that is neither — unreachable under the current
               *    spines, kept for the day one exists rather than left as
               *    a silent gap.
               */
              if (index === 0) {
                if (!copy.heroCopy) throw new Error(`No hero copy for "${chapter.id}"`);
                return (
                  <Hero key={chapter.id} chapter={chapter} copy={copy.heroCopy} scrim={scrim[chapter.id]} />
                );
              }
              const quoteCopy = copy.quoteCopy?.[chapter.id];
              if (quoteCopy) {
                return (
                  <FullBleedQuote
                    key={chapter.id}
                    chapter={chapter}
                    copy={quoteCopy}
                    scrim={scrim[chapter.id] ?? { flat: 0.4, centre: 0.4 }}
                  />
                );
              }
              return <PlainFullBleed key={chapter.id} chapter={chapter} scrim={scrim[chapter.id]} />;
            }
            case "column": {
              const columnCopy = copy.columnCopy?.[chapter.id];
              if (!columnCopy) throw new Error(`No column copy for "${chapter.id}"`);
              return (
                <OpeningColumn key={chapter.id} chapter={chapter} copy={columnCopy} surface={surface} />
              );
            }
            case "map": {
              const mapCopy = copy.mapCopy?.[chapter.id];
              if (!mapCopy) throw new Error(`No map copy for "${chapter.id}"`);
              return <PropertyMap key={chapter.id} chapter={chapter} copy={mapCopy} surface={surface} />;
            }
            case "showcase": {
              const showcaseCopy = copy.showcaseCopy?.[chapter.id];
              if (!showcaseCopy) throw new Error(`No showcase copy for "${chapter.id}"`);
              return (
                <RoomShowcase key={chapter.id} chapter={chapter} copy={showcaseCopy} surface={surface} />
              );
            }
            case "pair": {
              const pairCopy = copy.pairCopy?.[chapter.id];
              if (!pairCopy) throw new Error(`No pair copy for "${chapter.id}"`);
              return <ExperiencePair key={chapter.id} chapter={chapter} copy={pairCopy} surface={surface} />;
            }
            case "press": {
              const pressCopy = copy.pressCopy?.[chapter.id];
              if (!pressCopy) throw new Error(`No press copy for "${chapter.id}"`);
              return <PressBand key={chapter.id} chapter={chapter} copy={pressCopy} surface={surface} />;
            }
            case "invitation": {
              const invitationCopy = copy.invitationCopy?.[chapter.id];
              if (!invitationCopy) throw new Error(`No invitation copy for "${chapter.id}"`);
              return (
                <PropertyInvitation
                  key={chapter.id}
                  chapter={chapter}
                  copy={invitationCopy}
                  bookHref={bookHref}
                  siblingHref={siblingHref}
                  surface={surface}
                />
              );
            }
            default: {
              const unhandled: never = chapter.shape;
              throw new Error(`No section component for property chapter shape: ${String(unhandled)}`);
            }
          }
        })}
      </main>
      <PropertyBar
        name={bar.name}
        bookHref={bookHref}
        bookLabel={bar.bookLabel}
        contact={barContact}
        heroId={chapters[0].id}
        invitationId={lastChapter.id}
      />
    </>
  );
}
