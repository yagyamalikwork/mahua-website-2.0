# Project state — 9 August 2026

Written as a handoff so no context is lost when a session is compacted. **Read this second**, after
`CLAUDE.md`.

## Where we are

**Branch `feat/chapters-rebuild`.** **Plans 3, 4, 5, 6 and 7 are all complete.** The home page opens with a
welcome carrying the client's logo, runs twelve chapters, and carries five signature interactions — the
sliding rule, the leaf cursor, two films and a hanging lantern. **Both property pages are live**,
`/mahua-vann` and `/mahua-tola`, and were **rebuilt again in Plan 7** into a "shape vocabulary" — eight
chapters each, no two adjacent chapters sharing a shape (mechanically enforced), a persistent booking bar,
the client's own park maps drawn in cream, rooms as a showcase rather than a spec table, six experiences
per property with an honest "also" line for what did not make the six, and contact details in place of the
enquiry form the client dropped. This superseded Plan 6's `ChapterIntro`/`PlateGrid`/`RoomsIndex`/
`FieldNotes` structure, which the client had approved but which still read as a template. The home page's
lodge cards link to both pages internally. Every page verified in a browser by rigs that have been watched
failing first.

**Done 10 Aug, after Plan 7 closed.** The final whole-branch review (run on the most capable model) returned
one Critical and two Important findings that fifteen task reviews had all passed, and all were fixed
(`6dad619`, `cb65fef`, `765a464`):

- **The map was illegible on a phone** — 4.3px labels at 390px, Tola's thirty overprinting. The redesign's
  signature element, decoration on the traffic that matters most. Fixed by growing the type *and* thinning
  the label set below `lg` with a collision-reach calculation (Tola drops 30 labels to 12). `DECISIONS.md`
  §2 #29 records why every rig missed it.
- **The two pages still shared sentences** — the invitation line was byte-identical bar the gate name, and
  it is the last line a visitor reads on either page. The anti-template guard covered the opening headline
  only. Both lines rewritten, guard widened and watched failing. §2 #30.
- **The legend marks could not be told apart** — `gate` and `road` were the same swatch, `zone` had none.

**Also 10 Aug: a guest's face withdrawn on consent grounds** from Mahua Tola's Bonfire entry, replaced with
a frame from the client's own Tola property video that carries no people, and the withdrawn photograph
deleted from the pipeline rather than shelved (`DECISIONS.md` §1, 10 Aug).

**Nothing is half-built.** One task is parked at the client's request (the butterfly, §13 of
[`DECISIONS.md`](DECISIONS.md)). The client-decisions list gained the property pages' first four items from
Plan 6 (see `docs/reviews/2026-08-08-property-pages/README.md`) and Plan 7 added its own three — the
persistent bar, six experiences with an also-line, contact details instead of a form (`docs/DECISIONS.md`
§1, 9 Aug).

**Plan 6 carries a warning worth keeping**, even though its structure is superseded. Its execution session
silently fell back from the intended model after a mid-session interruption, shipped `/mahua-vann` with
failing density evidence committed as "verified", and was caught by the client the same night. The 9 Aug
review-and-correction pass that followed is written up in the evidence README; DECISIONS.md §2 gained
instances 26 and 27 from it. **When resuming an interrupted session, check the model first.**

