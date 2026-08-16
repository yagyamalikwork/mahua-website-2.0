import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { CoverflowCard } from "@/components/sections/CoverflowCard";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import type { ScrimStrength } from "@/components/ui/Scrim";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type ExperienceCopy, type TwoTone } from "@/content/home";
import { coverflowNeighbours, coverflowTargetId } from "@/lib/coverflow";
import type { MediaId } from "@/lib/media";
import { DURATION } from "@/lib/motion";

type CoverflowCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
  readonly experiences: readonly ExperienceCopy[];
};

/**
 * The header band's four photographs, at their real drawn widths.
 *
 * The band is a 12-column grid inside `ChapterSurface`'s `max-w-[1600px]` /
 * `px-6` / `md:px-12` container with a `gap-x-14` (56px) gutter, so a
 * `col-span-7` is `7 × track + 6 × 56` where `track = (content − 11 × 56) / 12`.
 * Worked at the two widths that matter: at 1440 the content box is 1344 and the
 * column is **760.7px** (52.8vw, rounded up to 54vw); at 1696 and above the
 * container saturates at 1600, the content box is 1504 and the column is a flat
 * **854px**. Below `lg` the grid collapses to one column and each photograph is
 * the container's own width.
 *
 * `pair` is half of that column less its own 16px gutter — 372px at 1440, 419px
 * from 1696 — and it stacks to full width below `sm`, where two frames side by
 * side would be 163px each on a phone.
 *
 * `track` is a **flat cap, not a column fraction**, and the cap is the file:
 * `tiger-crossing-track` is 541px wide, the smallest photograph in the chapter,
 * and 420px is the largest round size its own file serves at DPR 1 with room to
 * spare. It sits in the `col-span-5` text column, which is 527px at 1440 and
 * 594px at 1920 — both wider than the frame, so the cap binds at every viewport
 * above 468px and the frame simply stops growing. That is deliberate: this is
 * the one photograph on the page whose size is set by its resolution rather than
 * by its column.
 *
 * Rounded up at every step, per `ui/Photo.tsx`: over-stating costs a tier,
 * under-stating ships a soft photograph. `wide` and `pair` are both narrower
 * than what `SplitFeature` drew these frames at (63vw, i.e. 907px at 1440), so
 * this composition asks *less* of the same files than the one it replaced.
 */
export const SIZES = {
  /** `guide-sunrise` — the band's large frame, `col-span-7` from `lg`. */
  wide:
    "(min-width: 1696px) 854px, (min-width: 1024px) 54vw, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
  /** `hammocks-shade` and `pool-daylight-forest` — half that column each. */
  pair:
    "(min-width: 1696px) 419px, (min-width: 1024px) 27vw, (min-width: 768px) calc((100vw - 112px) / 2), (min-width: 640px) calc((100vw - 64px) / 2), calc(100vw - 48px)",
  /**
   * `tiger-crossing-track` — the dawn drive's second frame, under the paragraph
   * about the gates opening. Capped at 420px; `100vw − 48px ≥ 420` from 468px up.
   */
  track: "(min-width: 468px) 420px, calc(100vw - 48px)",
} as const;

/**
 * The same slots' `object-cover` boxes.
 *
 * `pair` is 16:9, a shared frame rather than two native shapes — the device
 * `03 · The Forest`'s plate grid uses, and for the same reason: the two sit side
 * by side and a row whose frames disagree about their height reads as a mistake.
 * `hammocks-shade` is natively 16:9 and loses nothing; `pool-daylight-forest` is
 * a 2.281:1 letterbox and loses **22.1%** of its width (`2.281 / 1.778 = 1.283`),
 * inside the 25% bound this project holds every cropped photograph to.
 *
 * **`wide` is 3:2 rather than 16:9 since 16 Aug 2026, and both halves of that
 * were measured.** `guide-sunrise` is natively 1.502:1, so a 3:2 box is its own
 * shape and crops it by nothing at all — 16:9 was taking 15.5% of its height for
 * no reason. And the taller box is 507px at 1440 against 428px, which is 79px of
 * additional imagery across a 760px column: the header band is the only part of
 * this chapter whose density is not bounded by the stage, and it is where the
 * cheap points are. It may not go taller than this: at 1920 the column is 854px,
 * a `cover` box narrower than 3:2 draws `guide-sunrise` wider than the box, and
 * a 5:4 box would ask 1,026px of a 1,000px file.
 *
 * **`track` is 1:1, and that is the photograph's shape rather than the grid's.**
 * `tiger-crossing-track` is 1.065:1 — very nearly square — with the tiger low
 * and left and the vehicle centre-right. A 16:9 box (the card it came out of)
 * takes 40% of its height, which cuts the tiger's legs and the vehicle's canopy;
 * a 1:1 box takes 6.1% of its width and cuts nothing. Looked at, not derived —
 * `public/media/tiger-crossing-track-541.jpg`.
 *
 * These are not registered in `lib/sizes.test.ts` yet — see the note at the foot
 * of this file.
 */
