# The coverflow goes linear — three client changes, measured apart

18 Aug 2026. Three reports on the shipped coverflow, two of which **reverse rulings the client himself made
in the previous forty-eight hours**, and all three of which move the same numbers. They are measured
separately here for exactly that reason.

Everything below is a production build on `:3110` at 1440×900 unless it says otherwise. The header is 107px,
the stage `100svh − header` = 793px, and the card 1217 × 685 at every width from 1313px up.

| the change | his words | what it is |
|---|---|---|
| **1 · linear** | *"let's make it linear and just keep it 01 to 06 … no card placed before it … no card placed after it"* | both flank ghosts deleted, and the arrows with them |
| **2 · slower** | *"the scroll now feels very snappy, replace it with the smoother scroll effect we used previously … but just make it a bit slower"* | `scroll-snap` gone; `COVERFLOW.screens` 2 → 3 |
| **3 · snug** | *"a lot of margin and gap … which makes the carousel feel disconnected"* | `ChapterSurface tight`, and the wrapper's own top margin halved again |

**The headline: `field-days` reads 28.6% mean / 40.4% worst empty, against 26.4% / 41.0% before.** The worst
screen — the field non-negotiable #8 binds on — is **0.6 points better** than the build it replaces, and the
page's own worst screen is **4.5 points** better (71.4% → 66.9%). Every intermediate figure below is stale;
only the last row of §5 is current.

---

## 1. The ghosts, measured on their own

**Measured first and alone, because the risk was that they were load-bearing.** They were worth **9.3 points**
of worst-screen empty when the cards were 900px (`density-sweep.md` §2): the pin's first and last screens
held one card by itself, and a ghost at the flank filled them. The card is 1217px now, so a lone card is far
denser and the loss should be smaller — but it is a loss, and the chapter was passing with four points in
hand.

Arm A is the shipped build; arm B is the same build with the two ghosts deleted and **nothing else changed**
— snapping still declared, `screens` still 2.

| | `field-days` mean | worst | page mean | page worst | screens over 45% | images/screen |
|---|---|---|---|---|---|---|
| A · as shipped, 17 Aug | 26.4% | **41.0%** | 35.6% | 71.4% | 29 | 2.18 |
| B · ghosts removed | 28.8% | **44.4%** | 35.9% | 71.4% | 30 | 2.18 |
| | **+2.4** | **+3.4** | +0.3 | 0 | +1 | 0 |

**They cost 3.4 points of worst-screen empty, not 9.3**, and the chapter still passes — at 44.4% against the
45% ceiling, with 0.6 points of margin. That margin is what changes 2 and 3 then had to be judged against;
on its own it would have been too thin to ship.

`distinctImages` is 39 in both arms and `imagesPerScreen` is 2.18 in both, so none of the difference is an
image appearing or disappearing — it is two rectangles of photograph leaving the flanks at the two ends of
the pin.

### 1.1 The arrows went linear too, and that is a ruling rather than his words

He asked about the **cards**. The arrows are the same navigation by another route: a "previous" on card 01
that jumped to card 06 would be the wrap-around he has just removed, arriving where he was not looking. His
own sentence for how to get back is *"they will have to scroll back to card 01"* — the scroll, not a button.

So `coverflowNeighbours` returns `{ previous: number | null, next: number | null }`, and the two end cards
render one arrow each. **`null`, never `-1`**: the retired wrapping implementation existed precisely because
the naive `(index − 1) % count` returns `-1` at index 0, an href pointing at an id no element carries. A
sentinel would have brought that back by choice — `-1` is a `number`, so `experiences[previous]` compiles,
yields `undefined`, and surfaces two components away as a blank label. `null` is not a `number`, so both
call sites had to say what they do about the end of the carousel before `tsc` would build.

`lib/coverflow.ts`'s `coverflowWindow()` was deleted in the same edit. It described a percentage-based
scheme two supersessions old, it was imported by nothing but its own test, and its prose had been marked
retired since 17 Aug. The live arithmetic is `--cf-step` in `app/globals.css`.

### 1.2 What the ghosts did NOT take with them

