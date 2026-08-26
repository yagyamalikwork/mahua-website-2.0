import { ELFSIGHT_SCRIPT, elfsightClass, REVIEWS_APP_ID } from "@/lib/elfsight";

/**
 * The client's Tripadvisor reviews, as his own Elfsight widget.
 *
 * Client, 26 August 2026, supplying the embed himself: the widget replaces
 * `ReviewCarousel` on the home page and appears under `04 · Written About` on
 * both property pages.
 *
 * ## A server component, and no client boundary
 *
 * React 19 hoists `<script async src>` rendered anywhere in the tree and
 * **de-duplicates by src**, so two of these on one page load the platform once
 * and neither section needs `"use client"`. That is the whole budget claim, and
 * `npm run verify:budget` is what proves it rather than this paragraph.
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
      <script src={ELFSIGHT_SCRIPT} async />
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
