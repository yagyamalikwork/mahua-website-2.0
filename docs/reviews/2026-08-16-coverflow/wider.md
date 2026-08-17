# The coverflow's third pass — a wider card, centred words, a tighter frame

18 Aug 2026. Three more client changes on the linear coverflow, measured one at a time because they all
move the same numbers and the useful question is which one moved what.

Everything below is a production build on `:3110` at 1440×900 unless it says otherwise. The header is
107px; the card is **1344 × 685** and the stage **733px** on the shipped build.

| the change | his words | what it is |
|---|---|---|
| **1 · wider** | *"wider only, stay sharp"* — chosen from four sizes with a measured sharpness each | `CARD_BOX` becomes the photographs' own **1344/685**, `cardMaxPx` **1217 → 1344** |
| **2 · centred** | *"Move the text to the center with 3D effect for all cards like the Tiger image with text that comes after 01-The Lodges"* | the card's words move from the floor of the frame to its middle |
| **3 · snug** | *"If the images cannot go taller, remove some of the buffer space from top and bottom of the carousel"* | the stage stops being a remainder and carries an explicit 24px gutter |

**The headline: `field-days` reads 27.0% mean / 31.1% worst empty, against 28.6% / 40.4% before.** The worst
screen — the field non-negotiable #8 binds on — is **9.3 points better**, and the page's own worst screen is
**2.4 points** better (66.9% → 64.5%). Zero added JavaScript: **168.2 KB brotli, delta 0**.

---

## 1. The three deltas, measured apart

Four production builds, four density runs, one change per arm.

| arm | `field-days` mean | worst | page mean | page worst | screens over 45% | images/screen | chapter height |
|---|---|---|---|---|---|---|---|
| A · as shipped, 18 Aug | 28.6% | **40.4%** | 35.3% | 66.9% | 28 | 2.08 | 3.59 screens |
| B · + wider card | 27.5% | **36.0%** | 34.9% | 66.4% | 27 | 2.08 | 3.59 |
| C · + words centred | 27.5% | **36.0%** | 34.9% | 66.4% | 27 | 2.08 | 3.59 |
| **D · + tighter frame — shipped** | **27.0%** | **31.1%** | **34.6%** | **64.5%** | **25** | 2.08 | 3.59 |

| | mean | worst | page worst |
|---|---|---|---|
| **1 · wider** | −1.1 | **−4.4** | −0.5 |
| **2 · centred** | **0** | **0** | **0** |
| **3 · snug** | −0.5 | **−4.9** | −1.9 |

Three things in that table are worth more than the total.

**Centring the words is worth exactly nothing to density, and that is the correct answer rather than a
disappointing one.** `measure_density.mjs` hit-tests what is *painted* at each cell, and every cell inside a
coverflow card already meets a photograph. Type laid on a photograph cannot add occupancy to a cell that is
occupied; it can only move which of two occupied things is on top. Any figure claiming otherwise would have
been measuring something else.

**The chapter's own height does not move at any arm — 3.59 screens, 15 sampled screens, in all four.** So
nothing below `field-days` is re-phased against `measure_density.mjs`'s 150px sampling grid, and every
chapter under it reads identically in all four arms (`rooms` 37.1/46.5, `lantern-hour` 37.0/41.8, `guests`
40.7/43.8, `details` 41.4/41.4). That is the trap `DECISIONS.md` §5a records — `05 · The Rooms` moved 39.6 →
46.5 on the previous pass with nothing in it changed — and it does not apply here. **`rooms` is 46.5% worst
in every arm including the baseline; it is not this work's, and it is not a regression.**

**`imagesPerScreen` is 2.08 throughout.** No photograph was added, removed or re-sized on the page; the card
is the same six frames drawn larger.

### 1.1 §5a's own caveat still applies, in this work's favour

`field-days` at 31.1% is 14 points clear of the 45% ceiling, so the 150px sampling step's ±3-7 point error
(`linear.md` §5.2) cannot reach it in either direction. `lodges` at 48.6% and `rooms` at 46.5% are neither
this work's nor inside that error, and both are unchanged from the baseline.

