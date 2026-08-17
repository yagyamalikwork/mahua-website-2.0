# `check_coverflow.mjs` — every assertion, watched failing

17 Aug 2026. The plan's [Task 7](../../superpowers/plans/2026-08-16-field-days-coverflow.md), Step 2, and
the defect its assertion 7 was written to catch.

The rig shipped with one assertion (the placement/hit-test one) and a reduced-motion arm. It now carries
nine plus a precondition. **Every one of them has been run against a build deliberately broken in the way
that assertion is written to catch** — a rig that passes against a build broken *elsewhere* has proved
nothing, which is `docs/DECISIONS.md` §2's own repeated shape.

Each row below is one break: what was changed, the rig's own words against it, and the restore. The build
was rebuilt and the server restarted between every one, killing port 3110 first — `scrims.md` §3 records a
run where `pkill` missed, the new server failed to bind, and every figure came back at its pre-change
value.

**Where the width sweep was not the assertion under test it was run at `--sweep-step 400` rather than the
committed 20**, to keep a break cycle near ninety seconds. The assertion under test is fully exercised in
every case; the two full runs at step 20 are §1 and §11 below.

---

## 1. The defect the sweep found: cards sat 24px off-centre from 768px to 996px

Not a break. This is `check_coverflow.mjs` run at its committed settings against **the build as it stood on
16 Aug** — the one that had passed every previous review — with the new assertion 7 in place and nothing
else changed:

```
width sweep         79 widths × 2 targets, 360-1920px step 20, worst off-centre 25.60px

FAIL
  - assertion 7 · sweep: the centred card was not centred in its stage at 780-980px (21 of 158
    samples). Worst 25.6px at 860px, where a 811.5px card sits in a 764px stage with margins
    1.8 / -49.4. A card wider than its stage cannot be centred: with `left: 0; right: 0` and a
    definite width, `margin-inline: auto` is over-constrained and CSS 2.1 §10.3.7 resolves it by
    pushing the box to the inline start
  - assertion 7 · sweep: the card's rendered width was not `min(--coverflow-card-max, the stage's
    own width)` at 780-980px (22 of 158 samples). Worst at 840px: drawn 792px, wanted 744px
    (stage 744px). The card's own width expression and the container that holds it disagree about
    what bounds it — which is exactly how this defect shipped, with the card bounded by
    `100vw − 2 × 24px` inside a container padded 48px a side from `md` up
```

Every sampled width in the band, read off `coverflow.json`'s own `widthSweep`:

| viewport | stage | card (laid out) | should be | off centre | margins |
|---|---|---|---|---|---|
| 760 | 712 | 711.7 | 712 | −1.0 | −0.8 / 1.1 |
| **780** | **684** | **731.7** | 684 | **24.9** | 1.0 / **−48.7** |
| **800** | 704 | 751.9 | 704 | **24.3** | 0.3 / −48.2 |
| **820** | 724 | 771.9 | 724 | **24.5** | 0.6 / −48.4 |
| **840** | 744 | 792.0 | 744 | **23.9** | −0.1 / −47.8 |
| **860** | 764 | 811.5 | 764 | **25.6** | 1.8 / **−49.4** |
| **880** | 784 | 831.7 | 784 | **25.2** | 1.4 / −49.0 |
| **900** | 804 | 851.8 | 804 | **24.8** | 0.9 / −48.7 |
| **920** | 824 | 871.9 | 824 | **24.3** | 0.4 / −48.3 |
| **940** | 844 | 891.8 | 844 | **24.6** | 0.7 / −48.5 |
| **960** | 864 | 899.9 | 864 | **17.6** | −0.3 / −35.5 |
| **980** | 884 | 899.5 | 884 | **6.2** | −1.6 / −13.9 |
| 1000 | 904 | 899.7 | 900 | −1.1 | 1.0 / 3.3 |