export const BOXES = {
  wide: 3 / 2,
  pair: 16 / 9,
  track: 1,
} as const;

/**
 * The wash between each card's photograph and the cream type laid on it.
 *
 * **Every figure here is a placeholder and is deliberately heavy.** The plan's
 * Task 8 solves all six against the rendered page — raising each until the worst
 * single pixel under that card's type clears its floor and no further — and adds
 * a run per card to `scripts/check_contrast_over_photos.mjs`, whose `RUNS` table
 * is hand-written and discovers nothing, so a card absent from it is a card
 * nobody has checked. `{ flat: 0.5 }` fails towards legible-but-muddy, which a
 * reviewer sees, rather than towards illegible, which they may not.
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
 * fallback is the same heavy placeholder, so a card whose photograph is swapped
 * without a figure being solved for it still fails towards muddy.
 */
const CARD_SCRIM: Partial<Record<MediaId, ScrimStrength>> = {
  // `vann-safari`, not `tiger-crossing-track`, since 16 Aug 2026 — see
  // `content/home.ts`'s `ExperienceCopy.mediaId`. The 541px file was capping
  // every card on the stage.
  "vann-safari": { flat: 0.5 },
  "vann-bird-watching": { flat: 0.5 },
  "vann-kohka-lake": { flat: 0.5 },
  "forest-boardwalk-daylight": { flat: 0.5 },
  "vann-potters-village": { flat: 0.5 },
  "forest-trail-canopy": { flat: 0.5 },
};

/** See `CARD_SCRIM`. Task 8 replaces every one of these. */
const PLACEHOLDER_SCRIM: ScrimStrength = { flat: 0.5 };

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
 * 1. **A header band**, carrying the chapter mark, the heading, both paragraphs
 *    and three photographs. It is not decoration: the chapter's two *written*
 *    beats — the dawn gate, and "then the day slows right down" — are the
 *    client's own copy, and a carousel of six activities does not carry them.
 *    `SplitFeature`, which this replaces, spent three full bands on that copy;
 *    this spends two rows, because everything below is now the chapter.
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
 * ## The tiger, and why it hangs off the wrapper
 *
 * `field-days` closes with the tiger film, whose white ground is erased by
 * `mix-blend-mode: darken` against the chapter's cream — asserted **as pixels**
 * by `scripts/check_films.mjs`, and `docs/DECISIONS.md` §14 records that a
 * stacking context between the film and that cream is what breaks it.
 * `position: sticky` creates a stacking context, so a film inside
 * `.coverflow-stage` would blend against the stage's own transparent backdrop
 * and the white box would come back.
 *
 * It therefore sits in `.coverflow-footer`, a sibling of the stage, absolutely
 * positioned at the wrapper's foot — under no sticky ancestor, and costing no
 * height. That last part is measured rather than tidy: in flow this film took
 * `field-days` from 41.5% to 44.4% mean empty when it first landed, which is why
 * `SplitFeature` anchored it too. **`.coverflow` must never be given a
 * `z-index`** — that would make the wrapper a stacking context and reintroduce
 * the same bug one level up.
 */
