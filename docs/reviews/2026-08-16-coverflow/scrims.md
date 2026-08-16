# The coverflow's six scrims — solved, and what solving them found

16 Aug 2026. The plan's Task 8, Steps 1b and 4
([`2026-08-16-field-days-coverflow.md`](../../superpowers/plans/2026-08-16-field-days-coverflow.md)).

Every coverflow card is cream type laid straight onto a photograph — the client's own ruling of 16 Aug
(correction C), the shape `FullBleedQuote` has. All six shipped a deliberate `{ flat: 0.5 }` placeholder,
and **nobody had measured a single word on any of them**, because
`scripts/check_contrast_over_photos.mjs`'s `RUNS` table is hand-written and discovers nothing.

Six runs added. Six figures solved. Three findings that were not about the scrims.

---

## 1. What shipped

`CARD_SCRIM` in `components/sections/Coverflow.tsx`. Every layer is `--overlay` at an opacity, so the page
still has exactly one dark colour in it.

| # | Photograph | Before (`{flat: 0.5}`) | After | 390 | 768 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|
| 01 Jungle safari | `vann-safari` | 2.90 / 3.49 | `{ centre: 0.65, bottom: 0.6, corner: 0.4 }` | **5.03** | 6.08 | 6.02 | 6.11 |
| 02 Bird watching | `vann-bird-watching` | 2.88 / 3.76 | `{ centre: 0.8, bottom: 0.6, corner: 0.6 }` | **5.24** | 8.43 | 8.82 | 8.81 |
| 03 Kohka Lake | `vann-kohka-lake` | 3.31 / 4.00 | `{ flat: 0.15, centre: 0.8, bottom: 0.6, corner: 0.6 }` | **4.91** | 7.57 | 7.70 | 7.58 |
| 04 The river walk | `forest-boardwalk-daylight` | 3.42 / 4.21 | `{ centre: 0.65, bottom: 0.6, corner: 0.6 }` | **5.45** | 8.56 | 8.78 | 8.68 |
| 05 Pachdhar | `vann-potters-village` | 2.84 / 2.55 | `{ centre: 0.8, bottom: 0.6, corner: 0.6 }` | **5.18** | 7.16 | 7.94 | 7.79 |
| 06 Walks and cycling | `forest-trail-canopy` | 2.64 / 3.14 | `{ centre: 0.65, bottom: 0.8, corner: 0.6 }` | **5.05** | 7.68 | 7.84 | 7.87 |

"Before" is 390 / 1440. The floor is **4.5** everywhere; **390 is the binding width for all six** and the
bold column is the one that chose each figure. Unwashed, the same type measures **1.01–1.32:1 at 390** and
**1.00–1.79:1 at 1440** — cream on cream, in four of six cases within a point of exactly 1.

Six photographs, six exposures, six figures: `centre` runs 0.65–0.8, `bottom` 0.6–0.8, `corner` 0.4–0.6, and
one card needs a `flat` that no other card needs. Cards 02 and 05 land on the same rung — both are 2.29:1
panoramas with blown highlights directly under the type — and that is a measured coincidence, not a copy.

Re-derive: `npm run build && npx next start -p 3110 && node scripts/check_contrast_over_photos.mjs --port 3110`.

---

## 2. Method, and three things in the rig that are new

The method is this file's own, unchanged: scroll the run into view, hide every text node in its container,
screenshot, crop to the type's boxes, take the **brightest single pixel**. What changed is how a coverflow
card is reached and what counts as its box.