---

## 2. Change 1 — the card is the photographs' own shape

### 2.1 What the client chose, and why the table had four rows

He was given four card sizes with a **measured sharpness** for each, because a ratio is a sharpness decision
on this card and not only a composition one. `object-fit: cover` in a box narrower than the photograph draws
it `imageAspect / CARD_BOX` times the card's own width, and `ui/Photo.tsx`'s `coverSizes` asks the browser
for exactly that many pixels — so a *taller* card at the same width asks for pixels no file has.

| | card at 1440 | box | area | draw factor | pixels asked of a 1344px file | sharpness |
|---|---|---|---|---|---|---|
| before | 1217 × 685 | 16/9 = 1.7778 | — | ×1.1036 | 1,343 | 1.00 |
| **chosen** | **1344 × 685** | **1344/685 = 1.9620** | **+10%** | **×1.0000** | **1,344** | **1.00** |
| rejected | 1344 × 754 | 1.7825 | +22% | ×1.1006 | 1,479 | 0.91 |
| rejected | 1344 × 823 | 1.6331 | +33% | ×1.2014 | 1,615 | 0.83 |

**The chosen row crops the photographs not at all** — the box IS their ratio — where 16/9 was cropping 9.4%
of each frame's width. `check_coverflow.mjs` assertion 6 reads **0.0%** on the shipped build against its 25%
bound, and `CoverflowCard.test.tsx` now asserts that arithmetically as well, in both directions.

### 2.2 `cardMaxPx` 1217 → 1344 is not another 127px of the 17 Aug sweep

Reading it as one over-predicts it, and the delta above is why: 17 Aug's sweep measured **−4.4 points of
worst-screen empty per 100px of card**, which would have predicted ~5.6 points from a 127px rise. It
delivered 4.4.

The reason is that two things changed in one edit and they pull opposite ways on the card's *area*: the card
grew 10.4% wider and the box lost 9.4% of its height relative to that width. The card is 1344 × 685 where it
was 1217 × 685 — **the same height**. All of the gain is width, none of it is height, and a card that is
wider but no taller adds less occupancy per screen than the sweep's own slope (which was measured on cards
that grew in both axes) implies.

### 2.3 The ceiling is now spent, exactly

`cardMaxPx` equals `CARD_BOX`'s own numerator equals every file's width: **1344**. There is no headroom left
at all — the next pixel of card is a soft photograph on the one screen the client tests on, and
`check_image_resolution.mjs` will not stop you, because a photograph already served its widest tier is
classed `atLibraryCeiling`, a class that rig *reports* and does not enforce. `CoverflowCard.test.tsx` states
the ceiling as an assertion for that reason. **0 under-served at all five width/density arms** on the
shipped build.

The lever from here is a wider original, not a line of CSS — `docs/OWED-ORIGINALS.md`, where the DPR-2 half
of this group is already recorded (1344px serves a 1344px card at exactly 1.00 on a 100%-scaled screen and
0.50 on a Retina one).

### 2.4 The visible flank falls to 48px, and `sideShiftPct` is NOT the lever

The client was told this would cost the neighbours' visible edge, and it did: **~111px → 48px at 1440.**
Measured as painted pixels — `elementFromPoint` along the row through the card's middle, with the stage's
`pointer-events: none` lifted for the duration — at the third card's own centred moment:

| viewport | stage | card | painted, left to right |
|---|---|---|---|
| 1920 | 1504 | 1344 | card 1: **287px** · card 2: 1345 · card 3: **288px** |
| 1600 | 1504 | 1344 | card 1: 127 · card 2: 1345 · card 3: 128 |
| **1440** | **1344** | **1344** | card 1: **47px** · card 2: 1345 · card 3: **48px** |
| 1280 | 1184 | 1184 | card 1: 48 · card 2: 1185 · card 3: 47 |
| 1024 | 928 | 928 | card 1: 47 · card 2: 929 · card 3: 48 |
| 768 | 672 | 672 | card 1: 47 · card 2: 673 · card 3: 48 |
| 390 | 342 | 342 | card 1: 23 · card 2: 343 · card 3: 24 |

