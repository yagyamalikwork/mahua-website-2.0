# The plate boards, rebuilt on a floor that cannot slip — 14 August 2026

Supersedes `docs/reviews/2026-08-13-image-sizing/README.md`'s own plate section (§1.2) the same day it was
written. The 13 Aug fix moved one breakpoint and shipped with a rig that tolerated an 85% shrink; the
client re-tested it on his own machine within a day and found the defect he had already reported once,
still there. This is the fix that replaced it, `commit d88c0e6`.

---

## 1. The client's re-test

His words, 14 Aug 2026:

> "The images on all three section i told you on homepage (03, 05 and 07) still shrink with the smaller
> screen size as well as i checked and tested it by just transforming the size of Google Chrome window on
> which the link is open reducing it rather than on a full screen mode, also shrink when zoom value reaches
> 150% and above when tested on the chrome browser. We need to fix this, as it will tamper with the
> viewers experience."

He added that everything else — the alternating room cards and the gallery, both shipped the same plan —
"looks and feels perfect, no changes there." The finding is scoped to the three `PlateGrid` boards alone.

## 2. Why the 13 Aug fix was inadequate

That fix moved the three-column tier's breakpoint from `lg` (1024px) to `xl` (1280px), on the theory that
the only defect worth acting on was a board holding too many columns too early. It never addressed the
thing the client actually complained about: **between whichever two breakpoints were in force, every plate
was still `N%` of the viewport, and so still shrank continuously as the window narrowed or the browser
zoomed.** A breakpoint move cannot fix a continuous defect — it only relocates where the discontinuity
sits.

The rig built alongside that fix then certified it anyway, because its own floor assertion carried an 85%
shrink tolerance (with a 65% exemption for a board already at its minimum column count) rather than a real
floor. Measured on that build, the Forest board across a continuous width sweep:

| viewport width | 1440 | 1366 | 1280 | 1200 | 1100 | 1024 | 960 | 900 | 700 |
|---|---|---|---|---|---|---|---|---|---|
| Forest plate width | 421px | 397px | 368px | 532px | 482px | 444px | 416px | 386px | 310px |

960px is 150% zoom on a 1440 screen — still shrinking. And read the 1280→1200 jump: the board holds three
columns from 1440 down to 1280px, and every plate in that band is **smaller** than at 1440 — the trough is
the three-column tier itself, not a gap between tiers. A rig that tolerates 85% cannot see either of these
as a failure; a client dragging his own browser's edge could not miss them.

Watched failing against that exact build, before anything was changed: **483 failures across the three
boards**, e.g. `forest: worstFloorRatio=0.8734 (368px vs 421.34px reference, at 1280x720)` —
`docs/reviews/2026-08-14-plate-reflow/plates-before.json`.

## 3. The rule that replaced it

**A plate may never render narrower than its own width at 1440×900. A board drops a column the moment
holding that count would take a plate below that reference, and at one column the plate fills the
container.**

No tolerance, no exemption for a board already at its minimum column count — the client's ruling covers
every board, at every width, unconditionally.

## 4. The fill-the-width ruling

Put to the client and answered the same day: when a board drops to one photograph per row, does the
photograph fill the container's width, or hold at its full-screen size with cream either side? He chose
**fill the width** — at a ~1000px window a Forest plate is now ~880px, more than double its full-screen
size, and the chapter runs taller.

The reason given, and accepted: holding the plate at its 1440 size inside a narrower one-column container
would leave roughly half the screen bare, which breaches non-negotiable #8's 45% empty-space ceiling. This
continues his 12 Aug ruling on the same board family — *"at deep zoom the plates keep full size and the
visitor scrolls more"* — extended from zoom to narrow windows generally: the plate never shrinks below
1440, but the page is free to grow taller and let a visitor scroll for it.

## 5. Implementation

`components/sections/PlateGrid.tsx`'s own module comment carries the full derivation; this is the shape of
it.

