# The four complaints, measured — 4 August 2026

The client rejected the previous build in four phrases: **too few images, no scroll animation, too much
empty space, no resemblance to the reference site.** This folder answers each one with a measurement rather
than an assurance. Everything here was produced against the **production build** (`npm run build` →
`npx next start -p 3100`) at commit `a5a00fd`, and every number can be re-derived with one command.

Where a number is uncomfortable it is here anyway. Two of the four answers are qualified, one budget fails,
and the empty-space rule in `CLAUDE.md` turns out to be a rule the reference site itself would fail.

> **Resolved 5 Aug 2026 — the rule moved, the page did not.** Shown these figures, the client set the
> threshold at the midpoint between their original 30% and the reference's 58.1%: **non-negotiable #8 is
> now 45%.** The page's 42.9% mean already sits inside it. Everything below still reads against the old
> 30% figure — that is the record of how the decision was reached, and is left as it was written. What
> changed as a result: **three chapters are still over and are owed work** — `field-days` 51.1%,
> `details` 58%, `lantern-hour` 46.7% — instead of the eight that failed at 30%.

---

## The short answers

| Complaint | Verdict | The number |
|---|---|---|
| Too few images | **Answered, with a caveat** | 32 distinct photographs, 2.0 per screen — against a target of 20 and 2.0. But the page is **16.0 screens** where the reference is 8.3. |
| No scroll animation | **Answered** | Mask coverage caught at 1.00 → 0.55 → 0 on three chapters, with 3–9 headline lines displaced mid-flight; 27–38% of the viewport's pixels change in a 420 ms window. |
| Too much empty space | **Answered on the comparison, not on the rule** | The average screen is 42.9% empty. **The reference site is 58.1%.** 8 of 12 chapters exceed `CLAUDE.md`'s 30% rule — and so do 38 of the reference's 45 screens. |
| No resemblance to the reference | **6 of 6 major moves present**, 2 adapted, 2 absent by choice | See the move-by-move below. |

And one thing nobody asked for that matters more than three of the above: **the performance budget fails on
a real phone.** Lighthouse mobile puts LCP at 4.1 s against a 2.5 s budget, and the hero photograph itself
takes 4.7 s at device pixel ratio 3. Every previously committed figure was measured at DPR 1, which is not a
device anyone owns.

---

## 1. Too few images

`density.json` — `node scripts/measure_density.mjs`

| | This build | The reference | The rejected build |
|---|---|---|---|
| Distinct photographs | **32** | 24 | 14 |
| `<img>` elements | 32 — no photograph appears twice | 39 | — |
| Page length | 14,389px = **16.0 screens** | 8.3 screens | 13.4 screens |
| Distinct photographs per screen | **2.00** | 2.89 | 1.04 |
| Share of the average screen that is photograph | **49.7%** | 30.2% | — |

**Answered on the count.** The brief asked for at least 20 distinct images and at least 2 per screen of
scroll; the page carries 32 and exactly 2.00, and half of every screen on average is photograph — a
noticeably larger share than the reference manages.

**Not answered on length.** The plan's own diagnosis was that "an 8-screen page feels full where a 13-screen
one felt hollow — density, not length". The page shipped at **16.0 screens**, longer than the build that was
rejected. It carries 2.3× the photographs over 1.2× the scroll, so it is genuinely denser; but a visitor who
found the last one long will find this one longer. That is a judgement for the client, and it is the reason
the two thinnest chapters below matter more than their percentages suggest.

## 2. No scroll animation

`captures.json`, `motion-*.webp` — `node scripts/capture_chapters.mjs`

Three chapters were each entered **fresh from the top of the page** at three progressively deeper scroll
offsets, and photographed while the reveal was still running. A fourth frame shows the same chapter settled.

| Chapter | Mask coverage, frame by frame | Headline lines still displaced |
|---|---|---|
| `forest` | 1.00 → **0.55** → 0 → 0 | 9 → 0 → 0 → 0 |
| `rooms` | 1.00 → **0.58** → 0 → 0 | 6 → 0 → 0 → 0 |
| `guests` | 1.00 → **0.58** → 0 → 0 | 3 → 0 → 0 → 0 |