**The flank is `(viewport − card) / 2` and nothing else**, because the neighbour is behind the centre card
and the only place it can show is between the card's edge and the screen's. So it was already 48px at every
width from 768 to 1313 before this change — the 111px the client had been looking at existed only above
1313px, and 1440 has now joined the band the rest of the page was already in.

**`sideShiftPct` cannot bring it back**, and that was measured rather than reasoned. Sweeping it at 1440,
reading painted pixels:

| `sideShiftPct` | 50 | 55 | **62 (shipped)** | 70 | 80 | 95 |
|---|---|---|---|---|---|---|
| left flank | 47px | 47 | **47** | 47 | 47 | **0 (95px of cream)** |
| right flank | 48px | 48 | **48** | 48 | 48 | 0 |

Identical up to 91%, then worse. The arithmetic behind that: a neighbour covers the sliver as long as its
inner edge is left of the card's outer edge, i.e. `shift ≤ (1 + sideScale) / 2 = 0.91`; past that a gap of
cream opens between the two cards and the flank *shrinks*. **62 is already inside the flat part of that
curve, so the dial is spent in this direction and there is nothing to bring back.** The real levers are the
card's width, which the client bought deliberately, and the viewport, which is not ours.

### 2.5 Read by eye at 1440

Opened, not merely measured. The two flanks are 48px slivers, and they still read as *cards behind* rather
than as a bleeding edge, for a reason that is structural: a neighbour is scaled 0.82 and vertically centred,
so its top and bottom edges sit 62px inside the centre card's, and both are visible in the sliver as
horizontal steps. Different photographs, at a different height, with a seam. It is thinner than it was and
it is still depth.

**On a 1440 laptop the card now runs edge to edge of the container**, which is what the client asked for and
what the tightened stage below then frames. At 1920 the depth is generous — 287 and 288px of painted
neighbour — and at 1440×760, below the height at which the card's own cap stops binding, it is 125 and
127px, because a short viewport narrows the card and the flanks grow to fill what it leaves.

---

## 3. Change 2 — the words to the middle, and six scrims re-solved

### 3.1 What "like the Tiger image" was read as

His two examples are `why-you-came` and `after-dark`, both `FullBleedQuote`. **This is implemented as the
composition, not the type scale, and that is an interpretation rather than his words.** A `FullBleedQuote`
is a single display line at `clamp(1.9rem, 4.6vw, 3.9rem)` and cannot hold a number, a title and a
sentence. What the card takes from those two sections is: type centred on the photograph, a centred measure,
the display face on the title, and generous letter-spacing on the label. What it keeps is its own three
parts.

The "3D effect" is read as the carousel's existing depth — scale, shift and veil on the neighbours — and
nothing about it changed.

**The arrows did not move**, and that is also a ruling. He asked for the *text*; the arrows are navigation,
and a rule with a label at each end reads as the foot of a card wherever the words are. It also keeps the
thing `linear.md` §4.3 liked on sight: on the last card the hairline runs the full width with "PREVIOUS"
alone under it.

The words block is `flex-1` and centres its content in whatever the arrows leave. **Centring it over the
whole card was considered and rejected on arithmetic**: at 390 the card is 342 × 174 and the arrows are ~40
of its 134px of content box, so an absolutely-centred block and a bottom-anchored rule would sit two pixels
apart at best. Bounding the centred space by the arrows makes a collision impossible rather than unlikely.

### 3.2 The defect this change shipped for one build, found by opening a screenshot

**At 390 the card's own words fell out of the bottom of it and "NEXT" rendered on the chapter's cream.**
Cream on cream: `check_contrast_over_photos.mjs` read the arrows at **1.10:1** against a 4.5 floor, and
reported the same 1.10 *unwashed and with the shipped scrim*, which is the signature of a crop that is not
over the photograph at all.

