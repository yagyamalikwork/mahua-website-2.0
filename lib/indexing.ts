/**
 * Whether search engines may index this deployment.
 *
 * **The default is no, and the direction is the whole point.** Every deployment
 * of this site is a demo until somebody decides otherwise: a preview build, a
 * branch someone pushed, a Vercel URL shared for a presentation. Exactly one of
 * them will ever be the real site. So the safe answer is the one you get by
 * doing nothing, and going live is a deliberate act — set
 * `NEXT_PUBLIC_ALLOW_INDEXING=true` in that one environment.
 *
 * This is the same shape as the welcome screen and the property bar, which are
 * both written backwards so that a failure leaves them *absent* rather than
 * covering the page (`docs/DECISIONS.md` §14). Here the harm runs the other way
 * — a forgotten flag would publish a demo to Google, competing with Mahua's
 * live site under a URL nobody wants ranked — so the flag defaults to silence.
 *
 * A misspelt or missing variable therefore fails safe. Only the exact string
 * `"true"` opens indexing; anything else, including `"1"`, `"yes"` and
 * `undefined`, leaves it shut.
 */
export const INDEXING_ALLOWED = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
