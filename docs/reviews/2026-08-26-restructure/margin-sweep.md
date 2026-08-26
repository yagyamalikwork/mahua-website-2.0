# The APPROACH_MARGIN sweep, and the preconnect fix — Critical 1 of the whole-branch fix wave

27 August 2026. Not a committed project script — two one-off Playwright probes, written and run for this
fix only, in the spirit of Task 2's own `widget-network-cost.md` probe. Full narrative:
`docs/DECISIONS.md` §22.11 (to be written), `CLAUDE.md`'s Phase entry, `.superpowers/sdd/
2026-08-26-restructure-and-reviews/final-fix-report.md`.

## The finding this fix responds to

`APPROACH_MARGIN = "600px"` in `components/ui/ElfsightLoader.tsx` was chosen by reasoning in a doc comment
— "roughly two-thirds of a laptop screen — one unhurried scroll gesture's worth of warning" — and never
measured. The branch's own screenshots proved it fails:
`docs/reviews/2026-08-26-restructure/shots-task9/w1440-06-invitation.webp` shows the two lodge pills and
then only the "Free Tripadvisor Reviews Widget" badge — zero review cards — at 390, 768 and 1440px. The
pre-gate capture (`shots/w1440-06-invitation.webp`, commit `046ea41`) shows three cards.

## Method

- **No source change needed for the sweep itself.** `ElfsightLoader`'s `IntersectionObserver` is
  constructed with the literal string `"600px"` as its `rootMargin` at the time of the sweep, which is
  unique among this page's own observers (checked against every other `rootMargin` in the codebase:
  `Enter`/`useInView` use `"0px 0px -12% 0px"`, `StickyHeader` uses `"-25% 0px 0px 0px"`, the pinned collage
  uses `"100% 0px 100% 0px"`, the lantern — unmounted on this branch — uses `"200px"`). A Playwright
  `addInitScript` subclasses `window.IntersectionObserver` so any construction with `rootMargin === "600px"`
  gets the candidate margin instead, letting one build serve every candidate.
- **Network**: Slow 4G (1.6 Mbps down / 750 Kbps up / 150 ms RTT) + 4x CPU throttle — the exact profile
  `scripts/measure_page.mjs` uses for this project's own committed hero-arrival and transfer figures.
  Applied from page load, not just from the widget's own fetch chain, so the rest of the page pays the same
  cost a real visitor would.
- **Scroll, two paces**, both realistic, neither invented for this fix alone:
  1. **This project's own already-committed pace** — `scripts/measure_page.mjs`'s `scrollWholePage()`
     (`step = 0.8 × innerHeight`, 260 ms per step). Top to bottom of the home page (8,215px document) in
     ≈3.1s of scrolling. This is what this project already calls "whole page scrolled" for its own transfer
     figures, so it is a legitimate, precedented definition of "a scroll" even though it is fast.
  2. **A slower, attentive-reader pace** (1,800 ms per step) — closer to how this page is actually meant to
     be read (non-negotiable #2, "seduce, not convert… unhurried and warm"; this is "a dense, image-led
     journey in chapters," not a page built to be flicked through). Top to bottom in ≈27–28s.
- After the scroll reaches the bottom ("arrival"), poll every 250ms for up to 10s for the widget mount's own
  rendered height (`getBoundingClientRect().height`) to exceed 150px — the bare "Free Tripadvisor Reviews
  Widget" badge alone is much shorter; the full three-card render measures 252–287px depending on width.

## Results — candidates: 600px (shipped until this fix), 1200px, 2000px, 100% (viewport-relative)

**Fast pace (260ms/step, ≈3.1s top-to-bottom scroll), Slow 4G + 4x CPU:**

| margin | scroll wall-clock | 1st Elfsight request at | rendered by arrival? | lag after arrival |
|---|---|---|---|---|
| 600px | 8,755 ms | 7,974 ms | **no** | 4,765 ms |
| 1200px | 8,804 ms | 7,748 ms | **no** | 3,621 ms |
| 2000px | 9,052 ms | 7,490 ms | **no** | 3,173 ms |
| 100% (~900px @ 1440×900) | 9,048 ms | 8,264 ms | **no** | 5,511 ms |

Full JSON: `margin-sweep-fast-260ms.json`.

**Reading pace (1,800ms/step, ≈27–28s top-to-bottom scroll), Slow 4G + 4x CPU:**

| margin | scroll wall-clock | 1st Elfsight request at | rendered by arrival? | lag after arrival |
|---|---|---|---|---|
| 600px | 27,251 ms | 21,832 ms | no | 961 ms |
| **1200px** | 27,175 ms | 19,982 ms | **essentially yes** | **4 ms** |
| 2000px | 27,844 ms | 18,225 ms | essentially yes | 4 ms |
| 100% (~900px) | 28,311 ms | 21,844 ms | no | 107 ms |

Full JSON: `margin-sweep-reading-1800ms.json`.

## What this means, honestly

**At the reading pace — the one that actually matches how this page is built to be consumed — 1200px is
the smallest of the four candidates that closes the gap.** 600px still left a visible ~1s hole between
arrival and the cards painting; 1200px and 2000px both landed within 4ms of arrival (functionally
simultaneous); the viewport-relative `100%` (≈900px on a 1440×900 screen) sat between 600 and 1200's own
results, consistent with margin size alone driving the effect. **1200px shipped** — the smallest margin
tested that reliably renders, not the largest one tried.

**This does not mean the widget now appears instantly for every visitor, and that is recorded rather than
smoothed over.** At the fast pace, even 2000px still lagged arrival by ~3.2s. The reason is not a margin
that is still too small: the vendor's own fetch-and-render chain (four sequential round-trips behind a
533 KB bundle — `widget-network-cost.md`) takes longer under Slow 4G than that pace's entire top-to-bottom
scroll (≈3.1s). No `rootMargin` can trigger before the page itself has finished loading, so there is a hard
floor under a fast enough scroll that only a smaller bundle (not ours to shrink) or a materially different
loading strategy could close. Widening the margin further than 1200px buys diminishing lead time while
spending bytes on more visitors who never reach the foot of the page — the same trade-off the original
(disproven) 600px comment was reaching for, just measured this time instead of assumed.

## The preconnect / warm-up (the second half of the client's ruling)

`components/ui/ReviewWidget.tsx` now renders one `<link rel="preconnect">` and one `<link rel="dns-prefetch">`
per origin the widget's fetch chain actually hits (`ELFSIGHT_ORIGINS`, `lib/elfsight.ts`, sourced from
`widget-network-cost.md`'s own CDP capture): `elfsightcdn.com`, `universe-static.elfsightcdn.com`,
`core.service.elfsight.com`, `service-reviews-ultimate.elfsight.com`, `static.elfsight.com`. React 19 hoists
`<link>` elements to `<head>` wherever they render — confirmed on the live build (`curl` of the served HTML;
all ten tags land before `</head>`, byte offsets 3672–4001 against `</head>` at 4780) — so this needed no
`next/head` and no client boundary. It renders only from `ReviewWidget`, which only the pages that mount the
widget import, so `app/layout.tsx` is untouched — the same constraint `lib/elfsight.ts` already records for
`ELFSIGHT_SCRIPT` itself.

**A preconnect is a socket, not a payload.** `npm run verify:budget` after this change: **167.2 KB brotli
first-load JS, unchanged** — the exact figure Task 9's own fresh build read.

## Confirmations

**Bytes still deferred — CDP probe, no scroll, no interaction, 1440×900, both before and after this fix:**

```
{ "elfsightRequestCount": 0, "elfsightRequests": [] }
```

Run against the 600px build (baseline) and again against the shipped 1200px build — both zero. The widget's
mount sits far enough down the 8,215px document (near the very end of the last chapter) that neither margin
brings it within range of the viewport on an unscrolled load.

**Cards actually render at all four review widths** — a normal (non-throttled) local connection, the same
realistic (260ms/step) scroll, then a 4s settle with no further interaction:

| width | widget mount height | cards rendered |
|---|---|---|
| 390px | 271px | yes |
| 768px | 287px | yes |
| 1440px | 287px | yes |
| 1920px | 287px | yes |

Screenshots: `margin-sweep-confirm-w1440.png` (three named review cards — "Trail67656908805", "kartik",
"Deep" — matching the pre-gate baseline), `margin-sweep-confirm-w390.png` (one card visible, scrolled to the
widget's own position).

## What changed

- `components/ui/ElfsightLoader.tsx` — `APPROACH_MARGIN`: `"600px"` → `"1200px"`, doc comment rewritten with
  this measurement in place of the unmeasured reasoning it replaced.
- `lib/elfsight.ts` — new `ELFSIGHT_ORIGINS` export, the widget's real fetch-chain origins.
- `components/ui/ReviewWidget.tsx` — renders `<link rel="preconnect">` / `dns-prefetch` for each origin.
- `docs/reviews/2026-08-26-restructure/README.md` §5 — corrected; see the fix-wave report for the exact
  wording change (it previously asserted "solid near-black rectangular cards" at every width while citing
  frames that show none).
