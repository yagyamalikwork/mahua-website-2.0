# `04 · Days in the Field` as a coverflow — evidence

**16-17 August 2026.** Client request: *"looks flat even though it has beautiful images."*

Six activity cards on a pinned stage, advancing on the visitor's own scroll, the neighbours behind and to
either side, looping. **Zero added JavaScript.** The narrative and every expensive finding is
[`docs/DECISIONS.md` §20](../../DECISIONS.md); this file is the evidence and the open items.

| | |
|---|---|
| Design | [`specs/2026-08-16-field-days-coverflow-design.md`](../../superpowers/specs/2026-08-16-field-days-coverflow-design.md) |
| Plan (with its running corrections) | [`plans/2026-08-16-field-days-coverflow.md`](../../superpowers/plans/2026-08-16-field-days-coverflow.md) |
| The timeline probe | [`task-1-timeline-probe.md`](task-1-timeline-probe.md) — §11 supersedes §9 |
| The card-size sweep | [`density-sweep.md`](density-sweep.md) |
| Flank ghosts and the tiger | [`flanks-and-tiger.md`](flanks-and-tiger.md) — §1's shipped row and §5 are superseded by its §9 |
| The six scrims | [`scrims.md`](scrims.md) |
| The rig's nine watched failures | [`rig-failures.md`](rig-failures.md) |

## 1. Gates, on the shipped build

| | |
|---|---|
| `npm test` | **481** passed |
| `npm run build` / `npx tsc --noEmit` / `npm run lint` | clean (5 pre-existing booking-provider warnings) |
| `npm run verify:budget` | **168.2 KB brotli — JS delta 0** |
| `node scripts/check_coverflow.mjs` | pass — nine assertions, 158-sample continuous sweep |
| `node scripts/check_films.mjs` | pass at **six** widths, white-ground asserted as pixels |
| `node scripts/check_contrast_over_photos.mjs` | pass on all three routes, including six new card runs |
| `node scripts/check_image_resolution.mjs` | **0 under-served** |
| `node scripts/measure_density.mjs` | see §2 |

## 2. Density

| | mean | worst | `passesWorst` | page mean | page worst |
|---|---|---|---|---|---|
| the three bands this replaced | 43.9% | 57.9% | no | — | 64.6% |
| **shipped, 18 Aug** | **27.0%** | **31.1%** | **yes** | **34.6%** | 64.5% |

**It passes — four points clear of the ceiling, zero screens over budget.**

**And it could not, at any card size, twenty-four hours earlier.** What changed was the photographs, not the
code: the client supplied all six at 1344 × 685, which moved the resolution ceiling from a 903px card to a
1217px one. The card sweep on the new files reads 900 / 1000 / 1100 / 1217 → **55.0 / 51.2 / 46.5 / 41.0%**
worst. `DECISIONS.md` §20.6 has the arithmetic.

**Two figures that are NOT this work's** and must not be reported as fixed: `rooms` (44.8 → 39.6) and
`guests` (45.9 → 40.7) crossed under the ceiling because `field-days` lost 56px and shifted the page against
the 150px sample grid. Neither chapter was touched. `lodges` at 48.6% is the one still over.

The full seven-row history of how it got here, and the four things that moved it, are `DECISIONS.md` §20.4.
**Every intermediate figure in that table is stale**; quote only the shipped row.

## 3. What the visitor gets

- Six cards, one per activity, each a photograph carrying its own words over a solved wash, at
  **1217 × 685** — the size of the property pages' room cards, which is what the client asked for.
- **It opens on card 01 and closes on card 06.** Until 17 Aug the leading ghost had its own centred moment
  and the carousel appeared to start on activity 06; the ghosts are now held at the flanks and never reach
  the middle.
- **The scroll settles on a card.** A fast flick still travels several, but the page comes to rest with one
  centred rather than stranded between two — measured at 0px from a card on seven of eight flicks, against
  19-549px unsnapped. `proximity`, not `mandatory`, so nobody is ever trapped.
- **The loop is visible in the scroll**, not only in the arrows: `aria-hidden` ghosts of the last and first
  activity sit at the pin's two ends, so scrolling in shows the last card give way to the first and
  scrolling out shows the first return. A card and its own ghost are never on stage together.
- Arrows on the centred card only, wrapping both ways, as ordinary `<a href="#…">` links.
- **No autoplay.** Offered and declined once its conflict with non-negotiable #5 was named.
- Reduced motion and a browser without scroll-driven animations both get a plain, readable vertical list —
  the effect is written as an opt-in *over* a working layout, not as a layer that has to be undone.

## 4. Open — and one of them is the client's

1. ~~Higher-resolution originals~~ — **DELIVERED 17 Aug** and this is why the chapter passes. See
   [`docs/OWED-ORIGINALS.md`](../../OWED-ORIGINALS.md), where group 1 is now closed. The DPR-2 half remains:
   1344px serves a 1344px card at 1.00 on an ordinary screen and 0.50 on a Retina one.
2. **`vann-potters-village` still wants a different photograph, not a wider file.** The 17 Aug re-crop moved
   the glaze highlights without removing them — **1.03:1 unwashed**, against 1.00 before — so it still
   carries one of the heaviest washes on the page, buying legibility with the photograph's own light.
3. **The tiger now opens the chapter rather than closing it.** Non-negotiable #5 is a rule about behaviour
   (arrive, perform once, doze, replay on hover), all of which is intact, but the position changed and the
   client has not ruled on it. The alternative measured 77.1% page-worst.
4. **The card's composition at 390px is what forced the heavy scrims**, not the photographs — the words are
   58% of the card's height there against 27% at 1440. A phone-specific pass would let every wash lighten.
   Deferred under the 12 Aug desktop-lens ruling.
5. **`lib/coverflow.ts`'s `coverflowWindow` is imported by nothing but its own test.** Task 1 §11 superseded
   the percentage-of-`cover` scheme it returns. Left in place deliberately, so its removal is a decision
   taken on its own rather than folded into a retirement that already touched five files.

## 5. Method notes worth carrying to the next plan

- **Task 1 was a browser probe with a deliberate control arm, before any component existed.** The control
  was built expecting it to fail; it passed, and that is what located the real cause of a defect this
  project had already paid for once (§20.1). A probe that can only confirm is not worth running.
- **Nine of the corrections in §20.8 were defects in the plan, not the code**, and every one was found by
  the person executing it. Two implementers declined to build something they had measured to be wrong
  rather than following the instruction — that is the behaviour to keep.
- **Two defects again lived between 390 / 768 / 1440 / 1920** (§20.7), bringing the running total to five.
  `check_coverflow.mjs`'s assertion 7 is now a genuine continuous sweep, and it is what found the second.
  The hand probe that preceded it reported the off-centre band as 768-948px; the sweep found 768-**996**.