`motion-rooms-b-halfway.webp` is the frame to look at: both plates half-wiped, the cream mask visibly
drawing off the photograph. A page with no animation cannot produce it.

Separately, `verification.json` measures how much of the viewport actually changes in a 420 ms window as
each section arrives: **`lodges` 27.3%, `rooted` 37.7%, `forest` 29.9%, `field-days` 26.6%, `rooms` 33.5%,
`guests` 34.3%.** Between a quarter and two-fifths of the screen is in motion.

**Under `prefers-reduced-motion`: 12 of 12 chapters have nothing hidden behind a mask and no line left
displaced**, and 0% of the page's pixels change while it sits still.

> **A correction worth recording.** The first version of this probe reported 8 of 12 chapters *stuck* behind
> masks under reduced motion. It was reading the mask's `transform`, and `new DOMMatrixReadOnly("none")` does
> not throw — it returns the identity matrix, whose `d` is 1, so a mask doing nothing reads as fully
> covering. Task 5's review had already recorded this exact trap and the rig fell into it anyway. It now
> measures the mask's **rendered height** against its container's, which is an outcome rather than a
> property. The masks' real height under reduced motion is 0px.

## 3. Too much empty space

`density.json`, `density-reference.json`, `density-overlay-*.webp`

**Method, because the number is only worth what the method is worth.** Every 150px of scroll, the 1440×900
viewport in front of you is hit-tested on a 6px grid with `document.elementsFromPoint`. A cell counts as
occupied if the topmost thing painted there — before any opaque background — is a photograph or a line box
of type. Cream paper counts as empty. Text is measured by its **line boxes**, so the space beside a short
last line is empty, which it is. The unit is a screen, not a region of the document, because that is what a
visitor experiences.

`density-overlay-*.webp` paints the finished measurement back over the live page — imagery red, type blue —
so the method can be checked by eye rather than taken on trust. There is one frame per chapter.

### The table

| Chapter | Screens tall | Mean empty | Worst screen | ≤30%? |
|---|---|---|---|---|
| `arrival` | 1.00 | 0.3% | 0.3% | pass |
| `lodges` | 1.64 | 44.3% | **51.1%** | **over** |
| `why-you-came` | 1.00 | 2.6% | 2.6% | pass |
| `rooted` | 1.13 | 43.8% | 43.8% | **over** |
| `forest` | 1.33 | 37.1% | 38.6% | **over** |
| `field-days` | 2.35 | **51.1%** | **60.0%** | **over** |
| `rooms` | 1.65 | 37.8% | 49.9% | **over** |
| `after-dark` | 1.00 | 6.0% | 6.0% | pass |
| `lantern-hour` | 1.13 | 46.7% | 46.7% | **over** |
| `details` | 1.17 | **58.0%** | **58.0%** | **over** |
| `guests` | 1.57 | 39.6% | 40.7% | **over** |
| `invitation` | 1.00 | 0.5% | 0.5% | pass |

**Eight of twelve chapters exceed the 30% rule.** The four that pass are the four full-bleed photographic
screens, which are 99%+ occupied by definition. Every cream chapter fails.

The single emptiest screen on the page is at **y = 6,900 — 71.1% empty**, straddling the end of
`field-days` and the top of `rooms`: the six-item experiences index beside a sticky photograph, then two
sections' worth of vertical padding stacked back to back. `density-overlay-worst-6900.webp`.

### The calibration, which changes the conclusion

The 30% figure in `CLAUDE.md` was never derived from a measurement. So the same rig, at the same viewport,
was pointed at **thesujanlife.com** — the site the client named as the benchmark.

| | This build | The reference |
|---|---|---|
| Screens sampled | 91 | 45 |
| Mean empty | **42.9%** | **58.1%** |
| Median empty | 45.5% | 65.0% |
| Emptiest screen | 71.1% | **89.4%** |
| Screens over the 30% budget | 70 of 91 — **77%** | 38 of 45 — **84%** |
| Average screen: photograph | **49.7%** | 30.2% |
| Average screen: type | 7.4% | 11.7% |

**The reference site is 15 percentage points emptier than this page, and fails the same rule more often.**
Its restraint is where the expensive feeling comes from; it is not a page that fills its screens. The
`CLAUDE.md` rule as written — "no section may render more than ~30% empty space" — is not a standard the
benchmark meets, and holding this page to it would make it denser than the thing it is meant to resemble.

