# The coverflow's second geometry — the client's four changes, measured

17 Aug 2026. Four client reports on the shipped coverflow, plus the consequence of a fifth (his own
deletion of the header band's four photographs), and the arithmetic each one turned on.

Everything below was measured against a production build on `:3110` unless it says otherwise. The
photographs changed underneath all of it: **all six card frames are now client re-exports at 1344 × 685
(1.9620:1)**, where three of them were 1163 × 508 (2.2925:1) crops made for `/mahua-vann` and the rest were
mixed. Every ratio, ceiling and crop figure in `docs/DECISIONS.md` §20.6 is superseded by this file.

---

## 1. "It started with 06 whereas it should start with 01"

> *"When I scrolled down to the carousel it started with 06-Walk and Cycling whereas it should start with
> 01-Jungle Safari … should start with 01 and end with 06."*

### 1.1 What he was actually seeing

Not a bug in the loop, and not the arrows. `--cf-step` was `pin-len / (count + 1)` — `pin-len / 7` — so the
**eight** cards on the stage had eight centred moments and they tiled the pin at 0, 1, … 7 steps from its
start. The card at step 0 is the leading wrap-around ghost, which is a copy of activity **6**; and
`coverflow-pass-first` then flattened the first half of its schedule onto centre, so it did not merely pass
through the middle as the chapter arrived — it **held** there, across the whole of the stage's ride-in.

The ghosts were added on 16 Aug to fill the flanks at the pin's two ends (`density-sweep.md` §2, worth 9.3
points of empty). Giving them centred moments of their own was never part of that and was not noticed,
because the rig asserted the card in charge advanced `0 → 7` — i.e. it asserted the defect.

### 1.2 The derivation

`P` is `scroll-padding-top`, `V` is `100svh`, `T` the wrapper's document offset, `H` the track's height.
Two facts are Task 1's, measured, and unchanged: the pinned window opens at `cover d = V − P` and closes at
`cover d = H`, and `d = scrollY − T + V`.

Six activities are wanted at the pin's own ends and evenly between, so their centred moments must be

```
d_i = pin-start + i · step        i = 0 … count−1
step = pin-len / (count − 1)
```

which puts `d_0` exactly at the lock and `d_{count−1}` exactly at the release. The two ghosts keep the same
expression and fall at `d_{−1} = pin-start − step` and `d_{count} = pin-start + count·step` — one step
outside each end, which is exactly where a flank belongs.

The anchor target's offset follows from `d`, not from the card:

```
scrollY_c = T + d_c − V                     (a card is centred here)
Y_target  = scrollY_c + P                   (an anchor click subtracts scroll-padding-top)
top       = Y_target − T = d_c − (V − P) = d_c − pin-start = i · step
```

so `.coverflow-target { top: calc(var(--i) * var(--cf-step)) }`. The `(i + 1)` in the 16 Aug form was the
old step's own offset and nothing else; the `V` and `P` terms cancel whatever the step is.

**This is a change with a slope, which is the shape Task 1 §8 recorded getting wrong on paper.** A target
placed by the old expression against the new step is out by `step` at every card — 201px at 1440×900 — and
§11.5's negative control is what that looks like: four of six cards a full ±360px off centre, arrows
silently landing on the wrong card. So it is asserted rather than argued, on the rendered page:

| | 1440 × 900 | 390 × 844 |
|---|---|---|
| card in charge across the pin | **1, 2, 3, 4, 5, 6** | **1, 2, 3, 4, 5, 6** |
| worst distance from centre, all six bisected | **1.43px** | **0.59px** |
| both arrow-loop clicks land | 6 → 1, 1 → 6 | 6 → 1, 1 → 6 |
| continuous sweep 360–1920px, 79 widths × 2 targets | worst off-centre **1.40px** | — |

The negative control is kept in the same run and is `check_coverflow.mjs`'s **assertion 10**: neither ghost
may come within 8px of the stage's centre at any sampled position, pinned or not. Put `--cf-step`'s
denominator back to `count + 1` and it fires — §5 below.

### 1.3 "Outside the pin" is still on screen, and that needed its own answer

A sticky stage is visible for its own height of scroll before it locks and again after it lets go — 823px at
each end at 1440×900. A ghost whose centred moment is one step before the lock is therefore a ghost centred
on a stage a visitor can see, which is the reported defect with an extra step of scroll in front of it.

