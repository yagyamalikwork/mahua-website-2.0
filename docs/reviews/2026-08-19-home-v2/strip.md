# `05 · Experiences` — the pinned coverflow replaced by a horizontal card strip

**Date:** 19–20 August 2026 · **Branch:** `feat/home-v2` · **Spec:** `docs/superpowers/specs/2026-08-19-home-v2-restructure.md` §6, §6a

The client, having seen the pinned carousel built 16–18 August and been told what a strip discards:
*"We change the cards to this new layout with vertical cards that you can see in the 'Curated Group
Departures' section on ecotriip.co."* He chose the plain sideways strip. So the pin, the scroll pacing,
the flank behaviour, the end-holds, `lib/coverflow.ts`, `COVERFLOW` and `scripts/check_coverflow.mjs` are
gone rather than kept behind a flag.

**The chapter's heading, its paragraph and the tiger film are untouched, to the class** — *"We keep the
text and the tiger where they are and not touch them."*

---

## 1. The blocking finding: a portrait card and this library are incompatible

The brief flagged two photographs. **It is five**, and the arithmetic is the whole of this task.

`guide-sunrise` is **not** the 1344 × 685 file the brief assumed. That id has always pointed at
`reference/mockup-media/a-guide-scanning-the-canopy-with-binoculars-at-sunrise-…jpg` at **1000 × 666**;
the client's 17 Aug `Activity-Carousel-Images/guide-sunrise-1000-2.png` re-export was cut for the header
band he deleted the same day and was deliberately never wired up. `reference/home-v2/guide-binoculars-sunrise.jpg`
— the design document's "gentler copy" the brief offered as a lever — is **byte-for-byte the same
photograph at the same size**. That lever was already spent.

What the six actually are, and what a 0.74:1 card does to them with `object-fit: cover`:

| # | card | id | file | aspect | crop in a 0.74 box |
|---|---|---|---|---|---|
| 1 | Private Bush Dinners | `bonfire-dinner` | 1100 × 733 | 1.501 | **50.7% of its width** |
| 2 | Wellness | `sound-healing` | 1000 × 666 | 1.502 | **50.7%** |
| 3 | Screenings and Star Talks | `star-talks` | 900 × 1350 | 0.667 | 9.9% of its **height** — allowed |
| 4 | Nature Walks and Birding | `guide-sunrise` | 1000 × 666 | 1.502 | **50.7%** |
| 5 | Village Craft | `potters-hands` | 700 × 466 | 1.502 | **50.7%** |
| 6 | Jungle Safari | `tiger-crossing-track` | 1344 × 685 | 1.962 | **62.3%** |

