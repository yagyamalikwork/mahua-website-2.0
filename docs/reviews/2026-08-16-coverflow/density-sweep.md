# `04 · Days in the Field` — the coverflow's density, swept

**16 Aug 2026.** Task 6 of `docs/superpowers/plans/2026-08-16-field-days-coverflow.md` shipped the
coverflow and measured the chapter at **70.7% mean / 83.1% worst empty** at 1440×900, against
**43.9% / 57.9%** for the three prose bands it replaced and against CLAUDE.md non-negotiable #8's
**45% ceiling on a chapter's worst sampled screen**. It became the emptiest screen on the whole page.
The plan's own premise — *"leave the chapter denser and shorter than it is today"* — did not hold as
built.

This is the measurement that was owed. It sweeps the two dials that were never swept, says what each
one buys, and says plainly where the ceiling still is not met and what the remaining lever is.

Every figure is `node scripts/measure_density.mjs --port 3110` against a production build, one build
and one fresh server per arm, driven by a script so the arms differ in exactly one number.

**Three things to read before acting on any of it:**

1. **The ceiling is still not met.** `cardMaxPx: 900` — the largest card every photograph can fill —
   takes `field-days` from 70.7% / 83.1% to **48.4% / 61.5%**, and 61.5% is 16.5 points over the 45%
   worst-screen ceiling. **No value inside the library's own resolution meets it**; ~1,090px would, and
   that needs originals nobody has. §7, §8.
2. **`scripts/check_films.mjs` is red at 900, and one part of that is a genuine defect** — the widened
   card covers the closing tiger below ~1430px of viewport. It is a pre-existing conflict (already true
   below ~1090px at the shipped 560) that this change widens, and its fix is in `app/globals.css`, which
   this task could not touch. **§9.**
3. Nothing here weakened a rig, re-aimed an assertion, or moved a ceiling.

---

## 1. Why 560 was never a limit

`COVERFLOW.cardMaxPx: 560` arrived in Task 4 with the comment *"Matches `ROOM_STACK.heightMax`'s
reasoning"* — an analogy to a different component's dial, in a different composition, measured against
nothing. Task 4's own doc comment even said `screens` would be "chosen by measurement, not by feel" and
said nothing of the kind about `cardMaxPx`.

This project has a named, repeated failure for exactly that shape, and it happened twice in the two days
before this one: a photo width share declared spent at 65% that swept cleanly to 75% (`DECISIONS.md`
§18), and a plate rig's 85% shrink tolerance that certified a defect as fixed (§19). **When a rule bounds
a value, the build must solve for the bound.** A number picked in a plan is read downstream as a limit
and reported "spent" rather than swept.

## 2. The geometry, before any measurement

A card is `min(cardMaxPx, 100vw − 48px)` wide in a 16:9 box, centred on a sticky stage
`100svh − header-height` tall — 793px at 1440×900. So on a 1440×900 screen:

| | |
|---|---|
| card at 560 | 560 × 315 = **13.6%** of the screen |
| the stage it floats in | 1440 × 793 = 71% of the screen, and the rest of it is cream |

Two distinct populations of screen exist inside the pin, and they score very differently:

- **Mid-run** — three cards on the stage: the centred one, and both neighbours shifted out past its
  edges and clipped by the viewport. Measured 27% imagery at 560.
- **The holds** — `@keyframes coverflow-pass-first` / `-last` hold card 1 at centre while the stage rides
  in and card 6 while it rides out, and through those holds **every other card is at `--cf-off`, off
  screen**. One card, alone, on a 793px stage. Measured 15.7% imagery at 560, and this is the chapter's
  worst screen at every card width tested.

The worst screen is therefore governed by one number — the area of a single card — and the only lever on
it inside `lib/motion.ts` is `cardMaxPx`. `sideScale`, `sideShiftPct` and `sideVeil` all describe
neighbours that are not on screen when the worst screen is sampled. `screens` changes how many screens
the pin spends, not what any one of them contains.

## 3. What actually caps the card: the photographs, not the layout

