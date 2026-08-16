# Task 1 — what a view timeline actually does over a sticky stage

**Measured 16 Aug 2026, Chromium 151.0.7922.34** (Playwright 1.62's bundled build, headless), viewport
1440×900 unless a row says otherwise, `--header-height: 77px`, `scroll-padding-top: var(--header-height)`
on `<html>` exactly as `app/globals.css` line 105 sets it.

The probe was a standalone HTML file driven by a Playwright script, both throwaway per the plan and both
left in the session scratchpad rather than committed. Seven arms in one page, 1,094 samples at 40px of
scroll each, every arm read at every sample. The instrument for the shipped effect is `scripts/
check_coverflow.mjs` (Task 7); nothing here is meant to survive as a rig.

**The hypothesis survived, with two corrections and one of its stated reasons overturned.** The
construction is right. The stage's height is wrong. The anchor-target placement is wrong. And the reason
the plan gives for putting the timeline on the wrapper — that a sticky stage would freeze it — is *not*
what freezes; the real hazard is one word in `animation-range`, and it is a word the hypothesis already
avoids. §6 is the important read.

---

## 1. The arms

| Arm | Timeline declared on | `timeline-scope` | Stage height | `animation-range` phase |
|---|---|---|---|---|
| **A** | the tall, non-sticky wrapper | yes, same element | `100svh` | `cover` (hypothesis, verbatim) |
| **B** | **the sticky stage itself** — the control | no | `100svh` | `cover` |
| **C** | the tall, non-sticky wrapper | **no** | `100svh` | `cover` |
| **D** | the tall, non-sticky wrapper | no | `calc(100svh - var(--header-height))` | `cover` |
| **E** | the sticky stage, animating **itself** | no | `100svh` | `cover` |
| **F** | the sticky stage, animating **itself** | no | `100svh` | **`exit`** |
| **G** | the sticky stage, animating **itself** | no | `100svh` | **`contain`** |

Each arm: a wrapper `6 × 100svh` tall, a sticky stage at `top: var(--header-height)`, and (A–D) six
absolutely-positioned cards on `@keyframes pass` — `translateX(+360px)` → `0` → `translateX(−360px)` — so
a card's own `translateX` **is** its progress through its own window and a reading is unambiguous.

Every arm also carried a **gauge**: an element on `animation-range: cover 0% cover 100%` translating
0 → 700px, reading the raw timeline progress independently of any per-card range. Arm A carried a
**deliberately-broken card** whose range references an undeclared custom property.

Notation below: `T` the wrapper's document offset, `H` its height, `V` the viewport height, `P` the
scroll container's `scroll-padding-top`, `S` the stage's height, `n` the card count.

## 2. The prediction, written before the probe was run

Recorded in the scratchpad before the first run and reproduced here unedited in substance:

1. **Frozen timeline.** Every card's `getBoundingClientRect().x` and computed `translateX` identical at
   every sample taken while the stage is pinned; `max − min` ≈ 0px against ~720px if the timeline
   advances; the gauge freezes with them.
2. **`timeline-scope` shadowing its own declaration.** The name resolves to nothing, the animation never
   binds, every card sits permanently at `translateX(+360px)` / opacity 0.25 at *every* scroll position.
   Arm A fails, arm C passes.
3. **`calc()` dropped from `animation-range`.** Silent. `animationRangeStart` reads `normal` and the card
   tracks the gauge exactly — all six move together and cross centre at the same moment.
4. **`cover` read naively.** `cover 0%` is *not* the wrapper's top reaching the viewport's top; it is a
   full viewport height earlier. Predicted span `[T − V, T + H]`, so card *i* centres at `T + i·V` and the
   six centred moments sit exactly one viewport apart.
5. **The pinned window is narrower than `cover`.** Predicted pin `[T − P, T + H − V − P]`; card 5 centres
   at `T + 5V`, i.e. **77px after the pin has released**.
6. **The anchor targets.** Naive `top: calc(var(--i) * 100svh)` predicted to land 77px short on every card.

**Predictions 3 and 5 held. 1, 2, 4 and 6 were all wrong**, and each was wrong in a way that mattered.

## 3. (a) Does the timeline advance while the stage is stuck? — yes, and so does the control's

**It advances, linearly, in every arm.** The gauge's deviation from the straight line joining the pin's
two ends was **0.00px** in all seven arms, and the longest flat run was **0px of scroll**.

| Arm | Pin window (scrollY) | Gauge across the pin | Worst deviation from a straight line | Longest flat run |
|---|---|---|---|---|
| A | 960 → 5,400 | 96.7 → 596.2 of 700 | 0.00px | 0px |
| B (control) | 7,040 → 11,520 | 94.5 → 598.4 | 0.00px | 0px |
| C | 13,160 → 17,600 | 96.7 → 596.2 | 0.00px | 0px |
| D | 19,240 → 23,800 | 94.5 → 607.4 | 0.00px | 0px |

Each card's own `translateX` swept its **full 720px** while pinned (cards 1–4 in every arm; cards 0 and 5
sweep part of their arc outside the pin by design). Prediction 1's signature — every `x` identical inside
the pin — did not appear anywhere.