**a. `anchor: true` — scroll the way a click does.** Every other run puts its target at the very top of the
viewport. A coverflow target is a zero-size box placed at exactly the offset an *anchor click* lands its card
centred at, and an anchor click honours `scroll-padding-top` (the header's own height, 77px). Ignoring it
lands every run 77px past the moment it claims to measure. Also switched to `scrollToAndSettle` — the polled
routine `check_card_stack.mjs` wrote and `check_coverflow.mjs` copied — because Lenis is running and a flat
wait is not a promise. The existing 1500ms wait is kept **on top** of it, for parallax and the reveals.

**b. `lines: true` — crop the glyph run, not the block.** Every element on a card is block-level, so its own
rect is the card's full content width: 844px at 1440, with "Jungle safari" in the left third of it. Cropping
that reports a blown-out pixel in the empty gutter as the worst case for type nowhere near it. It is not a
rounding difference — it read **1.00:1 on card 01 where the glyphs measure 1.33**, and it moved solved
figures by whole steps. A `Range` over the text nodes returns one rect per line box, tight to the glyphs,
which is what `[data-word]` gives the headlines and what nothing gave these.

**c. The selector is both text blocks.** The two arrows are the same cream on the same photograph, they sit
in the card's two bottom corners, and nothing on this project measured them. A wash solved on the words alone
leaves "NEXT" unchecked in the one corner a bottom-left wedge never reaches — which mattered: `corner`-led
candidates that looked best on the words alone were the ones that lost the arrows.

Also: **`h3` joined the hidden-tag list.** A card's title is one, and leaving it visible measures its own
cream glyphs as the background beneath itself. No committed figure in this file moves — nothing else in the
table has an `h3` inside a measured crop — and hiding more type is only ever more correct in a rig that
measures what is *behind* type.

**`min` is 4.5, not the 3 the quote runs use, and that is the convention rather than a departure.** 3 is
WCAG's large-text floor and the quotes are display type at 40px+. A card's body is
`clamp(0.76rem, 1.32vw, 0.98rem)` — 12.2px on a phone; its number and arrows are 9.9px; its heading is 18.4px
at 390 where the `clamp()` floors out. None of it is large text at any sampled width.

---

## 3. Watched failing (Step 2)

`vann-safari` set to `{}` — no wash at all — and rebuilt. The rig, against that build:

```
--- 390px ---   coverflow · card 01   floor 4.5  worst 1.02   FAIL
--- 768px ---   coverflow · card 01   floor 4.5  worst 1.34   FAIL
--- 1440px ---  coverflow · card 01   floor 4.5  worst 1.33   FAIL
--- 1920px ---  coverflow · card 01   floor 4.5  worst 1.33   FAIL
FAILED: 4 text run(s) below their contrast floor over a photograph.
```

The other five passed at all four widths in the same run. So the run is reading the card it names, the
figure it reports is the photograph's and not the wash's, and a rig that would pass with no wash at all is
not what shipped.

A second, unplanned confirmation: the first attempt at this measured a **stale server** — `pkill` had not
killed the old `next start`, the new one failed to bind, and every card came back at exactly its
`{flat: 0.5}` placeholder value. The figures were self-evidently the old ones, which is the only reason it
was caught. Kill the port with `Get-NetTCPConnection … | Stop-Process` before believing a rebuild.

---

## 4. What the wash cost — read by eye at 1440 and 390

**At 1440 the photographs are fine.** Card 01 keeps the vehicle's green, the tigress in the grass and the
depth of the forest behind; card 05's terracotta still reads warm against the black pot. Dimmer than the
`{ bottom, corner }` pair that clears the same floor at that width alone — measurably so, the worst pixel
over the whole words block moves from ~2.4 to ~4.8 — but this is not the failure `Scrim.tsx` warns about.
The frames have depth and colour.

**At 390 it is a different picture, and card 03 is the one to look at.** `vann-kohka-lake` under
`{ flat: 0.15, centre: 0.8, … }` on a 342×192 card reads as a dark rectangle with a hint of water in it. Card
05 keeps a little pottery at the top edge; cards 01, 02, 04 and 06 hold up better. **The type is legible on
all six at 390 for the first time**, which it was not before, and that is the trade.

For comparison, the heavier arms that were built and rejected: at 1440, `{ centre: 0.8, bottom: 0.8,
corner: 0.6 }` on card 05 flattens the terracotta to grey-brown and the frame stops reading as a photograph.
That is the mud line, and the shipped figures sit below it at desktop widths.

---

## 5. The finding under the finding: this is the card's geometry, not the wash

Bottom-anchored layers alone (`{ bottom, corner }`) solve every card at 1440 with minimal cost —
`vann-safari` clears at `{ bottom: 0.7, corner: 0.5 }` = 4.67 while leaving the frame almost untouched. The
same layers cannot solve **any** card at 390: the best of them reaches 2.82 on card 04 and 1.32 on card 05.

The reason is measured, not guessed:

| | card | words block | words as % of card |
|---|---|---|---|
| 1440 | 900 × 506 | 844 × 139 | **27%** |
| 390 | 342 × 192 | 302 × 111 | **58%** |

The card shrinks with the viewport; the type does not, because `clamp()` floors it. At 390 the words' top
edge is *above* the `bottom` band's own top edge, so no value of `bottom` reaches it, and the `corner`
wedge's opaque zone is nowhere near the heading. Only `centre` — and, for card 03, a `flat` — reaches the
type at all. **That is why these six figures are heavier than the desktop case needs.**

The lever that would buy the desktop frames back is the card's own small-screen composition — smaller type,
fewer words, or a taller card below ~950px — not a lighter wash. Out of this task's file scope
(`CoverflowCard.tsx`); recorded here as the thing to do if the wash is ever judged too heavy.

**And one photograph is genuinely the wrong crop for words.** `vann-potters-village` measures **1.00:1**
unwashed at 1440 — white-glazed pots sitting exactly where the body copy lands, effectively cream on cream.
It is the only frame in the set that needs its *crop* changed rather than its wash: the same photograph
carries dark ground in its lower left. That joins the higher-resolution originals already owed
(`DECISIONS.md` §5) as a request about the photograph, not a defect in the page.

---

## 6. A real defect the placement check found: cards are off-centre between 768px and 948px

Not a scrim finding. The runs verify that the card they name is the one at the front, and the first form of
that check — "within 8px of the stage's centre", `check_coverflow.mjs`'s own tolerance — fired on **all six
cards at 768px**. Probed across the width range:

| viewport | stage width | card width | card's margins | offset from centre |
|---|---|---|---|---|
| 720 | 672 | 672 | 0 / 0 | 0.5px |
| **768** | **672** | **720** | **0 / −48px** | **22.8px** |
| **860** | **764** | **812** | **0 / −48px** | **25.4px** |
| **947** | **851** | **899** | **0 / −48px** | **25.3px** |
| 1024 | 928 | 900 | 14 / 14 | 0.5px |
| 1440 | 1344 | 900 | 222 / 222 | 0.7px |

The card's width is `min(COVERFLOW.cardMaxPx, 100vw − 2 × stageGutterPx)` with `stageGutterPx: 24`, but
`ChapterSurface` switches from `px-6` (24px) to **`md:px-12` (48px)** at 768. So from 768px up to the point
where the 900px cap binds (~948px), the card is **48px wider than the stage it sits in**; its `margin: auto`
resolves to `0 / −48px`, and it is placed hard against the container's left edge. Every card in that band
sits ~24px right of centre, with 47px of cream on its left and 1px on its right, at every scroll position.

`check_coverflow.mjs` samples 1440 and 390 only, so it has never seen this. It is the same shape as
`DECISIONS.md` §2 #44–45 and #52–53: a defect living between the fixed sample widths.

**Not fixed here** — the lever is `COVERFLOW.stageGutterPx` / `CoverflowCard.tsx`'s width expression /
`app/globals.css`'s `--cf-card-w`, none of which is in this task's scope, and it wants
`check_coverflow.mjs`'s width sweep (the plan's Task 7 assertion 7) to own it. So the contrast runs report
the offset as a **printed, non-fatal note with its number** at every run, and assert the thing that is
actually theirs instead — see §7.

