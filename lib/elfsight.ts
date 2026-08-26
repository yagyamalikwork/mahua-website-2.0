/**
 * The client's Elfsight reviews widget — its identifiers, and nothing else.
 *
 * **Config, not copy, which is why it is here and not in `content/`.** That
 * directory holds words a visitor reads; an app id is a key into a third
 * party's system. The distinction matters because `content/` is reviewed by the
 * client line by line and this string is not something he can check by reading.
 *
 * ## This is the first third-party script on this site
 *
 * `platform.js` is loaded from Elfsight's CDN with **no Subresource Integrity
 * hash**, which means this site executes whatever that CDN serves. SRI is the
 * usual answer and it is not available: a widget platform is updated by its
 * vendor without notice, and a pinned hash would break the widget the first
 * time they shipped a change. That is the ordinary bargain of every third-party
 * embed, the client chose the embed knowing it, and it is recorded rather than
 * solved — see `docs/superpowers/specs/2026-08-26-restructure-and-reviews-design.md` §2.3.
 *
 * **It is loaded only by the pages that use it, never from `app/layout.tsx`** —
 * that much genuinely keeps it bounded, because a route that never mounts
 * `ReviewWidget` never even references `ELFSIGHT_SCRIPT`.
 *
 * **`data-elfsight-app-lazy` is kept on the mount below because it is the
 * vendor's own contract for it — Elfsight's platform reads that attribute to
 * decide how to boot the widget once it exists — but it is not what keeps the
 * platform script off the first screen, and this file used to claim it was.**
 * Measured 26 August 2026: with the platform script rendered directly here,
 * `data-elfsight-app-lazy` did not defer it at all — it fetched 588 KB over 9
 * requests on `load`, regardless of the widget sitting in the page's last
 * chapter. Full working: `docs/reviews/2026-08-26-restructure/widget-network-cost.md`.
 *
 * What actually keeps it off the first screen is `components/ui/ElfsightLoader.tsx`,
 * mounted by `ReviewWidget` alongside this class — an `IntersectionObserver`
 * that injects `ELFSIGHT_SCRIPT` only once the mount approaches the viewport.
 * Read that component's own doc comment for the mechanism; this file is
 * identifiers only, and the correction belongs where the earlier, disproven
 * claim was made.
 */

/** The vendor's platform loader. */
export const ELFSIGHT_SCRIPT = "https://elfsightcdn.com/platform.js";

/**
 * Every origin the widget's own fetch chain actually hits, in the order it
 * hits them — measured directly (Chrome DevTools Protocol, not the two
 * `transferSize`-blind rigs) in
 * `docs/reviews/2026-08-26-restructure/widget-network-cost.md`:
 * `platform.js` (`elfsightcdn.com`) → boot (`core.service.elfsight.com`) →
 * the 533 KB `tripadvisorReviews.js` bundle and its language file
 * (`universe-static.elfsightcdn.com`) → the reviews/sources data
 * (`service-reviews-ultimate.elfsight.com`) → one small SVG icon
 * (`static.elfsight.com`).
 *
 * **This is what `ReviewWidget` renders `<link rel="preconnect">` /
 * `dns-prefetch` for, added 27 Aug 2026 — a socket warmed ahead of time, not
 * a payload fetched early.** Four sequential round-trips is what the client's
 * own ruling called "guessing the runway" out of: a `<link>` cannot do
 * anything about the 533 KB itself, but it can remove the DNS lookup and
 * TCP+TLS handshake — each one of these round-trips' own first cost — from
 * the critical path once `ElfsightLoader` actually starts the fetch.
 * `ReviewWidget` renders it, not `app/layout.tsx`: see this file's own note
 * above about why the script is loaded only by the pages that use it.
 */
export const ELFSIGHT_ORIGINS = [
  "https://elfsightcdn.com",
  "https://universe-static.elfsightcdn.com",
  "https://core.service.elfsight.com",
  "https://service-reviews-ultimate.elfsight.com",
  "https://static.elfsight.com",
] as const;

/**
 * The reviews app, exactly as the client supplied it on 26 August 2026.
 *
 * It replaced `ReviewCarousel` — a curated set of three placeholder quotes in
 * `content/home.ts` — and with it the open `REVIEWS.mode` question that
 * non-negotiable #5 carried a dated exception for.
 */
export const REVIEWS_APP_ID = "9735be0a-7667-475d-938e-2de773f1c7de";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The class name Elfsight's platform scans the document for.
 *
 * Their embed is `class="elfsight-app-<uuid>"`, and the platform finds its
 * mounts by that class alone — so a typo here is not a crash, it is a silently
 * empty section. **Hence the throw**: a malformed id fails the build, which a
 * developer sees, rather than shipping a mount nothing will ever fill, which
 * nobody sees until a stakeholder opens the page.
 */
export function elfsightClass(appId: string): string {
  if (!UUID.test(appId)) {
    throw new Error(`Elfsight app id is not a uuid: "${appId}"`);
  }
  return `elfsight-app-${appId}`;
}
