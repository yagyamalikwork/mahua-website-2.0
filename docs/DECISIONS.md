# Decisions and hard-won findings

The durable record. **Everything here was learned by measuring something, and most of it cost a defect to
learn.** It lives in git because the per-task ledgers it was distilled from
(`.superpowers/sdd/*/progress.md`) are git-ignored and would not survive a fresh clone.

Read this when you are about to relitigate a decision, or when a number in another document looks wrong.

---

## 1. What the client has ruled

Each of these was a real decision with a real trade. Do not reopen one without being asked.

| Date | Ruling | Why it went that way |
|---|---|---|
| 3 Aug | **Two properties only** — Mahua Vann (Pench), Mahua Tola (Tadoba) | Mahua Bagh is retired from the brand. The live site still sells it and is wrong |
| 3 Aug | **Seduce, not convert** | Unhurried and warm. Not a booking funnel |
| 3 Aug | **Cream throughout; retire the day-arc** | The scroll-through-a-day colour system forced section heights to be sized by colour ratio instead of content, which is what made the rejected build sparse |
| 3 Aug | **Creative freedom over the guidelines** | "Keep what is good, rework what is not, invent where neither serves us." Explicitly *not* line-by-line compliance |
| 4 Aug | **The 1.5 MB budget means initial load, not whole scroll** | It collided with the image density that answered their rejection. 32 photographs cannot fit 1.5 MB. Desktop whole-scroll sits above it and is accepted |
| 4 Aug | **Both lodges are 5 km from their gate** | Vann from Turia, Tola from Kolara. The sources publish **five different distances** between them and not one is right |
| 4 Aug | **The empty-space rule is 45%, not 30%** | The same rig pointed at the client's own chosen reference scored it **58.1% mean empty**, failing 38 of its 45 screens, against our 42.9%. The rule was stricter than the benchmark it existed to chase. 45% is the midpoint they picked |
| 5 Aug | **Keep the hero sharp, accept the time** | At the smaller tier the hero was drawn at a third of the resolution it needed and shipped visibly blurred. Costs ~750 ms |
| 5 Aug | **Tripadvisor quotes are interim** | Hard-coded reviews now; the site will be wired to Tripadvisor directly (Plan 5+) for live reviews, ratings and counts |
| 5 Aug | **The header lockup is flower + the original serif wordmark**, horizontal | They preferred the pre-logo wordmark. "The best from your build and my choice" |
| 5 Aug | **Scroll craft before the characters** | Plan 4 = header, entrances, collage, emblem. Leaf cursor and ink tiger deferred to Plan 5 |
| 5 Aug | **Shorten the pin rather than drop it** | It bought ~1.9 screens and added zero photographs, dropping images/screen 2.08 → 1.87 against their original "too few images" complaint. Shortened to one held screen; recovered to 1.98 |
| 5 Aug | **The hero's speed budget can wait** | Measured as unreachable with available levers — see §3 |
| 5 Aug | **The leaf follows the pointer everywhere**, not only over links | Chosen over the more restrained "hover-state only" option with both trade-offs on the table |
| 5 Aug | **The leaf cursor must be trivially removable** | "I'm not too sure about the leaf cursor." Enforced by a test, not a promise — see §7 |
| 5 Aug | **A hairline slides in under links on hover**, left to right | Client-requested addition to Plan 5 |
| 6 Aug | **The tiger is the client's licensed vector, not my drawing** | Three hand-authored attempts failed. Hand-writing bezier coordinates for a quadruped produces outlines slightly wrong everywhere, which is what reads as cheap — see §8 |
| 6 Aug | **The tiger became film** | Client supplied an animated illustration. It does the one thing the drawing could not: the tail moves and the head turns |
| 6 Aug | **Films play once and hold. They never loop** | Client asked for a loop; non-negotiable #5 forbids permanent peripheral motion, and a loop decodes video for as long as a visitor reads. Play-once *is* "arrives, performs, dozes" |
| 6 Aug | **Hover replays a film** | Client's addition. A deliberate hover is the visitor asking, which is a different thing from motion happening at them |
| 7 Aug | **The coloured tiger idea is parked, not dead** | Assets kept in `Tiger-illustrations/`. The `darken` finding in §9 is what makes it possible whenever they return to it |
| 7 Aug | **The potter closes `rooted`, as an accessory** | Not a band of its own. "It still feels pretty disconnected from the section" — the figure belongs *in* the chapter's existing space, not below it |

