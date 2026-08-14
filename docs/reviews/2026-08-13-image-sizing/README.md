# Image sizing — Task 8, the whole-plan verification sweep

14 August 2026. Closes out `docs/superpowers/plans/2026-08-13-image-sizing.md` (`feat/image-sizing`,
cut from `feat/chapters-rebuild`). What shipped, in one paragraph: the home page's three-column plate
board now holds two columns until 1280px so plates keep their size on smaller laptops and at zoom
(Task 1), proven by a new continuous-sweep rig (`check_plates.mjs`, Task 2); five room photographs were
cropped in the image pipeline to 1.50:1 or narrower (Task 3); every room card became a photo-beside-words
composition with the photo side alternating, its crop bound solved per photograph (Task 4), with a ninth
`check_card_stack.mjs` assertion proving the alternation (Task 5); and a click-to-expand room gallery was
built — first on the Popover API, which a rig proved could not work because arrows nested instead of
replacing, then rebuilt on CSS `:target` (Tasks 6–7), costing zero JavaScript. Full narrative for Tasks
6–7's own findings: `docs/DECISIONS.md` §18.

**This task's own finding is the headline, not a footnote: `vann-rooms` and `tola-rooms` now measure well
over the plan's own density ceiling — and, on their worst screen, over non-negotiable #8's general 45%
ceiling too — and all three levers the plan named are spent with zero measured effect. This is now an open
question for the client, recorded but not resolved. See §2.**