It is change 1's cost arriving at change 2's composition. The 1.962 box is 9.4% shorter than 16/9, so at 390
the card went from 342 × 192 to 342 × 174 — 18px — while type set in `rem` did not move at all. The shipped
16/9 build had about **1px** of slack there; taking 18px out of an already-spent budget put the arrows
outside the box.

**Every rig on this project passed that build.** It was found by opening a 390px screenshot and reading it,
which is CLAUDE.md's own standing instruction and the same way the map's 4.3px labels were found.

**The fix is proportional type, not smaller type.** Below `md` the card is `100vw − 48` wide and therefore
`(100vw − 48) / 1.9620` tall, so its height is very nearly proportional to the viewport — while `rem` type
is proportional to nothing. All four of the card's type roles and its padding are now `vw` under their `rem`
caps:

| | before | after | at 390 | at 360 |
|---|---|---|---|---|
| padding | `p-5 md:p-7` | `p-[3.6vw] md:p-7` | 14.0px | 13.0px |
| number and arrows | `text-[0.62rem]` | `text-[clamp(0.5rem,2.3vw,0.62rem)]` | 8.97px | 8.28px |
| title | `clamp(1.15rem,2.6vw,1.75rem)` | `clamp(0.85rem,4.4vw,2.25rem)` | 17.2px | 15.8px |
| body | `clamp(0.76rem,1.32vw,0.98rem)` | `clamp(0.6rem,2.85vw,0.98rem)` | 11.1px | 10.3px |

`3.6vw` reaches 27.6px just under 768 where `md:p-7` takes over at 28, so the two meet rather than step. The
title's ceiling rose in the same edit — 1.75rem → 2.25rem, i.e. 28px → 36px at 1440 — because a centred 28px
title in a 685px card read as a caption that had wandered into the middle.

**The margin is now measured across the whole sweep rather than asserted.** Card 0 carries the longest body
(134 characters) and is the binding case at every width:

| viewport | card | content box | its type needs | slack |
|---|---|---|---|---|
| 360 | 312 × 159 | 133.1 | 126.9 | **6.2px** |
| 390 | 342 × 174 | 145.9 | 136.1 | **9.8px** |
| 500 | 452 × 230 | 194 | 171 | 23px |
| 768 | 672 × 343 | 287 | 194 | 93px |
| 1440 | 1344 × 685 | 629 | 197 | 432px |

`check_coverflow.mjs`'s new **assertion 12** is what holds it: every line box of the card's own type must sit
inside the card's own border box, at all 79 widths of the continuous sweep and all 31 heights of the new one.

### 3.3 The six scrims, re-solved from scratch — and they came out LIGHTER

**Moving type is a re-solve, exactly as re-cropping a photograph was on 17 Aug.** Both are the same
statement: a scrim answers to the pixels under the glyphs, and either the glyphs or the pixels moving
invalidates it. Carried over unchanged onto the centred composition, the 17 Aug figures measured
`vann-potters-village` at **3.47** and `forest-trail-canopy` at **3.61** at 390 — both under the floor —
while `vann-bird-watching` came out at **8.00**, over-washed by a mile.

