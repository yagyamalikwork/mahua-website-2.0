# The joined lodge panels, and The Jungles back on its photograph

**Date:** 20 August 2026 · **Branch:** `feat/home-v2` · Three client changes, given
after seeing the 19 Aug build.

Every figure below is re-derivable against a production build:

```bash
npm run build && npx next start -p 3110
node scripts/check_contrast_over_photos.mjs --port 3110       # + --url /mahua-vann, /mahua-tola
node scripts/check_image_resolution.mjs --port 3110
node scripts/measure_density.mjs --port 3110
node scripts/check_films.mjs --port 3110
node scripts/check_experience_strip.mjs --port 3110
npm run verify:budget
```

---

## 1. What the client asked for, and where each piece came from

| # | ask | built as |
|---|---|---|
| 1 | *"Remove the gap between the two property cards… joined together, no gap in between"* | `lg:gap-4` → `lg:gap-0` |
| 1 | *"add the zoom effect on the images for the cards as we have on other images on our homepage"* | `ImageReveal`'s `noZoom` dropped; `PHOTO_ZOOM` via the existing `[data-hover-zoom]` selector |
| 1 | *"add the 3D effect on the text that is on these cards, exactly like… on the last section"* | the lodge's name is a `SplitLines` heading — the per-line rise `TwoToneHeading` gives the closing chapter |
| 1 | *"make the buttons rise when hovered… like the section we have above the website directory"* | `PillButton`'s `raise` prop, i.e. `.pill-raise` |
| 2 | *"place and align all the text for 02-The Jungles on the image… the image itself should look like the background for this section, exactly like… the last section"* | `JunglesBand` rebuilt on `Invitation`'s construction: photograph absolutely positioned behind, `Scrim` over it, section height = its own content against a floor |
| 3 | *"crop it a bit more on its length"* | `JUNGLE_BAND.minHeightVw` — 31vw against the photograph's own 42.4vw |

Nothing new was invented: every effect in request 1 already existed under a name,
and request 2 is `Invitation.tsx`'s arrangement applied to a shallower box.

---

## 2. Do the joined panels read as one photograph or two?

**Two, unmistakably, and it is not close.** `scripts/tmp` screenshots at 1440 and
1920 were opened and read before this was written.

`vann-hero` is a lit ochre veranda — warm, interior, artificial light, a low
horizon of pale stone floor. `tola-hero` is a lodge seen from outside under trees
— cool grey-green, blown white sky at the top, a dark pond at the bottom. Butted
together they read as a diptych: the seam at the exact centre of the screen is a
hard vertical step in colour temperature, in subject and in light direction. It
looks deliberate, which is what the reference (the ecotriip India/Africa split the
client supplied) does too.

The 16px gutter the 19 Aug build carried was defending against a risk these two
photographs do not present. Recorded, because it would present with a different
pair: **two frames of the same place at the same hour would stitch**, and the
argument for the gutter would come back with them.

Second-order effects of removing it, both checked:

- **The panels are 8px wider each, so `PANEL_SIZES`' `50vw` is now exact** where
  it used to round a `calc(50vw - 8px)` box up. Noted in the component.
- **The 8px changes each panel's crop, so the two solved scrims move.** They were
  not re-solved and did not need to be — every reading went the safe way:
  `lodges · panel 01` at 1024 (the binding width) reads **5.06** where 19 Aug
  measured 4.80; `panel 02` 5.59 against 4.78. Full table in §6.

---

## 3. What the zoom does at the join — and two things it turned up

**At the join: nothing.** The zoom scales the `<picture>` inside a frame that is
`overflow: hidden` and never moves, so at 1.06 the photograph's own crop changes
and its edge stays exactly on the seam. A 400 × 540px capture straddling the join
with the left panel mid-zoom shows no cream, no gap and no movement on the right
panel's side.

That is true **because the float was excluded**, which is the first finding.

### 3.1 The float had to be separated from the zoom, and they were one flag

