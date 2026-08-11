# Task 7 evidence: retiring `RoomShowcase`, proving the card stack

Closes the room-card-stack plan (`.superpowers/sdd/2026-08-11-room-card-stack/`). `RoomShowcase.tsx` and
its test are deleted; `RoomShowcase.types.ts` survives (both property content files still import
`RoomEntryCopy`/`RoomShowcaseCopy` from it) with the now-unused `RoomScale` type dropped. Every number
below is re-derivable with the command shown; none was hand-edited.

Full narrative and the two findings from Step 4 are in
`.superpowers/sdd/2026-08-11-room-card-stack/task-7-report.md`. This file is the number ledger.

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
card on either route). Not fixed here — no application code was touched; see the task report's "Concerns"
section.

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
| `vann-rooms` density | 40.1% → 24.8% mean (improved, inside 45%) |
| `tola-rooms` density | 39.0% → 27.4% mean (improved, inside 45%) |
| Contrast over photographs, both routes | all probes `ok` |
| Image resolution | 0 under-served |
| JS budget | 172,209 br, delta 0 (byte-identical) |
| Mobile section length | Vann +35.9% (vs ~27% accepted); Tola +43.6% (vs ~38% accepted) |
| 390px legibility | Vann: all 3 cards legible. Tola: 3 of 4 legible; "Family Suite" is not — reported, not fixed |
