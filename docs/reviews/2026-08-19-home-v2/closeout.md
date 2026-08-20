# `feat/home-v2` — closing out: one client change and two open defects

**Date:** 20 August 2026 · **Branch:** `feat/home-v2` · **Build:** production, served on
`:3110`. This is the branch's final evidence and the last look before it goes to
stakeholders.

Every figure below is re-derivable:

```bash
npm run build && npx next start -p 3110
node scripts/check_contrast_over_photos.mjs --port 3110      # + --url .../mahua-vann, .../mahua-tola
node scripts/check_image_resolution.mjs --port 3110
node scripts/measure_density.mjs --port 3110                 # add --step 50 for the §5a check
node scripts/check_films.mjs --port 3110
node scripts/check_experience_strip.mjs --port 3110
node scripts/check_pinned_collage.mjs --port 3110 --chapter rooted      # and --chapter philosophy
node scripts/check_entrances.mjs --port 3110
node scripts/measure_page.mjs --port 3110
npm run verify:budget -- --no-build
```

---

## 1. `02 · The Jungles` — centred on the band, heading aligned to the Vann panel

Client, 20 August: *"Centre the heading and text for 02-The Jungles on the length
of the image of the section, and move just the heading a bit more on the left so
that it aligns right under the text from the Mahua Vann property card from the
01-The Lodges section."*

Two parts. **"Length" is his word for the band's height** — the same way he used
it asking for the crop on 19 August (*"crop it a bit more on its length"*, which
meant shorter) — so the first half is vertical centring.

### 1.1 Centred

`justify-end` → `justify-center`, and the padding went symmetric with it:
`pt-24 pb-12 md:pt-32 md:pb-14 lg:pb-16` → `py-24 md:py-32`.

**The symmetry is what makes the centring true.** With `justify-center` the block
is centred *between the two paddings*, so an asymmetric pair centres it on
something that is not the band — at 1440 the old 128/64 would have left it 32px
below the band's own middle. Equal paddings centre it exactly wherever the floor
sets the height, and pin it at `padding-top` wherever the content does.

**The value is still the header's, and that is not negotiable.** `SiteHeader` is
`position: fixed` and paints an opaque cream bar 107px deep from `md` (75px at
390). Park the section's top at the viewport's top — a scroll-stop, a hash link,
or the contrast rig — and any padding under that bar puts the chapter mark behind
it: `jungles · mark` read **1.00:1, cream on the cream bar**, when this was
`py-16` on 19 August. 96/128px is the bar plus the display face's ascender plus
air, and it is now doing two jobs with one number.

Measured, production build, section parked at the viewport's top:

| viewport | band height before → after | mark's top before → after | header |
|---|---|---|---|
| 360 × 844 | 488.7 → **536.7** | 95.8 → 95.8 | 75.4 |
| 390 × 844 | 460.6 → **508.6** | 95.8 → 95.8 | 75.4 |
| 768 × 1024 | 454.0 → **526.0** | 128.0 → 128.0 | 107 |
| 900 × 768 | 463.9 → **535.9** | 128.5 → 128.5 | 107 |
| 1024 × 768 | 370.3 → **434.3** | 190.2 → 190.2 | 107 |
| 1280 × 900 | 396.8 → **404.6** | 196.9 → **140.7** | 107 |
| **1440 × 900** | 446.4 → **446.4** | 244.3 → **159.4** | 107 |
| 1600 × 900 | 496.0 → **496.0** | 293.9 → **184.2** | 107 |
| 1920 × 900 | 595.2 → **595.2** | 393.1 → **233.8** | 107 |
| 2560 × 900 | 793.6 → **793.6** | 591.5 → **333.0** | 107 |

**From 1440 up the band's height is untouched and still exactly `31vw`** — the
client's crop of 19 August survives where he looks at it — and the words simply
move up into the middle of it. Below 1280 the words already set the height, so
symmetric padding costs 48-72px there. That is the honest price and it is paid at
widths the client has deferred (CLAUDE.md, 12 Aug); the band's own box aspect at
its tallest, narrowest case (360 × 844) goes **0.74 → 0.67**, still well clear of
`JUNGLE_BAND.coverAspectFloor`'s 0.6, which is the margin that dial says is there
to be spent.

### 1.2 The heading, aligned — and it is arithmetic, not a nudge