The true band is **768px to 996px** — 768 is where `ChapterSurface` switches from `px-6` to `md:px-12`, and
996 is where `100vw − 96 ≥ 900` and the card's own cap takes over. The sweep steps 20px from 360, so it
samples 780 first and 980 last; the two endpoints are arithmetic, not measurement.

**980 is the row worth reading twice.** Its offset is 6.2px — *inside* the rig's own 8px centring tolerance
— while its width is still 15.5px wrong. A rig that only checked "is the card centred" would have reported
that width as fine. The width assertion is the stronger of the two and it is the one that names the
mechanism.

`docs/reviews/2026-08-16-coverflow/scrims.md` §6 found this by a different route the day before — its
contrast runs' placement check fired at 768, and it probed 720/768/860/947/1024/1440 by hand and left the
fix to this task. It did not reach 948-996: at 947 the card is capped at 900 in a 851px stage, and its
table stops there and resumes at 1024. **The band is 28px wider than that probe recorded**, which is the
sweep earning its own keep on the first run.

### The fix, and what it measures now

The card is bounded by the **stage** rather than by the viewport:
`min(var(--coverflow-card-max), 100%, 100vw - 2 * var(--coverflow-gutter))` in `CoverflowCard.tsx`, with
`CARD_SIZES` spelling the same three arms out in `vw` because a `sizes` attribute cannot say `100%`.
`COVERFLOW` gained `stageGutterMdPx: 48` and `stageGutterMdFromPx: 768` for that string alone, and
`app/globals.css`'s dead `--cf-card-w`/`--cf-card-h` — a third copy of the same wrong arithmetic that no
rule read — are gone rather than corrected.

```
width sweep         79 widths × 2 targets, 360-1920px step 20, worst off-centre 2.10px
PASS
```

Worst off-centre across the whole 360-1920 range: **25.60px → 2.10px**. The residue is the animation
landing a fraction either side of its own centred moment; it is present at 1440 too, where nothing changed.

---

## 2. Assertion 1 — the stage holds

**Break.** `app/globals.css`, `.coverflow-stage { position: sticky }` → `position: relative`.

```
- /@1440x900: assertion 1: the stage moved at 41 of 41 samples inside the pin (7705-8712px).
  Worst at scrollY=8688: its top edge was -769.4px from the viewport top against a header of
  107.0px — it is not sticking
- /@390x844: assertion 1: the stage moved at 37 of 37 samples inside the pin (9708-10627px).
  Worst at scrollY=10595: its top edge was -737.4px from the viewport top against a header of
  75.4px — it is not sticking
- assertion 7 · sweep: the stage did not hold at 360-1560px (8 of 8 samples). Worst: at 360px the
  stage's top edge was -128.4px from the viewport top against a header of 75.4px
```

**One thing changed in the rig because of this break.** The first run of it reported only *"the stage was
pinned at only 0 of 113 sampled positions — there is no pin to measure a carousel inside"*: an older guard
that bails before anything is measured. True, and two steps back from the sentence a reader needs.
Assertion 1 now runs **before** that guard, so the failure names the element, its measured top edge and the
header it should be sitting on. Both lines are emitted now, in that order.

**Restore.** `position: sticky`.

---

## 3. Assertion 2 — one card in charge, advancing

**Break.** `app/globals.css`, `.coverflow-card`: the `animation-range: cover var(--cf-from) cover
var(--cf-to)` line deleted, so every card shares the whole timeline.

```
- /@1440x900: assertion 2: at scrollY=8208 8 cards (0, 1, 2, 3, 4, 5, 6, 7) were within 8px of
  the stage's centre — they are sharing one animation window instead of each having its own
```

140 failures in all, including the precondition firing on every card (`animation-range-start: normal`),
assertion 3 (every flank at scale 0.9988, unveiled), assertion 4, assertion 5 and four sweep bands. The
prediction written into the rig's header before it was first run — *"at a centred moment EIGHT cards are
inside 8px"* — is exactly the count it reports.