---

## 2. The defect that keeps happening — fourteen instances

**A check confirmed that a mechanism was configured, rather than that behaviour had changed.** Every one of
these passed its own gate while the thing it guarded was broken.

| # | The check | What it missed |
|---|---|---|
| 1 | A reveal asserting a CSS property was set | Content popped invisible on load |
| 2 | A contrast sweep over seven *static* colour states | Text hit 1.85:1 across 16% of the scroll, because the background moved *between* those states |
| 3 | A warmth guard written `red >= blue` | Pure black passes `0 >= 0`. The test for cold colours could not detect the coldest one |
| 4 | An image budget that was a `console.warn` | A 636 KB file shipped |
| 5 | "Never show the same photograph twice" comparing **filenames** | Four pairs were the same picture under two ids; two pairs sat in the *same* grid |
| 6 | `sizes` describing the element's **box** | Cover-cropped photographs drew 4× wider than their box; the hero and the tiger shipped blurred |
| 7 | The rig built to catch #6 **also measured the box** | Reported "0 under-served" while the hero sat at 0.32 |
| 8 | Performance measured at **device pixel ratio 1** | No phone has DPR 1. At DPR 3 the hero was 192 KB, not 21 KB |
| 9 | A scroll lock asserting `overflow: hidden` was applied | The wheel still scrolled the page 1,485 px, because Lenis bypasses it |
| 10 | A contrast target found **structurally** (`header > div > p`) | The markup changed; the selector matched nothing; "not visible" counted as neither pass nor fail |
| 11 | A GSAP probe searching the page's **HTML** for `"gsap"` | A bundled copy never appears there. **The plan's entire premise was built on this** |
| 12 | A guard grepping **source** for a static import | A one-line margin change would have undone a 110 KB saving with everything green |
| 13 | Parallax sampled at **two fixed document offsets** | Those offsets fell inside exactly **1 of 12** elements' ranges. "1/12 moved" was blindness reported as a pass |
| 14 | A click-through check watching `page.url()` | The links are `target="_blank"`, so the check could never fail |
| 15 | A mid-transition sample **racing the wall clock** | Read 0.597 on one run and 0.000 on the next against a byte-identical build. It could fail correct code *and* pass broken code on a lucky sample. Fixed by pausing the transition and seeking two interior points |
| 16 | A cursor-lag check comparing the leaf to **where the hand had already moved on to** | Read 98.7px against a 12px clamp on a *correct* build — 12 exactly, plus 86.7 of pointer travel in the same frame. No cursor can do better; the OS arrow is a frame behind too |
| 17 | A removability guard matching **any mention** of a path | A rig tripped it on its own *output filename*, `2026-08-05-signature/leaf-cursor.json`. The same weakness pointing the other way would hide a real importer that spelled the path differently |
| 18 | A stagger test asserting **the opposite of what was needed** | It demanded waves be separated, and shipped the stutter it existed to prevent: twenty strokes drawing, then nothing for ~0.15s, eight times. The client saw it immediately |
| 19 | **A commit landing with tests red**, because `npm test \| tail` swallowed the exit code | The suite CLAUDE.md requires green before any commit failed into a void. Read exit codes; do not eyeball output |

**The rule this bought:** *run every guard against the broken state before trusting it to pass.* A guard
nobody has watched fail is not a guard. Several were caught only because someone did exactly that —
including three an implementer found in its own instruments before reporting.

**The corollary:** the browser is the only authority on rendered behaviour. Type-checking, unit tests, the
build and the linter all passed while photographs shipped blurred, masks never wiped, and a page scrolled
behind a lock.

---

## 3. Why the hero misses its budget, and why no lever closes it

The hero photograph lands at **~3,419 ms** on Slow 4G against a 2,500 ms budget. Task 6 measured every
lever by rebuilding and A/B-ing rather than reasoning:

| Lever | Worth |
|---|---|
| Deferring GSAP (**spent**) | 213 ms on the hero, **0 ms on LCP** |
| Subsetting the fonts (unspent) | ~215 ms |
| Dropping the fonts' `rel=preload` (unspent) | ~172 ms |

**Every lever is ~200 ms; the gap is ~1,400 ms.** The hero is 192 KB queued behind ~460 KB on a 200 KB/s
link — it is **bandwidth-bound**. Closing it needs a smaller hero or a lighter first screen, which is a
design decision, not an optimisation. The client has deferred it.

**Do not read Chrome's LCP as the hero's arrival.** Across **35 runs** it resolved to text every single time
— a paragraph on mobile, the `<h1>` on desktop — never once to a photograph. Mobile LCP reads 1,488 ms while
the hero lands at 3,419. Use `scripts/measure_page.mjs`, and **medians of five**: an unchanged build has
produced LCP anywhere from 2,462 to 4,140 ms.

*Unexamined:* the desktop hero (4,107 ms) is slower than the mobile one.

---

## 4. Things that look broken and are not

- **No animations at all?** Check the operating system's reduced-motion setting before anything else.
  Windows: *Settings → Accessibility → Visual effects → Animation effects*. With it off, Chrome reports
  `prefers-reduced-motion: reduce` and the page deliberately switches off every entrance, the emblem turn
  and the pin, and gives back the pin's reserved scroll. **This happened to the client on 5 Aug** and looked
  exactly like a broken build. Confirmed same-code, same-server: 37 staged entrances and a pinned collage
  with the setting on; 0 and unpinned with it off.
- **The pinned collage not pinning?** It needs **1440px of *layout* viewport**. A Windows window at 1440
  with a classic scrollbar falls ~16px short and silently shows the unpinned composition. **Demo above
  1500px.**
- **A stale `next start` on port 3100** has misled measurement several times. Confirm what you are measuring.

---

## 7. The leaf cursor's removability contract

The client asked for it to be easy to remove or change. That is enforced rather than intended:

- Everything lives in `components/signature/leaf-cursor/`.
- **Exactly one** file outside it may import from it — `app/layout.tsx`.
- `removability.test.ts` fails if a second importer appears, **and** fails if the mount stops using a
  dynamic import — because a static one would leave every byte behind after the line was deleted.
- The artwork is one constant in one file. The client's own hand-drawn leaf replaced a drawn SVG, which
  replaced one extracted from their logo. Swapping it is `node scripts/build_leaf.mjs` over a new PNG.

**Their logo genuinely contains eight leaves** — four `#465E44`, four `#2B3F2A`, real vector paths — and the
extraction worked. It does not survive 24px: those leaves are stylised for a rosette, with no stem and no
point because the lockup hides both. All three attempts are rendered side by side in
`docs/reviews/2026-08-05-signature/leaf-{extracted,drawn}-*.png`.

---

## 8. Why three hand-drawn tigers failed, and what replaced them

Three attempts, each fixing a real diagnosis, none good enough:
`docs/reviews/2026-08-05-signature/tiger-attempt{2,3}.png`. The diagnosis was never a missing detail — it
was the method. **Hand-authoring bezier coordinates for a quadruped produces outlines that are slightly
wrong everywhere, and slightly wrong everywhere is exactly what reads as cheap** beside thirty-four real
photographs.

What the client then supplied, in order, and what each was worth:

| Supplied | Verdict |
|---|---|
| Five stock rasters | **All unlicensed previews.** Three visibly watermarked; one carried `VectorStock.com/61335879` in its own metadata; one was an iStock 612px comp. Flagged as a real business risk, not a technicality |
| Three "pose" SVGs + a 3D model | **None usable.** The SVGs are closed *filled* silhouettes — no line to draw along. The `.glb` is an unrigged trimesh export: no skins, no animations, so no part of it can move |
| A licensed lying-tiger vector | **This one worked.** 162 open, stroked paths. Open and stroked is the whole requirement: an open path has a length that `stroke-dashoffset` can walk |

