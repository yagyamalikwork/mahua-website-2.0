import { BrandMark } from "@/components/ui/BrandMark";
import { Photo } from "@/components/ui/Photo";
import { PillButton } from "@/components/ui/PillButton";
import { SiteMenu } from "@/components/ui/SiteMenu";
import { StickyHeader } from "@/components/ui/StickyHeader";
import { CHAPTERS } from "@/content/chapters";
import { HOME } from "@/content/home";
import { SITE } from "@/content/site";

/**
 * Menu left, the brand lockup centred, pill right — the reference's three-item
 * header, and nothing else.
 *
 * It overlays the hero but is not part of it, so it lives here and is composed by
 * `app/page.tsx` rather than nested inside `Hero`.
 *
 * **It follows the visitor down the page**, at the client's request on 5 Aug
 * 2026 and after the objection that used to sit in this comment was tested
 * against the reference rather than reasoned about. That objection was: cream
 * type over a photograph is only legible while there is a photograph under it,
 * so a header that followed the visitor onto the cream page would have to invert
 * its own colours mid-scroll, which is a real feature with real failure modes.
 * The reference answers it — `thesujanlife.com` is `fixed` from the first pixel,
 * transparent at the top, and cream-backed past the hero, **with nav type that
 * never changes colour at all** (`docs/reviews/2026-08-05-sujan-scroll/`). A bar
 * earns its legibility by gaining a background. The colour change on top of that
 * is the client's own ask — the wordmark arrives in the brand's brown once there
 * is cream under it — and it is a nicety the background already covers for, not
 * the mechanism the header depends on.
 *
 * `StickyHeader` owns the state, the `position`, and the fail-safe that keeps
 * the header where it used to be whenever it cannot know which state it is in.
 * Everything below it here is static markup and stays on the server.
 *
 * A three-column grid, not a flex row: `1fr auto 1fr` centres the wordmark on the
 * *container* rather than in the gap left over between two items of unequal
 * width, which is the difference between a centred wordmark and one that drifts
 * left because "Plan your stay" is wider than "Menu".
 *
 * **The menu is the site's, not the page's.** `SiteMenu` lists `SITE.places` —
 * Home and both lodges — rather than the current page's own chapters, because
 * this header now renders on all three routes. `chapters` stays as a prop
 * purely so the sticky-header machinery below knows which id is the hero.
 */
type HeaderChapter = {
  readonly id: string;
  readonly number?: string;
  readonly label?: string;
};

/**
 * The menu's lodge cards. Rendered HERE, on the server, and handed to the
 * client menu as elements — `SiteMenu` must never import `Photo` (see the
 * architecture rule; the manifest is the payload). Exported for
 * `lib/sizes.test.ts`.
 *
 * **These were fixed 112/160/208px boxes until 11 Aug 2026**, when the client
 * asked for the tiles bigger and side by side. They are now half the panel, so
 * the widths are derived from the panel's own geometry rather than picked:
 * `SiteMenu`'s grid is one column below 640, two above it, inside
 * `max-w-[1600px]` with `px-6`/`md:px-12` padding and `sm:gap-6`/`md:gap-10`.
 *
 *   ≥1696px  the panel is capped at 1600 → (1600 − 96 − 40) / 2 = 732px
 *   ≥768px   (100vw − 96 − 40) / 2       = 50vw − 68px
 *   ≥640px   (100vw − 48 − 24) / 2       = 50vw − 36px
 *   below    one column, full width      = 100vw − 48px
 *
 * A card is ~652px at a 1440 viewport, so a 2× screen asks for ~1304px and the
 * manifest's 1440 tier covers it. **If this grid's padding or gap changes,
 * these change with it** — `check_image_resolution.mjs` is what catches it when
 * they do not, by comparing each photograph's served width against its real box.
 */
export const MENU_CARD_SIZES =
  "(min-width: 1696px) 732px, (min-width: 768px) calc(50vw - 68px), (min-width: 640px) calc(50vw - 36px), calc(100vw - 48px)";
export const MENU_CARD_BOX = 3 / 2;

const menuCards = Object.fromEntries(
  SITE.places
    .filter((p) => p.cardMediaId)
    .map((p) => [
      p.href,
      <span key={p.href} className="block aspect-[3/2] w-full">
        <Photo
          id={p.cardMediaId!}
          decorative
          sizes={MENU_CARD_SIZES}
          box={MENU_CARD_BOX}
          pictureClassName="block h-full w-full"
          className="h-full w-full object-cover"
        />
      </span>,
    ]),
);

export function SiteHeader({
  ctaHref,
  ctaLabel = HOME.nav.cta,
  chapters = CHAPTERS,
}: {
  ctaHref: string;
  ctaLabel?: string;
  chapters?: readonly HeaderChapter[];
}) {
  // Found by position, not by tag. This header now renders both the home
  // page (`content/chapters.ts`, `kind: "hero"`) and the two property pages
  // (`content/property-chapters.ts`), whose `PropertyChapter` carries no
  // `kind` at all — it dispatches on a different, non-overlapping `shape`
  // union instead (see `content/property-chapters.ts`). There is no tag both
  // spines share to search by, so this reads the one thing they do share:
  // the hero is always the first chapter, in all three spines, each with its
  // own test asserting it (`content/chapters.test.ts`,
  // `content/mahua-vann.test.ts`, `content/mahua-tola.test.ts`).
  const hero = chapters[0];
  if (!hero) throw new Error("The page has no hero chapter for the header to watch.");

  return (
    <StickyHeader heroId={hero.id}>
      {/*
       * The base gap and padding are tighter than they look like they should be
       * because a 320px phone has to fit the hamburger, the brand lockup and the
       * "Plan your stay" pill on one row. At `gap-3 px-5` the lockup ran 7px past
       * the pill and pushed the whole page into horizontal scroll. Everything
       * from `sm` up gets the roomier spacing back.
       */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 md:px-12 md:py-8">
        <SiteMenu places={SITE.places} cards={menuCards} />

        {/* Chrome on every page, so real anchor is the fallback navigation when
            scripting fails. SiteFooter and SiteMenu use plain anchors too. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          aria-label="Mahua Resorts — home"
          data-rule="none"
          className="pointer-events-auto justify-self-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--header-ink)]"
        >
          <BrandMark />
        </a>

        {/*
         * `data-contrast` is the hook `scripts/check_contrast_over_photos.mjs`
         * finds the pill by, and it is on the wrapper because the pill itself is
         * `PillButton`, which is used in three places and must not carry a hook
         * that means "the one in the header". Selecting it structurally is what
         * this project has already been burned by twice — `header > div > p` for
         * the wordmark, and `header a[href^='#']`, which would also have matched
         * the places' links inside `SiteMenu`'s panel, since the panel is a
         * child of this header and keeps its layout boxes while closed.
         */}
        <div data-contrast="header-pill" className="pointer-events-auto justify-self-end">
          <PillButton href={ctaHref}>{ctaLabel}</PillButton>
        </div>
      </div>
    </StickyHeader>
  );
}
