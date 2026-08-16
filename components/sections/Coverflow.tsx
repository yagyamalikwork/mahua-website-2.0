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
 * The header band's three photographs, at their real drawn widths.
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
 * Rounded up at every step, per `ui/Photo.tsx`: over-stating costs a tier,
 * under-stating ships a soft photograph. Both are narrower than what
 * `SplitFeature` drew these same three frames at (63vw, i.e. 907px at 1440), so
 * this composition asks *less* of the same files than the one it replaces.
 */
export const SIZES = {
  /** `guide-sunrise` — the band's large frame, `col-span-7` from `lg`. */
  wide:
    "(min-width: 1696px) 854px, (min-width: 1024px) 54vw, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
  /** `hammocks-shade` and `pool-daylight-forest` — half that column each. */
  pair:
    "(min-width: 1696px) 419px, (min-width: 1024px) 27vw, (min-width: 768px) calc((100vw - 112px) / 2), (min-width: 640px) calc((100vw - 64px) / 2), calc(100vw - 48px)",
} as const;

/**
 * The same three slots' `object-cover` boxes.
 *
 * All three are 16:9, which is a shared frame rather than three native shapes —
 * the device `03 · The Forest`'s plate grid uses, and for the same reason: the
 * pair sit side by side and a row whose two frames disagree about their height
 * reads as a mistake. `hammocks-shade` is natively 16:9 and loses nothing;
 * `pool-daylight-forest` is a 2.281:1 letterbox and loses **22.1%** of its width
 * (`2.281 / 1.778 = 1.283`), inside the 25% bound this project holds every
 * cropped photograph to; `guide-sunrise` is 1.502:1, *narrower* than the box, so
 * `cover` crops its height instead — unbounded by the same convention
 * `CoverflowCard`'s `CARD_BOX` records.
 *
 * These are not registered in `lib/sizes.test.ts` yet — see the note at the foot
 * of this file.
 */
export const BOXES = {
  wide: 16 / 9,
  pair: 16 / 9,
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
  "tiger-crossing-track": { flat: 0.5 },
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
  // The first three photographs are the header band's; the last six are the
  // cards', one per activity, and each card names its own by `mediaId` rather
  // than by position — `content/chapters.test.ts` holds every one of those names
  // to an id this chapter declares.
  const [dawn, hammocks, pool] = chapter.media;
  const count = copy.experiences.length;

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      {/* Row 1 — the chapter's own opening, against the dawn gate. `items-end`
          rather than `items-center`: the text column is the shorter of the two
          and hanging it from the photograph's own baseline puts the band's slack
          in one place above it instead of splitting it top and bottom. */}
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
        </div>

        <div className="lg:col-span-7">
          <ImageReveal className="block aspect-[16/9] w-full">
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

        <ul className="coverflow-stage">
          {copy.experiences.map((experience, i) => {
            const { previous, next } = coverflowNeighbours(i, count);
            return (
              <CoverflowCard
                key={experience.title}
                experience={experience}
                scrim={CARD_SCRIM[experience.mediaId] ?? PLACEHOLDER_SCRIM}
                index={i}
                count={count}
                chapterId={chapter.id}
                previousTitle={copy.experiences[previous].title}
                nextTitle={copy.experiences[next].title}
              />
            );
          })}
        </ul>

        {footer && <div className="coverflow-footer">{footer}</div>}
      </div>
    </ChapterSurface>
  );
}

/*
 * **Owed: `SIZES` and `BOXES` above are not registered in `lib/sizes.test.ts`.**
 *
 * That file's table is what puts every `sizes` string on the page through
 * `capDensity`'s round trip and through all fifty-three photographs, and its
 * companion test — "imports from every component that passes a sizes prop" —
 * exists precisely so a new component cannot be forgotten. It does not fire here,
 * and the reason is an accident worth writing down: it asserts that the test
 * file's own source `toContain("@/components/sections/Coverflow")`, and that
 * string is a **substring** of `@/components/sections/CoverflowCard`, which Task
 * 5 already added. So the tripwire reads green for a file it has never seen.
 *
 * Task 6 may not edit `lib/sizes.test.ts`. Task 7 or 8 must add two rows
 * (`Coverflow.wide`, `Coverflow.pair`), bump the distinct-string count by
 * running the suite and reading the failure rather than computing it, and add
 * this file to the `CASES` list so its `aspect-[16/9]` classes are held to
 * `BOXES`. It is worth fixing the substring hole at the same time — an
 * `endsWith`-aware check, or matching `from "…"` exactly.
 */