**The control did not freeze, and it did not merely fail to freeze: it produced numerically identical
results to the wrapper-declared arms.** Normalised to their own wrapper offsets, arms A, B and C put every
card's centred moment at the same six positions to the pixel: `T − 11, T + 878, T + 1767, T + 2656,
T + 3545, T + 4434`.

That is because Chrome computes a view timeline's range for a sticky subject **with the sticky offset
applied**: the stage's own 900px box would give a range of 1,723px, and arm B measured 6,223px — the
wrapper's. So the plan's stated reason for declaring the timeline on the wrapper ("the stage is sticky, it
would freeze") is not what this probe found.

**Ship the wrapper construction anyway** (arm D, below), for two reasons that are measured rather than
assumed. First, the wrapper's range is geometry the CSS states outright — `--coverflow-screens` *is* the
wrapper's height — whereas the control's identical range is an emergent product of the sticky containing
block, and re-deriving it means re-deriving sticky. Second, §6: the freeze is real, it is a property of the
range phase, and arms E–G show the sticky subject's timeline is exactly where that hazard lives.

**`timeline-scope` on the declaring element is a no-op here, not a shadow.** Arm A (with) and arm C
(without) agreed on every one of the ~1,100 samples. It is unnecessary — the cards are descendants of the
wrapper, and a named timeline is already referenceable by the declaring element's descendants. **Task 6
should drop it**, on the grounds that a line doing nothing invites a later reader to conclude it does
something.

## 4. (b) The `animation-range` expression — the plan's is correct; `cover` is not what it looks like

The plan's expression is right as written:

```css
--step: calc(100% / (var(--n) + 1));
animation-range: cover calc(var(--i) * var(--step))
                 cover calc((var(--i) + 2) * var(--step));