| Plan | State |
|---|---|
| 3 · [The chapters rebuild](superpowers/plans/2026-08-03-rebuild-chapters-layout.md) | ✅ eight tasks. Day-arc retired, copy harvested, library 14 → 34, twelve chapters, motion primitives, copy, the page, and the verification pass |
| 4 · [The scroll craft](superpowers/plans/2026-08-05-scroll-craft.md) | ✅ seven tasks, five fix rounds. Fixed header, CSS entrances, pinned collage, emblem turn, GSAP out of the critical path |
| 5 · [The signature interactions](superpowers/plans/2026-08-05-signature-interactions.md) | ✅ **nine of ten tasks; the butterfly parked by the client.** Plus three things the plan never contained: the two films, the lantern and the welcome |
| 6 · [The property pages](superpowers/plans/2026-08-08-property-pages.md) | ✅ (superseded by Plan 7) twelve tasks, then a full review-and-correction round (9 Aug). Library 34 → 53 photographs; the contrast rig made route-aware; GSAP's loader gated on the first scrolled pixel |
| 7 · [The property pages redesign](superpowers/plans/2026-08-09-property-pages-redesign.md) | ✅ fifteen tasks. New shape vocabulary (`fullBleed`/`column`/`map`/`showcase`/`pair`/`press`/`invitation`) replaces Plan 6's structure; the client's Pench and Tadoba maps traced into cream field-guide artwork (`scripts/build_map.mjs`); Task 15 closed it out with both routes' rigs green and the home page proven untouched — `docs/reviews/2026-08-09-property-redesign/README.md` |

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
| — · The hanging lantern | ✅ **not in the plan.** Client request 7 Aug. Hangs out of `after-dark` into `06 · The Lantern Hour`, swings when pushed, comes to rest on its own |
| — · The welcome screen | ✅ **not in the plan.** Client request 8 Aug. Their own logo, flower turning, gone in 2.1s, **no JavaScript at all** |
| 8 · The butterfly | ⏸ **parked by the client, 8 Aug.** Their overlay films cannot be used — chroma green, butterflies 1.9% of frame width. Restart notes and a re-render brief in [`DECISIONS.md`](DECISIONS.md) §13 |
| 9 · The tiger rig | ✅ **rewritten for film**, 8 Aug. `scripts/check_films.mjs` — the plan's SVG-inking version was obsolete and was not built |
| 10 · Verification + docs | ✅ done 8 Aug. Eleven rigs green, 20 evidence frames, [`reviews/2026-08-05-signature/README.md`](reviews/2026-08-05-signature/README.md) |

**Done 7 Aug:** the potter is up against the copy. The client's note — "it still feels pretty disconnected
from the section" — turned out to be about the *drift*, not the margin: the pinned photographs are still
displaced when the scene releases, so a figure laid out 16px below the composition was read 148px below the
nearest photograph and 268px below the prose. `PinnedCollage`'s footer now pulls up by `50vh - C/2 - 56px`,
holding the gap at **56px from 1440×860 to 2560×1440**, and `check_pinned_collage.mjs` asserts it. Full
working in [`DECISIONS.md`](DECISIONS.md) §10.

**Also done 7 Aug:** the client's watercolour lantern hangs out of `after-dark` into `06 · The Lantern Hour`
and swings when pushed — a damped pendulum that comes to rest on its own and stops its frame loop with it.
Measured: peak 8.9–13.1°, six or seven crossings of vertical, settles at 0.00°, and the page's frame rate
returns to its idle 130/s. It hangs at 200px from 1440 up, 128px from 1280, 168px below `lg` where it falls
over the bonfire, and **is hidden between 1024 and 1279px** where the composition leaves it no room. Full
working, including the two instruments that were wrong before the page was, in
[`DECISIONS.md`](DECISIONS.md) §11.

**Also done 7 Aug: the two films' stills came out of the initial load, and it bought the hero 537 ms** —
4,512 → 3,975 ms, medians of five on one build with only that change differing, both ranges inside 60 ms.
That is more than every other lever ever measured on this page put together, and it was pure waste rather
than a trade: a `<video poster>` is fetched immediately however far down the page it sits. Initial load
684 → **581 KB** at 390px and 808 → **705 KB** at 1440px. The still is now an `<img loading="lazy">` layered
under the film; see [`DECISIONS.md`](DECISIONS.md) §3 and the notes in
`components/signature/SignatureFilm.tsx`, three of which are load-bearing.