So the two ghosts do not use the shared schedule at all. `coverflow-pass-ghost-lead` holds at the **left**
flank from the beginning of its window until activity 1's centred moment and then slides off left;
`coverflow-pass-ghost-trail` arrives at the **right** flank at activity 6's centred moment and stays. The
percentages need no new arithmetic — the shared four-step window already puts the lead ghost's 75% on
activity 1's centred moment and the trail ghost's 25% on activity 6's.

The hold that keeps the stage from riding in and out empty moved with them, onto the two **real** end cards
(`[data-cf="hold-first"]` / `"hold-last"`). So the reading is now:

- stage rides in — **activity 1 centred**, ghost 6 veiled at its left, activity 2 arriving at its right
- pin — 1 → 2 → 3 → 4 → 5 → 6
- stage rides out — **activity 6 centred**, activity 5 at its left, ghost 1 veiled at its right

The loop is still visible in the scroll, which is what the client asked for on 16 Aug. It is no longer what
*leads* the chapter.

### 1.4 One consequence worth knowing: the pace went up 40% for free

`step` is `pin-len / 5` where it was `pin-len / 7`. At 1440×900 and `screens: 2` that is **201px** of scroll
per card against 144px, with no extra pin and no change to `COVERFLOW.screens`. The client's fourth report
is about the scroll feeling slippery, so the direction is the right one; §4 is the rest of that answer.

---

## 2. The card is bigger, and how far it can go

> *"As big as the Room Type cards from the property pages … if the previous and next cards are flowing out
> of the canvas of our website it is completely fine, it adds to the depth."*

### 2.1 The ceiling is arithmetic, and it moved when the files did

`object-fit: cover` in a box of `CARD_BOX` draws a photograph `max(1, imageAspect / CARD_BOX)` times the
card's width, and `ui/Photo.tsx`'s `coverSizes` asks the browser for exactly that many pixels. With all six
frames at 1.9620 and `CARD_BOX` at 16/9:

```
draw factor = 1.9620 / 1.7778 = 1.1036
ceiling     = 1344 / 1.1036   = 1217.8  ->  cardMaxPx 1217
```

At the shipped 900px card the browser asked for 993px and took the 1200px tier: a ratio of **1.21**, i.e.
21% of the file's width was being paid for and thrown away. The old ceiling was 903px because four frames
were 1163px at 2.289:1; §20.6's "45% is unreachable on today's photographs" is superseded by the re-export.

`components/sections/CoverflowCard.test.tsx` now asserts both halves of that — that no card photograph is
asked for more pixels than its widest file has, and that the ceiling is 1217 — because
`check_image_resolution.mjs` classes a photograph already served its widest tier as `atLibraryCeiling`,
**reports it, and does not enforce it**. The failure mode without the test is a green rig and six soft cards.

### 2.2 The sweep

Four arms, each a real build and a real density run. `check_image_resolution.mjs` at every arm.

| `cardMaxPx` | card at 1440 | `field-days` mean | worst | passes worst | page mean | page worst | images/screen | under-served |
|---|---|---|---|---|---|---|---|---|
| 900 (what shipped 16 Aug) | 900 × 506 | 47.1% | 55.0% | no | 38.4% | 77.8% | 2.18 | 0 |
| 1000 | 1000 × 563 | 40.7% | 51.2% | no | 37.6% | 75.2% | 2.18 | 0 |
| 1100 | 1100 × 619 | 33.8% | 46.5% | no | 36.6% | 71.8% | 2.18 | 0 |
| 1218 | 1218 × 685 | 26.3% | 41.0% | **yes** | 35.5% | 71.4% | 2.18 | 0 |
| **1217 — shipped** | **1217 × 685** | **26.4%** | **41.0%** | **yes** | **35.6%** | **71.4%** | 2.18 | **0** |

**`field-days` clears non-negotiable #8 for the first time**: `passesWorst` true, **0** screens over
budget, at 41.0% against the 45% ceiling. It was 57.9% for the three bands the coverflow replaced and 55.0%
for the coverflow as it shipped on 16 Aug.

About **−4.4 points of worst-screen empty per 100px of card**, and it costs no scroll at all — the wrapper's
height is `screens × 100svh` and has nothing to do with the card's size, so the chapter is ~2.7 screens at
every arm.

The last two rows differ by one pixel of card. 1218 is what was swept; 1217 is the exact integer ceiling —
at 1218 the browser is asked for 1344.2px of a 1344px file — and is what shipped, so that the test can state
the ceiling rather than approximate it. The shipped row is the gate run.