`ImageReveal`'s `noZoom` sets `[data-no-zoom]`, and `app/globals.css` used that one
attribute to switch off **both** homepage hover effects. Only the zoom was asked
for. `FLOAT` translates the frame 6px upward, which on a photograph that reaches
the edge of the screen opens a 6px seam of the section's cream along its foot —
running the full width of the window now that the panels are joined — and slides
the photograph out from under its `Scrim`, which is a sibling layer rather than a
child of the frame.

So the float rules gained `:not(.no-float)` and the frame gained the class.
Measured on the built page at 1440, hovering the panel: `picture` →
`matrix(1.06, 0, 0, 1.06, 0, 0)`, `frame` → `none`. Under
`prefers-reduced-motion: reduce`, both → `none`, which is the point of repeating
the narrowed selector inside that media query: adding `:not(.no-float)` took the
float rules from (0,4,0) to (0,5,0), and a mirror left at (0,4,0) would have lost
and shipped the float to a visitor who asked for no motion — the identical defect
this project already has on record for the zoom.

### 3.2 The zoom fired on less than half of each card, and only hovering found it

**This was found by hovering the real page, not by reading the diff.** Each
panel's words sit in a block absolutely positioned over the foot of the frame — a
later *sibling*, so it paints above and takes the pointer events. The generic rule
fires on `[data-image-frame]:hover`, so:

| pointer over | picture transform, before the fix |
|---|---|
| the photograph, top of the panel | `matrix(1.06, …)` |
| **the words, bottom 55% of the panel** | **`none`** |
| the button | `none` |

More than half of every card was dead, including the part a pointer crosses on its
way to the button. `ui/Plate.tsx` never had this because its caption is *inside*
the frame; these words cannot go there, because `ImageReveal` puts its children in
`[data-image-inner]` and the arrival animation scales that element.

Fixed with a second trigger, `.zoom-from-parent` on the `<article>`, at the same
(0,5,0) specificity and the same declarations as the generic rule. Deliberately
not `pointer-events: none` on the words: that would work and would also make a
lodge's name and description unselectable, which is a real loss of function traded
for a hover effect.

After, at 1440, all four measured:

| pointer over | picture | frame (float) | pill |
|---|---|---|---|
| off the panel | none | none | rest |
| the photograph | **1.06** | none | rest |
| the words | **1.06** | none | rest |
| the button | **1.06** | none | **raised** — `translateY(-8px) rotateX(2.5°) scale(1.015)` |
| any of the above, reduced motion | none | none | none |

---

## 4. The band's height, before and after

`#why-you-came`'s own box, production build, measured with the section scrolled
into view.

| viewport | before | after | change |
|---|---|---|---|
| 390 × 844 | 634px | **461px** | −27% |
| 768 × 1024 | 780px | **454px** | −42% |
| 1024 × 768 | 940px | **370px** | −61% |
| 1440 × 900 | 1,138px | **446px** | −61% |
| 1920 × 900 | 1,342px | **595px** | −56% |

The before figure is the whole section — a 2.357:1 photograph with the chapter's
heading in the cream above it and its paragraph in the cream below. The after
figure is the whole section too, and all of it is photograph.

**The photograph itself got bigger everywhere while the section got smaller.** At
1440 it was drawn 1440 × 611 inside a 1,138px section; it is now drawn 1440 × 446,
which is the whole of a 446px one. At 390 it went from a 165px strip to the full
461px of the section.

From 1100px up the band sits exactly on its floor and its height is `31vw` —
446px at 1440, 595px at 1920. Below that its own words and the header's clearance
set it, which is the "tight where there is room, taller where there is not" half
of the brief; the floor is never a ceiling and nothing can be clipped by it.

### 4.1 What the crop costs the photograph

The length: **26.8%** of it, everywhere the band is on its floor. 31vw against the
photograph's own 42.4vw at full width.

The width is untouched wherever the band is on its floor — the box is 3.23:1
against the photograph's 2.357:1, so `cover` takes the height and nothing else,
and the black panther at the left edge and the tiger at the right both stay in
frame. Below about 1024 the words make the box taller than the photograph and
`cover` starts taking the width instead:

