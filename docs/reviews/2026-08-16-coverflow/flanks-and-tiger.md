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
