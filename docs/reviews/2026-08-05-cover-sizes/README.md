# The photographs were being served at a quarter of the size they were drawn at

**5 August 2026.** Fixed. What it cost is measured below, and one part of it needs your decision.

---

## What was wrong, in one sentence

Every photograph on this page is cropped to fill its slot. A wide photograph in a tall slot is enlarged
until its *height* fills the slot, and the sides are cut off — so the picture is drawn much wider than the
space it appears to occupy, and the browser has to have all of that width. We had been telling the browser
the width of the **slot**, not of the **picture**.

On a 390 × 844 phone:

| | slot | actually drawn | file we sent | sharpness we had |
|---|---|---|---|---|
| the hero (arrival) | 390 px | **1,266 px** | 400 px | 0.32× |
| the tiger (*why you came*) | 390 px | **1,617 px** | 400 px | 0.25× |
| the lodge at night | 390 px | 1,613 px | 400 px | 0.25× |
| the close (*invitation*) | 390 px | 1,616 px | 400 px | 0.25× |

A quarter of the resolution the picture is drawn at is not a rounding error. It is a smear.

## What it looked like

`before/` and `after/` in this folder, shot on the production build at 390 × 844, same crop, same moment.

|  | hero detail | tiger's face |
|---|---|---|
| **before** | `before/hero-reception-path-screen.png` | `before/tiger-face-screen.png` |
| **after** | `after/hero-reception-path-screen.png` | `after/tiger-face-screen.png` |
| detail retained (variance of the Laplacian — higher is sharper) | 73.7 → **776.3**, ×10.5 | 35.1 → **68.1**, ×1.94 |

In the before shots the tiger has no whiskers and no edges to its stripes, and the lamps along the reception
path have no filament. In the after shots both do. The measurement is
`scripts/measure_sharpness.mjs`; the before/after ratio is the only form in which that number means
anything, and it is the same crop of the same photograph in both.

---

## The decision you are owed: the hero costs 1.9 seconds

The three photographs below the fold were free to fix — they arrive while you are still reading the first
screen. **The hero is not free**, because it is the thing the visitor sits and waits for, and mobile LCP was
already failing its 2.5 s budget before this.

Every candidate tier, measured on the production build, Slow 4G (1.6 Mbps / 150 ms / 4× CPU), 390 × 844:

| hero file | sharpness | hero weight | first fold | first screen finished |
|---|---|---|---|---|
| 400 px *(what shipped)* | 73.7 | 21–65 KB | 534 KB | **2,081 ms** |
| 640 px | 168.3 | 49 KB | — | — |
| 960 px | 385.9 | 98 KB | 608 KB | 3,129 ms |
| 1200 px | 577.8 | 142 KB | 651 KB | 3,818 ms |
| **1440 px — chosen** | **776.3** | 192 KB | 701 KB | **3,944 ms** |

**Why 1440 and not 1200.** The sharpness curve has not flattened by 1440 — it is still climbing steeply,
because the picture is drawn 1,266 px wide and 1,440 is the largest file we hold. And the cost is not evenly
spread: getting from 960 to 1200 costs **690 ms**; getting from 1200 to 1440 costs **126 ms** and buys
another 35% of detail. Once you have decided to pay to get past 960, the sharpest tier available is nearly
free. Stopping at 1200 would be paying almost all of the price for most of the picture.

**What it costs, measured in the same session on the same machine** (medians; single runs on this page are
not evidence — see the Task 8 note):

| | before (`c524bc6`) | after | change |
|---|---|---|---|
| first screen finished, DPR 1.75 | 2,081 ms | 3,944 ms | **+1,863 ms** |
| first screen finished, DPR 3 (a real Indian handset) | 3,036 ms | 4,164 ms | **+1,128 ms** |
| hero arrives, DPR 1.75 | 65 KB @ 2,041 ms | 192 KB @ 3,840 ms | +127 KB |
| hero arrives, DPR 3 | 98 KB @ 2,976 ms | 192 KB @ 4,016 ms | +94 KB |
| first-fold transfer, DPR 1.75 | 534 KB | 701 KB | +167 KB |
| Lighthouse mobile LCP (median of 5) | 4,057 ms | 4,812 ms | +755 ms |
| Lighthouse mobile score | 85 | 79 | −6 |