**Restore.** The `animation-range` line.

---

## 4. Assertion 3, first break — the neighbour stops receding

**Break.** `lib/motion.ts`, `COVERFLOW.sideVeil: 0.4` → `0`.

```
- /@390x844: assertion 3: at card 2's centred moment (scrollY=9971) neighbour 1's
  `.coverflow-veil` is 0 — it must clear the absolute floor 0.05 AND reach 0.8 of the
  `--coverflow-side-veil` the page publishes (0). Both halves: matching the dial alone passes a
  build with the dial at zero
- assertion 7 · sweep: a neighbour was not veiled at 360-1560px (8 of 8 samples). Worst at 360px:
  flank veils 0, 0
```

**Read the parenthesis in that message: `the page publishes (0)`.** This is the break that justifies the
absolute floor sitting beside the relative one. The rig reads `--coverflow-side-veil` off the page, and a
check written only as "the flank's veil is within 20% of the dial" is satisfied *perfectly* by a build with
the dial at zero — 0 ≥ 0.8 × 0. The `VEIL_FLOOR` of 0.05 is the half that fires here; the relative half is
what would catch a veil that had drifted to some other number. Neither is redundant.

**Restore.** `sideVeil: 0.4`.

---

## 5. Assertion 3, second break — the recede moved back onto the card's opacity

The plan's correction C regression, and the one that looks identical to the eye. Two edits in
`app/globals.css`, together making one change a "simplifying" editor would make in one go:

**Break.** `@keyframes coverflow-veil` flattened to `opacity: 0` at every stop, and
`@keyframes coverflow-pass` given `opacity: calc(1 - var(--coverflow-side-veil))` at its 0/25/75/100 stops
and `opacity: 1` at 50%.

```
- /@1440x900: assertion 3: at scrollY=7704 cards 1 (0.6), 2 (0.6), 3 (0.6), 4 (0.6), 5 (0.6),
  6 (0.6) are not fully opaque — a card's type sits ON its own photograph, so the recede is scrim
  over the frame and never opacity on the card (correction C)
```

It fires at **every pinned sample**, not only at the centred moments, because "no card on this stage may
ever fade" is an invariant rather than a claim about one position. The traces show the interpolation in
flight — `cards 1 (0.865208), 2 (0.6), …` — which is what a reviewer needs to tell this apart from a card
that is simply hidden.

**Restore.** Both keyframe sets.

---

## 6. Assertion 4 — exactly one card's arrows answer

**Break.** `app/globals.css`, `.coverflow-arrows`'s three animation lines replaced by a static
`pointer-events: auto` — the "simplify the keyframes away" edit, which leaves every arrow on the stage
interactive.

```
- /@1440x900: assertion 4: at scrollY=7752 2 cards had their on-screen arrows hit-testable (0, 2)
  — exactly one must, or the visitor is clicking whichever of sixteen overlapping links paint
  order happened to put on top. Nearest card 0; arrows answered: 0[auto/ok auto/ok]
  1[auto/nav.coverflow-arrows.relative.mt-4 auto/outside the viewport] 2[auto/ok auto/outside the
  viewport] 3[auto/outside the viewport …] …
```

The `hit:` trace is the reason that field exists: card 1's own arrow reports
`nav.coverflow-arrows.relative.mt-4` answering in its place — a *different card's* nav lying over it. That
is the paint-order resolution the assertion is about, and it is invisible to the eye and to a screenshot.

**Restore.** The three animation lines.

---

## 7. Assertion 5 — the arrows loop

**Break.** `components/sections/CoverflowCard.tsx`, `coverflowNeighbours(index, count)` replaced by
`Math.max(0, index - 1)` / `Math.min(count - 1, index + 1)` — a clamp instead of a wrap.

