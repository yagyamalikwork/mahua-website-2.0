import { PillButton } from "@/components/ui/PillButton";
import { HOME } from "@/content/home";

/**
 * Menu left, wordmark centred, pill right — the reference's three-item header,
 * and nothing else.
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
 * **The menu is deliberately inert.** No menu exists in this scope. A `<button>`
 * that does nothing is honest about that — it is reachable, announced as a
 * button, and traps nothing; an `<a href="#">` would promise a destination and
 * throw the visitor back to the top of the page instead.
 */
export function SiteHeader({ ctaHref }: { ctaHref: string }) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-5 sm:gap-6 sm:px-6 sm:py-6 md:px-12 md:py-8">
        <button
          type="button"
          className="pointer-events-auto justify-self-start font-[family-name:var(--font-label)] text-[0.6rem] uppercase tracking-[0.24em] text-[color:var(--bg)] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bg)] sm:text-xs sm:tracking-[0.28em] md:text-sm"
        >
          {HOME.nav.menu}
        </button>

        <p className="justify-self-center text-center font-[family-name:var(--font-display)] text-sm font-light uppercase tracking-[0.16em] text-[color:var(--bg)] sm:text-lg sm:tracking-[0.26em] md:text-2xl md:tracking-[0.3em]">
          {HOME.nav.brand}
        </p>

        <div className="pointer-events-auto justify-self-end">
          <PillButton href={ctaHref}>{HOME.nav.cta}</PillButton>
        </div>
      </div>
    </header>
  );
}
