# The plates that squeezed — 12 August 2026

Client report: *"images wrap or squeeze when the site is opened on a different screen that is smaller,
like a laptop or a tablet (not talking about a mobile) or even when I zoom in… Major effect I saw was on
images on 03-The Forest, 05-The Rooms and 07-The Details, on the homepage. Rest of the pages were fine."*

His manual check was exactly right, including the part that looked like luck: **those three chapters are
the only three that use `PlateGrid`.** Nothing else on the site renders a `Plate`.

---

## What was wrong

Two defects, stacked. Either alone would have been survivable; together they made a photograph look broken.

### 1. The trigger fired far too widely

`app/globals.css` defined `short:` as `(max-height: 800px)` — written for a **landscape phone** — and
`ui/Plate.tsx` used it to cap a plate at `max-h-[24vh]`. A height-only query fires on a 1366×768 laptop, a
1024×768 tablet, and any browser zoomed past about 110%, because zooming shrinks the CSS viewport.

It is a one-pixel cliff. Measured on the home page, first plate of each chapter:

| viewport | forest | rooms | details |
|---|---|---|---|
| 1440 × **801** | 701 × 686 | 704 × 415 | 343 × 550 |
| 1440 × **800** | 701 × **356** | 704 × **207** | 343 × **207** |

### 2. The cap squashed instead of scaling

The class list read `h-auto w-full … short:w-auto`. On a short viewport **both width rules applied**, and
which one won was decided by the order Tailwind happened to emit its variants in. `w-full` won, so the
height was clamped while the width was not, and the photograph was stretched rather than resized:

| viewport | forest | rooms | details |
|---|---|---|---|
| 1366 × 768 laptop | **+223%** | +122% | +144% |
| 1024 × 768 tablet | +130% | +60% | **+268%** |
| 1440 × 801 (control) | 0% | 0% | 0% |

Stretch is the rendered aspect against the photograph's own, so +223% means the image is drawn more than
three times as wide as it is tall relative to its true shape. **This is the same defect as the 128px
lantern** (`docs/DECISIONS.md` §2): two rules matching one element, resolved by framework emission order.

---

## The fix

**A new variant pair, `pocket:` / `roomy:`, keyed to the viewport's *shape* rather than its height** —
and every state now names its own width, so no emission order can squash anything.

```css
@custom-variant pocket (@media (max-height: 800px) and (min-aspect-ratio: 2/1));
@custom-variant roomy { @media (min-height: 801px) { @slot; } @media (max-aspect-ratio: 1999/1000) { @slot; } }
```

**Aspect, not width, and that is the whole trick.** A landscape phone is 844×390 or 932×430 — about
2.16:1. A 150% zoom on a 1440×900 screen is 960×600, which is 1.60:1 and only ~30px narrower than that
phone. A width threshold would have to thread a gap too small to be safe. Aspect separates them with room:

| viewport | ratio | mode |
|---|---|---|
| 844×390, 932×430 landscape phone | 2.16, 2.17 | `pocket` |
| 1440×800 | 1.80 | `roomy` |
| 1366×768 laptop | 1.78 | `roomy` |
| 960×600 (150% zoom) | 1.60 | `roomy` |
| 1024×768 tablet | 1.33 | `roomy` |

`short:` / `tall:` are **deliberately left alone.** They do a second, legitimate job — compacting type and
padding in `Hero`, `FullBleedQuote` and `Invitation` — which is right on a 768px laptop and which the
client confirmed looks fine. Only the plate's *geometry* moved to the new pair.

**Client ruling, 12 Aug:** at deep zoom the plates keep full size and the visitor scrolls more, rather than
shrinking to fit the window. *"Zoomed in, but photos got smaller"* is the wrong direction.

---

## Evidence

`node` sweep against `npm run dev`, measuring each plate's rendered aspect against its `naturalWidth /
naturalHeight`. Distortion after the fix, at every case tested:

| viewport | forest | rooms | details | mode |
|---|---|---|---|---|
| 1920×1080 | 0% | 0% | framed | roomy |
| 1512×945 MacBook 14 | 0% | 0% | framed | roomy |
| 1440×900 | 0% | 0% | framed | roomy |
| 1440×801 | 0% | 0% | framed | roomy |
| **1440×800** (was the cliff) | **0%** | **0%** | framed | roomy |
| **1366×768** laptop | **0%** | **0%** | framed | roomy |
| 1280×720 laptop | 0% | 0% | framed | roomy |
| **1024×768** tablet | **0%** | **0%** | framed | roomy |
| 1180×820 iPad Air | 0% | 0% | framed | roomy |
| 1152×720 (125% zoom) | 0% | 0% | framed | roomy |
| **960×600** (150% zoom) | **0%** | **0%** | framed | roomy |
| 844×390 landscape phone | 0% | 0% | 0% | **pocket** |
| 932×430 landscape phone | 0% | 0% | 0% | **pocket** |

*framed* means every plate in that grid is `object-fit: cover` inside the shared box `plateFrame` imposes —
a deliberate crop, not a stretch, and the reason `details` reports it above 800px.

The cliff is gone: 1440×801 and 1440×800 now render identically (1440×804 / 652×367 / 318×509).

Screenshots at the two worst cases: `rooms-1366x768.png`, `details-1024x768.png`, plus `forest-*` and a
1440×900 control.

**419 tests, `tsc --noEmit` and `lint` all green.**

---

## What this cost, and the lesson

**It was found by a human opening the site on his own laptop.** No rig caught it, and no rig could have:
every instrument on this project measures 390, 768, 1440 and 1920, and **768 is a viewport *width* here,
never a height**. There was no case in the suite with a short viewport and a normal width — which is to say
no case resembling an ordinary laptop.

That is the third time in two days that a defect has lived in the gap between fixed sample points, after
the card stack's 51%-crop at 1024×1366. The pattern is not "we picked the wrong widths"; it is that **a
grid of fixed shapes is not coverage, and a suite of green rigs can be silent about the most common screen
a visitor owns.**

One thing did go right, and it is worth keeping: the invalid `@custom-variant` shorthand
`(@media A, B)` failed the build outright rather than emitting a subtly wrong selector. Loud is the good
kind of wrong.