**Two page-level figures moved that this work did not cause.** `rooms` (44.8% → 39.6% worst) and `guests`
(45.9% → 40.7%) both crossed under the ceiling, and neither chapter was touched: `field-days` lost 56px of
height, so every chapter below it shifted against `measure_density.mjs`'s own 150px sampling grid. Do not
report those two as fixed.

### 2.3 `CARD_BOX` — measured, not assumed

The 16 Aug derivation is dead: the widest tier was 2.2925, so the minimum box was `0.75 × 2.2925 = 1.7194`
and 16/9 was the only standard ratio above it. The widest tier is **1.9620** now, so the minimum box is
**1.4715** and three ratios are available. Measured on the rendered card — the content block's own height
against the card's content box, which is what decides whether the words fit:

| box | crop | draw factor | resolution ceiling | card at 1440 | free space inside the card at **390** | at 768 |
|---|---|---|---|---|---|---|
| **16 / 9 = 1.7778** | 9.4% | ×1.1036 | **1217** | 1217 × 685 | **23px** | 191px |
| 1344 / 685 = 1.9620 | 0% | ×1.0000 | **1344** | 1344 × 685 | **5px** | 156px |
| 3 / 2 = 1.5 | 23.5% | ×1.3080 | **1027** | 1027 × 685 | 59px | 261px |
| 1.4715 — the bound itself | 25.0% | ×1.3333 | 1008 | 1008 × 685 | — | — |

Three readings decide it:

- **At every box's own ceiling the card is 685px tall — the file's own height — so a wider box buys width and
  nothing else.** That is not a coincidence: the ceiling is the width at which `cover` stops scaling the
  photograph up, which is the width at which the box's height equals the file's. All three leave the same
  476px of free space inside the card at 1440. 1.9620 at 1344 against 16/9 at 1217 is 10% more area for a
  box with no crop margin at all; 3/2 is 16% *less*.
- **390 is where the card's words live closest to its edges** (`scrims.md` §1: they are 27% of the card's
  height at 1440 and 58% at 390). 16/9 leaves 23px there; the photographs' own ratio leaves **5px**, which
  is one copy edit or one font fallback from a clipped heading, in an `overflow: hidden` box that would clip
  it silently.
- 3/2 has the most room at 390 and the least margin on the crop bound — 23.5% against a 25% ceiling — and
  its ceiling is a **1027px** card. It is the shape that costs the most density.

**16/9 stays.** At 1217 it gives the client a card the same height as the Room Type card he named and 91% of
its width, with 3.4 points of crop margin and the type's own headroom untouched.

---

## 3. Centring

`CARD_SIZES` and the rendered width are still interpolated from one expression in `COVERFLOW`, and
`CoverflowCard.test.tsx` still asserts they agree at every width — including the whole 360–1920 range in 4px
steps, where the card may never exceed its stage.

The stage is `ChapterSurface`'s container: `min(viewport, 1600) − 2 × padding`, i.e. **1344px at 1440**. A
1217px card therefore leaves 63.5px of cream each side at 1440 and fills the stage exactly at every width
below 1313. The continuous sweep reads **worst off-centre 1.90px across 79 widths × 2 targets**, so the
768–996px band that shipped 24px off-centre on 16 Aug stays closed — and it matters more now, because the
same defect at the new cap would have run from 768px all the way to 1313px rather than to 996px.

**The six centred moments are the pin, exactly.** Measured at 1440×900: the stage locks at scrollY 6892 and
releases at 7899, and the six cards centre at **6892, 7093, 7295, 7496, 7698, 7899** — 201.4px apart, the
first on the lock and the last on the release, which is §1.2's derivation reading itself back off the page.

---

## 4. "Too smooth … difficult to go through them one-by-one"

> *"Too smooth and if scrolled fast it moves up or down the cards very easily making it difficult for the
> viewer to go through them one-by-one."* Client's choice, given the options: **settles on a card.** He
> refused one-card-per-gesture — *"it takes the page out of your hands"*.

### 4.1 CSS scroll-snap survives Lenis. A zero-sized snap target does not.

The first probe declared `scroll-snap-type: y proximity` on `html` and `scroll-snap-align: start` on the six
`.coverflow-target` boxes, flicked the wheel eight times, and read **no difference at all** — arms A (no
snap), B (snap) and C (snap declared, alignment removed) agreed to the pixel. The honest reading of that is
not "Lenis wins"; it is "three arms that agree measure nothing", so a **positive control** was built: the
same construction on a bare page with no Lenis and no application CSS.