Only 127 KB of the 167 KB is the hero. The rest is the tiger in *why you came* — a full screen below the
fold, but Chrome fetches it during the first load anyway on a slow connection, and correcting its size took
it from 17 KB to 47 KB.

**The 2.5 s LCP budget was already failing and now fails by more.** It has never been met on mobile; the
Task 8 follow-up got it to 3.2 s and said plainly it was not closed. This moves it further out.

**The recommendation is to keep the sharp hero.** A blurred hero is a permanent brand failure on the first
screen of the site; 1.9 s is a one-time cost on a first visit, on a slow connection, and it is recoverable
by other means that do not cost picture quality — the two levers costed at the end of
`docs/reviews/2026-08-04-task-8-lcp/README.md` (deferring the animation libraries, ~49 KiB, and self-hosting
subsetted fonts, ~43 KiB) are still untouched, and fonts alone are 110 KiB of the first fold. But it is your
call, and reverting is one line: `HERO_BOX` in `components/sections/Hero.tsx`.

---

## The check that was supposed to catch this measured the same wrong thing

`scripts/check_image_resolution.mjs` was written for exactly this class of bug and had been reporting
**0 photographs under-served at all five viewport sizes** since it was built. It compared the file against
the **slot**, so it agreed with the mistake it was checking. Its own header argued at length that one
tempting measurement was an artefact — correctly — and then substituted a different artefact.

It now computes the drawn width from `object-fit` and the photograph's own shape. **It was run against the
broken build first and confirmed to fail** — 42 photographs flagged across five viewports, naming the hero
at 0.31 and the tiger at 0.25, reproducing the reviewer's independently measured figures. Only then was it
trusted to pass. That is the standard `scripts/check_menu.mjs` set on this project, and this finding exists
because a rig was once trusted without it.

Every artefact it had produced (`docs/reviews/2026-08-03-chapters/`, `2026-08-04-task-7/`,
`2026-08-04-task-8-lcp/`) has been regenerated.

## And the shot list understated what a paid shoot needs

`docs/shot-list.md` inherited the same arithmetic, so the brief for a photography shoot was asking for about
a third of what the site needs — in your disfavour. Corrected: the three full-screen frames need ~3,200 px
(4,800 px to satisfy a dense handset outright), not ~1,100; the hero needs ~2,500 px, not 1,920; and the
minimum for anything meant to run full-screen is raised from 2,400 px to 3,500 px.

---

## What was run

```bash
npx next start -p 3100
node scripts/check_image_resolution.mjs --out docs/reviews/2026-08-03-chapters/image-resolution.json
node scripts/measure_sharpness.mjs --out docs/reviews/2026-08-05-cover-sizes/after
node scripts/measure_sharpness.mjs --compare .../before .../after
node scripts/measure_first_fold.mjs --dpr 1.75 --width 390 --height 844   # x3, median
node scripts/measure_first_fold.mjs --dpr 3    --width 390 --height 844   # x3, median
node scripts/lighthouse_summary.mjs --form-factor mobile --runs 5 --out .../lighthouse-mobile
node scripts/check_contrast_over_photos.mjs --out .../contrast-over-photos.json
node scripts/check_menu.mjs --out .../menu-and-layout.json
```

| File | What |
|---|---|
| `before/`, `after/` | Screenshots and detail crops at 390 × 844, with the sharpness figure |
| `contrast-over-photos.json` | 36/36 passing, worst 3.16 — unchanged by the sharper photographs |
| `menu-and-layout.json` | Scroll lock still holds at 390 and 1440, with and without reduced motion |
| `measurements.json` | Every number above: five Lighthouse runs before and after, three first-fold runs at each DPR, the hero tier sweep and its sharpness curve. Run 3 of the "after" Lighthouse set crashed on a Windows temp-directory permission error and is excluded from the median; the raw reports are not committed, following the `2026-08-04-task-8-lcp` convention |
