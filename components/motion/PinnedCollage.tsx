import { CollageStage } from "@/components/motion/CollageStage";
import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { StickyScene } from "@/components/motion/StickyScene";
import { ChapterIntro } from "@/components/sections/ChapterIntro";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type TwoTone } from "@/content/home";
import { DURATION } from "@/lib/motion";

type IntroCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
};

/**
 * Screens of scroll the scene occupies, its own included — so **one** of them is
 * spent with the chapter held still and the photographs rising past it.
 *
 * **It was `STICKY_SCREENS_MAX` (three) until the client ruled on 5 Aug 2026,
 * and three was too many.** A pin buys scroll and this one adds no photographs,
 * so at three screens `rooted` spent ~1.9 extra screens showing the same three
 * images: page-wide imagery fell from 2.08 photographs per screen to 1.87, and
 * the join below it went from 61.7% to 64.9% empty. Against the client's very
 * first complaint — too few images — the pin was spending scroll to *reduce*
 * image density. Given the choice of shortening it, keeping it, feeding it more
 * photographs or dropping it, they chose to shorten: hold the headline, keep the
 * drift, stop buying scroll we cannot fill.
 *
 * **Two chapters run this scene since 19 Aug 2026** — `03 · Rooted Like The
 * Mahua` and `04 · Mahua Philosophy` — and the figure is still two screens each.
 * CLAUDE.md non-negotiable #9 binds on both: the leading photograph drifts at
 * exactly `PARALLAX_MAX`, so a shorter pin would have to accept a smaller drift
 * rather than a larger rate, and there is no room left at the rate end.
 *
 * `StickyScene` clamps this to `STICKY_SCREENS_MAX` whatever is written here;
 * the constant is exported so the test can assert against the clamp rather than
 * against a number copied out of this file.
 */
export const COLLAGE_SCREENS = 2;

/**
 * How far each photograph drifts, as a fraction of the scroll the pin reserves.
 *
 * **Three different numbers is the effect**, not a detail of it: the client's own
 * reading of the reference is "each moving at slightly different speeds", and
 * three identical rates read as one sliding sheet rather than as depth. Ordered
 * to match `chapter.media` — the tall photograph, then the upper and lower halves
 * of the pair.
 *
 * The largest is the nearest and so the fastest. All three sit at or under
 * `PARALLAX_MAX`, which spec section 4.3 law 3 sets at 15%: past that a
 * photograph is moving rather than sitting at a depth, and CLAUDE.md
 * non-negotiable #4 is that if you notice the animation it is too fast.
 *
 * **These were 0.12 / 0.085 / 0.05 while the pin was three screens.** Halving
 * the pin halves the scroll these are a fraction *of*, so holding them would
 * have halved the travel with them — 104px, 74px and 43px, which is a twitch
 * rather than a drift. Raised to keep the effect the length of the pin bought.
 *
 * **Two sets of travel figures are correct, and they are not the same number.**
 * At 1440x900 the pin reserves 900px, so in *theory* the three travel 135px, 95px
 * and 54px end to end — reserved scroll times rate, which is the arithmetic this
 * file is responsible for. What `scripts/check_pinned_collage.mjs` and CLAUDE.md
 * record is **126 / 89 / 50px**, because the rig samples the pinned band between
 * the first and last offsets it can safely read and that band is 840px, not the
 * full 900. The rig's figures are the measured ones and are the ones to quote;
 * these are what the rates mean. Either way the three stay ~40px apart and still
 * read as three distances.
 *
 * The leader sits exactly on the cap, which is the ceiling and not a target —
 * there is no room left here, and a shorter pin than this one would have to
 * accept a smaller drift rather than a larger rate.
 *
 * **The 19 Aug 2026 realignment did not touch these**, deliberately. Moving all
 * three photographs to one margin changes where they are, not how fast they
 * travel, and non-negotiable #9 is not this task's to spend.
 */
export const COLLAGE_RATES = [0.15, 0.105, 0.06] as const;