The **end-holds** — activity 01 centred while the stage rides in, activity 06 centred while it rides out.
Those moved off the ghosts and onto the two real end cards on 17 Aug, for an unrelated reason, and that
ordering is the whole reason this change was cheap. Without them the chapter measures **74.3% mean / 87.1%
worst** (`app/globals.css`'s own note), because a sticky stage is on screen for its own height at each end
and the deck is parked off-stage through both.

The `count − 1` step denominator stayed too. The ghosts were placed by the *shared* window formula, one step
outside each end, so deleting them left every real card's window exactly where it was: the anchor targets
land **1.00px** worst across the continuous 360–1920px sweep, against 1.90px with the ghosts on the stage.

---

## 2. The snap, and what it was doing to the instrument

`scroll-snap-type: y proximity` on `html` and `scroll-snap-align: start` on the six targets are gone. So is
the 1×1px box on `.coverflow-target`, which existed for **one** reason — a zero-area snap area is not a snap
area — and is back to `width: 0; height: 0`. **A fragment target needs a position, not an area**, and that is
asserted rather than argued: `check_coverflow.mjs` drives the page by clicking those targets at 79 widths and
reads 1.00px worst off-centre at 0×0, the same figure it read at 1×1.

### 2.1 It was flattering the density rig by 1.8 points

`measure_density.mjs` samples every 150px with `window.scrollTo`, and `proximity` snapping applies to
programmatic scrolls. Arm C is arm B with the snapping removed and nothing else:

| | `field-days` mean | worst | page mean |
|---|---|---|---|
| B · snapping declared | 28.8% | 44.4% | 35.9% |
| C · snapping removed | **30.6%** | 44.4% | 36.2% |

**1.8 points of the shipped chapter's mean was the browser pulling the density rig's own samples onto the six
centred moments** — the densest positions in the pin. The worst screen is untouched, which is consistent: the
emptiest window is not near a snap point either way. It is the same defect `rig-failures.md` §20.1 found in
`check_coverflow.mjs`'s sweep, in a second instrument, and nobody looked for it there.

Nothing about the page was wrong; the number was. Any comparison against a figure measured before 18 Aug
should carry this 1.8 points.

---

## 3. The pace sweep — `screens` 2 / 2.5 / 3

Run on the linear, unsnapped deck. Each row is a real build, a real density run and a real geometry probe.

**Three distances, because the window widened to four steps on 16 Aug and the old "arc" figure no longer
means what it did.** `step` is centre to centre. The *visible arc* is flank to flank, two steps, which is what
a visitor watches a card travel across the stage. The *whole window* is four steps, off-right to off-left,
which is `task-1-timeline-probe.md` §11.4's "arc" and the only figure comparable with the rooms card stack's
~700px.

| `screens` | pin length | step | visible arc | whole window | `field-days` mean | worst | page mean | page worst | images/screen | document |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | 1,007px | **201.4px** | 403px | 806px | 30.6% | 44.4% | 36.2% | 71.4% | 2.18 | 16,083px |
| 2.5 | 1,457px | **291.4px** | 583px | 1,166px | 29.5% | 44.4% | 35.9% | 71.4% | 2.12 | 16,533px |
| **3 — chosen** | **1,907px** | **381.4px** | **763px** | **1,526px** | **29.1%** | **44.4%** | **35.6%** | 71.4% | **2.07** | 16,983px |

**All three pass, so the slowest wins**, which is what the client asked for. 3 is `STICKY_SCREENS_MAX` and
the dial is now spent.

Two things in that table are worth more than the choice:

- **The worst screen does not move at any length.** This dial changes how many screens the pin spends, never
  what is on the emptiest of them. That held from the 16 Aug sweep and is the one figure that did.
- **The mean now moves the RIGHT way, and it used to move the wrong way.** 16 Aug measured 48.4 → 48.9 →
  49.3% at the same three values. Both are right about their own build: **the card was 900px then and is
  1217px now**, so a pin screen used to be emptier than the chapter's average and is now denser than it. A
  sweep is a property of the composition it was run on — this one was re-run rather than quoted, and the
  answer reversed.

**What it costs is `imagesPerScreen`: 2.18 → 2.07.** That is the figure non-negotiable #9 names as the one to
look at rather than the chapter, and `rooted`'s own history is this same trade in the same units, decided the
other way (2.08 → 1.87 was judged indefensible, and shortening the pin bought back to 1.98). The difference
is that a longer pin there bought nothing anybody had asked for. **If 3 reads as too slow on his machine, 2.5
is one number and costs nothing else measured.**

### 3.1 Every card still centres inside the pin at 3 screens

Measured, not assumed — the pin release moves with `screens` and the anchor targets are placed from the same
step:

| | |
|---|---|
| pin | locks at scrollY **6,844**, releases at **8,751** (1,907px) |
| the six centred moments | 6,843 · 7,226 · 7,607 · 7,988 · 8,370 · 8,753 |
| first vs the lock | on it |
| last vs the release | on it |
| worst distance from centre, all six bisected | **0.96px** at 1440×900, **0.30px** at 390×844 |
| continuous sweep, 79 widths × 2 targets | worst off-centre **1.00px** |

The first and last centred moments sit on the pin's own two edges by construction (`--cf-step` is
`pin-len / (count − 1)`), so **no card can reach centre outside the pin at any length** — which is the
property that had to be re-checked, since lengthening the pin is exactly the edit that could have broken it.

