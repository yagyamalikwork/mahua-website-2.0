import { Enter } from "@/components/motion/Enter";
import { CoverflowCard } from "@/components/sections/CoverflowCard";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import type { ScrimStrength } from "@/components/ui/Scrim";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type ExperienceCopy, type TwoTone } from "@/content/home";
import { coverflowNeighbours, coverflowTargetId } from "@/lib/coverflow";
import type { MediaId } from "@/lib/media";

type CoverflowCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
  readonly experiences: readonly ExperienceCopy[];
};

/*
 * **This file exported `SIZES` and `BOXES` until 17 Aug 2026 and no longer draws
 * a `<Photo>` at all.**
 *
 * They described the header band's four photographs — a `col-span-7` frame for
 * `guide-sunrise`, a half-column `pair` for `hammocks-shade` and
 * `pool-daylight-forest`, and a flat 420px `track` cap for a 541px
 * `tiger-crossing-track`. The client deleted that band on 17 Aug (see the note
 * on `Coverflow` below), so all three widths, all three boxes and their three
 * rows in `lib/sizes.test.ts` went with it. The only `sizes` string this chapter
 * still serves is `CoverflowCard`'s own `CARD_SIZES`.
 *
 * The `track` cap is the one worth remembering rather than merely deleting: it
 * was a width set by a FILE rather than by a column, the only one on the page,
 * and it existed because `tiger-crossing-track` was 541px wide. It is 1344px now
 * and back on a card, which is why nothing here needs to know that.
 */

/**
 * The wash between each card's photograph and the cream type laid on it.
 *
 * **Solved twice against the rendered page — 16 Aug 2026, then RE-solved from
 * scratch on 17 Aug when the client re-exported all six photographs.** Six
 * frames, six exposures, six figures, each raised only until the worst single
 * pixel under that card's type clears 4.5:1 and no further. Every one is
 * re-derivable: `scripts/check_contrast_over_photos.mjs` carries a run per card,
 * and the 16 Aug sweep is `docs/reviews/2026-08-16-coverflow/scrims.md`.
 *
 * **A re-crop is a re-solve, and this is the evidence for saying so.** The six
 * new files are the same photographs at 1344x685 rather than 1163x508 or
 * 1440x960 — different windows on the same scenes, nothing else. Carried over
 * unchanged, the 16 Aug figures put `vann-bird-watching` at **3.16:1** and
 * `forest-boardwalk-daylight` at **4.28:1** at 390px, both below the floor,
 * while `tiger-crossing-track` and `vann-potters-village` came out
 * over-washed. The photograph moved and the wash did not.
 *
 * **Unwashed, at 390px, the six now measure 1.36 / 1.00 / 1.31 / 1.04 / 1.03 /
 * 1.00** in the order below — two of them at 1.00:1, the theoretical floor,
 * which is cream type on pixels of the same luminance. (The 16 Aug set read
 * 1.01–1.32.) The figures below are what each becomes.
 *
 * **The shape is `centre` + `bottom` + `corner`, and the shape is the finding.**
 * `Scrim.tsx` is explicit that a flat wash heavy enough for the brightest patch
 * flattens the whole photograph to mud, so the layers are put where the type is.
 * Where the type IS, though, depends on the width, and this card changes shape
 * more than most: at 1440 the words are 27% of the card's height and sit low in
 * it, so `bottom` + `corner` alone solve it and leave the frame alone. At 390 the
 * same words — floored by their own `clamp()` while the card shrinks to 342x192 —
 * are **58%** of the card, and their top edge is above the `bottom` band
 * entirely. No amount of `bottom` reaches them. `centre` is the layer whose
 * geometry matches that case, and it is why these figures are heavier than a
 * desktop-only solve would need. **390 is what binds every one of them.**
 *
 * The cost is real and is written down rather than hidden: at 1440 these frames
 * are duller than the `{ bottom, corner }` pair that clears the same floor there
 * (`docs/reviews/2026-08-16-coverflow/scrims.md` §4). The lever that would buy it
 * back is the card's own small-screen composition — smaller type, or fewer words,
 * or a taller card below ~950px — not a lighter wash. **Do not lighten these
 * without re-running the rig at 390**; the desktop widths pass with several
 * points to spare and will not notice.
 *
 * **Keyed by photograph, not by activity, and not in `content/`.** What a scrim
 * answers to is the exposure of a frame; the activity that happens to name it is
 * irrelevant. And a wash opacity is a rendering figure rather than copy, which is
 * the whole of the architecture rule that keeps `content/` free of numbers like
 * this one — `FullBleedQuote`'s own two scrims live in `app/page.tsx` for
 * exactly the same reason.
 *
 * `Partial<Record<…>>` rather than `Record<MediaId, ScrimStrength>`: `MediaId` is
 * all fifty-three curated photographs and this map is about six of them. The
 * fallback is a deliberately heavy wash, so a card whose photograph is swapped
 * without a figure being solved for it fails towards muddy — which a reviewer
 * sees — rather than towards illegible, which they may not.
 */