That is not a reason to ignore the two genuinely thin chapters. **`field-days` at 51.1% mean / 60% worst and
`details` at 58%** are thin in absolute terms as well as relative ones, and both are thin for the same
reason: not enough photograph. `details` runs on five images of which three are 700px files, and
`field-days` carries 2.35 screens on a 541px source. Both are named in `docs/shot-list.md`.

> Two earlier versions of this rig produced flattering numbers and were thrown away. The first used
> `getBoundingClientRect()` geometry and scored the reference **93.8% occupied** by crediting a full-page
> background video that no screen displayed. The second stamped each screen into a document-wide grid and
> smeared every pinned element across hundreds of rows it never occupied. Both are described in
> `scripts/measure_density.mjs`.

## 4. No resemblance to the reference site

There is no honest number for this, so none is offered. `docs/reference-sujan-layout.md` lists the
reference's own moves in its own order of importance; here is each one against what was built.

| # | The reference's move | Here | Where |
|---|---|---|---|
| 1 | **Hero**: photograph fills the viewport, huge display serif bottom-left, header of three items with a gold pill right | **Present, adapted** — same composition, but the type is cream `#F1E9D7` rather than white, measured against the scrim rather than assumed | `components/sections/Hero.tsx`, `components/ui/SiteHeader.tsx` |
| 2 | **Two-tone headline**: centred display serif with one word dropped to a lighter tone | **Present** — every chapter heading on the page, seven of them, from one component | `components/ui/TwoToneHeading.tsx` |
| 3 | **Floating asymmetric images** cropped by the viewport edge, not grids | **Present** — `chapterIntro` floats one image at one margin and a mismatched pair at the other, both bleeding 11–13vw past the edge, and the composition mirrors between its two instances | `components/sections/ChapterIntro.tsx` |
| 4 | **Text over photograph** — pull-quotes on the image in serif, not beside it | **Present** — two full-bleed quote chapters plus the closing invitation, all measured for worst-pixel contrast | `components/sections/FullBleedQuote.tsx` |
| 5 | **Line-drawn icons and an illustrated map** | **Absent.** The only vector on the page is the grain overlay. We hold no line drawings, and the one map we have is a photograph of a painted board (`petal-bowl-map`). Drawing them is a commission, not a build task; it belongs with Plan 4's emblem and ink tiger. |
| 6 | **Buttons**: solid pills, gold or dark brown, letter-spaced small caps | **Present** — gold fill, `--overlay` label at 5.00:1, since both white (2.97) and ink (3.73) fail on gold | `components/ui/PillButton.tsx` |
| — | **Strict alternation**: full-bleed photographic screen → compact cream screen → full-bleed | **Present and enforced by test** — `content/chapters.test.ts` fails if two quiet screens are ever placed consecutively | `content/chapters.ts` |
| — | **8.2 screens** at 1440×900 | **Absent — this page is 16.0.** The single clearest way in which it does not resemble the reference, and the one thing on this list that no photograph fixes. |
| — | **Video hero** | **Absent by decision** — we have stills only, and the client's property video cannot be used (Beyond Stay branding at 44 s; 44 cuts in 54 s, too short for a loop) |

Two moves the reference does not have, taken from the brand guidelines instead: **numbered chapters**
(`01 · The Lodges` … `07 · Details`) and **captioned plates** in the field-guide idiom. Both are visible in
`w1440-*.webp`.

**Honest summary:** the layout language is present move for move, with one commission outstanding (the line
drawings) and one structural difference that is not a detail — the page is nearly twice the reference's
length.

---

## 5. Lighthouse — run for the first time, against the production build

`lighthouse-mobile.report.html`, `lighthouse-desktop.report.html`. Mobile was run twice with identical
results.

| | Mobile (Moto G Power, simulated Slow 4G) | Desktop |
|---|---|---|
| Performance | **85** | **99** |
| Accessibility | **100** | **100** |
| Best practices | **100** | **100** |
| SEO | **100** | **100** |
| First contentful paint | 1.0 s | 0.3 s |
| **Largest contentful paint** | **4.1 s** | 0.9 s |
| Total blocking time | 140 ms | 10 ms |
| Cumulative layout shift | **0** | **0** |
| Total transfer | 597 KiB | 737 KiB |

