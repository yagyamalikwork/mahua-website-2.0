import type { MetadataRoute } from "next";
import { INDEXING_ALLOWED } from "@/lib/indexing";

/**
 * `robots.txt`, and it says **no** until somebody deliberately says otherwise.
 *
 * Mahua has a live WordPress site. A demo deployment that Google indexes
 * competes with the real one in search, under a URL nobody wants ranked, and
 * carrying facts that are still unconfirmed at the time of writing — a Nagpur
 * distance, and room counts that took reading the client's own booking engine
 * to settle once already. Un-indexing a crawled page is far more work than
 * never being crawled.
 *
 * **This is paired with a `robots` meta tag in `app/layout.tsx`, and both are
 * needed.** `robots.txt` asks a crawler not to *fetch* a page; the meta tag
 * tells one that fetched it anyway not to *index* it. A page reached by a link
 * from somewhere else can be indexed with no `robots.txt` fetch at all.
 *
 * See `lib/indexing.ts` for the switch and why its default is the safe one.
 */

/**
 * Declares what was already true, and what `output: "export"` insists be said
 * out loud.
 *
 * This route reads one build-time constant and returns one of two fixed
 * objects — there is nothing dynamic in it. A normal `next build` works that
 * out on its own, but a static export refuses to guess: without this line it
 * fails with *"export const dynamic = \"force-static\" … not configured on
 * route /robots.txt"* and the whole export stops.
 *
 * It changes nothing about the Vercel build, where this route was already
 * emitted as `○ (Static)`.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (!INDEXING_ALLOWED) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return { rules: { userAgent: "*", allow: "/" } };
}