A card can only be as wide as its narrowest photograph, and the binding figure is **not** the file width.
`object-fit: cover` in a 16:9 box draws a photograph *wider than the box* whenever the photograph is
wider than 16:9 — `drawnWidth = boxHeight × imageAspect = cardWidth × (9/16) × imageAspect` — so a 2.289:1
panorama in a 16:9 card needs **1.288 × the card's width** in source pixels.

| Card | Photograph | Source | Aspect | Widest card it serves at DPR 1 |
|---|---|---|---|---|
| 1 Jungle safari | `tiger-crossing-track` *(replaced)* | 541 | 1.065 | **541** |
| 1 Jungle safari | `vann-safari` *(now)* | 1163 | 2.289 | 903 |
| 2 Bird watching | `vann-bird-watching` | 1163 | 2.289 | 903 |
| 3 Kohka Lake | `vann-kohka-lake` | 1163 | 2.289 | 903 |
| 4 The river walk | `forest-boardwalk-daylight` | 1440 | 1.500 | 1440 |
| 5 Pachdhar | `vann-potters-village` | 1163 | 2.289 | 903 |
| 6 Walks and cycling | `forest-trail-canopy` | 960 | 1.500 | 960 |

`tiger-crossing-track` at 541px was **already short of the 560px card it was being drawn in**, and it
blocked every larger value outright. It is replaced on card 1 by `vann-safari` — 1163px, and literally a
photograph of an open safari vehicle on a morning game drive, so it is the better pairing as well as the
bigger file — and moved into the header band, where it is a 420px square beside the paragraph about the
gates opening. It did not leave the chapter; `content/chapters.ts`'s `media` list is ten now, not nine.

**After the swap the honest ceiling is 903px**, set by the four 2.289:1 panoramas, not the 960px of
`forest-trail-canopy`. Above 903 those four ship soft on an ordinary 100%-scaled laptop — which is what
the client tests on. `scripts/check_image_resolution.mjs` does not *fail* on it (a photograph already
served its widest file is `atLibraryCeiling`, a class that is reported and not enforced), so the rig is
not the guard here; the number above is.

## 4. The header band, changed first and measured on its own

Moving `tiger-crossing-track` off the cards forced the band to change, so it was measured before the
sweep started, with `cardMaxPx` still at 560. Three edits, all in `components/sections/Coverflow.tsx`:

- The track frame joins the row-1 text column, under the paragraph about the gates opening — **1:1, capped
  at 420px**. Its own file is 541px, so 420 is fully served at DPR 1 at every viewport, and 1:1 is the
  photograph's own shape (1.065:1): the 16:9 card it came out of was taking **40% of its height**, which
  cuts the tiger's legs and the vehicle's canopy. A 1:1 box takes 6.1% of its width and cuts nothing.
- `guide-sunrise` moves from a 16:9 box to **3:2** — its own native ratio, 1.502:1, so the crop goes from
  15.5% of its height to nothing, and the frame grows from 428px to 507px tall at 1440. It cannot go
  taller: at 1920 the column is 854px and a 5:4 box would ask 1,026px of a 1,000px file.
- Row 2 is untouched.

| | mean empty | worst empty | chapter height | page mean | images/screen |
|---|---|---|---|---|---|
| Task 6's band (three photographs) | 70.7% | 83.1% | 3.00 screens | 41.0% | 2.25 |
| this band (four photographs) | **65.2%** | 82.9% | 3.34 screens | 41.1% | 2.32 |

**−5.5 points of chapter mean for +0.34 screens, and the worst screen does not move at all.** That last
part is the whole diagnosis in one number: the worst screen is inside the pin, the band cannot reach it,
and no amount of work on the band ever will.

## 5. The sweep: `COVERFLOW.cardMaxPx`

`screens` held at 2. One build and one fresh server per arm; `node scripts/measure_density.mjs --port 3110`.

