import { ExperienceStrip, type StripCopy } from "@/components/sections/ExperienceStrip";
import { FullBleedQuote, type FullBleedQuoteCopy } from "@/components/sections/FullBleedQuote";
import { Hero, type HeroCopy } from "@/components/sections/Hero";
import { OpeningColumn, type OpeningColumnCopy } from "@/components/sections/OpeningColumn";
import { PressBand, type PressBandCopy } from "@/components/sections/PressBand";
import { PropertyMap, type PropertyMapCopy } from "@/components/sections/PropertyMap";
import { RoomCardStack } from "@/components/sections/RoomCardStack";
import type { RoomShowcaseCopy } from "@/components/sections/RoomShowcase.types";
import { PropertyBar } from "@/components/property/PropertyBar";
import { PropertyInvitation, type PropertyInvitationCopy } from "@/components/property/PropertyInvitation";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { FullBleed } from "@/components/ui/FullBleed";
import { ReviewWidget } from "@/components/ui/ReviewWidget";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import { SiteHeader } from "@/components/ui/SiteHeader";
import type { PropertyChapter, PropertyShape } from "@/content/property-chapters";
import { REVIEWS_LABEL, SITE_FOOTER_ID, STRIP_LABELS } from "@/content/site";

export type PropertyPageCopy = {
  readonly heroCopy?: HeroCopy;
  readonly columnCopy?: Record<string, OpeningColumnCopy>;
  readonly mapCopy?: Record<string, PropertyMapCopy>;
  readonly showcaseCopy?: Record<string, RoomShowcaseCopy>;
  /**
   * **`pairCopy` (`ExperiencePairCopy`) until 26 August 2026** — replaced by
   * the home page's own `StripCopy`, imported rather than defined a second
   * time, when the client asked for the identical card strip on both
   * property pages. See `content/property-chapters.ts`'s `PropertyShape`
   * comment and `docs/DECISIONS.md` §22.
   */
  readonly stripCopy?: Record<string, StripCopy>;
  readonly pressCopy?: Record<string, PressBandCopy>;
  readonly quoteCopy?: Record<string, FullBleedQuoteCopy>;
  readonly invitationCopy?: Record<string, PropertyInvitationCopy>;
};

/** The shapes that carry a screen on cream rather than on a photograph. */
const CREAM_SHAPES: readonly PropertyShape[] = ["column", "map", "showcase", "strip", "press", "invitation"];

/**
 * Every chapter's cream, worked out in one pass before anything renders.
 *
 * It was `cream++ % 2 === 1` inline, inside `.map()`'s own argument list,
 * until 26 August 2026 — which was fine while every surface depended only on
 * the chapters above it, but a chapter can now **continue** the one above it
 * (the map "is an extention to the first sections", the client's own words,
 * 26 Aug 2026), and a continuing chapter takes the surface the one above it
 * already has rather than the next one in the cycle. An expression evaluated
 * inside `map`'s own argument list cannot look backwards at what it decided
 * last time round — `app/page.tsx`'s `positions()` learned exactly this on
 * 19 Aug 2026, for the same reason, when `04 · Mahua Philosophy` became the
 * continuation of `03 · Rooted Like The Mahua`. This is that fix, ported.
 *
 * **A continuing chapter does not advance the cycle**, so everything beneath
 * the pair alternates as though the two were one chapter — which is what they
 * are meant to look like. Missing this is the knock-on that breaks silently:
 * every cream chapter below the pair would flip surface, and no test written
 * against one page in isolation would fail, because each individual chapter's
 * `surface` is still a valid boolean — it is simply the wrong one.
 */
function surfaces(
  chapters: readonly PropertyChapter[],
): readonly { surface: boolean; continues: boolean }[] {
  let cream = 0;
  let last = false;
  return chapters.map((chapter, i) => {
    // The map is an extension of the chapter above it — the client's ruling,
    // 26 Aug 2026. Identified by shape and the absence of a heading rather
    // than by id, so a future unheaded section inherits the behaviour rather
    // than needing a new special case here.
    const continues =
      chapter.shape === "map" && !chapter.number && CREAM_SHAPES.includes(chapters[i - 1]?.shape);
    const surface = CREAM_SHAPES.includes(chapter.shape) ? (continues ? last : cream++ % 2 === 1) : false;
    if (CREAM_SHAPES.includes(chapter.shape)) last = surface;
    return { surface, continues };
  });
}