---

## 7. The veil interaction holds, and it is what the runs now assert

Correction C's claim is that a flanking card gets `--coverflow-side-veil` *added over* its own scrim, which
**raises** cream type's contrast rather than lowering it — so the centred card is the worst case and the one
to sample. Confirmed rather than assumed, two ways:

- The veil's own keyframes are `sideVeil` at 0%/25%, **0 at 50%**, `sideVeil` at 75%/100%. At each of the six
  sampled moments the centred card's `.coverflow-veil` computes to **0.00004–0.0015** — off. A flank carries
  0.4 of extra `--overlay`, which can only darken the frame under cream type.
- Measured directly: adding wash monotonically raises every card's worst-pixel ratio across the whole sweep
  (e.g. card 05 at 390: 1.01 unwashed → 2.84 at `flat 0.5` → 5.18 shipped). There is no arm in which more
  overlay lowers a cream run's contrast.

So the runs' fatal placement test is **the veil**, not the x-offset: it is the animation's own distance from
the card's centred moment, and it is immune to §6's layout displacement. `veil > 0.02` fails the run as
fatally as an unfindable target, with the reason printed — because a figure read off a flank understates the
worst case, and a number that looks like a pass is worse than one that fails.

---

## 8. `SplitFeature` retired

`field-days` was its only caller and has been a `coverflow` since earlier today. Deleted
`components/sections/SplitFeature.tsx`; removed its `case` from `app/page.tsx`, `"splitFeature"` from
`ChapterKind`, its `MIN_MEDIA` entry, and its six rows plus its `CASES` entry from `lib/sizes.test.ts`.

- **`CREAM_KINDS` was checked, as instructed.** `"splitFeature"` was in it and came out. Safe *only* because
  the two changes were made together: the kind was already unrouted, so no chapter's position in the
  alternation count moved. Removing a routed kind from that list flips the cream surface of every chapter
  below it, silently. The list now says so.
- **Distinct `sizes` strings 29 → 24.** Five, not six: `SIZES.wide` was two rows (band 1 and band 2, same
  string, different boxes) and one string, and none of the five was shared with a surviving slot. Read off
  the suite's own failure, not computed by hand.
- **Suite 492 → 479.** Exactly the 13 parameterised cases those six slots and one `CASES` entry generated
  (6 × 2 `it.each` blocks + 1). Nothing else moved.
- `npx tsc --noEmit` clean, which is what proves nothing else referenced it — `MIN_MEDIA` is
  `satisfies Record<ChapterKind, number>` and `app/page.tsx`'s switch is exhaustive by design.

**`lib/coverflow.ts`'s `coverflowWindow` is imported by nothing but its own test.** Task 1's §11 superseded
it — the CSS uses lengths anchored to the pinned window, not percentages of `cover` — and no component,
script or stylesheet reads it. Left in place deliberately: that decision is not this retirement's to take.

---

## 9. Gates

| | |
|---|---|
| `npm test` | 479 passed, 43 files |
| `npm run lint` | 0 errors (5 pre-existing warnings in `lib/booking/asiatech-provider.ts`) |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `check_contrast_over_photos.mjs` `/` | pass, 24 runs × 4 widths |
| `check_contrast_over_photos.mjs` `/mahua-vann` | pass |
| `check_contrast_over_photos.mjs` `/mahua-tola` | pass |
| `check_coverflow.mjs` | pass — 8 cards, order 0→7, worst centre 1.85px @1440 / 5.92px @390 |
| `check_films.mjs` | pass — including the white-ground-gone pixel assertion at six widths |

Every existing contrast run still passes and none of their figures moved.