/**
 * The three photographs' real widths, for `srcset` (see `ui/Photo.tsx`).
 *
 * **`solo` is still byte-identical to `ChapterIntro`'s and the other two are
 * not — that changed on 19 Aug 2026 and the change is the whole point.** The two
 * compositions used to lay their photographs out in the same three columns at
 * the same fractions, so one width list described both. Since the client's
 * realignment (spec §4-§5) the pinned scene puts all three photographs in ONE
 * margin: the tall one keeps a third of the container plus its 13vw bleed, which
 * is still ~42vw, while the pair now share a plain third of the container with
 * no bleed at all — ~29.2vw at 1440 against the 40vw and 35vw they had when they
 * were the flank of a centred composition.
 *
 * `pairTop` and `pairLower` are the same string because the two frames are the
 * same width: they share the column's edges, which is what "lined up" means and
 * what the client asked for. They are still two slots in `lib/sizes.test.ts`,
 * because their BOXES differ and so the file each one is served differs.
 *
 * Checked at the widths the pin actually runs at. The container caps at 1600px,
 * so a third of it stops growing there while `vw` does not: the tall photograph
 * is 42.3vw at 1440, 42.7vw at 1600 and 37.7vw at 1920, and the pair 29.2vw,
 * 29.7vw and 24.7vw. Both entries are honest at the bottom of the range and
 * over-stated above it, which is the direction to err in.
 */
export const SIZES = {
  /** The tall photograph: a third of the content + a 13vw bleed. */
  solo: "(min-width: 1024px) 42vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
  /** The upper of the pair: a plain third of the content, no bleed. */
  pairTop: "(min-width: 1024px) 30vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
  /** The lower of the pair: the same third, so the two line up. */
  pairLower: "(min-width: 1024px) 30vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
} as const;

/**
 * The three slots' aspect ratios — the other half of `SIZES`.
 *
 * **Re-solved on 19 Aug 2026, and solved for two things at once: the shapes of
 * the six photographs, and the height of the block.** The chapters this scene
 * draws carry
 *
 * | slot | `03 · Rooted` | `04 · Philosophy` |
 * |---|---|---|
 * | `solo` | `lantern-bridge-dusk` 1300px, 1.501 | `veranda-through-leaves` 1100px, 0.667 |
 * | `pairTop` | `forest-shrine-incense` 700px, 0.667 | `petal-bowl-map` 700px, 0.667 |
 * | `pairLower` | `potters-hands` 700px, 1.502 | `lily-pond-fountain` 1080px, 1.000 |
 *
 * so `pairTop` is a **portrait** in both chapters and was being drawn in a 3:2
 * landscape box, which threw away 55% of its height. It is 7:8 now. `pairLower`
 * is 5:3 rather than 3:2, and `solo` is unchanged at 4:5.
 *
 * The second constraint is arithmetic. At 1440x900 a third of the container is
 * 421px, so the tall photograph is 421 + 13vw = 608.5px wide and 4:5 makes it
 * **760.7px** tall; 7:8 and 5:3 on a 421px column give 481.5 and 252.8, which
 * with the `1.83vw` gap between them come to **760.7**. The pair therefore ends
 * exactly where the tall photograph does, at rest — the three are lined up top
 * and bottom, and the drift is what pulls them out of line as the visitor
 * scrolls. Change either ratio and that alignment goes; the gap is the dial that
 * puts it back.
 *
 * Resolution is better than it was on five of the six, because a portrait drawn
 * in a portrait box is drawn at its box's own width: `pairTop` is 421px from a
 * 700px file (1.66) where the 3:2 box asked for 562px (1.25), and `pairLower` is
 * 421px from 700 and 1080 (1.66 and 2.56). `solo` is the one that gives a little
 * back — 1141px from `lantern-bridge-dusk`'s 1300 (1.14), against 1108 before —
 * and it is the only one of the six with a file wide enough to spend.
 *
 * Each entry mirrors the `aspect-[...]` class on the `ImageReveal` below it, and
 * `lib/sizes.test.ts` compares the two sets rather than trusting this comment.
 */
export const BOXES = {
  /** `aspect-[4/5]`. */
  solo: 4 / 5,
  /** `aspect-[7/8]`. */
  pairTop: 7 / 8,
  /** `aspect-[5/3]`. */
  pairLower: 5 / 3,
} as const;