const CARD_SCRIM: Partial<Record<MediaId, ScrimStrength>> = {
  // `tiger-crossing-track`, not `vann-safari`, since 17 Aug 2026 — see
  // `content/home.ts`'s `ExperienceCopy.mediaId`. The 541px file that sent this
  // frame to the header band for a day is 1344px now.
  //
  // **The lightest wash of the six**, and the only one that could be lightened
  // rather than raised on the re-solve: dry roadside dust and pale grass under
  // the type, but no blown highlight in it. 1.36:1 unwashed at 390 — the best
  // starting point in the set. → 5.08 at 390, 6.51 at 1440.
  "tiger-crossing-track": { centre: 0.55, bottom: 0.6, corner: 0.5 },
  // **The hardest photograph on the stage since the re-export, and the only one
  // that needed a heavy FLAT layer.** 1.00:1 unwashed — the theoretical floor,
  // cream type on pixels of its own luminance. The taller crop carries much more
  // of the blown-out sky burning through the canopy, and it is spread across the
  // type block rather than sitting in one patch, so no shaped layer reaches all
  // of it: `flat` 0.2 measured 4.01 and 0.3 measured 4.53, which is inside this
  // rig's own noise of the floor. 0.35 is the first value with real margin.
  // → 4.86 at 390, 9.48 at 1440. It carried `{ centre: 0.8, bottom: 0.6, corner:
  // 0.6 }` and no flat on the old 1163x508 crop, where it read 5.24.
  "vann-bird-watching": { flat: 0.35, centre: 0.8, bottom: 0.6, corner: 0.6 },
  // Still the only other card that needs a flat layer, and for the reason the
  // 16 Aug solve found: its bright water reaches the TOP-LEFT of the type block
  // at 390, the one place none of the three shaped layers covers — above the
  // `bottom` band, outside the `corner` wedge, at the `centre` ellipse's edge.
  // 1.31:1 unwashed. The flat came DOWN, 0.15 → 0.12, because the re-export puts
  // more sky and more reed bank in frame and less of the lit water under the
  // words. → 4.98 at 390, 7.04 at 1440.
  "vann-kohka-lake": { flat: 0.12, centre: 0.8, bottom: 0.6, corner: 0.6 },
  // Pale boardwalk timber lit through the canopy. 1.04:1 unwashed, against 1.32
  // on the old 1440x960 window — the shallower crop keeps the bright planks and
  // loses the dark upper canopy that used to sit behind the type. Raised, not
  // lightened: `{ centre: 0.65, bottom: 0.6, corner: 0.6 }` measured 4.28 here.
  // → 4.82 at 390, 8.64 at 1440.
  "forest-boardwalk-daylight": { centre: 0.75, bottom: 0.7, corner: 0.6 },
  // White-glazed pots, the frame `docs/OWED-ORIGINALS.md` asks for a different
  // CROP of rather than a wider file: 1.03:1 unwashed (1.01 before), because the
  // specular highlights on the black bowls sit exactly where the body copy
  // lands, and the re-export does not move them. A wash cannot fix that; only a
  // crop can. → 5.00 at 390, 5.65 at 1440 — the narrowest DESKTOP margin of the
  // six, which is the same finding stated a second way.
  "vann-potters-village": { centre: 0.7, bottom: 0.6, corner: 0.55 },
  // Sunlit leaf litter — 1.00:1 unwashed, the theoretical floor again, but the
  // bright pixels are low in the frame, so `bottom` does more of the work here
  // than anywhere else in the set and the `centre` can stay lowest-but-one.
  // → 4.86 at 390, 6.43 at 1440.
  "forest-trail-canopy": { centre: 0.6, bottom: 0.75, corner: 0.55 },
};

