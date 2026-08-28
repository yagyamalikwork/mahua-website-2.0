# Mobile, tablet and zoom — whole-branch sweep (Task 6)

**Branch:** `feat/journal-and-mobile`, at the commit this task closes out with. **Not merged, not
deployed.** Full narrative: `docs/DECISIONS.md` §23. This file is the evidence half — every figure below
names the command that produced it, per this project's own rule that nothing in `docs/reviews/` may be
quoted unless a script in `scripts/` can re-derive it.

Earlier files in this same directory (`baseline.json`, `after-tap.json`, `after-pager.json`,
`after-pager-fixround1.json`, `after-map-fix.json`, `responsive-task5*.json`, `unmeasured.md`, the
`landscape-*`/`wordspan-*`/`*-map-390*` screenshots) are **Tasks 1–5's own evidence**, produced while
building the plan's five fixes out. This README is Task 6's: one production build (`npm run build && npx
next start -p 3100`), every rig re-run against it on all three routes, plus a full screenshot sweep at all
eight of `check_responsive.mjs`'s own shapes. Files this task added carry a `-task6` suffix to keep them
distinguishable from the per-task evidence they sit beside.

---

## 1 · `check_responsive.mjs` — the final state, all three routes, eight shapes

```
node scripts/check_responsive.mjs --port 3100 \
  --baseline docs/reviews/2026-08-27-mobile/responsive-task5-fixround1.json \
  --out docs/reviews/2026-08-27-mobile/task6-final.json
```