| `cardMaxPx` | card at 1440 | `field-days` mean | `field-days` worst | chapter height | page mean | images/screen | page screens over 45% |
|---|---|---|---|---|---|---|---|
| **560** (Task 6) | 560 × 315 | 65.2% | 82.9% | 3.34 | 41.1% | 2.32 | 43 |
| 700 | 700 × 394 | 58.5% | 75.2% | 3.34 | 40.1% | 2.27 | 43 |
| 800 | 800 × 450 | 53.2% | 68.6% | 3.34 | 39.3% | 2.27 | 43 |
| **900** | 900 × 506 | **48.4%** | **61.5%** | 3.34 | **38.5%** | 2.27 | 41 |
| 960 | 960 × 540 | 45.4% | 56.5% | 3.34 | 38.0% | 2.27 | 38 |
| 1120 | 1120 × 630 | 36.7% | **42.3%** ✓ | 3.34 | 36.6% | 2.27 | 30 |

*(A 1300 arm was queued as a second bracket above the crossing and was not measured — the sweep process
was killed after its build. It was not re-run: 960 and 1120 already bracket 45%, and no value above 1120
is reachable by any photograph in this chapter, so a 1300 reading would have been a number with nothing
to spend it on.)*

Three things read straight off that table:

1. **`cardMaxPx` is a free density lever — it costs no scroll at all.** The chapter is 3.34 screens and
   the document is 16,686px at *every* arm: the wrapper's height is `screens × 100svh` and has nothing to
   do with the card's size. Every point of density in this table is bought for nothing.
2. **The relationship is steep and monotone**: roughly −7 points of worst-screen empty per 100px of card.
3. **45% worst is crossed between 960 and 1120** — interpolating the two, at about **1,090px**.