/**
 * The fallback for a photograph nobody has solved a figure for.
 *
 * An unsolved card must fail towards legible-but-muddy, which a reviewer sees,
 * not towards illegible, which they may not. Nothing reaches it today — all six
 * cards are in `CARD_SCRIM` — and it exists for the swap that changes one
 * `mediaId` in `content/home.ts` without coming back here.
 *
 * **It used to be heavier than every solved figure and no longer is, in one
 * layer.** The 17 Aug re-solve took `vann-bird-watching`'s `centre` to 0.8
 * against this 0.7, because a blown-out sky needed it. This is still heavier
 * overall on every card and still the right direction to fail in; it is simply
 * no longer true that it dominates each solved figure layer by layer, and saying
 * so is cheaper than a reader discovering it.
 */
const PLACEHOLDER_SCRIM: ScrimStrength = { flat: 0.35, centre: 0.7, bottom: 0.8, corner: 0.6 };

/**
 * `04 · Days in the Field` as a coverflow — six activities, six cards, advancing
 * on the visitor's own scroll while the stage holds still.
 *
 * Client request, 16 Aug 2026: the chapter *"looks flat even though it has
 * beautiful images"*, and the density data agreed — 43.9% mean / **57.9% worst**
 * against non-negotiable #8's 45% ceiling, one of three chapters over it. He was
 * offered autoplay and declined it once the conflict with non-negotiable #5 was
 * named, so **nothing here moves unless the visitor moves**: the cards are driven
 * by a scroll-driven CSS animation, and the arrows are plain `<a href="#…">`
 * links at the scroll offsets where each card is centred, so the arrows and the
 * scrolling drive *one* position rather than competing for it.
 *
 * **A server component, and that is the whole budget claim.** Every part of the
 * effect is CSS — `app/globals.css`'s `.coverflow*` block, from the numbers
 * `app/layout.tsx` publishes out of `COVERFLOW` in `lib/motion.ts`. No
 * `"use client"` here, and none in `CoverflowCard`.
 *
 * ## The three shapes this section is made of
 *
 * 1. **A header band**, carrying the chapter mark, the heading, the dawn-gate
 *    paragraph and the tiger film. **It held four photographs and a second
 *    paragraph until 17 Aug 2026**, when the client removed both in one ruling:
 *    *"Remove all 4 images (collage of images) between the section's
 *    introductory text and the activity card carousel, also remove the text
 *    'Then the day slows right down. That is the half most lodges leave out.'"*
 *    Two rows became one. The chapter's remaining written beat is the dawn gate;
 *    the second beat left with its photographs, so `content/home.ts`'s
 *    `field-days.body` is one entry and this component reads `body[0]` only.
 * 2. **The tall wrapper**, `.coverflow` — not sticky, carrying the reserved
 *    scroll and *declaring* the view timeline the cards read.
 * 3. **The sticky stage**, holding six absolutely-positioned cards that pass
 *    through it.
 *
 * ## What lives here rather than in `CoverflowCard`
 *
 * The card knows nothing about animation, position or its neighbours' geometry;
 * it is built in flow so that any failure once this component pins it is
 * certainly the animation's (`RoomCard` was debugged the other way round and it
 * cost a fix round — `docs/DECISIONS.md` §17). So three things are this
 * component's:
 *
 * - **The six scroll targets.** The plan's Task 5 sketch put each card's `<a id>`
 *   inside the card. Task 1's probe measured that placement wrong: an anchor
 *   inside the sticky stage has no document offset corresponding to the moment
 *   its card is centred, and the naive placement lands with a *slope* of
 *   `−66 + 11·i` px — a nudge tuned on card 3 is 33px out at both ends
 *   (`docs/reviews/2026-08-16-coverflow/task-1-timeline-probe.md` §8). They are
 *   zero-size boxes in the wrapper instead, positioned by `app/globals.css` from
 *   the timeline's own arithmetic. Both ends compose the id through
 *   `coverflowTargetId`, so a link and its target cannot disagree.
 * - **Each card's neighbours' titles.** Six cards carry a pair of arrows each, so
 *   twelve links would otherwise be announced as "Previous" and "Next" twelve
 *   times with nothing to tell them apart. The section knows the running order; a
 *   card does not, and must not reach into `content/` for words belonging to a
 *   *different* card.
 * - **The six scrims.** See `CARD_SCRIM`.
 *
 * ## The tiger, and why it opens the chapter instead of closing it
 *
 * **16 Aug 2026, third placement, and the first one that is not a compromise.
 * Reaffirmed by the client on 17 Aug — *"keep the tiger where it is now"* — when
 * the band around it was deleted.** The film is the header band's right-hand
 * column, and it is nowhere near `.coverflow` at all. Removing the four
 * photographs took the photograph that used to sit *below* it and left the film
 * itself untouched: same column, same order, same 300px, same blend, and the
 * gate for that claim is `scripts/check_films.mjs` at all six widths rather than
 * a reading of this markup.
 *
 * The measurements below are the arithmetic of the two-row band and are kept as
 * *reasoning*, not as current figures: the column-height differences they quote
 * were taken when this column also held `guide-sunrise`. What survives them
 * unchanged is the constraint in point 1 — the film cannot be inside the pinned
 * viewport at any desktop shape — which is a fact about the stage, not about the
 * band. Two constraints put the film here and both were measured rather than
 * argued:
 *
 * 1. **It cannot be inside the pinned viewport at any desktop shape, and the card
 *    growing on 17 Aug 2026 made that more true, not less.** A centred card is
 *    **685px** tall in a 793px stage at 1440x900 — it was 506px until the card
 *    was swept from 900 to 1217 — leaving **54px** of cream beneath it against
 *    143px before. The film is 400px tall, so 685 + 400 + a gap does not fit in
 *    793 by an even wider margin than it did, and there is no scroll position at
 *    which a card and this film are both on a 900px screen without touching. Its
 *    two earlier homes were the two ways of losing that argument: absolutely
 *    positioned at the wrapper's foot, where it cost no height and the card
 *    painted over the tiger's head below ~1430px; and in flow below the track,
 *    clear of every card and costing the chapter a 297px band that is **78%
 *    cream** and lands on the join with `05 · Rooms` — which made 77.1% the
 *    emptiest screen on the whole site.
 * 2. **The band it needs already exists here, and nowhere else in the chapter.**
 *    Measured at 1024 / 1280 / 1440 / 1920, the header band's text column is the
 *    *taller* of the two by 353 / 311 / 222 / 160px, so its photograph column
 *    carries that much unused height. The film does not fit it outright — it is
 *    400px — but the row grows by only the difference (79 / 121 / 210 / 272px)
 *    where a tail band cost 297, and it grows at the chapter's dense head rather
 *    than at its empty join. Measured on the build that had it: `field-days`
 *    48.6% / 62.3% → 48.1% / 55.0% empty, page worst 77.1% → 67.0%. **Those four
 *    figures are 16 Aug's and are superseded twice over** — by the client's
 *    deletion of this band's photographs and by the card sweep that followed. The
 *    current pair is `field-days` **26.3% mean / 41.0% worst**, the first time
 *    this chapter has cleared non-negotiable #8 (`docs/reviews/
 *    2026-08-16-coverflow/geometry.md` §2.2).
 *
 * **Above `guide-sunrise` rather than below it was worth 10 points** — 51.6% /
 * 65.3% against 48.1% / 55.0%, same markup one line apart, because the strip of
 * cream at the foot of the text column had a 300px drawing beside it in one
 * arrangement and a 761px photograph in the other. That choice no longer exists
 * (there is no `guide-sunrise` to be above), and it is recorded because it is
 * the cheapest density lever this chapter ever had and the next person to
 * recompose this band will be looking for one.
 *
 * **The row is `lg:items-start` because of this and not by taste.** It was
 * `items-end`, which put the band's slack in one place at the top right; with
 * the film in that column the photograph column becomes the taller one, and
 * bottom-aligning would push the chapter mark and the heading 210px down the
 * page. Top-aligning moves the slack to the foot of the text column instead,
 * where the paragraph above is what it is spacing. Still true with the film
 * alone in that column.
 *
 * **The blend is still the thing that can break, and the reason is unchanged.**
 * The film's white ground is erased by `mix-blend-mode: darken` against the
 * chapter's cream — asserted **as pixels, at six widths**, by
 * `scripts/check_films.mjs`, and `docs/DECISIONS.md` §14 records that a stacking
 * context between the film and that cream is what breaks it. Nothing between
 * this element and the root may become one: not `.coverflow-figure`, not the
 * grid row, not `ChapterSurface`'s container. `position: sticky` creates one,
 * which is why the film may never be moved into `.coverflow-stage`, and
 * **`.coverflow` must never be given a `z-index`** for the same reason one level
 * up. The gate is that rig passing on pixels, never a reading of the markup.
 */