/**
 * A bare full-bleed photograph carrying the chapter's own number/label
 * instead of a quote — the third of `fullBleed`'s three jobs (see the long
 * comment in the switch below). **No chapter in either spine reaches this as
 * of 26 Aug 2026** — corrected from this comment's own 9 Aug claim ("every
 * non-hero `fullBleed` chapter... carries a `quoteCopy` entry"), which the
 * 26 Aug restructure's Task 5 made false the same day it deleted `vann-table`,
 * `tola-guest-word` and `tola-table` on the client's ruling: **neither page
 * has ANY non-hero `fullBleed` chapter left at all**, so this branch is
 * exactly as unreachable as `FullBleedQuote`'s own branch in the switch
 * below. `content/mahua-vann.test.ts` / `content/mahua-tola.test.ts` still
 * assert `quoteCopy` is required *the day such a chapter exists* (both
 * `expect(…quoteCopy).toBeUndefined()` today, confirming none does) — they
 * do not require one to exist now. Kept anyway, because the alternative is a
 * `fullBleed` chapter with nowhere to go the day a future one *doesn't*
 * carry a quote — and this codebase does not paper over that with a silent
 * fallback.
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
}: {
  chapters: readonly PropertyChapter[];
  copy: PropertyPageCopy;
  /**
   * Per-chapter scrim, keyed by chapter id — mirrors `QUOTE_SCRIM` in
   * `app/page.tsx`. Covers both the hero chapter and any `fullBleedQuote`
   * chapter: a hero photograph needs the same per-photograph tuning a
   * quote's backdrop does, and an entry missing for either falls through to
   * that section's own built-in default. **As of 26 Aug 2026 neither property
   * page has a `fullBleedQuote` chapter left** (Task 5 of the 26 Aug
   * restructure deleted the three that did — see `PlainFullBleed`'s own doc
   * comment above and the switch's `fullBleed` case below) — this record
   * covers only each page's own hero entry today, kept `Record`-shaped for
   * the day a `fullBleedQuote` chapter exists again rather than narrowed to
   * one key.
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
}) {
  // See `surfaces()` above for why this is a pass over the whole spine rather
  // than a counter incremented inside the `.map()` below.
  const at = surfaces(chapters);

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
      />
      <main>
        {chapters.map((chapter, index) => {
          const { surface, continues } = at[index];

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
               * 2. A non-hero `fullBleed` chapter with a `quoteCopy` entry
               *    renders as a `FullBleedQuote` — the branch `vann-table`,
               *    `tola-table` and `tola-guest-word` used to take, until
               *    Task 5 of the 26 Aug 2026 restructure deleted all three on
               *    the client's own ruling (their content files' own removal
               *    comments carry his words). **As of that date neither page
               *    has any non-hero `fullBleed` chapter left at all, so this
               *    branch is exactly as unreachable as branch 3 below** —
               *    kept for the day a future `fullBleed` chapter carries a
               *    quote again, on the same reasoning branch 3's own comment
               *    already gives for itself.
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
              return (
                <PropertyMap
                  key={chapter.id}
                  chapter={chapter}
                  copy={mapCopy}
                  surface={surface}
                  continues={continues}
                />
              );
            }
            case "showcase": {
              const showcaseCopy = copy.showcaseCopy?.[chapter.id];
              if (!showcaseCopy) throw new Error(`No showcase copy for "${chapter.id}"`);
              return (
                <RoomCardStack key={chapter.id} chapter={chapter} copy={showcaseCopy} surface={surface} />
              );
            }
            case "strip": {
              // `ExperienceStrip` is the home page's own `05 · Experiences`
              // component (`components/sections/ExperienceStrip.tsx`),
              // mounted here unmodified — the client's own words were "place
              // the entire carousel as it is". `labels` is `STRIP_LABELS`,
              // the same three interface strings the home page reads via
              // `HOME.strip`, so a screen-reader announcement can never
              // differ between the three routes that now show this strip.
              const stripCopy = copy.stripCopy?.[chapter.id];
              if (!stripCopy) throw new Error(`No strip copy for "${chapter.id}"`);
              return (
                <ExperienceStrip
                  key={chapter.id}
                  chapter={chapter}
                  copy={stripCopy}
                  labels={STRIP_LABELS}
                  surface={surface}
                />
              );
            }
            case "press": {
              // Carries the client's own reviews widget as of 26 August 2026,
              // on both property pages — Mahua Vann keeps its three press
              // articles above it (`vann-press`), Mahua Tola has none and
              // renders the widget alone under the same "Written About"
              // heading (`tola-press`; see that chapter's own doc comment in
              // content/mahua-tola.ts for why that is a ruling, not a gap).
              // `PressBand`'s `children` slot exists for exactly this.
              //
              // No `fallback` prop, deliberately — the same omission
              // `Invitation.tsx` records for the home page's own widget: the
              // client has not supplied the sentence a visitor with no
              // JavaScript should read here, and inventing one is exactly the
              // placeholder-prose defect this project has shipped before. An
              // empty `<noscript>` is honest; a sentence attributed to the
              // lodge that nobody at the lodge wrote is not. Owed, not missed.
              //
              // `label` is `REVIEWS_LABEL` from `content/site.ts`, the same
              // string the home page's own widget uses via `HOME.reviews.region`
              // — one sentence, read from one place, so a screen-reader
              // announcement can never differ between the three routes that
              // now mount this widget.
              //
              // `appId={pressCopy.reviewsAppId}` — added 27 Aug 2026. Both
              // property pages shared the same hardcoded id until Mahua
              // Tola's own band was found showing Mahua Vann's reviews (there
              // is only one Elfsight app). The client's ruling was to keep it
              // that way until he supplies his own Tola embed
              // (`docs/DECISIONS.md` §22.11) — `PressBandCopy.reviewsAppId`
              // is undefined for both properties today, so `ReviewWidget`'s
              // own default still supplies the shared id; the day he sends a
              // Tola id, it is one line in `content/mahua-tola.ts`, not a
              // second look at this dispatcher.
              const pressCopy = copy.pressCopy?.[chapter.id];
              if (!pressCopy) throw new Error(`No press copy for "${chapter.id}"`);
              return (
                <PressBand key={chapter.id} chapter={chapter} copy={pressCopy} surface={surface}>
                  <ReviewWidget label={REVIEWS_LABEL} appId={pressCopy.reviewsAppId} />
                </PressBand>
              );
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
        footerId={SITE_FOOTER_ID}
      />
    </>
  );
}
