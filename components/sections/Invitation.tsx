import { Enter } from "@/components/motion/Enter";
import { FullBleed } from "@/components/ui/FullBleed";
import { PillButton } from "@/components/ui/PillButton";
import { ReviewWidget } from "@/components/ui/ReviewWidget";
import { SITE } from "@/content/site";
import { Scrim } from "@/components/ui/Scrim";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import {
  chapterCopy,
  HOME,
  type ChapterCopyKey,
  type TwoTone,
} from "@/content/home";

/**
 * The close: a full-bleed photograph at dusk, the season laid out honestly, two
 * pills, and — since 19 Aug 2026, first as a curated set and since 26 Aug 2026
 * as the client's own Tripadvisor widget — what guests said, below them.
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
 * **The reviews make that arrangement load bearing rather than defensive.**
 * Whatever the widget renders sits below both paragraphs and the two pills, so
 * this section is taller than a screen at most viewports narrower than a
 * laptop — which is the state the paragraph above describes and the reason
 * nothing here clips. `measure_density.mjs` scores the band below the
 * photograph as empty (it stops at the first opaque background), so growing
 * the section is not free — see `docs/reviews/2026-08-26-restructure/` for
 * this chapter's figure with the widget mounted, against the three-quote
 * grid's own figure in `docs/reviews/2026-08-19-home-v2/collage.md`.
 */
type InvitationCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
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
           * the reviews widget below the buttons wants a wider frame than that,
           * the same argument that held when this was three quotes standing as
           * columns rather than stacked paragraphs. The outer block is what it
           * gets; the inner one keeps the chapter's own copy exactly where it was.
           */}
          {/*
            **`mx-auto` since 21 Aug 2026, and its absence was a real defect the
            client caught by eye.** This block used to be centred by the
            section's own `justify-center`, because it was (a descendant of) the
            section's only flex item and that item was content-sized. Wrapping
            `Enter` in a full-width div — necessary, see the note above it —
            made the flex item fill the section, so `justify-center` had nothing
            left to centre and this 992px block sat against the left edge of a
            1,344px one. **Everything in the chapter moved left together**: the
            heading, both paragraphs, the two pills and the carousel.

            A width and a position are two decisions, and the old arrangement
            made one of them a side effect of the other.
          */}
          <div className="mx-auto flex w-full max-w-[62rem] flex-col items-center text-center">
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
             * buttons."* That placement outlived everything else about the
             * mechanism: first three static blocks, then (20 Aug) a curated
             * carousel of the same three quotes, and since **26 August 2026**
             * the client's own Elfsight embed — a live Tripadvisor feed, so
             * there is no copy of ours to place here at all. See
             * `content/home.ts`'s own removal comment for the quotes' history
             * and `components/ui/ReviewWidget.tsx` for what the widget does and
             * does not do.
             *
             * **No `fallback` prop, and that is an omission rather than a
             * choice.** `ReviewWidget` renders a `<noscript>` line only when
             * handed one, and the client has not supplied the sentence a
             * visitor with no JavaScript should read here — inventing one would
             * be exactly the placeholder-prose defect this project has shipped
             * before. An empty `<noscript>` is honest; a sentence attributed to
             * the lodge that nobody at the lodge wrote is not. Owed, not missed.
             *
             * **The wrapper is wider than the chapter's own measure, still
             * deliberately.** Everything above sits in `max-w-[60ch]`, ~530px,
             * the width the two paragraphs were set and their scrim solved at —
             * too narrow for whatever the widget lays out. This block keeps the
             * outer `max-w-[62rem]`, 992px, that the three-quote carousel used
             * for the same reason.
             *
             * `Enter` still wraps this div and not anything inside it: the
             * widget is a third-party mount whose internal motion, if any, is
             * the vendor's to own, not this component's to stagger.
             */}
            <div className="mt-10 w-full md:mt-12 short:mt-7">
              <ReviewWidget label={HOME.reviews.region} />
            </div>
          </div>
        </Enter>
      </div>

      {/*
        **`ReviewPanels` sat outside the `<Enter>` until 26 August 2026, and the
        reason it did still binds anything that goes here.** `Enter` sets a transform
        while it is staged, and a transform on any ancestor stops `position: fixed`
        escaping this section's `overflow-hidden`. The widget below is an iframe-like
        third-party mount and does not need to escape — but the next thing that does
        will, and this is where that was learned.
      */}
    </section>
  );
}
