# Task 7 evidence: retiring `RoomShowcase`, proving the card stack

Closes the room-card-stack plan (`.superpowers/sdd/2026-08-11-room-card-stack/`). `RoomShowcase.tsx` and
its test are deleted; `RoomShowcase.types.ts` survives (both property content files still import
`RoomEntryCopy`/`RoomShowcaseCopy` from it) with the now-unused `RoomScale` type dropped. Every number
below is re-derivable with the command shown; none was hand-edited.

Full narrative and the two findings from Step 4 are in
`.superpowers/sdd/2026-08-11-room-card-stack/task-7-report.md`. This file is the number ledger.

**Follow-up, same day:** one of Step 4's two findings — Tola's "Family Suite" text never legible at 390 or
768px — is fixed. See "Family Suite fix" below; full narrative in
`.superpowers/sdd/2026-08-11-room-card-stack/task-7-fix-report.md`.

**Density correction, 11 Aug 2026 — read before trusting any density figure in this file.** The
24.8%/27.4% mean-empty figures recorded below for `vann-rooms`/`tola-rooms` (in "Density — before/after"
and again in "Family Suite fix") were not merely superseded — they were **wrong when measured**, inflated
by a defect that was still live at the time: five, then six, stacked cards' photographs were overflowing
their own cards at 1440/1920, a rendering defect a *later* fix round found and fixed
(`.superpowers/sdd/2026-08-11-room-card-stack/task-7-fix2-report.md`, not narrated anywhere in this file).
`measure_density.mjs` hit-tests what is painted, and an overflowing photograph scores as **100% imagery**
whatever the words beside it were doing — including the exact defect this task's own Step 4 flagged as
unresolved. Fixing the clip gave real area back to cream and type, so the honest figures are *higher* than
what is recorded below, not the same: **`vann-rooms` 31.5% mean / 42.1% worst; `tola-rooms` 33.8% mean /
44.3% worst — both still inside the 45% ceiling.** Marked at each point it appears below rather than
rewritten, so this file still shows what was believed at the time alongside what is true. Full working:
`docs/DECISIONS.md` §17.

## What was built

Nothing new. This task is subtraction and proof: delete the section the card stack (Tasks 1–6) replaced,
confirm nothing still reaches for it, and measure the whole thing on a production build.

## Static checks

```
npx tsc --noEmit          → clean
npm test -- --run          → 34 files, 419 tests, all passed
npm run lint                → 0 errors, 2 pre-existing warnings (unrelated: SiteMenu.test.tsx <img>)
```

## The card-stack rig

```
node scripts/check_card_stack.mjs --port 3100 --out docs/reviews/2026-08-11-card-stack/card-stack.json
```

**All 8 combos pass, 0 failures** (`card-stack.json`, `"verdict": "pass"`). This is a change since Task
6, whose own report recorded assertions 5 and 6 failing on every one of the 8 combos (recede invisible
while pinned; several photographs cropped past the 25% bound). Commit `0a44044` ("fix: recede while a
room card is pinned, and the crop it was hiding") fixed both before this task started — reconfirmed here
against a fresh build, not assumed from the commit message.

**The rig was watched failing against six deliberate breakages in Task 6, not four.** (This task's own
brief says "the four ways the rig was watched failing" — that count is wrong; Task 6's report and its own
commit message, "test: a browser rig for the card stack, watched failing six ways," both say six. Recorded
here rather than silently written as four.) The six, each restored after: (1) `position: sticky` removed
→ assertion 1 fails (deck stops stacking); (2) `heightMax: 1200` → does **not** fail assertion 2, a defect
in the brief's own suggested recipe that Task 6 traced algebraically rather than forcing a different edit
to "work"; (3) `animation-timeline` line deleted → exposed a real gap in assertion 5's first draft (it
only checked one scroll position), fixed mid-task, then caught cleanly; (4) `barReserve: 40` → assertion 3
fails (bar measures past the reserve); (5) the last-card `animation: none` override removed → assertion 7
fails (the last card recedes into the deck behind it); (6) the base recede rule also removed → assertion 7
still fails, now specifically on its second half (no covered card ever recedes at all). Full detail:
Task 6's own report, `.superpowers/sdd/2026-08-11-room-card-stack/task-6-report.md`.

