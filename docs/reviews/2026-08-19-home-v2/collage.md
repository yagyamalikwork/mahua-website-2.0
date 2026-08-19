# The two pinned collages, the potter, and the reviews

**Date:** 19 August 2026 · **Branch:** `feat/home-v2` · **Spec:**
[`docs/superpowers/specs/2026-08-19-home-v2-restructure.md`](../../superpowers/specs/2026-08-19-home-v2-restructure.md)
§4, §5 and §7.

Every figure below is re-derivable against a production build. Screenshots in
`shots/` are that build.

```bash
npm run build && npx next start -p 3110
node scripts/check_pinned_collage.mjs --port 3110                        # `03 · Rooted`
node scripts/check_pinned_collage.mjs --port 3110 --chapter philosophy   # `04 · Philosophy`
node scripts/check_entrances.mjs --port 3110
node scripts/measure_density.mjs --port 3110
node scripts/check_contrast_over_photos.mjs --port 3110
node scripts/check_image_resolution.mjs --port 3110
node scripts/measure_page.mjs --port 3110
npm run verify:budget
```

**Both `check_pinned_collage.mjs` invocations are now a promise the suite keeps.**
`check_entrances.mjs` asserts the seam in both directions — a `[data-drift]`
element in a chapter nobody runs that rig against fails, and a chapter listed as
covered that has stopped drifting fails too. `--drift-chapters` is the list.

---

## 1. What shipped

| | before | after |
|---|---|---|
| `03 · Rooted Like The Mahua` | one photograph at the left margin, two at the right, chapter centred between them; the potter's film closing it | chapter **left and left-aligned**, all three photographs **lined up on the right**; no film |
| `04 · Mahua Philosophy` | the same composition, mirrored (`mirrored` flips which margin takes the solo) | the mirror of the above — chapter **right and right-aligned**, photographs on the left |
| the seam between them | 160px of cream, and a step from `paper` to `paperDeep` | **no step and no band**: one cream, and the second chapter's top padding and the first's bottom rhythm cancel |
| `invitation` | heading, two paragraphs, two pills | the same, and **the three guest quotes below the pills** |
| `components/sections/Testimonials.tsx` | on disk, routed by nothing since the v2 spine landed | **deleted**, with its two `LIVE_SLOTS` rows and its `CASES` entry |

---

## 2. Density — the number the recomposition had to hold

`node scripts/measure_density.mjs`, production build, 1440×900, 150px step.

| chapter | before mean | before worst | after mean | after worst |
|---|---|---|---|---|
| `rooted` | 39.8% | **45.0%** | **38.1%** | **38.9%** ✓ |
| `philosophy` | 44.1% | 44.3% | **42.1%** | **42.8%** ✓ |
| `invitation` | 2.3% | 2.3% | 4.8% | 4.8% ✓ |
| **page** | 36.7% mean, 70.1% worst, 1.65 img/screen | | **35.0% mean**, 70.3% worst, **1.69 img/screen** | |
| average screen | 56.8% imagery, 6.5% type | | **58.0% imagery**, 7.0% type | |

Four things in that table are worth more than the headline.