---

## 4. Snug — where the gaps actually were

His third report names two gaps and a feeling: *"a lot of margin and gap between the carousel cards and the
section heading and text (and the animated tiger) … and the next section 05 · The Rooms, which makes the
carousel feel disconnected."*

Measured at 1440×900 before touching anything:

| | before | after | what it is |
|---|---|---|---|
| header band's foot → the wrapper | 40px | **16px** | `.coverflow`'s own `mt-8 lg:mt-10` → `mt-3 lg:mt-4` |
| inside the stage, above the card | 54px | 54px | **structural — see §4.1** |
| **tiger's tail → the first card's top** | **94px** | **70px** | |
| inside the stage, below the card | 54px | 54px | structural |
| chapter's own bottom padding | 80px | **56px** | `ChapterSurface tight` |
| `05 · The Rooms`'s own top padding | 80px | 80px | not this chapter's to spend |
| **last card's foot → `05 · The Rooms`'s chapter mark** | **214px** | **190px** | |

`tight` is `py-10 md:py-12 lg:py-14` against the default `py-14 md:py-16 lg:py-20`; it is opt-in per chapter,
it is the same dial three property-page chapters already use, and it also takes 24px off the **top** of this
chapter — the `forest / field-days` join, which is the page's own worst screen.

### 4.1 The stage's 54px is not a dial, and this is why

The obvious place to find the rest of the space is the cream a centred card leaves inside the stage. It was
measured, considered, and left alone on two arithmetic grounds:

1. **It is not a constant — it is what is left over.** The stage is `100svh − header` and the card is
   `cardWidth × 9/16`, capped at 685px. At 1440×900 that leaves 54px above and below; **at 1440×800 it leaves
   8px**, and at 1440×760 the card is taller than the stage already. Any fixed shortening therefore overflows
   the card on a laptop 100px shorter than the one it was tuned on, inside an `overflow: hidden` box — which
   is this project's own repeat defect (`DECISIONS.md` §2 #44-45, #52-53), a value tuned at one sample and
   broken at another.
2. **It enters the pin window directly.** The pin releases at `T + trackHeight − stageHeight`, so
   `--cf-pin-len` would have to become `screens × 100svh − --cf-stage-h` in the same edit, and the sticky
   `top` would have to move down by half of whatever came off or the card stops being centred in the viewport.
   §20.2 records what a flat `100svh` does here: the last card centres **11px after the pin has released**.

Both notes are written at `--cf-stage-h` in `app/globals.css`, where somebody will next reach for it.

### 4.2 What it is worth, isolated

Arm E is `screens: 3` with the old spacing; arm F is the same build tightened.

| | `field-days` mean | worst | page mean | page worst | screens over 45% |
|---|---|---|---|---|---|
| E · `screens: 3`, old spacing | 29.1% | 44.4% | 35.6% | 71.4% | 30 |
| F · tightened | **28.6%** | **40.4%** | **35.3%** | **66.9%** | **28** |
| | −0.5 | **−4.0** | −0.3 | **−4.5** | −2 |

