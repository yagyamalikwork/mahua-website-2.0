import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { SplitLines } from "@/components/motion/SplitLines";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { Photo } from "@/components/ui/Photo";
import { Scrim, type ScrimStrength } from "@/components/ui/Scrim";
import type { ChapterLike } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey } from "@/content/home";
import { JUNGLE_BAND } from "@/lib/motion";

export type JunglesCopy = {
  /** The line already there — the client's own ruling, kept verbatim. */
  readonly quote: string;
  /** `03 · The Forest`'s surviving paragraph, moved here when that chapter went. */
  readonly intro: string;
};

/** Edge to edge. The band is the viewport's width at every viewport. */
export const BAND_SIZES = "100vw";

/**
 * The lower bound on the band's own aspect ratio, which is what `sizes` needs.
 *
 * **Not the photograph's shape and not a fixed box** — the band is a floor
 * (`JUNGLE_BAND.minHeightVw`) plus whatever its own words come to, so its box
 * gets TALLER than the floor at narrow widths and its aspect is a range rather
 * than a number. `cover` draws `boxWidth x max(1, imageAspect / boxAspect)`, so
 * the safe thing to hand `lib/sizes.ts` is the smallest aspect the box ever
 * takes; under-stating it over-states the drawn width, which is the direction
 * `ui/Photo.tsx` says to err in. The working, the measured aspects at five
 * widths and the margin left over are all on `JUNGLE_BAND.coverAspectFloor`.
 */
export const BAND_BOX = JUNGLE_BAND.coverAspectFloor;

/**
 * The wash between the three cats and the cream type laid on them.
 *
 * **Solved against the rendered page, never chosen** — the rule `ui/Scrim.tsx`
 * records — and solved from scratch rather than carried from anywhere, because
 * this photograph has never had type on it in this composition. The figures and
 * the unwashed readings they answer are in
 * `docs/reviews/2026-08-19-home-v2/panels-and-band.md`; re-derive with
 * `node scripts/check_contrast_over_photos.mjs`, whose `RUNS` table carries one
 * run per block of type here. That table is hand-written and discovers nothing —
 * a block absent from it is a block nobody has checked.
 *
 * **One flat layer and nothing else, which is the answer this composition forces
 * rather than the answer anyone wanted.** The solver was given `flat`, `bottom`
 * and `top` and searched all three for the triple with the lowest mean alpha
 * over the band; every shaped combination came back *worse*. The reason is
 * geometric and it is worth stating, because it will be true of anything else
 * laid across a band this shallow: the words are ~190px of a 446px band at 1440,
 * so their top edge sits at **57% of the band's height**, and `Scrim`'s `bottom`
 * gradient is only at 21% of its own strength that high. Carrying a 1.08:1 pixel
 * to 4.8:1 there needs ~0.74 of total alpha, so even at `bottom: 1` the flat can
 * only come down to 0.67 — and buying those four points costs a bottom edge
 * washed to solid `--overlay`, which reads as a bar. A `top` layer is worse
 * still: it and `bottom` leave a weak waist between 28% and 42% of the height,
 * which is exactly where this type is.
 *
 * **0.74 is solved to a target of 5.0/3.5 against a 4.5/3.0 floor, and the extra
 * half-point is bought deliberately.** The arithmetic model above and the rig
 * disagree by about 0.2 in this frame — solved to 4.8, the rig read **4.59** on
 * the mark at 390 and **4.62** on the body at 1024 — so a scrim solved to the
 * floor would ship with a tenth of a point in hand. That is the state
 * `DECISIONS.md` §20.5 records the coverflow's six cards in, one page change
 * away from failing, and the standing instruction from it is to re-solve with
 * headroom rather than to the floor. Here the exposure is not page height but
 * WIDTH: the band's crop is a pure function of it, so the worst pixel moves
 * continuously between whatever widths a rig happens to sample. The margin is
 * what covers the widths nobody looks at. It costs three points of wash: 0.69 at
 * the floor, 0.71 at 4.8, 0.74 here.
 *
 * **What it costs the photograph is less than the number suggests, and that was
 * checked rather than assumed.** `jungle-cats-stitch` has a mean channel of
 * 71/67/52 — it is already a dark forest — and only **0.07% of its pixels**
 * (601 of 879,840) are the blown highlights driving this figure. The binding
 * pixel is in the body copy at 1024, [250,251,235]. Screenshots of the band at
 * 0, 0.4, 0.55, 0.65, 0.71 and 0.74 were opened and read side by side before
 * this number was committed: the tiger, the leopard and the trees are all still
 * plainly there, one stop down. The 19 Aug objection to a flat — that at
 * 0.5 it took the frame olive-grey — was made when the alternative was leaving
 * the photograph unwashed with the words in the cream, which is the arrangement
 * the client has since ruled out.
 *
 * For scale: the closing chapter, the section the client named as the model for
 * this one, composites to **~0.78** under its centred text.
 *
 * ## Re-solved on 20 Aug 2026 when the type moved, and it came back 0.74
 *
 * The client's centring lifted this block ~85px up the band at 1440, onto a
 * different part of the photograph — and `DECISIONS.md` §20.5's rule is that new
 * glyph positions are a new solve whatever the wash was before. So it was
 * re-solved from scratch against the moved type, every pixel of every line box
 * at six widths. **Unwashed, the three runs now read 4.43 / 1.00 / 1.00 at 360
 * and 3.51 / 1.00 / 1.00 at 390** — genuinely different pixels from the ones the
 * 19 Aug solve answered, and no better.
 *
 * `flat: 0.74` is what the solver returns again, and the reason is structural
 * rather than luck: **a pure flat is the one wash whose strength does not depend
 * on where the type sits**, so moving a block inside it can only change the
 * result through the photograph underneath. Here the photograph's brightest
 * pixels are spread through the canopy rather than gathered at one end, and the
 * new position is no worse than the old one. Measured on the shipped build:
 * mark **5.03-8.68**, heading **4.96-5.88**, body **5.05-6.29**, against floors
 * of 4.5 / 3.0 / 4.5 — still on the 5.0/3.5 target this figure was bought for.
 *
 * **This is the argument for a flat that the geometry section above could not
 * make.** A shaped layer would have had to be re-solved to a new number here;
 * this one had to be re-CHECKED and was not moved. If the type ever moves again,
 * re-check it again — the immunity is to the layer's shape, not to the frame.
 */