```

Card *i* is centred at `(i + 1) · step`. Adjacent windows overlap by exactly one step, which is what makes
one card leave as the next arrives — read off the trace at 1440×900, arm A, relative to `T`:

| scrollY (rel `T`) | pinned | card 0 | card 1 | card 2 | card 3 | card 4 | card 5 |
|---|---|---|---|---|---|---|---|
| −40 | yes | **11.7** | 360 | 360 | 360 | 360 | 360 |
| 80 | yes | −36.9 | 323.1 | 360 | 360 | 360 | 360 |
| 920 | yes | −360 | **−17.0** | 343.0 | 360 | 360 | 360 |
| 1,760 | yes | −360 | −357.2 | **2.8** | 360 | 360 | 360 |
| 2,720 | yes | −360 | −360 | −360 | **−25.9** | 334.1 | 360 |
| 3,560 | yes | −360 | −360 | −360 | −360 | **−6.1** | 353.9 |
| 4,400 | yes | −360 | −360 | −360 | −360 | −346.2 | **13.8** |

**What `cover` actually spans.** Not `[T − V, T + H]`. Measured, on all seven arms:

> **`cover` runs from `scrollY = T − V` to `scrollY = T + H − P`.**

The `− P` is the correction, and it is the one nobody would derive on paper: **a view timeline is measured
against the scrollport inset by `scroll-padding`**, so `scroll-padding-top: var(--header-height)` — added
to `globals.css` for anchor links, and having nothing to do with animation — shortens the timeline by 77px
at its far end. Evidence (predicted vs measured, the sample grid is 40px):

| Arm | `T` | cover start pred / meas | cover end pred / meas |
|---|---|---|---|
| B | 7,100 | 6,200 / 6,200 | 12,423 / 12,440 |
| D | 19,300 | 18,400 / 18,400 | 24,623 / 24,640 |
| G | 37,600 | 36,700 / 36,680 | 42,923 / 42,920 |

So the step in **scroll pixels** is `(H + V − P) / (n + 1)` = 6,223 / 7 = **889.0px**, not one viewport.
Every gap between consecutive centred moments, in every arm, measured **889px** — five gaps, seven arms,
no exceptions. Prediction 4 said 900. The 11px difference is `P / (n + 1)`, and §5 is what it costs.

**One coupling to carry into Task 5.** For the outer cards to reach centre while the stage is still pinned,
`--coverflow-screens ≥ n · (1 − P/V)`; at `n = 6`, `P = 77`, `V = 900` that is **5.49, so 6**. Setting
screens equal to the card count satisfies it at every viewport (`P ≤ V` always), and with no JavaScript —
where `--header-height` is unset and `P = 0` — it becomes exactly `screens ≥ n`. **Fewer screens than
cards pushes the first and last card's centred moment outside the pin.** Derived from the two formulas
above, both of which were measured; the failing case was not separately observed.

## 5. The stage's height is wrong in the hypothesis

The pin window measured `[T − P, T + H − P − S]`. With the hypothesis's `height: 100svh`:

| | Arm A (`S = 100svh` = 900) | Arm D (`S = calc(100svh − var(--header-height))` = 823) |
|---|---|---|
| Pin engages | `T − 77` | `T − 77` |
| Pin releases | `T + 4,423` | `T + 4,500` |
| Card 0 centres | `T − 11` — 66px **after** engage ✓ | `T − 11` — 66px after engage ✓ |
| Card 5 centres | `T + 4,434` — **11px AFTER release** ✗ | `T + 4,434` — 66px **before** release ✓ |

Arm A's card 5 reaches centre with the stage already sliding upward. 11px is small, and it is also
avoidable for free and gets worse as the header grows. Use arm D's height. It also makes the two ends
symmetric at 66px, which is `V − P − (V − P·n/(n+1))` falling out of the same arithmetic rather than being
tuned.

## 6. Where the freeze really is — and `.room-stack`'s comment is right

Arms E, F and G are the same construction: a sticky stage declaring a named timeline on itself and
animating its **own** opacity 1 → 0.2 off it. The *only* difference between them is the range phase.

| Arm | `animation-range` | Stage opacity across its pin | Longest flat run | After release |
|---|---|---|---|---|
| **E** | `cover 0% cover 100%` | **0.884 → 0.319**, continuous | 0px | keeps moving: 0.293, 0.267 |
| **F** | `exit 0% exit 100%` | **1.000 → 1.000** | **4,480px** | 1.000 → 0.806 → 0.611 |
| **G** | `contain 0% contain 100%` | **1.000 → 1.000** | **4,440px** | **1.000 → 0.200 in one 200px step** |

All three read the same gauge, on the same timeline, from the same source element, and in all three the
gauge advanced linearly with zero deviation. **The freeze is not a property of the sticky subject. It is a
property of the range phase.** `cover`'s two offsets are computed off the sticky-adjusted box; `exit` and
`contain` are computed off boundaries the stuck box never crosses, so progress sits at 0 for the whole pin
and completes — arm G, in a single sample — the instant the element unsticks.

That is exactly the symptom `app/globals.css` records above `.room-stack`: *"its own exit-phase progress
does not advance — opacity stays 1.00 at 50% covered and even at FULLY covered — and only 'catches up' in
one jump once the whole deck unsticks."* **That comment is correct and this probe reproduces it.** It is
`exit`/`contain` that froze, not sticky as such. Nothing here licenses simplifying `.room-slot` away —
`RoomCard` needs a phase that tracks a card being *covered*, which is what `.room-slot` supplies from a
non-sticky box.

For the coverflow the consequence is one line long: **the range must stay on `cover`.** An "optimisation"
to `contain` or `exit` — both of which read like the more precise choice for a subject taller than the
viewport — freezes the whole carousel for its entire pin and dumps it in one frame at the end.

## 7. (c) `calc()` in `animation-range` — accepted, resolved, and the silent failure is real

Chrome resolved every one. Read back from `getComputedStyle` on arm A:

| Card | `animation-range-start` | `animation-range-end` |
|---|---|---|
| 0 | `cover` | `cover 28.5714%` |
| 1 | `cover 14.2857%` | `cover 42.8571%` |
| 2 | `cover 28.5714%` | `cover 57.1429%` |
| 3 | `cover 42.8571%` | `cover 71.4286%` |
| 4 | `cover 57.1429%` | `cover 85.7143%` |
| 5 | `cover 71.4286%` | `cover` |
| **broken** | **`normal`** | **`normal`** |

`cover 0%` serialises as `cover` and `cover 100%` as `cover`; both are the resolved value, not a dropped
one — the distinction from a dropped declaration is `normal`, which is what the deliberately-broken card
read.

**The broken card is why this question was worth a measurement.** Its range referenced an undeclared
`--nope`, making the declaration invalid at computed-value time; the property fell back to `normal`,
i.e. the full timeline. It then **crossed centre at `T + 2,212`**, which is the midpoint of `cover` to the
pixel (predicted 2,212), instead of at its own window's centre, `T + 1,767`. **445px out, with nothing on
screen saying so** — a card that arrives at the wrong moment, on a page where every other card is right.
Any rig Task 7 writes must read `animationRangeStart` back and fail on `normal`.

## 8. (d) Where the anchor target must sit — the naive placement has a *slope*

Targets placed the obvious way, `top: calc(var(--i) * 100svh)` inside the wrapper, then clicked:

| Target | Target's doc top | Landed `scrollY` | Card *i* centres at | Error |
|---|---|---|---|---|
| `#t-a-0` | 1,000 | 923 | 989 | **−66** |
| `#t-a-1` | 1,900 | 1,823 | 1,878 | **−55** |
| `#t-a-2` | 2,800 | 2,723 | 2,767 | **−44** |
| `#t-a-3` | 3,700 | 3,623 | 3,656 | **−33** |
| `#t-a-4` | 4,600 | 4,523 | 4,545 | **−22** |
| `#t-a-5` | 5,500 | 5,423 | 5,434 | **−11** |

