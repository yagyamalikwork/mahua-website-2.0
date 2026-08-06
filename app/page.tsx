import { PinnedCollage } from "@/components/motion/PinnedCollage";
import { SignatureFilm } from "@/components/signature/SignatureFilm";
import { ChapterIntro } from "@/components/sections/ChapterIntro";
import { FullBleedQuote } from "@/components/sections/FullBleedQuote";
import { Hero } from "@/components/sections/Hero";
import { Invitation } from "@/components/sections/Invitation";
import { LodgeCards } from "@/components/sections/LodgeCards";
import { PlateGrid } from "@/components/sections/PlateGrid";
import { SplitFeature } from "@/components/sections/SplitFeature";
import { Testimonials } from "@/components/sections/Testimonials";
import type { ScrimStrength } from "@/components/ui/Scrim";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { CHAPTERS, type Chapter, type ChapterKind } from "@/content/chapters";

/**
 * The home page is `content/chapters.ts`, rendered.
 *
 * There is no JSX sequence here to fall out of step with the spine — the order,
 * the numbering and the rhythm are all decided there and tested there, and this
 * file only knows how to turn a `kind` into a component. Two things follow from
 * that: adding a chapter is a content edit, and adding a `ChapterKind` without a
 * component is a compile error rather than a blank patch of page (see the
 * `never` at the bottom of `renderChapter`).
 *
 * The two pieces of composition that genuinely belong to the page rather than to
 * any one section:
 *
 * - **Which margin each `chapterIntro` floats its images at.** Both instances
 *   using the same composition would read as a template, and a section cannot
 *   know it is the second of its kind. The page counts them and alternates.
 *   `pinnedCollage` is counted among them: it *is* that composition, held still,
 *   and it renders as an ordinary `chapterIntro` at every viewport it does not
 *   pin at — so leaving it out of the count would flip `lantern-hour`'s
 *   composition on every screen in the world as a side effect of pinning
 *   `rooted` on some of them.
 * - **How heavy each full-bleed quote's scrim is.** It is a property of the
 *   photograph, not of the layout: `tiger-golden-grass` is a bright midday frame
 *   and `lodge-facade-night` is already lit for night. Both figures below were
 *   measured off a rendered browser frame with the type hidden, not chosen by
 *   eye — see `docs/reviews/2026-08-04-task-7/`.
 */

/** Per-photograph, and only ever raised by measuring the rendered result. */
const QUOTE_SCRIM: Record<string, ScrimStrength> = {
  // Noon, dry golden grass, no shadow anywhere in the frame. The heaviest wash
  // on the page and still the tightest ratio.
  "why-you-came": { flat: 0.34, centre: 0.45 },
  // Lantern-lit facade against a night sky; the photograph does most of the work.
  "after-dark": { flat: 0.32, centre: 0.36 },
};

/** The chapters that render on cream rather than on a photograph. */
const CREAM_KINDS: readonly ChapterKind[] = [
  "lodgeCards",
  "chapterIntro",
  "pinnedCollage",
  "plateGrid",
  "splitFeature",
  "testimonials",
];

/** The kinds that share `ChapterIntro`'s composition, pinned or not. */
const INTRO_KINDS: readonly ChapterKind[] = ["chapterIntro", "pinnedCollage"];

type Position = {
  /** Index among the `chapterIntro` chapters, for the mirrored composition. */
  intro: number;
  /** True on every other cream chapter, for the second cream surface. */
  surface: boolean;
};

function renderChapter(chapter: Chapter, at: Position) {
  const kind: ChapterKind = chapter.kind;

  switch (kind) {
    case "hero":
      return <Hero key={chapter.id} chapter={chapter} />;
    case "lodgeCards":
      return <LodgeCards key={chapter.id} chapter={chapter} surface={at.surface} />;
    case "fullBleedQuote":
      return (
        <FullBleedQuote
          key={chapter.id}
          chapter={chapter}
          scrim={QUOTE_SCRIM[chapter.id] ?? { flat: 0.4, centre: 0.4 }}
        />
      );
    case "chapterIntro":
      return (
        <ChapterIntro
          key={chapter.id}
          chapter={chapter}
          mirrored={at.intro % 2 === 1}
          surface={at.surface}
        />
      );
    case "pinnedCollage":
      return (
        <PinnedCollage
          key={chapter.id}
          chapter={chapter}
          mirrored={at.intro % 2 === 1}
          surface={at.surface}
          /*
           * The potter closes this chapter. It is the one chapter whose copy
           * already names them — the potters of Pachdhar, whose wheel this page
           * invites you to take a turn at — and the join below it is one of the
           * five emptiest screens on the page at 63.5%, so a figure here fills
           * paper nobody was using rather than buying new paper to fill.
           */
          footer={
            <SignatureFilm
              src="/media/potter-film.mp4"
              poster="/media/potter-film-poster.webp"
              width={1080}
              height={1255}
              /*
               * Large, and that is arithmetic rather than taste. The band this
               * creates is as tall as the film, so a *bigger* film fills a
               * proportionally larger share of it: at 380px the chapter went to
               * 45.7% empty against the 45% ceiling, with the join below it at
               * 81.2%. Widening it is what brings both back.
               */
              className="block h-auto w-[280px] sm:w-[420px] lg:w-[680px]"
            />
          }
        />
      );
    case "plateGrid":
      return <PlateGrid key={chapter.id} chapter={chapter} surface={at.surface} />;
    case "splitFeature":
      return (
        <SplitFeature
          key={chapter.id}
          chapter={chapter}
          surface={at.surface}
          /*
           * The tiger goes here — the chapter about going out to look for
           * animals, and the one that owns the emptiest screen belonging to any
           * chapter (52.4% against non-negotiable #8's 45% ceiling).
           *
           * It was an ink drawing that inked itself in until 6 Aug 2026, when the
           * client supplied this film. `components/signature/InkTiger.tsx` and its
           * artwork are still here, tested, and one line from returning — see
           * `docs/DECISIONS.md` for the trade that was made and what it cost.
           */
          footer={
            chapter.id === "field-days" ? (
              /* Sized here rather than in the component, because how large the
                 tiger should be is a question about this chapter's column and not
                 about the film. 420px is sharp to DPR 2 against an 810px source. */
              <SignatureFilm
                src="/media/tiger-film.mp4"
                poster="/media/tiger-film-poster.webp"
                width={810}
                height={1080}
                className="block h-auto w-[240px] sm:w-[280px] lg:w-[300px]"
              />
            ) : undefined
          }
        />
      );
    case "testimonials":
      return <Testimonials key={chapter.id} chapter={chapter} surface={at.surface} />;
    case "invitation":
      return <Invitation key={chapter.id} chapter={chapter} />;
    default: {
      // Adding a `ChapterKind` without a section here fails to compile.
      const unhandled: never = kind;
      throw new Error(`No section component for chapter kind: ${String(unhandled)}`);
    }
  }
}

export default function Home() {
  let intro = 0;
  let cream = 0;

  return (
    <>
      {/* The header overlays the hero but is not part of it, and its pill goes to
          the chapter that actually invites you — the last one, which carries the
          real link out to the booking site. */}
      <SiteHeader ctaHref={`#${CHAPTERS[CHAPTERS.length - 1].id}`} />
      <main>
        {CHAPTERS.map((chapter) =>
          renderChapter(chapter, {
            intro: INTRO_KINDS.includes(chapter.kind) ? intro++ : 0,
            surface: CREAM_KINDS.includes(chapter.kind) ? cream++ % 2 === 1 : false,
          }),
        )}
      </main>
    </>
  );
}