export function Coverflow({
  chapter,
  surface = false,
  footer,
}: {
  chapter: Chapter;
  surface?: boolean;
  /**
   * Rendered at the foot of the section. `field-days` passes the ink tiger;
   * nothing else uses it.
   *
   * The same slot shape `SplitFeature` had, on purpose — mounting the coverflow
   * is one component name in `app/page.tsx` and nothing else. A slot rather than
   * a `chapter.id` check in here: every chapter section is self-contained, and
   * *which* chapter carries the tiger belongs to the page's spine, beside the
   * density figures that chose it.
   */
  footer?: React.ReactNode;
}) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as CoverflowCopy;
  // The first four photographs are the header band's, in the order the band
  // draws them; the last six are the cards', one per activity, and each card
  // names its own by `mediaId` rather than by position —
  // `content/chapters.test.ts` holds every one of those names to an id this
  // chapter declares.
  const [dawn, track, hammocks, pool] = chapter.media;
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
   * **`slot` is the animation's index and `source` is the activity's**, and they
   * are only equal for the six real cards. `--i: -1` centres at
   * `pin-start + 0 × step` — the exact offset at which the stage locks — and
   * `--i: 6` at `pin-start + 7 × step`, the offset at which it lets go, because
   * `step` is `pin-len / (count + 1)` and the eight centred moments tile the pin
   * exactly. Verified in the browser rather than trusted: `check_coverflow.mjs`
   * bisects all eight to their own centred moments and requires every one inside
   * 8px of the stage's centre, and requires the last card's arrows still to be
   * live when the pin ends.
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
      {/* Row 1 — the chapter's own opening, against the dawn gate, which is now
          TWO photographs: the naturalist at first light on the right, and the
          tiger crossing the track under the paragraph that says the gates open
          before the light does.

          `items-end` rather than `items-center`: the two columns are different
          heights (the text column is the taller one since the track frame joined
          it) and hanging both from one baseline puts the band's slack in a single
          place — the top right, beside the chapter mark — rather than splitting
          it above and below. */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-x-14">
        <div className="lg:col-span-5">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[14ch]" />
              <p
                className="mt-7 max-w-[52ch] font-[family-name:var(--font-body)] text-[1.08rem] leading-[1.72] md:text-lg"
                style={{ color: "var(--text)" }}
              >
                {copy.body[0]}
              </p>
            </div>
          </Enter>

          {/* Capped at 420px rather than filling its column — the file is 541px
              wide, and that cap is the whole reason this photograph is in the
              band rather than on a card. See `SIZES.track` and `BOXES.track`. */}
          <ImageReveal
            className="mt-8 block aspect-square w-full max-w-[420px]"
            delay={DURATION.columnStagger}
          >
            <Photo
              id={track}
              sizes={SIZES.track}
              box={BOXES.track}
              pictureClassName="block h-full w-full"
              className="h-full w-full object-cover"
            />
          </ImageReveal>
        </div>

        <div className="lg:col-span-7">
          <ImageReveal className="block aspect-[3/2] w-full">
            <Photo
              id={dawn}
              sizes={SIZES.wide}
              box={BOXES.wide}
              pictureClassName="block h-full w-full"
              className="h-full w-full object-cover"
            />
          </ImageReveal>
        </div>
      </div>

      {/* Row 2 — the half most lodges leave out, and the only two frames in the
          library that say *rest*. Imagery on the left this time: the band is two
          rows and the sides alternate inside it, which is the same reason
          `SplitFeature`'s three bands did. */}
      <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-12 lg:items-center lg:gap-x-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:order-1 lg:col-span-7">
          <ImageReveal className="block aspect-[16/9] w-full">
            <Photo
              id={hammocks}
              sizes={SIZES.pair}
              box={BOXES.pair}
              pictureClassName="block h-full w-full"
              className="h-full w-full object-cover"
            />
          </ImageReveal>
          <ImageReveal className="block aspect-[16/9] w-full" delay={DURATION.columnStagger}>
            <Photo
              id={pool}
              sizes={SIZES.pair}
              box={BOXES.pair}
              pictureClassName="block h-full w-full"
              className="h-full w-full object-cover"
            />
          </ImageReveal>
        </div>

        <div className="lg:order-2 lg:col-span-5">
          <Enter>
            <div>
              <span
                aria-hidden="true"
                className="block h-px w-16"
                style={{ backgroundColor: "var(--accent)" }}
              />
              <p className="mt-6 max-w-[22ch] font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2.5rem)] font-light leading-[1.18] text-[color:var(--text)]">
                {copy.body[1]}
              </p>
            </div>
          </Enter>
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
        className="coverflow mt-12 lg:mt-16"
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
            stage's containing block, which is the whole reason it exists: sticky
            stops when the stage's bottom meets THIS element's bottom, so a band
            below it is a band the stage can never reach. The tiger lives in that
            band — see the note on `.coverflow-footer` below. */}
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

        {/* In flow, below the track, and pulled back up by `app/globals.css` into
            the cream the centred card leaves beneath itself — so it still costs
            almost none of its own height, and no card can reach it. It was
            `position: absolute; bottom: 0` inside the wrapper until 16 Aug 2026,
            which cost nothing at all and put the card over the tiger's head at
            every viewport below ~1430px. See `.coverflow-footer`. */}
        {footer && <div className="coverflow-footer">{footer}</div>}
      </div>
    </ChapterSurface>
  );
}

/*
 * **`SIZES` and `BOXES` are registered in `lib/sizes.test.ts` — closed 16 Aug
 * 2026, along with the hole that hid them.**
 *
 * That file's table is what puts every `sizes` string on the page through
 * `capDensity`'s round trip and through all fifty-three photographs, and its
 * companion test — "imports from every component that passes a sizes prop" —
 * exists precisely so a new component cannot be forgotten. It did not fire here,
 * and the reason is worth keeping: it asserted that the test file's own source
 * `toContain("@/components/sections/Coverflow")`, and that string is a
 * **substring** of `@/components/sections/CoverflowCard`, which was already
 * imported. So the tripwire read green for a file it had never seen, and three
 * `sizes` strings went unchecked.
 *
 * It now matches the specifier *with its closing quote*, which is what makes a
 * prefix stop being a match; all three strings turned out to be genuinely new
 * (26 → 29), and this file is in the `CASES` list, so its `aspect-*` classes and
 * `BOXES` are held to each other in both directions.
 */
