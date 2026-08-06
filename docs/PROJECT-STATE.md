# Project state — 5 August 2026

Written as a handoff so no context is lost when a session is compacted. **Read this second**, after
`CLAUDE.md`.

## Where we are

**Branch `feat/chapters-rebuild`.** **Plans 3 and 4 are complete. Plan 5 is seven tasks of ten done** — the
sliding rule, the leaf cursor and both films are on the page and verified.

| Plan | State |
|---|---|
| 3 · [The chapters rebuild](superpowers/plans/2026-08-03-rebuild-chapters-layout.md) | ✅ eight tasks. Day-arc retired, copy harvested, library 14 → 34, twelve chapters, motion primitives, copy, the page, and the verification pass |
| 4 · [The scroll craft](superpowers/plans/2026-08-05-scroll-craft.md) | ✅ seven tasks, five fix rounds. Fixed header, CSS entrances, pinned collage, emblem turn, GSAP out of the critical path |
| 5 · [The signature interactions](superpowers/plans/2026-08-05-signature-interactions.md) | 🟡 **tasks 1–7 done, 8–10 outstanding** |

### Where Plan 5 actually got to

The plan was written for a leaf cursor and a *hand-drawn* ink tiger. The tiger half of it was overtaken by
events — read [`DECISIONS.md`](DECISIONS.md) §8 and §9 before touching any of it.

| Task | State |
|---|---|
| 1 · The sliding rule | ✅ `currentColor` hairline under every link, on hover **and** focus. Coverage is a markup contract: every link carries `rule-in` or `data-rule="none"`. Rig: `scripts/check_rule_in.mjs` |
| 2 · The leaf | ✅ The client's own hand-drawn PNG. Two earlier attempts (extracted from their logo, then drawn by me) are kept as evidence |
| 3 · The leaf cursor | ✅ Follows, swings, warms to gold, stops its own loop. Removability enforced by test |
| 4 · Cursor rig | ✅ `scripts/check_leaf_cursor.mjs`, seven checks, three watched failing first |
| 5 · The ink tiger | ✅ built from the client's licensed vector — **then replaced by film.** Dormant, intact, one line from returning |
| 6 · It inks itself in | ✅ built, now dormant with the component |
| 7 · It lives, dozes, stirs | ✅ built, now dormant with the component |
| — · The two films | ✅ **not in the plan.** Tiger closes `field-days`, potter closes `rooted`. `SignatureFilm` serves both |
| 8 · The butterfly | ⬜ not started |
| 9 · The tiger rig | ⬜ **needs rewriting for video.** The SVG-inking version in the plan is obsolete |
| 10 · Verification + docs | ⬜ this document is part of it |

**Done 7 Aug:** the potter is up against the copy. The client's note — "it still feels pretty disconnected
from the section" — turned out to be about the *drift*, not the margin: the pinned photographs are still
displaced when the scene releases, so a figure laid out 16px below the composition was read 148px below the
nearest photograph and 268px below the prose. `PinnedCollage`'s footer now pulls up by `50vh - C/2 - 56px`,
holding the gap at **56px from 1440×860 to 2560×1440**, and `check_pinned_collage.mjs` asserts it. Full
working in [`DECISIONS.md`](DECISIONS.md) §10.

