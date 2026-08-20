import { Enter } from "@/components/motion/Enter";
import {
  ReviewCarousel,
  ReviewPanels,
} from "@/components/sections/ReviewCarousel";
import { FullBleed } from "@/components/ui/FullBleed";
import { PillButton } from "@/components/ui/PillButton";
import { SITE } from "@/content/site";
import { Scrim } from "@/components/ui/Scrim";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import {
  chapterCopy,
  type ChapterCopyKey,
  type GuestQuote,
  type TwoTone,
} from "@/content/home";

/**
 * The close: a full-bleed photograph at dusk, the season laid out honestly, two
 * pills, and — since 19 Aug 2026 — what three guests said, below them.
 *
 * Everything on it is cream over a scrim — the heading (its dimmed word in
 * `--surface` rather than `--dim`, which would disappear), both paragraphs, and
 * a gold rule. The pill is the one place gold is a fill rather than a line, and
 * its label is `--overlay` because neither white nor ink clears 4.5:1 on gold;
 * see `components/ui/PillButton.tsx` for the three measurements.
 *
 * This chapter carries the most text of any full-bleed screen on the page, so it
 * is the one that would overflow first on a landscape phone. The photograph is
 * absolutely positioned inside a `min-h-[100svh]` section rather than being the
 * thing that sets the height, so the section grows instead of clipping, and the
 * `--overlay` behind it means a section grown past 100vh shows the scrim's own
 * colour at the bottom rather than a strip of cream.
 *
 * **The quotes make that arrangement load bearing rather than defensive.** They
 * add roughly 190px at 1440x900 and stack to three rows below `md`, so this
 * section is taller than a screen at every viewport narrower than a laptop —
 * which is the state the paragraph above describes and the reason nothing here
 * clips. `measure_density.mjs` scores the band below the photograph as empty
 * (it stops at the first opaque background), so growing the section is not free:
 * see this chapter's own figure in `docs/reviews/2026-08-19-home-v2/collage.md`.
 */
type InvitationCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
  readonly quotes: readonly GuestQuote[];
};

