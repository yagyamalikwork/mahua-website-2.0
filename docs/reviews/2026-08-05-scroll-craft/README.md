# Plan 4, the scroll craft — what was built, and the proof — 5 August 2026

Everything on this page is measured against a production build (`npm run build`, then `npx next start`),
on a fresh server whose build id was checked against the one just compiled. **No figure here is an
estimate.** Every one can be re-derived with a command named beside it.

Two conventions, both learned the hard way on this project:

- **Medians of five, never a single run.** This page's arrival time has ranged 2,462–4,140 ms on a
  byte-identical build. One run is an anecdote.
- **A still frame proves nothing about an animation.** Every motion claim below is shown as a *filmstrip*
  with the measured position printed under each frame. A dead animation produces a strip of identical
  pictures carrying identical numbers.

---

## 1. The five things the client asked for on 5 August

| Asked for | Delivered | How you can check it yourself |
|---|---|---|
| **The header stays at the top** | `position: fixed`, `top: 0`, at all five widths | `header-320-scrolled.webp` … `header-1920-scrolled.webp` — the bar is at the top of every one, with the page scrolled well past the hero |
| **Scrolled, the wordmark turns the logo's own brown** | `#7F5C24`, the colour sampled from the client's vector | `wordmark-scrolled-1440.webp` is a crop of the actual type. Its darkest drawn pixel is **`#7F5C24`** — an exact match, not a near one |
| **The reference's scrolling feel** | A fixed bar that gains a cream background rather than inverting its type, plus a slow rise on everything entering | `header-*-top.webp` vs `header-*-scrolled.webp`, and the filmstrips below |
| **The slight, smooth rise on text and cards** | A **16 px** rise at **0.994** scale over 0.9 s, with headlines arriving a line at a time | `entrance-forest-1440.webp`, `entrance-rooms-1440.webp`, `entrance-guests-1440.webp`, `entrance-forest-390.webp` |
| **The emblem turns once on load, then stops** | One half-turn over 2.4 s, `animation-iteration-count: 1` | `emblem-turn-1440.webp` |

Plus the **pinned collage** the client chose from their own analysis of the reference —
`collage-drift-filmstrip-1440.webp`.

### The rise, caught in the act

`entrance-forest-1440.webp` is eight frames of one chapter arriving. Reading down it, the headline lands a
line at a time and the photographs wipe in from behind a mask:

| Frame | Headline lines | Block opacity |
|---|---|---|
| 70 ms | pushed 106% below their own line | 0.08 |
| 175 ms | 63% below | 0.50 |
| 293 ms | 30% below — "Three hundred" has landed, the rest has not | 0.78 |
| 458 ms | 8% below | 0.95 |
| 703 ms | 1% below | 0.996 |
| settled | in place | 1 |

The block itself starts at `matrix(0.994, 0, 0, 0.994, 0, 16)` — **16 px low and a whisper small** — and
finishes at `none`. That is the same idiom as the reference site, whose own live elements were measured at
14.1 px and 17.9 px with a scale of 1.0013 (`docs/reviews/2026-08-05-sujan-scroll/`).

**Why this is not a still frame dressed up as motion:** across the four captures the browser reported
**44 to 62 distinct intermediate positions** for the headline lines and **39 to 55 distinct opacities**.
A disabled animation reports one of each.

### The per-line stagger is real, and it is per *line*

Words that share a visual line share a delay; each new line steps by 90 ms:

| Chapter | Measured delays, word by word |
|---|---|
| `forest` | `0s 0s 0.09s 0.09s 0.09s 0.09s 0.18s 0.18s 0.18s` |
| `why-you-came` | `0s ×6, 0.09s ×5, 0.18s` |
| `rooms` | `0s 0s 0s 0.09s 0.09s 0.09s` |

### The emblem turns once and then is still

292 samples over six seconds: **130 distinct positions while it is turning**, sweeping the full circle, and
then — after three seconds — **exactly one position, for ever**. `animation-iteration-count` is `1`. It is
not a permanent piece of motion, which is what CLAUDE.md's non-negotiable #5 requires.

---

## 2. The question the client is owed a straight answer to

Mobile arrival has been over budget all through this plan. Two levers were costed on 4 August: **defer the
animation library** (this plan spent it) and **self-host subsetted fonts** (still unspent). The client is
owed a measurement of which one actually mattered, not an argument.

So it was measured, four ways, on the same production build, medians of five, on a simulated Slow 4G phone
(1.6 Mbps, 150 ms latency, 4× slower processor) at 390×844 and device pixel ratio 3:

| | Chrome's LCP | The hero photograph's own arrival | JavaScript before scrolling |
|---|---|---|---|
| **As shipped** (GSAP deferred) | **1,488 ms** | **3,922 ms** | 154.1 KB |
| **GSAP put back in the critical path** — this plan undone | **1,488 ms** | 4,135 ms | 196.6 KB |
| Font preload dropped, fonts still loaded | 1,356 ms | 3,750 ms | 154.1 KB |
| Fonts blocked entirely — *upper bound on any font work* | 1,452 ms | 3,357 ms | 154.1 KB |

### The straight answer: **neither. They are the same size, and neither one moves LCP at all.**

**Deferring GSAP moved Chrome's LCP by exactly 0 ms** — 1,488 ms both ways, to the millisecond. It bought
the hero photograph **213 ms**.

**The fonts are not the hidden villain either.** Removing every font byte — which no real fix can do —
buys the hero 565 ms. The lever actually on the table is *subsetting*, costed on 4 August at ~43 KB of the
110 KB the page loads. The 565 ms tracks the bandwidth arithmetic almost exactly (110 KB at 200 KB/s is
550 ms), so subsetting should recover about **215 ms** — the same order as the GSAP deferral, not a
multiple of it.

**Why nothing moves LCP.** In all 30 mobile runs LCP landed on the same **paragraph** — *"Two family-run
lodges at the gates of Pench and Tadoba."* On desktop it landed on the `<h1>`, *"The wild and the calm,
held together"*. **Never once on a photograph**, and in all 35 runs **LCP equalled first contentful paint
exactly**. Text paints in the fallback serif the moment the HTML and CSS arrive; it never waited for the
fonts, and Next.js's scripts are deferred so it never waited for the JavaScript either. **This is why the
standing instruction not to judge this page by Lighthouse's LCP is correct**, and this is the sharpest
evidence for it yet collected: an entire tween library can be moved in or out of the critical path and the
headline metric does not twitch.

### What would actually move the hero

The hero is 192 KB. Before it can finish, the phone has also pulled ~154 KB of JavaScript, 110 KB of fonts
and the document itself — roughly 460 KB in total, and a 1.6 Mbps link carries about 200 KB per second.
**The hero is bandwidth-bound, not library-bound.** Getting it under 2,500 ms means sending materially
fewer bytes ahead of it, or a smaller hero. Both font levers and the GSAP lever are ~200 ms each; the
budget needs roughly 1,400 ms.

**The counterfactual is trustworthy.** Rebuilt with GSAP static, first-load JavaScript came to
**753.2 KB raw / 233.2 KB gzipped** against the pre-plan record of 750.6 / 232.2 — and its hero at device
pixel ratio 1 landed at **3,629 ms** against the 3,616 ms recorded in CLAUDE.md before the plan. Two
independent figures reproduced within 0.4%, so the "before" arm really is the before state.

---

## 3. What the plan claimed, and what it cost

**The plan's headline claim was that the reference's scroll behaviour could be had without putting a tween
library in the critical path.** That claim holds.

| | Before Plan 4 | Now | Change |
|---|---|---|---|
| First-load JavaScript, raw | 750.6 KB | **642.7 KB** | −107.9 KB (−14.4%) |
| First-load JavaScript, gzipped | 232.2 KB | **190.7 KB** | −41.5 KB (−17.9%) |
| Initial transfer, 390 px | 613 KB | **574 KB** | −39 KB |
| Initial transfer, 1440 px | 730 KB | **698 KB** | −32 KB |

GSAP still ships — it drives the scrubbed work the reference itself uses GSAP for — but in two lazy chunks
(42.4 KB + 69.0 KB raw) that a browser **does not fetch until the visitor scrolls**. Proven by outcome, not
by reading the source: an untouched load pulls 7 JavaScript files and 154 KB; after one scroll it is 9 files
and 198 KB, and the two extra files are named in `js-budget-task6.json`.

### Density: the pin's cost, paid and accounted for

| | Before the pin | Now | Rule |
|---|---|---|---|
| Page mean empty space | 39.0% | **39.3%** | ≤ 45% |
| Photographs per screen | 2.08 | **1.98** | more is better |
| Screens of scroll | 16.3 | 17.2 | — |
| Chapters over budget | 0 of 12 | **0 of 12** | all must pass |

**All twelve chapters sit inside the 45% rule**, worst chapter `field-days` at 41.4% mean. The pin costs
0.9 screens of extra scroll and 0.10 photographs per screen — the trade the client accepted on 5 August
when they chose to shorten it from three screens to two.

---

## 4. Every check, and what it says