| assertion | total | what it is |
|---|---:|---|
| 1 · overflow | 0 | PASS everywhere, all three routes, all eight shapes |
| 2 · target size (24×24) | **54** | ALL at `zoom-150`/`zoom-200` (mouse-pointer shapes, where `.tap`'s `pointer: coarse` gate correctly does nothing) — **0 under-24 on every touch shape, every route.** Split: `/` 8+8, `/mahua-vann` 11+11, `/mahua-tola` 8+8, across both zoom shapes = 54 |
| 3 · overlap | **21** | byte-identical to every prior committed run since the Task 1 baseline — the pre-approved room-card-stack recede overlap, none of it new |
| 4 · type-floor regression | 0 | no font shrank below the recorded baseline, any route, any shape |
| 5 · zoom policy | 0 | no `maximum-scale`/`user-scalable=no` anywhere |
| 6 · OS text scaling | 2,414 on this run | **do not quote this total as settled** — §5 below and `unmeasured.md` §1.9. **Corrected 28 Aug 2026: the row below previously summed to 1,908, silently omitting the 506 word-span intersections — `unmeasured.md` §1.3 always had this right.** Full split, re-derived directly from `task6-final.json`'s own per-shape fields, not estimated: **clips 1,707** = 1,376 word-span-mask artefact (visually inert, confirmed §23.6; a subset of the 1,658 at-rest figure) + 282 `.drift-frame` by-design at-rest overflow + 49 genuinely new (all `RoomCardStack`). **Intersections 707** = 506 word-span-mask artefact + 450 already-intersecting-at-rest (this figure overlaps the word-span set, unlike the clips row — see `unmeasured.md` §1.4 for the further, non-overlapping split of the 201 non-word-span intersections into 85 at-rest, 70 of them the pre-existing map-label × map-label pairs, and 116 new) + 116 genuinely new. **165 real findings** (49 clips + 116 intersections), not ~2,400 |

**Total: 2,489 findings, exit code 1 — correct, not a broken rig.** Assertions 2 and 3 (the two
global-constraint numbers) are exactly what every prior task's own committed run already showed; this run
adds nothing new to either. Re-derived independently for this task (not merely copied from Task 5's own
number): `node -e` querying `task6-final.json`'s own `failures[]` array by `assertion` field gives
`{ '2': 54, '3': 21, '6': 2414 }`.

### 1.1 The pager's own geometry, re-derived a second time from committed evidence

Independently recomputed from `docs/reviews/2026-08-27-mobile/after-pager-fixround1.json`'s own per-target
`own: {x, y, w, h}` field (not trusted from Task 3's prose) — the six pager links on `/` at `phone-360`:

```
widths:  13.30, 15.13, 14.73, 15.67, 14.83, 15.44
left-edge pitches (b.x − a.x):                 29.29, 31.13, 30.73, 31.67, 30.83  → min 29.29
true centre pitches ((b.x+b.w/2) − (a.x+a.w/2)): 30.20, 30.93, 31.20, 31.25, 31.13  → min 30.20
```

Spot-checked on `/mahua-vann` at `zoom-200` (a different route, a different shape): the six link widths are
byte-identical (`13.3, 15.13, 14.73, 15.67, 14.83, 15.44`), confirming Task 3's own claim that this geometry
never differs by route or shape. **The figure this project's own comments called a "centre-to-centre pitch"
throughout is actually left-edge-to-left-edge; the true minimum centre-to-centre gap is 30.20px, not
29.29px — so the real margin against the shipped 29px extension is ≈1.20px, not ≈0.29px.** See
`docs/DECISIONS.md` §23.3 for the full correction; both figures come from the one committed JSON file above,
not from a fresh measurement this task took on faith.

---

## 2 · Contrast, image resolution, the strip, the card stack, the gallery, the menu and header

```
node scripts/check_contrast_over_photos.mjs --port 3100 --out contrast-home-task6.json
node scripts/check_contrast_over_photos.mjs --port 3100 --url http://localhost:3100/mahua-vann --out contrast-vann-task6.json
node scripts/check_contrast_over_photos.mjs --port 3100 --url http://localhost:3100/mahua-tola --out contrast-tola-task6.json
node scripts/check_image_resolution.mjs --port 3100 --out resolution-home-task6.json
node scripts/check_image_resolution.mjs --port 3100 --url http://localhost:3100/mahua-vann --out resolution-vann-task6.json
node scripts/check_image_resolution.mjs --port 3100 --url http://localhost:3100/mahua-tola --out resolution-tola-task6.json
node scripts/check_experience_strip.mjs --port 3100 --url http://localhost:3100/ --chapter field-days --out strip-home-task6.json
node scripts/check_experience_strip.mjs --port 3100 --url http://localhost:3100/mahua-vann --chapter vann-day --out strip-vann-task6.json
node scripts/check_experience_strip.mjs --port 3100 --url http://localhost:3100/mahua-tola --chapter tola-day --out strip-tola-task6.json
node scripts/check_card_stack.mjs --port 3100 --out card-stack-task6.json
node scripts/check_room_gallery.mjs --port 3100 --out room-gallery-task6.json
node scripts/check_menu.mjs --port 3100 --out menu-task6.json
node scripts/check_header.mjs --port 3100 --out header-task6.json
```

| rig | result |
|---|---|
| `check_contrast_over_photos.mjs` (home) | **156 ok, 0 fail, 6 skipped by design** (the two lodge panels are desktop-only probes, `skipped: 1024` — not a failure) |
| `check_contrast_over_photos.mjs` (vann) | **90 ok, 0 fail, 0 skipped** |
| `check_contrast_over_photos.mjs` (tola) | **90 ok, 0 fail, 0 skipped** |
| `check_image_resolution.mjs` (home, vann, tola) | **0 under-served by `sizes`, on all three routes**, across 390@1x/3x, 768@1x, 1440@1x, 1920@1x — home 19–22 images checked per width, Vann 16–19, Tola 18–21 |
| `check_experience_strip.mjs` (home) | **PASS, 13/13** — a continuous 99-width sweep (360→1920, 16px steps): worst crop 0.3% at 440px, ≥1.04 cards visible at every width |
| `check_experience_strip.mjs` (vann, tola) | **PASS, 12/13** on each (assertion 13, the hover zoom, correctly N/A — no `[data-hover-zoom]` ancestor on either property route, the client's 12 Aug ruling that the zoom is home-only) — same 99-width sweep, byte-identical crop/visibility figures to the home run |
| `check_card_stack.mjs` | **PASS**, both routes, all 6 widths each (390–1920) — every card's text legible (3/3 Vann, 4/4 Tola), recede confirmed at every width, bar height always ≤72px |
| `check_room_gallery.mjs` | **PASS**, both routes, both widths (390/1440) — lazy until opened, next/prev/close/backdrop-dismiss all confirmed, no-JS capability works (0 errors), the welcome-screen z-index collision handled, 0px overflow at the wide 1920/2400 shapes |
| `check_menu.mjs` | **PASS, 0 failures** — real scroll lock (wheel/keys) at 390/1440, both with and without reduced motion; three places; focus trap; real route navigation confirmed |
| `check_header.mjs` | **PASS, 0 failures** — both states at 320/390/768/1440/1920, reduced motion, no-JS, the emblem turn, mid-page reload with no crossfade over cream |

None of this plan's fixes (`.tap`, the pager's own width, the map's lodge seeding) touch any of the above
components' own composition, so none of these figures were expected to move off their last committed state —
confirmed rather than assumed, per this project's own standing rule.

---

## 3 · Density, transfer, LCP — unaffected by this plan, re-confirmed rather than assumed

```
node scripts/measure_density.mjs --port 3100 --out density-home-task6.json
node scripts/measure_density.mjs --port 3100 --url http://localhost:3100/mahua-vann --out density-vann-task6.json
node scripts/measure_density.mjs --port 3100 --url http://localhost:3100/mahua-tola --out density-tola-task6.json
node scripts/measure_page.mjs --port 3100 --out page-home-task6.json
node scripts/measure_page.mjs --port 3100 --url http://localhost:3100/mahua-vann --hero vann-hero --out page-vann-task6.json
node scripts/measure_page.mjs --port 3100 --url http://localhost:3100/mahua-tola --hero tola-hero --out page-tola-task6.json
```

**Density figures for `invitation` (home), `vann-press` and `tola-press` are non-deterministic** — the
Elfsight widget's own carousel autoplays and its rendered height is not fully repeatable between loads
(`docs/reviews/2026-08-26-restructure/density-variance-NOTE.md`). **Do not quote a single run of any of
these three chapters as settled** — the figures below are this task's own fresh measurement, not a promise
they will repeat.

| | page mean | page worst | imagesPerScreen | passes | note |
|---|---|---|---|---|---|
| home | 33% | 61.9% (`invitation`) | 2.08 | all 7 chapters inside 45% | `invitation` read 19.8% this run — within the known variance range (§ above), not a new figure to quote |
| `/mahua-vann` | 45.2% | 80.8% (`vann-press`) | 1.55 | 3 over budget (`vann-forest`, `vann-day`, `vann-press` — all pre-existing, unrelated to this plan) | `vann-rooms` 36.1%/43.7%, matching every prior committed figure exactly |
| `/mahua-tola` | 43% | 83.1% (`tola-press`) | 1.57 | **4** over budget (`tola-reserve`, `tola-day`, `tola-press`, `tola-rooms` — all pre-existing, unrelated to this plan; corrected 28 Aug 2026 — an earlier draft said "3" and omitted `tola-rooms` from the count even though the very next cell discloses it) | `tola-rooms` reads 36.7%/45.3% — `passesWorst` FALSE, matching every prior committed figure exactly (§22.9); not fixed by this plan, not caused by it |

| | transfer / hero `responseEnd` |
|---|---|
| home | hero `responseEnd` 3,877 ms (Slow 4G, 390px); initial transfer 669 KB @390 / 965 KB @1440; whole page 1,042 KB @390 / 1,378 KB @1440 |
| `/mahua-vann` | hero `responseEnd` 2,619 ms (Slow 4G, 390px); initial transfer 447 KB @390 / 670 KB @1440; whole page 552 KB @390 / 838 KB @1440 |
| `/mahua-tola` | hero `responseEnd` 3,186 ms (Slow 4G, 390px); initial transfer 524 KB @390 / 636 KB @1440; whole page 658 KB @390 / 943 KB @1440 |

---

## 4 · `check_rule_in.mjs`, `check_plates.mjs`, `check_films.mjs`

**Corrected 28 Aug 2026, final whole-branch review.** This section's own heading used to group all three
rigs together as "pre-existing/by-design failures, not this plan's" — true for `check_plates.mjs` and
`check_films.mjs`, **false for `check_rule_in.mjs`'s crash**, which was this plan's own regression (check 8
was created by Task 2's fix round and generalised by Task 3's, both inside this plan) and is now fixed, not
merely recorded. Re-run against the same production build this task closed with, all three routes:

```
node scripts/check_rule_in.mjs --port 3100 --out docs/reviews/2026-08-27-mobile/rule-in-home-finalfix.json
node scripts/check_rule_in.mjs --port 3100 --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-27-mobile/rule-in-vann-finalfix.json
node scripts/check_rule_in.mjs --port 3100 --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-27-mobile/rule-in-tola-finalfix.json
node scripts/check_plates.mjs --port 3100 --out plates-task6.json
node scripts/check_films.mjs
```

| rig | result |
|---|---|
| `check_rule_in.mjs` (home) | checks 1–6, 8 **PASS** (25 links covered, the hairline collapses/travels/completes/answers keyboard, reduced motion holds, the `.rule-in`/`.tap` compound proven on both the footer link and the pager under real fine/coarse pointer contexts); **check 7 FAILS**, honestly — `.rule-in--rest` is not dead code, it simply is not rendered on this route (it lives on both property routes via `PropertyInvitation.tsx:99`); the guard message now says so instead of the earlier, incorrect "dead code" claim (`DECISIONS.md` §22.8 #6, §23.5) |
| `check_rule_in.mjs` (`/mahua-vann`) | **FIXED, no longer crashes — PASS, 0 failures, all 8 checks.** Check 8's `TARGETS` previously hardcoded the home page's own pager selector (`#field-days-card-0`); resolved at runtime instead (`a[href$='-card-0']`, which matches the pager's first link on every route because `experienceCardId` always ends that way regardless of the chapter id in front of it). **This is the first time check 7 has ever actually run against a property route on this branch — the resting hairline stands off cream by a luminance delta of 0.700**, a measurement that had never been taken before this fix wave |
| `check_rule_in.mjs` (`/mahua-tola`) | **Also PASS, 0 failures, all 8 checks** — same 0.700 delta, run for completeness alongside the required `/mahua-vann` verdict |
| `check_plates.mjs` | FAILS on all three routes (`0.00%` distortion everywhere is the boards NOT being found, not a passing measurement) — pre-existing since `PlateGrid.tsx` was unrouted 19 Aug 2026 (`DECISIONS.md` §22.8 #5). Not this plan's, not touched |
| `check_films.mjs` | FAILS by design — an uncaught exception (`no film in #field-days`), since no film is mounted on this branch's home page (`DECISIONS.md` §22.2). Not this plan's, not touched |

Full account of both the crash's real cause and the "dead code" mislabel: `DECISIONS.md` §23.5, §23.9.

---

## 5 · Screenshots — all eight shapes, all three routes, read by eye

```
node scripts/_scratch_task6_allshapes.mjs
```

A throwaway Playwright probe (deleted before commit, per this project's own convention for a one-off
investigative capture) — one top-of-page **viewport** screenshot (never an element capture) per (route,
shape) combination, all 8 of `check_responsive.mjs`'s own shapes, all 3 routes = 24 frames, written to
`shapes-task6/`. Each load waited 2.7s for the welcome screen to clear first, matching every prior task's
own convention on this branch.

**The 390 and landscape frames were opened first and specifically** — this project's own standing rule, and
the reason its two worst defects (a 4.3px map label, a continuously shrinking plate board) were both found
this way, not by an assertion:

- **`{home,vann,tola}-phone-390.png`** — the hero holds up cleanly on all three routes: header, wordmark,
  CTA pill, headline, subhead and "the journey begins"/"discover the lodge" mark all sit inside the frame
  with no overflow, no clipped type, no dev-mode indicator.
- **`{home,vann,tola}-phone-landscape.png` (844×390)** — same result at the short, wide shape: full header
  row, headline and CTA all visible, nothing stranded off the bottom edge.
- **`home-phone-360.png`** (narrowest phone) and **`vann-zoom-200.png`** (the narrowest browser-zoom shape,
  720×450) were also opened as a spot check: both clean, no overflow, no dev indicator, hero composition
  intact at the smaller viewport.

**Corrected 28 Aug 2026, a final whole-branch review: every one of these 24 frames is a TOP-OF-PAGE capture,
plainly stated rather than left implicit.** That means every element this plan changed except the header
logo and the CTA pill — the pager, the footer legal links, the press links, and the map — sits below the
fold and appears in NONE of them. No new visual defect was found in what this sweep DID look at, but this
sweep is not what proves "nothing moved" for this plan's own changes, and it was never meant to be read that
way: the four genuine findings this plan traced (§23.8) do not show up in a top-of-page capture — they are
below the fold (the room card stack, the map's legend and labels) or require an OS text-scaling probe rather
than a screenshot (`PropertyContact`) — which is exactly why they were found by `check_responsive.mjs` and
the OS-text-scaling investigation, not by this screenshot sweep, and are recorded in `unmeasured.md` and
`DECISIONS.md` §23.8 instead. **What actually carries the "nothing visible moved" claim for this plan's own
edits is the per-task before/after screenshot comparison** — Task 2's (the footer legal link, the press
link, `.tap`/`.rule-in` at rest) and Task 3's (the pager, before and after `--tap-w`/`--tap-h`), both
confirmed byte-for-byte identical by SHA256, committed alongside the earlier task evidence in this same
directory. This 24-frame sweep is a general clean-bill-of-health for the pages as a whole, not the
verification for this plan's own changes specifically.

---

## 6 · Tests, build, lint, budget, docs

```
npm test
npm run build
npm run lint
npm run verify:budget
node scripts/check_docs.mjs
```

| | result |
|---|---|
| `npm test` | **501 passed, 46 files** — no `lib/media.test.ts` timeout on this run |
| `npm run build` | green (Turbopack, 7 static routes) — run standalone and again inside `verify:budget` |
| `npm run lint` | **0 errors**, the same 5 pre-existing warnings every prior task on this branch has recorded (two `<img>` notes in `SiteMenu.test.tsx`, three unused-parameter notes in `lib/booking/asiatech-provider.ts`) |
| `npm run verify:budget` | **PASS — 167.2 KB brotli first load, 9 files**, unchanged. LIVE at 1440×900: 158 KB untouched / 202 KB after scroll. **Corrected 28 Aug 2026: this was the only headline figure in this document with no committed JSON beside it — every prior body of work on this project committed one.** Re-run with `--out`: `docs/reviews/2026-08-27-mobile/budget-finalfix.json` (171,246 bytes brotli raw first-load payload before rounding — the `167.2 KB` above is that figure rounded the same way every other commit on this project rounds it) |
| `node scripts/check_docs.mjs` | **PASS** — "the documents still describe the repository." Figures it read back: page mean empty 32.9%, `check_experience_strip.mjs` 13 assertions |

---

## 7 · What this task did NOT fix, and why

Four genuine findings, all traced rather than assumed, all left deliberately unfixed — full account
`docs/DECISIONS.md` §23.8, owed-list entry `docs/PROJECT-STATE.md`:

1. **`RoomCardStack`'s room cards clip their own text at 150%/200% OS text scale.**
2. **`PropertyContact`'s email/address block wraps into itself at the same scales.**
3. **The property map's legend column wastes ~1.5 screens of scroll at landscape-phone width (844×390).**
4. **The property map's `<text>` labels are already crowded at rest on both properties, independent of any
   OS text scaling — `Nimdela` into `Zone 3`, `Devada Adegaon` into `Zone 4`, visible in this plan's own
   `mahua-tola-map-390.png` — and, separately, never scale with OS text size at all** (re-led 28 Aug 2026;
   an earlier draft led with the never-scales point and named neither pair).

None touches a composition this plan's own file structure lists as deliberately untouched, and none is a
regression this plan introduced — each is a pre-existing fact about the page, newly measured.

**A fifth thing was found, and it WAS this plan's own regression, fixed in the final whole-branch review's
fix wave (28 Aug 2026), not merely recorded as an instrument gap**: `check_rule_in.mjs --url .../mahua-vann`
used to crash outright (check 8's `TARGETS` hardcoded the home page's own pager selector,
`#field-days-card-0`, which does not exist on the property routes — created by Task 2's fix round and
generalised by Task 3's, both inside this plan, not pre-existing). Fixed by resolving the pager selector at
runtime (`a[href$='-card-0']`); re-run against all three routes — see §4 above for the actual verdicts,
including check 7's first-ever genuine measurement on a property route. Full account — `DECISIONS.md` §23.5,
§23.9.