This project's bound is 25% of a photograph's **width** (`check_card_stack.mjs` assertion 6, which compares
the loaded `<img>`'s natural aspect against its rendered box). Rearranged, it says the box may not be
narrower than `0.75 × the file's own aspect` — **1.1265 for a 1.5:1 frame, 1.4715 for the panorama.**

**Both are landscape.** There is no portrait card, at any ratio, that this library can serve by `cover`.
Retuning `CARD_BOX` does not buy a legal crop; only a different file does. A shallower card was therefore
not an option — 1.13:1 is not a vertical card.

### What was done about it

**Five editorial crops in the image pipeline** (`scripts/build_images.mjs`, `crop: { left, top, width,
height }` — the same mechanism the 13 Aug room photographs use). Each window was chosen with the file open
at full size, and each entry carries what it keeps and what it discards:

| id | window | keeps | discards |
|---|---|---|---|
| `bonfire-dinner` | 542 × 733 at x 400 | the fire (x≈583) and the laid table (660–803), centred on the pair | the cluster of lantern tripods, x 55–385 |
| `sound-healing` | 493 × 666 at x 254 | the seated figure, centred, a bowl at each bottom corner | the outer bowls |
| `guide-sunrise` | 493 × 666 at x 114 | the guide whole — cap, binoculars, body — and the sun flare at 520–620 | empty scrub either side |
| `potters-hands` | 444 × 600 at x 51 | the pot complete, the hands complete | the out-of-focus bamboo screen, x 495–900 |
| `tiger-golden-grass` | 710 × 959 at x 250 | the tiger whole (x 346–893) | the bright vertical trunk at x 1240–1370, which the crop improves rather than tolerates |

The served file's aspect **is** the card's, so the render-time crop is ~0% and the rig reads it honestly.
Measured across the whole 360→1920 sweep: **worst crop anywhere, 0.3%.**

`star-talks` is not cropped — it arrived portrait, 900 × 1350, and loses 9.9% of a night sky, which this
project leaves unbounded by convention.

**`potters-hands` was also re-sourced**, from `reference/mockup-media/…forest-24….jpg` (700 × 466) to
`reference/home-v2/potters-wheel.jpg` (900 × 600) — checked side by side at full size: the same
photograph, 29% wider. It had to be: a 0.74 window of the 700px file is **345px** wide, narrower than the
card that draws it on any laptop.

### Two of the client's six photographs are not the ones that shipped

**`tiger-crossing-track` could not be cropped, and that is a consent finding as much as a compositional
one.** The frame is the tiger *and* the vehicle of guests behind it, spanning x 0.34–0.85; a 0.377 window
keeps one or the other. And its guest-consent clearance (`scripts/build_images.mjs`, granted 17 Aug) rests
on the guests being *"small, shaded and mostly turned toward the tiger"* — a portrait window would draw
them **2.65× larger relative to the card**, and this pipeline's own standing rule is that **a frame cleared
at one size is not cleared at every size**. It is unused, uncropped, and its consent note is untouched.

`tiger-golden-grass` took the card instead: 1440 × 959, no people in it at all, and freed the same day when
`02 · The Jungles` took `jungle-cats-stitch`. **This substitution is the client's to overturn**, and the
cost of overturning it is a portrait re-export of the safari frame with both the tiger and the vehicle
inside a 0.74 window — which the original scene may not contain.

**`potters-hands` is his choice and it had to be taken off `03 · Rooted Like The Mahua` to be used.**
`content/chapters.test.ts` forbids one photograph appearing twice on the page. `rooted` took
`vann-potters-village` — the Pachdhar potters' village its own third paragraph is actually about — and it
is the better file for that slot on both grounds the slot order is chosen on: 1344px rather than 700px into
a ~421px column, and a 15.0% width crop in the 5:3 `pairLower` box against 9.9% of height before.

### What it costs, stated plainly

At DPR 2 the five crops are short. The card is 340px, so DPR 2 asks for 680 and the crops are 710 / 542 /
493 / 493 / 444 wide — only the tiger clears it. **The ask that closes it is uncropped portrait originals
at ~900px**, which is a re-export rather than a re-shoot for all five, and belongs beside the two groups
`docs/OWED-ORIGINALS.md` already carries. `check_image_resolution.mjs` reports **0 under-served by `sizes`**
at every width at DPR 1, which is what the client tests on.

---

## 2. The card's size was swept, because the client's own number breached his own ceiling

His design document (`Brand&Design-Guidelines/mahua-home-v2-dusk.html`) sets
`.card { flex: 0 0 min(300px, 78vw) }`. At 300px, `05 · Experiences` measured **45.4% mean / 45.4% worst
empty — over the 45% ceiling of non-negotiable #8.**

A strip is a short chapter and the header band above it is structurally sparse: one heading, one paragraph,
a 300px drawing, and 1,344px of width to spend them across. The only lever the chapter has is the size of
its photographs — exactly as the coverflow's was (`DECISIONS.md` §20.4) — so it was swept rather than
nudged:

| `cardMaxPx` | `field-days` mean / worst | page mean | images/screen | cards visible at 1440 |
|---|---|---|---|---|
| **300** (the client's) | **45.4% / 45.4%** — over | 38.4% | 2.00 | 4 whole + a 64px sliver |
| 320 | 42.4% / 42.4% | 38.3% | 2.00 | 4 whole + **4px** — no peek at all |
| **340 — shipped** | **39.6% / 39.6%** | **38.2%** | **1.89** | **3 whole + 84% of a fourth** |
| 360 | 39.8% / 39.8% | 38.0% | 1.89 | 3 whole + 62% of a fourth |

340 is chosen over 320 twice over: 320 clears the ceiling by 2.6pp, which is inside the density rig's own
±3–7pp sampling error (`DECISIONS.md` §5a), and at exactly 1440 it leaves a **4px** sliver of the fifth
card — no peek at all, on the one width the client tests on. It is chosen over 360 because the two are
indistinguishable on density (0.2pp) and 340 shows more of the fourth card.

`potters-hands` at 444px is what bounds any further rise.

**The `images/screen` drop from 2.00 to 1.89 is a lazy-loading artefact, not a density loss.** At 300px the
fifth card is partly on screen at `scrollLeft: 0` and its photograph loads; at 340 it is not, so
`collectImages` counts 19 rather than 20. Nothing was removed from the chapter. Against the figure that
matters — **1.69 images/screen before this restructure** — it is up either way.

---

## 3. Density and transfer, before and after

Measured against a production build on :3110, `node scripts/measure_density.mjs`.

| | before (the coverflow) | after (the strip) |
|---|---|---|
| `field-days` mean / worst | 27.6% / 36.9% | **39.6% / 39.6%** |
| page mean | 35.0% | **38.2%** |
| images per screen | 1.69 | **1.89** |
| chapters over the 45% ceiling | 0 | **0 — all seven inside** |
| page worst screen | — | 70.4%, on the `philosophy / field-days` join |

**The chapter got denser per screen and much shorter**, which is the trade a strip makes against a pinned
stage: the coverflow's 27.6% was three screens of pin, each of them a 1344 × 685 photograph filling the
viewport. The strip is 1.19 screens with no pin at all. The page mean rising 3.2 points is that scroll
coming back.

The page's three emptiest screens are all the `philosophy / field-days` join, which is not this chapter's
and is unchanged by this work.

**JavaScript: `npm run verify:budget` PASS — 167.5 KB brotli first load, 9 files.** `ExperienceStrip` and
`ExperienceCard` are both server components and the strip is a native `overflow-x` scroller, so the
section's own client-JS delta is structurally zero: there is no `"use client"` anywhere in it and nothing
it imports reaches the browser.

---

## 4. Six scrims, solved from scratch

`docs/DECISIONS.md` §20.5 records what carrying a scrim across a re-crop cost the last time — two cards at
3.47:1 and 3.61:1 against a 4.5 floor, and a third over-washed to 8.00. **Here both halves changed**: four
of the six photographs are new to the page, five were freshly cropped to portrait, and the type moved from
the middle of a 1.96:1 card to the foot of a 0.74 one. Nothing was carried over.

Measured by `node scripts/check_contrast_over_photos.mjs` at 390 / 768 / 1024 / 1440 / 1920, worst pixel
under the glyphs, per line box.

| # | photograph | unwashed | shipped scrim | at a 300px card | **shipped, at 340** | bound by |
|---|---|---|---|---|---|---|
| 1 | `bonfire-dinner` | **1.04:1** | `{ flat: 0.22, bottom: 0.95 }` | 4.66 | **5.05** | 390 |
| 2 | `sound-healing` | **1.03:1** | `{ flat: 0.08, bottom: 0.85 }` | 4.64 † | **5.80** | 1440 |
| 3 | `star-talks` | **1.14:1** | `{ bottom: 0.82 }` | 4.65 | **4.82** | 768 |
| 4 | `guide-sunrise` | **1.66:1** | `{ flat: 0.14, bottom: 0.7 }` | 4.76 | **4.80** | 1920 |
| 5 | `potters-hands` | **2.01:1** | `{ flat: 0.05, bottom: 0.85 }` | 4.75 | **5.13** | 390 |
| 6 | `tiger-golden-grass` | **1.08:1** | `{ flat: 0.19, bottom: 0.95 }` | 4.64 | **5.13** | 390 |

† card 2's 4.64 was `{ bottom: 0.95, flat: 0.24 }`; see below.

**Unwashed, five of the six are between 1.03 and 1.14 — two within a hundredth of the theoretical floor**,
which is cream type on pixels of exactly its own luminance. Three rounds of solve-and-remeasure got the six
to 4.64–4.76 at a 300px card; the first round shipped 4.31–5.86 and the second 4.45–5.20, both with a card
under the floor.

### **Growing the card re-solved the scrims, and that is a new instance of §20.5's rule**

The density sweep in §2 took the card from 300px to 340px and **every figure moved up**: the same six
scrims measured 5.05 / **7.33** / 4.82 / 4.80 / 5.13 / 5.13. The words are a smaller *fraction* of a bigger
card, so they sit further inside the `bottom` gradient's strong end, and the same opacity does more work.

`docs/DECISIONS.md` §20.5 already says that moving type is a re-solve exactly as re-cropping a photograph
is. **Changing the card's SIZE is a third form of the same statement**, and it is worth writing down because
it is the one that looks like it should be safe: no photograph changed, no glyph moved relative to its own
block, and the numbers still moved by up to 2.7 points.

Only one of the six was trimmed back. `sound-healing` at **7.33** is mud on the darkest photograph in the
set — the figure a reader can actually see — and it is the one card whose subject was disappearing. It went
from `{ bottom: 0.95, flat: 0.24 }` to `{ flat: 0.08, bottom: 0.85 }` and reads **5.80**. The other five sit
at 4.80–5.13, which is 7–14% over the floor and inside the ordinary spread; taking them lower would be
retuning at the resolution of the instrument's own noise for no visible gain.

**Three of the four widths bind something and no two cards share one** — 390 binds 01, 05 and 06, 768 binds
03, 1440 binds 02, 1920 binds 04. A desktop-only or phone-only check would pass a build that fails
somewhere else.

**Watched failing with the scrims removed**: with `CARD_SCRIM` emptied to `{}` for all six and the page
rebuilt, the same rig reads **1.04 / 1.03 / 1.14 / 1.66 / 2.01 / 1.08 — six FAILs at every width.** That is
the unwashed column above; it is not a modelled figure.

Contrast was also re-run on both property routes on the shipping build — **65 and 70 probes, 0 failures, 0
not-found** — which is where the strip's own runs would have shown up had they been mis-scoped. Four
"NOT FOUND" probes on the home page (`lodges · panel 01/02` at 390 and 768) are identical before and after
this work and belong to another task's section.

Two findings worth keeping:

- **`sound-healing` reads as a dark photograph and is the hardest frame in the set.** The woman's white
  cotton is backlit and sits exactly where the sentence lands. It carries the heaviest wash of the six.
- **`tiger-golden-grass` is the brightest frame and nearly the heaviest wash, because the tiger is DARKER
  than the grass it is walking through.** The wash is set by the grass, not by the cat.

---

## 5. The rig — `scripts/check_experience_strip.mjs`, twelve assertions, every one watched failing

99 widths, 360→1920 in 16px steps, plus three shapes for the assertions that can only be asked once per
page load, plus a reduced-motion arm and a no-JavaScript arm.

| # | asserts | watched failing against |
|---|---|---|
| 0 | there is a strip at all | pointed at `/mahua-vann`: 4 findings, named, no crash |
| 1 | it is a scroll container, has something to scroll, contains its overscroll, carries no snap | `overflow-x: visible` + `overscroll-behavior-x: auto` + `scroll-snap-type: x mandatory` — 15 findings |
| 2 | six cards, each the shape `CARD_BOX` declares, all the same size | `aspect-[1/2]` on the card — 30 findings |
| 3 | the pager is present wherever the peek is not | see §6.2 — the assertion was rewritten after the sweep disproved its first form |
| 4 | no photograph loses >25% of its width, at render | card 1 swapped to `bonfire-circle-night` (1.778:1) — 10 findings, "loses 58.4% of its width" |
| 5 | no card is drawn wider than the file serving it | `cardMaxPx: 900`, `cardVw: 200` — 8 findings, "drawn 900px wide from a 542px file" |
| 6 | the words are inside the card that clips them | body type raised to `clamp(2.4rem, 9vw, 3rem)` — 22 findings |
| 7 | nothing quantises this rig's own samples | see §6 — **it caught a real defect on its first run** |
| 8 | all six cards reachable, whole, inside the scroller | `cardVw: 200` — 12 findings, "-458px inside its right" |
| 9 | six pager links, six distinct accessible names, every target on the page | `aria-label` removed — 11 findings |
| 10 | the strip is focusable, labelled, and driven by the keyboard | `tabIndex` removed — 3 findings, including "six ArrowRight presses moved the strip from 0 to 0" |
| 11 | reduced motion keeps the content and drops the motion | `scroll-snap-type: x mandatory` inside the reduced-motion block — 1 finding |
| 12 | the strip is server-rendered and scrolls with JavaScript disabled | pointed at `/mahua-vann` — 2 findings |

**Assertion 5 was a dud when it was written, and finding that out is worth recording.** It compared
`img.naturalWidth` against the card's rendered width — and with `w`-descriptor `srcset`, `naturalWidth` is
**density-corrected**: it reports 300 for a 300px card off a 542px file, so the assertion could never fire.
The break that was supposed to prove it (a 900px card) produced nothing. It now reads the `w` descriptor of
whichever candidate the browser chose — and that had to search the `<picture>`'s `<source>` elements as well
as the `<img>`, because `ui/Photo.tsx` puts the AVIF and WebP candidates there and `currentSrc` is almost
always one of them. Written the short way first it returned 0 for every card and skipped all six in
silence, so a `fileW` of 0 is now a failure rather than a `continue`.

---

## 6. Two findings the rig produced on its first run

### 6.1 `scroll-snap` was quantising this rig's own samples — the third time on this project

The strip shipped for one build with `scroll-snap-type: x proximity` — the client's own design document
sets `x mandatory`, and the brief's instruction was to use it only if it did not steer the measurement.
Assertion 7 asks a ladder of eleven distinct `scrollLeft` values across the strip's whole range and counts
how many distinct positions come back:

| width | requested | returned |
|---|---|---|
| 768 × 1024 | 11 | **5** — `0, 0, 300, 300, 620, 620, 620, 940, 940, 1228, 1228` |
| 1440 × 900 | 11 | **3** — `0, 0, 0, 300, 300, 300, 300, 300, 556, 556, 556` |

That is `check_coverflow.mjs`'s 43 sample positions collapsing to 6 rests, and `measure_density.mjs`'s
150px grid quantising onto six card centres, arriving a third time (`DECISIONS.md` §5a, §20).

**The snap is gone.** It also lands on the same side as the client's own 18 Aug ruling — *"the scroll now
feels very snappy"* — which was about a different mechanism on this page but about exactly this sensation.
The strip loses nothing a visitor can name: it still drags, still glides, still reaches every card, and the
pager still lands one flush at the left edge. Assertion 7 is now the guard on its **absence**, and
assertion 1 asks the cheap half of the same question at all 99 widths. With the snap gone, all eleven
offsets survive at all three shapes.

### 6.2 "A card always peeks past the edge" is false, and it is a property of a fixed-width card

Assertion 3 was written as *a card always breaks the container's edge, which is what says the strip
scrolls*. The sweep failed it at 360, 376, 680, 696, 1048, 1064, 1368 and 1384px.

The arithmetic: a 340px card and a 20px gap tile at 360px, and the container is `100vw − 96`, so the
remainder sweeps 0→360 continuously as the window widens and is under 20px — **no card pixel showing at
all** — for about 5.5% of any width range. On the shipping build that is **7 of the 99 swept widths: 360,
376, 392, 824, 1176, 1192 and 1544.** A fixed card width cannot avoid it; only a container-relative one
could, and a fixed card is the client's own document's.

So the assertion now asks what is actually true and actually enough — the strip is scrollable and the
affordance row below it is present — and the peek is **reported**: the widths where no card shows are named
in the output, in the shape the retired coverflow's `OFF_CENTRE_NOTE` had. The strip carries three other
affordances at those widths: its own 6px accent scrollbar, the "Scroll →" hint, and the six-link pager.

---

## 7. `scripts/check_films.mjs` — two latent faults fixed, and one symptom that did not reproduce

The tiger lives in this chapter, so the rig is this task's.

**It passes, and it passed before these fixes too**, on a warm cache against a build with the strip in
place: play-once, hold at 10.00s, hover-replay, hover ignored mid-play, the white ground gone measured as
pixels at six widths, reduced motion, no-JS stills present. Two faults were nonetheless real and are fixed:

- **A flat 700ms wait after `window.scrollTo`, on a page running Lenis.** Lenis interpolates toward a
  target, so a fixed wait reads whatever position the page happens to have reached. Replaced with
  `scrollToAndSettle` — poll until `scrollY` stops moving — with the 700ms kept *on top* of it, because the
  entrance reveal and the parallax settle after the scroll does. Every other rig on this project already
  polls.
- **`reveal()` threw a `TypeError` on `null` when a film's chapter was absent**, from inside a loop with no
  film name attached — which is what got the potter's whole arm commented out on this branch rather than
  fixed. It now throws a named error listing the chapters that *do* carry a film, so a reader can tell
  whether the page or the list is wrong. The potter's entry stays commented out: that film is genuinely
  unmounted by the client's own restructure, and the comment above it says so.

**The `rgba(0, 0, 0, 0)` symptom did not reproduce.** Probed directly at 1440 × 900 on this build,
`#field-days`, `#rooted` and `#philosophy` all return real colours — `rgb(233, 223, 200)` and
`rgb(241, 233, 215)` — so no arm of this rig is currently comparing a film's corners against black. The
hazard is real all the same: `"rgba(0, 0, 0, 0)".match(/\d+/g)` yields `{0, 0, 0}`, so a transparent
section would have been silently compared against black and a film blending *perfectly* into cream would
have been reported as a broken blend. `chapterCream` now walks up to the nearest ancestor that actually
paints — which is what `mix-blend-mode` blends against anyway — reports which element that was, and
**throws** rather than guessing if nothing in the chain paints.

The white-ground pixel check is untouched and is not weakened: corners within **1 level** of the chapter's
cream against a tolerance of 6, at all six widths.

---

## 8. What retiring the coverflow cost, in tests

**487 → 473**, 43 files → 42, all green.

| | tests |
|---|---|
| `lib/coverflow.test.ts` + `components/sections/CoverflowCard.test.tsx`, deleted | **−17** |
| `lib/motion.test.ts`'s `describe("COVERFLOW")`, six cases → `describe("STRIP")`, four | **−2** |
| `components/sections/ExperienceCard.test.tsx`, new | **+5** |

`lib/sizes.test.ts` is unchanged in count: `Coverflow.card`'s slot out, `ExperienceStrip.card`'s in — one
genuinely distinct `sizes` string each way, neither shared with any surviving slot, so **the distinct-string
tripwire stays at 21**. That was checked against a suite run and written into the test's own comment rather
than left silent: a tripwire that happens not to fire is indistinguishable from one nobody thought about.

The four new `ExperienceCard.test.tsx` cases that are not simply replacements guard the half
`lib/sizes.test.ts` cannot see — the real widths and real aspects of the six files, which is the gap
`DECISIONS.md` §20.6 recorded (`check_image_resolution.mjs` *reports* an `atLibraryCeiling` photograph and
does not enforce it).

Also retired: `scripts/check_coverflow.mjs` (2,260 lines), the `.coverflow*` block in `app/globals.css`
(**895 lines**, replaced by 130), seven CSS custom properties in `app/layout.tsx` (ten → three), the
`coverflow` `ChapterKind`, and `SITE.coverflow`'s two arrow labels — the strip's pager names each link by
its own activity's title, so there is no shared word for either of them to borrow.

---

## 9. Read by eye — what the strip actually looks like

No instrument here measures whether a card reads well. Both screenshots were opened.

**1440 × 900.** Four cards across a 1,344px container — three whole and 78% of a fourth breaking the
right-hand edge — 340 × 459 each, 20px apart, on the chapter's deeper cream. They read as a row of tall
postcards rather than as a grid: the eye goes along them, which is what the strip is for. Every label,
title and sentence is legible against its photograph, and none of the six looks washed: the bonfire's lit
canopy, the star-talks group's raised arms and the guide's sunrise flare all survive their scrim. The
fourth card's sentence is cut mid-word by the container's edge, which is what a peek looks like and reads
as intended rather than as breakage. Below the strip a gold hairline carries "SCROLL →" at the left and
`01 02 03 04 05 06` at the right.

One thing the eye catches that no assertion does: **the cards' text blocks do not align with each other**,
because each is bottom-anchored and "Wellness" has one line of body where "Private Bush Dinners" has two.
It is correct behaviour — the foot is consistent, the labels are not — and it reads as a row of postcards
rather than as a table, which is the right side to err on.

**390 × 844.** One card, 304 × 411, with a ~20px sliver of the next at the right edge, and the same hint
and pager below. The title is comfortably legible, the sentence sits at two lines, and the photograph still
reads as a photograph rather than as a dark rectangle — which was the risk of a heavy `bottom` on a small
card. The strip is below the fold at this width; the tiger and the chapter's paragraph are above it.

**The header band above the strip is the sparse part of this chapter**, and it is untouched by client
ruling: at 1440 it is 1,344 × ~470px carrying a chapter mark, a heading, one paragraph and a 300px drawing
with ~240px of bare cream beside it. It is what put the chapter over the ceiling at a 300px card, and the
card sweep is what paid for it. **A wider tiger is the one lever it has left**, and it is one line in
`app/page.tsx`.

---

## 10. Still open

1. **`tiger-crossing-track` on "Jungle Safari" is the client's ruling to make.** It ships as
   `tiger-golden-grass`; the reasons are §1.
2. **Portrait originals for the five cropped frames**, ~900px wide, uncropped. Only then does the strip
   serve a Retina screen at full resolution. It belongs in `docs/OWED-ORIGINALS.md` beside the two groups
   already there.
3. **`star-talks` needs no further consent question** — the client was shown exactly what is in it and
   cleared it on 19 Aug — but `guide-sunrise`'s crop draws its subject about twice as large relative to the
   card as the uncropped frame did. He is a guide rather than a guest, his face is in three-quarter profile
   behind binoculars, and the pipeline's rule is about guests; it is named here because the rule's own
   standing lesson is that a frame cleared at one size is not cleared at every size.


---

## 11. The evidence in this directory

| file | what |
|---|---|
| `strip.json` | `check_experience_strip.mjs`'s full report — 99 widths, the per-width sweep, the three scroll ladders, the widths with no peek, 0 failures |
| `strip-contrast-home.json` | `check_contrast_over_photos.mjs` on `/`, five widths, including the six card runs |
| `strip-contrast-vann.json`, `strip-contrast-tola.json` | the same rig on both property routes on the shipping build — 65 and 70 probes, 0 failures |
| `density-strip.json` | `measure_density.mjs` on the shipping build — all seven chapters inside 45% |
| `resolution-strip.json` | `check_image_resolution.mjs` — 0 under-served by `sizes` at every width |
| `films-strip.json` | `check_films.mjs` after its two fixes — the tiger plays once, holds, replays on hover, and its white ground is gone measured as pixels at six widths |
| `shots/strip-1440.png`, `shots/strip-390.png` | the two screenshots §9 describes |

Every number above is re-derivable with one command against `npx next start -p 3110`.

## 12. Not done, and out of this task's scope

- **`CLAUDE.md` still lists `node scripts/check_coverflow.mjs` in its Commands block and describes
  `04 · Days in the Field` as a coverflow.** That file is outside this task's remit; the replacement command
  is `node scripts/check_experience_strip.mjs --port 3110`.
- **`scripts/capture_signature.mjs` names `lantern-hour` as a scene**, which the v2 restructure removed
  before this task began. Pre-existing on this branch, not touched here.