| # | photograph | unwashed 390 / 1440 | 17 Aug figure | **18 Aug figure** | 390 | 768 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|
| 01 | `tiger-crossing-track` | 1.22 / 1.05 | `{ centre .55, bottom .6, corner .5 }` | **`{ centre .63, bottom .58 }`** | 5.49 | **4.91** | 5.09 | 5.09 |
| 02 | `vann-bird-watching` | 1.00 / 1.03 | `{ flat .35, centre .8, bottom .6, corner .6 }` | **`{ centre .70, bottom .60 }`** | **4.78** | 4.89 | 5.55 | 5.54 |
| 03 | `vann-kohka-lake` | 1.34 / 1.30 | `{ flat .12, centre .8, bottom .6, corner .6 }` | **`{ centre .75, bottom .62 }`** | **4.99** | 6.14 | 5.33 | 5.17 |
| 04 | `forest-boardwalk-daylight` | 1.06 / 1.00 | `{ centre .75, bottom .7, corner .6 }` | **`{ centre .68, bottom .60 }`** | 5.77 | 5.28 | **4.85** | **4.85** |
| 05 | `vann-potters-village` | 1.02 / 1.00 | `{ centre .7, bottom .6, corner .55 }` | **`{ centre .69, bottom .60 }`** | **4.71** | 4.75 | 5.33 | 5.33 |
| 06 | `forest-trail-canopy` | 1.02 / 1.00 | `{ centre .6, bottom .75, corner .55 }` | **`{ centre .70, bottom .60 }`** | **4.73** | 5.59 | 5.52 | 5.52 |

Floor 4.5 everywhere. **Worst 4.71**, bold marks the width that chose each figure. Unwashed, four of the six
sit at 1.00:1 at 1440 — the theoretical floor, cream type on pixels of exactly its own luminance.

**Every one of the six carries less overlay than it did, and two lost a flat wash entirely.** The shape is
now `centre` + `bottom` and nothing else. Three geometric reasons:

- **`centre` is a radial opaque out to 34% of its own extent, fading to nothing at 100%.** Bottom-anchored
  type sat at that ellipse's *edge*; centred type sits in its opaque middle. The same layer at a lower
  opacity now does more work.
- **`corner` is a wedge into the bottom-LEFT only.** It reached a headline standing on the floor of the
  frame and never reached "NEXT" in the opposite corner. With the words gone from the floor, the only type
  down there is the two arrows, and `bottom` spans the full width.
- **The 390 case stopped being pathological.** `scrims.md` §5 recorded that bottom-anchored words are 58% of
  the card's height at 390 and their top edge clears the `bottom` band entirely, so no value of `bottom`
  reached them — which is what forced the heavy figures. Centred words are centred at every width.

**390 no longer binds all six.** It binds 02, 05 and 06; **1440 binds 04** at 4.85 and **768 binds 01** at
4.91. That is a change in kind, not just in value: the 17 Aug set was solved entirely at one width, and a
desktop-only or phone-only check would now pass a build that fails somewhere else.