**The ink tiger still exists and is one line from returning** — `components/signature/InkTiger.tsx`,
`lib/tiger-art.ts`, `scripts/build_tiger.mjs` and its tests are all intact. What removing it from the page
cost: 17 KB inlined with zero JavaScript, and `field-days` at 41.2% empty rather than 44.6%.

---

## 9. Everything learned about putting film on this page

**`mix-blend-mode: darken` is what makes a rectangular video sit on cream with no box.** Every pixel lighter
than the page's cream is replaced by it; everything painted survives.

**The artwork's background must therefore be *lighter* than the cream, and flat.** Not matched to it —
lighter. Two reasons, and the second is the one that decides it:

1. The page alternates two creams (`#F1E9D7` and `#E9DFC8`), so an exact match breaks the moment a chapter
   moves or one is inserted above it.
2. **Video compression will not hold a flat colour.** 4:2:0 subsampling and block artefacts turn a matched
   field mottled; every pixel landing darker than the cream shows as a blotch. White gives 22 levels of
   tolerance and swallows the noise entirely.

Measured margins, after compression: the tiger's palest border pixel is 242, the potter's 235, against a
cream of 233. Both hold. A supplied file whose background was a painted tan (216,200,167) could not be
saved this way at all.

### The specification to hand an illustrator

4:5 portrait, 1080×1350 minimum; 6–10 seconds; 24fps; **no audio**; master uncompressed (do not let them
optimise for web); **transparent background if at all possible** — PNG sequence, ProRes 4444 or WebM/VP9
alpha — otherwise flat pure white, no vignette, no gradient, no drop shadow. It must **start and end on the
same pose**, which is what allows both looping and holding. The animal moves; the camera never does. Leave
~8% clear margin on all sides.

### Encoding

`ffmpeg -an -vf scale=W:-2 -c:v libx264 -crf 28..30 -preset slow -movflags +faststart`, plus a WebP poster
from the final frame. Tiger 12.7 MB → 616 KB at 810 wide; potter 10 MB → 686 KB at 1080 wide, cropped to its
own ink first. H.264 beat VP9 on both. `preload="none"` so nothing but the poster loads before a visitor
scrolls to it.

---

## 10. What a figure does to a chapter's density, learned three times

**A narrow portrait figure centred in a full-width band is the worst of all worlds.** The band's height is
set by the figure, so a small one leaves almost all of it bare. Measured on `rooted`: at 380px it took the
chapter to 45.7% against the 45% ceiling and pushed the join below it to **81.2%**, worse than the 63.5% it
started at.

**Widening helps** — the band fills proportionally — but it buys scroll. At 680px `rooted` was 45.0%: passing,
and sitting exactly on the line.

**The right answer is not to create a band at all.** Use space the section already has. `ChapterSurface`
carries 80px of bottom padding (`lg:py-20`) that is empty by construction; a negative margin puts a figure
in it for free. At 220px the potter costs 216px instead of 823 and `rooted` is 41.8%.

**Do not assume where the slack is — measure it.** In `rooted` at 1280 there are **24px** below the prose,
and at 1024 the text column is *taller* than the photographs. `field-days` has no 350×180 hole anywhere near
its foot; its largest empty rectangle there is 500×180. Both were found with a largest-empty-rectangle scan
over the chapter's real glyph and image boxes, which is worth rebuilding whenever this question comes up.

`scripts/measure_density.mjs` **does** count `<video>` as imagery (line 172), so these figures are real.
`imagesPerScreen` counts only `<img>`, so it under-reports once films are on the page.

### A figure below a pinned scene is not where the layout puts it — fourth lesson, 7 Aug 2026

The potter was 16px below the composition in the markup and **148px below the nearest photograph and 268px
below the last paragraph** by the time a visitor saw it, alone in a band of cream. The client's word was
"disconnected", and every static measurement said the placement was fine.

**The cause is the drift, and it does not stop when the pin does.** `CollageStage` scrubs each photograph
from `+half` to `-half` of `reserved × rate`, so when `position: sticky` lets go the three are still
displaced — measured **-81 / -57 / -32px at 1920×1080**, -64 / -45 / -26 at 1440×860. The composition has
risen; the footer is not part of the scene and has not. What looks like a margin problem is a residue of the
effect.