```
- /@1440x900: assertion 5: clicking card 6's "next" (#field-days-card-5) left card 6 nearest the
  stage's centre, not card 1 — the loop the client asked for on 16 Aug 2026 ("after 6 the 1 card
  comes back or vice-versa") is not wired: either `coverflowNeighbours` is clamping instead of
  wrapping, or the target it names sits at the wrong scroll offset
- /@1440x900: assertion 5: clicking card 1's "previous" (#field-days-card-0) left card 1 nearest
  the stage's centre, not card 6 — …
```

Four failures, both directions at both shapes, and **nothing else in the rig fired** — the cleanest
single-assertion break in this file. The message prints the href it actually clicked
(`#field-days-card-5` where a wrap would say `#field-days-card-0`), so the two candidate causes it names
can be told apart without re-running anything.

**Restore.** `coverflowNeighbours`.

---

## 8. Assertion 6 — the crop bound

**Break.** `components/sections/CoverflowCard.tsx`, `CARD_BOX` 16/9 → 3/2 **and** the `<li>`'s
`aspect-[16/9]` → `aspect-[3/2]`. Both, because the rendered box is what crops — changing `CARD_BOX` alone
would move only the `sizes` arithmetic and this assertion measures the photograph against the box a browser
actually drew.

```
- /@1440x900: assertion 6: at card 0's centred moment card 1 (vann-safari-1163.avif) loses 34.6%
  of its own width to a 1.5 box against a 2.2922 photograph — the bound is 25%
- … card 2 (vann-bird-watching-1163.avif) loses 34.6% …
- … card 3 (vann-kohka-lake-1163.avif) loses 34.6% …
- … card 5 (vann-potters-village-1163.avif) loses 34.6% …
```

**34.6% is the number `CARD_BOX`'s own comment predicted** for a 3:2 box before any of this was measured.
Four of the eight cards fire: exactly the four 2.29:1 panoramas the comment names, and no others.

**Restore.** 16/9 in both places.

---

## 9. Assertion 8 — reduced motion

**Break.** `app/globals.css`, the `.coverflow-track { height: auto }` rule removed from the
`@media (prefers-reduced-motion: reduce)` block.

```
reduced motion      6/8 cards rendered, stage static, track 1800px vs stage 3198px, overlaps 0

- assertion 8 · reduced motion: the track is 1800px tall around a 3198px stage — it is still
  reserving the pin's scroll (two screens) for a list that does not move, which is exactly the
  paid-for empty scroll non-negotiable #9 forbids
```

1800px is `COVERFLOW.screens × 100svh` at 1440×900 with the header out — the pin's own reservation, held
open around a 3198px list that overflows it. The other four halves of this assertion (six cards not eight,
the stage not sticky, no card `position: absolute`, no overlaps) all still pass in the same run, which is
what makes this the *height* half failing and not the arm generally.

**Restore.** The rule.

---

## 10. Assertion 9 — no JavaScript

**Break.** `components/sections/Coverflow.tsx` made a client component whose stage renders only after
mount:

```tsx
"use client";
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
…
<div className="coverflow-track">{mounted && <ul className="coverflow-stage">…</ul>}</div>
```

```
- assertion 9 · no JavaScript: no `ul.coverflow-stage` inside #field-days with scripting disabled
  — the section's content depends on script
```

**One failure, and nothing else in the file fired** — with scripting on, the stage hydrates and every other
arm passes exactly as before. That is the point of the arm: this is the one break in the file that is
completely invisible to every other assertion, and it is the shape of a real regression (somebody reaches
for a hook and the section quietly stops being server-rendered).

**Restore.** The server component.

---

## 11. The precondition — `animation-range` falling back to `normal`

**Break.** `app/globals.css`, `--cf-from` renamed to `--cf-from-renamed` **at its declaration only**, so
the `animation-range: cover var(--cf-from) …` that reads it references an undeclared property.