| trial | construction | 340 → | 355 → | 700 → | 1000 → |
|---|---|---|---|---|---|
| 1 | block sections, no snap | 340 | 355 | 700 | 1000 |
| 2 | block sections, `mandatory` + `align: start` | **300** | **300** | **600** | **900** |
| 3 | **zero-sized** absolute targets, `mandatory` | **0** | **0** | **0** | **0** |
| 4 | **zero-sized** absolute targets, `proximity` | 340 | 355 | 700 | 1000 |
| 5 | **1 × 1px** absolute targets, `proximity` | **300** | **300** | **600** | **900** |

Rows 3–5 are the finding. **A snap area of zero width and height is not a snap area**: under `proximity`
Chromium ignores it entirely, and under `mandatory` it is worse than useless — every scroll collapsed to
offset 0. One pixel of box is the whole difference. `.coverflow-target` was `width: 0; height: 0` because
nothing had ever needed it to be otherwise.

### 4.2 With that fixed, Lenis is not the obstacle

Re-run on the real page, Lenis running, eight wheel flicks from an un-snapped offset just before the pin,
each settled before reading. The number is the distance from the nearest card's centred moment:

| arm | rests (px from a card) | worst | mean |
|---|---|---|---|
| A2 · no snap | −55, −19, −55, 72, 63, 153, 387, 549 | 549 | 169 |
| **B2 · 1×1 targets, `proximity`** | **0, 0, 0, 0, 0, 0, 0, 639** | 639 | **80** |
| C2 · declared, `scroll-snap-align` removed | −55, −19, −55, 72, 63, 153, 385, 547 | 547 | 168 |

Every flick that ended inside the chapter landed **exactly** on a card. The one that reads 639 is the eighth,
which left the pin: with `proximity` a visitor scrolling past the chapter is not held by it, which is the
correct behaviour and the reason `mandatory` was not used — this is the home page's only pinned chapter and
a mandatory container would fight anyone trying to get past it.

Arm C2 is the control that matters: same declaration, same 1×1 boxes, only `scroll-snap-align` removed, and
it reproduces the unsnapped figures to the pixel. The measurement is sensitive to exactly the property under
test.

**Zero JavaScript.** No `lenis/snap`, no listener, two CSS declarations.

`check_coverflow.mjs`'s **assertion 11** is this, folded into the committed rig: six real wheel gestures at
each of 1440×900 and 390×844, and if the stage is still pinned once the page has stopped, some card must be
within 8px of centre.

---

## 5. Every new assertion, watched failing

Appended to [`rig-failures.md`](rig-failures.md) §15–§19 rather than duplicated here — including one break
that did **not** fire the assertion it was aimed at, and what that proved.

---

## 5a. The scrims survived a 35% bigger card

Solved against a 900px card (`Coverflow.tsx`'s `CARD_SCRIM`, re-solved on 17 Aug for the re-exported
photographs). Re-measured on the shipped 1217px card, `check_contrast_over_photos.mjs`, floor 4.5:1:

| card | photograph | 390 | 768 | 1440 | 1920 |
|---|---|---|---|---|---|
| 01 Jungle safari | `tiger-crossing-track` | **5.05** | 6.03 | 6.03 | 6.03 |
| 02 Bird watching | `vann-bird-watching` | **4.79** | 9.17 | 9.32 | 9.21 |
| 03 Kohka Lake | `vann-kohka-lake` | **4.98** | 7.37 | 7.13 | 7.10 |
| 04 The river walk | `forest-boardwalk-daylight` | **4.95** | 9.65 | 8.75 | 8.72 |
| 05 Pachdhar | `vann-potters-village` | **4.97** | 5.49 | 5.80 | 5.80 |
| 06 Walks and cycling | `forest-trail-canopy` | **5.38** | 6.36 | 7.04 | 7.04 |