**Moving three photographs to one margin costs imagery, and it had to be paid
for before it was spent.** A chapter with a photograph at each margin fills both
edges of the screen at every height; one with all three on a single side does
not. The naive version of this layout — the existing column widths and box
ratios, both image columns simply moved to one side — works out at **~44.6%
imagery against the 50.1% it replaced**, which would have taken `rooted` from
45.0% worst (already on non-negotiable #8's line) to over 50%. Three decisions
bought it back, and all three are in `components/motion/PinnedCollage.tsx`:

- the block of photographs is **as tall as the pin allows** (84vh at 1440×900)
  rather than each column centred at its natural size;
- the pair **shares the tall photograph's height**, so the inner column has no
  cream above or below it — `aspect-[7/8]` + `1.83vw` + `aspect-[5/3]` comes to
  760.3px against the tall one's 760.7px at 1440, which is what "lined up" means
  arithmetically;
- the chapter's column is **a third** of the container rather than the 1.3fr the
  centred composition gave it (421px against 408px of *text*, so the copy is not
  squeezed — the saving is the two 40px gutters the centred version spent).

Measured after: **51.6% imagery** in the pinned steady state, against 50.1%.

**`rooted` was on the line and is now 6.1 points clear.** 45.0% → 38.9% worst.
It was passing on `<=` and inside the instrument's own ±3-7pp error
(`DECISIONS.md` §5a); it is not now.

**The seam between the two chapters was the page's second, third and fourth
emptiest screen, and it is gone.** Before, the five emptiest screens on the page
were `philosophy / field-days` at 70.1% and `rooted / philosophy` at 68.0%,
67.8% and 66.8%. After, `rooted / philosophy` is not in the five at all — the
list is `philosophy / field-days` (70.3, 65.6, 61.7) and `why-you-came / rooted`
(58.5, 58.2). Closing that join was a continuity decision (§3); it turned out to
be the largest single density change in this task.

**`philosophy` is 2.2 points clear and that is inside the instrument's error.**
The chapter carries one moved paragraph — 55 words against `rooted`'s 139 — and
the client has ruled it stays that way (*"we will later add more text to the
philosophy, for now keep this"*). The whole of the difference between the two
chapters' figures is type: 11.0% for `rooted` against 6.6% for `philosophy` at
the same 51.6% imagery. **No words were added and none invented.** What was done
instead is the one thing the brief allowed: a chapter carrying a single paragraph
is set at 1.22rem rather than the 1.02rem three paragraphs need, keyed off
`copy.body.length` rather than off the chapter's id, so it un-does itself the day
the client's extra paragraphs land. It is worth ~0.6pp of type and rather more
than that to read.

**`invitation` went 2.3% → 4.8%**, which is the quotes growing the section 3px
past the photograph's own 100vh at 1440×900 and rather more at 390. The band
below the photograph is the section's `--overlay`, and `measure_density.mjs`
stops at the first opaque background, so it scores as empty. 4.8% against a 45%
ceiling.

---

## 3. Continuity: what makes `04` read as the second half of `03`

The client asked for `04 · Mahua Philosophy` to be *"in continuity as it is an
extension of an already existing section"*. Three things do that work, and one
of them is a real break with how this page is built.

**One cream, not two.** `app/page.tsx` alternates `paper` and `paperDeep` down
the page so a join between two chapters reads as two panels meeting — which is
exactly what this pair must not read as. `positions()` now hands a *continuing*
chapter the surface the one above it is standing on and does not advance the
cycle, so everything beneath the pair still alternates as though the two were one
chapter: `lodges` base, `why-you-came` deep, `rooted` base, `philosophy` **base**,
`field-days` deep. The alternation this list owes is intact; the one join it no
longer draws is the one that is not supposed to be seen.

**No band of cream between them.** `PinnedCollage`'s `continues` prop drops the
chapter's own top padding and pulls it up by the rhythm the chapter above ends
with, so the two sections meet exactly. What is left between the two
compositions is the ~14vh of cream each one has inside its own pinned screen —
about 250px at 1440×900, which reads as a page turning rather than as a gap. It
applies to the **pinned branch only**: below the pin viewport these are two
ordinary chapters and the page's ordinary join is the right join for them.

**The mirror.** Same block, same height, opposite hand. `app/page.tsx` counts
the pinned scenes and alternates `mirrored`; neither section knows the other
exists.

**Read by eye, at `shots/rooted-philosophy-seam-1440.png`:** it reads as one
idea continuing. Scrolling out of `03` the words are on the left and a wall of
photographs on the right; the ground never changes tone; and `04` arrives with
the same wall on the *left* and the words on the right. The thing that makes it
a continuation rather than a repeat is that the second screen is the first one
turned over — the eye has to cross the page to find the words, which is a
different experience from meeting the same layout twice. What would have made it
read as a repeat, and did before the seam was closed, is the band of cream and
the tonal step: those two together announce "new section", and a new section
carrying the same composition is where "template" comes from.

The one honest caveat: `04`'s heading sets on one line where `03`'s sets on two,
and its column of type is a third as tall. The pair reads as one idea and as
**unequal halves of it** — which is what a 139-word chapter followed by a
55-word one is. The client owns that, and has ruled on it.

---

## 4. The pinned contract — non-negotiable #9, unchanged

`node scripts/check_pinned_collage.mjs` at 1440×900.

| | `rooted` before | `rooted` after | `philosophy` before | `philosophy` after |
|---|---|---|---|---|
| headline movement | **0px** over 840px of scroll | **0px** over 840px | 0px | **0px** over 840px |
| drift, three rates | 126 / 89 / 50px | **126 / 88 / 51px** | 126 / 89 / 50px | **126 / 88 / 51px** |
| all three rose | yes | yes | yes | yes |
| pin released | yes | yes | yes | yes |
| reduced motion / no-JS / 1280 | unpinned, scroll returned | unpinned | unpinned | unpinned |
| GSAP blocked | unpinned | unpinned | unpinned | unpinned |
| verdict | PASS | **PASS** | **FAIL** (word floor) | **PASS** |

`COLLAGE_RATES` was not touched. The leading photograph still drifts at exactly
`PARALLAX_MAX`, the pin is still two screens, and the 1px differences in the
measured travels are the rig's own rounding across a re-laid composition, not a
change of rate. **The drift cap did not rise and could not have**, which is the
whole of #9.

`philosophy`'s FAIL was `check_pinned_collage.mjs`'s own flat floor of **100
words**, which it read 55 against — a fact about `rooted` rather than a question
about the page, and a rig failing a chapter for carrying the copy its owner chose.
It is now a **comparison against the same chapter with the script on**, read in
`SECTION_METRICS` for both runs: the no-JS count must be at least 90% of the live
one, with a small absolute floor underneath for the case where both render
nothing.

**Watched failing, twice, and the second one is the point:**

| deliberate break | no-JS words | old flat floor of 100 | new comparison |
|---|---|---|---|
| the unpinned branch renders 1 of 3 paragraphs | 51 of 139 | fails | **fails** — *"63% of the chapter's copy needs JavaScript to appear"* |
| the unpinned branch renders 2⅓ of 3 paragraphs | **115** of 139 | **passes** | **fails** — *"17% of the chapter's copy needs JavaScript to appear"* |

The second row is why this is not a relaxation: the form it replaces would have
passed a `rooted` quietly shedding a sixth of its copy without JavaScript.

---

## 5. The reviews under the buttons

`chapterCopy("invitation").quotes`, verbatim and in order, rendered in
`Invitation.tsx` below the two `PillButton`s: three columns from `md`, stacked
below it, each opened by a gold hairline, the quote in the display face and the
attribution as `NAME · TRIPADVISOR · YEAR`. `shots/invitation-1440.png` and
`shots/invitation-390.png`.

**Do they read as real reviews? Yes — because they are real.** All three are
verbatim from the Tripadvisor widget on the live site, trimmed only at sentence
boundaries, and `content/home.test.ts` refuses an unattributed one. What is
*placeholder* about them is the mechanism, not the words: they are frozen copies
rather than a feed, and the client's *"later when we get the TripAdvisor API"* is
about replacing the mechanism. Nothing in the presentation claims otherwise —
no star rating, no Tripadvisor mark, no review count, no "latest" — and the year
on each (2019-2021) is the honest signal that they are old. **If the client wants
them visibly marked as samples for the stakeholders, that is one string in
`content/home.ts` and it has to be his words, not ours.**

**No heading was written.** The `guests` band's own heading and paragraph did not
move — that paragraph said "fourteen at Tadoba", a count the client corrected to
eleven on 12 Aug — and inventing a replacement is exactly the failure mode this
project has a memory entry about. The quotes sit under the buttons with no title.

### 5.1 Two defects the quotes caused, both found by measurement and both fixed

**The chapter's heading went under the fixed header.** Adding the quotes made the
block taller than the screen, so `items-center` stopped pushing the heading clear
and started pinning it to the section's top padding. At 1440×900 its glyph boxes
measured **y=89 against a cream header bar 107px deep**, and
`check_contrast_over_photos.mjs` read `invitation · heading` at **1.00:1 — cream
on the cream bar** at 1440 and 1920. A screenshot shows the top of "Two forests
are" sliced off. The fix is `pt-40` (160px) against `pb-16`: the header's 107
plus the ~25px the display face's ascender reaches above its own line box, plus
air. Heading top in section, after: 131 / 249 / 223 / 178 / 267px at
390 / 768 / 1024 / 1440 / 1920, against a 75px header at 390 and 107 elsewhere.

**The two paragraphs fell out of the radial's falloff at 390.** The section grows
to ~1,100px there, the radial grows with it (its ellipse is a percentage of its
box), and the body copy ends up at **r = 1.08 of the ellipse — no radial alpha at
all**. `invitation · body` read **4.26:1** against a 4.5 floor, on copy this task
never touched. That is the argument already written on this scrim one step
further along: only the even wash reaches type that far off centre. `flat` is
0.54 → **0.60**, solved rather than nudged — the failing pixel composites to
4.87:1 at that alpha, which is the floor plus the ~0.15 this rig and an
arithmetic model were measured disagreeing by (`shapes.md` §5.4). The photograph
pays 6 more points of wash; it is already the darkest frame on the page.

### 5.2 The rig does not reach the quotes, and they were measured separately

`invitation · body` reports **8 line boxes at 768-1920 and 4 at 390 — the same
counts as before the quotes existed**. The nine new blocks of type are not in
that run's sample. Reproducing the rig's own method at the same scroll position
finds **22** boxes, so this is a property of the rig's sequence rather than of
the markup; `check_contrast_over_photos.mjs` is outside this task's scope and is
left alone.

The quotes were therefore measured directly, by the same method — hide every
text element in `#invitation`, screenshot, and take the worst pixel under each
line box:

| viewport | quote text | attribution |
|---|---|---|
| 390×844 | **6.05:1** | 9.84:1 |
| 1440×900 | **6.22:1** | 6.50:1 |
| 1920×1080 | **6.33:1** | 6.33:1 |

All well clear of the 4.5 floor. Both `<p>` elements are inside the `blockquote`
and the `figcaption` deliberately, so that the day that run does reach them it
covers them without a new selector.

---

## 6. Resolution — five of six photographs are better served

`node scripts/check_image_resolution.mjs` — **0 under-served by `sizes` at all
five viewports**, before and after.

The pinned boxes were re-solved for the six photographs' real shapes rather than
inherited. `pairTop` is a **0.667 portrait in both chapters** and was being drawn
in a 3:2 landscape box, which threw away 55% of its height; it is 7:8 now.

| slot | photograph | 1440 before | 1440 after | 1920 before | 1920 after |
|---|---|---|---|---|---|
| `solo` | `lantern-bridge-dusk` 1300px | 1.08 | 1.05 | 0.98 | 0.96 |
| `pairTop` | `forest-shrine-incense` 700px | 1.14 | **1.52** | 1.05 | **1.47** |
| `pairLower` | `potters-hands` 700px | 1.45 | **1.66** | 1.22 | **1.47** |
| `solo` | `veranda-through-leaves` 1100px | 1.08 | 1.05 | 1.36 | 1.33 |
| `pairTop` | `petal-bowl-map` 700px | 1.14 | **1.52** | 1.05 | **1.35** |
| `pairLower` | `lily-pond-fountain` 1080px | 1.33 | **1.52** | 1.34 | **1.35** |

The two tall flanks give a little back — they are the only two of the six with a
file wide enough to spend, and `lantern-bridge-dusk` at 1920 sits at the
library's ceiling either way (0.98 before, 0.96 after; its widest file is
1300px).

---

## 7. The other gates

| gate | result |
|---|---|
| `npm test` | **487 passed**, was 492 — see §8 |
| `npm run lint` | 0 errors, 5 pre-existing warnings |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `check_pinned_collage.mjs` `rooted` / `philosophy` | **PASS / PASS** |
| `check_entrances.mjs` | **PASS** — 29 staged and settled, 6 headlines, 1/1 parallax moved, `6 [data-drift] elements, all in #rooted, #philosophy` |
| `check_contrast_over_photos.mjs` `/` | **0 failures** at 390 / 768 / 1024 / 1440 / 1920 |
| `check_image_resolution.mjs` | 0 under-served |
| `measure_density.mjs` | all 7 chapters inside 45% worst |
| `check_films.mjs` | **crashes** — see §9 |
| `measure_page.mjs` | motion probe measures **6 chapters, 0 nulls** — see §9 |
| `npm run verify:budget` | **PASS — 167.5 KB brotli first load, delta 0** |

Transfer, `measure_page.mjs`: **390px initial 593 KB, whole 1,650 KB; 1440px
initial 813 KB, whole 2,418 KB.** Hero `responseEnd` 3,501 ms on Slow 4G — a
single run, and single runs on this page vary by ~1.7s, so it is reported and not
compared. Nothing in this task touches the first load: the JS delta is 0 and no
photograph moved above the fold.

**`coverflow · card 06` at 390 was the one known failure and it cleared itself**:
4.39 → **4.73**. It was never that card's defect — the sections above it changed
height again and its sample lands somewhere else on the same photograph. Every
other coverflow figure moved by ±0.2 in both directions for the same reason. Do
not read the recovery as a fix.

---

## 8. What retiring `Testimonials` cost in tests: exactly five

492 → 487, and every one is accounted for:

- **−4**: its two `LIVE_SLOTS` rows (`wide`, `tall`), each of which feeds two
  `it.each` blocks in `lib/sizes.test.ts`.
- **−1**: its case in that file's `cover boxes match the markup they describe`
  table.

The distinct-strings tripwire moved **22 → 21**, deliberately, and it is two
changes netting to one: `Testimonials`' two strings come out (both genuinely
distinct — nothing else on the page serves 58vw or 41vw), and `PinnedCollage`'s
realignment adds one, because its two pair frames now share
`(min-width: 1024px) 30vw, …` where they used to borrow `ChapterIntro`'s 40vw and
35vw. Those two do **not** leave the set — `ChapterIntro` still uses them, and it
is still what this scene renders below the pin viewport. `PinnedCollage.solo` is
still byte-identical to `ChapterIntro.solo`.

