import { BrandMark } from "@/components/ui/BrandMark";
import { ChapterMenu } from "@/components/ui/ChapterMenu";
import { PillButton } from "@/components/ui/PillButton";
import { HOME } from "@/content/home";

/**
 * Menu left, the brand lockup centred, pill right — the reference's three-item
 * header, and nothing else.
 *
 * It overlays the hero but is not part of it, so it lives here and is composed by
 * `app/page.tsx` rather than nested inside `Hero`. It is absolutely positioned
 * rather than fixed: cream type over a photograph is only legible while there is
 * a photograph under it, and a header that followed the visitor down onto the
 * cream page would have to invert its own colours mid-scroll. That is a real
 * feature with real failure modes and no copy written for it, so the header
 * scrolls away with the hero it belongs to.
 *
 * A three-column grid, not a flex row: `1fr auto 1fr` centres the wordmark on the
 * *container* rather than in the gap left over between two items of unequal
 * width, which is the difference between a centred wordmark and one that drifts
 * left because "Plan your stay" is wider than "Menu".
 *
 * **The menu used to be inert** — a `<button>` labelled "Menu" that did nothing,
 * in the most prominent position on the page. It now opens `ChapterMenu`, which
 * lists the seven numbered chapters of `content/chapters.ts` and goes to them.
 * That component is the only client component in the header; everything else
 * here is static markup and stays on the server.
 */
export function SiteHeader({ ctaHref }: { ctaHref: string }) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40">
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

        <div className="pointer-events-auto justify-self-end">
          <PillButton href={ctaHref}>{HOME.nav.cta}</PillButton>
        </div>
      </div>
    </header>
  );
}