Run against one production build on a freshly started server, build id confirmed.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | **219 passed**, 11 files |
| `npm run build` · `npm run lint` | clean |
| `check_header.mjs` | **PASS** — 0 failures across 320/390/768/1440/1920; 60 of 60 frames clean on a mid-page reload |
| `check_entrances.mjs` | **PASS** — 69/69 staged and settled at 1440 and 390, 0 left staged, 0 left invisible; **parallax 12/12 moved** |
| `check_menu.mjs` | **PASS** — scroll locked while open, released after, at both widths and under reduced motion |
| `check_pinned_collage.mjs` | **PASS** — headline held within **0 px** over 840 px of scroll; photographs drifted 126/89/50 px |
| `check_contrast_over_photos.mjs` | **PASS** — **52 runs, 0 failures, 0 not-found**; worst 3.16 against a floor of 3, worst body text 4.67 against 4.5 |
| `check_image_resolution.mjs` | **PASS** — 0 photographs under-served by `sizes` at all five viewport/density pairs |
| `measure_density.mjs` | **PASS** — 12 of 12 chapters inside 45% |
| `npm run verify:budget` | **PASS** — 642.7 KB raw / 190.7 KB gz, 154 KB untouched against a 175 KB budget |

### Reduced motion and no JavaScript

Both must leave the whole page readable, with nothing staged, nothing hidden and nothing pinned.

| | Chapters | Words | Staged | Invisible | Masks covering a photograph | Pinned scene |
|---|---|---|---|---|---|---|
| Reduced motion, 390 | 12 | 1,104 | 0 | 0 | **0** | none |
| Reduced motion, 1440 | 12 | 1,104 | 0 | 0 | **0** | none |
| No JavaScript, 390 | 12 | 1,104 | 0 | 0 | **0** | none |
| No JavaScript, 1440 | 12 | 1,104 | 0 | 0 | **0** | none |
| **Control** — ordinary page, motion on | — | — | 29 pending | — | **29** | — |

**The control row is the point.** A count that reads zero everywhere proves nothing, so the same check was
pointed at an ordinary page with motion on, where photographs below the fold genuinely *are* covered: it
reports 29. The zeroes above are therefore real. (This check had the polarity backwards on its first run —
the mask's resting state is collapsed, so "collapsed" was being counted as a fault. See the report.)

With no JavaScript the header is `absolute` rather than `fixed`, deliberately: a bar that cannot be told
when the photograph beneath it has scrolled away would end up cream-on-cream. It stays with the hero it is
legible over. At scroll 0 the two paint identically.

Pictures: `reduced-390-*.webp`, `reduced-1440-*.webp`, `nojs-390-*.webp`, `nojs-1440-*.webp`.

### No horizontal scrolling

Measured at every scroll position down the page:

| 320 | 390 | 768 | 1440 | 1920 |
|---|---|---|---|---|
| none | none | none | none | none |

---

## 5. Known, accepted, and owed

Recorded so nothing here reads as a surprise later.

1. **The hero photograph is over its 2,500 ms budget and is knowingly so** — 3,419 ms at device pixel
   ratio 1, 3,922 ms at ratio 3. It is the price of the sharp hero the client chose on 4 August; reverting
   costs one line and brings the blur back.
2. **Desktop whole-page scroll exceeds 1.5 MB** (2,320 KB at 1440 px). Accepted: the client ruled on
   4 August that the budget means the initial load, which passes at 574 KB and 698 KB.
3. **Six source photographs top out at 541–1000 px** and cannot fill a high-density phone. A shot-list
   item for the client, not a code defect.
4. **`invitation[0]`'s parallax is sampled over 24% of its scrub**, because the document ends before its
   range does. It still moves 42 px, far above the floor, and the clamp can only under-report movement,
   never invent it.
5. **The pinned collage adds no new photograph.** It spends 0.9 screens of scroll to hold three pictures
   still. The reviewer's judgement stands: worth keeping at two screens as the page's one moment of
   stillness, but the version that fully answers the client's brief is more photographs cycling through it,
   which needs frames the library may not have.

## 6. Regenerating any of this

```bash
npm run build && npx next start -p 3210      # then, against that server:

node scripts/check_header.mjs            --port 3210
node scripts/check_entrances.mjs         --port 3210     # ~3 minutes
node scripts/check_menu.mjs              --port 3210
node scripts/check_pinned_collage.mjs    --port 3210
node scripts/check_contrast_over_photos.mjs --port 3210
node scripts/check_image_resolution.mjs  --port 3210
node scripts/measure_density.mjs         --port 3210     # ~10 minutes
node scripts/measure_page.mjs            --port 3210 --dpr 3
node scripts/capture_motion_filmstrips.mjs --port 3210

# the arrival measurement and the two levers, medians of five
node scripts/measure_lcp_arms.mjs --port 3210 --arm baseline        --runs 5 --dpr 3
node scripts/measure_lcp_arms.mjs --port 3210 --arm no-fonts        --runs 5 --dpr 3
node scripts/measure_lcp_arms.mjs --port 3210 --arm no-font-preload --runs 5 --dpr 3

npm run verify:budget                                     # builds and serves its own copy
```