The method was a sweeper rather than the rig: candidates were injected into the DOM (reproducing
`Scrim.tsx`'s markup exactly) and measured with `check_contrast_over_photos.mjs`'s own routine —
anchor-click scroll, hide every text node, screenshot, crop per `Range` line box, worst single pixel — so a
candidate cost one screenshot instead of one production build. Six cards × eleven candidates × two widths
would otherwise have been 132 builds.

**Every figure in the table above is the committed rig's**, re-measured on the shipped build, because a
sweeper is a search tool and not evidence. The two agreed to **within 0.17** at 390 and 768 and **exactly**
at 1440 and 1920 — the difference is the sweeper measuring the words and the arrows as two crops where the
rig takes one, so the rig can find a worse pixel on the boundary between them. Where they disagree the rig's
is the number, and it is the number in the source.

### 3.4 The contrast rig was verified against the moved type rather than assumed

Its coverflow selector was `:nth-child(i + 2)` until the day before and is `i + 1` now, and the five runs
before that crash had each silently measured the wrong card (`rig-failures.md` §22.5). So it was checked
three ways rather than trusted:

1. **The selector is not positional where it matters.** The crop selector is
   `[data-contrast="coverflow-card"], nav.coverflow-arrows a` — an attribute the card carries precisely so
   the block can be re-composed under it, which is what happened. It followed the words to the centre with
   no edit.
2. **The placement check still holds**, and it is the veil rather than the x-offset: all 24 runs report
   `veil` under 0.02 and no `MISPLACED`, and no run printed the off-centre note. So each figure is read off
   the card it names, centred and unveiled — the worst case, since a flank wears *added* scrim.
3. **A deliberate break, the same control `scrims.md` §3 used.** `tiger-crossing-track`'s scrim set to `{}`
   and rebuilt: card 01 fails at **1.22 / 1.07 / 1.05 / 1.05** across the four widths and **the other five
   pass unchanged**. The 1.22 is the same number the unwashed *centred* type measures, not the 1.36 the
   unwashed *bottom-anchored* type measured — which is the direct evidence that the crop moved with the
   words.

### 3.5 Read by eye at 390

**The 390px screenshot was opened and the type read, before and after.** Before: "NEXT" outside the card on
cream, invisible. After, on card 05 — the hardest frame in the set — *"05 / Pachdhar, the potters' village /
More than a hundred Kumhar families next to Pench have kept the wheel turning. Watch, then take a turn at it
yourself. / PREVIOUS · NEXT"* is complete, centred and legible over the terracotta, with the gold hairline
inside the card and both arrows on it. The body is 11.1px, which is small; it is the size the card's own
height allows and it is readable.

At 1440 the centred block reads as `FullBleedQuote`'s does: the number, a 36px display title, two centred
lines of body, and the rule with its two labels at the foot.

---

## 4. Change 3 — the stage stops being a remainder

### 4.1 What the note in `app/globals.css` said, and why both halves of it were right

`linear.md` §4.1 and the note at `--cf-stage-h` both refused this change, on two arithmetic grounds:

1. **The 54px of cream inside the stage was not a constant, it was what was left over.** The stage was
   `100svh − header` and the card was `cardWidth / CARD_BOX`, so the gap was the difference: 54px at
   1440×900, **8px at 1440×800**, and **negative at 1440×760**, where the card was already taller than the
   box clipping it. Any fixed shortening breaks on a laptop 100px shorter than the one it was tuned on.
2. **It enters the pin window directly.** `--cf-pin-len` and the sticky `top` have to move in the same edit
   or the card stops being centred in the viewport — §20.2 records that a flat `100svh` leaves the last card
   centring 11px *after* the pin has released.

Both were true. **The conclusion was not, and the way out is in the brief for this task: a remainder cannot
be a dial, so stop it being a remainder.**

### 4.2 The construction

The card gains a fourth width bound — the stage's own height:

```
width: min(
  --coverflow-card-max,                                   /* 1344, the files' own width  */
  100%,                                                   /* the stage it is centred in  */
  100vw − 2 × --coverflow-gutter,                          /* cream at the screen's edge  */
  (100svh − header − 2 × --coverflow-gutter-y) × CARD_BOX  /* NEW: the stage's height     */
)
```

and the stage is then the card's own maximum height plus that gutter, capped at the space under the header:

```
--cf-stage-h:    min(100svh − header, cardMaxPx / CARD_BOX + 2 × gutter-y)
--cf-sticky-top: header + (100svh − header − --cf-stage-h) / 2
--cf-pin-start:  100svh − --cf-sticky-top
--cf-pin-len:    screens × 100svh − --cf-stage-h
```

The two pin expressions are the general forms; substituting the old `sticky-top = header` and
`stage-h = 100svh − header` collapses them to exactly the two that were written there from 16 to 18 Aug,
which is the check that this is a generalisation and not a new scheme.

Read back off the rendered page rather than trusted: the pin locks at scrollY **6,814** and releases at
**8,781** — 1,967px — and the six cards centre at **6,814 · 7,208 · 7,601 · 7,994 · 8,388 · 8,783**, 393-395px
apart, the first on the lock and the last within 2px of the release. That is the derivation reading itself
back, which is the only check worth having on arithmetic this easy to get subtly wrong.

**`--cf-sticky-top` is what answers objection (2).** The card's centre is `sticky-top + stage-h / 2`, which
expands to `header + (100svh − header) / 2` for *any* stage height at all — dead centre of the viewport
under the header, unchanged. So **during the pin nothing moves**: the card is in the same place on the
screen it was, and the cream either side of a shorter stage is the same cream as the track's. Verified:
before, card top 161 / bottom 846 at 1440×900; after, card top 161 / bottom 846.

**The card bound answers objection (1), and it inverts the failure direction.** On a viewport too short for
a 685px card, the card is *narrowed* until it fits and the gutter survives at full size. A short laptop now
gets a smaller photograph instead of a clipped one.

**What it costs: 60px of pin length, and no scroll at all.** The pin is 1,907px → 1,967px at 1440×900 inside
an unchanged track, so each card gets 393px of scroll instead of 381 — 3% slower, in the direction the client
asked for on his previous report. The chapter is 3.59 screens in every arm.

### 4.3 The offset that this change could have got wrong silently

`.coverflow-target`'s `top` was `i × step`, and the reason it was that simple is that two terms cancelled:

```
top = d_c − 100svh + P = (100svh − S) + i·step − 100svh + P = i·step + (P − S)
```

`P` is `scroll-padding-top`, which `app/globals.css` sets to the header's own height for anchor links. While
`S` was *also* the header, `P − S` was zero and invisible. It is `−slack/2` now — **30px at 1440×900** — and
leaving it out puts all six targets 30px late at every width, with nothing on screen saying so.

That is §20.2's slope-versus-offset trap arriving a second time, in its offset form. It is asserted rather
than argued: with the term deleted and rebuilt, `check_coverflow.mjs` fires at **158 of 158** width-sweep
samples (worst 64.3px off centre) and at **90 of 186** height-sweep samples (worst 262px) — and it fires
only *above* 860px of viewport, because below that the `min()` binds, `sticky-top` equals the header again
and the correction is genuinely zero. A rig sampling three fixed heights could easily have missed it.

### 4.4 Proof that it is safe at every viewport height — assertion 13

A continuous sweep, **600 to 1200 in 20px steps at 1440 wide, all six anchor targets clicked at each
height**: 31 heights × 6 targets = 186 samples. At every one of them the card fits inside its stage, no line
box of its type falls outside the card, and each target leaves *its own* card within 8px of centre with the
stage pinned.

| | shipped build |
|---|---|
| samples | 186 |
| worst distance from centre | **1.20px** |
| stage gutter, min–max across all 186 | **24.0 – 24.0px** |
| card taller than its stage | **0 samples** |
| type outside the card | **0 samples** |
| card centred outside the pin | **0 samples** |

**The gutter is 24.0px at every height from 600 to 1200** — which is the whole claim, stated as a
measurement: the cream is a constant now, at every viewport this project could meet, where before it was
54px at 900, 8px at 800 and negative at 760.

Heights rather than widths because the fourth width bound starts to bind below ~880px of viewport, and a
width sweep at a fixed 900px can never reach it. 1440 wide because the card is at `cardMaxPx` there and its
height bound therefore binds first.

**Read by eye at 1440×760**, the height at which the old construction already clipped: the card is
**1187 × 605**, fully inside a 653px stage, 24px of cream above and below, and the flanks are **125 and
127px** of painted neighbour because a narrower card leaves more of the container to them. Nothing clips.
The card is smaller than it is at 900px of viewport, which is the trade this construction makes and the
right way round.

### 4.5 What the visitor actually gets back

At 1440×900, measured on the rendered page:

| | before | after |
|---|---|---|
| cream inside the stage, above the card | 54px | **24px** |
| tiger's tail → the first card's top | 70px | **40px** |
| cream inside the stage, below the card | 54px | **24px** |
| last card's foot → `05 · The Rooms`'s chapter mark | 190px | **160px** |

---

## 5. Gates

| | |
|---|---|
| `npm test` | **481** passed, 43 files (478 + `CoverflowCard.test.tsx`'s "crops none of the six" and `lib/motion.test.ts`'s two new `COVERFLOW` guards — the stage-gutter coupling and `cardMaxPx === cardBoxW`) |
| `npm run lint` | 0 errors, 5 warnings, none of them this work's |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `npm run verify:budget` | **168.2 KB brotli — delta 0.** All three changes are CSS and markup |
| `check_coverflow.mjs` | **pass** — thirteen assertions; order `0,1,2,3,4,5` at both shapes; worst centre **1.03px** / 1.00px; 79-width sweep worst off-centre **1.00px**; 31-height sweep worst **1.20px**, gutter 24.0–24.0px |
| `check_films.mjs` | pass at six widths, 0/12 covered positions, corners within 1 level of cream |
| `check_contrast_over_photos.mjs` | pass on `/`, `/mahua-vann`, `/mahua-tola` — the six card runs read **4.71–6.14**, worst 4.71. See §5.1 |
| `check_image_resolution.mjs` | **0 under-served** at all five arms |
| `check_card_stack.mjs` | pass — 9/9, both routes |
| `check_plates.mjs` | pass — 0.00% worst distortion on all three routes |
| `measure_density.mjs` | §1 |

Every changed or new assertion was watched failing against the break it catches —
[`rig-failures.md`](rig-failures.md) §23.

### 5.1 One non-coverflow contrast run dipped once in six, and it is not this work's

Across six runs of `check_contrast_over_photos.mjs` on `/` against the final build, **one** reported
`FAILED: 1 text run(s)` and five reported none. The failing run was not a coverflow card — all twenty-four
card figures were `ok` in that same run — and it did not reproduce in the five others.

It is worth recording rather than shrugging at, because this page has several **pre-existing** runs sitting
within a fifth of a point of their floor, any of which can cross it on a marginal frame:

| run | worst | floor |
|---|---|---|
| `forest · intro` @1920 | 4.64 | 4.5 |
| `forest · intro` @1440 | 4.66 | 4.5 |
| `header scrolled · wordmark`, all four widths | 4.71 | 4.5 |
| `header · pill` @390 | 4.67 | 4.5 |
| `hero · sub` @390 | 4.77 | 4.5 |

**The six coverflow cards' own minimum, 4.71, sits inside that same band** — so the cards are no thinner than
the page they are on, and no thicker. None of the five rows above was touched by this pass and none has ever
been noted as flaky; the honest statement is that this rig's margin of stability on this page is roughly a
tenth of a point and several runs live inside it. A run that is worth chasing would be one that fails
repeatably.

**One operational note, because it cost a confusing run: `npm run verify:budget` rebuilds `.next` under any
`next start` you already have on another port.** The running server then serves HTML referencing chunks that
no longer exist, and `check_coverflow.mjs` reported a 1797px header, 0px cards and a pin window past the
document's own height — a page that looked catastrophically broken and was a stale server. It is the same
trap `scrims.md` §3 records for `pkill`. Restart the server after `verify:budget`, or run it last.

---

## 6. What this pass leaves behind

- **`cardMaxPx` is spent, exactly.** 1344 is the files' own width and the draw factor is 1.000. The lever is
  a wider original (`docs/OWED-ORIGINALS.md`), not this file.
- **`COVERFLOW.sideShiftPct` is spent in the direction it would need to move.** §2.4 measures why: the flank
  is `(viewport − card)/2` and the dial is already inside the flat part of the curve.
- **`vann-potters-village` still wants a different crop, not a wider file.** It is 1.02:1 unwashed at 390 and
  1.00 at 1440 — the white-glazed pots sit where the copy lands, and centring the copy did not move them
  off. That is the third pass in a row on which this frame has been the hardest in the set, and the third
  time the answer has been the same one. `docs/OWED-ORIGINALS.md` carries it.
- **The tiger's position is still unruled on by the client** — it opens the chapter rather than closing it,
  unchanged by this pass, and `check_films.mjs` passes at six widths.
- **The card's small-screen composition is now `vw`-proportional and has 6.2px of slack at 360px.** That is
  the thinnest margin on the page and assertion 12 is the only thing that can see it. Any new word on this
  card — a longer activity title, a third sentence — needs the rig re-run at the narrow end before it ships.
