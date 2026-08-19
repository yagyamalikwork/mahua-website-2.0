import { PinnedCollage } from "@/components/motion/PinnedCollage";
import { SignatureFilm } from "@/components/signature/SignatureFilm";
import { Coverflow } from "@/components/sections/Coverflow";
import { Hero } from "@/components/sections/Hero";
import { Invitation } from "@/components/sections/Invitation";
import { JunglesBand } from "@/components/sections/JunglesBand";
import { LodgePanels } from "@/components/sections/LodgePanels";
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
 * - **Which margin each pinned collage floats its images at.** Both instances
 *   using the same composition would read as a template, and a section cannot
 *   know it is the second of its kind. The page counts them and alternates —
 *   which is exactly what makes `04 · Mahua Philosophy` the mirror of
 *   `03 · Rooted Like The Mahua` that the client asked for on 19 Aug 2026,
 *   with neither section knowing the other exists.
 * **`QUOTE_SCRIM` used to be the second of those two, and it is gone as of
 * 19 Aug 2026.** It was here because ONE component, `FullBleedQuote`, served two
 * chapters over two unlike photographs, so the wash could not live in the
 * component. The v2 spine has no `fullBleedQuote` chapter at all: every
 * photograph carrying type on this page now belongs to a section that draws one
 * chapter, and each of those keeps its own solved figure beside the markup it
 * washes — `Hero.DEFAULT_SCRIM`, `Coverflow`'s `CARD_SCRIM` (keyed by `MediaId`,
 * since 16 Aug), `LodgePanels`' `PANEL_SCRIM` and `JunglesBand`'s `BAND_SCRIM`.
 * The rule the constant existed to state is unchanged and now stated in four
 * places instead of one: a scrim is a property of the photograph, raised until
 * the worst pixel under the type clears its floor, measured off a rendered
 * browser frame by `scripts/check_contrast_over_photos.mjs` and never by eye.
 *
 * The figure that was here — `{ flat: 0.34, centre: 0.45 }` for `why-you-came` —
 * was solved on 4 Aug 2026 against `tiger-golden-grass`, a photograph that left
 * the page on 19 Aug. It is not carried over: a re-photograph is a re-solve, the
 * lesson the coverflow paid for on 18 Aug.
 */

/**
 * The chapters that render on cream rather than on a photograph.
 *
 * This list is what alternates the two creams, so a chapter dropping out of it
 * flips the surface of every cream chapter BELOW it as a side effect — which is
 * why `coverflow` had to be added the day it replaced `splitFeature`, and why
 * `"splitFeature"` could only be removed safely because it was already unrouted.
 *
 * **`"chapterIntro"`, `"plateGrid"` and `"testimonials"` came out on 19 Aug 2026,
 * and that is a real change to the page rather than a tidy-up.** All three were
 * routed until that day, so the creams below them shift.
 *
 * **`"lodgeCards"` → `"lodgePanels"` and `"junglesBand"` joined later the same
 * day.** Both new sections are cream chapters with a photograph reaching the
 * screen's edge inside them — they are not `ChapterSurface` (each needs a child
 * that escapes the 1,600px container) but they carry its padding, its `--bg`
 * redefinition and therefore its place in this alternation. `junglesBand` is a
 * genuine addition: `02 · The Jungles` was a full-screen photograph and counted
 * as no cream chapter at all, so **every cream chapter below it flips**. The new
 * order is `lodges` (base), `why-you-came` (deep), `rooted` (base), `philosophy`
 * (deep), `field-days` (base) — still alternating, which is the only property
 * this list owes anybody.
 */
const CREAM_KINDS: readonly ChapterKind[] = [
  "lodgePanels",
  "junglesBand",
  "pinnedCollage",
  "coverflow",
];

/**
 * The kinds that share `ChapterIntro`'s composition, pinned or not.
 *
 * One entry since 19 Aug 2026, `"chapterIntro"` having left `ChapterKind` with
 * `06 · The Lantern Hour`. It is still a list rather than an equality check
 * because the count it feeds is positional: anything sharing that composition
 * has to be counted here or the mirroring silently desynchronises.
 */
