# The flanks, and the tiger — two fixes to the coverflow

**16 Aug 2026.** Two things came out of `density-sweep.md`: a real defect (§9 — the widened card paints
over the closing tiger, and `check_films.mjs` only ever looked at the one width where it does not
happen), and one remaining density lever (§2 — the stage's worst screens are the two moments a single
card sits alone on a 793px stage, and there is no card −1 or card 6 to put at the flanks).

Both are built. Every figure below is `node scripts/measure_density.mjs --port 3110` against a
production build, one build and one fresh server per arm.

**Read the three-arm table first, because the honest answer is not the hopeful one:** the wrap-around
ghosts move `field-days`' worst screen by **−9.3 points**, and the tiger's fix gives all of it back and
a little more. The two are independent — the ghosts are not the thing that cost it — and the trade the
tiger's fix carries is stated in §5 so it can be taken rather than assumed.

> **§1's "B — shipped" row and the whole of §5 were superseded later the same day. Do not quote either
> as current.** The tiger's band was fixed properly rather than traded away: the film is in the header
> band now, `field-days` reads **48.1% mean / 55.0% worst** and the page's worst screen is **67.0%**, not
> 48.6% / 62.3% / 77.1%. Both candidates §5 named were built and measured. **§9 is the live answer**, and
> everything about the film's placement in §3 and §5 is history.

---

## 1. The three arms

