# The mobile LCP failure — diagnosis, fix, and what is still owed

Task 8 left one open defect: **Lighthouse mobile 85, LCP 4.1 s against a 2.5 s budget**, resolving to the
hero sub-paragraph rather than the photograph. This folder is the evidence for what that number actually
was, what was done about it, and what remains.

## The diagnosis, in one line

**Nothing was blocking the paragraph.** It paints at ~1.4 s in a real throttled Chrome and never moves
again. Lighthouse's 4.1 s is a *simulated* figure whose pessimistic half charges the LCP metric for every
byte requested before the first paint — so it was reading, in effect, as "the first fold costs 597 KiB",
and the real defect standing behind it was that **the first screen was not finished until 3.0 s on
Lighthouse's own emulated phone and 4.8 s on a DPR-3 handset**.

## Before and after

Both states built and measured in the same session on the same machine. `before` is `aee6dcf`.

### What the visitor waits for — real throttling, not simulation

Slow 4G (1.6 Mbps / 150 ms RTT / 4x CPU). "Visually complete" is the first screencast frame after which
under 1% of the first screen's pixels change again.

| | first fold | of which images | hero file | hero arrives | **first screen complete** |
|---|---|---|---|---|---|
| DPR 1 · 390px | 432 → 435 KB | 84 → 84 KB | 400w, 21 KB | 910 → 904 ms | 1,750 → 1,707 ms |
| DPR 1.75 · 412px | 570 → **534 KB** | 223 → **183 KB** | 960w → **768w** | 2,963 → **2,038 ms** | 3,009 → **2,067 ms** |
| DPR 3 · 390px | 942 → **601 KB** | 595 → **251 KB** | 1440w → **960w** | 4,715 → **2,961 ms** | 4,761 → **3,064 ms** |

DPR 3 is the row that matters: most of this site's traffic is Indian mobile, and that is the density those
handsets run at. The hero halved and arrived 1.75 s sooner; the first screen finishes 1.7 s sooner.

DPR 1 pays 3 KB more HTML for the longer `sizes` strings and is otherwise unchanged — its timings move by
about 100 ms run to run either way, which is the noise floor of this measurement, not a result.

### Lighthouse

Five mobile runs and three desktop runs per state. **One Lighthouse run is not a measurement** — see below.

| | mobile score | **mobile LCP** | desktop score | desktop LCP | transfer |
|---|---|---|---|---|---|
| before | 83 (82–95) | **4,210 ms** (2,562–4,449) | 99 | 992 ms | 597 KiB |
| after | **92** (83–96) | **3,196 ms** (2,462–4,140) | 99 | **968 ms** | **536 KiB** |

Medians, with the range of runs in brackets. The LCP element is unchanged: the hero sub-paragraph on
mobile, the hero headline on desktop.

**The 2.5 s budget is still not met on mobile.** It is met in the best runs and missed in the median.

### The variance, which changes how every number here should be read

Five consecutive Lighthouse runs against one unchanged build, downloading a byte-identical 536 KiB every
time, returned simulated LCPs of **2,462 / 2,872 / 3,196 / 4,063 / 4,140 ms** — scores of 96, 92, 92, 85
and 83.

The cause is structural, not incidental. Lighthouse loads the page unthrottled on the host machine and then
replays the request graph over a modelled link; the LCP metric's pessimistic half includes every request
that started before the *observed* paint, and that observed paint moves with how busy the machine is. A
slower host pulls more requests inside the cutoff and inflates the simulated LCP.

So the 4.1 s in the Task 8 report was one draw from a distribution spanning 2.6–4.4 s, and any single run
quoted in future — better or worse — is too.

## What was changed

1. **A density cap at 2x** (`lib/sizes.ts`). Screens denser than 2.5x are now served roughly 2 device
   pixels per CSS pixel instead of their own ratio, expressed as `(min-resolution: …)` entries at the front
   of every `sizes` list. **This is the one change with a visual cost** — see the trade below. It halves
   first-fold image bytes at DPR 3 and changes nothing at or below 2x, which is every desktop and
   Lighthouse's own emulation.
2. **Two more responsive tiers, 768 and 1200.** Pure fit, no cost: a 412px phone at DPR 1.75 asks for 721px
   and was rounding up to the 960 file, 98 KB where 768 covers the same pixels in 63.
3. **The hero is preloaded from `<head>`** via `react-dom`'s `preload`, so it is dispatched ahead of seven
   script chunks instead of alongside them. It was getting roughly a sixth of the pipe.
4. **`favicon.ico` 25,931 → 1,659 bytes** by dropping its 256px layer. The three layers a browser tab
   actually uses are byte-identical to before. It was a 26 KB High-priority request.

## The trade the client has to decide

**On a DPR-3 phone, photographs are now drawn at 1.9–2.25 device pixels per CSS pixel instead of 3.0.**
(`image-resolution.json`, `deviceDensity` at `390x844@3x`.) Nothing below 2.5x is affected at all.

What it buys, on that same phone: the first screen finishes at 3.1 s instead of 4.8 s, and scrolling the
whole page costs 1.7 MB instead of 3.3 MB.

This is CLAUDE.md non-negotiable #6 applied as written — budgets beat effects. It is reversible in one
line (`DENSITY_CAP` in `lib/sizes.ts`); if the client would rather have the sharpness, the 4.8 s comes back
with it.

## What is still owed, and what each option costs

The remaining first fold on Lighthouse's mobile profile is **536 KiB**: 196 KiB JavaScript, 183 KiB
photographs, 110 KiB fonts, 37 KiB HTML, 8 KiB CSS. Closing the last ~700 ms means taking roughly another
90–100 KiB out of it. There are two candidates and neither is free:

| Option | Saves | Cost |
|---|---|---|
| Defer GSAP + Lenis until after first paint | ~49 KiB | The reveal components are fail-safe (content is visible in the server-rendered HTML and script only animates it), so nothing breaks — but an element on screen when GSAP arrives late would fade in late, which is the visible-flicker failure this project has already shipped once. Needs its own measurement pass. |
| Self-host the three fonts, subsetted and instanced to the weights in use | ~43 KiB | Five committed font files and a build step. The glyph set becomes a thing that can go stale when the client rewrites copy — containable with a test that checks every character in `content/` against the subset, but it is a new trap to maintain. |
| Neither | — | Mobile LCP stays at a ~3.2 s median. |

One thing that will *not* fix it on its own: production hosting. `next start` speaks HTTP/1.1 and no CDN
will, so the protocol was tested as a control — see `http2-control.json`. The result is inconclusive for
CDN purposes but rules out assuming the gap closes by itself.

## The files

| | |
|---|---|
| `lighthouse-runs.json` | All sixteen Lighthouse runs, per-run and summarised |
| `lighthouse-{mobile,desktop}-{before,after}.report.html` | The median run of each set |
| `first-fold.json` | Real-throttling first-fold measurements at DPR 1 / 1.75 / 3, before and after |
| `verification-dpr{1,3}.json` | `scripts/measure_page.mjs`, the standing whole-page rig |
| `image-resolution.json` | Every photograph's served resolution, and what the cap costs it |
| `contrast-over-photos.json` | 36/36 passing — the served tiers changed, so this was re-run |
| `menu-and-layout.json` | Scroll lock and horizontal-overflow, unchanged |
| `http2-control.json` | The protocol control, and why it does not answer what it looks like it answers |
