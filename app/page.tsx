import { PinnedCollage } from "@/components/motion/PinnedCollage";
import { HangingLantern } from "@/components/signature/lantern/HangingLantern";
import { SignatureFilm } from "@/components/signature/SignatureFilm";
import { ChapterIntro } from "@/components/sections/ChapterIntro";
import { Coverflow } from "@/components/sections/Coverflow";
import { FullBleedQuote } from "@/components/sections/FullBleedQuote";
import { Hero } from "@/components/sections/Hero";
import { Invitation } from "@/components/sections/Invitation";
import { LodgeCards } from "@/components/sections/LodgeCards";
import { PlateGrid } from "@/components/sections/PlateGrid";
import { Testimonials } from "@/components/sections/Testimonials";
import type { ScrimStrength } from "@/components/ui/Scrim";
import { ForestBackdrop } from "@/components/ui/ForestBackdrop";
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
  // `coverflow` replaced `splitFeature` on `field-days` (16 Aug 2026) and has to
  // be counted here for the same reason `pinnedCollage` is counted among the
  // intros: this list is what alternates the two creams, so a chapter dropping
  // out of it would flip the surface of every cream chapter BELOW it as a side
  // effect. `"splitFeature"` sat beside it for one day and came out with the
  // component on the same date — safely, and only because the two changes were
  // made together: the kind was already unrouted, so removing it changed no
  // chapter's position in this count. Removing a kind that IS routed would flip
  // the cream of every chapter below it, silently, and this list is referenced
  // by no plan.
  "coverflow",
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
          /*
           * The lantern hangs out of `after-dark` — the night facade with its
           * eaves lit — down into the chapter named for the hour it belongs to.
           * The client asked for exactly this on 7 Aug 2026, and for it to swing
           * when pushed.
           *
           * It goes here rather than inside the section because only the page
           * knows that `after-dark` is what sits above this chapter. Move either
           * of them in `content/chapters.ts` and the lantern is hanging from
           * whatever arrives instead, which is a thing to notice rather than a
           * thing to prevent — `content/chapters.test.ts` owns the sequence.
           */
          /* Unsized here, unlike the two films. How large the potter and the
             tiger should be is a question about a chapter's column; how large
             the lantern may be is a measured fit against the room the
             composition leaves above its own heading, so it belongs with the
             component as `LANTERN_FIT`. */
          hanging={chapter.id === "lantern-hour" ? <HangingLantern /> : undefined}
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
               * Small, and tucked into the section's own bottom padding — an
               * accessory closing the chapter rather than a band of its own.
               *
               * It was 680px wide and centred in a new band until 7 Aug 2026.
               * That read as a feature the chapter had not asked for, and it cost
               * 823px of scroll. Measured at 1280 there are **24px** of slack
               * below the prose and at 1024 the text column is taller than the
               * photographs, so there is no large hole here to fill — only the
               * 80px of padding, which is what this now sits in.
               *
               * How far up it sits is `PinnedCollage`'s decision and not this
               * one's, because the answer is different in the two branches: only
               * the pinned composition leaves its photographs displaced when the
               * scene lets go. See the note on the footer there.
               */
              className="block h-auto w-[150px] sm:w-[180px] lg:w-[220px]"
            />
          }
        />
      );
    case "plateGrid":
      return (
        <PlateGrid
          key={chapter.id}
          chapter={chapter}
          surface={at.surface}
          /*
           * The hornbills go behind `03 · The Forest`, and only there. Client
           * request, 10 Aug 2026, with their own drawing.
           *
           * It is the right chapter for them twice over: the copy already counts
           * "three hundred recorded birds", and Malabar pied hornbills are native
           * to Pench — Mahua Vann's own park. `details` and `rooms` are the other
           * two plate grids and take no backdrop; a wash under every one of them
           * would be a texture rather than a moment.
           *
           * `surface` is passed on because the tint is baked onto a cream at
           * build time rather than blended at runtime, so it has to be given the
           * one it is standing on. See `ForestBackdrop`.
           */
          backdrop={chapter.id === "forest" ? <ForestBackdrop surface={at.surface} /> : undefined}
        />
      );
    case "coverflow":
      return (
        <Coverflow
          key={chapter.id}
          chapter={chapter}
          surface={at.surface}
          /*
           * The tiger goes here — the chapter about going out to look for
           * animals, and the one that owned the emptiest screen belonging to any
           * chapter.
           *
           * It was an ink drawing that inked itself in until 6 Aug 2026, when the
           * client supplied this film. `components/signature/InkTiger.tsx` and its
           * artwork are still here, tested, and one line from returning — see
           * `docs/DECISIONS.md` for the trade that was made and what it cost.
           *
           * This arm carried the same film as a `case "splitFeature"` beside it
           * for one day; that component was retired on 16 Aug 2026 once the
           * coverflow's measurement said it shipped, and nothing has routed to it
           * since `field-days` changed shape.
           *
           * **The prop is `figure`, not `footer`, and that word is the finding.**
           * `SplitFeature` put its slot at the foot of the chapter, where a
           * prose band leaves cream to hang a drawing in. A pinned stage leaves
           * none: at 1440x900 a centred card is 506px of a 793px stage, the film
           * is 400px tall, and there is no scroll position at which both fit one
           * screen. `Coverflow` therefore puts this into the slack its own header
           * band already has — measured, and measured against the two
           * alternatives, in `docs/reviews/2026-08-16-coverflow/
           * flanks-and-tiger.md`. Nothing about that is visible from here, which
           * is why it is written down in both places.
           *
           * **Two things about the film are still load-bearing wherever it goes.**
           * It erases its own white ground with `mix-blend-mode: darken` against
           * the chapter's cream, so no ancestor between it and that cream may
           * become a stacking context (`DECISIONS.md` §14, asserted as pixels at
           * six widths by `scripts/check_films.mjs`); and nothing may paint over
           * its box, which is the same rig's separate geometric assertion.
           */
          figure={
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
      {/*
       * `data-hover-zoom` scopes the slow zoom-on-hover to this page and no other.
       * The client asked for it on the homepage (12 Aug 2026) and asked for nothing
       * else to change, so the property pages are deliberately untouched. One
       * attribute here beats threading a prop through six section components, and
       * `components/motion/ImageReveal.tsx` carries the per-photograph opt-out.
       */}
      <main data-hover-zoom>
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