| | `field-days` mean | worst | chapter | page mean | images/screen | distinct images | page screens over 45% | page's worst screen |
|---|---|---|---|---|---|---|---|---|
| **baseline** (as `density-sweep.md` left it) | 48.4% | **61.5%** | 3.34 screens | 38.5% | 2.27 | 42 | 41 | 64.6% `lantern-hour / details` |
| **A — ghosts only** (film still absolute) | **46.2%** | **52.2%** | 3.34 screens | **38.2%** | 2.27 | 42 | **40** | 64.6% `lantern-hour / details` |
| **B — shipped** (ghosts + the film's own band) | 48.6% | 62.3% | **3.67 screens** | 39.2% | 2.23 | 42 | 44 | **77.1% `field-days / rooms`** |

Arm A is not shippable — it is the build with the tiger still covered — and it is measured because
without it the two changes are one number and neither can be judged.

**The ghosts' own contribution, like for like.** The screen at `y = 7500` is the same screen in every
arm (the header band and the wrapper begin at the same offsets; only the chapter's tail grew). It reads
**61.5% in the baseline and 52.2% in both A and B**. That is the whole of what the ghosts did, and it is
the chapter's old worst screen.

**`distinctImages` is unchanged at 42 in all three arms**, which is what the ghosts had to be checked
against: `<img>` elements go 43 → 45 and the distinct count does not move, so no density here was bought
by counting one photograph twice. `imagesPerScreen` falls 2.27 → 2.23 in arm B for one reason only — the
chapter is 296px taller — and holds at 2.27 in arm A.

## 2. Fix 2 — the flanks, and whether the arithmetic held

**It held, and it was checked rather than trusted.** The brief's placement was that `--i: -1` centres at
the pin's start and `--i: 6` at its end, because `step = pin-len / (count + 1)` tiles the eight centred
moments across the pin exactly. Measured at four widths, as each card's offset from the stage's centre:

| | `-1` centred | card 1 centred | mid-run | card 6 centred | `6` centred |
|---|---|---|---|---|---|
| 1024×900 | `*06: 0` \| `01: +559` | `*06: −557` \| `01: +1` \| `02: +559` | `02: −558` \| `03: 0` \| `04: +558` | `05: −556` \| `06: +2` \| `*01: +560` | `06: −557` \| `*01: +1` |
| 1280×900 | `*06: 0` \| `01: +559` | `*06: −558` \| `01: 0` \| `02: +558` | `02: −559` \| `03: −1` \| `04: +557` | `05: −557` \| `06: +1` \| `*01: +559` | `06: −557` \| `*01: +1` |
| 1440×900 | `*06: −1` \| `01: +557` | `*06: −559` \| `01: −1` \| `02: +557` | `02: −556` \| `03: +2` \| `04: +560` | `05: −558` \| `06: 0` \| `*01: +558` | `06: −559` \| `*01: 0` |
| 1920×1080 | `*06: 0` \| `01: +559` | `*06: −559` \| `01: −1` \| `02: +557` | `02: −559` \| `03: 0` \| `04: +558` | `05: −560` \| `06: −1` \| `*01: +557` | `06: −557` \| `*01: +1` |

`*` is a ghost; the number is px from the stage's centre. Nothing was nudged, and no constant was added:
the `animation-range` formula in `app/globals.css` is byte-for-byte the one that was already there.
`scripts/check_coverflow.mjs` bisects all eight cards to their own centred moments and reads a worst
error of **2.82px at 1440×900 and 5.92px at 390×844**, against an 8px tolerance, with the card in charge
advancing **0 → 7** at both shapes.

**A card and its own ghost are never on the stage together**, which is the property that decides whether
this reads as a loop or as a bug, and it falls out of the schedule rather than being arranged: when
`*06` is centred, the real card 6's window has not opened (it is parked off-right), and when `*01` is
centred, card 1's has long closed. Every column of the table above shows it.

### One correction the rig needed, and it is not a relaxation

`check_coverflow.mjs` required every card to reach the centre **while the stage is pinned**. The two
ghosts do not, by construction: their centred moments are the pin's own two edges. At 390×844 the last
ghost's offset never went negative anywhere in the pinned window, because that crossing *is* the window's
closing edge.

The bisection now runs over every sample rather than the pinned ones, and the "while pinned" half is
asked of the six activities only. Nothing about the ghosts went unasserted: that they are the cards at
the centre when the pin begins and ends is still required, and required more directly, by the rig's
existing (c) and (d) — the card whose arrows are live is the one nearest the centre, and the order across
the pin runs 0 → 7.

### Three things the ghosts are not allowed to be

- **Not activities.** Both are `aria-hidden="true"`, and `check_coverflow.mjs` now counts them off the
  DOM (`2` expected) rather than off the component.
- **Not tab stops.** Their arrows are real links — see below — with `tabindex="-1"`, so the tab order
  still holds **12** arrows, also counted off the DOM.
- **Not duplicate ids.** They carry none; the six scroll targets are still the wrapper's. The rig now
  scans the whole chapter for duplicate ids, because a ghost with its twin's id is a silent defect —
  every arrow pointing at it would land on whichever the browser saw first.

### Where the brief was deviated from: the ghosts keep their arrows

The brief said ghosts have none. They have them, as real `<a>` links to the same six targets, out of the
tab order and inside an `aria-hidden` card. Both reasons the brief gave are still satisfied (six
activities announced, twelve arrows in the tab order); what an armless ghost would have cost is:

- **A card a visitor cannot advance from.** A ghost is what is centred through the whole of the stage's
  ride-in and ride-out — the longest single stretch either card is on screen — so the one card on the
  stage would be the one with no arrows.
- **A hole in an existing invariant.** `@keyframes coverflow-arrows` gives each card the middle half of
  its own arc and those windows *tile* the pin. With `:first-child`/`:last-child` carrying the two
  open-ended variants and the ghosts holding them, the tiling is unchanged. With no arrows on the ghosts
  there would be no live arrow at either end — the exact defect the two `-first`/`-last` keyframe sets
  were written to repair, reintroduced.
- **A visibly different card.** The arrow row is a hairline and two labels inside the card's own box; a
  ghost without it is not a copy.

## 3. Fix 1 — the tiger, and why the fix is geometry

The film cannot be raised above the stage: it erases its own white ground with `mix-blend-mode: darken`
against the chapter's cream, so it has to paint *before* the stage and may never be given a stacking
context of its own (correction B, `DECISIONS.md` §14). It cannot be moved sideways either — at 1024 the
card is 900px of a 928px container. So the only fix is vertical clearance.

`.coverflow` now holds a **`.coverflow-track`**, and the track is the sticky stage's containing block.
`position: sticky` stops when the sticky box's bottom meets its containing block's bottom, so anything
laid out below the track is somewhere no card can reach. The film sits there, in flow, with

```css
.coverflow-footer { margin-top: calc(2.5rem - var(--cf-card-foot)); }
```

`--cf-card-foot` is the cream a centred card leaves beneath itself, `(stageHeight − cardHeight) / 2`,
built from the same `min(cardMax, 100vw − 2 × gutter)` expression the card inlines. The rule spends every
pixel of that on the film and keeps a 2.5rem gap. Measured at 1440×900: `--cf-card-foot` is 143px, the
film is 400px tall, the footer's margin computes to **−103.4px**, and the chapter grows by **297px**
rather than by the film's whole 400.

A plain subtraction, not a clamped one, on purpose: on a viewport short enough that the card is taller
than the stage (a landscape phone at 844×390 gives a 448px card in a 313px stage) `--cf-card-foot` is
negative and the same expression becomes a positive margin that pushes the film clear of a card
overflowing its own stage.

**The card timings did not move by a pixel**, and that is the reason this construction was chosen over
shortening the pin: `animation-range` offsets here are lengths from the start of `cover`, and `cover`
starts when the *wrapper's* top edge enters the scrollport. Growing the wrapper at its foot lengthens
`cover` past every offset in use and shifts none of them — §2's table is the after, and it is identical
to the arithmetic.

## 4. `check_films.mjs`, widened — watched failing first

The rig measured one viewport, 1440×900, which is the one width at which this overlap does not happen.
Worse, when the overlap finally did reach 1440 the sentence it printed was a false diagnosis: *"the white
ground is showing as a rectangle"*, about a corner pixel that was a photograph.

It now asks two questions instead of one, at six widths (390, 1024, 1280, **1366×768** — a `short:`
viewport — 1440, 1920):

- **5b, the geometry.** At twelve scroll positions per width, while the box is on screen: does any
  element that actually paints anything overlap the film's box? Geometry rather than `elementFromPoint`,
  deliberately — the coverflow's stage is `pointer-events: none` so the tiger stays hoverable through it,
  and hit-testing does not return such elements at all. This is the assertion that catches a card over
  the tiger's head while all four corners still sit on cream.
- **5, the pixels**, with the box fully in view; and the message now distinguishes *white* (the blend has
  stopped working) from *covered by X* (naming the element) from *neither*.

**Watched failing against the build that had the defect**, which is what the numbers below are:

| | before — covered at | worst overlap | corner drift | after |
|---|---|---|---|---|
| tiger @ 390×844 | **12 / 12** positions | `li.coverflow-card` 240×32 | 155 levels | 0 / 12, drift **3** |
| tiger @ 1024×900 | **12 / 12** | `li.coverflow-card` 286×257 | 198 | 0 / 12, drift **1** |
| tiger @ 1280×900 | **12 / 12** | `li.coverflow-card` 158×257 | 180 | 0 / 12, drift **0** |
| tiger @ 1366×768 | **12 / 12** | `li.coverflow-card` 115×323 | 188 | 0 / 12, drift **0** |
| tiger @ 1440×900 | **12 / 12** | `li.coverflow-card` 78×257 | 129 | 0 / 12, drift **0** |
| tiger @ 1920×1080 | 0 / 12 | — | 0 | 0 / 12, drift **0** |
| potter, all six widths | 0 / 12 | — | 0–1 | 0 / 12, drift 0–1 |

Tolerance is 6 levels. The potter is clean before and after at every width — the widening found no
collateral defect. The 1920 row is the reason no rig ever saw this: it is the shape closest to the one
the rig used to measure, and it is the shape where the card is narrow enough relative to the container to
miss the film. Screenshots per width are written to `docs/reviews/2026-08-08-films/widths/`.

The rest of the film contract still passes on the shipped build: plays once, holds at 10.00s, hover
replays (10 → 0.88s), hover ignored mid-play, a parked pointer does not re-fire, reduced motion plays
nothing, no-JS still present, neither film in the first load.

## 5. What the tiger's fix cost, and the lever that is left

The band is a 1344 × 297 strip carrying one 300px-wide drawing — **78% cream** — and it lands on the
chapter's own tail. It takes `field-days` from 46.2% / 52.2% to **48.6% / 62.3%**, the chapter from 3.34
to 3.67 screens, and it puts the page's new worst screen at `field-days / rooms` (**77.1%**, from
somewhere under 58.3% in the baseline). The chapter's worst screen also *moved*: it was `y = 7500` inside
the pin and is now `y = 8850`, the stage's ride-out with the film below it.

**The alternative is to take the band out of the pin rather than add it to the chapter** — shorten
`--cf-pin-len` and the track by the same amount, leaving the chapter exactly as tall as it was. It is not
free either: it speeds the carousel by 29%, from a 279px arc per card to 199px, on a page whose brief is
unhurried, and `COVERFLOW.screens` would then mean something different from what its own doc comment
(and `density-sweep.md` §6's sweep at 2 / 2.5 / 3) measured. It was **not** built, for a second reason
worth stating: expressing it in CSS needs the film's own height as a constant, and the film is sized in
`app/page.tsx` (`w-[240px] sm:w-[280px] lg:w-[300px]` of an 810×1080 source) — a coupling between two
files that nothing would hold in step.

Two smaller trims were considered and rejected: hanging the film into `ChapterSurface`'s own 80px bottom
padding (recovers 80px, and couples this rule to a rhythm dial in another file — past that padding the
next section's background paints *over* the film, so the failure is silent and total), and cutting the
2.5rem gap (recovers ~24px, and makes the pinned gap disagree with the fallback's for no visible gain).

**The chapter still does not meet non-negotiable #8, and the reason has not changed**: `density-sweep.md`
§7 established that 45% worst needs a ~1,090px card and the photographs run out at 903px. The ghosts are
worth 9.3 points of that gap and they are the last lever inside the composition; the rest is still the
higher-resolution originals asked for in §7.

## 6. Read by eye, at 1024 / 1280 / 1440 / 1920

Not "it looks fine" — what was actually on the screen. Every frame below is reproducible: scroll to
`wrapperTop − headerHeight + (slot + 1) × step`, with `step = (screens × 100svh − 100svh + header) / 7`.

- **The loop coming in, at 1440.** Card 06 *Walks and cycling* dead centre, and the safari vehicle of
  card 01 entering from the right — smaller, veiled, running off the edge. It reads as **the carousel
  arriving**, not as a duplicate, and the reason is visible rather than inferred: the real card 06 is
  nowhere on the screen. Cream fills the left flank, which is the honest residue — there is no card −2.
- **Card 06 centred, at 1440.** Potters' village on the left, *Walks and cycling* centred, the safari
  ghost on the right. **This is the screen that used to hold one card alone**, and it now holds three.
  It is indistinguishable from a mid-run screen, which is exactly the point.
- **The loop going out, at 1280.** *Walks and cycling* leaving to the left, *Jungle safari* centred, and
  the tiger's ears just appearing at the bottom right, clear of the card. The wrap reads as the carousel
  coming round rather than as the page repeating itself.
- **At 1024**, the narrowest desktop tested: the card is 900 of a 928px container, so a flank is a sliver
  — about 60px of the neighbour. It still reads as depth rather than as a stray edge, but this width is
  where the effect is thinnest and it is worth knowing.
- **Mid-run at 1920** is untouched by this work and is still the best view: three cards, both neighbours
  fully legible as neighbours.
- **The tiger, at 1024 and 1440.** Whole, on bare cream, no card over any part of it — at 1024 this is
  the frame that used to show the card across its upper body. And this is also where the cost is visible
  to the eye: the drawing is 300px wide at the right of the container with the card already leaving the
  top of the screen, so a good third of that screen is cream. It is not broken; it is thin, and the
  62.3% is that screen.

## 7. What either fix broke

One thing, found by probing and fixed: **the ghosts appeared in the flow fallback.** With no
`animation-timeline`, or under reduced motion, the stage is a plain vertical list — and it rendered
**eight** cards, 06 / 01 / 02 / 03 / 04 / 05 / 06 / 01, opening with a repeat of its own last entry. A
wrap-around copy earns its place in a carousel and is simply wrong in a list. `app/globals.css` now turns
them off in the base rule and again under reduced motion, and `check_coverflow.mjs` has a reduced-motion
arm that reads **6 of 8 cards rendered, stage static, animations none**. (The failing state was observed
on a real build — `cardsStackedVertically: 8` — before the rule was written.)

Nothing else moved:

| | |
|---|---|
| `npm test` | **492 passed** (was 485; the seven new cases are the header band's three `sizes` slots being registered — §8) |
| `npm run build` | pass |
| `npm run lint` | 0 errors, the same 5 pre-existing warnings |
| `check_coverflow.mjs` | **PASS** — 8 cards, order 0→7, worst centring 2.82px / 5.92px, plus the new reduced-motion arm |
| `check_films.mjs` | **PASS** at all six widths |
| `check_image_resolution.mjs` | **0 under-served** at 390@1×, 390@3×, 768@1×, 1440@1×, 1920@1× |
| `npm run verify:budget` | **PASS — 168.2 KB brotli first-load JS, delta 0.** The ghosts are two more server-rendered `<li>`s and the tiger's fix is one CSS rule |

## 8. The two small things that were owed

- **`lib/sizes.test.ts`'s tripwire had a substring hole.** It asserted that its own source
  `toContain("@/components/sections/Coverflow")` — a **substring** of
  `"@/components/sections/CoverflowCard"`, which something else already imported. So the test written to
  make a forgotten component impossible read green for a file it had never seen, and `Coverflow.tsx`'s
  `SIZES`/`BOXES` were never registered. It now matches the specifier *with its closing quote*, which is
  what makes a prefix stop being a match. All three of that band's strings turned out to be genuinely new
  (**26 → 29**, read off the suite's own failure, not computed), and `Coverflow.tsx` is in the `CASES`
  list, so its `aspect-square` / `aspect-[3/2]` / `aspect-[16/9]` classes and `BOXES` are now held to each
  other in both directions.
- **The stale `560px` / `608px` comments** in `CoverflowCard.tsx` and `lib/sizes.test.ts` are corrected to
  948px / 900px, with a line saying why they moved without anyone editing the expression that produces
  them.

---

# 9. The tiger's band, fixed properly — the third placement (16 Aug 2026)

§5 above left a trade "for the client to take": the film's own band is 78% cream, it lands on the join
with `05 · Rooms`, and it made **77.1%** the emptiest screen on the whole site. That is not a trade worth
handing over, and it is now closed. Two candidates were built and measured; a third arm of the second is
what ships.

**Every figure below is `node scripts/measure_density.mjs --port 3110` against a production build, one
build and one fresh server per arm** — the same instrument and the same procedure as §1.

## 9.1 The table

| arm | `field-days` mean | worst | chapter | page mean | page worst | images/screen | screens over 45% | a card's arc |
|---|---|---|---|---|---|---|---|---|
| **B — as §5 shipped it** (film in a band at the tail) | 48.6% | 62.3% | 3.67 | 39.2% | **77.1%** | 2.23 | 44 | 576px |
| **C1 — the band taken out of the pin** | 48.8% | 61.7% | **3.34** | 39.1% | 76.3% | 2.16 | 42 | **406px** |
| **C2 — the film into the header band, below `guide-sunrise`** | 51.6% | 65.3% | 3.57 | 38.9% | 67.0% | 2.29 | 41 | 576px |
| **C2-top — the film into the header band, ABOVE `guide-sunrise`** | **48.1%** | **55.0%** | 3.57 | **38.9%** | **67.0%** | **2.29** | **41** | 576px |

**C2-top ships.** It is the only arm that beats B on all three figures the bar was set against — chapter
mean, chapter worst, page worst — and it does so while leaving the pin untouched, so the wrap-around
ghosts keep the whole of their gain.

## 9.2 Candidate 1: take the band out of the pin — measured, and rejected

Built exactly as §5 described it: `.coverflow-track`'s height and `--cf-pin-len` both lose
`--cf-band` = `filmHeight + 2.5rem − cardFoot`, so the wrapper measures exactly `screens × 100svh` and
the chapter is the height it was before the film needed clearance. Confirmed in the browser: wrapper
**1800px** at every 900px-tall viewport (2160 at 1080), track **1503px**, section 3003px against B's
3299px.

It works. It is not worth what it costs:

- **It does not touch the defect.** The film's band is still 297px of 78% cream at the chapter's tail —
  the same band, 297px earlier in the document. The join screen's *composition* is identical, and it
  measured identical: **76.3%** against 77.1%, which is the sampling grid landing differently and nothing
  else. That was predicted from the geometry before the arm was built; the number is here because a
  prediction is not a measurement.
- **The chapter's mean gets slightly worse**, 48.6% → **48.8%**. Removing 297px of *pin* removes screens
  that were scoring **below** the chapter's mean, so the mean rises. Everything C1 wins is at page level
  and comes from the document simply being 297px shorter.
- **`imagesPerScreen` reads 2.16 against 2.23**, and that is this rig's known `currentSrc` flake
  (`density-sweep.md` §5): 40 distinct against 45 `<img>` elements in this arm, 42 in B, 43 in C2. Read it
  as 2.27. Neither a regression nor a gain.
- **It costs 29% of the carousel's pace**, exactly as §5 predicted: `--cf-pin-len` 1007 → 710px, step
  143.9 → 101.5px, a card's arc 576 → 406px, on a page whose brief is unhurried.
- **And it eats most of the centring rig's margin.** `check_coverflow.mjs` PASSes, but worst centring goes
  **2.82px → 6.62px** against an 8px tolerance, because the same absolute error is a larger share of a
  shorter pin. A future `screens` change would have half the headroom it has today.

`--cf-band` also needed a floor: at 844×390 a 796px card in a 283px stage makes `--cf-card-foot`
**−82px**, the raw band 496px, and an unclamped subtraction leaves a pin **1.3px long** — six cards
through a slit. It was capped at half the pin. All of that machinery is reverted; it is written down here
so nobody builds it a second time.

**On the coupling §5 warned about:** it is real, and the answer is not to document it twice but to remove
it. The stylesheet needs the film's *height*; `app/page.tsx` was writing its *width*. The arm put a single
`--cf-film-w` in `app/globals.css` with `--cf-film-h` derived from it and pointed `app/page.tsx` at a
`.coverflow-film` class — one declaration, two consumers, nothing that can drift. That is the shape any
future version of this should take. It went with the rest of the arm.

## 9.3 Candidate 2, as briefed: dead — and here is the measurement that kills it

> *"If the text column bottoms out shorter than the photograph column at any width, that slack is a hole
> the film can fill for free."*

**It does not, at any width. The text column is the taller of the two everywhere**, measured on the
shipped build at the four review widths:

| viewport | text column (`col-span-5`) | photograph column (`col-span-7`) | slack in the TEXT column |
|---|---|---|---|
| 1024×900 | **698px** | 345px | **0** — it is 353px taller |
| 1280×900 | **756px** | 445px | **0** — 311px taller |
| 1440×900 | **729px** | 507px | **0** — 222px taller |
| 1920×1080 | **729px** | 569px | **0** — 160px taller |

The reason predates this work and is in `Coverflow.tsx`'s own comment: the `tiger-crossing-track` square
joined the text column when it came off the cards, and 277px of type + 32px + a 420px square is taller
than a 3:2 frame in the wider column at every width. So the band does not "bottom out level" — it bottoms
out with the hole on the **other** side, at the top of the photograph column, which is exactly where
`items-end` was putting it on purpose.

**That hole is real, and it is 353 / 311 / 222 / 160px — none of which fits a 400px film.** So this
placement is not free either. What it is, is *cheaper*: the row grows by the difference —
**79 / 121 / 210 / 272px** — where a band at the tail costs 297px, and it grows at the chapter's dense
head instead of at its empty join. Measured after the change: row 1 is 777 / 877 / 939 / 1001px tall, and
the photograph column is now the taller one by exactly those figures.

`lg:items-end` became **`lg:items-start`** for that reason and not for taste: with the film in it the
photograph column wins, and bottom-aligning would push the chapter mark and the heading 210px down the
page at 1440. Top-aligning moves the slack to the foot of the text column, under the safari square.

## 9.4 Which end of that column — one line of markup, ten points

C2 and C2-top differ by moving one `<div>` above the `ImageReveal` instead of below it, and `margin-top`
→ `margin-bottom`. **48.1% / 55.0% against 51.6% / 65.3%.**

The mechanism generalises, so it is worth keeping. Whichever end the film takes, the row's growth leaves
the *same* strip of cream at the foot of the text column; the only thing that changes is what that strip's
neighbour is across the gutter. Put the film at the bottom and the neighbour is a 300px drawing, and a
900px screen catches the two together — that screen measured **65.3% empty** at `y = 7050` and became the
chapter's worst. Put the film at the top and the neighbour is `guide-sunrise`, 761px wide, and the
chapter's worst screen goes back inside the pin where it was before any of this.

## 9.5 The accounting trick in the chapter's own mean, stated so nobody re-reads it wrong

B's chapter mean (48.6%) is **flattered**; C2-top's (48.1%) is honest. In B the film's band sits on the
boundary, so the screens carrying its cream are scored as `field-days / rooms` **joins** and are excluded
from the chapter's own mean — they surface only as the page's worst screen. In C2-top the film is inside
the chapter, so the chapter pays for its own figure. C2-top wins the comparison anyway, which is the
point; but the page-level figures are the ones free of this artefact, and they are unambiguous:

| | page mean | page worst | images/screen | screens over 45% |
|---|---|---|---|---|
| B | 39.2% | 77.1% | 2.23 | 44 |
| **C2-top** | **38.9%** | **67.0%** | **2.29** | **41** |

The page's emptiest screen is `field-days / rooms` either way — but it is now the pin's own ride-out plus
the join's 160px of stacked padding, which is the shape that scored ≤58.3% before the tiger's band ever
landed there, and not a strip of cream with a drawing in one corner.

## 9.6 Read by eye, at 1024 / 1280 / 1440 / 1920

Not "it looks fine" — what was on the screen. Frames in the session scratchpad,
`tiger/final-<width>-{band,band2,tail}.png`.

- **1024 and 1280 are the best of the four.** The drawn tiger sits at the top right, directly above
  `guide-sunrise` — the photograph of a naturalist scanning with binoculars — with the safari square
  below-left. The adjacency does real work: the drawn animal is what the man with the binoculars is
  looking for. It reads as a field-guide plate at the head of a chapter about going out to look for
  animals, not as a drawing parked where there happened to be room.
- **1440 holds.** More air around it, because the gutter between a `col-span-5` and a `col-span-7` is what
  it is, but the reading is the same and the tiger is unmistakably part of the band.
- **1920 is where the cost is visible**, and it is visible as one thing: a 594 × 272px block of cream
  below the safari square, between it and the hammocks of row 2. It reads as a pause rather than as a
  hole — the composition is asymmetric by design and the right-hand column is full — but this is the
  widest it gets, and it is the first thing to look at if this is ever revisited. See §9.8.
- **The chapter's tail, at 1440 and 1920.** The carousel rides out with a full card on the stage and
  nothing beneath it. The orphaned strip §5 shipped is gone, and that is the 10 points.
- **The tiger no longer closes the chapter — it opens it.** Non-negotiable #5 is about behaviour rather
  than position: it arrives, performs once, dozes, and hover still replays it. What changes is that it
  performs as the chapter arrives instead of as it ends. That is a real change to the reading and it is
  the client's to reject; the alternative is `B`, and `B`'s number is 77.1%.

## 9.7 The gates, on the shipped build

| | |
|---|---|
| `check_films.mjs` | **PASS at all six widths** — 0/12 covered positions for both films at 390 / 1024 / 1280 / 1366×768 / 1440 / 1920, corners within 0–1 levels of cream against a tolerance of 6. Plays once, holds at 10.00s, hover replays (10 → 0.86s), hover ignored mid-play, a parked pointer does not re-fire, reduced motion plays nothing, no-JS stills present, neither film in the first load. |
| `check_coverflow.mjs` | **PASS** — 8 cards, order 0→7 at both shapes, worst centring **1.85px** at 1440×900 and 5.92px at 390×844, plus the reduced-motion arm (6 of 8 rendered, stage static, animations none). The pin is byte-identical to B, which is why these are B's own numbers. |
| `measure_density.mjs` | `field-days` **48.1% / 55.0%**, page mean **38.9%**, page worst **67.0%**, 2.29 images per screen, 41 screens over 45%. |
| `check_image_resolution.mjs` | **PASS** — 0 under-served at 390@1×, 390@3×, 768@1×, 1440@1×, 1920@1×. Unchanged, as expected: no column width and no `sizes` string moved, only vertical order. |
| `npm test` | **492 passed**, unchanged. |
| `npm run build` | pass. |
| `npm run lint` | 0 errors, the same 5 pre-existing warnings. |
| `npm run verify:budget` | **PASS — 168.2 KB brotli first-load JS, delta 0.** The change is a moved `<div>` in a server component and three CSS rules. |

## 9.8 What this leaves, honestly

- **The chapter still does not meet non-negotiable #8.** 55.0% worst against a 45% ceiling. The cause is
  unchanged and is not this: `density-sweep.md` §7 established that 45% worst needs a ~1,090px card and
  the photographs run out at 903px. Higher-resolution originals are still the lever, and the ask is still
  the one in §7.
- **At 1920×1080 the chapter is 65px *taller* than B**, not shorter — the header band grows by 272px there
  while the tail band it replaces only cost 207px at that viewport height. At 1440×900, this project's
  measuring shape, it is 86px shorter (3213 against 3299px). Both were measured; neither changes a verdict
  above.
- **One lever was found and deliberately not pulled**, because it is a different decision and belongs to
  whoever owns the photographs. `SIZES.track` caps the safari square at **420px** against a 541px file,
  chosen "with room to spare". Letting it fill its column instead would take the text column to 770 / 850px
  at 1280 / 1920 and cut the cream block below it from 121 / 272px to about **107 / 151px**, while adding
  real imagery — at the cost of drawing a 541px file at 527px at 1440, i.e. spending the whole of that
  margin at DPR 1. It needs `lib/sizes.test.ts`'s registered count updated and `check_image_resolution.mjs`
  re-run. Not taken here; the number is recorded so that it can be.
- **`--cf-card-foot` is gone from `app/globals.css`.** Nothing consumed it once the footer left, and a
  declared-but-unused custom property invites a later reader to conclude it does something. Its expression
  and its landscape-phone sign flip are written into the comment that replaced it.
- **The slot is `figure`, not `footer`, on `Coverflow`.** `SplitFeature` can put a drawing at the foot of a
  chapter because a prose band leaves cream there. A pinned stage does not: at 1440×900 a centred card is
  506px of a 793px stage and the film is 400px tall, so there is no scroll position at which both fit one
  screen. The name now says which of the two this is.