**Measured, not guessed**, because the two blocks live in different frames: the
panels reach the screen edges and carry their own padding, while the band's words
sit in a centred 1,600px container inside this section's `md:px-12`.

| viewport | Vann panel's text left | band's container left | gap to close | **heading left, after** |
|---|---|---|---|---|
| 360 | 24 | 24 | **0** | **24** ✓ |
| 390 | 24 | 24 | **0** | **24** ✓ |
| 768 | 48 | 48 | **0** | **48** ✓ |
| 900 | 48 | 48 | **0** | **48** ✓ |
| 1024 | 28 | 48 | **20** | **28** ✓ |
| 1279 | 28 | 48 | **20** | **28** ✓ |
| 1280 | 40 | 48 | **8** | **40** ✓ |
| **1440** | 40 | 48 | **8** | **40** ✓ |
| 1600 | 40 | 48 | **8** | **40** ✓ |
| 1695 | 40 | 48 | **8** | **40** ✓ |
| 1696 | 40 | 48 | **8** | **40** ✓ |
| 1920 | 40 | 160 | **120** | **40** ✓ |
| 2560 | 40 | 480 | **440** | **40** ✓ |

**Exact at all thirteen widths.** The paragraph did not move at any of them — its
right edge reads 336 / 366 / 556.1 / 976 / 1231 / 1232 / 1392 / 1552 / 1647 /
1648 / 1760 / 2080, byte-identical to the build this task started from. That is
what *"just the heading"* means, and it is checked rather than asserted.

**The offset is 8px at 1440 and 120px at 1920, and a single hand-tuned value
would have been right on one screen and wrong on every other** — this project's
most-catalogued defect shape. The container stops growing at 1,600px and the
screen does not, so above 1,696px of layout viewport every extra pixel pushes the
two blocks half a pixel further apart.

Three things about how it is built:

- **`100cqw`, never `100vw`.** A new `.jungles-frame` wrapper is
  `container-type: inline-size`, so `100cqw` is the section's own content width.
  `100vw` includes a classic scrollbar — 15-17px on Windows, 0 on a Mac — which
  on this page is already the difference between seeing the pinned collage and
  not. A `vw` version would have been ~8px out on the machine the client actually
  tests on and exactly right on the one it was written on.
- **The chapter mark travels with the heading; the paragraph does not.** The mark
  and the headline are one block — the Vann panel's own label and name share an
  edge for the same reason — and leaving the mark behind would have put an 8px
  stagger between a label and the line it labels at 1440, and a 120px one at 1920.
- **Below `lg` there is no rule at all**, because none is needed: the panels stack
  there and their words fall back to the same `px-6 md:px-12` the band uses, so
  the two already agree to the pixel. The alignment target does not disappear
  below `lg` — it simply becomes free.

**Asserted, and watched failing.** `lib/sizes.test.ts` now reads
`LodgePanels.tsx`, `JunglesBand.tsx` and `app/globals.css` together and holds the
CSS's two `calc()`s to the panels' `lg:px-7`/`xl:px-10`, the band's `md:px-12` and
the container's `max-w-[1600px]`. Changing `lg:px-7` to `lg:px-6` fails it with
*"the lg offset does not start from LodgePanels' lg:px-\*: expected 24 to be 28"*.
It is also why the CSS writes `calc(28px - 48px)` rather than `calc(-20px)`: the
folded form says nothing about where either number came from.

### 1.3 The scrim was re-solved, and it came back unchanged

Centring lifted the block ~85px up the band at 1440, onto different pixels — and
`DECISIONS.md` §20.5 says new glyph positions are a new solve. Solved from
scratch against every pixel of every line box at six widths. **Unwashed, the three
runs now read 4.43 / 1.00 / 1.00 at 360 and 3.51 / 1.00 / 1.00 at 390** — genuinely
different pixels, and no better than the ones the 19 Aug figure answered.

`flat: 0.74` is what the solver returns again, and the reason is structural: **a
pure flat is the one wash whose strength does not depend on where the type sits**,
so moving a block inside it can only change the answer through the photograph
underneath, and this photograph's bright pixels are spread through the canopy
rather than gathered at one end. Measured on the shipped build: mark 5.03-8.68,
heading 4.96-5.88, body 5.05-6.29, against floors of 4.5 / 3.0 / 4.5 — still on
the 5.0 / 3.5 target the figure was bought for. **It had to be re-checked, not
re-tuned; the immunity is to the layer's shape, not to the frame.**