Every number below is re-derivable: `npm run build && npx next start -p 3100`, warm with one navigation
per route, then the commands in each section. Raw evidence lives beside this file — `plates.json`,
`card-stack.json` / `card-stack-no-recede.json`, `gallery.json`, `image-resolution*.json`,
`density-vann.json` / `density-tola.json` (home's own is `docs/reviews/2026-08-03-chapters/density.json`,
the rig's own default path), `transfer-home.json` / `transfer-vann.json` / `transfer-tola.json`,
`js-budget.json`, `plates-notes.md` (Task 2's watched-failing record), `crops/` (Task 3's before/after
strips), `screens/` (this task's own captures).

---

## 1. The full measured pass

### 1.1 Gate commands

```
npm test -- --run      → 41 files, 461 tests, exit 0
npx tsc --noEmit        → exit 0
npm run lint             → exit 0 (5 pre-existing warnings, unrelated: SiteMenu.test.tsx <img>,
                             lib/booking/asiatech-provider.ts unused params)
npm run build            → 7 routes, exit 0
```

Run twice: once before any Task 8 work, once again as the final gate on the shipped (unmodified)
tree, after the density investigation in §2 concluded with the working tree reverted to exactly the
Task 5 commit. Both green, 461/461.

### 1.2 `check_plates.mjs` — Task 1/2's own rig

```
node scripts/check_plates.mjs --port 3100
```

```
/              boards=forest,rooms,details samples=143 worstDistortion=0.29% forest:floor=0.8734 rooms:floor=0.681 details:floor=0.8742
/mahua-vann    boards=(none) samples=143 worstDistortion=0.00%
/mahua-tola    boards=(none) samples=143 worstDistortion=0.00%

PASS
```

Run three times across this task (baseline, after the density investigation, and as the final gate).
**Two of the three runs passed clean; the middle one reported 15 `naturalWidth/Height is 0` failures on
`details` and `rooms` at scattered widths, with `forest`'s own distortion figure unchanged (0.29%).**
This is not a real regression — it is the exact intermittent lazy-image decode race Task 2's own ledger
already flagged as a deferred minor (`progress.md`: *"a pre-existing intermittent lazy-image decode race
can make assertion 1 report 'image never finished loading' at one sample; non-reproducing... Watch if the
rig starts flaking."*). It flaked once, mid-session, while several Playwright browsers were running
concurrently on this machine for other measurements in this same task; re-run immediately after with no
other load on the box, it passed clean with byte-identical figures to the very first run
(`forest:floor=0.8734 rooms:floor=0.681 details:floor=0.8742`, `worstDistortion=0.29%`). The clean run is
what's committed as `plates.json`. Watched-failing evidence for the two sabotage arms is unchanged from
Task 2's own `plates-notes.md`, not re-run here.

`forest`'s floor (87.34% of 1440-reference width at 1280×720) and `details`'s (87.42%) both clear the 85%
rule; `rooms`'s floor (68.1% at 1024×768) clears its exempted 65% (the board is already at its minimum
column count, per the spec's own recorded, looked-at-and-accepted case).

### 1.3 `check_card_stack.mjs` — both arms, Task 4/5's rig, plus assertion 9

```
node scripts/check_card_stack.mjs --port 3100
node scripts/check_card_stack.mjs --port 3100 --no-recede
```

Both PASS, all nine assertions, six widths (390/768/1024/1280/1440/1920), both routes. Text legibility
(assertion 8) is 3/3 on Vann and 4/4 on Tola at every width, unchanged from the 11 Aug card-stack
baseline. Assertion 9 (alternation) confirmed at every `lg`+ width on both routes — even indices'
photo-wrapper centre left of the card's own centre, odd indices' right, e.g. Vann at 1440:
`[left, right, left]`; Tola: `[left, right, left, right]`. Worst measured width-crop across the whole
sweep: **24.034%** (Tola's Suite at 1280px), independently recomputed here from the raw JSON and matching
Task 5's own figure, comfortably inside the 25% ceiling.

### 1.4 `check_room_gallery.mjs` — Task 6/7's rig

```
node scripts/check_room_gallery.mjs --port 3100
```

PASS. All checks: lazy-until-opened (`a1`), open (`a2`), next/prev navigation (`a3`), close (`a4`),
backdrop dismiss (`a5`); no-JS open/dismiss on both routes at both widths; the welcome-collision probe
(`midHold: welcomeZ=90 galleryZ=60 topmostIsWelcome=true`) on all four route/width combinations; the
wide-viewport overflow check `0px` at 1920×1500 and 2400×1800 on every room, both routes. Identical to
Task 7's own closing figures — nothing in Tasks 1–5 or this task touches the gallery mechanism.

### 1.5 `check_image_resolution.mjs` — all three routes

The rig measures one route per invocation and defaults to `/`; **it was run three times, once per
route**, because the brief's own caution about a rig defaulting to a route it wasn't built for applies
here too — the whole point of this sweep is the room photographs, which exist only on the two property
routes, so a single default-route run would have measured everything except the images this plan
actually touched.

```
node scripts/check_image_resolution.mjs --port 3100                                          # /
node scripts/check_image_resolution.mjs --url http://localhost:3100/mahua-vann              # /mahua-vann
node scripts/check_image_resolution.mjs --url http://localhost:3100/mahua-tola              # /mahua-tola
```

| route | images (every viewport) | under-served by `sizes` | at the library's ceiling |
|---|---|---|---|
| `/` | 41 | **0** | 3–9, by viewport/DPR |
| `/mahua-vann` | 21 | **0** | 1–12 |
| `/mahua-tola` | 24 | **0** | 2–14 |

Zero under-served images anywhere, at every viewport swept (390@1x, 390@3x, 768, 1440, 1920). The
"at the library's ceiling" bucket is where Task 3's three accepted-soft crops land: `vann-room-deluxe`,
`tola-room-deluxe` and `tola-room-suite` (the 762×508 crops from 1163px web exports), measured serving
**0.60–0.67** of the resolution their drawn box would ideally want at 1920px (upscaled roughly 1.5–1.67×)
— softer than the spec's own back-of-envelope 1.11×/1.28×, because the *beside* composition's `xl:65%`
share draws a wider box than the spec's worked example assumed, but still correctly bucketed as
*at ceiling* rather than *under-served*: `check_image_resolution.mjs` reports these as the accepted,
known-soft population the spec named, not a new failure, and `understatedSizes` is empty at every
viewport on every route. This is the client-accepted risk from spec §0 ruling 2 — *"if it still looks
blurry on a large screen I'll let you know"* — not a new finding; recorded here with real numbers so the
next session doesn't have to re-derive them.

### 1.6 `measure_density.mjs` — all three routes

See §2 in full; the summary line: **home page inside the ceiling everywhere (unchanged verdict, one
attributable drift); both property pages' rooms chapters breach the plan's own ceiling and, on their
worst screen, the general one.**

### 1.7 `measure_page.mjs` — transfer, all three routes

```
node scripts/measure_page.mjs --out docs/reviews/2026-08-13-image-sizing/transfer-home.json
node scripts/measure_page.mjs --url http://localhost:3100/mahua-vann --hero vann-hero --out .../transfer-vann.json
node scripts/measure_page.mjs --url http://localhost:3100/mahua-tola --hero tola-hero --out .../transfer-tola.json
```

The brief's own reason for including this: Task 4's `box` fix makes every room photograph request
roughly 1.31× more width at `lg`+ (≈1.7× the pixels), and those photographs are below the fold — so they
land in *whole page scrolled*, not *initial load*, but CLAUDE.md publishes both per width and neither
had ever been measured per-route with this rig before.

| route | width | **initial load** | whole page scrolled | hero `responseEnd` (Slow 4G) |
|---|---|---|---|---|
| `/` | 390 | **601 KB** ✓ | 2,965 KB | 3,840 ms |
| `/` | 1440 | **725 KB** ✓ | 3,862 KB | — |
| `/mahua-vann` | 390 | **425 KB** ✓ | 960 KB | 2,705 ms |
| `/mahua-vann` | 1440 | **663 KB** ✓ | 1,394 KB | — |
| `/mahua-tola` | 390 | **694 KB** ✓ | 1,176 KB | 3,716 ms |
| `/mahua-tola` | 1440 | **706 KB** ✓ | 1,575 KB | — |

**Initial load moved nowhere near the 1.5 MB ceiling on any route at either width** — the property
routes' initial loads sit at 28–49% of budget, well inside it even before accounting for headroom. The
room photographs' 1.31× width increase is real but entirely absorbed by *whole page scrolled*, exactly as
the brief predicted, and that figure is not gated by non-negotiable #6 (the 4 Aug ruling: initial load is
what a visitor pays before scrolling). **No finding against non-negotiable #6.** The home page's own
figures (601/725 KB initial) are ~2 KB above the last-recorded 599/723 KB — inside ordinary measurement
noise, not a regression; nothing in this plan touches the home page's first-screen imagery.

### 1.8 `verify:budget` — the JS delta

```
npm run verify:budget -- --no-build --out docs/reviews/2026-08-13-image-sizing/js-budget.json
```

```
650.7 KB raw   193.9 KB gz   168.2 KB br   FIRST LOAD JS over 9 files
PASS
```

**172,272 bytes brotli measured, against the 172,209 baseline CLAUDE.md cites — a delta of +63 bytes.**
The brief is explicit that an unexplained delta is a finding, not a footnote, so it was chased down
rather than waved through:

- **Reproducible, not noise.** Two independent clean rebuilds (`rm -rf .next && npm run build`, no
  source changes between them) both measured exactly 172,272 bytes. The number is stable.
- **Localised to two chunks.** Diffing this run's file list against `docs/reviews/2026-08-11-card-stack/
  js-budget-final.json` (the 172,209 baseline, 9 files) shows seven files byte-identical and two changed:
  one grew 23,312→23,459 raw bytes (+147, +41 br) and the other 15,498→15,560 raw bytes (+62, +22 br) —
  **41 + 22 = 63**, the whole delta, on chunks whose content hash also changed (confirming real content
  moved, not just a renumbered build artefact).
- **Not this task's doing, and not even this plan's.** `git log` shows `feat/image-sizing` was cut from
  `feat/chapters-rebuild` *after* two commits from a sibling session's own work landed there —
  `e12af07` ("a softer scroll, and a slow zoom inside a frame that never moves") and `c4752e7` (a caption
  fix for the same zoom). `e12af07`'s own commit message states its cost outright: *"+63 bytes of
  first-load JavaScript."* Byte-for-byte the same number. Both commits touch only `app/globals.css` (plus
  `lib/motion.ts`'s new `SCROLL` dial) — never `PlateGrid.tsx`, `RoomCard.tsx`, `RoomCardStack.tsx`, or
  any file this plan's own tasks changed. Task 6's own report had already flagged the shape of this gap
  without chasing it (*"this session's verify:budget reads 168.2 KB br rather than CLAUDE.md's cited
  172,209 B — that gap predates this task"*) — it predates Task 6 too, for the same reason: it was already
  sitting on the shared branch base before Task 4 or Task 6 ever ran.

**Verdict: the +63 bytes is real, explained, and belongs to work outside this plan's scope** (the other
session's hover-zoom feature, explicitly scoped to `app/page.tsx`'s home route and stated by its own
author to cost exactly this). CLAUDE.md's cited 172,209 figure needs updating to 172,272 with this
attribution, not chased as a defect of this plan. Comfortably under the 175 KB ceiling either way
(168.23 KiB against 175 KiB, 96.1% headroom used).

### 1.9 Screenshots — look with your eyes

`docs/reviews/2026-08-13-image-sizing/screens/`: the three home boards (`home-forest`, `home-rooms`,
`home-details`) at the seven review widths as full-chapter captures; both property rooms chapters
(`vann-rooms-resting-*`, `tola-rooms-resting-*`) at the same seven widths, captured as a real viewport
screenshot at the chapter's own *resting* scroll position (see below for why); one gallery panel open at
1440 and at 390 (`vann-gallery-*`).

**A capture defect found and fixed along the way, itself worth recording.** The first pass captured the
rooms chapters with Playwright's `elementHandle.screenshot()`, the same method used for the (non-sticky)
home boards. It produced a screenshot missing the first card entirely — a large blank gap where "Deluxe"
should have been, only "Cottage without Deck" and "Cottage with Deck" visible. Cause: `position: sticky`
cards render wrong under that capture method, because Chrome's beyond-viewport element capture recomputes
sticky offsets against a synthetic tall viewport rather than a real scroll position — exactly the reason
`measure_density.mjs` and `check_card_stack.mjs` both sample by *scrolling to a real position* rather than
capturing an element in one shot. Fixed the same way: scroll to the chapter's own resting position (every
card piled up, matching `check_card_stack.mjs`'s own `resting@` scrollY) and take a real viewport
screenshot there. The misleading captures were deleted, not kept alongside the corrected ones.

**What the eye finds, having looked:**

- **Every word is legible everywhere sampled**, matching `check_card_stack.mjs`'s own 3/3 and 4/4
  legibility figures. No photo band swallows a card's text at any of the seven widths, either route.
- **The alternation is genuinely visible at `lg`+**, not just true in the geometry. Vann's `1440x900`
  resting shot shows "Cottage with Deck" photo-left (even index); Tola's shows "Family Suite"
  photo-right (odd index, its own even/odd neighbours alternating above it).
- **The density finding is visible, not just measured.** `vann-rooms-resting-1024x768.png` and
  `tola-rooms-resting-1440x900.png` both show a card whose text block (heading, one line of
  description, one line of facts) occupies roughly the top third of the card's own height, with a plain
  block of bare cream filling the rest of the text column beside a photograph that fills its own side
  edge-to-edge. This is precisely what §2's numbers describe, and it reads, by eye, close to the kind of
  "too much empty space" complaint non-negotiable #8 exists to catch — at `1024x768` and `1440x900`
  specifically, the widths the client has named as his current lens.
- **The gallery panel looks right open**, both widths: the photograph large and central, the room name
  and facts legible in ink on solid paper beneath it, Previous/Next/Close all present and legible, no
  clipping or overlap with the header or booking bar.
- **The home boards' 1024–1279 reflow reads as intended.** `home-forest-1024x768.png` shows the two-column
  stagger Task 1 built — large plates, no squeeze — and `home-details-1024x768.png` shows the
  client-accepted two-wide *Details* stack, both matching the design's own worked figures.

---

## 2. The density finding — measured, levers exhausted, unresolved

### 2.1 The numbers

Measured against the shipped, unmodified build (`node scripts/measure_density.mjs --url
http://localhost:3100/mahua-vann` / `.../mahua-tola`), three times across this task (baseline, after each
padding-trim attempt) — identical every time:

| chapter | plan's own ceiling (spec §2) | **measured** | over by |
|---|---|---|---|
| `vann-rooms` mean | ≤ 31.5% | **43.9%** | **+12.4 pp** |
| `vann-rooms` worst | ≤ 42.1% | **49.4%** | **+7.3 pp** (also +4.4 pp over the general 45% ceiling) |
| `tola-rooms` mean | ≤ 33.8% | **44.3%** | **+10.5 pp** |
| `tola-rooms` worst | ≤ 44.3% | **50.1%** | **+5.8 pp** (also +5.1 pp over the general 45% ceiling) |

Both chapters' *worst screen* is over non-negotiable #8's general 45% ceiling, not only over the plan's
own stricter figure — this is not a case of a chapter narrowly missing its own history but comfortably
inside the page-wide rule; it is over the rule every chapter on the site is required to clear.

Every other chapter on both property routes is unchanged from the last recorded figures within rounding
(`vann-forest` 55.8% — exact match to the 9/10 Aug figure; `tola-reserve` 58% against 58.3%; `vann-press`
87% against 87.2%) — these three remain the pre-existing, already-accepted-as-open overages from Plan 7's
close-out (`docs/DECISIONS.md` §1, Task 15 entry), untouched by this plan, not a new finding.

### 2.2 The home page, for completeness

Page mean moved **36.6% → 37.9%** (+1.3 pp), worst screen unchanged at **73.4%** (still the
`field-days`/`rooms` join), all twelve chapters still inside the 45% ceiling, imagery share unchanged at
54.2%. Per-chapter figures that can be cross-checked against CLAUDE.md's own table are unchanged to within
rounding (`forest` 12.4% exact; `lantern-hour` 36.5% vs 36.4%; `rooted` 39.8%/44.5% vs 39.7%/44.5%) —
**Task 1's own reflow moves nothing at 1440×900**, exactly as the brief predicted, because the reflow only
changes column count in the 1024–1279 band and density is measured at a fixed 1440×900. The small page-mean
drift traces to the same sibling commits identified in §1.8 (`e12af07`/`c4752e7`, CSS-only, landed on
`feat/chapters-rebuild` before this plan's branch point) rather than to anything in this plan.

### 2.3 The levers, pulled in the brief's own order, each measured

**(1) Confirm the `xl` share is 65%.** True by inspection (`RoomCard.tsx`: `lg:w-[60%] xl:w-[65%]`) —
already at the value the brief names; nothing to pull here without reopening the client's own 13 Aug
geometry ruling.

**(2) Trim the words block's vertical padding at `lg`+.** Tried both steps the brief names,
`py-6 → py-5` and `py-6 → py-4`, each rebuilt and re-measured in full on both routes:

| build | `vann-rooms` mean/worst | `tola-rooms` mean/worst |
|---|---|---|
| baseline (`py-6`) | 43.9% / 49.4% | 44.3% / 50.1% |
| `lg:py-5` | 43.9% / 49.4% | 44.3% / 50.1% |
| `lg:py-4` | 43.9% / 49.4% | 44.3% / 50.1% |

**Zero measured effect at either step, confirmed twice.** `check_card_stack.mjs` was re-run on the
`py-4` build to confirm assertion 8 (text legibility) still held — it did, identically (3/3 Vann, 4/4
Tola, same recede/opacity figures at every width). The reason is structural, not a measurement fluke: the
card's own height is set by `ROOM_STACK`'s `min()` formula (see lever 3, below), not by its content, so a
short room description sits inside a fixed-height text column regardless of how tight its own padding is
— an 8–16px trim against a ~650–670px-tall card is below what the density rig's 6px sample grid and
1-decimal reporting can even register as a *different* number, let alone close a 10+ point gap. **Reverted
to the shipped `py-6`** before the final gate — a change with zero measured benefit was not worth leaving
in the diff.

**(3) `ROOM_STACK.heightMax` 760 → 720.** Not rebuilt, because a rebuild cannot tell this lever anything a
measurement already in hand doesn't: `check_card_stack.mjs`'s own committed geometry
(`card-stack.json`) reports `.room-stack`'s total height at 1440×900 as 2007px over 3 Vann cards (669px
each) and 2620px over 4 Tola cards (655px each) — both **below** 760, meaning `--room-card-height: min(svh
formula, heightMax)` is already resolving to the `svh`-based slack term, not the ceiling, at the exact
viewport `measure_density.mjs` uses. Since 669 < 720 < 760 and 655 < 720 < 760, `min(x, 720)` and
`min(x, 760)` are the same value for both routes' real `x` — lowering the constant cannot change anything
at 1440×900 by construction, not by assumption; the `x` itself is a measured fact, not a guess. (It would
begin to bind on a viewport tall enough that the `svh` term itself exceeds 720px — well past every review
width this project measures.)

**All three named levers are now spent.** Lever 1 has no room left to give without reopening the client's
own composition; levers 2 and 3 move the number by zero, one confirmed by two separate rebuilds and the
other by geometry already on record.

### 2.4 What this is, and what it is not

This is the same trade the spec's own §2 named as a known risk before any code was written: *"a
side-by-side card's text column carries more bare paper than a stacked card's text band"* — and the
number that risk produced is larger than the levers on offer can close. It is **not** a bug in the
implementation: Tasks 4 and 5 built exactly the composition the client asked for on 13 Aug (*"place the
image and room detail text side-by-side ALTERNATELY"*), the crop bound is correctly solved, the
alternation is correctly measured, and nothing here contradicts any of that. It is the client's own
composition measuring against his own density ceiling, and coming up short — the spec's own explicit
contingency (§2: *"if every lever is spent and the line still cannot be held, the numbers go to the
client with the choice — his composition against his density ceiling is his trade to make, not one to
make for him quietly"*).

**This session has no interactive channel to put that choice to him** (no `AskUserQuestion` tool is
available to this task), so per the brief's own instruction — *"STOP and report — do not ship over the
line and do not adjust the rule. The client owns that trade, not you"* — that is exactly what this
section does: report the measured numbers, the exhausted levers, and stop. **Nothing in this plan's own
committed code (Tasks 1–7) has been altered by this finding** — the beside/alternating composition ships
as the client asked for it — but the density line is now known, honestly, to be over, and the choice
among his own options is recorded as open in `docs/DECISIONS.md` §5 and `docs/PROJECT-STATE.md`, not
answered here. His options, for when he is asked: accept the higher density as the cost of the
side-by-side composition he chose; shorten the text column's content (fewer facts, a shorter line) so it
fills more of the fixed height; or revisit the fixed-height card mechanism itself (a larger, more invasive
change than anything this task is scoped to make unilaterally).

---

## 3. What was NOT touched

`components/ui/Plate.tsx` and `components/ui/Photo.tsx` — confirmed untouched (`git diff` against the
Task 5 commit for both files is empty). The two padding-trim experiments in §2.3 were both reverted;
`components/sections/RoomCard.tsx` is byte-identical to its Task 5 commit at the point this task's own
commit is made. No component, dial, or content file was changed by this task — only the evidence in this
directory, `docs/DECISIONS.md`, `docs/PROJECT-STATE.md` and `CLAUDE.md`.
