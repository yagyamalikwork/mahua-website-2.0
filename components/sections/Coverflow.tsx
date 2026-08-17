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
 * **Solved three times against the rendered page — 16 Aug 2026, re-solved on
 * 17 Aug when the client re-exported all six photographs, and re-solved AGAIN
 * from scratch on 18 Aug when he asked for the words to be centred.** Six
 * frames, six exposures, six figures, each raised only until the worst single
 * pixel under that card's type clears 4.5:1 and no further. Every one is
 * re-derivable: `scripts/check_contrast_over_photos.mjs` carries a run per card;
 * the sweeps are `docs/reviews/2026-08-16-coverflow/scrims.md` (16 Aug) and
 * `wider.md` §3 (18 Aug).
 *
 * **Moving type is a re-solve, exactly as re-cropping a photograph was.** Both
 * are the same statement — a scrim answers to the pixels *under the glyphs*, and
 * either the glyphs or the pixels moving invalidates it. Carried over unchanged
 * onto the centred composition, the 17 Aug figures put `vann-potters-village` at
 * **3.47:1** and `forest-trail-canopy` at **3.61:1** at 390px, both below the
 * floor, while `vann-bird-watching` came out at 8.00 — over-washed by a mile.
 *
 * **Unwashed, the six measure 1.22 / 1.00 / 1.34 / 1.06 / 1.02 / 1.02 at 390 and
 * 1.05 / 1.03 / 1.30 / 1.00 / 1.00 / 1.00 at 1440**, in the order below — four
 * of them at the theoretical floor of 1.00:1, which is cream type on pixels of
 * exactly its own luminance. The figures below are what each becomes.
 *
 * ## Centring the words made the scrims LIGHTER, and that is the finding
 *
 * The shape is now **`centre` + `bottom`, and nothing else** — where it was
 * `centre` + `bottom` + `corner` plus a `flat` on two cards. Every one of the six
 * carries less overlay than it did, and two of them lost a flat wash entirely.
 * Three reasons, all geometric:
 *
 * - **`centre` is a radial that is fully opaque out to 34% of its own extent and
 *   fades to nothing at 100%.** Bottom-anchored type sat at the *edge* of that
 *   ellipse and was mostly being carried by `bottom` and `corner`; centred type
 *   sits in its opaque middle. The same layer at a lower opacity now does more.
 * - **`corner` is a wedge into the bottom-LEFT only.** It existed to reach a
 *   headline standing on the floor of the frame, and it never reached "NEXT" in
 *   the opposite corner. With the words gone from the floor, the only type left
 *   down there is the two arrows, and `bottom` spans the full width — so the
 *   wedge answers a question nobody is asking any more.
 * - **The 390px case stopped being pathological.** `scrims.md` §5 recorded that
 *   bottom-anchored words are 58% of the card's height at 390 and their top edge
 *   clears the `bottom` band entirely, so *no* value of `bottom` reached them —
 *   which is what forced the heavy figures. Centred words are centred at every
 *   width, so one layer's geometry now matches the type at all four.
 *
 * **390 no longer binds all six.** It binds cards 02, 05 and 06; **1440 binds
 * card 04** (4.85) and **768 binds card 01** (4.91). Re-run the rig at **all four
 * widths** after touching any of these — a desktop-only or phone-only check would
 * now pass a build that fails somewhere else, which was not true of the 17 Aug
 * set.
 *
 * **Do not lighten these further.** The tightest three sit at 4.71-4.78, which is
 * 5-6% over the floor, and `check_contrast_over_photos.mjs` is the only instrument
 * on this project that can see it.
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
  // **Still the lightest wash of the six**, and still for the same reason: dry
  // roadside dust and pale grass under the type, no blown highlight in it. 1.22:1
  // unwashed at 390, the best starting point in the set. It carried
  // `{ centre: 0.55, bottom: 0.6, corner: 0.5 }` for the bottom-anchored words.
  // **768 is what binds it**, not 390 — the one card in the set where that is
  // true. → 5.49 at 390, 4.91 at 768, 5.09 at 1440 and 1920.
  "tiger-crossing-track": { centre: 0.63, bottom: 0.58 },
  // **The hardest photograph in the set on 17 Aug, and no longer.** It needed
  // `{ flat: 0.35, centre: 0.8, bottom: 0.6, corner: 0.6 }` — the only heavy flat
  // on the stage — because the blown-out sky burning through the canopy is spread
  // across the whole frame rather than sitting in one patch, and no shaped layer
  // reached the words where they sat. Centred, one radial does it and the flat is
  // gone: the frame keeps its sky. 1.00:1 unwashed, the theoretical floor.
  // → 4.78 at 390, 4.89 at 768, 5.55 at 1440.
  "vann-bird-watching": { centre: 0.7, bottom: 0.6 },
  // Its bright water used to reach the TOP-LEFT of the type block at 390, the one
  // place none of the three shaped layers covered, which is why this frame
  // carried a `flat` too. That corner is not where any type is now. 1.34:1
  // unwashed — the best of the six — but the highest `centre` of the six all the
  // same, because what is under the CENTRED words here is lit open water.
  // **Its arrows are what bind it at 1440** (5.33 against the words' 7.03): the
  // reed bank at the frame's foot is the brightest thing left in it.
  // → 4.99 at 390, 6.14 at 768, 5.33 at 1440.
  "vann-kohka-lake": { centre: 0.75, bottom: 0.62 },
  // Pale boardwalk timber lit through the canopy — the shallower 17 Aug crop
  // keeps the bright planks and lost the dark upper canopy that used to sit
  // behind the type. 1.06:1 unwashed at 390 and **1.00 at 1440**, and 1440 is
  // what binds it: at 4.85 it is the only card in the set solved on a desktop
  // width. It carried `{ centre: 0.75, bottom: 0.7, corner: 0.6 }`.
  // → 5.77 at 390, 5.28 at 768, 4.85 at 1440 and 1920.
  "forest-boardwalk-daylight": { centre: 0.68, bottom: 0.6 },
  // White-glazed pots, the frame `docs/OWED-ORIGINALS.md` asks for a different
  // CROP of rather than a wider file: 1.02:1 unwashed at 390 and 1.00 at 1440,
  // because the specular highlights on the black bowls sit exactly where the body
  // copy lands — and centring the copy did not move them off, which is the same
  // finding a third time. A wash cannot fix that; only a crop can.
  // → 4.71 at 390 — the tightest figure on the page — 4.75 at 768, 5.33 at 1440.
  "vann-potters-village": { centre: 0.69, bottom: 0.6 },
  // Sunlit leaf litter — 1.02:1 unwashed at 390, 1.00 at 1440. Its bright pixels
  // are low in the frame, which is why this was the one card whose `bottom`
  // (0.75) used to be heavier than its `centre` (0.6). Centred type has moved off
  // the bright half and the two have swapped back round.
  // → 4.73 at 390, 5.59 at 768, 5.52 at 1440.
  "forest-trail-canopy": { centre: 0.7, bottom: 0.6 },
};

