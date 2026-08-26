# The widget's real network cost, and why the committed rigs cannot see it

Supplementary evidence for Task 2 (`.superpowers/sdd/2026-08-26-restructure-and-reviews/task-2-brief.md`
Step 9). Not a committed project script — a one-off Playwright probe, written and run for this task only,
using the Chrome DevTools Protocol directly rather than the page's own `performance` API.

## The finding

`scripts/measure_js_budget.mjs` and `scripts/measure_page.mjs` both read
`PerformanceResourceTiming.transferSize` from the page's own `performance.getEntriesByType("resource")`.
Per the Resource Timing spec, a cross-origin response with no `Timing-Allow-Origin` response header reports
`transferSize` as **0** to the requesting page's own JavaScript — a deliberate cross-origin information
leak protection, not a bug in either rig. Elfsight's CDN (`elfsightcdn.com`, `universe-static.elfsightcdn.com`,
`service-reviews-ultimate.elfsight.com`) does not send that header on the requests this widget makes.

**Consequence: both rigs are structurally blind to the widget's bytes.** Confirmed by running each rig
twice — once against this build (widget mounted) and once against a `git stash`ed pre-task build (the old
`ReviewCarousel`, no widget at all) — and the committed figures are byte-for-byte identical:

| | pre-task (stashed) | this build (widget) |
|---|---|---|
| `measure_js_budget.mjs` static FIRST LOAD JS | 167.5 KB br | 167.5 KB br |
| `measure_js_budget.mjs` LIVE untouched transfer | 158 KB / 9 files | 158 KB / 11 files |
| `measure_page.mjs` initial, 390px | 670 KB | 670 KB |
| `measure_page.mjs` initial, 1440px | 966 KB | 966 KB |

Two extra files appear in the LIVE "untouched" (no-scroll) sample after the widget lands — `platform.js`
and Elfsight's own boot request — but they add **0 KB** to the rig's own sum, because their `transferSize`
reports as 0. This is not "the widget costs nothing"; it is "this instrument cannot price what it did not
refuse to see the cost of."

## What the widget actually costs, measured a different way

`Network.loadingFinished`'s `encodedDataLength` (Chrome DevTools Protocol) is not subject to the same
same-origin restriction — it is the browser's own account of what it received, regardless of what the page's
own JS is allowed to know. Probed directly against this build, on a fresh page load, waiting only for
`networkidle` (no scroll, no interaction):

```
15 KB   application/javascript  https://elfsightcdn.com/platform.js
5 KB    application/json        https://core.service.elfsight.com/p/boot/?w=9735be0a-...
533 KB  application/javascript  https://universe-static.elfsightcdn.com/.../widget/tripadvisorReviews.js
4 KB    application/json        https://universe-static.elfsightcdn.com/.../languages/en.json
0 KB    text/html               https://service-reviews-ultimate.elfsight.com/data/reviews?...
0 KB    text/html               https://service-reviews-ultimate.elfsight.com/data/sources?...
1 KB    application/json        https://service-reviews-ultimate.elfsight.com/data/sources?...
29 KB   application/json        https://service-reviews-ultimate.elfsight.com/data/reviews?...
1 KB    image/svg+xml           https://static.elfsight.com/icons/app-all-in-one-reviews-icons-tripadvisor-multicolor.svg

TOTAL: 588 KB over 9 requests
```

`tripadvisorReviews.js` alone is **533 KB** — more than three times this page's entire own first-load
JavaScript budget (167.5 KB).

**All 9 requests land in the "untouched" sample — before any scroll.** The widget's mount sits at the very
foot of the page (the last chapter, `08 · The Invitation`), so `data-elfsight-app-lazy` was expected to
defer this until a visitor actually scrolled that far. It does not: the script begins fetching on `load`
regardless of scroll position, confirmed by the same two files appearing in `measure_js_budget.mjs`'s
untouched (pre-scroll) LIVE sample on both the 390 and 1440 runs.

## What this means against non-negotiable #6

The committed rigs both say **PASS** — 167.5 KB br first-load JS, 670 KB / 966 KB initial transfer, both
comfortably under the 1.5 MB ceiling — and that is a true statement about what those specific instruments
measure. But a real visitor's browser downloads the extra 588 KB regardless, on `load`, whether or not they
ever scroll to the reviews. Added to the rig's own initial-transfer figures:

- 390px: 670 KB + 588 KB ≈ **1,258 KB** — still under 1.5 MB.
- 1440px: 966 KB + 588 KB ≈ **1,554 KB** — over the 1.5 MB ceiling.

This is a genuine finding, not a rig bug to fix quietly: the instrument's blind spot is a known, documented
property of the Resource Timing spec, and "fixing" `measure_page.mjs` to add Timing-Allow-Origin-blind
guessing would be inventing a number rather than measuring one. Flagged in the task report rather than
patched here.

## Does it auto-scroll?

Yes, observed directly. Two screenshots of the widget's own bounding box, five seconds apart, with **no**
scroll, hover, click or keyboard activity in between (a hover was deliberately avoided — the client's own
request was that hovering pauses the motion, which would mask exactly what this probe exists to see):

```
widget box: { x: 224, y: 429, width: 992, height: 287 }
changed% (0-5s): 12.03
changed% (5-10s): 12.07
```

~12% of the widget's own pixels differ between two static, five-second-apart snapshots, twice in a row —
consistent with a carousel advancing on its own. Per the design spec §2.3 #3: reporting this, not deciding
it. Non-negotiable #5 ("the tiger arrives, performs, then dozes… nothing on this site moves forever except
the client's own review carousel, which is a named, dated exception pending his ruling") is live again: the
widget is now a second thing on the page that moves without being asked, and whether that is acceptable is
the client's call, exactly as it was for `REVIEWS.mode` before this task retired it.