/**
 * The reference site's signature effect, and the client's own description of it:
 * *"the centre text stays frozen in place for a long stretch of scrolling, while
 * old family and wildlife photographs float up past it on the left and right
 * sides, each moving at slightly different speeds. It feels like a memory album
 * drifting by around a still headline."*
 *
 * ## Text on one side, photographs on the other (19 Aug 2026)
 *
 * The composition above is what shipped until 19 Aug 2026: photographs at *both*
 * margins with the chapter centred between them. The client's own restructure
 * replaced it — *"the text moves to the left and needs to be left aligned and
 * the images will be lined up on the right and will scroll as the text stays on
 * the screen"* (spec §4), and for the chapter below it, *"move and align this to
 * the right with images scrolling on the left, mirroring the 02-Rooted like the
 * mahua section, but make sure it is in continuity as it is an extension of an
 * already existing section"* (spec §5).
 *
 * So the grid is three equal columns: the chapter takes one of them, and the
 * three photographs take the other two — the pair sharing the inner column's
 * edges, the tall one on the outside reaching past the edge of the screen.
 * `mirrored` swaps which end the chapter sits at, and `app/page.tsx` counts the
 * scenes and alternates it, so `04` is the mirror of `03` without either section
 * knowing the other exists.
 *
 * **Moving the photographs to one side is a density decision as much as a
 * compositional one, and it had to be measured rather than assumed.** A chapter
 * with a photograph at each margin fills both edges of the screen at every
 * height; one with all three on a single side does not, and the naive version of
 * this layout measured **~44.6% imagery against the 50.1% it replaced** — which
 * would have taken `rooted` from 45.0% worst (already on non-negotiable #8's
 * line) to over 50%. Three things bought it back and are all load bearing:
 * the block is as tall as the pin allows rather than centred at its natural
 * size, the pair shares the tall photograph's height so the inner column has no
 * cream above or below it, and the chapter's column is a third rather than the
 * 1.3fr the centred composition gave it. Measured after: 53.5% imagery,
 * `rooted` **35.1% mean / 40.1% worst**.
 *
 * ## Two compositions, one chapter
 *
 * This renders both and hands them to `CollageStage`, which decides. Unpinned —
 * on the server, with no JavaScript, under reduced motion, on a browser with no
 * `IntersectionObserver`, and at every viewport narrower or shorter than
 * `PIN_QUERY` — the chapter is the ordinary `ChapterIntro` it has always been,
 * reserving no extra scroll. **That branch was deliberately left centred on
 * 19 Aug 2026**: `components/sections/ChapterIntro.tsx` is outside the
 * realignment's scope, the client's lens is the laptop (CLAUDE.md, 12 Aug), and
 * the pin only runs at 1440x860 and above — so the realignment is what a visitor
 * sees wherever the effect it belongs to runs, and the composition the page
 * shipped yesterday is what they see everywhere else. If the two are ever to
 * agree, that is an edit to `ChapterIntro` and a re-measurement of both.
 *
 * ## Why the drift is on its own wrapper
 *
 * `[data-drift]` is a measurement hook first and a selector second, exactly as
 * `[data-parallax]` is: it is what lets `scripts/check_pinned_collage.mjs` find
 * these three elements in a real browser and check that they moved, by different
 * amounts, while the headline beside them did not. Recognising a drifting
 * photograph from outside by the inline transform GSAP writes would be a check
 * that a mechanism was configured — the shape this project has been burned by
 * nine times.
 *
 * It is also a separate element from the `ImageReveal` inside it. The drift is a
 * `transform`; the entrance is a `scale` on a different element. Tailwind v4
 * compiles `scale-*` to the `scale` property, which *composes* with `transform`
 * rather than replacing it, and a mask that silently never wiped is precisely
 * how this page shipped broken for the length of one build on 5 Aug 2026.
 *
 * **The `footer` slot came out on 19 Aug 2026 with the potter's film**, which
 * was the only thing that ever used it (spec §4: *"the animated potter needs to
 * be removed"*). It is not left in place for a future caller because the pull-up
 * it depended on — `50vh - C/2 - 56px`, where C is the *centred* column's
 * rendered ink — was solved against a composition this file no longer draws, and
 * a formula that is quietly wrong is worse than no slot at all. `SignatureFilm`,
 * the film, its poster and `scripts/check_films.mjs` are all untouched;
 * `ChapterIntro` still has its own `footer`. Restoring it here means re-solving
 * the pull-up against whichever composition is on the page at the time.
 */