/**
 * The fallback for a photograph nobody has solved a figure for.
 *
 * An unsolved card must fail towards legible-but-muddy, which a reviewer sees,
 * not towards illegible, which they may not. Nothing reaches it today — all six
 * cards are in `CARD_SCRIM` — and it exists for the swap that changes one
 * `mediaId` in `content/home.ts` without coming back here.
 *
 * **It dominates every solved figure again, layer by layer, since the 18 Aug
 * re-solve** — the heaviest `centre` on the stage is now 0.75 against this 0.7…
 * which is still short. Raised to 0.8 with the rest, so the promise this comment
 * makes is one the numbers keep: no card can be swapped in and land lighter than
 * the fallback by accident. It was briefly untrue on 17 Aug (`vann-bird-watching`
 * needed a `centre` of 0.8), and saying so is cheaper than a reader discovering
 * it.
 */
const PLACEHOLDER_SCRIM: ScrimStrength = { flat: 0.35, centre: 0.8, bottom: 0.8, corner: 0.6 };

/**
 * `04 · Days in the Field` as a coverflow — six activities, six cards, advancing
 * on the visitor's own scroll while the stage holds still.
 *
 * **It runs 01 to 06 and stops at both ends, since 18 Aug 2026.** The client, who
 * had asked for a loop on 16 Aug and seen it built: *"As I scroll down to the
 * carousel, I see a card before the 01-The safari card and when I scroll to the
 * end I see a 01-The safari card after the 06 card … let's make it linear and
 * just keep it 01 to 06, so that when I come to the carousel I see card 01 in
 * focus with no card placed before it … and when I scroll down to card 06 I see
 * [05] beside it but no card placed after it."* Two `aria-hidden` wrap-around
 * ghosts at `--i: -1` and `--i: count` are what he was seeing, and they are gone
 * — the markup, their two `data-cf` roles, their four keyframes and the rig
 * assertion that policed them. **The arrows went linear with them**, which is
 * this project's ruling rather than his words: his own route back is the scroll
 * (*"they will have to scroll back to card 01"*), so an arrow that wrapped would
 * reintroduce the loop by another door. `lib/coverflow.ts` carries that, and
 * `docs/reviews/2026-08-16-coverflow/linear.md` carries what it cost.
 *
 * **What did NOT go with them is the pair of end-holds** (`[data-cf]` in
 * `CoverflowCard`), and that is why they were moved onto the two real end cards
 * on 17 Aug rather than left on the ghosts: the stage must not ride in or out
 * empty, which is a fact about a sticky box being on screen for its own height
 * and has nothing to do with wrapping.
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
 * - **Each card's neighbours' titles.** Ten arrows across the six cards — the
 *   first has no "previous" and the last no "next" — would otherwise be announced
 *   as "Previous" and "Next" five times each with nothing to tell them apart. The
 *   section knows the running order; a card does not, and must not reach into
 *   `content/` for words belonging to a *different* card.
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

  return (
    // `tight` — the client's third change of 18 Aug 2026: *"I see a lot of margin
    // and gap between the carousel cards and the section heading and text (and
    // the animated tiger) for 04 · Days in the Field, and the next section 05 ·
    // The Rooms, which makes the carousel feel disconnected. Make sure it fits
    // snugly and has no large unnecessary, disconnecting space before or after."*
    //
    // `py-10 md:py-12 lg:py-14` against the default `py-14 md:py-16 lg:py-20`, so
    // 24px comes off this chapter's own top and bottom at 1440. It is the same
    // dial `OpeningColumn`, `PropertyMap` and `PressBand` turn on the property
    // pages, opt-in per chapter, and it changes nothing else on this page.
    //
    // **It is half of each join and never the whole of it.** The 214px between
    // the last card and `05 · The Rooms`'s chapter mark at 1440 is 54px of cream
    // inside the stage, then this chapter's 80px, then the rooms chapter's own
    // 80px — and only the middle number is reachable from this file. The 54px is
    // structural and deliberately untouched: see the note on `.coverflow` in
    // `app/globals.css` for why the stage's height is not the dial it looks like.
    <ChapterSurface id={chapter.id} surface={surface} tight>
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
        // `mt-8 lg:mt-10` on 17 Aug 2026, halved again to `mt-3 lg:mt-4` on 18
        // Aug — the client's *"make sure it fits snugly"*.
        //
        // **This margin is never the whole gap and the arithmetic is why.** A
        // centred card leaves 54px of cream above itself INSIDE the stage at
        // 1440x900 (the stage is `100svh − header` = 793px and the card is 685px
        // tall), so what a visitor actually sees between the tiger's tail and the
        // card's top is this margin PLUS that 54. At `lg:mt-10` it was 94px; at
        // `lg:mt-4` it is 70px. Taking it to zero would buy 16 more and leave the
        // card touching the band the moment the tiger is ever drawn any taller,
        // which is one line in `app/page.tsx` and a recommendation already
        // standing (`docs/reviews/2026-08-16-coverflow/geometry.md` §6).
        className="coverflow mt-3 lg:mt-4"
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
            {copy.experiences.map((experience, i) => {
              // `null` at the two ends, and the component renders one arrow
              // there rather than two — see `lib/coverflow.ts`. Indexing
              // `experiences` with either of these without checking is a
              // compile error, which is the whole reason it is not a `-1`.
              const { previous, next } = coverflowNeighbours(i, count);
              return (
                <CoverflowCard
                  key={experience.title}
                  experience={experience}
                  scrim={CARD_SCRIM[experience.mediaId] ?? PLACEHOLDER_SCRIM}
                  index={i}
                  count={count}
                  chapterId={chapter.id}
                  previousTitle={
                    previous === null ? undefined : copy.experiences[previous].title
                  }
                  nextTitle={next === null ? undefined : copy.experiences[next].title}
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