The component's two photographs, `lawn-picnic-golden-hour` and
`garden-path-lodge`, are curated and now unused by any route. They were
deliberately **not** added to `invitation.media`.

---

## 9. Two rigs, and what is now true of each

**`measure_page.mjs`'s motion probe was passing while measuring nothing.** Its
list of chapters was hard-coded and named `forest`, `rooms` and `guests`, three
chapters the v2 restructure removed. `getElementById` returned `null` for each,
the scroll expression fell back to `0`, the two screenshots were the top of the
page twice, and it recorded `changedPercent: 0` — a plausible-looking figure for
a section that does not exist. It reads `main section[id]` now and drops the
first (there is no *entering* the hero). Descendant and not child, because a
pinned chapter is `main > div > section` once `CollageStage` has switched the pin
on — `main > section` would have found every chapter except the two this rig most
wants to watch enter. After: **6 chapters, 0 nulls** — `lodges` 68.1%,
`why-you-came` 58.0%, `rooted` 46.7%, `philosophy` 43.2%, `field-days` 24.3%,
`invitation` 63.8%.

**`check_films.mjs` crashes on this branch, and the crash is the ruling.** Its
`FILMS` list is hard-coded and still names `{ chapter: "rooted", name: "potter" }`;
with the film unmounted it throws on a `null` element rather than failing
cleanly. That file is outside this task's scope. **The tiger arm still passes** —
verified by running the same rig against a copy with the potter entry removed:
plays once in 2.36s, holds at 10/10s, hover mid-play ignored (2.36 → 2.95s),
hover replays (10 → 0.86s), parked pointer does not re-fire (10 → 10s), re-entry
does (10 → 0.87s), white ground gone as pixels at all six widths (corners within
0-3 levels of the chapter's cream, tolerance 6), reduced motion holds at t=0, and
the still is present with no JavaScript. **PASS.**

Nothing about the potter is deleted: `SignatureFilm`, `/media/potter-film.mp4`,
its poster and the rig are untouched, and `feat/image-sizing` still ships it.
Whoever restores it will also have to restore a `footer` slot on `PinnedCollage`
— it came out with the film, because the pull-up that positioned it
(`50vh - C/2 - 56px`, where C is the **centred** column's rendered ink) was
solved against a composition this file no longer draws, and a formula that is
quietly wrong is worse than no slot at all.

---

## 10. What the spec got wrong, and one thing it could not have known

**§4 and §5 are silent on density, and density was the whole difficulty.** The
spec describes the two chapters as a realignment — text one side, photographs the
other — which reads as a compositional change costing nothing. It is not: moving
three photographs to one margin removes imagery from one whole edge of the
screen, and the straightforward version of it would have taken `rooted` over
non-negotiable #8. §8 of the spec does say every page-level figure is invalid
until re-run; what it does not say is that this particular change has a
first-order density cost that has to be designed around rather than measured
afterwards.

**§5's photograph order is right, and its reasoning is now only half the story.**
`content/chapters.ts` already departs from the order §5 lists (`petal-bowl-map`,
`veranda-through-leaves`, `lily-pond-fountain`) so that the tall flank takes the
1100px file. That still holds. What has changed is that the flank is no longer
the only slot whose file width matters: with the pair sharing a plain third of
the container rather than a third plus an 11vw bleed, `pairTop` and `pairLower`
are drawn 421px rather than 562px and 483px, which is why five of the six
photographs are better served than before.

**Nothing in §4, §5 or §7 anticipated the fixed header.** The `invitation`
heading landing behind the cream bar is caused by the quotes, three sections
away, and it is invisible to every instrument on this project except a
photograph-contrast run that happened to read cream on cream. It was found
because that rig reported **1.00:1** — the theoretical floor — which is the
reading that always means "the thing measured is not where you think it is".
