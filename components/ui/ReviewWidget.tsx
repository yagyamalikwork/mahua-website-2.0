import { ElfsightLoader } from "@/components/ui/ElfsightLoader";
import { elfsightClass, REVIEWS_APP_ID } from "@/lib/elfsight";

/**
 * The client's Tripadvisor reviews, as his own Elfsight widget.
 *
 * Client, 26 August 2026, supplying the embed himself: the widget replaces
 * `ReviewCarousel` on the home page and appears under `04 · Written About` on
 * both property pages.
 *
 * ## The platform script is gated, not rendered here
 *
 * This used to render `<script src={ELFSIGHT_SCRIPT} async />` directly and
 * lean on React 19's hoist-and-dedupe-by-`src` behaviour for `<script async
 * src>` tags, on the theory that `async` plus the vendor's own
 * `data-elfsight-app-lazy` attribute meant the platform could never cost the
 * first load. **Measured 26 August 2026, that theory was wrong**:
 * `data-elfsight-app-lazy` does not defer the platform script at all — it
 * fetched 588 KB over 9 requests on `load`, regardless of the widget sitting in
 * the page's last chapter, taking desktop initial transfer to 1,554 KB against
 * non-negotiable #6's 1,500 KB ceiling and the hero's arrival from 4,616 ms to
 * 5,377 ms. See `docs/reviews/2026-08-26-restructure/widget-network-cost.md`.
 *
 * `ElfsightLoader` is the fix: an `IntersectionObserver` that injects the same
 * script only once the mount approaches the viewport. This component stays a
 * server component regardless — it hands the loading decision to that one
 * client boundary rather than becoming one itself, for the same reason
 * `PinnedCollage` does (CLAUDE.md, Architecture rule): a client component's
 * `import`s are what ship to the browser, and `ElfsightLoader`'s own import
 * list is a few hundred bytes, not 30-odd curated media entries.
 *
 * ## What it does with no JavaScript, and why that is a `<noscript>` and not
 * a spinner
 *
 * The widget renders nothing without script — it is script. A section that
 * collapsed to a heading over emptiness would be a hole in the page, so the
 * fallback is a line of type in the site's own voice, taken from `content/`.
 * **Everything decorative on this site has a defined still state** (CLAUDE.md,
 * Conventions) and a third-party embed is no exception.
 *
 * ## The one thing that cannot be asserted here
 *
 * Whether the widget **auto-scrolls**. If it does, non-negotiable #5 — nothing
 * on this site moves forever — is live again, and it is the client's call
 * whether it stays, not this component's. `docs/reviews/2026-08-26-restructure/`
 * carries the observation.
 */
export function ReviewWidget({
  appId = REVIEWS_APP_ID,
  label,
  fallback,
}: {
  /** Defaults to the reviews app. A prop so a second widget never means a second component. */
  appId?: string;
  /** The accessible name of the region. Omit and no region landmark is rendered. */
  label?: string;
  /** What a visitor with no JavaScript reads instead. Comes from `content/`. */
  fallback?: string;
}) {
  const mount = (
    <>
      <ElfsightLoader />
      <div className={elfsightClass(appId)} data-elfsight-app-lazy />
      {fallback && (
        <noscript>
          <p
            className="font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.6]"
            style={{ color: "var(--dim)" }}
          >
            {fallback}
          </p>
        </noscript>
      )}
    </>
  );

  if (!label) return mount;
  return (
    <section aria-label={label} className="w-full">
      {mount}
    </section>
  );
}