const INTRO_KINDS: readonly ChapterKind[] = ["pinnedCollage"];

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
    /*
     * **`case "lodgeCards"` was here until 19 Aug 2026** — the same shape as the
     * three arms retired earlier that day, with one difference worth recording:
     * `components/sections/LodgeCards.tsx` is not routed by anything on any page
     * now, where `FullBleedQuote` (the arm below it, also retired) is still what
     * both property pages draw their `"fullBleed"` chapters with. One is a
     * candidate for deletion; the other must not be deleted.
     */
    case "lodgePanels":
      return <LodgePanels key={chapter.id} chapter={chapter} surface={at.surface} />;
    case "junglesBand":
      return <JunglesBand key={chapter.id} chapter={chapter} surface={at.surface} />;
    /*
     * **`case "chapterIntro"` was here until 19 Aug 2026, and it is what hung
     * the lantern.** `06 · The Lantern Hour` was the page's only `chapterIntro`,
     * and the client's own restructure removes that chapter, so both the arm and
     * the `hanging={chapter.id === "lantern-hour" ? <HangingLantern /> : …}`
     * line went with it.
     *
     * **The lantern is not deleted, it is unmounted.** `HangingLantern`, its
     * artwork (`lib/lantern-art.ts`), `build_lantern.mjs` and
     * `scripts/check_lantern.mjs` are all untouched and all still work — this
     * page is simply the only thing that ever mounted it, and nothing on the v2
     * spine has a night photograph to hang it out of. `docs/DECISIONS.md` §13 is
     * the record of what it cost to build; restoring it is one prop on whichever
     * chapter next sits under a lit facade. `check_lantern.mjs` fails against
     * this branch, and that failure is the ruling, not a regression.
     */
    case "pinnedCollage":
      return (
        <PinnedCollage
          key={chapter.id}
          chapter={chapter}
          mirrored={at.intro % 2 === 1}
          surface={at.surface}
          /*
           * The potter closes `rooted`, and ONLY `rooted`.
           *
           * **The `chapter.id` test is new on 19 Aug 2026 and it is load-bearing,
           * not defensive.** This arm rendered one chapter until that day, so the
           * film could be passed unconditionally; `philosophy` is a second
           * `pinnedCollage` now, and without the test the same potter film would
           * play twice on one page — once under a chapter whose copy names the
           * potters of Pachdhar, and once under a chapter about rooms.
           *
           * `rooted` is the one chapter whose copy already names them — the
           * potters of Pachdhar, whose wheel this page invites you to take a
           * turn at — which is why it is the film's chapter and not the other's.
           *
           * **Spec §4 removes this film outright, and that is deliberately NOT
           * done here.** It belongs with the realignment the same section
           * describes (text left, photographs right), which is a component
           * change. When it goes, `scripts/check_films.mjs` loses its `rooted`
           * arm with it — that rig asserts two films and would then assert one.
           */
          footer={
            chapter.id === "rooted" ? (
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
                 * That read as a feature the chapter had not asked for, and it
                 * cost 823px of scroll. Measured at 1280 there are **24px** of
                 * slack below the prose and at 1024 the text column is taller
                 * than the photographs, so there is no large hole here to fill —
                 * only the 80px of padding, which is what this now sits in.
                 *
                 * How far up it sits is `PinnedCollage`'s decision and not this
                 * one's, because the answer is different in the two branches:
                 * only the pinned composition leaves its photographs displaced
                 * when the scene lets go. See the note on the footer there.
                 */
                className="block h-auto w-[150px] sm:w-[180px] lg:w-[220px]"
              />
            ) : undefined
          }
        />
      );
    /*
     * **`case "plateGrid"` was here until 19 Aug 2026, and it is what carried the
     * hornbill forest tint.** The three plate boards — `03 · The Forest`,
     * `05 · The Rooms`, `07 · Details` — all leave the page with the restructure,
     * and the tint was mounted on the first of them alone
     * (`backdrop={chapter.id === "forest" ? <ForestBackdrop … /> : undefined}`).
     *
     * **The drawing is not deleted, it is unmounted**, exactly like the lantern
     * above. `components/ui/ForestBackdrop.tsx`, `lib/forest-overlay.ts` and
     * `scripts/build_forest_overlay.mjs` are untouched, and the two-segment solve
     * that made the client's own re-rendered artwork legible (foliage 0.267,
     * birds 0.135, both under the same 4.55:1 floor — `docs/DECISIONS.md` §15)
     * still stands and still runs. What has gone is the chapter it stood behind:
     * its copy counted "three hundred recorded birds", which is why the birds
     * were there and not somewhere else, and that paragraph now sits in
     * `02 · The Jungles` over a photograph rather than over cream.
     *
     * Note for whoever builds that band: the tint is baked onto a specific cream
     * at build time rather than blended at runtime, so it cannot simply be laid
     * under a photograph — it needs a cream chapter to stand on.
     */
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
    /*
     * **`case "testimonials"` was here until 19 Aug 2026.** The `guests` band is
     * gone as a chapter and its three quotes moved into `invitation`'s copy —
     * the client's own placement, *"below the two property buttons"*. They are
     * not rendered anywhere yet: `Invitation.tsx` has to be taught to read
     * `chapterCopy("invitation").quotes`, which is the next task.
     *
     * The two photographs the band carried, `lawn-picnic-golden-hour` and
     * `garden-path-lodge`, are curated and now unused. They were deliberately
     * NOT added to `invitation`'s media: that chapter is `FULL_BLEED_KINDS`, so
     * every id it declares must be full-bleed-safe, and — more to the point —
     * `measure_density.mjs` scores what is painted, so declaring photographs
     * nothing draws would move no pixel and mislead the next reader.
     */
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
