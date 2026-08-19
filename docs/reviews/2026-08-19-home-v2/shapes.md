# The two new section shapes — `01 · The Lodges` and `02 · The Jungles`

**Date:** 19 August 2026 · **Branch:** `feat/home-v2` · **Spec:**
[`docs/superpowers/specs/2026-08-19-home-v2-restructure.md`](../../superpowers/specs/2026-08-19-home-v2-restructure.md)
§2 and §3.

Every figure below is re-derivable. Screenshots in `shots/` are the final build.

```bash
npm run build && npx next start -p 3110
node scripts/check_contrast_over_photos.mjs --port 3110            # + --url /mahua-vann, /mahua-tola
node scripts/check_image_resolution.mjs --port 3110
node scripts/measure_density.mjs --port 3110
node scripts/check_films.mjs --port 3110
npm run verify:budget
```

---

## 1. What shipped

| | before (this branch, 19 Aug 12:17) | after |
|---|---|---|
| `01 · The Lodges` | `lodgeCards` — two cream cards, four photographs, words beneath | `lodgePanels` — two edge-to-edge photographs, `vann-hero` and `tola-hero`, words on them from `lg` |
| `02 · The Jungles` | `fullBleedQuote` — 100svh of `jungle-cats-stitch` with a centred quote | `junglesBand` — a band at the photograph's own 2.357:1, cream above and below |

New: `components/sections/LodgePanels.tsx`, `components/sections/JunglesBand.tsx`,
`LODGE_PANELS` and `JUNGLE_BAND` in `lib/motion.ts`.
Retired from `ChapterKind`: `"lodgeCards"` and `"fullBleedQuote"`.
**`FullBleedQuote.tsx` is still live** — both property pages route their own
`"fullBleed"` kind to it. **`LodgeCards.tsx` is now routed by nothing at all.**

---

## 2. Density — the number this rebuild was aimed at

`node scripts/measure_density.mjs`, production build, 1440×900, 150px sample step.
`density-before.json` and `density-after.json` are the two runs.

| chapter | before mean | before worst | after mean | after worst |
|---|---|---|---|---|
| `lodges` | 43.7% | **48.6%** ✗ | **36.2%** | **36.2%** ✓ |
| `why-you-came` | 6.4% | 6.4% | 26.5% | 27.4% ✓ |
| `rooted` | 39.8% | 44.5% | 39.8% | 45.0% |
| `philosophy` | 44.1% | 44.6% | 44.1% | 44.3% |
| `field-days` | 27.6% | 36.9% | 27.4% | 35.9% |
| **page** | 36.3% mean, 71.0% worst, 1.76 img/screen | | 36.7% mean, 70.1% worst, **1.65 img/screen** | |

**`lodges` clears the ceiling by 8.8 points** where it was 3.6 points over it,
and it was one of only two chapters on the page that failed `passesWorst`.
**All seven chapters are now inside 45% worst.**

Three things about that table are worth more than the headline.

**The lever was cream, not photographs.** A chapter's density is set by how much
of a 900px window is imagery, and nothing else — type over a photograph scores as
photograph, so what the panels say changes the figure by exactly zero (the
coverflow found the same on 18 Aug). Two levers did the work: the panels reach
the edges of the screen, which recovers the 96px of container padding a side that
`lodgeCards` spent at 1440; and the chapter's header is a two-column block
(heading left, intro right) rather than the centred stack the cards used, which
is ~130px of cream instead of ~290px. The chapter is now **exactly one screen
tall**, so `measure_density.mjs` reports "no whole screen fits" and scores it on
the single window centred on it.

**`why-you-came` got worse and that is the point.** It was a full-screen
photograph, which is the cheapest possible density figure; the client asked for
it to stop covering the whole screen. 27.4% worst is what "headroom and legroom"
costs and it is 17.6 points inside the ceiling.

**`rooted` moved to exactly 45.0% without being touched.** This is
`DECISIONS.md` §5a in action — the rig steps 150px, and a chapter's figure moves
when a chapter *above* it changes height by a non-multiple of that step. It
passes (`passesWorst` is `<=`), and it is sitting on the line; do not read the
0.5pp as a regression caused by anything in these two sections, and do not read
it as safe either.