```
- /@1440x900: card 0: the card computed `animation-range-start: normal` — the declaration was
  dropped (an undeclared custom property inside it is invalid at computed-value time), so it
  animates over the WHOLE timeline. Silent: it looks like a carousel running eight times too
  fast, not like an error (probe §7)
- /@1440x900: card 0: its `.coverflow-veil` computed `animation-range-start: normal` — …
- /@1440x900: card 0: its `nav.coverflow-arrows` computed `animation-range-start: normal` — …
```

Three elements per card, all eight cards, both shapes. Reading the range back on the **veil and the arrows
as well as the card** is this task's addition: they carry the same declaration and would fail the same way,
and a card whose arrows animate over the whole timeline while the card itself does not is a state nothing
else here distinguishes.

**Restore.** The declaration's name.

---

## 12. `animation-timeline` before the `animation` shorthand

Carried forward from Task 6 and **re-run**, because the rig's assertions and its wording have both changed
since that record was written (`app/globals.css` quoted "96 sampled positions", which was the older
rig's count).

**Break.** `app/globals.css`, `.coverflow-card`: `animation-timeline: --coverflow-track;` moved **above**
`animation: coverflow-pass linear both;`, where the shorthand resets it to `auto`.

```
112 failures:  assertion 4 × 75, assertion 2 × 16, assertion 6 × 12, assertion 5 × 4,
               assertion 7 × 3, assertion 3 × 2

- /@1440x900: assertion 2: the card in charge went 7 across the pin, not 0 -> 1 -> 2 -> 3 -> 4 ->
  5 -> 6 -> 7 — either a card never takes its turn, or the order reverses, or one card holds the
  whole pin
- /@1440x900: assertion 2: card 0's offset from the stage's centre never crossed zero anywhere in
  this chapter — it is never the centred card
- /@1440x900: assertion 4: at scrollY=7704 0 cards had their on-screen arrows hit-testable (none)
  … arrows answered: 0[auto/outside the viewport …] 1[none/outside the viewport …] …
  7[none/div.coverflow-track none/div.coverflow-track]
```

Nothing binds, every card sits at its 0% keyframe off-stage right, and the deck's last ghost — which holds
at centre by its own keyframes — is the only thing left near the middle. `app/globals.css`'s own comment
above those two lines now carries this count.

**Restore.** The shorthand first.

---

## 13. The negative control — a route with no coverflow

Not a break: `node scripts/check_coverflow.mjs --port 3110 --path /mahua-vann`. A production build of the
home page *before* this section existed cannot be made — `app/page.tsx`'s switch is exhaustive — so "no
coverflow anywhere" is demonstrated by pointing the rig at a route that has none.

```
- /mahua-vann@1440x900: no `.coverflow` wrapper with a `ul.coverflow-stage` inside #field-days
- /mahua-vann@390x844: no `.coverflow` wrapper with a `ul.coverflow-stage` inside #field-days
- assertion 7 · sweep: 8 of 8 samples could not be measured (no such scroll target) at 360-1560px
- assertion 8 · reduced motion: no `ul.coverflow-stage` inside #field-days
- assertion 9 · no JavaScript: no `ul.coverflow-stage` inside #field-days with scripting disabled
```

**This control found a bug in the rig itself.** The sweep's `band()` helper folded rows that could not be
measured at all into every band and then crashed formatting the message
(`TypeError: Cannot read properties of undefined (reading 'join')`) — the rig failing rather than the page,
on the one input it exists to survive. Unmeasurable rows are now reported once, as their own line, and
never reach a predicate.

---

## 14. The gates, on the restored build

| | |
|---|---|
| `npm test` | 479 passed, 43 files |
| `npm run lint` | 0 errors (5 pre-existing warnings — `lib/booking/asiatech-provider.ts`, `components/ui/SiteMenu.test.tsx`) |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `check_coverflow.mjs` | **pass** — 8 cards, order 0→7 at both shapes, worst centre 1.85px @1440 / 5.92px @390, 79 sweep widths, worst off-centre 2.10px |
| `check_films.mjs` | pass — including the white-ground-gone pixel assertion at six widths |
| `check_contrast_over_photos.mjs` `/` | pass, all six coverflow cards |
| `check_contrast_over_photos.mjs` `/mahua-vann`, `/mahua-tola` | pass |
| `check_image_resolution.mjs` | **0 under-served by `sizes`** at all five width/density arms |

### The scrims survived the width change, and 768 is where to look

Fix 1 changes the card's rendered width **only between 768px and 996px** — 390, 1440 and 1920 are
untouched, and 390 is the width that bound all six solved figures (`scrims.md` §1). 768 is one of the
contrast rig's four sampled widths, so it is the one that could have moved. It did, in both directions,
and every card still clears the floor with margin:

| card | 768 before | 768 after | 390 | 1440 |
|---|---|---|---|---|
| 01 Jungle safari | 6.08 | **6.27** | 5.03 | 6.02 |
| 02 Bird watching | 8.43 | **8.74** | 5.24 | 8.82 |
| 03 Kohka Lake | 7.57 | **7.39** | 4.91 | 7.70 |
| 04 The river walk | 8.56 | **9.08** | 5.45 | 8.78 |
| 05 Pachdhar | 7.16 | **6.50** | 5.18 | 7.94 |
| 06 Walks and cycling | 7.68 | **7.17** | 5.05 | 7.84 |

The floor is 4.5 everywhere. The worst move is card 05, 7.16 → 6.50, still 44% above the floor; the binding
figure for every card is still 390's, and 390 did not move. **No scrim needs re-solving.**

`check_contrast_over_photos.mjs`'s own non-fatal placement note — the one `scrims.md` §6 added to print the
off-centre displacement at every run rather than fix it — now reports **0**.

---
---

# 17 August 2026 — the client's four changes, and two more assertions

The rig went from nine assertions plus a precondition to **eleven**, and two of its own arms turned out to be
measuring less than they claimed. Same discipline as above: each break is the defect the assertion exists to
catch, the build was rebuilt and the server restarted between every one, and the width sweep ran at
`--sweep-step 400` except where it is the assertion under test.

Full working: [`geometry.md`](geometry.md).

---

## 15. Assertion 10 — a wrap-around ghost is never the centred card

**The defect the client reported**, restored in full: `--cf-step` back to `pin-len / (count + 1)`, the card
window back to four steps starting at `(i − 1)`, the anchor target back to `(i + 1) × step`, and the two
ghosts pointed back at `coverflow-pass-first` / `-last` — i.e. the build as it stood on 16 August.

```
/@1440x900         cards=8 pinned=44/113 held=44/44 order=1,2,3,4,5,6 worst-centre=2.38px

FAIL
  - /@1440x900: assertion 10: the wrap-around ghost at DOM index 0 came to 0.0px of the stage's
    centre at scrollY=6099 (34 of 113 samples inside 8px) — a ghost is a FLANK. Centred, it is the
    chapter opening on a copy of its own last activity, which is what the client reported on
    17 Aug 2026: "it started with 06-Walk and Cycling"
  - /@1440x900: assertion 10: the wrap-around ghost at DOM index 7 came to 0.0px … at scrollY=7923
    (38 of 113 samples inside 8px) …
  - /@390x844: assertion 10: … at scrollY=7714 (33 of 106) …
  - /@390x844: assertion 10: … at scrollY=9418 (35 of 106) …
  - /@1440x900: assertion 2: at scrollY=6891 2 cards (0, 1) were within 8px of the stage's centre
  - /@1440x900: assertion 3: at card 1's centred moment (scrollY=6891) neighbour 0 is drawn at
    scale 1 — a neighbour must be measurably behind (≤0.99) and still a card (≥0.5)
```

**34 of 113 samples with the leading ghost dead centre** is not a moment in passing; it is the hold, and it
is what a visitor arriving at the chapter met first. Both shapes, both ghosts.

## 16. The break that did *not* fire assertion 10, and what it proved

Run first, and worth keeping. Only `--cf-step`'s denominator was reverted (`count − 1` back to `count + 1`),
leaving the ghosts on their own flank keyframes:

```
FAIL
  - /@1440x900: assertion 3: at card 6's centred moment (scrollY=7899) neighbour 5 of the centred
    card 6 is off screen entirely (left -1229, right -231, viewport 1440) — the client asked for
    the neighbours to sit BEHIND the centre card, not to be gone
```

Assertion 10 stayed silent, correctly: with the ghosts still pinned to their flanks, no ghost reaches the
middle whatever the step is. What fired instead was assertion **3** — six activities squeezed into five of
seven steps leaves the last one with nothing beside it.

**The lesson is the one this file exists for.** The reported defect is *two* things — the step arithmetic and
the ghosts' schedule — and a break that undoes one of them proves nothing about the assertion aimed at the
pair. Had this run been accepted as "assertion 10 watched failing", the record would have been false and the
assertion untested. §15 is the honest version.

## 17. Assertion 11 — `scroll-snap-align` removed

The declaration deleted from `.coverflow-target`, everything else untouched:

```
/@1440x900   … settle=2/6 worst-settle=327.0px
/@390x844    … settle=2/6 worst-settle=85.5px

FAIL
  - /@1440x900: assertion 11: `.coverflow-target` declares `scroll-snap-align: none` — the six
    offsets a card is centred at are not snap positions
  - /@1440x900: assertion 11: a 200px flick left the page at scrollY=6919, inside the pin, with the
    nearest card (1) 100.7px off centre — the visitor is stranded between two cards …
  - /@1440x900: assertion 11: a 320px flick … card (3) 329.4px off centre …
  - /@1440x900: assertion 11: a 140px flick … card (3) 146.4px off centre …
  - /@1440x900: assertion 11: a 500px flick … card (5) 327.0px off centre …
  - /@390x844: … four more, 30.8 / 58.7 / 85.5 / 30.3px off centre
```

Four of six flicks stranded at 1440, the worst 327px — a quarter of a card's width between two of them. This
is the client's report reproduced: *"if scrolled fast it moves up or down the cards very easily."*

## 18. Assertion 11 again — the snap box taken back to zero

`scroll-snap-align: start` left in place, `.coverflow-target` returned to `width: 0; height: 0`. **This is
the one that looks correct in the stylesheet**, and it is why the box is asserted separately from the
alignment:

```
FAIL
  - /@1440x900: assertion 11: `.coverflow-target` is 0×0px — a ZERO-AREA snap area is not a snap
    area. Measured in Chromium 151 on a bare page: six zero-sized targets under `proximity` snapped
    nothing at all, and the same six at 1×1px snapped every scroll. This is the one that looks
    correct in the stylesheet
  - … and the same four stranded flicks per shape as §17, to the pixel
```

Identical behaviour to §17 from a stylesheet that still says `scroll-snap-align: start` on six elements at
the right offsets. The targets had been zero-sized since the day they were written, for no reason other than
that nothing had ever needed otherwise.

## 19. The negative control — the anchor target left on the old slope

`--cf-step`'s new denominator kept, and only `.coverflow-target { top }` reverted to `(i + 1) × step`. This
is Task 1 §11.5's negative control in its new form: every target one whole step out.

```
FAIL
  - /@1440x900: assertion 5: clicking card 6's "next" (#field-days-card-0) left card 2 nearest the
    stage's centre, not card 1 — the loop the client asked for … is not wired
  - /@390x844: assertion 5: … the same
  - assertion 7 · sweep: the scroll target landed on the wrong card at 360-1560px (8 of 8 samples).
    Worst at 360px: `#field-days-card-1` left card 3 nearest the centre, not card 2
  - assertion 7 · sweep: the centred card was not centred in its stage at 360-1560px (8 of 8).
    Worst 754.4px at 1560px …
  - assertion 7 · sweep: a neighbour was not veiled at 360-1560px … flank veils 0.4, 0.000128205
  - assertion 7 · sweep: a neighbour was not behind the centre card at 360-1560px … 0.82, 0.9999
```

**Every width, every target.** Note that the second message's own diagnosis is wrong for this break — it
blames the over-constrained margins, because that is the only cause it knows for a card off centre — while
the target band directly above it names the real one. Read them together; the "wrong card" band is the
diagnosis.

---

## 20. Two defects in this rig, found by the work that changed it

Neither would have failed anything. Both made a green run mean less than it says.

### 20.1 Snapping quantised the rig's own sweep — 43 sampled positions, 6 distinct rests

`.coverflow-target` became a snap area for assertion 11, and `scroll-snap-type: proximity` applies to
programmatic scrolls as well as to wheels. So `scrollToAndSettle` — this file's whole sampling method, a
position every 24px — was being pulled onto the nearest card's centred moment. Measured on the shipped build
at 1440×900 over the pin's own 1,007px:

| | positions asked for | distinct positions rested at |
|---|---|---|
| snapping on (as shipped) | 43 | **6** — 6892, 7093, 7295, 7496, 7698, 7899 |
| snapping suppressed | 43 | **42** |

Assertions 2, 3 and 4 would have been asked only at the six moments the carousel looks best — never between
two cards, which is where every defect this rig has ever caught lived. The run stayed green throughout, and
`pinned=64/113` against `43/113` is the only trace it left.

`setSnap` now suppresses snapping for assertions 1-7 and restores it for assertion 11, and `readSnap` reads
the declaration off the page **before** any of that, so the suppression can never be what makes assertion 11
pass. §18's break is the proof of that half working.

### 20.2 The bisection preferred a sample deeper into a hold than the pin's own edge

The last activity now centres at the exact offset the pin releases, and then holds there while the stage
rides out. The bisection kept the sample with the smallest `|offset|`, and measured at 1440×900 those are:

| scrollY | stage top | card 6's offset | pinned |
|---|---|---|---|
| 7890 | 107 | 34.16px | yes |
| **7899 — the release** | **107** | **0.44px** | **yes** |
| 7905 | 101.1 | **0.00px** | no |
| 7911 | 95.1 | 0.00px | no |

So it reported 7911, and the rig said *"card 6 reaches the centre at scrollY=7911, where the stage is NOT
pinned — the pin is too short for its own carousel"* about a page whose last card is centred, pinned, at the
offset the pin ends. A false failure, and the sort that gets "fixed" in the page. Both the bisection and the
no-crossing shortcut now prefer a pinned sample and fall back to distance.

An earlier version of the same shortcut had the opposite bug for the FIRST activity, which is held at centre
from before the pin engages: sorted on distance alone the tie was broken by sampling order, and it answered
with the earliest sample, before the lock.

---

## 21. The gates, on the restored build

| | |
|---|---|
| `npm test` | **477** passed, 43 files |
| `npm run lint` | 0 errors (5 pre-existing `lib/booking` warnings) |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `npm run verify:budget` | **168.2 KB brotli — delta 0** |
| `check_coverflow.mjs` | **pass** — order `1,2,3,4,5,6` at both shapes, worst centre 1.81px @1440 / 0.57px @390, 79 sweep widths at step 20 with worst off-centre 1.90px, settle 6/6 at both shapes |
| `check_films.mjs` | pass at six widths, 0/12 covered positions, corners within 0-3 levels of cream |
| `check_contrast_over_photos.mjs` | pass on all three routes; six card runs, worst 4.79 at 390 |
| `check_image_resolution.mjs` | **0 under-served** at all five arms |
| `check_card_stack.mjs` | pass — the site-wide snap declaration leaves the other pinned chapter alone |
| `check_plates.mjs` | pass — 0.00% worst distortion, three routes |
| `measure_density.mjs` | `field-days` **26.4% / 41.0%** — `passesWorst` **true**, 0 screens over budget |