**A board lays out on `flex flex-wrap`, not CSS Grid.** Each plate gets `flex: 1 1 REFpx` — grow and shrink
from a solved `REFpx` basis. A line holds as many plates as fit at `REFpx` before the next would overflow;
within a line, `flex-grow` distributes leftover width evenly; a plate alone on its own line has nothing to
share the line with, so it receives the whole line's leftover width — literally "fills the container" for
the one-column case, extended to a lone trailing plate on a partial row too. `flex-shrink` combined with
`min-width: 0` is what lets a board collapse to one full-width plate once `REFpx` itself would exceed the
container.

**Two things here are load-bearing, not incidental:**

- **`REF` is rounded DOWN to a whole pixel** (420 / 650 / 316 for the three boards' three/two/four-column
  tiers). At exactly 1440px the column arithmetic for at least two of the three boards sits precisely on
  a whole number of columns (`3.0`, `2.0`, `4.0`) — a floating-point value used unrounded would tie the
  line-wrap boundary exactly at the client's own reference viewport, and a single hair of floating-point
  error either way could silently drop a board to fewer columns at the one width that matters most.
  `referenceWidth`'s own comment in `PlateGrid.tsx` works the arithmetic for all three boards.
- **CSS Grid `auto-fit` was built first, passed every rig, and was visibly wrong.** `grid-template-columns:
  repeat(auto-fit, minmax(min(REFpx, 100%), 1fr))` states the client's rule about as directly as CSS can,
  and it measured 0% distortion and the correct floor at every sampled width. It still shipped a bare cell
  of cream: a Grid track is shared across every row, so when a board's plate count is not a multiple of its
  current column count, the trailing plate lands alone in a new row inside a track sized like its
  neighbours — and every OTHER track in that row still exists, simply empty. Screenshotted at 1024px on
  both Forest (3 plates, 2 columns) and Details (4 plates, 3 columns) before switching away from it — found
  by opening the image, not by any assertion. Flexbox has no shared-track model: a wrapped line is sized
  independently of every other line, so a lone trailing plate is the only thing on its line and grows to
  fill it.

## 6. Measured after the fix