export function Invitation({ chapter }: { chapter: Chapter }) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as InvitationCopy;

  return (
    <section
      id={chapter.id}
      /*
       * **The top padding is not symmetric with the bottom, and the number is
       * the header's.** `ui/SiteHeader.tsx` is `position: fixed` and 107px tall
       * over every route from `md` up (75px at 390), and it paints an opaque
       * cream bar once the page has scrolled — which this chapter always has.
       * The chapter's own heading is the first thing in the block, and once the
       * guests' quotes were added below the buttons the block grew past the
       * screen, so `items-center` stopped pushing the heading clear and started
       * pinning it to the padding: at 1440x900 its glyph boxes measured y=89
       * against a bar 107px deep and `check_contrast_over_photos.mjs` read the
       * heading at **1.00:1 — cream on the cream bar itself**, which is exactly
       * what a screenshot shows, the top of "Two forests are" sliced off.
       *
       * `pt-40` (160px) is the header's 107 plus the ~25px the display face's
       * own ascender reaches above its line box plus air. It is a padding rather
       * than a `scroll-margin` because nothing here is scrolled TO — the section
       * simply sits under a fixed bar, like every other section on the page; the
       * others get away with it by being cream.
       *
       * **There is deliberately no `short:` override on the TOP padding**, where
       * the rest of this section has one. `short:` is `(max-height: 800px)` and
       * `md:` is a width — put both on `padding-top` and which one applies on a
       * 1366x768 laptop is decided by the order Tailwind emits two media blocks,
       * not by anything written here. The header is 107px tall on a short screen
       * too, so there is nothing to compact away; the bottom padding, which no
       * fixed bar overlaps, keeps its `short:` as before.
       */
      className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-6 pt-28 pb-16 md:px-12 md:pt-40 short:pb-10"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div className="absolute inset-0 -z-10">
        <FullBleed id={chapter.media[0]} heightVh={100} />
      </div>
      <div className="absolute inset-0 -z-10">
        {/* The heaviest scrim on the page, and the narrow viewports are why. This
            chapter's two paragraphs fill ~68% of a 768×1024 frame, so most of
            the type ends up outside a radial's falloff and only an even wash
            reaches it: the radial-led version measured 4.20:1 at 768 and 4.50 at
            390, both under the 4.5 floor for body text. The photograph pays for
            it — this is the darkest frame on the page.

            **`flat` went 0.54 -> 0.60 on 19 Aug 2026, and it is the same
            argument one step further along.** The guests' quotes made the block
            taller, so at 390 the section grows to ~1,100px, the radial grows
            with it (its ellipse is a percentage of the box), and the two
            paragraphs fall right OUTSIDE its falloff — measured at r=1.08 of the
            ellipse, i.e. no radial alpha at all. `invitation · body` read
            **4.26:1** there, on copy this task never touched. Only the even wash
            reaches type that far off centre, which is what the paragraph above
            already says; the layout simply moved more of the type out there.
            0.60 is solved rather than nudged: the failing pixel composites to
            4.87:1 at that alpha against a 4.5 floor, which is the floor plus the
            ~0.15 this rig and an arithmetic model were measured disagreeing by
            on 19 Aug (`docs/reviews/2026-08-19-home-v2/shapes.md` §5.4). The
            photograph pays 6 more points of wash for it. */}
        <Scrim flat={0.6} centre={0.46} />
      </div>

      {/*
        **A full-width wrapper around `Enter`, and it is a fix rather than a
        nesting.** This section is `display: flex` with `justify-center`, so its
        flex item is sized by its own contents — and `Enter` takes no
        `className` by design (see the note there), so the item had no width of
        its own and took whatever its widest child happened to want.

        That was ~992px by accident while the widest child was a three-column
        grid of quotes, and it broke in both directions the moment a carousel
        replaced them: first to 986px inside a 360px viewport, when a
        `max-content` rail reached all the way up the chain; then, once
        `contain: inline-size` stopped that, down to **540px at 1440** — the
        60ch prose measure — because with the rail hidden from intrinsic sizing
        the widest remaining child was a paragraph.

        A width that is the emergent maximum of whatever is inside is a width
        that changes when the content does. This states it.
      */}
      <div className="w-full">
        <Enter>
          {/*
           * Two measures, not one. Everything the chapter says is 60ch — the
           * measure the two paragraphs were set and their scrim solved at — and
           * the guests' three quotes below the buttons need a wider frame than
           * that to stand as three columns rather than as three stacked
           * paragraphs. The outer block is what they get; the inner one keeps the
           * chapter's own copy exactly where it was.
           */}
          <div className="flex w-full max-w-[62rem] flex-col items-center text-center">
            <div className="flex w-full max-w-[60ch] flex-col items-center">
              <TwoToneHeading
                heading={copy.heading}
                align="centre"
                size="close"
                onPhoto
                className="max-w-[16ch]"
              />
              <span
                aria-hidden="true"
                className="mt-8 block h-px w-16 short:mt-5"
                style={{ backgroundColor: "var(--accent)" }}
              />
              <div className="mt-8 space-y-5 short:mt-5 short:space-y-3">
                {copy.body.map((paragraph, i) => (
                  <p
                    key={i}
                    /* **A hook, since 20 Aug 2026, and it is a fix rather than an
                     addition.** `check_contrast_over_photos.mjs`'s
                     `invitation · body` run selected `#invitation p` — which
                     was this chapter's two paragraphs and nothing else until the
                     review carousel put nine more inside the same section. A run
                     that silently changes what it measures is worse than one
                     that fails: it would have started reporting the worst of a
                     dozen unrelated blocks under this run's name. The reviews
                     have their own runs. */
                    data-contrast="invitation-body"
                    className="font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] text-[color:var(--bg)] md:text-lg short:text-base short:leading-[1.55]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {/*
               * The close offers the two lodges, not a second "Plan your stay".
               *
               * Client request, 15 Aug 2026: the header's pill already scrolls here,
               * and landing under "Two forests are expecting you" only to meet
               * another button off to mahuaresorts.com asked the visitor to choose
               * nothing. These two do the choosing, and they go to our own property
               * pages rather than off the site.
               *
               * **Read off `content/site.ts`, so no lodge name is written here.**
               * That file already carries the name, the region and the route for
               * both, and the menu draws its tiles from the same three fields — so
               * a third lodge, or a renamed one, arrives in both places at once and
               * cannot disagree with itself. The comma is punctuation joining two
               * names already supplied, not new copy.
               */}
              {/*
               * `w-max` so the row sizes to the two pills rather than to the prose
               * column above it. The parent is `max-w-[60ch]` — about 530px — and
               * the pair needs a little more than that, so inside it they wrapped
               * onto two lines at every width. The parent is `items-center`, so a
               * `w-max` child still centres.
               *
               * `flex-wrap` with a viewport cap is what puts them back on two lines
               * where they genuinely do not fit — a phone — rather than letting
               * them run off the edge of a section that clips its overflow.
               */}
              <div className="mt-10 flex w-max max-w-[92vw] flex-wrap justify-center gap-4 short:mt-6">
                {SITE.places
                  .filter((place) => place.region)
                  .map((place) => (
                    <PillButton
                      key={place.href}
                      href={place.href}
                      size="large"
                      raise
                    >
                      {`${place.label}, ${place.region}`}
                    </PillButton>
                  ))}
              </div>
            </div>

            {/*
             * What guests said, **below the two buttons** — the client's own
             * placement, 19 Aug 2026: *"move the sample/placeholder reviews …
             * to the bottom of this last section, below the two property
             * buttons. Later when we get the TripAdvisor API we will change it
             * to auto-scrolling reviews."*
             *
             * They were a band of their own (`components/sections/
             * Testimonials.tsx`, retired the same day) between `07 · Details`
             * and this close. **The band's own heading and paragraph did not
             * come with them**: that paragraph said "fourteen at Tadoba", a
             * count the client corrected to eleven on 12 Aug 2026, and it left
             * the page with its section. Nothing was written to replace it — a
             * heading here would be new copy, and copy is the client's.
             *
             * **What is placeholder about these is the mechanism, not the
             * words.** All three are verbatim from the Tripadvisor widget on the
             * live site, trimmed only at sentence boundaries, and
             * `content/home.test.ts` refuses an unattributed one — so the name,
             * the source and the year are the honest thing to print, and the
             * year is what says these are frozen copies rather than a live feed.
             * Nothing here dresses them as one: no star rating, no Tripadvisor
             * mark, no count of reviews, no "latest". If the client wants them
             * visibly marked as samples for the stakeholders, that is one string
             * in `content/home.ts` and it has to be his.
             *
             * **`<p>` inside the `<blockquote>` and the `<figcaption>`, and that
             * is load bearing rather than tidy.** This is cream type over a
             * photograph, so it is governed by the contrast rule, and
             * `scripts/check_contrast_over_photos.mjs`'s `invitation · body` run
             * selects `#invitation p`. Setting the quotes in anything else would
             * put nine new blocks of type on the page's darkest photograph with
             * no instrument pointed at them.
             */}
            {/*
            **A carousel since 20 Aug 2026, where this was three static blocks
            in a grid** — client request, and `ReviewCarousel.tsx` carries it in
            his own words along with why it is a curated set rather than the
            Tripadvisor widget he first asked for.

            **The block is wider than the chapter's own measure, deliberately.**
            Everything above sits in `max-w-[60ch]`, ~530px, which is the width
            the two paragraphs were set and their scrim solved at. A carousel in
            that frame shows one and a half cards and reads as a mistake. This
            one takes the outer `max-w-[62rem]` — 992px, the same width the three
            blocks it replaces spanned — so it shows the same three cards they
            did, with the third cut by the edge mask, which is the whole
            affordance that there are more.

            `Enter` is gone from the individual cards and not replaced. It
            staggered three blocks in a grid; on a rail that is already moving it
            would be a second movement laid over the first, which is the mistake
            `SplitLines`' own note records being made once and undone.
          */}
            <div className="mt-10 w-full md:mt-12 short:mt-7">
              <ReviewCarousel reviews={copy.quotes} />
            </div>
          </div>
        </Enter>
      </div>

      {/* Outside the `<Enter>`, and that is not tidiness — see `ReviewPanels`.
          `Enter` sets a transform while it is staged, and a transform on any
          ancestor stops `position: fixed` escaping this section's own
          `overflow-hidden`. */}
      <ReviewPanels reviews={copy.quotes} />
    </section>
  );
}
