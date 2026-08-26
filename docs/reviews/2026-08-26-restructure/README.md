# The 26 August restructure — whole-branch verification (Task 9)

**Branch:** `feat/journal-and-mobile` (from `b9eecaa`, the commit before Task 1, to the commit this task
closes out with). **Not merged, not deployed.** Full narrative: `docs/DECISIONS.md` §22. This file is the
evidence half — every figure below names the command that produced it, per this project's own rule that
nothing in `docs/reviews/` may be quoted unless a script in `scripts/` can re-derive it.

Earlier files in this same directory (`density-home.json`, `contrast-home.json`, `widget-network-cost.md`,
`density-variance-NOTE.md`, and the several sweep/repeat files) are **Tasks 2–8b's own evidence**, produced
while building the eleven rulings out. This README is Task 9's: one production build (`npm run build && npx
next start -p 3100`), every rig re-run against it, on all three routes, plus a true before/after against the
branch point in an isolated `git worktree`. Files this task added carry a `-task9` suffix (or `BEFORE-task9`
/ `AFTER-task9`) to keep them distinguishable from the per-task evidence they sit beside.

---

## 1 · Tests, build, lint

`npm test`: **497 passed, 46 files** (confirmed by this task's own run). `npm run build`: green, TypeScript
passes. `npm run lint`: clean.

Path from the branch point, 491 → 497, not monotonic — every step is explained in
`.superpowers/sdd/2026-08-26-restructure-and-reviews/progress.md` and summarised in `docs/DECISIONS.md`
§22.9 and CLAUDE.md's Tests row:

| after | tests | what moved |
|---|---|---|
| `b9eecaa` (branch point) | 491 | — |
| Task 1 | 499 | `lib/elfsight.test.ts` (4) + `components/ui/ReviewWidget.test.tsx` (4) |
| Task 2 | 484 | `ReviewCarousel`/`lib/reviews.ts`'s own tests removed with the carousel; one `content/home.test.ts` case replaced |
| Task 2b | ~488 | `components/ui/ElfsightLoader.test.tsx` (4 new), `ReviewWidget.test.tsx`'s eager-script assertion inverted |
| Task 3 | 490 | `components/sections/ExperienceStrip.test.tsx` created (2) |
| Task 4 | 492 | one more `ExperienceStrip` case (renders copy from any page) |
| Task 5 | 498 | `content/mahua-vann.test.ts` + `content/mahua-tola.test.ts` spine assertions (6) |
| Task 6 | 499 | `PropertyMap`'s `continues` prop tested |
| Task 7 | **493** | `ExperiencePair.test.tsx` retired (−3) with the component it tested; `lib/sizes.test.ts` lost 5 parameterised rows for the same reason `SplitFeature`'s retirement dropped 13 on 18 Aug — net of new property-page strip coverage |
| Task 8 | 497 | Tola's `04 · Written About` chapter and its tests |
| Task 8b | 497 | unchanged — a shadow-DOM fix to `measure_density.mjs` only, no product code touched, as the task's own brief required |

---

## 2 · The widget — cost, the gate, auto-scroll, appearance

Full working: `widget-network-cost.md` (Task 2's own probe) and `docs/DECISIONS.md` §22.3. Headline figures,
re-derived by this task rather than only quoted:

**Unwrapped (Task 2, before gating), measured against a true stashed baseline on one machine:**

| | pre-widget | with widget, ungated |
|---|---|---|
| `measure_js_budget.mjs` first-load JS | 167.5 KB br | 167.5 KB br *(blind — see §7)* |
| `measure_page.mjs` initial, 390px | 670 KB | 670 KB *(blind)* |
| `measure_page.mjs` initial, 1440px | 966 KB | 966 KB *(blind)* |
| CDP probe, real bytes on load | — | **588 KB / 9 requests** (533 KB is `tripadvisorReviews.js` alone) |
| initial transfer, real (rig + CDP) | 670 / 966 KB | **≈1,258 / ≈1,554 KB** — 1440px over the 1.5 MB ceiling |
| hero `responseEnd`, medians of 5 | 4,616 ms | **5,377 ms** |

**Gated (`ElfsightLoader`, `IntersectionObserver`, 600px approach margin) — this task's own fresh
re-measurement:**

```
node scripts/measure_js_budget.mjs --port 3100 --width 1440   -> jsbudget-1440-task9.json
node scripts/measure_js_budget.mjs --port 3100 --width 390    -> jsbudget-390-task9.json
node scripts/measure_page.mjs --port 3100                     -> page-task9.json
node scripts/measure_lcp_arms.mjs --runs 5 --port 3100        -> lcp-arms-task9-isolated.json
npm run verify:budget -- --port 3131                          -> verify-budget-task9.json
```

| | figure |
|---|---|
| First-load JS (static) | **167.2 KB brotli**, 9 files — `verify:budget`'s own fresh build agrees exactly |
| LIVE, no scroll | 158 KB / 9 files (Elfsight absent) |
| LIVE, after scroll | 202 KB / 11 files — `platform.js` and its GSAP-adjacent lazy chunk only fetch once the visitor approaches |
| Initial transfer, 390px | **668 KB** (9 images, 388 KB) |
| Initial transfer, 1440px | **965 KB** (14 images, 684 KB) |
| Whole page scrolled, 390 / 1440 | 1,041 KB (17 images) / 1,378 KB (21 images) |
| Hero `responseEnd`, medians of 5 (contaminated run, other Playwright processes active) | 4,600 ms, range 4,585–4,612 |
| Hero `responseEnd`, medians of 5, **isolated** (nothing else hitting the server) | **4,603 ms, range 4,580–4,610 ms** |

Both runs agree within 10 ms of each other and within ~10 ms of CLAUDE.md's own long-standing baseline
(~4,611 ms) — the gate has bought the cost back, confirmed twice.

**Does it auto-scroll?** Yes — Task 2's own two-screenshot probe (five seconds apart, no interaction) found
~12% of the widget's own pixels changing each interval, twice in a row. Not re-measured by this task (the
behaviour is the vendor's, unrelated to anything Tasks 3-8b touched), but confirmed still present by eye in
this task's own screenshots (§5) and by the client's own ruling recorded in `docs/DECISIONS.md` §22.1 #10.

**Does it read as foreign on cream?** Yes, confirmed by this task's own fresh screenshots (§5): solid black
cards, white text, a green Tripadvisor roundel, directly on the site's cream — on both property pages'
`Written About` chapters. The client is restyling it himself; values in `docs/PROJECT-STATE.md`.

---

## 3 · Density — home page (do not quote a single figure here as settled)

`docs/reviews/2026-08-26-restructure/density-variance-NOTE.md` is the standing caveat: any chapter hosting
the Elfsight widget (`invitation` on the home page; `vann-press`, `tola-press` on the property pages) swings
between two `heightPx` modes because the widget's own carousel autoplays and its rendered height is not
fully deterministic between loads. This task's own fresh run:

```
node scripts/measure_density.mjs --port 3100 --out density-home.json
```

`invitation` read **19.9% empty, `heightPx` 1068** (the "widget rendered" mode — 5 of 6 prior runs landed
here too; the 6th read 900px / 14.3%). Page: **50 screens sampled, mean 32.9% empty** (CLAUDE.md's own
banner cites 33.6% — within the noise this same variance produces on a 150px-grid re-sample), worst
**61.4%** at a join, **all 7 chapters pass `passesWorst`**. `field-days` — the chapter the tiger's removal
touched — reads **35.6% mean / 35.6% worst**, identical to Task 4's own confirmation that the copy-as-props
refactor moved nothing. `imagesPerScreen`: **2.08** (`documentHeightPx` 8,215px, 19 distinct images).

**Do not quote `invitation`'s 19.9%/14.3% split, or the page mean/worst that inherits it, as a fixed fact.**
Re-run the command above if a settled number is needed for something that binds.

---

## 4 · Density — both property routes, before and after, and `imagesPerScreen`

**This is the figure that matters most** (CLAUDE.md: *"Look at images-per-screen, not at the chapter, when
judging whether a pin is worth its scroll"*) and nobody had measured it before this task. "Before" is the
branch point `b9eecaa`, built and served from an isolated `git worktree` (`../mahua-task9-before`, port
3101) so the comparison is genuinely apples-to-apples on one machine; "after" is this commit, port 3100.

```
# BEFORE (b9eecaa, isolated worktree on port 3101)
node scripts/measure_density.mjs --port 3101 --url http://localhost:3101/mahua-vann --out density-vann-BEFORE-task9.json
node scripts/measure_density.mjs --port 3101 --url http://localhost:3101/mahua-tola --out density-tola-BEFORE-task9.json
# AFTER (this commit, port 3100)
node scripts/measure_density.mjs --port 3100 --url http://localhost:3100/mahua-vann --out density-vann-AFTER-task9.json
node scripts/measure_density.mjs --port 3100 --url http://localhost:3100/mahua-tola --out density-tola-AFTER-task9.json
```

| | Vann before | Vann after | Tola before | Tola after |
|---|---|---|---|---|
| `imagesPerScreen` | 1.26 | **1.55** | 1.28 | **1.57** |
| distinct images | 16 | 13 | — | 14 |
| document height | 11,440px | 7,540px | 12,641px | 8,011px |
| sampled screens | 72 | 46 | 80 | 49 |
| page mean empty | 35.3% | 45.2% | 30.9% | 43.0% |
| page worst empty | 87.0% (at `vann-press`) | 80.8% (at `vann-press`) | 72.7% (at old `tola-day`/`tola-invitation` join) | 83.1% (at `tola-press`) |
| page `overBudget` screens | 18 | 20 | 11 | 19 |

**Read this as: real image density improved on both routes; the page mean rising is a sampling artefact of
the page getting much shorter, not evidence the restructure made anything emptier chapter-for-chapter.**
Three photograph bands came out (their images are released, not parked elsewhere — see `DECISIONS.md`
§22.4) and the shared six-card Experiences strip went in at 774px, replacing a considerably taller
composition (`vann-day` was 3,973px / 4.41 screens before; the strip is 774px / 0.86). A shorter document
means fewer total 150px samples, so the persistently-empty joins and the two long-standing over-ceiling
chapters (`vann-forest`/`tola-reserve`, `vann-press`/`tola-press`) now make up a bigger share of a smaller
pool — exactly the same lever CLAUDE.md's non-negotiable #8 already documents for a pin's length, applied
here to a removal instead.

### Per-chapter, after (this commit)

**Vann** (`vann-hero → vann-forest → vann-where → vann-rooms → vann-day → vann-press → vann-invitation`):

| chapter | mean | worst | passes | note |
|---|---|---|---|---|
| `vann-hero` | 0.2% | 0.2% | ✓ | |
| `vann-forest` | 45.2% | 45.2% | ✗ | pre-existing (was 55.8% before this branch — improved, still over; `DECISIONS.md` §5) |
| `vann-where` | 32.9% | 32.9% | ✓ | the map, now unheaded and `continues` from `vann-forest` |
| `vann-rooms` | 36.1% | 43.7% | ✓ | card stack, untouched by this plan |
| `vann-day` | 45.8% | 45.8% | ✗ | **parked — see §6** |
| `vann-press` | 80.0% | 80.0% | ✗ | **real, pre-existing, improved — see §6** |
| `vann-invitation` | 35.0% | 35.0% | ✓ | |

**Tola** (`tola-hero → tola-reserve → tola-where → tola-rooms → tola-day → tola-press → tola-invitation`):

| chapter | mean | worst | passes | note |
|---|---|---|---|---|
| `tola-hero` | 0.2% | 0.2% | ✓ | |
| `tola-reserve` | 46.9% | 46.9% | ✗ | pre-existing (was 58.0% before this branch — improved, still over) |
| `tola-where` | 24.9% | 24.9% | ✓ | the map, unheaded, `continues` from `tola-reserve` |
| `tola-rooms` | 36.7% | **45.3%** | **✗** | **a genuine new finding — see §6** |
| `tola-day` | 45.5% | 45.5% | ✗ | **parked — see §6**, same shape as `vann-day` |
| `tola-press` | 82.1% | 82.1% | ✗ | brand new chapter (Task 8); real figure, over the ceiling |
| `tola-invitation` | 37.0% | 37.7% | ✓ | |

Reproducibility: `tola-rooms`' 45.3% figure is identical across **6 independent measurements** spanning
Task 8's original run, Task 8b's before/after/repeat files, and this task's own fresh run and one repeat —
fully deterministic, not noise, and unrelated to the widget (no shadow content in that chapter).

---

## 5 · Screenshots — read at four widths, judged by eye

```
node scripts/capture_chapters.mjs --port 3100 --out shots-task9/
node scripts/capture_property_pages.mjs --port 3100 --out shots-task9/
```

Frames at 390 / 768 / 1440 / 1920px for all three routes. **This project's own record is that its two worst
defects were both found this way** (a park-map label at 4.3px, a plate-boards shrink), so the 390px frames
were opened first and specifically.

**The map reads as part of chapter `01` on both property pages, at every width checked**, including 390px —
no visible seam of cream between the chapter and the map, no orphaned heading, consistent with `continues`
doing the two things `docs/DECISIONS.md` §22.7 says it does (same surface, no gap).

**The activity strip (`03 · The Experience`) reads correctly on a phone on both property pages** — one card
at a time, the pager dots, the "Scroll →" hint, no clipped card at the edges, no different from how it
already read on the home page (byte-identical component, confirmed by `check_experience_strip.mjs`
elsewhere in this file).

**The Tripadvisor widget sits badly on cream, and this is the thing most worth a human eye.** On both
property pages' `Written About` chapters, at every width, the widget renders as solid near-black rectangular
cards with white type, a green Tripadvisor roundel and green filled rating circles — a hard, saturated,
foreign block dropped directly onto the page's cream, with no attempt at the site's own palette. A small
grey "Free Tripadvisor Reviews Widget" pill sits centred beneath the cards. This is squarely what
non-negotiable #3 (cream throughout) and #4 (restraint) exist to keep off the page, and it is not a defect
this codebase can fix — Elfsight's theme is configured on the client's own dashboard, not in markup this
repository controls. Both lodges currently show the **same five review cards** in the same order, which
reads as a single shared app-id rather than a per-property feed; that is a fact about the widget's current
configuration, reported rather than assumed to be wrong.

Frames referenced: `shots-task9/w390-*.webp` (home), and `shots-task9/*-390.png` /
`shots-task9/*-1440.png` (property pages) — see the earlier `shots-widget/vann-press.png` and
`tola-press.png` captured during Task 8 for the same reading at a different point in the branch, unchanged
in substance since.

---

## 6 · Two — in fact three — findings recorded honestly rather than resolved

**`vann-day`/`tola-day` read 45.8%/45.5% against the 45% ceiling.** The chapter is 0.86 screens tall, and
`measure_density.mjs`'s own documented fallback for a sub-screen chapter is a single sample centred on it —
a figure Task 7 showed swings 38.0–49.0% within 600px depending on exactly where the fixed 150px grid lands.
The identical composition (`ExperienceStrip`, byte-identical scrims and card sizes) reads 35.6% on the home
page, where the chapter is taller and the same grid happens to land somewhere kinder. A join-shortening
lever was tried on `RoomCardStack` and **measured worse** (45.8% → 47.7% on Vann, 45.8% → 47.2% on Tola) and
reverted rather than shipped. Corroborated by `imagesPerScreen` improving on both routes despite this
reading — the instrument's own limitation, not a real emptying of the page.

**`vann-press` (80.0%) and `tola-press` (82.1%) are real figures now, not blind ones.** A shadow-DOM fix to
`measure_density.mjs` (Task 8b) stopped the rig scoring Elfsight's own review-card row — rendered into an
**open** shadow root — as bare cream. Both are **improvements** over their pre-branch state (`vann-press`
was 87.0% at `b9eecaa`, 88.4% before any work on this branch at all per `docs/DECISIONS.md` §5) and both
remain **long-standing open items**, not new regressions introduced by this plan.

**`tola-rooms` newly reads 45.3% worst, `passesWorst` FALSE — genuinely new, and not previously escalated.**
It passed at Task 5's own commit (36.3% / 43.5%) and has read 36.7% / 45.3% at every measurement since Task
6, this task's own two independent runs included. `vann-rooms` passes at 43.7%. `task-7-report.md` recorded
the number once, in passing, while measuring a different chapter's neighbours ("`tola-rooms` worst 45.3% —
already over budget on its own") — but it was never carried into this plan's distilled progress ledger or
put to the client. Nothing in `RoomCardStack.tsx`, `ROOM_STACK` or the card stack's own construction changed
during this plan. The most plausible mechanism, **not independently bisected to a specific commit by this
task**, is the same page-anchored-grid sensitivity described above for `vann-day`/`tola-day`: Task 6's map
`continues` change sits in the document above `tola-rooms` and could plausibly have shifted cumulative
height by enough to move which fixed sample lands nearest the chapter's own worst point. Reported to the
client per this project's "give the number, let him choose" practice — not fixed unilaterally inside a
documentation task.

---

## 7 · Instrument findings — six, of the same shape, and the most reusable output of this branch

Full detail: `docs/DECISIONS.md` §22.8. Summary:

1. **Cross-origin bytes invisible to `measure_js_budget.mjs` and `measure_page.mjs`** — no
   `Timing-Allow-Origin` on Elfsight's CDN zeroes `transferSize`; a CDP probe is what actually saw the 588 KB.
2. **`check_docs.mjs` crashed (ENOENT) rather than reporting drift**, since Task 2 deleted
   `scripts/check_reviews.mjs`, which it read at a fixed line. Fixed as part of this task (the reference is
   gone from `check_docs.mjs` itself); `node scripts/check_docs.mjs` now PASSES — confirmed by this task's own
   run, reproduced below.
3. **`check_experience_strip.mjs` and `check_contrast_over_photos.mjs` both hardcoded the home page's chapter
   id**, one crashing and one silently measuring nothing on a property route — fixed additively in Task 7;
   this task re-ran both on all three routes fresh (§8) and confirms 0 dead probes on either property route.
4. **`measure_density.mjs` could not pierce Elfsight's open shadow root**, scoring the live review-card row as
   bare cream even while it rendered correctly — the same shape of blindness as the `pointer-events: none`
   fix on 7 Aug 2026. Fixed in Task 8b with a `seen`-guarded shadow walk; proven against a control
   (`field-days`, no shadow roots, held at 35.6% → 35.6% while `vann-press`/`tola-press` moved).
5. **`check_plates.mjs` FAILs on all three routes** ("no `[data-plate-grid]` boards found") — found by this
   task, but **pre-existing since 19 Aug 2026**, when `PlateGrid.tsx` was unrouted along with the rest of the
   twelve-chapter home page. Not caused by anything in this plan's eleven rulings.
6. **`check_rule_in.mjs` crashes with an uncaught exception on the home page's default URL** — its assertion 7
   assumes the resting hairline lives on `LodgeCards.tsx`, unrouted since the same 19 Aug cut. Confirmed
   working (0 failures, 7/7 assertions) when pointed explicitly at `/mahua-vann`, where the same class lives
   on `PropertyInvitation.tsx`. Pre-existing, not caused by this plan.

---

## 8 · Every other rig, all three routes, this build

```
node scripts/check_contrast_over_photos.mjs --port 3100 --out contrast-all-task9.json                                       # home
node scripts/check_contrast_over_photos.mjs --port 3100 --url http://localhost:3100/mahua-vann --out contrast-vann-task9.json
node scripts/check_contrast_over_photos.mjs --port 3100 --url http://localhost:3100/mahua-tola --out contrast-tola-task9.json
node scripts/check_image_resolution.mjs --port 3100 --out resolution-all-task9.json            # home only — the rig takes one URL
node scripts/check_image_resolution.mjs --port 3100 --url http://localhost:3100/mahua-vann --out resolution-vann-task9.json
node scripts/check_image_resolution.mjs --port 3100 --url http://localhost:3100/mahua-tola --out resolution-tola-task9.json
node scripts/check_experience_strip.mjs --port 3100 --url http://localhost:3100/ --chapter field-days --out strip-home-task9.json
node scripts/check_experience_strip.mjs --port 3100 --url http://localhost:3100/mahua-vann --chapter vann-day --out strip-vann-task9.json
node scripts/check_experience_strip.mjs --port 3100 --url http://localhost:3100/mahua-tola --chapter tola-day --out strip-tola-task9.json
node scripts/check_card_stack.mjs --port 3100 --out card-stack-task9.json
node scripts/check_room_gallery.mjs --port 3100 --out room-gallery-task9.json
node scripts/check_menu.mjs --port 3100 --out menu-task9.json
node scripts/check_header.mjs --port 3100 --out header-task9.json
node scripts/check_rule_in.mjs --port 3100 --out rule-in-home-task9.json          # crashes — see §7 #6, pre-existing
node scripts/check_rule_in.mjs --port 3100 --url http://localhost:3100/mahua-vann --out rule-in-vann-task9.json    # 0 failures
node scripts/check_plates.mjs --port 3100 --out plates-task9.json    # FAILs, see §7 #5, pre-existing
node scripts/check_films.mjs                                        # FAILs by design — see DECISIONS.md §22.2
```

| rig | result |
|---|---|
| `check_contrast_over_photos.mjs` (home) | **156 ok, 0 fail, 0 dead** |
| `check_contrast_over_photos.mjs` (vann) | **90 ok, 0 fail, 0 dead** |
| `check_contrast_over_photos.mjs` (tola) | **90 ok, 0 fail, 0 dead** |
| `check_image_resolution.mjs` (home) | 0 under-served at 390/390@3x/768/1440/1920, all DPRs; 0 gallery failures |
| `check_image_resolution.mjs` (vann, tola) | 0 under-served, 0 gallery failures (see per-route JSON) |
| `check_experience_strip.mjs` (home) | **PASS, 13/13** |
| `check_experience_strip.mjs` (vann) | **PASS, 12/13** (13 correctly N/A — hover zoom is home-only by 12 Aug ruling) |
| `check_experience_strip.mjs` (tola) | **PASS, 12/13** (same) |
| `check_card_stack.mjs` | **PASS**, both routes, all 6 widths, 9/9 assertions |
| `check_room_gallery.mjs` | **PASS**, both routes |
| `check_menu.mjs` | **PASS, 0 failures** |
| `check_header.mjs` | **PASS, 0 failures** |
| `check_rule_in.mjs` (default, home) | crashes — pre-existing, §7 #6 |
| `check_rule_in.mjs` (`/mahua-vann`) | **PASS, 0 failures** |
| `check_plates.mjs` | FAILs on all 3 routes — pre-existing, §7 #5 |
| `check_films.mjs` | FAILs by design — `docs/DECISIONS.md` §22.2 |
| `npm run verify:budget -- --port 3131` | **PASS** — 167.2 KB br first load, fresh build |
| `node scripts/check_docs.mjs` | **PASS** (was crashing before this task's fix — §7 #2) |

---

## 9 · Final gate

```
npm test            # 497 passed, 46 files
npm run build        # green
npm run lint          # clean
npm run verify:budget # PASS, 167.2 KB br
node scripts/check_docs.mjs   # PASS
```

All green at the commit this task closes out with.