The error is not a constant 77px as predicted — it is **−66 + 11·i, a slope of 11px per card**, because two
different things are wrong at once: `scroll-padding-top` shifts the landing by −77px, and the step between
centred moments is 889px rather than the 900px the naive placement assumes. **No single nudge fixes it**,
which is what makes deriving it on paper dangerous: a fix tuned on card 3 looks perfect and is 33px out at
both ends.

Placing the targets from the timeline's own arithmetic instead landed **exactly**, `translateX` 0.00px on
every card, and held across viewports and card/screen ratios:

| Shape | Worst absolute `translateX` of the intended card |
|---|---|
| 1440×900, screens 6 | **0.00px** |
| 1440×760, screens 6 | **0.00px** |
| 1280×1024, screens 6 | **0.00px** |
| 390×844, screens 6 | **0.00px** |
| 1440×900, screens 8 | 0.14px |
| 1440×900, screens 4 | 0.25px |

The sub-pixel residue in the last two is scroll-offset rounding, not the formula.

**The block in §9 was then re-run in the exact form it is written there** — the two custom properties
declared on the wrapper and inherited by the targets, rather than declared on the targets as the probe
first had them, because moving a declaration is precisely the "obviously equivalent" edit this project
keeps catching. `--coverflow-step-px` reached the target intact
(`calc(calc(6 * 100svh + 100svh - 77px) / (6 + 1))`) and every card landed at **0.00px** at 1440×900,
1440×760, 1280×1024, 1920×1080 and 390×844. Watched against a negative control in the same run: restoring
`top: calc(var(--i) * 100svh)` put the six cards at 26.73, 22.27, 17.82, 13.36, 8.91 and 4.45px off
centre — the −66 + 11·i slope again, seen from the other side.

## 9. The exact CSS that worked — Task 6 can lift this