## Density — before/after, against the 45% ceiling

```
node scripts/measure_density.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-11-card-stack/vann-density.json
node scripts/measure_density.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-11-card-stack/tola-density.json
```

| chapter | before (this task's floor) | mean empty (now) | worst empty (now) | verdict |
|---|---|---|---|---|
| `vann-rooms` | 40.1% | **24.8%** | 42.1% | improved 15.3pt; inside 45% |
| `tola-rooms` | 39.0% | **27.4%** | 42.4% | improved 11.6pt; inside 45% |

> **Corrected 11 Aug 2026: the "mean empty (now)" figures above were inflated by a live defect, not a real
> measure of this chapter's density.** Five, then six, stacked cards' photographs were overflowing their
> own cards at 1440/1920 at this point in the plan, and `measure_density.mjs` scores an overflowing
> photograph as 100% imagery. A later fix round closed the clip; the honest figures on the shipped page are
> **`vann-rooms` 31.5% mean / 42.1% worst** and **`tola-rooms` 33.8% mean / 44.3% worst** — both still
> inside 45%, but higher than what this table shows, because fixing the clip gave real area back to cream
> and type. See `docs/DECISIONS.md` §17.

Neither chapter regressed; both improved substantially and stay inside the ceiling on their worst screen.
Both routes still carry their pre-existing, already-accepted over-budget chapters — `vann-forest` 55.8%,
`vann-press` 87%, `tola-reserve` 58% (`vann-density.json`, `tola-density.json`) — all three are the open
items in `docs/DECISIONS.md` §5, untouched by and unrelated to this task.

## Contrast and image resolution

```
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-vann
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-tola
node scripts/check_image_resolution.mjs
```

Both contrast runs: every probe at 390/768/1440/1920 reads `ok` — worst measured 3.3:1 against a 3:1
floor, best 11.1:1 against a 4.5:1 floor. Exit 0 both routes. Image resolution: 0 images under-served by
`sizes` across all five width/DPR combinations checked. **Both scripts write to their own hard-coded
`docs/reviews/2026-08-04-task-7/` path** — confirmed from that file's git history (six prior, unrelated
commits touch it across the project's life) that this is a shared, continuously-overwritten evidence file
every task that runs these two rigs updates in place, not a per-task snapshot — left as the rig produces
it rather than forced into this task's folder.

## Screenshots

```
node scripts/capture_property_pages.mjs --out docs/reviews/2026-08-11-card-stack
```

Eight full-page PNGs, both routes × 390/768/1440/1920, in this folder. Read at 390px for Step 4 — see the
task report for the full account. Short version: **Vann's three cards are all fully legible. Tola's
Deluxe, Suite and Camping Hut are legible; Tola's "Family Suite" (third of four) is not** — its
description is cut off mid-sentence in the static capture, and a DOM-geometry sweep of the live,
interactively-scrolled page (not the screenshot) confirmed this is real: across the whole chapter's scroll
range at both 390×844 and 768×1024, "Family Suite"'s text block is never simultaneously inside the
viewport and at full opacity (0 qualifying samples out of dozens tried, against 19–33 for every other
card on either route). **Not fixed in this task** — no application code was touched here; see the task
report's "Concerns" section, and see "Family Suite fix" below for the follow-up task that fixed it.

## JS budget

```
npm run verify:budget -- --out docs/reviews/2026-08-11-card-stack/js-budget.json
```

Builds fresh, starts its own server (port 3131), measures, kills the server. `verdict: "pass"`.

| | brotli bytes |
|---|---|
| Baseline (`js-baseline.json`, before this plan's work) | 172,209 |
| This task (`js-budget.json`) | **172,209** |
| **Delta** | **0** |

Byte-identical, confirmed by direct field comparison of the two JSON files' `firstLoad.br`, not by eye.
This design adds no JavaScript — the measurement matches the claim exactly.

## Mobile section length — measured against the client's accepted projection

The client accepted a projected mobile growth of **~27% (Vann) and ~38% (Tola)** on 11 Aug
(`docs/superpowers/specs/2026-08-11-room-card-stack-design.md` §9). Measured here directly
(`#vann-rooms` / `#tola-rooms`'s own `getBoundingClientRect().height` at 390×844 on the live build)
against that same spec's §2 table, which is itself a measured — not projected — "today" baseline taken
before this plan's work:

| | before (spec §2, measured) | after (measured here) | change | spec §9's own projection |
|---|---|---|---|---|
| Vann @ 390 | 1,738px | **2,362px** | **+624px, +35.9%** | +472px, ~27% |
| Tola @ 390 | 2,035px | **2,922px** | **+887px, +43.6%** | +775px, ~38% |

**The measured growth is larger than what was accepted — by about 9 points on Vann and 5.6 points on
Tola.** The direction is correct (meaningfully longer on a phone, shorter on desktop — Vann @ 1440:
2,437px → 2,371px, −2.7%; Tola @ 1440: 3,266px → 2,984px, −8.6%, both closer to their own projections than
mobile was), but the specific mobile number the client signed off on undersells what shipped. Reported as
measured, per instruction, rather than reconciled quietly to the spec's figure — §9 should be corrected
to ~36%/~44%, and whether that is still acceptable is the client's call.

## Summary

| Check | Result |
|---|---|
| tsc / tests / lint | clean / 419 passing / 0 errors |
| Card-stack rig, 8 combos | all pass (0 failures) |
| `vann-rooms` density | ~~40.1% → 24.8% mean (improved, inside 45%)~~ **Corrected 11 Aug: 24.8% was inflated by the photo-overflow defect (an overflowing photo scores as 100% imagery). Honest: 40.1% → 31.5% mean / 42.1% worst, inside 45%.** |
| `tola-rooms` density | ~~39.0% → 27.4% mean (improved, inside 45%)~~ **Corrected 11 Aug: 27.4% was inflated the same way. Honest: 39.0% → 33.8% mean / 44.3% worst, inside 45%.** |
| Contrast over photographs, both routes | all probes `ok` |
| Image resolution | 0 under-served |
| JS budget | 172,209 br, delta 0 (byte-identical) |
| Mobile section length | Vann +35.9% (vs ~27% accepted); Tola +43.6% (vs ~38% accepted) |
| 390px legibility | ~~Vann: all 3 cards legible. Tola: 3 of 4 legible; "Family Suite" is not — reported, not fixed~~ **Fixed 11 Aug — see "Family Suite fix" below.** |

## Family Suite fix (11 Aug 2026, follow-up task)

The defect this task's own Step 4 reported and left unfixed — Tola's "Family Suite" text block never
simultaneously on screen and undimmed, at 390 and 768px — is fixed. `RoomShowcase.tsx` is still gone;
nothing else in this task's own findings changed.

### Mechanism, measured

Not the recede, not the deck depth, not the header/bar reserve — all three were sound. The bug is a single
flex-layout interaction between `RoomCard.tsx`'s photo wrapper and the `<img>` it contains, and it is
invisible to `check_card_stack.mjs`'s own assertion 6 because that assertion only ever checks *width* lost
to crop, never the wrapper's own rendered height.

The photo wrapper for the `beside` layout carries `style={{ aspectRatio: "1.25" }}` so its box is meant to
render at `width / 1.25`. Below `lg` (column layout, width stretched to the card's full width by the
default flex `align-items: stretch`), that held for every room **except** `tola-room-family` — the one
portrait photograph (0.67:1) among all seven rooms, and the only reason Family Suite takes the `beside`
layout below `lg` at all.

Measured on the live, production-built page before the fix (`node .superpowers/sdd/2026-08-11-room-card-stack/_diagnose_family_suite.mjs`, Playwright, real `getComputedStyle()`):

| width | intended wrapper height (`width / 1.25`) | actual rendered height | card's own fixed height | text block's natural height |
|---|---|---|---|---|
| 390px | 273.6px | **513px** | 631px (593.1px post-recede-scale) | 228px |
| 768px | 537.6px | **1,008px** | 760px (714.4px post-recede-scale) | 193px |

At 390px the photo alone was eating 239px more than budgeted, leaving roughly 80–118px for a 228px text
block. At 768px the photo alone (1,008px) already exceeded the entire 760px card. Either way,
`.room-card`'s own `overflow: hidden` clipped the excess — exactly the "cut off mid-sentence" this task's
Step 4 saw in the static capture, confirmed as the live-scroll behaviour by the DOM-geometry sweep.

Root cause, isolated by live injection (`node .superpowers/sdd/2026-08-11-room-card-stack/_probe_minheight.mjs`,
before touching any source file): a flex item's default `min-height` is `auto`, which resolves to the
*larger* of any explicit minimum and an automatic, content-based one. For a box whose only child is a
replaced element (the `<img>`, carrying real `width`/`height` HTML attributes), that automatic minimum is
derived from the image's *own* aspect ratio — not the wrapper's declared `aspect-ratio`. For every other
room, the source photograph is *wider* than its box's target ratio, so the content-derived minimum is
smaller than the `aspect-ratio`-derived height and never binds. `tola-room-family`, being narrower
(portrait), is the one case where the content-derived minimum is *larger* — and it won, silently
overriding the `aspect-ratio: 1.25` the whole card-height budget was built around. Injecting
`min-height: 0` on the live page, before any file was edited, dropped the wrapper straight to the intended
273.6px — confirming the mechanism before it was fixed for real.

`suite-tiger-painting`, Vann's other `beside` photograph, is 1.50:1 — wider than its own 1.25 box — so it
was never affected, which is why the same defect never showed up on Vann.

### The fix

One Tailwind class, `min-h-0`, added to the photo wrapper's `className` in `components/sections/RoomCard.tsx`
(alongside the existing `flex-none` / `flex-none lg:w-[60%]`). No JavaScript, no new `ROOM_STACK` number —
`0` is a structural flex reset, the same category as the file's existing `flex-none` and `shrink-0`, not a
tunable design dial. At `lg` and up it is provably inert: both axes are already definite there
(`lg:w-[60%]` and the card's own `lg:items-stretch` height), and a definite size leaves nothing for
`min-height` to clamp — confirmed by an unchanged rig and unchanged screenshots at 1440/1920 (below).

### Before / after — the DOM-geometry sweep, re-run

Same method as this task's own Step 4: 20px steps across the whole chapter ±300px, reading each card's
**text block** (not the outer card) `getBoundingClientRect()` and the card's own computed `opacity` at
every step, on the real interactively-scrolled page. "Legible" = text block fully inside `[0, innerHeight]`
**and** the card at opacity ≥0.98. A stricter, bar-aware pass also subtracts the fixed booking bar's own
height from the visible bound (the original Step 4 wording didn't, and at 768px the naive count briefly
counted a moment where the fact line sat under the bar) — both are reported.

| | before (naive, matches Step 4's own method) | after (naive) | after (bar-aware) |
|---|---|---|---|
| Vann Deluxe @ 390 | 40 | 40 | 40 |
| Vann Cottage w/o Deck @ 390 | 19 | 19 | 16 |
| Vann Cottage w/ Deck @ 390 | 32 | 32 | 29 |
| Tola Deluxe @ 390 | 70 | 70 | 70 |
| Tola Suite @ 390 | 47 | 47 | 44 |
| **Tola Family Suite @ 390** | **0** | **14** | **11** |
| Tola Camping Hut @ 390 | 32 | 32 | 29 |
| Tola Deluxe @ 768 | 80 | 80 | 80 |
| Tola Suite @ 768 | 51 | 51 | 48 |
| **Tola Family Suite @ 768** | **0** | **11** | **8** |
| Tola Camping Hut @ 768 | 41 | 41 | 38 |

Every card that was already fine stayed fine (bar-aware counts run a little lower across the board because
the check is genuinely stricter, not because anything regressed — re-run against the *pre-fix* build too,
producing the same relative pattern). Family Suite went from **0 at both widths, both methods** — the
defect — to a healthy double-digit count under either method, at both widths.

At 1440 and 1920 (not part of the reported defect, checked anyway per this task's "must hold for all four
widths" requirement): Vann's Deluxe and Cottage-without-Deck, and Tola's Deluxe and Suite, score 0 legible
samples under this same sweep at both widths — **identical before and after the fix**, confirmed by
re-running the sweep against the unmodified build. This is a pre-existing characteristic of the desktop
card stack, not caused by or in scope for this fix (`check_card_stack.mjs`'s own box-level assertions pass
at every width, both before and after — this is the project's known "type over cream is measured nowhere"
blind spot, CLAUDE.md, recurring on a chapter no rig has looked at this closely before). Worth a future
task; not fixed here. Family Suite itself only improved at these widths (0 → 5 and 0 → 9).

### The rig, re-run on the fixed build

```
node scripts/check_card_stack.mjs --port 3100 --out docs/reviews/2026-08-11-card-stack/card-stack.json
```

```
vann@390x844     rooms=3 samples=24 bar<=72px (max 63.4px) resting@3797 recede=true (5.6%, op 0.58)
vann@768x1024    rooms=3 samples=27 bar<=72px (max 69.0px) resting@4192 recede=true (5.4%, op 0.59)
vann@1440x900    rooms=3 samples=25 bar<=72px (max 69.0px) resting@3715 recede=true (5.7%, op 0.57)
vann@1920x1080   rooms=3 samples=27 bar<=72px (max 69.0px) resting@4004 recede=true (5.2%, op 0.61)
tola@390x844     rooms=4 samples=29 bar<=72px (max 63.4px) resting@5295 recede=true (5.4%, op 0.59)
tola@768x1024    rooms=4 samples=34 bar<=72px (max 69.0px) resting@6092 recede=true (5.5%, op 0.59)
tola@1440x900    rooms=4 samples=30 bar<=72px (max 69.0px) resting@5344 recede=true (5.5%, op 0.59)
tola@1920x1080   rooms=4 samples=34 bar<=72px (max 69.0px) resting@6027 recede=true (5.1%, op 0.62)

PASS
```

All 8 combos, all 7 assertions — **identical figures to this task's own pre-fix run**, confirming the fix
changes nothing the rig measures at the box level (as expected: the rig checks the outer card, this defect
lived inside it).

### Density, re-run

```
node scripts/measure_density.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-11-card-stack/vann-density-after.json
node scripts/measure_density.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-11-card-stack/tola-density-after.json
```

| chapter | mean empty (this task, pre-fix) | mean empty (after fix) | worst empty (after fix) | verdict |
|---|---|---|---|---|
| `vann-rooms` | 24.8% | **24.8%** | 42.1% | unchanged, inside 45% |
| `tola-rooms` | 27.4% | **27.4%** | 42.4% | unchanged, inside 45% |

> **Corrected 11 Aug 2026 — see the note under "Density — before/after" above.** "Unchanged" is true of
> this fix (Family Suite's own text-clip, at 390/768px) and nothing else: it did not touch the *separate*
> 1440/1920 photo-overflow defect that was still inflating both figures at this point in the plan. A later
> fix round closed that one too; the honest, final figures are **`vann-rooms` 31.5% mean / 42.1% worst** and
> **`tola-rooms` 33.8% mean / 44.3% worst**, both inside 45%.

Unchanged to one decimal place. `vann-forest`, `vann-press` and `tola-reserve` remain the pre-existing,
already-accepted over-budget chapters (`docs/DECISIONS.md` §5), untouched by this fix.

### JS budget, re-run

```
npm run verify:budget -- --out docs/reviews/2026-08-11-card-stack/js-budget-after.json
```

`verdict: "pass"`, `firstLoad.br: 172209` — byte-identical to both this task's own figure and the plan's
original baseline. Delta 0. A Tailwind class carries no runtime cost.

### Screenshots, re-captured and read

```
node scripts/capture_property_pages.mjs --out docs/reviews/2026-08-11-card-stack
```

At 390px, both routes, every card's name, description and fact line read cleanly with no clipping or
overlap: Vann's Deluxe, Cottage without Deck, Cottage with Deck; Tola's Deluxe, Suite, **Family Suite**
("Two interconnected rooms under a terracotta-beamed roof, a Gond painting over the bed." — the sentence
Step 4 found cut off mid-word — now complete), and Camping Hut. Cross-checked against a real, interactively
scrolled 390×844 and 768×1024 viewport at the exact scroll position the sweep above found legible, not
just the static full-page capture.

### Static checks, re-run

```
npm test -- --run    → 34 files, 419 tests, all passed
npx tsc --noEmit      → clean
npm run lint           → 0 errors, 2 pre-existing warnings (unrelated)
```