| width | box aspect | width shown | width cropped |
|---|---|---|---|
| 360 | 0.74 | 360 of 1,152px | 68.7% |
| 390 | 0.85 | 390 of 1,085px | 64.1% |
| 520 | 1.28 | 520 of 954px | 45.5% |
| 768 | 1.69 | 768 of 1,070px | 28.2% |
| 900 | 1.94 | 900 of 1,093px | 17.7% |
| 1024 and up | 2.77 → 3.23 | all of it | **0%** |

**On a phone, both edge cats are outside the frame and what is left is the middle
— the two leopards on their rock.** That is the honest cost of putting a heading
and a paragraph on a 2.357:1 photograph on a 390px screen; it is what this
arrangement has always cost (the 100svh version it originally replaced put both
cats off-screen at *every* width, at ratio 0.53); and it is the reason the 19 Aug
build moved the words off the band in the first place. The client has now seen
both arrangements and ruled. Recorded, not hidden.

---

## 5. Why the band could not simply be given the words back

The 19 Aug decision was taken because the arrangement **clipped its own text**: the
band was a fixed `aspect-[1440/611]` box with `overflow: hidden`, 390 × 166px at
390, and the heading was cut off at the top while the paragraph's last line ran off
the photograph onto the cream *as cream type on cream*.

The rebuild copies `Invitation.tsx` exactly: the photograph is a background layer,
the section's height is its own content against a `min-height`, and the section's
background is `--overlay` so anywhere the content outgrows the photograph shows
the scrim's colour rather than a strip of cream. **A section built that way cannot
clip its text; it grows.**

Three consequences that are not cosmetic:

1. **`app/page.tsx` no longer counts `junglesBand` among the cream chapters**, so
   every cream chapter below it swaps surface: `lodges` (base), `rooted` (deep),
   `philosophy` (deep, continuing), `field-days` (base). Still alternating, which
   is the only property that list owes.
2. **There is no `aspect-*` class left in the file**, so `lib/sizes.test.ts`'s
   ratio tripwire has no case for it. It was replaced rather than dropped: a new
   test reads the component's own `min-h-[31vw]` and holds it to
   `JUNGLE_BAND.minHeightVw` — every occurrence, so the comment naming the number
   is held to the dial as well.
3. **The chapter mark is cream, not goldText.** `ui/ChapterLabel` sets itself from
   `--accent-text`, which non-negotiable #7 says is legible on cream and on
   nothing else. It is not re-styled; the property is redefined for that subtree,
   and `jungles · mark` is the probe that proves the redefinition reached it.

### 5.1 The fixed header ate the top of the text, and a screenshot is what showed it

With symmetric `py-16`, parking the section's top at the viewport's top — what a
scroll-stop does, and what the contrast rig does — put the band's own words behind
`SiteHeader`'s opaque cream bar. `jungles · body` read **1.00:1 at 1024, cream on
the cream bar itself**, with `mark` and `heading` doing the same at 768 and `mark`
at 390; the screenshot shows the paragraph's first line sliced off.

