import { BrandMark } from "@/components/ui/BrandMark";
import { ChapterMenu } from "@/components/ui/ChapterMenu";
import { PillButton } from "@/components/ui/PillButton";
import { StickyHeader } from "@/components/ui/StickyHeader";
import { CHAPTERS } from "@/content/chapters";
import { HOME } from "@/content/home";

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
 * **The menu used to be inert** — a `<button>` labelled "Menu" that did nothing,
 * in the most prominent position on the page. It now opens `ChapterMenu`, which
 * lists the seven numbered chapters of `content/chapters.ts` and goes to them.
 */
export function SiteHeader({ ctaHref }: { ctaHref: string }) {
  // Found by kind rather than by index. The hero is the chapter the bar is
  // transparent over, and "the first chapter" is a coincidence of the current
  // spine rather than a property of it.
  const hero = CHAPTERS.find((chapter) => chapter.kind === "hero");
  if (!hero) throw new Error("The page has no hero chapter for the header to watch.");

  return (
    <StickyHeader heroId={hero.id}>
      {/*
       * The base gap and padding are tighter than they look like they should be
       * because a 320px phone has to fit "Menu", the brand lockup and the "Plan
       * your stay" pill on one row. At `gap-3 px-5` the lockup ran 7px past the
       * pill and pushed the whole page into horizontal scroll. Everything from
       * `sm` up gets the roomier spacing back.
       */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 md:px-12 md:py-8">
        <ChapterMenu />

        <BrandMark className="justify-self-center" />

        {/*
         * `data-contrast` is the hook `scripts/check_contrast_over_photos.mjs`
         * finds the pill by, and it is on the wrapper because the pill itself is
         * `PillButton`, which is used in three places and must not carry a hook
         * that means "the one in the header". Selecting it structurally is what
         * this project has already been burned by twice — `header > div > p` for
         * the wordmark, and `header a[href^='#']`, which would also have matched
         * the seven chapter links inside `ChapterMenu`'s panel, since the panel
         * is a child of this header and keeps its layout boxes while closed.
         */}
        <div data-contrast="header-pill" className="pointer-events-auto justify-self-end">
          <PillButton href={ctaHref}>{HOME.nav.cta}</PillButton>
        </div>
      </div>
    </StickyHeader>
  );
}