**The room to pull it back into is `items-center`'s, and it is exactly `(H - C) / 2`** for screen height H
and centre-column ink C — 252px at 1080, 212px at 1000, 162px at 900, 115px at 1440×860. The flanks fill the
pinned screen and the centre column does not.

So the margin is a formula, `50vh - C/2 - 56px`, which holds the gap at **56px from 1440×860 to 2560×1440**.
Two fixed values were tried first and both were measured failing: 80px stranded it at 172px on a 1080 screen,
and 192px put it 20px from the copy at 1000. C changes only at 1600, where `max-w-[1600px]` stops the
container growing — hence two constants, 344 and 371.

**What it bought:** `rooted` worst screen **55.9% → 44.5%** (from over the ceiling to inside it), mean
41.8% → 39.7%, and the `rooted / forest` join — the emptiest place on the page — **76.9% → 68.8%**. Both
figures measured on one build with only that margin differing.

**It is guarded.** `scripts/check_pinned_collage.mjs` now scrolls to where the figure is read and asserts the
gap to the last paragraph is 24-100px, plus that it overlaps no photograph. Run against the pre-change build
first, it reports 151px and exits 1. It measures the gap a visitor sees, not the margin — a check of the
margin would pass with the figure a screen adrift, which is defect shape #2 exactly.

---

## 5. Owed, and open

- **The targeted shot list** (`docs/shot-list.md`) — six source photographs top out at 541–1000px and cannot
  fill a high-DPR phone. `potters-hands` and `forest-shrine-incense` are the two that limit the collage.
- **More photographs in `rooted`** if the pinned collage is ever to deliver the client's "memory album
  drifting by". Three cannot do it at any rate inside the parallax cap; the library has one image spare.
- **Eleven hard numbers in the copy are unconfirmed** — see `docs/copy-provenance.md`. The sharpest: the
  live site's room list for Mahua Tola totals **twelve** while the brand record says fourteen.
- **Plan 5, tasks 8–10.** The butterfly; the tiger's browser rig (**must be rewritten for video** — the
  SVG-inking version in the plan is obsolete); whole-page verification.
- **No browser rig covers the two films.** The rule and the cursor have `check_rule_in.mjs` and
  `check_leaf_cursor.mjs`; play-once, hold, hover-replay, the `darken` blend and the poster fail-safes are
  currently verified by hand only.
- **The two film posters are 103 KB of the initial load and nobody has scrolled to them.**
  `tiger-film-poster.webp` (56 KB) and `potter-film-poster.webp` (47 KB) are fetched at ~28 ms at both 390
  and 1440, ahead of the first screen's own imagery. `preload="none"` does not defer a poster and there is
  no `loading="lazy"` for one. Against a hero that is bandwidth-bound and ~1,400 ms over budget, this is a
  larger lever than anything measured in Plan 4 Task 6 (§3). The fix is to attach `poster` only when the
  film is near, the way the film itself already waits. **Raised with the client 7 Aug; not yet done.**
- **`field-days / rooms` is now the page's emptiest join at 73.1%**, the one the tiger closes. It has not had
  the treatment `rooted`'s join just had, and its photographs drift 7-24px rather than 126, so the cause is
  probably not the same — measure before assuming.
- **A lantern illustration arrived 7 Aug** (`Lantern-illustrations/lantern-final1.png`), unasked and
  unplaced. `lantern-hour` is the obvious home. Nothing has been checked about it.
- Then Tripadvisor wiring, the SEO redirect map, Sanity.

---

## 6. Deferred minors carried out of Plan 4

None block anything. Listed so they are not rediscovered as new.

- `SplitLines` prose calls the block rise and line reveal "one settle"; they are 0.9s and 1.0s + stagger.
- Per-line stagger delays are read at mount and not re-measured on resize or after a late font swap.
- `potters-hands` at 768px is served at 0.68 source pixels per CSS pixel — the reorder favoured the ≥1440
  pinned composition. Fix is a larger source file, not code.
- `invitation[0]`'s parallax is sampled over 24% of its scrub; the tween is linear so it can only
  under-report, never fabricate movement.
- Evidence folders `2026-08-05-header/` and `2026-08-05-scroll-craft/` overlap.