**LCP resolves to text on both form factors, never to the photograph.** On mobile it is the hero's
sub-paragraph — *"Two family-run lodges at the gates of Pench and Tadoba."* On desktop it is the hero
headline. **A passing Lighthouse LCP would not be evidence the photograph had arrived**, and a failing one
is not evidence that it had not. Both have to be reported, so both are.

### Against the budgets in `CLAUDE.md` non-negotiable #6

| Budget | Result | |
|---|---|---|
| Largest image < 200 KB | **196 KB** (`bungalow-exterior-palms-1440.avif`) | pass, by 4 KB |
| Initial transfer < 1.5 MB | 398 KB @DPR 1 · 615 KB @DPR 2 · **909 KB @DPR 3** (390px) | pass |
| LCP < 2.5 s on simulated 4G | **4.1 s** | **FAIL** |
| Whole-page scroll | 798 KB @DPR 1 · 2,084 KB @DPR 2 · **3,283 KB @DPR 3** (390px); 1,966 KB @1440 | the client has ruled the whole-page figure acceptable; the budget means initial load |

### The hero photograph itself, which is what the visitor waits for

`verification.json`, `verification-dpr2.json`, `verification-dpr3.json` — real DevTools throttling at
1.6 Mbps / 150 ms RTT / 4× CPU, 390×844.

| Device pixel ratio | File chosen | Size | Hero `responseEnd` |
|---|---|---|---|
| 1 — *no real phone* | `reception-path-dusk-400.avif` | 21 KB | **922 ms** |
| 2 — iPhone SE, most Android | `reception-path-dusk-960.avif` | 98 KB | **2,985 ms** |
| 3 — iPhone Pro, Pixel, most flagships | `reception-path-dusk-1440.avif` | 192 KB | **4,692 ms** |

**This is the finding that matters.** Every performance figure this project has committed — 940 ms hero,
399 KB initial, 799 KB whole page — was measured at **DPR 1**, and DPR 1 is not a device. At DPR 2 the same
page costs 615 KB to first paint and the hero takes three seconds; at DPR 3, 909 KB and four and a half.
Lighthouse's mobile emulation runs at DPR 1.75 and independently measures 597 KB, which corroborates the
DPR 2 figure almost exactly.

Nothing here is a regression — `sizes` is correct at every width (`image-resolution.json`: **0 photographs
under-served** at 390@1x, 390@3x, 768, 1440 or 1920). The page is simply doing what a responsive image
pipeline is supposed to do, and the cost of doing it on a high-density phone had never been measured.

`scripts/measure_page.mjs` now takes `--dpr`. It defaults to 1 so the committed figures stay reproducible,
with a comment saying plainly that 1 is not a phone.

## 6. Contrast over photographs

`contrast-over-photos.json` — **36 of 36 text runs pass**, at 390, 768, 1440 and 1920.

Worst case **3.16:1** — the hero headline at 1440 — against a 3.0 floor for large display type over a
photograph. Second worst 3.43 (hero headline at 1920). Every body run clears 4.5:1, the tightest being the
`why-you-came` pull-quote at 3.90 (a 3.0 run) and the `invitation` body at 5.05.

Measured as the **brightest single pixel** under each run, with the type hidden and headlines measured per
word — not a mean, not a percentile.

## 7. Other standing checks, all green

| Check | Result |
|---|---|
| Horizontal overflow | None at 390 / 768 / 1440 / 1920, at every scroll position |
| Menu scroll lock | Wheel and keyboard both blocked while open, both restored on close, position kept — at 390 and 1440, with and without reduced motion |
| Reduced motion | 0% of pixels change while still; 0 words displaced; 12 of 12 chapters fully visible |
| `sizes` correctness | 0 photographs served below their box with a wider file available, at any of the five viewport/DPR combinations |
| Suite | 69 tests, all passing; `tsc --noEmit`, `build` and `lint` clean |

---

## What is still owed