**Immediate next job:** Plan 5 task 8, the butterfly — unless the client would rather spend the time on the
103 KB of film posters sitting in the initial load (§5, and CLAUDE.md non-negotiable #6). That is the larger
win and it was raised with them the same day.

**Plan 5 starts from a clean base.** 222 tests, `tsc`/`build`/`lint` clean, ten asserting rigs in `scripts/`,
nothing parked and nothing owed from Plan 4 beyond the deferred minors in
[`DECISIONS.md`](DECISIONS.md) §6. The client tested the build on 5 Aug and it works.

**The current density figures**, measured 7 Aug with both films in place and the potter moved — every
chapter inside non-negotiable #8's 45% ceiling:

| | mean empty | worst screen | note |
|---|---|---|---|
| `rooted` | **39.7%** | 44.5% | potter 56px below the last paragraph; was 41.8% / **55.9%** before the move |
| `field-days` | **44%** | 58% | tiger film at 300px |
| page | **40.4%** | 73.1% | document 15,958px, 1.97 photographs per screen, 51.7% imagery |

The page's emptiest screen is the `field-days / rooms` join at 73.1%. `rooted / forest` was 76.9% and is now
**68.8%**, which the potter's move bought.

**Two things Plan 5 inherits and must respect:**

- **Non-negotiable #5** — the tiger *arrives, performs, then dozes*. It is not a permanent fixture;
  permanent peripheral motion contradicts "seduce, not convert" and "restraint is a requirement".
- **The critical path is clean and must stay clean.** Plan 4 took first-load JS from 750.6 to 642.7 KB by
  moving GSAP behind a dynamic import, and `npm run verify:budget` **fails on the bytes** if that stops
  being true. A cursor that follows the pointer and a tiger that walks are both scrub-shaped work — they
  belong behind the same deferred import, not in the first load.

**219 tests.** `/` is twelve chapters and 34 photographs over ~17 screens at 1440×900.

## Where the durable record lives

**[`docs/DECISIONS.md`](DECISIONS.md)** holds every client ruling with its reasoning, the fourteen-instance
catalogue of this project's recurring defect, why the hero's budget is unreachable, and the things that look
broken and are not. It exists because the per-task ledgers at `.superpowers/sdd/*/progress.md` are
**git-ignored** — 335 lines across four plans that would not survive a fresh clone. Anything learned that
outlives a task belongs there, not only in a ledger.

## Two decisions sitting with the client

Neither blocks Plan 5. Both were measured rather than argued, and both are recorded here because they exist
nowhere else a future session will look.

**1. The hero photograph misses its 2,500 ms budget and no available lever closes the gap.** It lands at
**3,419 ms** on Slow 4G. Task 6 measured every lever by rebuilding and A/B-ing rather than reasoning:

| Lever | Worth |
|---|---|
| Deferring GSAP (**spent by Plan 4**) | 213 ms on the hero, **0 ms on LCP** |
| Subsetting the fonts (unspent) | ~215 ms |
| Dropping the fonts' `rel=preload` (uncosted until now) | 172 ms |

**Each lever is worth about 200 ms and the gap is about 1,400 ms.** The hero is 192 KB queued behind roughly
460 KB on a 200 KB/s link — it is bandwidth-bound. Closing it needs **a smaller hero or a smaller first
screen**, which is a design decision, not an optimisation. Note the client chose the sharp hero deliberately
on 5 Aug, knowing it cost time, because at the smaller tier it shipped visibly blurred.

**2. The pinned collage half-delivers, and the lever is photographs, not motion.** The client asked for the
reference's "memory album drifting by". What ships is a headline held still — 0px over 840px of scroll —
while three photographs drift 126/89/50px. The review's judgement: *"Nothing enters and nothing leaves. The
album never turns a page."* It is structural: three photographs cannot produce that effect at any rate inside
`PARALLAX_MAX`. The client already shortened the pin once to stop it costing image density. **If it is ever
asked to do more, the lever is more photographs in `rooted`** — and the library has exactly one image spare.

## Do not read Chrome's LCP as the hero's arrival

Confirmed across **35 runs** in Task 6: LCP resolved to **text every single time** — a paragraph on mobile,
the `<h1>` on desktop — and never once to a photograph. Mobile LCP reads 1,488 ms while the hero itself
lands at 3,419 ms. `scripts/measure_page.mjs` reports the hero's own `responseEnd`; that is the number that
means anything here. **Medians of five** — an unchanged build has produced LCP anywhere from 2,462 to
4,140 ms.

Unexamined anomaly worth a look one day: the **desktop** hero (4,107 ms) is *slower* than the mobile one.

## What Plan 4 built, and what it cost

| | Before | After |
|---|---|---|
| First-load JS | 750.6 KB raw / 232.2 gz | **642.7 / 190.7** (−14.4% / −17.9%) |
| Initial transfer 390 / 1440 | 613 / 730 KB | **574 / 698 KB** |
| Page mean empty · images per screen | 39.0% · 2.08 | 39.3% · 1.98 |

GSAP is no longer in the critical path — it loads in two chunks only once the visitor scrolls, and
`npm run verify:budget` fails on the **bytes** if that ever stops being true. Simple entrances are CSS and
one `IntersectionObserver`; GSAP is kept for scrub-linked work, which is what the reference uses it for too.

**Demo above 1500px.** The pin needs ≥1440 of *layout* viewport, so a Windows laptop at 1440 with a classic
scrollbar will not fire the signature effect at all.

## The measurement rigs, and why they can be trusted

Ten rigs in `scripts/`, every one of them asserting. They earned that in Plan 4: the parallax check was found
to be **blind to 11 of 12 elements** — its two fixed sample offsets fell inside exactly one element's range —
and the proof of the repair was to run the *old* rig against a build with two deliberately-killed parallaxes
and watch it report "1/12 moved, PASS".

**Fourteen defects on this project have been one shape: a check that confirmed a mechanism was configured
rather than that behaviour changed.** Four of them surfaced inside Plan 4, including three that an
implementer found in its own instruments before reporting. When adding a guard here, run it against the
broken state first — that is the house standard, not a nicety.

## The two builds that came before

Both are on branches and in git history; neither is live.

- **Plan 1** (`main`) — the seven-state scroll-through-a-day colour system. Client approved it at a preview
  gate.
- **Plan 2** (`feat/page-structure`) — nine content bands built on that system. **Client rejected it**: too
  few images, no perceptible scroll animation, too much empty space, no resemblance to the reference.

The day-arc was the root cause: band heights had to be derived from each band's share of the colour timeline
rather than from how much content it held, so heavy sections reserved three screens for a paragraph. Retired
3 Aug. Do not revive it.

## Client feedback that drives everything now (3 Aug, verbatim in substance)

1. Too few images · no scroll animation · too much empty space · no resemblance to Sujan.
2. **Take heavy inspiration from the Sujan homepage** — layout, scroll behaviour, image and text placement.
3. **Present the experience as a journey in chapters**, as the v3 fieldguide guidelines do.
4. **Use the existing mahuaresorts.com text and images** — both were under-used.
5. **Creative freedom over the guidelines.** Keep what is good, rework what is not, invent where neither the
   guidelines nor the reference serve us. Explicitly *not* line-by-line compliance.

See [`docs/reference-sujan-layout.md`](reference-sujan-layout.md) for the layout analysis this produced.

## Findings the client needs, independent of the build

**The guest quotes on the page are real Tripadvisor reviews**, pulled verbatim from the Trustindex widget
in the crawled HTML and attributed by name and year. Client confirmed 4 Aug that these hard-coded quotes
are the **interim**: the site will be wired to Tripadvisor directly for live reviews (Plan 5), which also
supplies the aggregate rating and review count currently missing. A test fails if any quote appears without
a name, source and year, so an invented testimonial cannot slip in.

**Ten hard numbers now sit in the copy and only two are confirmed** (5 km to both gates). The full table,
with the two numbers deliberately left out rather than published wrong, is in
[`docs/copy-provenance.md`](copy-provenance.md). The sharpest open question: the live site's room list for
Mahua Tola totals **twelve**, while the brand record says fourteen.

**The live site's distances are all wrong and contradict each other.** Five published claims across two
lodges; not one is correct:

| Gate | Homepage | About Us | Elsewhere | Truth |
|---|---|---|---|---|
| Turia (Mahua Vann) | 3 km | 4 km | — | **5 km** (client-confirmed 3 and 4 Aug) |
| Kolara (Mahua Tola) | 6 km | 10 km | 12 km (review widget) | **5 km** (client-confirmed 4 Aug) |

Five published distances across two lodges, and **not one of them is right**. Both are 5 km.

**Mahua Bagh is still being sold** on About Us and its own page as a "signature eco lodge", though the brand
record retired it. Every mention in `reference/site-copy.md` is marked `[RETIRED PROPERTY — do not reuse]`.

**Best raw material found:** *"Explore 'Pachdhar', a village adjoining Pench National Park, where over 100
'Kumhars' families have upheld the art of pottery."* Named place, real number, living craft — and it explains
the potter's-hands photograph in the library. Strong candidate for its own chapter.

**Two images excluded on consent grounds**, not quality: `bush-breakfast` (a guest's face, lit and in focus)
and `stargazing-telescope` (a figure's features discernible; guest or staff unclear). Four other
people-containing images were kept after inspection — `guide-sunrise`, `sound-healing`, `tiger-crossing-track`,
`potters-hands`. **The client can reinstate any of these if releases exist.**

## Assets

- **`Mahua-property-logos/`** — client-supplied vector logos, added 3 Aug. `Mahua-Resorts.svg` is genuine
  artwork: **340 paths, 0 embedded rasters, 439 groups, viewBox 0 0 500 500**. Per-property marks for Vann
  and Tola, plus EPS/PDF/PNG and a 3D render. **This removes the need to reconstruct the emblem** for the
  planned counter-rotation animation (petals clockwise, leaves anticlockwise) — real petal and leaf groups
  already exist.
- **`public/media/`** — 34 curated images at **four widths each** (400 / 640 / 960 / 1440, plus the source's
  own width where it falls between them), 127 AVIF derivatives, ~20 MB on disk, largest 199.7 KB. **17 are
  `fullBleedSafe`** (≥1400px), up from 2 across the whole previous build. Categories: `lanternHour` 9,
  `forest` 7, `lodgeLife` 13, `details` 5. Disk went up so that transfer could come down: a phone now
  downloads 799 KB for the whole page instead of 3,386 KB. **Distinctness is guarded by perceptual hash** —
  see
  [`docs/reviews/2026-08-04-image-audit/`](reviews/2026-08-04-image-audit/), where four pairs turned out to
  be the same photograph under two ids.
- **`reference/video-stills/`** — three frames harvested from the client's Mahua Tola property video: the
  candlelit petal table, the bonfire, the hammocks. All 1920px, wider than anything from the live site.
- **`reference/video/`** — the client's 1080p property video (25 MB, **git-ignored**). Not usable as video:
  44 shots in 54 seconds, and it shows BeyondStay branding in close-up.
- **`reference/site-copy.md`** — 3,036 words of the live site's copy, by page.

## Open with the client

1. ~~**Does CLAUDE.md #6's 1.5 MB mean the initial load or the whole scroll?**~~ **Ruled 4 Aug: the initial
   load.** A phone pays 399 KB initially (799 KB for the whole scroll) and a 1440px desktop 763 KB
   (1,966 KB scrolled), so both pass. Desktop whole-scroll stays above 1.5 MB and is accepted — the client
   traded that number for the image density that answered their rejection. Written into CLAUDE.md #6.
2. **Is the closing photograph too dark?** It carries the heaviest scrim on the page (`flat .54`), and the
   trade is real: the lighter, radial-led version measured 4.20:1 on body text at 768px against a 4.5 floor.
3. **Should the two `chapterIntro` chapters have a CTA?** Ruled *no* on 4 Aug — the header, the lodge cards
   and the closing invitation already invite, and a fourth would make the page a booking funnel. Reopen only
   if the client asks.

## Still owed to the client

- **The targeted shot list** — the 3–4 photographs that would most transform the page, so a small shoot can
  be priced precisely. The library tops out at 1920px and only 17 of 34 images clear 1400px. **More urgent
  than it was**: the audit of 4 Aug cut four duplicates out of what was thought to be a 35-image library,
  and three of the replacements are frame-grabs from a property video. The client confirmed a fresh photo
  and video shoot is planned but **not soon**, and that newer assets can replace these later.
- **Plan 4:** the signature interactions — spinning mahua emblem, leaf cursor, ink tiger.
- **Plan 5:** performance hardening, the SEO redirect map (spec §10), Sanity CMS wiring.

## Process notes worth keeping

The implementer/reviewer split has caught something real in **every task**, and the defects have almost
always been in the *plan* rather than the implementation. Examples worth remembering:

- A colour timeline that could never interpolate — every transition squeezed to zero width.
- A warmth test written as `red >= blue`, which pure black (`0 >= 0`) passes trivially.
- A contrast guard that only tested seven static states while the background moved between them.
- An image budget that was a `console.warn` nothing checked — which is how a 636 KB file shipped.

**One fix round on Task 3 was done by the controller solo** (during the usage-limit window) and never got
independent review. Flagged in the ledger; the whole-branch review should look at commit `04a82c2`
specifically.

The SDD ledger at `.superpowers/sdd/2026-08-03-rebuild-chapters-layout/progress.md` (git-ignored) holds the
full per-task record.