**72px of removed cream is worth four points of this chapter's worst screen and four and a half of the
page's.** The page's worst screen is still the `forest / field-days` join at 66.9% — it belongs to no chapter,
it is where the client's four deleted photographs used to be, and 24px of this chapter's top padding is all
this file could reach of it.

### 4.3 Read by eye, at 1440 and 1920

Screenshots opened, not merely measured, because *"feels disconnected"* is not a number.

**Arrival.** Before: the lead ghost's dark sliver sits hard against the left edge of the screen while the
band is still on it, which reads as a photograph half-off the page rather than as a carousel. After: clean
cream to the card's left, and the tiger's tail sits 70px above the card's top edge instead of 94. The band's
own internal hole — the paragraph ends and the 400px tiger keeps going — is unchanged and is **not** this
chapter's to fix: the only lever is the drawing's own width, one line in `app/page.tsx`, recommended in
`geometry.md` §6 and still outside this pass.

**Departure.** Before: card 06 with both arrows, then 134px of cream, the surface step, and `05 · The Rooms`
90px later. After: card 06 carries **"PREVIOUS" alone** — the hairline runs the full width with one label
under it and reads as deliberate rather than broken — then 110px, the surface step, and the rooms mark.
1920 reads identically; the container is wider and nothing about the join changes with it.

**The tiger did not move and is not crowded.** `check_films.mjs` at six widths: 0/12 covered positions,
corners within 1 level of the chapter's cream, play-once and hover-replay both intact.

**Not taken further.** `mt-3 lg:mt-4` could go to zero for 16px more. It is left because the band's height is
the film's 400px, and a wider tiger — the standing recommendation for this band — would then put the drawing
against the card.

---

## 5. The three changes together, and the one number that went the wrong way

| state | `field-days` mean | worst | page mean | page worst | images/screen |
|---|---|---|---|---|---|
| as shipped, 17 Aug | 26.4% | 41.0% | 35.6% | 71.4% | 2.18 |
| + ghosts removed | 28.8% | 44.4% | 35.9% | 71.4% | 2.18 |
| + snapping removed | 30.6% | 44.4% | 36.2% | 71.4% | 2.18 |
| + `screens: 3` | 29.1% | 44.4% | 35.6% | 71.4% | 2.07 |
| **+ tightened — shipped** | **28.6%** | **40.4%** | **35.3%** | **66.9%** | **2.08** |

`field-days` **passes**, with 4.6 points in hand, and its worst screen is better than the build this replaces
while carrying two fewer photographs on the stage and 900px more pin.

### 5.1 `rooms` now reads 46.5% worst, and it is the sampling grid

`05 · The Rooms` was 39.6% worst before this work and reads **46.5%** after it. **Nothing in that chapter
changed**, and the arms prove it rather than assert it:

| arm | doc height | `rooms` | `lantern-hour` | `guests` | `details` |
|---|---|---|---|---|---|
| A · shipped | 16,083px | 33.8/39.6 | 33.9/36.0 | 39.5/40.7 | 40.6/40.6 |
| B · ghosts out | 16,083px | 33.8/39.6 | 33.9/36.0 | 39.5/40.7 | 40.6/40.6 |
| C · snap out | 16,083px | 33.8/39.6 | 33.9/36.0 | 39.5/40.7 | 40.6/40.6 |
| D · `screens: 2.5` | 16,533px | 33.8/39.6 | 33.9/36.0 | 39.5/40.7 | 40.6/40.6 |
| E · `screens: 3` | 16,983px | 33.8/39.6 | 33.9/36.0 | 39.5/40.7 | 40.6/40.6 |
| **F · tightened** | 16,911px | **37.1/46.5** | 37.0/41.8 | 40.7/43.8 | 41.4/41.4 |

**`screens` moved the document by 450px and 900px and did not move one figure below this chapter.** Both are
multiples of `measure_density.mjs`'s own 150px sampling step, so every downstream chapter was sampled at the
same phase. The tightening removes **72px**, which is not, and every chapter below `field-days` is therefore
sampled at different offsets — `rooms` picks up a window at scrollY 9,750 that the 150px grid had been
stepping over.