**Done 8 Aug: Plan 5 task 9, rewritten for film.** `scripts/check_films.mjs` covers what the plan's
SVG-inking version never could — both films play once, hold their last frame at 10.00s, replay on a
deliberate hover, ignore a hover mid-play, stay put under a parked pointer, re-arm when it leaves and
returns, and show no white rectangle (sampled as pixels, 1 level off the chapter's cream). Reduced motion
and no-JS keep the still and never play. Failed against three deliberate breaks before it was trusted; see
[`DECISIONS.md`](DECISIONS.md) §12, including the one assertion that is weaker than it looks.

**Checked 8 Aug: the two butterfly overlay films cannot be used.** Chroma green rather than white, so no
blend mode can erase the ground; and the butterflies are 1.9% of frame width — 5.8px if the film were drawn
at the tiger's size, with 99.89% of 1.8 MB being background. Measurements and the two routes that would
work are in [`DECISIONS.md`](DECISIONS.md) §13. **Task 8 is now blocked on a client decision**, and the
prior question is whether a fourth figure is wanted beside the tiger, the potter and the lantern at all.

**Done 8 Aug: a welcome screen, carrying the client's own logo.** Their rulings: **the real stacked logo**
(not the header's lockup), **a half turn**, **every page load**, and ~2.1s — chosen from three measured
options after they asked for "a few more milliseconds". It carries **no JavaScript at all**, and its base
style is *hidden* so a failed animation means no welcome rather than a wall. `scripts/build_welcome_logo.mjs`
splits the client's PNG into a flower and a wordmark by scanning its own bands of ink, so the flower can
turn inside a logo that is otherwise theirs to the pixel. `scripts/check_welcome.mjs` checks four routes
including scripting-off.

**It is not free, and that is the one open question on it.** The two logo files sit on the first screen, so
they are charged against the hero — see [`DECISIONS.md`](DECISIONS.md) §14 for what that costs and what was
tried. Three instrument defects it exposed along the way are recorded there too.

## Where Plan 7 actually got to

**The redesign, and why it exists.** Plan 6 shipped and the client approved it, then asked for a second
pass 9 Aug: the pages still read like a template, the client's own park maps were unused, and an enquiry
form was a defect waiting to happen (a bare `mailto:` on a phone with no mail client leaves the visitor
believing they wrote to someone). Plan 7 is that second pass, not a bug-fix round on Plan 6.

**The new component inventory** (`components/sections/`, `components/property/`) — each rendered by
`PropertyPage.tsx`'s shape dispatcher, which switches on `PropertyChapter.shape` with an exhaustive
never-check, so a shape with no renderer is a compile error:

| Component | Shape | Carries |
|---|---|---|
| `Hero` (shared with the home page) | `fullBleed` (chapter 0 only) | The opening photograph and headline. Explicitly opts out of `Parallax` — it is the LCP element |
| `FullBleedQuote` (shared with the home page) | `fullBleed` (non-hero, with `quoteCopy`) | A photograph with one line of type on it |
| `OpeningColumn` | `column` | The page's one held breath — heading and two paragraphs, no photograph by design |
| `PropertyMap` | `map` | The client's own park artwork (`lib/vann-map-art.ts` / `lib/tola-map-art.ts`, built by `scripts/build_map.mjs`), gates/water/villages/safari zones, the getting-there facts |
| `RoomShowcase` | `showcase` | Rooms at three photograph scales (`offsetLeft`/`wide`/`offsetRight`) so the rooms read as a composition, not a ledger |
| `ExperiencePair` | `pair` | Six experiences at two weights (`hero`/`quiet`) plus an optional `alsoLine` naming what did not make the six |
| `PressBand` | `press` | Vann only — three real press citations, set as type, deliberately not as three foreign publications' logos |
| `PropertyInvitation` | `invitation` | The closing ask: heading, the booking pill, `ContactBlock`, and a full-width photograph of the *other* lodge |
| `PropertyBar` | (fixed chrome, not a chapter) | The persistent booking bar — slides in past the hero, steps aside over the closing invitation, renders nothing without JavaScript |
| `ContactLine` / `ContactBlock` (`PropertyContact.tsx`) | — | The phone/email/address that replaced the enquiry form. `ContactLine` (the bar's own line) is hidden below 640px, present from 640px up |

`RoomsIndex` and `FieldNotes` (Plan 6) are retired — nothing imports them and `tsc --noEmit` proves it.

**Task 15 closed the branch out** (9/10 Aug): every rig green at both real routes, the home page proven
untouched by the same three rigs that guard it, `vann-table`/`tola-table` measured for the first time
(both clear their contrast floor on `FullBleedQuote`'s untouched default scrim), and eight screenshots
opened and read rather than only captured. Three of eight chapters across both pages could not be brought
inside the 45% density ceiling despite genuine, measured attempts (`vann-forest` 55.8%, `vann-press` 87.2%,
`tola-reserve` 58.3%) — reported rather than forced; see `docs/reviews/2026-08-09-property-redesign/README.md`
for the full working and what was tried and reverted. **371 tests, all green.**

## What a Plan 6 inherits

**A finished home page and a clean base.** 280 tests, `tsc` / `build` / `lint` / `verify:budget` all clean,
and **fourteen asserting rigs** in `scripts/`, every one of which exits non-zero on failure and has been
watched failing against a deliberately broken build. Nothing is half-built and nothing is owed from Plans 3
or 4 beyond the deferred minors in [`DECISIONS.md`](DECISIONS.md) §6.

**Two things are the client's to settle, and neither blocks anything:**

1. **The hero photograph lands at 4,308 ms against a 2,500 ms budget.** Every engineering lever has been
   measured and each remaining one is worth ~200 ms; the gap is ~1,808 ms. It needs a **smaller hero
   photograph or a lighter first screen**, which is a design decision. §3.
2. **Eleven hard numbers in the copy are unconfirmed** — room counts, acreage, drive times. The sharpest:
   the live site lists twelve rooms for Mahua Tola while the brand record says fourteen.
   [`copy-provenance.md`](copy-provenance.md).

**And one is parked:** the butterfly, §13, with a re-render brief ready for an illustrator.

**The most obvious next piece of work on the page itself** is the `field-days / rooms` join, the emptiest
screen on the page at 73.4%. It is the join the tiger closes, and it has never had the treatment `rooted`'s
join got on 7 Aug. Look there before looking at any chapter — §10.

Out of scope until asked: other pages, the booking restyle, Tripadvisor wiring, the SEO redirect map, Sanity.

**The current density figures**, measured 7 Aug with both films in place and the potter moved — every
chapter inside non-negotiable #8's 45% ceiling:

| | mean empty | worst screen | note |
|---|---|---|---|
| `rooted` | **39.7%** | 44.5% | potter 56px below the last paragraph; was 41.8% / **55.9%** before the move |
| `field-days` | **44%** | 58% | tiger film at 300px |
| `lantern-hour` | **36.4%** | 41% | lantern hung at 200px; was 37.9% / 41.7% |
| page | **40.1%** | 73.4% | 2.03 photographs per screen, 51.9% imagery |

Re-measured 8 Aug on the final build. **All twelve chapters are inside the 45% ceiling.** Plan 5 left the
page ~0.6 points emptier on the mean than it found it — a figure standing in a chapter adds height as well
as imagery — and `field-days` is the one that moved the wrong way, 41.6% → 43.9%, which is what the tiger
costs it.

`measure_density.mjs` could not see the lantern at all until it was fixed on 7 Aug — `elementsFromPoint`
skips `pointer-events: none`. Any future ornament that hangs over copy has the same problem; the rig now
handles it, but the lesson is that an image can be on the page and absent from the measurement.

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

**[`docs/DECISIONS.md`](DECISIONS.md)** holds every client ruling with its reasoning, the twenty-eight-instance
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

**From Plan 7 (9/10 Aug), still owed:**

- **Tola's room count** — twelve on the live site's own structured list, fourteen in the brand record (three
  river-facing machaan rooms under construction, no published facts yet). `content/mahua-tola.ts` states
  twelve and flags it; not this task's call.
- **Nagpur's distance from both lodges** — Vann: 80 km live vs 104–112 km brand record; Tola: 100 km live,
  uncorroborated. Both pages name Nagpur as the gateway city and state no figure.
- **Tola's map: the gate/zone marker distinction is confirmed too subtle by eye**, and there is no legend
  entry at all for what a safari-zone square means. Screenshotted and reported, not fixed —
  `docs/reviews/2026-08-09-property-redesign/README.md` §5.
- **Three chapters remain over the 45% density ceiling** — `vann-forest` (55.8%), `vann-press` (87.2%),
  `tola-reserve` (58.3%) — after real, measured improvement. The remaining levers would either widen a
  deliberately quiet screen past what non-negotiable #4 protects or enlarge press citations past "set
  quietly". Same README, §2.

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