Plate width and column count, independently re-derived against the running production build (not quoted
from the commit's own evidence alone):

| window | Forest | Rooms | Details |
|---|---|---|---|
| 1440 | 421px, 3 | 652px, 2 | 318px, 4 |
| 1366 | 615px, 2 | 1270px, 1 | 407px, 3 |
| 1280 | 572px, 2 | 1184px, 1 | 379px, 3 |
| 1024 | 444px, 2 | 928px, 1 | 452px, 2 |
| 960 | 864px, 1 | 864px, 1 | 422px, 2 |
| 900 | 804px, 1 | 804px, 1 | 392px, 2 |
| 700 | 652px, 1 | 652px, 1 | 652px, 1 |

No plate is below its own 1440 width at any window ≥ 470px, with one geometric exception: the Rooms
board below a ~700px window, whose reference plate is 652px and simply cannot fit two-up in a viewport
that narrow. That is a physical limit of the rule as stated — a board at one column already fills the
container — not a defect.

## 7. The rig

`scripts/check_plates.mjs`'s floor assertion is rewritten to the real rule: the tolerance moved from 0.85
to **1.0**, and the 65% minimum-column-count exemption is removed outright — under the flex-wrap
construction a board that cannot hold a column at its 1440-reference width simply drops to fewer, wider
columns, so "already at minimum columns" is no longer a special case a board can hide behind.

Watched failing first, against the unmodified (13 Aug) build: **483 failures**, matching the client's own
reported numbers (§2). Passing against the fix:

```
node scripts/check_plates.mjs --port 3100
```

```
/              boards=forest,rooms,details samples=143 worstDistortion=0.25%
               forest:floor=1 rooms:floor=1 details:floor=1
/mahua-vann    boards=(none) samples=143 worstDistortion=0.00%
/mahua-tola    boards=(none) samples=143 worstDistortion=0.00%

PASS
```

`docs/reviews/2026-08-14-plate-reflow/plates-before.json` (483 failures, watched) and `plates-final.json`
(pass, `worstFloorRatio: 1` on all three boards) are both committed — the failing run first, on purpose,
per this project's own standing rule that a guard is not a guard until someone has watched it fail.

## 8. A new owed item for the client — the only thing outstanding

**Because a plate can now be drawn at up to ~864px instead of ~421px, it asks the source photograph for far
more detail than the 13 Aug build ever did.** At device pixel ratio 2 or above — a Retina Mac, an iPad, a
Windows laptop at 150% display scaling — the one-column state falls **22–46% short** of the pixels it
needs. The three Forest cats (`tiger-pair-profile`, `leopard-on-rock`, `melanistic-leopard`) are curated
into the manifest at **900px** wide; the four Rooms photographs top out at **1440px**. Neither library entry
was ever asked to fill a whole container's width before this fix — the Rooms board was two-column at every
width under the old construction, so it never drew a full-container box at all.

**Not caught by `check_image_resolution.mjs`.** That rig's own DPR sweep is 390@1x, 390@3x, 768@1x, 1440@1x
and 1920@1x — it never samples a wide viewport (900–1100px, where the one-column state actually renders) at
DPR above 1. Run against this build, on all three routes, at every viewport it does sweep, it reports **0
under-served images** — a true reading of a question it was never built to ask at this width. This is the
same shape of gap the project's own catalogue already names (§2 #8, #29, #45): a rig's fixed sample grid
missing the exact combination — wide viewport, high density — that the new behaviour introduces.

**The ask, for when the client is next in touch:** uncropped originals, roughly **1800px wide** for the
three Forest cats and **2600px wide** for the four Rooms photographs. Not fixed here — it needs source
material this session does not have — and recorded in `docs/DECISIONS.md` §5 and §19 so it is not lost.

## 9. Unchanged and verified

- **Density at the fixed 1440×900 measurement point is unchanged on all three routes**, and no chapter
  newly exceeds the 45% ceiling. Home: mean 37.9%, worst 73.3–73.4% (the pre-existing `field-days`/`rooms`
  join, unrelated to this fix). Vann: mean 35.3%, worst 87% (the pre-existing, already-open `vann-press`).
  Tola: mean 30.9%, worst 72.7% (the pre-existing, already-open `tola-reserve`). Figures identical, within
  rounding, to the last recorded ones — this fix only changes column count in the 1024–1279px band, and
  density is measured at a fixed 1440×900, exactly as predicted before the sweep was run.
  `density-home-final.json`, `density-vann.json`, `density-tola.json`.
- **Initial-load transfer is unchanged and under 1.5 MB at both widths.** Home 601/725 KB, Vann 425/663 KB,
  Tola 694/706 KB at 390/1440px — byte-identical to the 13 Aug figures within measurement noise.
  `transfer-home.json`, `transfer-vann.json`, `transfer-tola.json`.
- **467 tests, `tsc --noEmit`, `npm run lint` and `npm run build` all green.**
- `components/ui/Plate.tsx` and `components/ui/Photo.tsx` — the other session's files — untouched, per the
  standing constraint on this whole plan.

---

Raw evidence beside this file: `plates-before.json` (watched failing, 483 failures), `plates-final.json`
(the passing run quoted in §7), `density-home.json` / `density-home-final.json` / `density-vann.json` /
`density-tola.json`, `image-resolution-home-final.json` / `image-resolution-vann.json` /
`image-resolution-tola.json` (0 under-served, all three routes, every viewport/DPR combination),
`transfer-home.json` / `transfer-vann.json` / `transfer-tola.json`, `screens/` (Forest, Rooms and Details at
390×844, 768×1024, 900×900, 960×900, 1024×900, 1100×900, 1280×900, 1366×900, 1440×900 and 1920×1080).
