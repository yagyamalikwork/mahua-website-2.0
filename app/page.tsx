import { PinnedCollage } from "@/components/motion/PinnedCollage";
import { SignatureFilm } from "@/components/signature/SignatureFilm";
import { ExperienceStrip } from "@/components/sections/ExperienceStrip";
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
 * washes — `Hero.DEFAULT_SCRIM`, `ExperienceStrip`'s `CARD_SCRIM` (keyed by
 * `MediaId`), `LodgePanels`' `PANEL_SCRIM` and `JunglesBand`'s `BAND_SCRIM`.
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
 * why `experienceStrip` had to be added the day it replaced `splitFeature`
 * (then as `coverflow`), and why
 * `"splitFeature"` could only be removed safely because it was already unrouted.
 *
 * **`"chapterIntro"`, `"plateGrid"` and `"testimonials"` came out on 19 Aug 2026,
 * and that is a real change to the page rather than a tidy-up.** All three were
 * routed until that day, so the creams below them shift.
 *
 * **`"lodgeCards"` → `"lodgePanels"` on 19 Aug 2026.** It is a cream chapter
 * with a photograph reaching the screen's edge inside it — not `ChapterSurface`,
 * because it needs a child that escapes the 1,600px container, but it carries
 * that component's padding, its `--bg` redefinition and therefore its place in
 * this alternation.
 *
 * **`"junglesBand"` joined the same day and left again on 20 Aug 2026, and both
 * moves flip every cream chapter below it.** It joined because the band was a
 * photograph inside a cream section, with the chapter's words in the cream above
 * and below it. The client then asked for those words back on the photograph and
 * for the photograph to *"look like the background for this section"*, so the
 * section is now `--overlay` from edge to edge with no cream in it at all — the
 * same shape as the `fullBleedQuote` it originally replaced, which was not on
 * this list either. The order is back to `lodges` (base), `rooted` (deep),
 * `philosophy` (deep, continuing), `field-days` (base) — still alternating,
 * which is the only property this list owes anybody.
 *
 * **That order has one deliberate break in it since 19 Aug 2026, and it is a
 * client ruling rather than an oversight.** `04 · Mahua Philosophy` is *"an
 * extension of an already existing section"*, so it stands on the same cream as
 * `03 · Rooted Like The Mahua` instead of stepping off it — a tonal step there
 * would say "two panels meeting", which is precisely what the pair must not say.
 * `positions()` below is what hands it down, and it does not advance the cycle
 * for a continuing chapter, so everything beneath the pair alternates as though
 * the two were one chapter: `lodges` (base), `rooted` (deep), `philosophy`
 * (**deep**, continuing), `field-days` (base). Alternation is still the property
 * this list owes; the one join it no longer draws is the one join that is not
 * supposed to be seen.
 */
const CREAM_KINDS: readonly ChapterKind[] = [
  "lodgePanels",
  "pinnedCollage",
  // `"coverflow"` until 19 Aug 2026, renamed with its kind when the pinned
  // carousel became a horizontal strip. The surface it takes is unchanged, which
  // is what stops the rename flipping every cream chapter below it — and there
  // are none below it, so the whole risk this list carries is one that did not
  // arise this time.
  "experienceStrip",
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
  /**
   * This chapter is the second half of the one above it.
   *
   * True where a `pinnedCollage` follows a `pinnedCollage` — today, `04 · Mahua
   * Philosophy` after `03 · Rooted Like The Mahua`. The client asked for the
   * second to read as *"an extension of an already existing section"*, and the
   * two things that make two sections read as one idea both belong to the page
   * rather than to either section: they stand on the same cream, and they meet
   * without a band of cream between them. See `PinnedCollage`'s own `continues`.
   */
  continues: boolean;
};

/**
 * Every chapter's place in the page, worked out in one pass before anything
 * renders.
 *
 * It was two counters incremented inside the `map` until 19 Aug 2026, which was
 * fine while every position depended only on the chapters *above* — but
 * `continues` depends on the chapter above being of the same kind, and the
 * surface it hands down is the one that chapter already took rather than the
 * next in the cycle. An expression evaluated inside `map`'s own argument list
 * cannot look backwards at what it decided last time round.
 */