**All six clear at every width; the worst is 4.79 (card 02 at 390), 6% above the floor.** Nothing needs
re-solving, and the reason is structural rather than lucky: **390 is the width that bound all six figures**
(`scrims.md` §1 — the words are 58% of the card's height there against 27% at 1440), and at 390 the card is
`100vw − 48` = 342px, bounded by the viewport and not by `cardMaxPx`. **The card did not change size at the
width that decides these numbers.** The desktop widths, where it grew by 35%, are the ones with 5-9 points of
margin.

All three routes pass; the rig's own off-centre placement note reads 0.

---

## 5b. Gates

| | |
|---|---|
| `npm test` | **477** passed, 43 files (475 + the two new `cardMaxPx` guards) |
| `npm run lint` | 0 errors (5 pre-existing `lib/booking` warnings) |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `npm run verify:budget` | **168.2 KB brotli — delta 0.** All four changes are CSS and markup |
| `check_coverflow.mjs` | **pass** — eleven assertions, 79-width continuous sweep, six wheel flicks per shape |
| `check_films.mjs` | pass at six widths, white ground asserted as pixels, 0/12 covered positions everywhere |
| `check_contrast_over_photos.mjs` | pass on `/`, `/mahua-vann`, `/mahua-tola` |
| `check_image_resolution.mjs` | **0 under-served** at all five width/density arms |
| `check_card_stack.mjs` | pass — the site-wide snap declaration does not disturb the other pinned chapter |
| `check_plates.mjs` | pass — 0.00% worst distortion on all three routes |
| `measure_density.mjs` | §2.2 |

---

## 6. The header band, and why it cannot be filled

The client's fifth change — *"Remove all 4 images (collage of images) between the section's introductory
text and the activity card carousel"* — left the band's height and took its imagery. It measured
**52.0% mean / 66.2% worst** for the chapter and moved the page's own worst screen here: **82.9%**, on the
`forest / field-days` join, the emptiest screen on the site.

**The arithmetic says no amount of composition fills it.** At 1440 the row is 1,344 × 432 = 581,000px².
`measure_density.mjs` credits a line box's own rect and an image element's own box, so the contents are
worth:

| | area | share of the band |
|---|---|---|
| heading, chapter mark, one paragraph | ~75,000px² | 13% |
| the tiger film's element box (300 × 400) | 120,000px² | 21% |
| **total** | **~195,000px²** | **34%** |

Doubling the prose would not close that, and the client has just deleted a paragraph from this band. So the
recomposition spends the two things that are actually available:

- **7/5 rather than 5/7, `gap-x-10` rather than `-14`.** A 7-column slot for a 300px drawing left 461px of
  bare cream inside its own column; a 5-column slot leaves 227px. The width goes to the text.
- **The prose is the chapter's only prose now and is sized like it** — `1.15rem`/`md:text-xl` at `54ch`
  against `1.08rem`/`md:text-lg` at `52ch`. Same words, bigger measure, more ink per line, no invented copy.
- **32px + 24px of vertical cream removed**: `.coverflow-figure`'s `margin-bottom` (it was spacing the film
  from a photograph the client deleted) and half of the stage's own top margin (`mt-12 lg:mt-16` →
  `mt-8 lg:mt-10`), which was being paid on top of the cream a centred card already leaves inside the pin.

`lg:items-start` is unchanged: the film column is the taller of the two, so any other alignment pushes the
chapter mark and heading down the page by the difference.

**The one real lever left is the drawing's own width, and it is not in this chapter's files.** The film is
`w-[240px] sm:w-[280px] lg:w-[300px]` in `app/page.tsx`, whose own comment records that **420px is the
ceiling its 810px source stays sharp to at DPR 2**. Taking it to 400px would add ~40,000px² to the band and
close 100px of the hole beside it, for one line and no bytes. It is left as a recommendation because
`app/page.tsx` was outside this pass's remit — see the report.

### What the recomposition itself was worth

Isolated, on the same 900px card the chapter shipped with, so the card sweep's own gain is not credited here:

| | `field-days` mean | worst | page mean | page worst |
|---|---|---|---|---|
| the band as the client left it | 52.0% | 66.2% | 39.4% | **82.9%** |
| recomposed, card still 900 | **47.1%** | **55.0%** | 38.4% | **77.8%** |
| …and with the card at 1217 | **26.4%** | **41.0%** | 35.6% | 71.4% |

**−11.2 points off the chapter's worst screen and −5.1 off the page's**, from a column split, a type size and
56px of removed cream. The rest is the card.

The page's worst screen is still this chapter's join with `03 · The Forest` — 71.4% at scrollY 6150 — and it
belongs to no chapter, which is the category `docs/DECISIONS.md` and CLAUDE.md #8 both record as the place to
look before blaming a chapter. It is not new (`lantern-hour / details` sits at 64.3% untouched) and it is
where the four deleted photographs used to be.

### Read by eye, at five widths

Screenshots opened, not just measured — CLAUDE.md's own standing instruction, and the one that caught the
map's 4.3px labels.

- **1024** is the best of the five. The film sits close to the text, the row reads as one band, and the card
  below fills the container edge to edge.
- **1440** reads well. The heading is two lines rather than three, the paragraph runs to about two-thirds of
  its column, and the card is 1217 × 685 with slivers of both neighbours flowing off the edges — which is
  what the client asked for. The band still carries a hole between the paragraph and the tiger.