export function Coverflow({
  chapter,
  surface = false,
  figure,
}: {
  chapter: Chapter;
  surface?: boolean;
  /**
   * The chapter's drawn figure. `field-days` passes the ink tiger; nothing else
   * uses it.
   *
   * The same slot shape `SplitFeature` had, on purpose — mounting the coverflow
   * is one component name in `app/page.tsx` and nothing else. A slot rather than
   * a `chapter.id` check in here: every chapter section is self-contained, and
   * *which* chapter carries the tiger belongs to the page's spine, beside the
   * density figures that chose it.
   *
   * **It is called `figure` and not `footer`, and the rename is the finding.**
   * `SplitFeature` could put it at the foot of the chapter because a prose band
   * leaves cream there; a pinned stage does not — see the note on this component
   * for where it goes instead and what the alternative measured.
   */
  figure?: React.ReactNode;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as CoverflowCopy;
  // **Nothing here reads `chapter.media` positionally any more**, and that is
  // the shape to keep. Until 17 Aug 2026 the first four entries were the header
  // band's, destructured in the order the band drew them, so reordering a list
  // in `content/chapters.ts` could silently swap two photographs. Every card
  // names its own frame by `mediaId`, and `content/chapters.test.ts` holds each
  // of those names to MEMBERSHIP of this chapter's list rather than to a slot.
  const count = copy.experiences.length;

  /**
   * The eight cards on the stage: the six activities, with the wrap-around
   * neighbour rendered at each end.
   *
   * **The client asked for a loop** — *"the scroll needs to be repetitive and not
   * a linear straight scroll, so that after 6 the 1 card comes back or
   * vice-versa"* (16 Aug 2026) — and until this the loop existed only in the
   * arrows: scrolling ran 1 → 6 and stopped. The reading is now
   * `[6] → 1 → 2 → 3 → 4 → 5 → 6 → [1]`, so a visitor scrolling in watches the
   * last activity give way to the first, and scrolling out watches the first
   * return.
   *
   * **It is also the only lever left on this chapter's density.** The stage's
   * worst screens are the two moments the sweep named — the first and last
   * card's centre-hold, where every other card is parked at `--cf-off` and one
   * card sits alone on a 793px stage (`docs/reviews/2026-08-16-coverflow/
   * density-sweep.md` §2). `sideScale`, `sideShiftPct` and `sideVeil` cannot
   * reach it, because there is no card to put at the flanks: no card −1, no card
   * 6. There is now.
   *
   * **A ghost is a flank and never a card, and that is 17 Aug 2026's correction
   * — the client's own report.** *"When I scrolled down to the carousel it
   * started with 06-Walk and Cycling whereas it should start with 01-Jungle
   * Safari … should start with 01 and end with 06."* `step` was
   * `pin-len / (count + 1)`, so all EIGHT centred moments tiled the pin and the
   * leading ghost — the copy of activity 6 — was the card centred as the stage
   * locked, and held there. `step` is `pin-len / (count − 1)` now: the six
   * activities tile the pin, activity 1 centred where it locks and activity 6
   * where it lets go, and the two ghosts fall one step outside each end. They are
   * then held at their flanks by their own keyframes so that "outside the pin"
   * never means "in the middle of a stage that is still on screen".
   *
   * **`slot` is the animation's index and `source` is the activity's**, and they
   * are only equal for the six real cards. Verified in the browser rather than
   * trusted: `check_coverflow.mjs` bisects the six activities to their own
   * centred moments and requires every one inside 8px of the stage's centre, and
   * separately requires that NEITHER ghost is ever within 8px of it — which is
   * the client's complaint written as an assertion.
   *
   * The two ghosts carry no `id`. The scroll targets live in the wrapper (there
   * are six, one per activity, and the arrows on a ghost point at the same six),
   * so a ghost carrying a card's id would emit a duplicate id and the browser
   * would honour whichever came first.
   */
  const stageCards = [
    { experience: copy.experiences[count - 1], source: count - 1, slot: -1, ghost: true },
    ...copy.experiences.map((experience, i) => ({ experience, source: i, slot: i, ghost: false })),
    { experience: copy.experiences[0], source: 0, slot: count, ghost: true },
  ];

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      {/* The header band — one row since 17 Aug 2026, and it is the client's own
          ruling rather than a composition choice: *"Remove all 4 images (collage
          of images) between the section's introductory text and the activity
          card carousel, also remove the text 'Then the day slows right down…'"*.
          Four photographs and a display paragraph came out of these two rows,
          and the second row went with them.

          What is left is the chapter's opening — mark, heading, the dawn-gate
          paragraph — with the tiger beside it. **The tiger has not moved**
          (*"keep the tiger where it is now"*): it is still the first thing in
          this row's right-hand column, exactly where it was above
          `guide-sunrise`. The photograph that used to sit under it is gone;
          nothing about the film's own position, size or blend changed.

          ## Recomposed the same day, and the arithmetic of WHY is worth keeping

          Removing the photographs left the band's height and took its imagery,
          and the numbers said so: `field-days` read **52.0% mean / 66.2% worst**
          empty and the page's own worst screen moved here — **82.9%**, on the
          `forest / field-days` join, the emptiest screen on the site.

          **A band this wide cannot be filled with type, and that is measured
          rather than felt.** At 1440 the row is 1,344px across and 432px tall —
          581,000px² — and everything in it is one paragraph, one heading, a
          chapter mark and a 300px drawing. The rig counts a line box's own
          rect, so the text is worth roughly 75,000px² and the film's element box
          120,000: about a third of the band, whatever the columns do. Doubling
          the prose would not close it and the client has just deleted a
          paragraph from here.

          So this row is composed for the two things that ARE available — the
          text column reaching further across the band, and the band being no
          taller than the film that sets its height:

          - **7/5 rather than 5/7, and `gap-x-10` rather than `-14`.** The film is
            drawn at 300px, so a 7-column slot for it left 461px of bare cream
            inside its own column; a 5-column slot leaves 227. The width goes to
            the text, where a wider measure at a larger size is real ink.
          - **The prose is the chapter's only prose now, and is sized like it.**
            `1.15rem`/`md:text-xl` at `54ch` against `1.08rem`/`md:text-lg` at
            `52ch` — the same words, a bigger measure, more occupied area per
            line, and no new copy invented to fill a hole (`docs/DECISIONS.md`
            §2's own standing warning).
          - **`lg:items-start` is unchanged and still right.** The film column is
            the taller of the two, so bottom- or centre-aligning would push the
            chapter mark and the heading down the page by the difference. The
            slack stays at the foot of the text column, where the paragraph above
            is what it is spacing.

          The band's own height is the film's 400px and nothing here can change
          that — the film's size is declared in `app/page.tsx`, where a comment
          records that 420px is the ceiling its 810px source stays sharp to at
          DPR 2. **A wider drawing is the one lever this band has left**, and it
          is one line there rather than anything here. What this row does spend
          is the 32px `margin-bottom` that used to sit under the film and half the
          gap below the band; see `.coverflow-figure` in `app/globals.css`. */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-x-10">
        <div className="lg:col-span-7">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
              <p
                className="mt-7 max-w-[54ch] font-[family-name:var(--font-body)] text-[1.15rem] leading-[1.68] md:text-xl"
                style={{ color: "var(--text)" }}
              >
                {copy.body[0]}
              </p>
            </div>
          </Enter>
        </div>

        <div className="lg:col-span-5">
          {/* The tiger. Deliberately NOT wrapped in `ImageReveal`: that is a
              masked entrance, and a mask is a stacking context, which is what
              erases this film's white ground. `.coverflow-figure` must not
              become one either — see the note on this component, and
              `scripts/check_films.mjs`, which is the gate. */}
          {figure && <div className="coverflow-figure">{figure}</div>}
        </div>
      </div>

      {/*
       * The stage. Everything about how this moves is in `app/globals.css` above
       * `.coverflow`; the markup's only job is to be a complete, readable list of
       * six cards when nothing moves it — which is exactly what a browser without
       * `animation-timeline`, or a visitor who has asked for reduced motion, gets.
       *
       * `--coverflow-count` is the only number this component writes. It inherits
       * from here to the cards and to the targets, which is what lets one
       * stylesheet compute each element's own window without a per-index rule.
       */}
      <div
        // `mt-8 lg:mt-10`, halved on 17 Aug 2026 with the band above it. A
        // centred card already leaves cream of its own inside the stage — the
        // stage is `100svh − header` and the card is centred in it — so this
        // margin was being paid on top of a gap the pin creates for free, in the
        // chapter whose worst screen was the page's worst.
        className="coverflow mt-8 lg:mt-10"
        style={{ "--coverflow-count": String(count) } as React.CSSProperties}
      >
        {/* The six scroll targets. Zero-size, in the wrapper rather than in the
            cards — see the note on this component. `aria-hidden` because they
            carry nothing to read; the arrows that point at them are the
            navigation, and they are real links with real names. */}
        {copy.experiences.map((experience, i) => (
          <span
            key={experience.title}
            id={coverflowTargetId(chapter.id, i)}
            aria-hidden="true"
            className="coverflow-target"
            style={{ "--i": String(i) } as React.CSSProperties}
          />
        ))}

        {/* The pin's own box. It carries the reserved scroll and it is the sticky
            stage's containing block: sticky stops when the stage's bottom meets
            THIS element's bottom. It was added so a band below it could be a band
            no card could reach, and the tiger lived there for one afternoon —
            until that band was measured at 78% cream on the chapter's own join.
            Nothing is laid out below it now; see `.coverflow-track` in
            `app/globals.css` for why it is still a separate box from the
            wrapper. */}
        <div className="coverflow-track">
          <ul className="coverflow-stage">
            {stageCards.map(({ experience, source, slot, ghost }) => {
              const { previous, next } = coverflowNeighbours(source, count);
              return (
                <CoverflowCard
                  key={slot}
                  experience={experience}
                  scrim={CARD_SCRIM[experience.mediaId] ?? PLACEHOLDER_SCRIM}
                  index={source}
                  slot={slot}
                  ghost={ghost}
                  count={count}
                  chapterId={chapter.id}
                  previousTitle={copy.experiences[previous].title}
                  nextTitle={copy.experiences[next].title}
                />
              );
            })}
          </ul>
        </div>

      </div>
    </ChapterSurface>
  );
}

/*
 * **This file's own `sizes` strings were registered in `lib/sizes.test.ts` on
 * 16 Aug 2026 and retired on 17 Aug with the band that used them. The hole that
 * had hidden them for a day is what is worth keeping.**
 *
 * That file's table puts every `sizes` string on the page through `capDensity`'s
 * round trip and through all fifty-three photographs, and its companion test —
 * "imports from every component that passes a sizes prop" — exists precisely so
 * a new component cannot be forgotten. It did not fire here, and the reason
 * generalises: it asserted that the test file's own source
 * `toContain("@/components/sections/Coverflow")`, and that string is a
 * **substring** of `@/components/sections/CoverflowCard`, which was already
 * imported. So the tripwire read green for a file it had never seen, and three
 * `sizes` strings went unchecked. It now matches the specifier *with its closing
 * quote*, which is what makes a prefix stop being a match.
 *
 * That fix is why the three rows could be removed cleanly here: with the closing
 * quote in the match, this file passing no `sizes` prop is now something the
 * tripwire can actually see. `CoverflowCard` is still imported there, on its own
 * merits.
 */