```css
/*
 * The coverflow. Three facts hold this together and each is measured, not
 * derived — `docs/reviews/2026-08-16-coverflow/task-1-timeline-probe.md`:
 *
 *  1. `cover` runs from `T - 100svh` to `T + wrapper-height - scroll-padding-top`.
 *     The scroll container's `scroll-padding-top` — set in `globals.css` for
 *     ANCHOR LINKS, nothing to do with animation — shortens the timeline by its
 *     own height. One step is therefore 889px at 1440x900, not 900px.
 *  2. The range must stay on `cover`. `exit` and `contain` are computed off
 *     boundaries a stuck box never crosses and freeze SOLID for the whole pin
 *     (measured: 4,480px and 4,440px of flat), then complete in one frame. That
 *     is the rooms card stack's own defect, and this is where it lives.
 *  3. The stage clears the header out of its OWN height. At a flat `100svh` the
 *     last card reaches centre 11px AFTER the pin has released.
 */
.coverflow {
  /* Tall, NOT sticky. It carries the scroll and declares the timeline. */
  position: relative;                       /* the arrows' targets sit inside it */
  height: calc(var(--coverflow-screens) * 100svh);
  view-timeline-name: --coverflow-track;
  view-timeline-axis: block;
  /* No `timeline-scope`: the cards are descendants, so the name already
     reaches them. Measured identical with and without, over 1,100 samples. */

  --coverflow-step: calc(100% / (var(--coverflow-count) + 1));
  --coverflow-track-px: calc(
    var(--coverflow-screens) * 100svh + 100svh - var(--header-height, 0px)
  );
  --coverflow-step-px: calc(var(--coverflow-track-px) / (var(--coverflow-count) + 1));
}

.coverflow-stage {
  position: sticky;
  top: var(--header-height, 0px);
  height: calc(100svh - var(--header-height, 0px));
}

.coverflow-card {
  animation: coverflow-pass linear both;
  animation-timeline: --coverflow-track;
  animation-range: cover calc(var(--i) * var(--coverflow-step))
                   cover calc((var(--i) + 2) * var(--coverflow-step));
  /* Centred at exactly `(i + 1) * step`, i.e. the 50% keyframe. */
}

/* An arrow's target. Zero-size, absolutely positioned in the wrapper. */
.coverflow-target {
  position: absolute;
  left: 0;
  width: 0;
  height: 0;
  top: calc(
    var(--header-height, 0px) - 100svh + (var(--i) + 1) * var(--coverflow-step-px)
  );
}
```

`--coverflow-screens` must equal `--coverflow-count` (§4). `--i` is set per element; `--coverflow-count`
and `--coverflow-screens` on the wrapper, and both inherit to the targets and the cards.

## 10. What this probe did not settle

- **Lenis.** The page under test had no smooth-scrolling library. The real page runs Lenis, which
  intercepts wheel input and is capable of intercepting in-page anchor navigation. Whether an
  `<a href="#…">` click still lands on the exact offset measured here — and whether the timeline reads a
  settled position rather than an interpolating one — is untested. `check_card_stack.mjs`'s
  `scrollToAndSettle` exists for exactly this and Task 7's rig will need the same.
- **Real content.** The cards were 320×220 solid boxes. Nothing here says what happens with a photograph, a
  scrim, a `<picture>` with `sizes`, or text that reflows.
- **`prefers-reduced-motion` and the no-`@supports` fallback.** Not probed at all; both are Task 6's.
- **Arrows inside the sticky stage.** The probe's links sat in a fixed bar so Playwright could always reach
  them. The mechanism (an in-page hash link) is identical, but a link inside the sticky, transformed stage
  was not clicked.
- **Chromium only.** Safari and Firefox were not run. Both now support scroll-driven animations, and
  neither `cover`'s `scroll-padding` inset nor the `exit`/`contain` freeze can be assumed to match.
- **`screens < count`.** §4's bound says the outer cards would centre outside the pin; that failure was
  derived from two measured formulas, not watched.
- **Why the `exit`/`contain` freeze happens.** §6 measures it precisely and reproduces the card stack's
  symptom. It does not establish whether this is Chrome's intended reading of the specification.