1. **The mobile LCP failure** (4.1 s against 2.5 s). The lever is the hero: at DPR 3 it is a 192 KB file
   the visitor waits 4.7 s for. Options are a smaller hero-specific derivative, an LQIP, or accepting the
   figure with eyes open. Not a Task 8 decision.
2. **16.0 screens against the reference's 8.3.** Merging or cutting `field-days`, the thinnest and longest
   chapter at 2.35 screens, is the obvious first move.
3. **`field-days` and `details`** are thin in absolute terms — see `docs/shot-list.md`, entries 2 and 5.
4. **Line-drawn icons and an illustrated map** — the one reference move not attempted. A commission.
5. **`components/ui/Plate.tsx` hard-codes the string `"Plate "`** — the one user-facing string on the page
   not living in `content/`. Known, small, not fixed here because Task 8 changes no application code.
6. **Six photographs cannot fill their box on a DPR 3 phone**, `tiger-crossing-track` worst at 541px. Not a
   code fix; it is the shot list.

---

## Re-deriving everything

> **Do not run `npm run build` while `next start` is serving.** Turbopack writes new content-hashed chunk
> names into `.next`, the running server keeps serving the old HTML, and its stylesheet starts returning
> 500 — so the page renders completely unstyled and every measurement quietly changes. It happened once
> during this task: a density re-run reported `details` as 5.59 screens tall instead of 1.17 and `guests` as
> 0.9% empty. The numbers were absurd enough to catch, which is the only reason it was caught. Rebuild
> first, start second, and restart the server after any rebuild.

```bash
npm run build && npx next start -p 3100 &

node scripts/measure_page.mjs      --out docs/reviews/2026-08-03-chapters/verification.json
node scripts/measure_page.mjs --dpr 2 --out docs/reviews/2026-08-03-chapters/verification-dpr2.json
node scripts/measure_page.mjs --dpr 3 --out docs/reviews/2026-08-03-chapters/verification-dpr3.json
node scripts/measure_density.mjs   --out docs/reviews/2026-08-03-chapters/density.json \
                                   --overlay docs/reviews/2026-08-03-chapters/density-overlay.webp
node scripts/measure_density.mjs   --url https://thesujanlife.com/ --sections off \
                                   --out docs/reviews/2026-08-03-chapters/density-reference.json
node scripts/capture_chapters.mjs  --out docs/reviews/2026-08-03-chapters
node scripts/check_contrast_over_photos.mjs --out docs/reviews/2026-08-03-chapters/contrast-over-photos.json
node scripts/check_image_resolution.mjs     --out docs/reviews/2026-08-03-chapters/image-resolution.json
node scripts/check_menu.mjs                 --out docs/reviews/2026-08-03-chapters/menu-and-layout.json

npx lighthouse http://localhost:3100/ --output=json --output=html \
  --output-path=docs/reviews/2026-08-03-chapters/lighthouse-mobile
npx lighthouse http://localhost:3100/ --preset=desktop --output=json --output=html \
  --output-path=docs/reviews/2026-08-03-chapters/lighthouse-desktop
```

## What is in this folder

| File | What |
|---|---|
| `verification.json`, `-dpr2`, `-dpr3` | Transfer, hero arrival, motion, reduced motion, overflow — at three device pixel ratios |
| `density.json` | Per-screen occupancy, the chapter table, image counts |
| `density-reference.json` | The same measurement of thesujanlife.com |
| `density-overlay-*.webp` | The occupancy grid painted back over the page — one per chapter, plus worst and median |
| `reference-overlay-*.webp` | The same, for the reference site |
| `captures.json` | Mid-reveal states, screenshot manifest, reduced-motion readings |
| `motion-*-{a-entering,b-halfway,c-arrived,d-settled}.webp` | The reveal caught in the act |
| `w{390,768,1440,1920}-NN-{chapter}.webp` | Every chapter at every width — 48 frames |
| `reduced-motion-1440-midpage.webp` | The page under `prefers-reduced-motion` |
| `contrast-over-photos.json` | 36 worst-pixel contrast measurements |
| `image-resolution.json` | Chosen file vs box, at five viewport/DPR combinations |
| `menu-and-layout.json` | Scroll lock driven by real input, menu semantics, overflow |
| `lighthouse-{mobile,desktop}.report.{html,json}` | The full Lighthouse runs |