const BAND_SCRIM: ScrimStrength = { flat: 0.74 };

/**
 * `02 · The Jungles` — one cropped band of forest with every word of the chapter
 * laid on it.
 *
 * ## Two client rulings, ten days apart, and the second reverses the first
 *
 * 19 Aug 2026, on the 100svh full-bleed quote that stood here: *"it covers the
 * whole screen currently and feels too overwhelming… cropped from the length,
 * keeping the width, giving the section more room to breathe with the newly
 * created headroom and legroom, making it look sleeker."* Spec §3. That build
 * cropped the band to the photograph's own 2.357:1 and moved the heading and the
 * paragraph OFF it, into the cream above and below.
 *
 * 20 Aug 2026, having seen it: *"I wanted you to place and align all the text
 * for 02-The Jungles on the image as it was on the earlier tiger image with the
 * 3D raised effect and not like you have done it now. If we look at it, the
 * image itself should look like the background for this section, exactly like we
 * have done for the last section where we have our buttons for the two
 * properties and reviews."*
 *
 * ## Why the first arrangement failed, and why this one cannot fail the same way
 *
 * The words came off the band because **the band was a fixed-height box that
 * clipped its own text**. At 390 it was 390 x 166px with `overflow: hidden`: the
 * heading was cut off at the top and the paragraph's last line ran off the
 * bottom of the photograph onto the cream, *as cream type on cream*. That is a
 * property of the container, not of the idea.
 *
 * So this is built the way `components/sections/Invitation.tsx` is built, which
 * is the section the client is pointing at. The photograph is the section's
 * **background** — absolutely positioned, `-z-10`, with a `Scrim` over it — and
 * the section's own height is `max(floor, its content)`. **A section built that
 * way cannot clip its text; it grows.** Three consequences follow and each is
 * load-bearing:
 *
 * 1. **The section's background colour is `--overlay`, not cream.** It is the
 *    same reason `Invitation` gives: where the content is taller than the
 *    photograph can cover, what shows is the scrim's own colour rather than a
 *    strip of cream. It is also why `app/page.tsx` no longer counts this chapter
 *    among the cream ones — see the note there; every cream chapter below it
 *    swaps surface, which is a real change to the page and not a tidy-up.
 * 2. **The floor is in `vw` and the box is a floor, not a shape.** See
 *    `JUNGLE_BAND.minHeightVw` and `coverAspectFloor` for both halves. There is
 *    no `aspect-*` class here any more, which is why `lib/sizes.test.ts`'s ratio
 *    tripwire no longer has a case for this file and why it grew a different one
 *    that reads the floor class instead.
 * 3. **Every word on it is cream over a solved wash, including the chapter
 *    mark.** `ui/ChapterLabel.tsx` is `--accent-text` — goldText — which
 *    non-negotiable #7 says is legible on cream and on nothing else (3.43:1 on
 *    the menu's glass, 2.0:1 on the footer's brown). It is not re-styled here;
 *    the property is redefined for that subtree, which is the same dial the
 *    section itself uses to swap `--bg` for `--surface`.
 *
 * ## The crop, and why height is the only axis it may lose
 *
 * The third request of 20 Aug: *"I like that you have cropped the image length
 * and made it thinner, but I would like for you to crop it a bit more on its
 * length."* `JUNGLE_BAND.minHeightVw` is that crop — 31vw against the
 * photograph's own 42.4vw — and it is a floor rather than a height precisely
 * because the client's second and third requests pull against each other: a band
 * thin enough to look sleek at 1440 cannot hold a heading and a paragraph at
 * 390px wide. Tight where there is room, taller where there is not. **What must
 * never come back is a fixed height that clips**, which is the defect this whole
 * change is undoing.
 *
 * Only the length is cropped, and that is not stylistic: this is a stitched
 * composite with a black panther at its left edge and a tiger at its right, so
 * losing width loses a cat. **From 1024 up the box is wider than the
 * photograph's 2.357:1 and `cover` crops the height alone** — 0% of the width,
 * measured. Below that the words make the box taller than the photograph and
 * `cover` starts taking the width instead: 17.7% at 900, 28.2% at 768 and
 * **64.1% at 390**, which leaves the two leopards centred and both edge cats
 * outside the frame. That is
 * the honest cost of putting a paragraph on a 2.357:1 photograph on a phone, it
 * is what the arrangement the client is asking to restore has always cost, and
 * it is recorded rather than hidden in
 * `docs/reviews/2026-08-19-home-v2/panels-and-band.md`.
 */