---

## 2. `philosophy` — 46.5% → **42.3%**, and `rooted` improved with it

The defect: **46.5% empty on its worst screen against the 45% ceiling, on a
chapter whose height, composition and copy were byte-identical.** The band above
it lost 692px and re-phased the density rig's 150px sample grid. It was already
checked at a 50px step and read 46.5% there too, so the screen was real and always
had been; the old grid never landed on it (`DECISIONS.md` §5a).

### 2.1 Where the worst screen actually was

**The last screen of the pin, and the drift is why.** Through the steady state the
chapter sat at ~41.8%; by the end of the hold the three photographs have drifted
up by 63 / 44 / 25px, which opens a band of cream along the **foot** of both image
columns and takes imagery from 51.6% to 46.6%. Per-screen, on the failing build:

| scroll y | 4350 | 4500 | 4650 | 4800 | 4950 | **5100** |
|---|---|---|---|---|---|---|
| empty | 41.8 | 42.2 | 41.8 | 42.5 | 42.6 | **46.5** |
| imagery | 51.6 | 51.2 | 51.6 | 50.9 | 50.8 | **46.6** |

`COLLAGE_RATES` cannot be touched — non-negotiable #9, the leader is already at
`PARALLAX_MAX` — so the only lever is how much of the screen the photographs
occupy before the drift eats into it.

