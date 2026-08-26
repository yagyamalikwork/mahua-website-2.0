# Task 2 — the widget replaces the home page's review carousel — evidence

**26 August 2026, `feat/journal-and-mobile`.** `.superpowers/sdd/2026-08-26-restructure-and-reviews/task-2-brief.md`
Step 9's own words: measuring this "is the point of the task". Against the pre-task figures CLAUDE.md
records — 491 tests, 167.5 KB brotli first-load JS, hero `responseEnd` ~4,611 ms — except this branch had
already moved to **499 tests** by the time Task 1 (the `ReviewWidget` component) landed, so 499 is this
task's own starting point; see the task report for the exact accounting.

Every figure below is re-derivable: `npm run build && npx next start -p 3100`, then the commands named at
each heading. Two runs of `measure_js_budget.mjs`/`measure_page.mjs` are committed under
`baseline-before-widget/` — the **same rig, same build, minus this task's changes** (`git stash` before
rebuilding) — because the headline finding here is that the widget is invisible to both rigs' own
transfer-size arithmetic, and that claim is only checkable against a true before/after on one machine.

## 1 · First-load JavaScript — delta zero, by this project's own instrument

`node scripts/measure_js_budget.mjs --port 3100 --width 1440` and `--width 390`:

| | 390px | 1440px |
|---|---|---|
| static FIRST LOAD JS (own bundle) | 167.5 KB br | 167.5 KB br |
| LIVE, untouched (no scroll) | 158 KB / 9 files | 158 KB / 11 files |
| LIVE, after scroll | 203 KB / 11 files | 203 KB / 13 files |

Identical, byte for byte, to a build with this task's changes `git stash`ed out (see
`baseline-before-widget/js-budget-390.json`, `js-budget-1440.json`). **This is not "the widget costs
nothing" — see §4.** `verdict: "pass"` in both `js-budget-390.json` and `js-budget-1440.json`.

## 2 · Initial transfer — against the 1.5 MB budget

`node scripts/measure_page.mjs --port 3100 --out page.json`:

| | 390px | 1440px |
|---|---|---|
| initial (own instrument) | 670 KB (9 images, 388 KB) | 966 KB (14 images, 684 KB) |
| whole page scrolled | 1,714 KB (18 images) | 2,051 KB (22 images) |

Both pass the 1.5 MB non-negotiable #6 ceiling, and both are **identical** to the stashed pre-task build
(`baseline-before-widget/page.json`) — the same blind spot as §1, because `measure_page.mjs`'s `initialKB`
is the same `transferSize` sum. **Read §4 before taking "pass" as the whole answer.**

Hero photograph itself: `reception-path-dusk-1440.avif`, 192 KB, `responseEnd` unaffected (this section
mounts nowhere near the hero) — see §3 for the LCP-arms figure, which is the one this task's own change
could plausibly move.

## 3 · Hero `responseEnd` — medians of five, and a real regression

`node scripts/measure_lcp_arms.mjs --runs 5 --port 3100`, run in isolation (no other Playwright process
hitting the server — an earlier run contaminated by concurrent measurement read ~5,447 ms and was discarded
rather than reported, then reproduced cleanly below within 34 ms of that discarded figure, so the
contamination concern turned out to be moot — this is real):

| | median (5 runs) | range |
|---|---|---|
| **pre-task, same machine, `git stash`ed** (`baseline-before-widget/lcp-arms.json`) | **4,616 ms** | 4,594–4,625 |
| **this build** (`lcp-arms.json`) | **5,377 ms** | 5,337–5,443 |

**+761 ms, +16.5%.** The pre-task figure lands within 5 ms of CLAUDE.md's own documented ~4,611 ms, which
is what makes this a trustworthy before/after rather than two numbers from different machine conditions —
the instrument reproduces the historical figure almost exactly, so the delta is the widget, not noise.