*(`images/screen` reading 2.32 at one arm and 2.27 at the others is the density rig, not the page:
`vann-kohka-lake`'s `<img>` is in the document at every arm — all seven report 43 elements — but its
`currentSrc` had not resolved when the inventory ran in five of them. The pre-existing baseline has the
same flake, 41 distinct against 42 elements. Read 2.27–2.32 as one figure, up from the baseline's 2.25.)*

## 6. The sweep: `COVERFLOW.screens`

`cardMaxPx` held at 900.

| `screens` | chapter height | `field-days` mean | `field-days` worst | page mean | images/screen | document | page screens over 45% |
|---|---|---|---|---|---|---|---|
| **2** | 3,003px (3.34 screens) | **48.4%** | 61.5% | **38.5%** | **2.27** | 16,686px | **41** |
| 2.5 | 3,453px (3.84) | 48.9% | 61.5% | 38.8% | 2.26 | 17,136px | 45 |
| 3 | 3,903px (4.34) | 49.3% | 61.5% | 39.2% | 2.20 | 17,586px | 48 |

**2 wins on every figure, and the worst screen is identical at all three.** That identity is the point:
`screens` changes how many screens the pin spends, not what is on any one of them, so it cannot touch the
figure non-negotiable #8 actually binds on. The mean moves the *wrong* way as the pin lengthens, because
every screen it adds is a pin screen and pin screens are the emptiest ones — they dilute the dense header
band's share of the chapter. And the page follows it down: mean 38.5 → 39.2%, images per screen 2.27 →
2.20, screens over the 45% budget 41 → 45 → 48.

So the brief's hypothesis — that `screens` "affects page-level density and pace, not the chapter's own
composition much" — **holds, and is slightly stronger than stated**: it affects the chapter's mean too,
adversely, and its worst not at all. It is `rooted`'s own lesson (non-negotiable #9) in the same
direction: a pin that adds no photographs buys nothing by getting longer.

## 7. Where the two constraints cross, and where they do not

Two numbers out of the two sections above, on the same axis:

```
                    903px                                   ~1,090px
  ──────────────────┼───────────────────────────────────────┼──────────►  cardMaxPx
   every photograph │  four panoramas ship soft at DPR 1    │  45% worst
   fully served     │                                       │  finally met
```

**They do not overlap.** The largest card every photograph can fill is **903px**; the smallest card that
puts the chapter's worst screen under 45% is about **1,090px**. The gap is ~21%, and nothing inside
`lib/motion.ts`, `content/` or `components/sections/Coverflow.tsx` closes it:

- `sideScale`, `sideShiftPct` and `sideVeil` all describe the neighbours, and **the worst screen has no
  neighbours on it** — they are at `--cf-off`, off screen, throughout the first and last card's hold.
- `sideShiftPct` does nothing even mid-run past a point: once a neighbour reaches the viewport edge, its
  visible area is bounded by `1440 − (720 + cardWidth/2)`, not by how far it was pushed.
- `screens` changes how many screens the pin spends, not what is on any one of them (§6).
- The header band cannot reach the pin's screens at all (§4).
- The card cannot be made taller. The 25% width-crop bound this project holds every photograph to puts a
  floor of `0.75 × 2.289 = 1.717` under the card's box, and 16:9 is 1.778 — already within 3.4% of it. A
  4:3 card would crop the four panoramas by 41.8%.

### What the remaining lever actually is

**Higher-resolution originals for five photographs**, which is the same ask already open in
`DECISIONS.md` §5/§19 for the Forest cats and the Rooms frames, on the same cause.

| Photograph | Have | Needs at a 1,090px card | Needs at 2× (the `DENSITY_CAP`) |
|---|---|---|---|
| `vann-safari` | 1163 | 1,404 | 2,808 |
| `vann-bird-watching` | 1163 | 1,404 | 2,808 |
| `vann-kohka-lake` | 1163 | 1,404 | 2,808 |
| `vann-potters-village` | 1163 | 1,404 | 2,808 |
| `forest-trail-canopy` | 960 | 1,090 | 2,180 |
| `forest-boardwalk-daylight` | 1440 | 1,090 ✓ | 2,180 — 1.5× short |

The four at 1163 are **already-cropped 2.289:1 panoramas prepared for `/mahua-vann`**, so the ask is for
the uncropped originals rather than for anything re-shot: **~1,450px wide as an absolute minimum, ~2,900px
to serve a Retina or 150%-scaled screen**. `forest-trail-canopy` needs ~1,150px / ~2,200px.

With those files in hand, `cardMaxPx: 1120` measures **36.7% mean / 42.3% worst** — inside the ceiling
with 2.7 points of margin, and comfortably better than the 43.9% / 57.9% of the three prose bands the
coverflow replaced. That is the whole fix, and it is one `build_images.mjs` run away from being true.

### The second lever, if the originals never come

`app/globals.css`, which this task was not allowed to touch: `@keyframes coverflow-pass-first` and
`-last` park **every** other card at `--cf-off` through the first and last card's hold, so the stage
shows one card alone for ~280px of scroll at each end. Bringing the adjacent card to its side position
during the hold instead would add roughly 8 points of imagery to exactly the screens that score worst.
It is not enough on its own — 61.5% − 8 = ~53% at a 900px card — but it is the difference between "the
worst screen is a special case" and "the worst screen is the composition".

## 8. The recommendation, and what it does not do

**Ship `cardMaxPx: 900`, `screens: 2`.**

- 900 is the largest card at which **every one of the six photographs is fully served at DPR 1** — the
  honest ceiling, solved for rather than guessed.
- It takes the chapter from **70.7% / 83.1%** to **48.4% / 61.5%** and the page mean from 41.0% to
  **38.5%**, for **zero added scroll** and zero added bytes of layout.
- It does **not** meet non-negotiable #8. 61.5% worst is 16.5 points over the 45% ceiling, and it is
  still worse than the 43.9% / 57.9% of the `splitFeature` bands the coverflow replaced. The plan's own
  bar — *"leave the chapter denser and shorter than it is today"* — is met on **shorter** (3.34 screens
  against 2.93 is longer, in fact) and **not met on denser**, against the section it replaced.

**960 was measured and is not recommended, but the number is here to be taken.** It reads 45.4% / 56.5% —
the first arm whose worst screen beats what the chapter scored before the coverflow existed — at a cost
of the four panoramas being drawn 6% wider than their own files (1,237px asked of 1,163px). That class is
`atLibraryCeiling` in `check_image_resolution.mjs` and does not fail the rig. It is a real trade and it is
the client's to take, not mine to take quietly.

**1120 is not shippable today.** It clears the ceiling, and it draws four photographs 19% and one 14%
wider than the files behind them — on the 100%-scaled laptop the client tests on. That is the same
complaint in a different form: *"looks flat even though it has beautiful images"* becomes "the beautiful
images are soft".

## 9. What a wider card broke: the closing tiger, and `check_films.mjs` is red

**`node scripts/check_films.mjs` exits 1 at 900.** It must be read before anything else here is acted on.

```
tiger   ground: corners within 131 levels of the chapter's cream (tolerance 6)
FAIL
  - tiger: the corners of the film's box are {"r":102,"g":104,"b":75} against the chapter's
    cream {"r":233,"g":223,"b":200} — 131 levels out. The white ground is showing as a rectangle
```

**The white ground is not showing as a rectangle** — the screenshot at 1440 has the tiger sitting on bare
cream with no box at all. What that corner is reading is a *photograph*: the last card, now 900px wide,
reaches under the film's own transparent top-left margin. The assertion samples the four corners of the
film's box and compares them to the chapter's cream, on the assumption that cream is what is behind the
box. That assumption is what broke, not the blend.

**But there is a real defect underneath the false one, and it is worse than the rig's version of it.**
The stage paints *above* `.coverflow-footer` (deliberately — `app/globals.css` orders it that way so the
film blends against the section's cream rather than the stage's transparent backdrop), so where the card
overlaps the film, the card covers the tiger. The clearance is exact:

```
  card is clear of the drawing  ⟺  cardMaxPx ≤ containerWidth − 434
                                     (300px film box, ~83px of transparent left margin,
                                      card centred, film flush to the container's right)
```

| viewport | container | largest clean card | at `cardMaxPx: 900` | at the shipped `560` |
|---|---|---|---|---|
| 1920 | 1504 | 1070 | clear | clear |
| 1440 | 1344 | 910 | clear by ~5px | clear |
| 1366 | 1270 | 836 | **chest clipped** | clear |
| 1280 | 1184 | 750 | **head and body clipped** | clear |
| 1024 | 928 | 494 | **clipped** | **already clipped** |

Two things follow, and they point in opposite directions:

1. **This is not new.** At the shipped 560 the tiger is already clipped at every viewport below ~1090px —
   the 1024 screenshot in this run shows the card covering its upper body — and no rig has ever looked
   there, because `check_films.mjs` only ever measures 1440×900. The film's placement and the stage's
   footprint have been in conflict since the coverflow landed.
2. **900 widens it to every laptop.** Clipping now begins below ~1430px instead of below ~1090px. At 1280
   the tiger is headless. That is a defect a client would find in the first minute of dragging his window,
   which is exactly how he found the plate shrink (`DECISIONS.md` §19).

**The fix is one rule, and it is in `app/globals.css`, which this task was not allowed to touch** — the
film has to leave the stage's footprint rather than the card being kept small enough to miss it. Keeping
the card small is not a fix in any case: at 1024 it is already too big at 560, and the value that would
be clean everywhere is far below anything worth shipping.

**What was deliberately not done:** the rig was not weakened, no assertion was re-aimed, and the ceiling
was not lowered. Screenshots at 1280, 1366, 1440 and 1920 are in the session scratchpad
(`shots/final900/*-film-overlap.png`).

### The trade, stated so it can be taken rather than assumed

| | `field-days` mean/worst | the tiger |
|---|---|---|
| `cardMaxPx: 900` (shipped) | 48.4% / 61.5% | clipped below ~1430px |
| `cardMaxPx: 750` | ~57% / ~73% (interpolated, not measured) | clipped below ~1280px |
| `cardMaxPx: 900` + the film moved in `app/globals.css` | 48.4% / 61.5% | clear everywhere |

900 is what is in `lib/motion.ts`, because backing the card down to 750 gives up almost the whole
measured gain and still leaves the tiger clipped on a 1280 laptop and on a tablet. The third row is the
one worth having.

## 10. The other rigs, at 900

| rig | result |
|---|---|
| `check_image_resolution.mjs` | **PASS** — 0 under-served at 390@1×, 390@3×, 768@1×, 1440@1×, 1920@1×. The four panoramas read **ratio 1.00** at 1440 and 1920 (needed 1,159px, served 1,163px): the 903px ceiling, confirmed in a browser rather than on paper. Nothing in `field-days` is newly `atLibraryCeiling`; the three entries at 1440@1× (`tiger-golden-grass`, `lodge-facade-night`, `birding-cairn-dusk`) are all pre-existing and all in other chapters. |
| | One thing did move: `tiger-crossing-track` at 390@3× goes 0.79 → **0.75**, still `atLibraryCeiling`, still not a failure. Its 1:1 band frame is drawn 364px wide where the 16:9 card drew it 342px. It is a 541px file either way. |
| `check_coverflow.mjs` | **PASS** — 6 cards, 43/113 pinned samples at 1440×900 and 39/106 at 390×844, order 0→5 at both, worst centring error 2.27px and 3.62px. |
| `check_films.mjs` | **FAIL (exit 1)** — §9. |
| `npm test` | **PASS**, 485/485. |
| `npm run build` | **PASS.** |
| `npm run lint` | **PASS** — 0 errors, the same 5 pre-existing `lib/booking` warnings. |

## 11. Read by eye, at 390 / 1024 / 1440 / 1920

Not "it looks fine" — what was actually on the screen.

- **The band at 1440.** It reads as intended: the heading and paragraph top-left, the tiger-crossing-track
  square directly under the paragraph, `guide-sunrise` large on the right, and the two columns bottoming
  out on one line. The cream sits in a single block at the top right, beside the chapter mark, which reads
  as air rather than as a hole. The tiger photograph is uncropped and the vehicle, the guests and the
  tigress are all whole — which the 16:9 card was cutting.
- **The band at 390.** Heading, paragraph, then the square at the container's full 342px. Every line of
  type is comfortably readable; nothing is at the 4.3px-map scale this project has shipped before.
- **The stage at 1440, with card 4 exactly centred.** 900 × 506, and the two neighbours are unmistakably
  *behind*: visibly shorter (415px against 506px), veiled, and running off both edges. **The depth cue
  survives the widening** — this was the thing most at risk, and it does not read as a row.
- **The stage at 1920.** Three cards, both neighbours fully legible as neighbours, and the tiger sits
  clear below the stage with no overlap at all. The best of the four widths.
- **The stage at 390.** Unchanged by this work and still the weakest view: the card is `100vw − 48px` =
  342 × 192 in a 768px stage, so the phone is emptier than any desktop width. `cardMaxPx` cannot reach it
  — `min(900, 342)` is `min(560, 342)` — so the phone neither gained nor lost. Desktop is the client's
  lens (`DECISIONS.md` §1) and this is a later pass, but it should not be described as fixed.
- **Not a billboard.** The specific risk the brief named — a photograph swollen past what it can carry —
  did not happen at 900: every card photograph is served at ratio ≥ 1.00, and the card still reads as a
  card inside the stage rather than as a full-bleed band, because the neighbours are still in frame either
  side of it.

## 12. Two stale comments this change leaves behind, in files outside this task's remit

Both quote the old 560px value and should be corrected by whoever next touches those files:

- `components/sections/CoverflowCard.tsx`, the `CARD_SIZES` doc comment — *"the breakpoint is where the
  two arms of the `min()` cross: `100vw − 2 × 24px ≥ 560px ⟺ 100vw ≥ 608px` … Current value:
  `(min-width: 608px) 560px, calc(100vw - 48px)`."* The expression is still correct and still derives from
  `COVERFLOW`; the worked numbers are now 948px and 900px.
- `lib/sizes.test.ts`, the note above the distinct-string count, which quotes the same string. The
  assertion itself is unaffected — it is still one genuinely new width list — so only the quoted literals
  are history, exactly as that file already records for `ROOM_CARD_SIZES`.