**The copy was not treated as a lever.** The client has ruled that this chapter
keeps its single 55-word paragraph (*"We will later add more text to the
philosophy, for now keep this"*). Nothing is padded, shortened or invented, and
the pin is still two screens.

### 2.2 What changed

`PinnedCollage`'s `COLUMNS`: the text column went from a third of the container to
**30%**, and the gutters between the three columns from **40px to 32px**. At
1440 × 900 an image column goes 421.3px → **448.0px**.

| text share | gutter | image column | `philosophy` mean / worst | `rooted` mean / worst |
|---|---|---|---|---|
| 33.3% | 40px | 421.3px | 42.7% / **46.5% — over** | 39.0% / 43.0% |
| 30% | 32px | 448.0px | 36.9% / 41.8% | 34.2% / 39.0% — but see §2.3 |
| **30%** | **32px** | **448.0px** | **37.3% / 42.3%** | **34.6% / 39.4%** |

Page-wide, before → after: mean **35.5% → 33.2%**, worst screen **68.0% → 66.4%**,
the average screen **54.6% → 57.2% imagery**, 12 → 6 screens over the budget.
`why-you-came` also improved (36.0% → 34.2%) as a side effect of §1's taller band.

**42.3% reads 42.3% at a 50px sample step as well as at 150px** — the check §5a
asks for before believing a figure near the ceiling, and the same check that
proved the 46.5% was real. 2.7 points of margin, not a phase of the grid.

`rooted` shares this component and **improved rather than regressed**: 39.0% /
43.0% → 34.6% / 39.4%.

### 2.3 The fix had a defect in it, and a screenshot is what caught it

The first version held the block's line-up by shrinking the seam between the pair
to 0.92vw (13.2px). **Reading the 1440 screenshot raised the question; measuring
answered it.** The two pair frames drift at different rates (0.105 and 0.06), so
the gap between them **sweeps by the difference in their travel** — 40.5px,
measured across the pin — and a 13.2px rest seam runs from **−7.0px to +33.5px**.
Negative is the lower photograph overlapping the upper one, for the first tenth
of the hold, on both chapters.

Fixed by shortening `pairLower` — `aspect-[5/3]` → `aspect-[7/4]`, 268.8px →
256.0px — which buys the seam back to 1.83vw and its sweep to **+6.1px … +46.6px**,
the range the page shipped with before any of this. It cost 0.5pp of density
(41.8 → 42.3 worst) and it *improves* the crop: `vann-potters-village` loses
10.8% of its width in the 7:4 box against 15.0% in the 5:3 one.

**The bound on that seam is half the pair's relative drift, not taste**, and it is
now written on `BOXES`. No rig on this project measures it; a `check_pinned_collage`
run passes with the frames overlapping.

### 2.4 What is still true and is the client's

`philosophy` passes, but it still reads as the shorter half of a pair: one
paragraph in a column built for three, with ~250px of cream below it at 1440. That
is what a 139-word chapter followed by a 55-word one looks like, the client owns
it, and his extra paragraphs will close it. The density figure is not the whole
of the question and this report should not pretend otherwise.

---

## 3. `strip · card 02` — 3.30 at 360, and why one number could not fix it

The 19 August sweep of unsampled widths found `strip · card 02` at **3.30 against
its 4.5 floor at 360px**. The six card scrims were all solved at 390 and up, where
the card is a flat 340px; at 360 it is `78vw` = 281px.

### 3.1 The cause, located rather than assumed

**The card got 23px narrower and the card's sentence wrapped from one line to
two.** The block is bottom-anchored, so every line above the wrap moved up with
it: the label's top went from **22.7% of the card's height to 29.6%**, which is
where `Scrim`'s `bottom` gradient has fallen to 59% of its own strength. Straight
onto the one bright patch in this frame — the backlit white cotton. Per line box,
measured with the type hidden:

| line | 360 (4 boxes) | 390 (3 boxes) | 1440 (3 boxes) |
|---|---|---|---|
| label "Stillness" | **3.30** at 29.6% up | 5.97 at 22.7% | 5.80 at 22.0% |
| title "Wellness" | 5.71 | 8.28 | 8.28 |
| body | 10.72 / 10.04 | 8.21 | 8.07 |

The photograph under the label is **[240, 228, 214]** at 360 against
[181, 158, 142] at 390. Nothing about the photograph or the crop changed.

### 3.2 No `flat`+`bottom` pair can serve both, and that is geometric

Every layer in `ui/Scrim.tsx` except `top` gets **stronger** toward the foot, and
`top` does not reach. So any figure that lifts the label at 360 lifts the two
lines below it by at least as much. Solved against every pixel at six widths:

| candidate | 360 | 390-1920 | mean alpha over the frame |
|---|---|---|---|
| `{ flat: 0.08, bottom: 0.85 }` — before | **3.33** | 5.86-6.12 | 0.362 |
| `{ flat: 0.55, bottom: 0.40 }` | 4.49 | 6.48-6.72 | 0.615 |
| `{ flat: 0.72 }` | 5.37 | 7.08-7.30 | 0.720 |
| `{ flat: 0.08, bottom: 0.85, corner: 0.40 }` | 4.98 | 7.91-8.12 | 0.439 |
| **`{ flat: 0.05, bottom: 0.45, corner: 0.75 }` — shipped** | **5.36** | 7.51-7.71 | **0.416** |

A pure flat heavy enough for 360 costs the photograph twice what it costs today.
What broke the deadlock is **`corner`** — the one layer in the library whose wedge
is thickest at the bottom-left, where this block starts, and which is *lighter*
than the 0.08 flat it replaces at the top of the frame where the subject is. Five
points of mean alpha, and the top of the frame is cleaner than before.

### 3.3 Measured on the shipped build — and the other five at 360

| run | 360 | 390 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| `strip · card 01` `bonfire-dinner` | **5.10** | 5.30 | 5.51 | 5.67 | 5.51 | 5.76 |
| `strip · card 02` `sound-healing` | **5.28** | 6.53 | 6.33 | 6.33 | 6.32 | 6.32 |
| `strip · card 03` `star-talks` | **5.38** | 5.45 | 5.28 | 6.14 | 5.28 | 6.04 |
| `strip · card 04` `guide-sunrise` | **5.40** | 5.45 | 5.45 | 5.45 | 5.39 | 5.45 |
| `strip · card 05` `potters-hands` | **4.90** | 5.11 | 7.51 | 8.03 | 7.60 | 7.97 |
| `strip · card 06` `tiger-golden-grass` | **5.21** | 5.13 | 5.19 | 5.15 | 5.21 | 5.20 |

**At 360, before this task, the other five read 4.78 / 4.92 / 4.82 / 4.90 / 5.21
— all passing.** The brief expected "several a tenth of a point above 4.5"; that
is not what the instrument says, and the difference matters, so it is recorded
rather than smoothed over. What *was* true is that three of them had only ~0.27 of
margin at their worst width, which is thin for a project whose standing
instruction since §20.5 is to re-solve with headroom:

| card | before | after | mean alpha |
|---|---|---|---|
| 01 | `{ flat: 0.22, bottom: 0.95 }` | `{ flat: 0.28, bottom: 0.95 }` | 0.487 → 0.526 |
| 02 | `{ flat: 0.08, bottom: 0.85 }` | `{ flat: 0.05, bottom: 0.45, corner: 0.75 }` | 0.362 → 0.416 |
| 03 | `{ bottom: 0.82 }` | `{ bottom: 0.82, flat: 0.10 }` | 0.295 → 0.366 |
| 04 | `{ flat: 0.14, bottom: 0.70 }` | `{ flat: 0.20, bottom: 0.75 }` | 0.357 → 0.416 |
| 05, 06 | unchanged | unchanged | — |

**05 and 06 were deliberately left alone** at 4.90 and 5.13. A scrim raised for no
measured reason is a photograph darkened for no measured reason.

`PLACEHOLDER_SCRIM` gained `corner: 0.8` the same day, so it still dominates every
solved figure layer by layer — a fallback that omits a layer the set uses is a
fallback that can land *lighter* than a solved figure.

### 3.4 The rig

`check_contrast_over_photos.mjs` now sweeps **360, 390, 768, 1024, 1440, 1920** by
default, and its viewport height is a function of the width rather than a table of
equalities — the old table silently gave every ad-hoc `--widths` value a 900px
height, i.e. a phone the shape of a laptop. 360 takes 844, as 390 does.

---

## 4. The gate list

| gate | result |
|---|---|
| `npm test` | **477 passed**, 42 files — was 475; +2 are the two tripwires in §1.2 and §2 |
| `npm run lint` | 0 errors, 5 pre-existing warnings |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `check_contrast_over_photos.mjs` `/` | **156 probes, 0 failures, 0 not-found**, six widths |
| `check_contrast_over_photos.mjs` `/mahua-vann` | 78 probes, 0 failures, 0 not-found |
| `check_contrast_over_photos.mjs` `/mahua-tola` | 84 probes, 0 failures, 0 not-found |
| `check_image_resolution.mjs` | **0 under-served by `sizes`** at all five viewports |
| `measure_density.mjs` | **all 7 chapters inside 45% worst**, page mean 33.2% |
| `measure_density.mjs --step 50` | same verdict, `philosophy` 42.3% at both steps |
| `check_films.mjs` | **PASS** — plays once, holds at 10.00s, hover-replays, ground gone as pixels at six widths |
| `check_experience_strip.mjs` | **PASS** — 12 assertions, 99 widths |
| `check_pinned_collage.mjs --chapter rooted` | **PASS** — headline held within 1px, drifts 126/88/50 |
| `check_pinned_collage.mjs --chapter philosophy` | **PASS** — headline held within 0px, drifts 126/88/50 |
| `check_entrances.mjs` | **PASS** — 30 staged and settled, 1/1 parallax moved, 6 `[data-drift]` |
| `measure_page.mjs` | initial **669 KB @ 390**, **965 KB @ 1440** — both inside 1.5 MB; no horizontal scroll at 390/768/1440/1920 |
| `measure_page.mjs` hero | 3,878 ms against the 2,500 ms budget — **fails, knowingly and unchanged** (CLAUDE.md #6) |
| `npm run verify:budget` | **PASS — 167.5 KB brotli first load, 9 files. Delta 0.** |

**The JavaScript delta is zero.** Everything in this task is CSS, markup and two
constants; no component gained a `"use client"` and nothing new reaches the
browser.

### Density, per chapter

| chapter | mean | worst | inside 45% |
|---|---|---|---|
| `arrival` | 0.4% | 0.4% | ✓ |
| `lodges` | 35.0% | 35.0% | ✓ |
| `why-you-came` | 34.2% | 34.2% | ✓ |
| `rooted` | 34.6% | 39.4% | ✓ |
| `philosophy` | **37.3%** | **42.3%** | ✓ |
| `field-days` | 42.4% | 42.4% | ✓ |
| `invitation` | 6.0% | 6.0% | ✓ |

The page's five emptiest screens are all the `philosophy / field-days` **join**
(66.4%, 64.7%, 60.0%, 56.7%, 50.2%), which belongs to no chapter and is unchanged
by this work. It is the same open item the 19 August review recorded.

---

## 5. Read by eye — what the page actually looks like

No instrument on this project measures whether a page reads well. All four widths
were screenshotted and opened, section by section.

**1440 × 900 — the client's own lens.** The join he asked about is the best thing
on the page now: "02 —— THE JUNGLES" and "The forest at its most alive," start on
exactly the same vertical as "Mud-plastered cottages…" and the DISCOVER MAHUA VANN
pill above them, and because the panels are edge-to-edge the eye reads it as one
column of type continuing down through a change of ground. The band itself is a
446px strip of forest with its words floating in the middle of it, ~155px of clear
photograph above and below — it reads calm and deliberate where the bottom-anchored
version read like a caption. The paragraph on the right sits a little high against
the heading (`lg:items-end` bottom-aligns them, and the heading is two big lines
against four small ones); it looks intentional. `03 · Rooted` and `04 · Philosophy`
are visibly denser than before — the wall of photographs now reaches within 32px
of the text column and the tall frame still bleeds off the screen — and the mirror
between them reads as one idea turning over rather than as the same layout twice.
The strip's four cards are legible and card 02 is the darkest of them, which it
was before and which the photograph justifies.

**1920 × 1080.** The 120px pull on the heading was the thing I most expected to
look wrong, and it does not: at this width the alignment is what the eye picks up,
and the heading sitting flush with the panel above it reads as a wide editorial
spread. The paragraph's right edge stops 160px short of the screen while the
heading is flush left, which is an asymmetry, and it is the one thing here a
stakeholder might ask about. Everything else is the 1440 read with more air.

**768 × 1024.** The panels stack, the band's words stack under each other, and the
alignment is free (48px both). The two collage chapters fall back to
`ChapterIntro`'s centred composition — the documented unpinned branch — which
reads as a different rhythm from the desktop one but not as a broken one. The band
is 526px here, taller than at 1440, which is the *"tight where there is room,
taller where there is not"* half of the brief.

**390 × 844.** Photograph-led throughout and legible everywhere. The band shows the
middle of the stitched composite — the two leopards on their rock, with the panther
and the tiger cropped off either edge — which is what putting a heading and a
paragraph on a 2.357:1 photograph at 390px has always cost and is recorded rather
than hidden. Card 02 at 360 is the one I went back and looked at specifically: the
sentence wraps to two lines, all three lines are comfortably legible, and the
seated figure still reads as a photograph rather than a dark rectangle.

### What to flag even though every number passes

1. **The strip's header band is the sparsest thing on the page.** At 1440 it is
   ~470px carrying a chapter mark, a heading, one paragraph and a 300px tiger with
   ~240px of bare cream beside it. It is untouched by client ruling (*"we keep the
   text and the tiger where they are"*), and a wider tiger is the one lever it has.
2. **`philosophy` still reads as the shorter half of its pair** — §2.4. Passing the
   ceiling is not the same as reading full.
3. **The `philosophy / field-days` join is the page's emptiest run of screens** at
   66.4%. It belongs to no chapter, so no chapter's figure shows it, and nothing in
   this branch has looked at it.
4. **At 1920 the band's paragraph stops 160px short of the right edge** while the
   heading is now flush with the panel's own left. If that reads as unbalanced to
   the client, the fix is to let the paragraph out to the mirror-image position —
   but that would move the paragraph, which is exactly what he asked not to happen.

---

## 6. The evidence in this directory

| file | what |
|---|---|
| `closeout-contrast-home.json` | six widths, 156 probes, 0 failures — the band, the panels, the six cards, the header, the menu |
| `closeout-contrast-mahua-vann.json`, `closeout-contrast-mahua-tola.json` | both property routes on the shipping build |
| `closeout-resolution.json` | 0 under-served by `sizes` at every viewport |
| `closeout-density.json`, `closeout-density-step50.json` | the 150px and 50px runs — `philosophy` 42.3% in both |
| `closeout-films.json` | the tiger, on pixels, at six widths |
| `closeout-strip.json` | 12 assertions, 99 widths |
| `closeout-collage-rooted.json`, `closeout-collage-philosophy.json` | the pinned contract on both chapters |
| `closeout-entrances.json` | 30 staged and settled, every parallax moved |
| `closeout-page.json` | transfer, hero arrival, reduced motion, no horizontal scroll at four widths |
| `closeout-budget.json` | 167.5 KB brotli first load |
| `closeout-alignment.txt` | the §1.2 table, straight off the browser at thirteen widths |
| `shots/closeout-join-*.png` | the client's change at 390 / 768 / 1440 / 1920 |
| `shots/closeout-philosophy-*.png` | the density fix at 1440 and 1920 |
| `shots/closeout-strip-1440.png`, `shots/closeout-card02-360.png` | the six cards, and the card that was failing |