export function JunglesBand({ chapter }: { chapter: ChapterLike }) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as JunglesCopy;

  return (
    <section
      id={chapter.id}
      /*
       * `min-h-[31vw]` is `JUNGLE_BAND.minHeightVw` written literally, because a
       * Tailwind class assembled at runtime is a utility Tailwind never emits.
       * `lib/sizes.test.ts` reads this file and holds the two together — the
       * same arrangement `PANEL_SIZES` and `lg:grid-cols-2` have next door.
       *
       * **`justify-center`, and the padding is symmetric because of it —
       * client, 20 Aug 2026:** *"Centre the heading and text for 02-The Jungles
       * on the length of the image of the section."* "Length" is his word for
       * the band's HEIGHT, the same way he used it asking for the crop, so this
       * is vertical centring. It was `justify-end` with `pt-24 md:pt-32 pb-12
       * md:pb-14 lg:pb-16` until then — the words on the floor of the band, the
       * clear photograph above them, which is where this frame's subjects are.
       * The client has seen that and asked for the other thing.
       *
       * **Symmetric padding is what makes the centring true, and the value is
       * still the header's.** With `justify-center` the content is centred
       * between the two paddings, so an asymmetric pair centres it on something
       * that is not the band: at 1440 the old 128/64 would have left the block
       * 32px below the band's own middle. Equal paddings centre it exactly
       * wherever the floor is what sets the height, and pin it at `padding-top`
       * wherever the content is what sets the height — which is the case the
       * header clearance below is about. One value does both jobs.
       *
       * `overflow-hidden` is safe here in a way it was not in the arrangement
       * this replaces — nothing can be clipped by it, because nothing sets this
       * box's height except the content inside it.
       *
       * **The padding's value is the header's — the same finding
       * `Invitation.tsx` records, arriving here by a different route.**
       * `ui/SiteHeader.tsx` is `position: fixed` and paints an opaque cream bar
       * once the page has scrolled, which this chapter always has: 107px deep
       * from `md`, 75px at 390. Park this section's top at the viewport's top —
       * which is what a scroll-stop or a hash link does, and what
       * `check_contrast_over_photos.mjs` does — and with `py-16` the band was
       * too shallow to hold its words below that bar. `jungles · body` read
       * **1.00:1 at 1024, cream on the cream bar itself**, with `mark` and
       * `heading` doing the same at 768 and `mark` at 390; a screenshot shows
       * the paragraph's first line sliced off. 96/128px is the bar plus the
       * display face's own ascender plus air.
       *
       * **It costs the band nothing from 1024 up, which is where it was cropped
       * for, and it costs it 48-72px below that.** The padding can only make the
       * section taller where the words plus both paddings exceed the floor. At
       * 1440 and 1920 the floor still wins and the band is exactly
       * `minHeightVw` tall; at 1024 it grows by 2px; at 768 and 390, where the
       * words already set the height, symmetric padding costs 72px and 48px
       * against the asymmetric pair it replaces. Measured, not modelled — the
       * table is in `docs/reviews/2026-08-19-home-v2/closeout.md` §1. The
       * band's own box aspect at its narrowest and tallest case (360 x 844) goes
       * 0.74 → 0.67, which is still well above `JUNGLE_BAND.coverAspectFloor`'s
       * 0.6 and is the margin that dial's comment says is there to be spent.
       *
       * There is deliberately no `short:` arm on it, for the reason
       * `Invitation.tsx` gives: `short:` is a height and `md:` is a width, and
       * which of them applies on a 1366x768 laptop would be decided by the order
       * Tailwind emits two media blocks rather than by anything written here.
       */
      className="relative isolate flex min-h-[31vw] w-full flex-col justify-center overflow-hidden px-6 py-24 md:px-12 md:py-32"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div className="absolute inset-0 -z-10">
        {/* `noZoom` — this is a backdrop with a headline on it, exactly like the
            hero's, and the home page's zoom and float are both for photographs
            that read as discrete objects. The float would also drag the frame
            out from under the `Scrim` below, which is a sibling and not a
            child. */}
        <ImageReveal noZoom className="h-full w-full">
          <Photo
            id={chapter.media[0]}
            sizes={BAND_SIZES}
            box={BAND_BOX}
            pictureClassName="block h-full w-full"
            className="h-full w-full object-cover"
          />
        </ImageReveal>
      </div>
      <div className="absolute inset-0 -z-10">
        <Scrim {...BAND_SCRIM} />
      </div>

      {/*
        `.jungles-frame` is a **measuring** element and nothing else: it is
        `container-type: inline-size`, so `100cqw` inside it is the section's own
        content width — 100vw minus this section's `px-*` — and that is the one
        quantity the heading's offset below needs and cannot otherwise get.

        **It is deliberately not `100vw`.** A classic Windows scrollbar makes
        `100vw` 15-17px wider than the layout viewport, which on this page is
        exactly the difference between a laptop showing the pinned collage and
        not (CLAUDE.md, "demo above 1500px"). Written in `vw` the heading would
        have sat ~8px left of its target on every Windows machine and been right
        on a Mac, which is the shape of defect nobody finds in a screenshot.

        A wrapper rather than the container below, because `100cqw` on the
        container would be `min(1600px, …)` — the capped width — and the offset
        is precisely about the difference between the two.
      */}
      <div className="jungles-frame">
        <div className="mx-auto w-full max-w-[1600px]">
          <Enter>
            {/*
            Heading left, paragraph right, on ONE row from `lg` — and that is a
            crop decision before it is a compositional one. Stacked, the two
            blocks are ~430px of type at 1440 and the band could not be thinner
            than that whatever its floor said; side by side they are ~210px, and
            the floor is what sets the height instead. It is the same two-column
            header `01 · The Lodges` uses immediately above, which is what makes
            the pair read as one idea rather than as two experiments.
          */}
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-x-10">
              {/*
                **`jungles-heading` is the client's second request of 20 Aug
                2026**: *"move just the heading a bit more on the left so that it
                aligns right under the text from the Mahua Vann property card from
                the 01-The Lodges section."*

                The chapter mark travels with the heading and the paragraph does
                not, which is what "just the heading" means here — the mark and
                the headline are one block, and leaving the mark behind would put
                an 8px stagger between a label and the line it labels at 1440 and
                a 120px one at 1920. The Vann panel's own label and name share an
                edge for the same reason.

                **The offset is arithmetic, not a nudge, and that is the whole
                point** — the two blocks live in different frames. The panels are
                edge-to-edge with their own padding (`lg:px-7 xl:px-10` in
                `LodgePanels.tsx`), and this band's words are inside a centred
                1,600px container inside this section's `md:px-12`. So the gap
                between them is 20px at `lg`, 8px from `xl`, and **8px + half of
                whatever the viewport has over 1,696px** above that: 8px at 1440,
                120px at 1920, 440px at 2560. A hand-tuned single value would have
                been right on one screen and wrong on every other, which is this
                project's most-catalogued defect shape. Below `lg` there is no
                offset at all and none is needed: the panels stack there and their
                words fall back to the same `px-6 md:px-12` this section uses, so
                the two already agree to the pixel.

                `app/globals.css` carries the rule and the derivation;
                `lib/sizes.test.ts` reads both files and fails if either padding
                moves without the other.
              */}
              <div className="jungles-heading lg:col-span-6">
                {chapter.number && chapter.label && (
                  <div
                    data-contrast="jungles-mark"
                    /* goldText cannot follow this label onto a photograph
                     (non-negotiable #7), so the channel it reads is redefined
                     for this subtree rather than the component re-styled. The
                     hairline stays `--accent`: gold as a decorative rule with no
                     text in it is exactly what that rule permits. */
                    style={
                      { "--accent-text": "var(--bg)" } as React.CSSProperties
                    }
                  >
                    <ChapterMark
                      number={chapter.number}
                      label={chapter.label}
                    />
                  </div>
                )}
                {/*
                `SplitLines` — the client's *"3D raised effect"*, and the thing
                that was already true of this heading before it moved onto the
                photograph: each visual line rises out from behind its own mask,
                staggered, once the block scrolls in.

                NOT `TwoToneHeading`, for the reason recorded when this component
                was written: that takes a `TwoTone`, and this line is a plain
                string in `content/home.ts` with no word marked to soften.
                Inventing one would be writing copy, which is the client's.
                `TwoToneHeading`'s `onPhoto` does one other thing — set both
                tones to cream — and with no dimmed run there is only one tone,
                which the class below sets directly.

                The scale is unchanged from the cream arrangement (2.8rem at the
                top against `TwoToneHeading`'s 3.5rem): the client asked for this
                heading smaller on 19 Aug and has not asked for it back.
              */}
                <SplitLines
                  as="h2"
                  className="mt-6 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.4vw,2.8rem)] font-light leading-[1.1] tracking-[-0.01em] text-[color:var(--bg)]"
                >
                  {copy.quote}
                </SplitLines>
              </div>
              {/*
              `03 · The Forest`'s own paragraph, moved here when that chapter
              left the page (spec §3). That chapter's heading — "Three hundred
              birds, and the cats you came for" — is deliberately not here: the
              spec drops it with the section and keeps only this.

              Set to the right of its own column rather than ragged-left, for the
              reason it was set that way on cream: four lines of ragged-LEFT body
              copy is a legibility cost paid for a compositional effect.
            */}
              <p
                data-contrast="jungles-body"
                className="max-w-[52ch] font-[family-name:var(--font-body)] text-[1.02rem] leading-[1.72] text-[color:var(--bg)] md:text-[1.08rem] lg:col-span-6 lg:ml-auto"
              >
                {copy.intro}
              </p>
            </div>
          </Enter>
        </div>
      </div>
    </section>
  );
}