function positions(): readonly Position[] {
  let intro = 0;
  let cream = 0;
  let lastSurface = false;
  const out: Position[] = [];

  for (let i = 0; i < CHAPTERS.length; i++) {
    const chapter = CHAPTERS[i];
    const continues =
      chapter.kind === "pinnedCollage" && CHAPTERS[i - 1]?.kind === "pinnedCollage";
    /*
     * A continuing chapter takes the cream the chapter above it is standing on
     * and does not advance the cycle — so the alternation carries on beneath the
     * pair as if it were one chapter, which is what it is meant to look like.
     * The sequence today: `lodges` base, `why-you-came` deep, `rooted` base,
     * `philosophy` base (continuing), `field-days` deep.
     */
    const surface: boolean = CREAM_KINDS.includes(chapter.kind)
      ? continues
        ? lastSurface
        : cream++ % 2 === 1
      : false;
    if (CREAM_KINDS.includes(chapter.kind)) lastSurface = surface;
    out.push({
      intro: INTRO_KINDS.includes(chapter.kind) ? intro++ : 0,
      surface,
      continues,
    });
  }

  return out;
}

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
    /*
     * **No `surface` since 20 Aug 2026, and the prop is gone rather than passed
     * as `false`.** The band is `--overlay` from edge to edge now that the
     * client has asked for the chapter's words back onto the photograph, so
     * there is no cream in it for the alternation to choose between — see
     * `CREAM_KINDS` above, which it also left.
     */
    case "junglesBand":
      return <JunglesBand key={chapter.id} chapter={chapter} />;
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
    /*
     * **The potter's film closed `rooted` until 19 Aug 2026 and this arm is
     * where it was mounted.** Spec §4, in the client's own words: *"first the
     * animated potter needs to be removed."* It went with the realignment the
     * same section asks for — text left, photographs lined up on the right —
     * and it went from here rather than from `PinnedCollage`, because a section
     * component should not know which chapter it is drawing.
     *
     * **Nothing about the film is deleted.** `components/signature/
     * SignatureFilm.tsx`, `/media/potter-film.mp4`, its poster and
     * `scripts/check_films.mjs` are all untouched, and `feat/image-sizing` still
     * ships it. What that rig loses on this branch is its `rooted` arm: it
     * asserts two films and there is one, so the potter's play-once, hold and
     * hover-replay assertions are no longer exercised here. The tiger's are, and
     * they are the ones that still describe something on the page.
     *
     * `PinnedCollage` has no `footer` slot to give it back to — see the note
     * there on why the pull-up that positioned it could not survive the
     * recomposition.
     */
    case "pinnedCollage":
      return (
        <PinnedCollage
          key={chapter.id}
          chapter={chapter}
          mirrored={at.intro % 2 === 1}
          surface={at.surface}
          continues={at.continues}
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
    case "experienceStrip":
      return (
        <ExperienceStrip
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
           * since `field-days` changed shape. The coverflow itself was retired on
           * 19 Aug, and this arm outlived it too.
           *
           * **The prop is `figure`, not `footer`, and the word is now history
           * rather than a live constraint.** `SplitFeature` put its slot at the
           * foot of the chapter, where a prose band leaves cream to hang a
           * drawing in; a pinned stage left none, which is why the film moved
           * into the header band's own slack (measured against both alternatives
           * in `docs/reviews/2026-08-16-coverflow/flanks-and-tiger.md`). **There
           * is no pinned stage any more**, so that argument is spent — the film
           * stays exactly where it is because the client asked for it to
           * (*"keep the tiger where it is now"*, 17 Aug), and if it is ever asked
           * to move again the question is genuinely open.
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
     * the client's own placement, *"below the two property buttons"* — where
     * `Invitation.tsx` now renders them, below the two pills.
     * `components/sections/Testimonials.tsx` was deleted with them, along with
     * its two rows and its box case in `lib/sizes.test.ts`.
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
  const at = positions();

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
        {CHAPTERS.map((chapter, i) => renderChapter(chapter, at[i]))}
      </main>
    </>
  );
}
