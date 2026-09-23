import type { NextConfig } from "next";

/**
 * **This branch builds the site as plain files.** `Evolve-Dev` exists for one
 * reason: the client's new hosting partner runs .NET and asked for the
 * front-end on its own — HTML, CSS, JavaScript, images — to host on their own
 * servers. Nothing below changes a single pixel; it changes what `npm run
 * build` leaves behind.
 *
 * **It was always going to be possible, and that is not luck.** Every route on
 * this site already built as `○ (Static)` — there are no route handlers, no
 * server actions, no middleware, no dynamic segments and not one `next/image`
 * import (the photographs go through `scripts/build_images.mjs` into
 * `public/media` and are served as plain `<picture>` markup). The site has
 * never needed a server to render a page. `output: "export"` only stops Next
 * from wrapping that in one.
 *
 * **Do not port these three lines back to the other branches.** `feat/
 * journal-and-mobile` is what Vercel serves, and it should keep building the
 * normal way — see `docs/DEPLOY.md`. This file is the one real difference
 * between the two, and keeping it here is what lets both exist at once.
 *
 * The full handover, written for their engineers rather than for us:
 * `docs/STATIC-EXPORT-HANDOVER.md`.
 */
const nextConfig: NextConfig = {
  /**
   * Emit `out/` — pre-rendered HTML plus hashed CSS/JS — instead of a server
   * bundle. Verified 23 Sep 2026 by serving `out/` with a thirty-line
   * dependency-free file server: all four routes 200, and a real browser found
   * 0 broken images, 0 failed requests and 0 JavaScript errors on all three
   * pages.
   */
  output: "export",

  /**
   * `/mahua-vann/` as a folder holding `index.html`, rather than a bare
   * `mahua-vann.html`.
   *
   * **This is the setting that decides whether their server needs rewrite
   * rules.** A folder with a default document is what every static host —
   * IIS included — already does without being configured. The alternative
   * needs a URL-rewrite rule per route, which is exactly the kind of thing
   * that works in staging and 404s in production.
   */
  trailingSlash: true,

  /**
   * Inert today and kept as a guard. Nothing here imports `next/image`
   * (checked: zero imports across `app/` and `components/`), but if anything
   * ever does, the default loader needs a server and would fail the export at
   * build time rather than in a browser.
   */
  images: { unoptimized: true },
};

export default nextConfig;