export function PinnedCollage({
  chapter,
  mirrored = false,
  surface = false,
  continues = false,
}: {
  chapter: Chapter;
  /** Which margin takes the photographs. Passed through when unpinned. */
  mirrored?: boolean;
  surface?: boolean;
  /**
   * This chapter is the second half of the one above it, and the seam between
   * them closes.
   *
   * `04 · Mahua Philosophy` is *"an extension of an already existing section"*,
   * and two chapters read as one idea continuing when they stand on one ground
   * and meet without a band of cream between them. The surface is
   * `app/page.tsx`'s to hand down — it is what alternates the two creams, so it
   * gives this chapter the one above it rather than the next one in the cycle —
   * and the seam is this prop: the chapter drops its own top padding and pulls
   * up by the rhythm the chapter above it ends with.
   *
   * **The pull-up and `ChapterSurface`'s own `py-*` are one decision written in
   * two places.** They cancel, so changing the rhythm there without changing it
   * here leaves a gap or an overlap. They are written together, at one site, for
   * that reason.
   *
   * **It applies to the pinned branch only**, because `ChapterIntro` takes no
   * class list and is out of this task's scope. Below the pin viewport the two
   * are ordinary chapters with the page's ordinary join between them, which is
   * the right join for two ordinary chapters; the continuity claim is made where
   * the pinned pair exists.
   */
  continues?: boolean;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as IntroCopy;
  const [solo, pairTop, pairLower] = chapter.media;

  const textColumn = mirrored ? "col-start-3" : "col-start-1";
  const pairColumn = "col-start-2";
  const soloColumn = mirrored ? "col-start-1" : "col-start-3";
  const soloBleed = mirrored
    ? "-ml-[13vw] w-[calc(100%+13vw)]"
    : "-mr-[13vw] w-[calc(100%+13vw)]";
  const toEdge = mirrored ? "items-end text-right" : "items-start text-left";

  /**
   * One paragraph gets set larger than three.
   *
   * `04 · Mahua Philosophy` carries a single moved paragraph — 55 words against
   * `rooted`'s 139 — in a column built for three, and the client has ruled that
   * it stays that way for now: *"We will later add more text to the philosophy,
   * for now keep this."* That is a decision about the words, not about the type.
   * A 55-word paragraph set at the size three paragraphs need is five short
   * lines adrift in a 900px screen; at 1.22rem it is seven, and it reads as a
   * chapter rather than as a caption. Nothing is added and nothing is cut.
   *
   * It is keyed off the copy rather than off `chapter.id` for the same reason
   * every other slot in this file is: the moment the client's extra paragraphs
   * land, this chapter stops being the thin one and stops being set as one,
   * without anybody having to remember to come back here.
   */
  const single = copy.body.length === 1;

  return (
    <CollageStage
      flowing={<ChapterIntro chapter={chapter} mirrored={mirrored} surface={surface} />}
    >
      <ChapterSurface
        id={chapter.id}
        surface={surface}
        // See `continues` above: the top padding goes and the pull-up cancels
        // the rhythm the chapter above ends with. Both halves are written here
        // so neither can drift from the other.
        className={
          continues ? "pt-0 md:pt-0 lg:pt-0 -mt-14 md:-mt-16 lg:-mt-20" : undefined
        }
      >
        <StickyScene screens={COLLAGE_SCREENS}>
          {/*
           * `h-full` against the scene's own 100vh, and `items-center` so the
           * chapter and the block of photographs are each centred in the screen.
           *
           * Three equal columns rather than the `1.15fr 1.3fr 1.15fr` of the
           * centred composition: the chapter takes one third and the
           * photographs take two, which is what carries the imagery share (see
           * the note on this component).
           */}
          <div className="grid h-full grid-cols-3 items-center gap-x-10">
            {/*
             * The tall one, on the outside, reaching 13vw past the edge of the
             * screen. It is first in `chapter.media` and it drifts fastest, so
             * it is the nearest of the three.
             *
             * **First in the DOM too, and that is an invariant rather than a
             * layout accident.** `chapter.media` and `COLLAGE_RATES` are both
             * read positionally, so the order the three `[data-drift]` elements
             * appear in is the order both the unit test
             * (`components/motion/primitives.test.tsx`) and
             * `scripts/check_pinned_collage.mjs` read them back in. Where each
             * one *sits* is `col-start-*`'s business, which is what lets the
             * whole composition mirror without the reading order changing.
             */}
            <div className={`${soloColumn} ${soloBleed} row-start-1`}>
              <div data-drift={COLLAGE_RATES[0]}>
                <ImageReveal className="block aspect-[4/5] max-h-[88vh] w-full">
                  <Photo
                    id={solo}
                    sizes={SIZES.solo}
                    box={BOXES.solo}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </div>
            </div>

            {/*
             * The frozen chapter. Nothing here is handed to the scrub.
             *
             * Flush against the container's outer edge and aligned to it —
             * `items-start text-left`, or `items-end text-right` mirrored. The
             * `ChapterMark` has no `right` alignment of its own, so it is put in
             * a flex row that shrinks it to its content and pushes it to the
             * end; the heading's own alignment comes from the unlayered rule
             * `app/globals.css` keys off `data-collage-align`, because
             * `TwoToneHeading` writes `text-left` into its own class list and a
             * second Tailwind alignment utility beside it is a cascade race.
             */}
            <div
              className={`${textColumn} row-start-1 flex flex-col ${toEdge}`}
              data-collage-align={mirrored ? "right" : "left"}
            >
              <Enter>
                <div className={`flex w-full flex-col ${toEdge}`}>
                  {chapter.number && chapter.label && (
                    <div className={`flex w-full ${mirrored ? "justify-end" : "justify-start"}`}>
                      <ChapterMark number={chapter.number} label={chapter.label} />
                    </div>
                  )}
                  {/*
                   * No `max-w-*`: the column is the measure now. The centred
                   * composition capped the headline at 18ch because it sat in a
                   * 1.3fr column wider than a headline wants; a third of the
                   * container is 421px at 1440 and 475px from 1600 up, which is
                   * the cap this used to impose, so imposing it again would only
                   * make the heading disagree with the copy beneath it.
                   */}
                  <TwoToneHeading heading={copy.heading} className="mt-6" />
                  <span
                    aria-hidden="true"
                    className="mt-8 block h-px w-16"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                </div>
              </Enter>

              {/*
               * One body size rather than `ChapterIntro`'s two, and a little
               * tighter. The chapter has to be held still inside a single screen
               * here instead of being allowed to run as long as it likes, and
               * dropping the opening paragraph from 1.15rem to the size of the
               * other two is the whole of what buys the room. Nothing is cut.
               */}
              <div className={`mt-8 w-full ${single ? "space-y-5" : "space-y-4"}`}>
                {copy.body.map((paragraph, i) => (
                  <Enter key={i} delay={DURATION.stagger * i}>
                    <p
                      className={`font-[family-name:var(--font-body)] ${
                        single ? "text-[1.22rem] leading-[1.7]" : "text-[1.02rem] leading-[1.65]"
                      }`}
                      style={{ color: i === 0 ? "var(--text)" : "var(--dim)" }}
                    >
                      {paragraph}
                    </p>
                  </Enter>
                ))}
              </div>
            </div>

            {/*
             * The pair, sharing the inner column's two edges — "lined up", which
             * is the client's own word for what these three do now.
             *
             * The `max-h-*` on each frame is a guard, not a layout. At 1440x900
             * the three frames are 84.5vh, 53.5vh and 28.1vh and none of these
             * bind, so the declared `BOXES` are the real boxes. What they catch
             * is the shape of window nobody designs for and someone eventually
             * drags: the widths grow with `vw` while the screen does not, so at
             * 2560x900 the tall frame would be taller than the scene it is
             * pinned in and would paint over the chapter below. **The three are
             * within half a point of each other as a share of the aspect-driven
             * height**, so when they do bind they shorten together and the block
             * stays lined up. Clamping shortens a box without narrowing it, so
             * the crop gets *shallower* than `BOXES` declares and the browser is
             * asked for slightly more resolution than it needs — the safe
             * direction, and the only one worth erring in here.
             */}
            <div className={`flex flex-col gap-[1.83vw] ${pairColumn} row-start-1`}>
              <div data-drift={COLLAGE_RATES[1]}>
                <ImageReveal className="block aspect-[7/8] max-h-[56vh] w-full">
                  <Photo
                    id={pairTop}
                    sizes={SIZES.pairTop}
                    box={BOXES.pairTop}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </div>
              <div data-drift={COLLAGE_RATES[2]}>
                <ImageReveal className="block aspect-[5/3] max-h-[29vh] w-full">
                  <Photo
                    id={pairLower}
                    sizes={SIZES.pairLower}
                    box={BOXES.pairLower}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
              </div>
            </div>
          </div>
        </StickyScene>
      </ChapterSurface>
    </CollageStage>
  );
}