This is `Invitation.tsx`'s own recorded finding arriving by a different route, and
it takes the same fix: `pt-24 md:pt-32` (96/128px against a bar that is 75px at 390
and 107px from `md`, plus the display face's ascender, plus air). Asymmetric top
and bottom padding, and no `short:` arm on the top one, for the reason that file
gives — `short:` is a height and `md:` is a width, and which applies on a 1366×768
laptop would be decided by Tailwind's emission order.

**It costs the band nothing at the widths it was cropped for.** With `justify-end`
a top padding only reserves space, so it can only grow the section where the words
plus both paddings already exceed the floor — 1024 and below. At 1440 and 1920 the
floor still wins and the band is exactly `31vw`.

---

## 6. The scrim — solved from scratch, and it is one flat layer

Method as on 19 Aug: strip every `Scrim` layer to `opacity: 0`, hide the type,
screenshot at five widths, and keep **every pixel of every line box** with its
position inside the band — 380,926 of them, collapsed to 1,028 binding
constraints. Each layer is `--overlay` at an opacity, so the composite is exact
arithmetic; the required alpha per pixel is a binary search, and the triple is the
lightest that satisfies every one.

### 6.1 Unwashed

Worst (brightest) pixel under the glyphs, cream type, no scrim at all:

| run | 390 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|
| `jungles · mark` | 1.00 | 1.00 | 1.44 | 3.33 | 3.77 |
| `jungles · heading` | 1.01 | 1.00 | 1.22 | 1.20 | 1.62 |
| `jungles · body` | 1.00 | 1.00 | 1.00 | 1.00 | 1.24 |

**1.00:1 is the theoretical floor** — a pixel whose luminance is exactly cream's.
The body copy reads it at four widths out of five, so this photograph carries none
of its own contrast under that block.

### 6.2 The solve, and why nothing shaped helps

`flat`, `bottom` and `top` were all searched, for the combination with the lowest
mean alpha over the band. **Every shaped combination came back worse than a pure
flat**, and the reason is geometric rather than particular to this frame:

- the words are ~190px of a 446px band at 1440, so their top edge is at **57% of
  the band's height**, and `Scrim`'s `bottom` gradient is at 21% of its own
  strength that high;
- carrying a 1.08:1 pixel to 4.8:1 there needs ~0.74 of total alpha, so even at
  `bottom: 1` the flat only comes down to 0.67 — and those four points cost a
  bottom edge washed to solid `--overlay`, which reads as a bar;
- `top` and `bottom` together leave a weak waist between 28% and 42% of the
  height, which is exactly where this type is.

**Anything laid across a band this shallow will meet the same wall.**

### 6.3 The figure, and what it costs

`{ flat: 0.74 }`, solved to a **5.0 / 3.5** target against a 4.5 / 3.0 floor.

| target | flat |
|---|---|
| the floor itself, 4.5 / 3.0 | 0.69 |
| 4.8 / 3.3 (the floor plus the model's known ±0.15) | 0.71 |
| **5.0 / 3.5 — shipped** | **0.74** |

The extra half-point is bought deliberately. **Solved to 4.8, the rig read 4.59 on
the mark at 390 and 4.62 on the body at 1024** — a tenth of a point in hand, which
is the state `DECISIONS.md` §20.5 records the coverflow's six card scrims in, one
page change away from failing. Here the exposure is not page height but **width**:
this band's crop is a pure function of it, so the worst pixel moves continuously
between whatever widths a rig samples.

What it costs the photograph is less than 0.74 suggests, and that was checked
rather than assumed. `jungle-cats-stitch` has a mean channel of 71/67/52 — it is
already a dark forest — and only **0.07% of its pixels** (601 of 879,840) are the
blown highlights driving the number. Screenshots at 0, 0.4, 0.55, 0.65, 0.71 and
0.74 were opened side by side: the tiger, the leopard and the trees are all
plainly there, one stop down. For scale, **the closing chapter — the section the
client named as the model — composites to ~0.78 under its centred text.**

### 6.4 Measured, final build

`node scripts/check_contrast_over_photos.mjs`, floor 4.5 for the mark and the body
and 3.0 for the heading (display type at 25.6px and up at every sampled width).

| run | 390 | 768 | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|
| `jungles · mark` (4.5) | **5.10** | 7.64 | 8.76 | 8.56 | 8.60 |
| `jungles · heading` (3.0) | **5.03** | 5.85 | 6.29 | 5.90 | 6.77 |
| `jungles · body` (4.5) | **5.22** | 5.32 | 5.13 | 5.34 | 5.99 |
| `lodges · panel 01` (4.5) | skipped | skipped | 5.06 | 5.63 | 7.91 |
| `lodges · panel 02` (4.5) | skipped | skipped | 5.59 | 5.69 | 8.21 |

Worst anywhere in the chapter: **5.03**, against a 4.5 floor. The lodge panels
moved up rather than down when the gutter went (§2).

### 6.5 A sweep of the widths nobody samples

The band's crop is a function of width alone, so the rig was also run at
**360, 430, 520, 640, 900, 1200 and 1600** — seven widths it does not ship with.
Every `jungles` run passed, worst **4.96** (`heading` at 430, floor 3.0) and
**5.04** (`mark` at 520, floor 4.5).

That sweep turned up **one failure that is not this task's and is not new**:
`strip · card 02` reads **3.30 against its 4.5 floor at 360px**. `05 · Experiences`'
six card scrims were solved on 19 Aug at 390/768/1024/1440/1920, and at 360 the
card is 78vw = 281px rather than the fixed 300px it takes from 385px up — a crop
of that photograph nobody has ever measured. `ExperienceStrip.tsx` is outside this
task's scope; it is reported rather than patched, and the fix is one number in that
file's `CARD_SCRIM`. The same sweep also reports `lodges · pill 01`/`02` NOT FOUND
at 900px, which is an artefact of the ad-hoc width: at 900 the stacked panel is
961px tall in a 768px viewport and the pill falls below the fold. The pill is a
solid gold fill whose ratio does not depend on width (4.67 at every shipped width).

---

## 7. Resolution

`node scripts/check_image_resolution.mjs` — **0 under-served by `sizes` at all
five viewports.**

The band's box is no longer a shape, so `BAND_BOX` is a **lower bound** on its
aspect: `JUNGLE_BAND.coverAspectFloor = 0.6`, against a measured worst of 0.74 at
360 × 844. Under-stating the aspect over-states the drawn width, which is the
direction `ui/Photo.tsx` says to err in.

| | drawn at 1440×900 | file served | ratio |
|---|---|---|---|
| 100svh full-bleed (4 Aug – 19 Aug) | 2,706px | 1,440 | 0.53 |
| the photograph's own aspect (19 Aug) | 1,440px | 1,440 | 1.00 |
| **the band as a background (20 Aug)** | **1,440px** | 1,440 | **1.00** |

**The margin costs one file tier on a DPR-1 phone, and nothing else.** At 0.6 the
band asks for 393vw, so every viewport fetches the 1,440px file — which is the
right answer from 768 up, and on any phone at DPR 2 or more, where the drawn width
alone (1,085px at 390) demands more than 1,440 device pixels. Only a DPR-1 handset
over-fetches, by one tier, on a photograph that is below the fold and lazy.

---

## 8. Density

`node scripts/measure_density.mjs`, production build, 1440×900, 150px step.
Before is `density-strip.json` (the build this task started from).

| chapter | height before → after | mean before → after | worst before → after | `passesWorst` |
|---|---|---|---|---|
| `arrival` | 900 → 900 | 0.4 → 0.4 | 0.4 → 0.4 | ✓ |
| `lodges` | 898 → 904 | 36.2 → **35.0** | 36.2 → **35.0** | ✓ |
| `why-you-came` | 1,138 → **446** | 26.5 → **36.0** | 27.4 → **36.0** | ✓ |
| `rooted` | 1,960 → 1,960 | 38.1 → 39.0 | 38.9 → 43.0 | ✓ |
| `philosophy` | 1,880 → 1,880 | 42.1 → 42.7 | 42.8 → **46.5** | **✗** |
| `field-days` | 1,073 → 1,073 | 39.6 → 42.4 | 39.6 → 42.4 | ✓ |
| `invitation` | 903 → 903 | 5.2 → 6.0 | 5.2 → 6.0 | ✓ |
| **page** | 56 → **51 screens** | 38.2 → **35.5** | 70.4 → **68.0** | |
| imagery per screen | | 1.89 → **2.05** | | |
| the average screen | | 52.9% → **54.6% imagery** | | |

**Only two chapters changed height at all**: `lodges` by +6px (the mask padding
`SplitLines` gives its words) and `why-you-came` by −692px. Every other figure in
that table moved without its chapter being touched.

### 8.1 `why-you-came` got worse, and the reason is the instrument

It moved **9.5 points the wrong way while becoming entirely photograph**, which
looks impossible and is not. `measure_density.mjs` hit-tests what is painted, so
type over a photograph scores as photograph and the words moving onto the band is
worth exactly zero. What changed is the chapter's *height*: at 446px it is half a
screen, so the rig reports "no whole screen fits" and scores it on the single
900px window centred on it — a window that is more than half its neighbours'
cream. The 26.5% it used to read was a whole screen fitting inside a 1,138px
photograph, which is the cheapest density figure a chapter can have.

The figure that is not an artefact is the page's, and it went the right way in
every direction: mean 38.2 → 35.5, worst screen 70.4 → 68.0, and **imagery per
screen 1.89 → 2.05**, which is the number the client's original density complaint
turns on.

### 8.2 `philosophy` is over the ceiling and was not touched

**46.5% worst against the 45% ceiling, on a chapter whose height, composition and
copy are all byte-identical.** This is `DECISIONS.md` §5a exactly: the band above
it lost 692px, which is not a multiple of the rig's 150px sample step, so every
chapter below shifted against the grid.

It was checked rather than assumed, because "the grid moved" can hide a real
regression. **Re-run at a 50px step, `philosophy` still reads 46.5% worst** — so
the screen is real and always was; the 19 Aug grid simply never landed on it. The
same 50px run reads `why-you-came` 34.6% and `rooted` 43.0%, and finds the page's
five emptiest screens all at the `philosophy / field-days` join (70.1% at y=5600),
which is a join and belongs to no chapter.

Nothing in this task caused it and nothing in this task can fix it —
`PinnedCollage.tsx` is where that composition lives. **Open item.**

---

## 9. The other gates

| gate | result |
|---|---|
| `npm test` | **475 passed**, was 473 |
| `npm run lint` | 0 errors, 5 pre-existing warnings |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `check_contrast_over_photos.mjs` `/` | clean, all five widths |
| `check_contrast_over_photos.mjs` `/mahua-vann`, `/mahua-tola` | clean, all five widths |
| `check_image_resolution.mjs` | 0 under-served |
| `measure_density.mjs` | 6 of 7 chapters inside 45% worst — see §8.2 |
| `check_films.mjs` | PASS |
| `check_experience_strip.mjs` | PASS — 12 assertions, 99 widths |
| `npm run verify:budget` | PASS — **167.5 KB brotli first load**, unchanged |

**The +2 tests are exactly accounted for.** `lib/motion.test.ts` gains two
(`JUNGLE_BAND` crops the length and nothing else; `coverAspectFloor` sits below
the floor's own aspect), `lib/sizes.test.ts` loses one `it.each` case (the
JunglesBand ratio tripwire, which has no `aspect-*` class left to read) and gains
one (the floor class against the dial).

**The JavaScript delta is zero.** `SplitLines` was already in the first load;
every effect added here is CSS.

---

## 10. Where the client's instructions conflicted

**Requests 2 and 3 pull against each other, which the brief said and the build
confirms.** A band thin enough to look sleek at 1440 cannot hold a heading and a
paragraph at 390px wide: at 1440 the words are 190px of a 446px band and the floor
sets the height; at 390 the same words are 317px and, with the header's clearance,
they set it at 461px — 3% *taller* than the band at 1440 on a screen a quarter the
width. That is the answer being tight where there is room and taller where there is
not, and it is why the crop is a floor rather than a height.

**Request 1's four effects were one flag and one selector apart from each other**,
not four switches — §3.1 and §3.2.

**The "3D effect" is `SplitLines`, reached directly rather than through
`TwoToneHeading`.** `TwoToneHeading` is what the closing section uses and it is
this component plus the page's standard chapter-heading classes; three things
stopped it being reusable here verbatim, all of them properties of the panel
rather than preferences: it takes a `TwoTone` (a headline plus the run of words to
soften) and a lodge's name is a bare string off `content/site.ts` with no such run;
its `onPhoto` sets cream unprefixed, and these words are on the photograph only
from `lg` — below that they are ink on cream, and cream on cream is invisible; and
its size is one unprefixed clamp where this heading needs an `lg:` arm, because a
`vw` term does not halve when the panel does. The visible effect — each line rising
from behind its own mask, staggered — is identical, because it is the same
component doing it.

**One thing the client has not ruled on**: on a phone the band now shows the middle
of the composite and both edge cats are outside the frame (§4.1). It is inherent to
putting a paragraph on a 2.357:1 photograph at 390px, and it is what the
arrangement he asked to restore has always cost.