**Why a widget mounted at the very foot of the page slows down the hero at the very top of it:** the
Elfsight script tag is `<script async>`, which React 19 hoists to `<head>` regardless of where in the tree
it is rendered (`ReviewWidget.tsx`'s own doc comment), and `async` means it starts fetching immediately
rather than waiting for anything. On an unthrottled connection that is free. On the Slow 4G profile this
rig simulates (1.6 Mbps down), every request shares one constrained pipe — the same mechanism CLAUDE.md
already documents for the two films' posters (non-negotiable #6: *"a `<video poster>` is fetched
immediately however far down the page it sits"*), now recurring with a third-party script instead of an
image. This chapter's own hero is unaffected in isolation — the regression is bandwidth contention on the
link, not anything about `Invitation.tsx` itself.

This pushes the page further from, not closer to, non-negotiable #6's 2,500 ms hero-arrival budget — already
a known, accepted miss at 4,611 ms; now a miss by 2,877 ms rather than 2,111 ms.

## 4 · What the widget really costs, and why §1–2 don't see it

**Full working: `widget-network-cost.md` in this folder.** The short version: Elfsight's CDN does not send
`Timing-Allow-Origin`, so the Resource Timing API — which both committed rigs read — reports the widget's
own requests as contributing **0 bytes**, regardless of what actually crossed the wire. A supplementary
probe using the Chrome DevTools Protocol directly (`Network.loadingFinished`'s `encodedDataLength`, not
subject to that same-origin restriction) found:

```
TOTAL widget-related bytes: 588 KB over 9 requests
  533 KB  tripadvisorReviews.js  (the widget's own bundle)
   15 KB  platform.js
    5 KB  boot request
   29 KB  review data (JSON)
    6 KB  everything else (language file, icon, sources)
```

**All 9 requests land before any scroll** — `data-elfsight-app-lazy` does not defer the fetch by viewport
position; it fires on `load` regardless of where the mount sits in the document (confirmed: both extra files
appear in `measure_js_budget.mjs`'s "untouched" sample, not the "after scroll" one, at both widths). The
widget is the very last thing on the page and every visitor pays for it anyway.

Added to §2's own figures, the **true** initial cost a visitor's device pays is:

| | rig's own figure | + widget (measured, not rig-visible) |
|---|---|---|
| 390px | 670 KB | **≈ 1,258 KB** — still under 1.5 MB |
| 1440px | 966 KB | **≈ 1,554 KB** — over the 1.5 MB ceiling |

This is flagged, not fixed here — see the task report's concerns.

## 5 · Does it auto-scroll?

**Yes.** Two screenshots of the widget's own bounding box, five seconds apart, twice, with no interaction
(deliberately not hovering — the client's own request was that a hover pauses the motion, which would mask
this): **~12% of pixels changed each time.** Full method and readout in `widget-network-cost.md` §"Does it
auto-scroll?". Non-negotiable #5 is live again; report the fact, per the design spec §2.3 #3 — his call,
not this task's.

## 6 · Density

`node scripts/measure_density.mjs --port 3100 --out density-home.json`:

| chapter | mean empty | worst empty | passes 45%? |
|---|---|---|---|
| arrival | 0.4% | 0.4% | yes |
| lodges | 35% | 35% | yes |
| why-you-came | 34.2% | 34.2% | yes |
| rooted | 34.6% | 39.4% | yes |
| philosophy | 37.3% | 42.3% | yes |
| field-days | 42.4% | 42.4% | yes |
| **invitation** (this chapter) | **14.7%** | **14.7%** | yes, with the most margin on the page |

Page: 52 screens sampled, mean 33.8% empty (33.6% before this task per CLAUDE.md — within noise of a
150px-grid re-sample), worst single screen 66.4% at y=5700 (a `philosophy`/`field-days` **join**, not a
chapter, per this project's own convention — see non-negotiable #8's note on joins). **All 7 chapters pass
`passesWorst`.** The `invitation` chapter itself, which now carries the widget, is the densest screen on the
page — the widget's own bulk (three dark cards plus a badge) fills what used to be the emptiest-scoring
part of this section.

## 7 · Contrast over the photograph

`node scripts/check_contrast_over_photos.mjs --port 3100 --out contrast-home.json` — **156 checks, 0
failures**, at 360/390/768/1024/1440/1920px. `invitation · heading` (floor 3, worst 5.19–5.57 across widths)
and `invitation · body` (floor 4.5, worst 5.70–5.78) are unaffected — the hook that narrows
`check_contrast_over_photos.mjs`'s selector to `#invitation p` (added when the carousel first landed, see
the comment at that `data-contrast` attribute in `Invitation.tsx`) means the widget's own markup was never
in scope for this measurement, exactly as intended: it is a third-party mount and its own internal contrast
is the vendor's to own, not this rig's to check.

## 8 · Screenshots — read them, don't just trust the numbers

`node scripts/capture_chapters.mjs --port 3100 --out shots/` — all 7 chapters at 390/768/1440/1920.
**Two things only a screenshot caught:**

1. **The widget renders dark, not the white cards the design spec anticipated.** Three (desktop) or one
   (phone) near-black cards, a green Tripadvisor roundel and green checkmarks, green filled rating circles,
   white type. Because this chapter's own background is the page's darkest full-bleed photograph under a
   0.6 scrim — not cream — the dark cards actually sit tonally closer to their surroundings than white
   cards would have. It reads as a different *kind* of dark (flat black rectangles against a photograph)
   rather than as white-on-cream, and it is JavaScript-drawn silently in the client's own Elfsight theme —
   nothing in this codebase chose that colour.
2. **An "Free Tripadvisor Reviews Widget" badge is stamped under the cards, at every width checked** (seen
   at 768px and 1920px; presumably present at the others too, only cropped out of this rig's frame). This
   is Elfsight's own promotional watermark, which ships on their free tier. It is a small grey pill with
   their own icon — legible, and squarely the kind of third-party branding non-negotiable #2 ("seduce, not
   convert") and #4 ("restraint is a requirement") exist to keep off this page. **This is not something the
   code can remove**; it is a property of the plan the client is on with Elfsight, and it is exactly the
   kind of thing to put in front of him rather than judge alone, per Step 10's own instruction.

Frames: `shots/w390-06-invitation.webp`, `shots/w768-06-invitation.webp`, `shots/w1440-06-invitation.webp`,
`shots/w1920-06-invitation.webp`.

## 9 · Tests, lint, build

`npm test`: **484 passed** (was 499 immediately before this task — see the task report for the exact
15-test accounting). `npm run lint`: 0 errors (5 pre-existing, unrelated warnings). `npm run build`: green,
TypeScript passes.