- **1920** is the weakest, and honestly so: the container is 1,824px, the paragraph still stops at 54ch and
  the film is still 300px, so the hole between them is wider than at 1440. Nothing in this chapter's files
  can close it — see the tiger lever below.
- **390** — **the type was read, not measured.** The band stacks: mark, heading, paragraph at full width,
  then the tiger centred beneath. It reads cleanly and the larger prose helps rather than hurts here. On the
  card, "03 / Kohka Lake / An hour at the water near Pench, where the day comes down slowly and the birds
  come to it. / PREVIOUS · NEXT" is all legible over the photograph, with the arrows' gold hairline visible.
  The card is 342 × 192 on a 793px stage, so the phone shows a small card in a lot of cream — unchanged by
  this pass, since `cardMaxPx` does not bind below 1313px, and the client's lens is the laptop.

**One lever that looks obvious and is not: enlarging the tiger.** The film is 810 × 1080, so drawing it at
400px instead of 300px makes it 533px tall rather than 400px — the band grows 133px. That adds ~93,000px² of
imagery to the join screen (worth about 7 points there) and takes 133px of the 1217px-wide card out of the
chapter's OWN worst screen (about 5 points the wrong way). It trades the page's worst against the chapter's,
and `passesWorst` binds on the chapter. Not recommended without measuring both.

---

## 7. What did not change, and why

- **`COVERFLOW.screens` is still 2.** It is a free pace dial (Task 1 §11) and §20.4 measured what turning it
  costs: every screen it adds is a pin screen, so the chapter's mean goes the wrong way (48.4 → 48.9 → 49.3%
  at 2 / 2.5 / 3) and its worst screen does not move at all. The pace complaint is answered by §1.4's 40%
  and §4's snapping, neither of which costs a screen.
- **`sideScale`, `sideShiftPct`, `sideVeil`.** The client blessed the neighbours running off the canvas
  (*"it adds to the depth"*), which is what a 62% shift of a 1217px card does at 1440.
- **The tiger's position.** *"Keep the tiger where it is now"*, 17 Aug. It is still the first thing in the
  band's right-hand column, outside `.coverflow` entirely, with no stacking context between it and the
  chapter's cream. `check_films.mjs` at six widths is the gate for that claim, not a reading of the markup.

---

## 8. What this pass made stale elsewhere

Three things outside the files this work could touch now describe a page that no longer exists. None is a
defect in the running site; all three are traps for the next reader.

1. **`lib/coverflow.ts`'s `coverflowWindow`** documents `count + 1` steps — *"a card is centred at the
   MIDDLE of its own window, so the first card needs half a window before it and the last one half a window
   after"* — which is the arithmetic §1 replaced. **It is consumed by nothing** (only by its own test in
   `lib/coverflow.test.ts`; `app/globals.css` computes the real windows), so the page is unaffected, but it
   is the only prose in `lib/` describing this geometry and it now describes the defect. Delete it or
   correct it to `count − 1` with a four-step window.
2. **`docs/DECISIONS.md` §20.4 and §20.6.** §20.4's density table ends at the 16 Aug shipped row — *"48.1%
   mean / 55.0% worst … still over the 45% ceiling and cannot reach it on today's photographs"* — and §20.6
   is built entirely on the old 2.289:1 files: the 1.288 draw factor, the 903px ceiling, the 1.7194 minimum
   box, and *"no portrait or square card is available"*. Every one of those is superseded by the client's
   re-export and this file's §2. The row to add: **`cardMaxPx` swept to 1217 on the re-exported files —
   26.4% mean / 41.0% worst, `passesWorst` true, page worst 71.4%.**
3. **`docs/reviews/2026-08-16-coverflow/README.md` §1 and §2**, whose gate table and density table are both
   the 16 Aug run.

`docs/OWED-ORIGINALS.md` already records group 1 as delivered, and this pass is what spent it: the
re-exported files are the whole reason `cardMaxPx` could go from 900 to 1217 and the chapter could clear the
ceiling. Two things in that file remain true and unaffected — the DPR-2 shortfall (1344px serves a 1217px
card at exactly 1.00 on a 100%-scaled screen and 0.50 on a Retina one, and ~2,700px would close it), and
`vann-potters-village`'s separate request for a different **crop** rather than a wider file. The second is
visible in this pass's own contrast table: it carries the narrowest desktop margin of the six, 5.49 at 768.