`rooms` is 1,436px tall, so **three or four 900px windows fit inside it** and its "worst" is one of them. The
same chapter moved 44.8% → 39.6% on 17 Aug for the same reason, and `geometry.md` §2.2 says of that pair:
*"Do not report those two as fixed."* The converse holds here: this is not a regression in the rooms chapter,
and it must not be reported as one.

**It is not tuned away either.** Choosing a tightening that happens to be a multiple of 150px would be
composing the page to suit the instrument, which is the failure mode `DECISIONS.md` §2 catalogues. If the
figure matters, the lever is in `05 · The Rooms` — or a finer sampling step, which measures the same page
more honestly and would move several chapters at once.

### 5.2 A finer step finds more empty space in five chapters, and none of it is this work's

The last sentence above was worth checking rather than leaving as a guess, so the shipped build was measured
again at `--step 50` — 322 sampled screens instead of 108, on the same build, same viewport:

| chapter | worst at step 150 (committed) | worst at step 50 | touched by this work? |
|---|---|---|---|
| `lodges` | 48.6% | 48.6% | no |
| `rooted` | 44.5% | **47.3%** | no |
| `field-days` | 40.4% | **47.9%** | yes |
| `rooms` | 46.5% | 46.5% | no |
| `guests` | 43.8% | **48.6%** | no |

**Every figure this project has ever quoted against non-negotiable #8 is a 150px-step figure**, and a finer
grid finds 3-7 points more on most chapters — including `rooted`, which this work did not touch and which
sits entirely above the chapter it changed. So the finer step is a statement about the instrument's
resolution, not about any chapter, and acting on it would re-open five chapters at once on a page nobody has
changed.

Recorded here rather than acted on, because **the before/after comparison in §5 is honest either way**: both
sides of it are measured at the committed step, on the same instrument, and the shipped build's worst screen
is better than the one it replaces. Whether 150px is the right step for a page with a 900px viewport is a
question for the client's own ruling on #8, and it is a bigger question than this pass.

---

## 6. Gates

| | |
|---|---|
| `npm test` | **478** passed, 43 files (477 + one: `CoverflowCard.test.tsx`'s wrap test split into "points at the cards either side" and "gives the first card no way back and the last no way on"; `lib/coverflow.test.ts` gained three linear cases and lost two with `coverflowWindow`, netting zero) |
| `npm run lint` | 0 errors, 5 warnings, none of them this work's |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `npm run verify:budget` | see §6.1 |
| `check_coverflow.mjs` | **pass** — six cards, in-charge order `0,1,2,3,4,5` at both shapes, worst centre **0.96px** / 0.30px, 79 sweep widths worst off-centre **1.00px**, flicks 0/6 and 1/6 on a card |
| `check_films.mjs` | pass at six widths, 0/12 covered positions, corners within 1 level of cream |
| `check_contrast_over_photos.mjs` | pass on `/`, `/mahua-vann`, `/mahua-tola` — the six card runs read 4.63-9.32, worst **4.63** (card 04 at 390) against 4.5 |
| `check_image_resolution.mjs` | **0 under-served** at all five arms |
| `measure_density.mjs` | §5 |

### 6.1 The contrast rig had to be fixed to run at all

`check_contrast_over_photos.mjs` names a coverflow card positionally — `:nth-child(i + 2)` — because the deck
opened with a ghost. With six cards that crashed rather than lying: `nth-child(7)` matches nothing and
`sharp` threw `extract_area: bad extract area`. Now `i + 1`. **It is the one file this pass touched outside
its own remit**, and it is recorded here and in `rig-failures.md` §22.5 because the five runs before the crash
had each been measuring the wrong card, silently, which is the half that would have shipped if the sixth had
happened to exist.

The six figures moved a little on the new pin geometry — worst **4.63** against 4.79 — and the scrims
themselves are untouched. The margin at 390 is thinner than it was and is worth watching; the cause is the
sampled scroll offset, not the wash.