**`imagesPerScreen` fell 1.76 → 1.65**, because `01` went from four photographs
to two on the client's own ruling and the page did not get shorter by as much.
It is the figure the client's original density complaint turned on, so it is
flagged rather than buried. All four frames the cards drew —
`bungalow-exterior-palms`, `mahua-vann-room`, `mahua-tola-pool` and
`mahua-tola-suite` — are curated and now unused by any route, so a later chapter
can spend them without a new ask to the client.

---

## 3. The Jungles: on the band, or in the cream?

The brief asked for this to be judged by eye. **It was built on the band first,
screenshotted at 1440 and 390, and switched.** What the frames showed:

**At 1440, the two blocks land on the two animals.** `jungle-cats-stitch` is a
stitched composite: a black panther in the dark left quarter, two leopards on a
rock in the middle, a tiger in lit golden grass in the right quarter. A
left-aligned heading has only one place to go — the dark left — and its third
line sat across the panther's head. A right-set paragraph has only one place to
go, and it sat across the tiger's face. The one photograph on the page that shows
all three cats was covering two of them with its own words.

**The wash made it worse rather than better.** Body copy over lit golden grass
needs a heavy layer, and no shaped layer reaches a block that runs the full width
of a 2.357:1 band, so it has to be a `flat`. At `flat: 0.5` the greens went
olive-grey across the whole frame — the exact failure `ui/Scrim.tsx` was written
to warn about ("a wash heavy enough to carry cream type over a blown-out patch of
grass flattens the entire photograph to mud").

**At 390 it is not a judgement call.** The band is 390 × 166px. The type is
taller than that, so the heading was clipped at the top by the band's own
`overflow: hidden`, and the paragraph's last line ran off the bottom of the
photograph onto the cream — **cream type on cream, invisible**. A 2.357:1 band is
not a container for text on a phone.

**So the words are in the cream, and the band carries nothing at all.** The
heading and its chapter mark take the headroom; `03 · The Forest`'s surviving
paragraph takes the legroom, set to the right. The reading order this produces is
better than the one it replaces: the chapter names itself, the heading sets the
tone, the three cats appear at full strength, and the paragraph then names the
animals the visitor has just been looking at.

Two consequences, both recorded in the code:

- **The band has no scrim.** There is no type on it, so a wash would darken a
  photograph nothing is written on.
- **`quote · why-you-came` was deleted from `check_contrast_over_photos.mjs`
  rather than retargeted**, and the three `header scrolled · *` runs that used
  `#why-you-came` as their anchor moved to `#invitation`. That anchor is not
  arbitrary: it has to be a chapter where the header sits over a photograph, so
  that a cream bar failing to arrive is measured as dark type on an image and
  fails loudly. `#why-you-came`'s first 107px is cream now; `#invitation` is the
  home page's one remaining full-bleed photograph below the hero.

---

## 4. The Lodges: what was used, what was left, and the header

**Every word is moved, none is written.** Each panel carries:

| part | source |
|---|---|
| region label — `PENCH` / `TADOBA` | `SITE.places[].region`, matched by `href` |
| name — `Mahua Vann` / `Mahua Tola` | `SITE.places[].label` |
| sentence | `HOME.chapters.lodges.lodges[].body`, **in full, both sentences** |
| button label and route | `…lodges[].cta` and `SITE.places[].href` |

`LodgePanels` iterates the chapter's own copy and looks each lodge up in
`content/site.ts` **by route**, throwing if it cannot find one — a route is the
one field both files are already obliged to agree on, because the button
navigates to it.

**Left unused: `place`, `gate` and `rooms`** ("Pench, Madhya Pradesh", "Five
kilometres from Turia Gate", "Twenty-six rooms"). The reference's panel is a
label, a name, a sentence and a button; the region label already says Pench and
Tadoba, and those three facts open the property page the button goes to. They are
still in `content/home.ts` and nothing else reads them.

**The `body` was NOT trimmed, and that is a decision with a price.** Both
sentences fit at every width. Keeping them makes the block ~23px taller at 1024,
which is 23px higher up the panel, which is where the `bottom` gradient is
weakest — see §5. Dropping to the first sentence is the one lever left if the
photographs are ever wanted lighter, and it costs *"…which the birds found long
before we did"* and *"Raw forest, and very little standing between you and it"*,
which are the best lines in either paragraph.

**The chapter's heading and intro were kept, and re-laid.** *"Two forests, known
deeply"* and its paragraph are the chapter's thesis and say exactly what the two
panels then show; dropping them would have left `01` with no heading on a page
where every other chapter has one. They moved from `LodgeCards`' centred stack
into a two-column header — heading left, intro right, `ChapterMark` flush left,
which is one of the two arrangements `ui/ChapterMark.tsx` says it exists for. That
is a density decision as much as a compositional one: ~130px of cream against
~290px.

---

## 5. The scrims — solved, not chosen

Method: strip every `Scrim` layer to `opacity: 0`, screenshot with the type
hidden, and keep **every pixel of every line box** with its position inside the
panel. Every layer is `--overlay` at an opacity, so the composite is exact
arithmetic — `A = 1 − Π(1 − aᵢ)` — with `bottom`'s alpha a linear ramp over the
lower 72% of the box and `corner`'s a `to top right` gradient solid to 18% and
gone by 68%. Each pixel's *required* alpha is then a binary search, and the
triple is the lightest one that satisfies every pixel at every width.

The cost minimised is **the mean alpha over the panel's top 45%**, not over the
whole panel. That matters: minimising the whole-panel mean returns `flat: 0.70`
and nothing else, because a flat is "efficient" by that measure and ruinous by
eye. Both photographs' subject is in the upper half.

### 5.1 Unwashed, and the final figures

`node scripts/check_contrast_over_photos.mjs` — floor 4.5:1, cream on the
photograph, worst single pixel under the glyphs.

| run | unwashed (worst pixel) | scrim | 1024 | 1440 | 1920 |
|---|---|---|---|---|---|
| `lodges · panel 01` (`vann-hero`) | **1.00-1.02:1** | `{ corner: 0.72, bottom: 0.96, flat: 0.44 }` | **4.80** | 5.61 | 7.67 |
| `lodges · panel 02` (`tola-hero`) | **1.00-1.04:1** | `{ corner: 0.96, bottom: 0.94, flat: 0.24 }` | **4.78** | 5.76 | 7.98 |
| `lodges · pill 01` / `02` | n/a — solid gold | none | 4.67 | 4.67 | 4.73 |

Both photographs measure **1.00:1 unwashed** — the theoretical floor, a pixel
whose luminance is exactly cream's — so neither carries any of its own contrast.

### 5.2 1024 is the binding width, and it is why the rig now samples it

The type's top edge sits at **37% of the panel's height at 1024, 44% at 1440 and
56% at 1920**, while the `bottom` gradient's own alpha is zero above 28% and only
reaches half strength at 64%. So the narrowest two-up width is the hardest one,
and it was 300px away from anything this rig sampled. **1024×768 was added to
`check_contrast_over_photos.mjs`'s default widths.** Five defects on this project
have lived between its fixed samples; a scrim solved at a width nothing measures
would have been the sixth. Both property routes were re-run at the new width and
pass clean.

### 5.3 Why the words are only on the photograph from `lg`

Below `lg` a panel is 390-1023px wide at 4:3, so the block is **83% of its height
at 390 and starts 17% down it**. Nothing shaped reaches that: `bottom` is zero
above 28%, and `corner` has faded out by the time the body copy's lines reach the
right-hand side of the panel. The lightest triple that carried both frames to
4.5:1 with 390 in the sweep was **`flat: 0.60` and `flat: 0.56`** — over the whole
photograph, subject included.

So below `lg` the same block sits under the photograph on cream, in `--text` and
`--accent-text`, where `lib/palette.test.ts` already guarantees it, and the
photograph is shown unwashed. It is rendered once and moved by CSS, not written
twice. `lodges · panel 0N` carries `from: 1024` in the rig and prints a
**skipped** line at 390 and 768 rather than being silently absent.

### 5.4 A 0.15 disagreement between the solver and the rig

Solving to exactly 4.5 gave `panel 02` a predicted 4.58 at 1024 and the rig read
**4.43 — a real failure**. `panel 01` predicted 4.50 and read 4.51. The model is
therefore accurate to about ±0.15 and cannot be trusted at zero margin. Both
scrims were re-solved to a **4.8 target** and the rig now reads 4.80 and 4.78:
the search runs to the floor plus the instrument's own disagreement, which is
what "solve for the bound" has to mean when the search and the gate are two
different instruments.

---

## 6. Resolution: `jungle-cats-stitch` goes 0.53 → 1.00 with no new file

`node scripts/check_image_resolution.mjs` — **0 under-served by `sizes` at all
five viewports.**

| | drawn at 1440×900 | file served | ratio |
|---|---|---|---|
| 100svh full-bleed (before) | 2,706px | 1,440 | **0.53** |
| its own aspect (after) | 1,440px | 1,440 | **1.00** |

The before figure is what a `viewportHeightVh` box costs: `FullBleed` oversizes
the picture to 127.6vh for parallax, so at 1440×900 it is 1,148px tall and
`cover` scales a 2.357:1 photograph until it covers that — 2,706px wide, of which
1,440 is on screen. **Both edge cats were outside the viewport in that
arrangement**, which is a composition defect as much as a resolution one.

Measured after: 1.00 at 768 and 1440, 1.23 at 390 DPR 3, and **0.75 at 1920**,
where the rig reports it `atLibraryCeiling` — the library has nothing wider than
1440. Holding the band at 1,440px with cream either side would fix that number
and breach non-negotiable #8 in the same move, which is the trade the plate
boards already settled (`DECISIONS.md` §19).

The panels' own ratios run **1.09 to 1.87** across all five viewports; 4:3 crops
each 1440×960 hero by 11.1%, well inside the 25% width-crop bound.

---

## 7. The other gates

| gate | result |
|---|---|
| `npm test` | **492 passed**, was 482 |
| `npm run lint` | 0 errors, 5 pre-existing warnings |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `check_contrast_over_photos.mjs` `/` | 1 failure — see §8; every new run passes |
| `check_contrast_over_photos.mjs` `/mahua-vann`, `/mahua-tola` | clean at all five widths |
| `check_image_resolution.mjs` | 0 under-served |
| `measure_density.mjs` | all 7 chapters inside 45% worst |
| `check_films.mjs` | PASS |
| `npm run verify:budget` | PASS — **167.5 KB brotli first load**, against CLAUDE.md's recorded 168.2 |

The +10 tests are exactly accounted for: `lib/motion.test.ts` gains four
(`LODGE_PANELS` ×3, `JUNGLE_BAND` ×1) and `lib/sizes.test.ts` six — two new
`LIVE_SLOTS` rows, each of which feeds two `it.each` blocks, plus two new
`cover boxes match the markup` cases.

The JS delta is **−0.7 KB**: `app/page.tsx` no longer imports `LodgeCards` or
`FullBleedQuote`.

---

## 8. One failure, and it is not these two sections

`coverflow · card 06` reads **4.39 at 390** against its 4.5 floor.

It read **4.59** on the same branch this morning, before any of this work
(`docs/reviews/2026-08-04-task-7/contrast-over-photos.json`, measured
2026-08-19T12:17Z, 12 NOT FOUND and **0 contrast failures**). Every one of the
eighteen coverflow figures moved between that run and this one, in both
directions — `card 05` at 768 went 4.82 → 5.00, `card 02` at 390 went 4.77 →
4.86 — with identical line-box counts and the card correctly centred and
unveiled in both.

The cause is the one `DECISIONS.md` §5a and the 18 Aug snap finding both
describe: **a rig that scrolls a page it is also measuring reads a figure that
depends on the page's own height.** The two sections above `field-days` changed
height, which shifts where each card's sample lands within its own animation
window, which changes which pixel of a high-contrast photograph is the brightest
one under the glyphs. `forest-trail-canopy` is sunlit leaf litter and was solved
on 18 Aug to 4.73 at 390 — **0.23 of margin, which is inside this instrument's
own sensitivity to a change three chapters away.**

**The fix is one number in `components/sections/Coverflow.tsx`** — raise
`CARD_SCRIM["forest-trail-canopy"].centre` from 0.70 until 390 clears with
margin — **and that file is outside this task's scope.** It is left failing and
reported rather than silently patched, because the interesting part is not the
number: it is that six card scrims are all solved to 0.1-0.3 of margin and are
therefore all one page-height change away from the same result. If that chapter
is touched again, re-solve all six with headroom rather than to the floor.
