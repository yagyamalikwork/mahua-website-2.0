# The three shapes nobody had ever measured

Task 5 of `docs/superpowers/plans/2026-08-27-mobile-tablet-and-zoom.md`. This task **measures and
reports**; nothing found here was fixed inside this task — anything genuinely broken is recorded as a
finding for a follow-up task.

Measured against a **production build**, never `next dev`: `npm run build`, then `npx next start -p 3100`.
Every figure below is re-derivable with the command printed above it.

---

## 1. OS-level text scaling — the ~2,400-finding noise, separated from what is real

### 1.1 The run

```
node scripts/check_responsive.mjs --port 3100 \
  --baseline docs/reviews/2026-08-27-mobile/after-pager-fixround1.json \
  --out docs/reviews/2026-08-27-mobile/responsive-task5.json
```

Total: **2,489 findings** (assertion 2: 54, assertion 3: 21 — both unchanged from the committed baseline,
re-confirmed after fix round 1's rig changes below — see the "Commands used" section) — assertion 6 (OS text
scaling, at 1.5× and 2×, three routes × eight shapes): **2,414**.

**Fix round 1 (28 Aug 2026)** re-ran this exact command against a fresh production build after the rig
changes below, twice — `responsive-task5-fixround1.json` and, on the same unrebuilt server,
`responsive-task5-fixround1-variance.json`. Both reproduced **assertion 2: 54, assertion 3: 21, assertion 6:
2,414 (total 2,489)** byte-for-byte — the two global-constraint numbers held, and this particular pair of
runs happened to also agree on assertion 6's own total (§1.9 records why that total is not guaranteed to
repeat on every run).

### 1.2 How the artefact class was separated from the real findings — a code check, not a guess

`scripts/check_responsive.mjs` was changed **additively** (see its own updated header comment) to tag every
assertion-6 finding with what it actually is, using real DOM checks rather than reading the failure
message's text:

- **`isWordSpan`** — `el.closest("[data-word]") !== null`. `components/motion/SplitLines.tsx` wraps every
  headline word in its own `overflow-hidden` mask (`[data-word]`, with a nested `[data-line-inner]` that
  actually carries the word and moves).
- **`wasClippedAtRest`** — a second artefact class, found while tracing the first. `.drift-frame`
  (`app/globals.css`, the non-negotiable-#5 parallax mask around a photograph drawn **deliberately
  oversized** so it always covers its frame as it translates) has `scrollHeight > clientHeight` **by design,
  at rest, with no font-scale involved at all** — confirmed directly: at 390×844 with no scale touched, one
  `.drift-frame` reads `scrollHeight 902` over `clientHeight 844`. Assertion 6's clip check never compared
  against a rest state before this task, so this permanent, load-bearing overflow read identically to a
  genuine scaling regression on every route carrying a drift photograph (the hero/arrival band on all three
  routes, plus `why-you-came`/`vann-forest`/`tola-reserve`). The rig now snapshots every overflow-hidden
  candidate's rest state **before** the root font-size ever changes, in the same `page.evaluate()` call, and
  tags each later clip finding against it.

**Fix round 1 correction (28 Aug 2026).** This section used to say, of `isWordSpan`: *"A root text-scale
changing a word's glyph metrics by even a fraction of a pixel registers as 'clips' or 'intersects' on
hundreds of near-identical one-word boxes at once."* That claim does not survive this task's own committed
JSON — the deltas involved are nowhere near a fraction of a pixel, and the ratio is identical at both scale
factors tested, which on its own rules out anything proportional to the applied scale (§1.3). It has been
deleted rather than kept as a caveat, and §1.3 below has what the mechanism actually is, traced and
confirmed rather than assumed.

**Nothing about which elements fail changed.** `clippedCount`/`intersectionCount` are byte-identical to what
the untagged rig would report; the new fields (`isWordSpan`, `wasClippedAtRest`,
`clippedWordSpanCount`/`clippedAtRestCount`/`clippedGenuineNewCount`,
`intersectionWordSpanCount`/`intersectionOtherCount`) are a strictly additive breakdown of the same total.
This is the rig seeing more, never a number coming out differently.

### 1.3 The split — corrected, fix round 1 (28 Aug 2026)

**A whole-branch review found that the first pass of this task's own table was wrong, in a way its own
committed JSON already contradicted.** The clip row below is arithmetically the same as before (nobody
disputed the *numbers* — `clippedWordSpanCount` summed to 1,376, `clippedAtRestCount` to 1,658,
`clippedGenuineNewCount` to 49, `clippedCount` to 1,707, every one re-derivable from
`responsive-task5-fixround1.json`), but the STORY the table told was wrong twice over:

1. It presented "word-span artefact" and "pre-existing-at-rest artefact" as two **independent** buckets that
   happened to sum to the total. They are not independent. `1,707 − 49 = 1,658`, exactly
   `clippedAtRestCount` — **every one of the 1,376 word-span clips is also `wasClippedAtRest`.** The
   word-span bucket is a strict subset of the at-rest bucket, not a sibling of it.
2. It attributed the word-span bucket to "a root text-scale changing a word's glyph metrics by a fraction of
   a pixel" — which the deltas themselves rule out. A sample of the actual `scrollHeight`/`clientHeight`
   pairs, read directly off `responsive-task5-fixround1.json`'s raw `failures[]` (not estimated):

   | Word | 150% scale | 200% scale | Ratio (150% / 200%) |
   |---|---|---|---|
   | "forests," / "known" / "deeply" / "The" / "forest" / "Mahua" | 110 / 58 | 148 / 77 | 1.897 / 1.922 |
   | "Vann" / "Tola" | 84 / 44 | 113 / 59 | 1.909 / 1.915 |
   | "at" / "its" / "most" / "alive," / "and" | 93 / 48 | 124 / 65 | 1.938 / 1.908 |

   These are not sub-pixel — they are ~50–90px deltas — and **the ratio is the same at both scale factors**,
   which on its own rules out anything proportional to the applied text scale. Across every one of the 1,707
   clip findings the ratio clusters tightly around **1.9×**, whatever the scale (median 1.908, min 1.013 —
   the low outlier is a `.drift-frame` div, not a word-span). A quantity that tracks the SAME ratio at both
   150% and 200% root scale is not being driven by the scale at all.

**The real mechanism, traced rather than assumed.** `[data-word]`'s overflow has nothing to do with
`.drift-frame`'s (both satisfy `wasClippedAtRest`, but for unrelated reasons — the earlier framing that
lumped them together was itself imprecise). `components/motion/SplitLines.tsx`'s own entrance mechanism
(`app/globals.css`): a heading not yet scrolled into view carries `data-lines-enter="pending"`, under which
`[data-line-inner] { translate: 0 var(--lines-from, 115%); }` — the word is pushed **down by 115% of its own
height**, hidden inside the mask, waiting for its entrance. `check_responsive.mjs` never scrolls the page at
any point in any of its six assertions, so **every heading below the very first viewport sits in this
pending, translated-down position for the rig's entire run** — which is exactly why the count is so large
(1,376): it is proportional to how much below-the-fold heading text the page has, not to anything about text
scaling.

Confirmed empirically, not assumed (a throwaway Playwright probe,
`scripts/_scratch_probe_wordspan_scrolled.mjs`, run then deleted before commit — same convention Task 5's
first pass used): one such word ("Two", the first word of `01 · The Lodges`' heading) read
`clientHeight 67 / scrollHeight 130` (ratio 1.94) while `data-lines-enter="pending"`. Scrolling it into view
and waiting for the CSS transition to finish took the SAME element to `clientHeight 67 / scrollHeight 67` —
**the overflow is gone entirely, not reduced.** The arithmetic matches exactly: `[data-line-inner]`
translated down by 115% of its own ~58px height (≈67px) plus its own height lands the content's bottom edge
at ≈130px from the top — precisely the `scrollHeight` this rig measured before the scroll.

**§1.5 below is the visual establishment this finding needed** — the brief's own ask, not skipped.

| Class | Clips | Intersections | Total |
|---|---:|---:|---:|
| **Overflowing before any scaling — for two DIFFERENT reasons** | | | |
| → `[data-word]`, a heading not yet scrolled into view (§1.3, confirmed inert, §1.5) | 1,376 | see §1.4 | |
| → `.drift-frame`/`.no-float`, a permanently oversized parallax photograph (non-negotiable #5, by design) | 282 | — | |
| **At-rest subtotal** | **1,658** | see §1.4 | |
| **Genuinely new — appears only once the scale is applied** | **49** | see §1.4 | |
| **Total** | **1,707** | **707** | **2,414** |

### 1.4 What the "real" findings actually are — and a second correction to the intersection half

All **49 genuine-new clips** are the same defect: `RoomCardStack`'s `<li>` room cards clipping their own
text at 150%/200% root scale, on both property pages, across every room type sampled (Deluxe, Cottage
without/with Deck, Super Deluxe Cottage, Suite, Family Suite). Example:
`li "DeluxeHandmade in mud an" clips at 200% root text scale — scrollHeight 1164 over clientHeight 600`.
This is a real, substantive finding — the card's fixed-height text-reserve budget (`ROOM_STACK.textReserve`,
`CLAUDE.md` §17/§18) was solved for legibility at 100% root font-size and does not hold at 150%/200%. **Not
fixed here** — it touches the room card stack, which this plan's own file structure lists as deliberately
untouched, and the client's 27 Aug ruling was to leave that stack alone. **A finding for a follow-up task.**

**The 201 previously-unclassified ("real") intersections were never checked against a rest state at all —
only the word-span split existed for them.** Fix round 1 built the symmetric check (Important finding #2,
`scripts/check_responsive.mjs`'s new `restIntersectionSigs`/`wasIntersectingAtRest`, additive, no threshold
changed): a rest-state snapshot of every text-block pair that already intersects at 100% zoom, taken the
same way `restOverflow` already was for clips, keyed by the same `"a × b"` pair signature the post-scale
check produces. Re-measured against a fresh production build (`responsive-task5-fixround1.json`; a second,
unrebuilt re-run reproduced every figure in this section byte-for-byte —
`responsive-task5-fixround1-variance.json`):

Of the 201, **85 (42%) were already intersecting at rest** and **116 (58%) are genuinely new**, using the
same `!isWordSpan && !wasIntersectingAtRest` AND-exclusion `clippedGenuineNewCount` already used for clips.
Traced by content, not merely counted:

| Class | At-rest | Genuine-new | Total |
|---|---:|---:|---:|
| Map label × map label (`<svg>` `<text>` pairs, e.g. `text "Karmajhiri Gate" × text "Jamtara Gate"`) | 70 | 1 | 71 |
| Room-card text (paragraph/heading pairs inside a `RoomCardStack` card) | 15 | 94 | 109 |
| `PropertyContact`'s email/address block wrapping into itself | 0 | 18 | 18 |
| Body-copy pairs at `tablet-1024`/200% (e.g. `p "Mahua is deliberately sm" × p "Tadoba"`) | 0 | 3 | 3 |
| **Total** | **85** | **116** | **201** |

**This changes the headline "real" count.** The previous draft of this document treated all 201
intersections as equally novel and reported "250 real findings" (49 + 201). Genuinely new — not an artefact
of `SplitLines`' entrance mask, and not already true at 100% zoom — the total is **165** (49 clips + 116
intersections), not 250. The 85-finding gap is dominated by one clean result: **70 of the 71 map-label ×
map-label pairs already intersect before any scaling happens** — the map's labels are laid out tightly
enough at rest that neighbouring labels already sit close together, which §1.5 below independently confirms
never move under OS text scaling anyway (they are sized in raw SVG-coordinate `px`, not `rem`). The map's
crowding is a real, pre-existing layout fact worth the client's attention on its own terms — it is not,
however, a scaling regression, and the previous draft's "plausibly a knock-on effect… not independently
confirmed" language is superseded by this direct measurement.

`PropertyContact`'s 18 findings are cleanly on the OTHER side: **zero of them are at rest** — the contact
block does not wrap into itself at 100% zoom on any route/shape, and only starts to once the root scale
reaches 150%/200%. This is the plan's genuinely confirmed, novel accessibility finding from the intersection
half: a real element that behaves correctly today and would visibly misbehave for a visitor using OS text
scaling. **Not fixed here** — no product code was touched by this task per its own brief; recorded as a
finding for a follow-up task, same disposition as the room-card clips above.

### 1.5 Establishing whether the `[data-word]` overflow is visually inert — the brief's Critical fix #4

The brief asked this document to establish, not assume, whether the corrected finding above is visible to a
real visitor — and to write "not established" honestly if it could not be. **It can: established, by both a
direct measurement and a screenshot, not a guess.**

**The measurement.** §1.3 already gives it: the same word ("Two"), scrolled into view and allowed to settle,
went from `clientHeight 67 / scrollHeight 130` to `clientHeight 67 / scrollHeight 67` — zero overflow, not
reduced overflow. A visitor never sees a heading in its pre-entrance `pending` position; by definition they
only see it once it has scrolled into their viewport, at which point `useInView` has already fired and the
translate has already resolved.

**The screenshot.** Two, both committed as evidence, both a **real viewport screenshot at a real scroll
position** per this project's own evidentiary standard (not an element screenshot of a masked container):

- `wordspan-rest-desktop-1440.png` / `wordspan-rest-phone-390.png` — the hero headline "The wild and the
  calm, held together" at page load, 1440×900 and 390×844. This heading is in view at mount (`useInView`
  resolves immediately, per `SplitLines.tsx`'s own comment: "a headline already on screen at mount is left
  entirely alone"), so it was never in the `pending`/translated state at all — confirmed by its own
  `clientHeight === scrollHeight` reading (109/109 at 1440, 49/49 at 390) before this probe ever touched it.
  Both screenshots show the descenders on "calm," "held" and "together" fully intact — no cropping, no
  visible mask edge.
- `wordspan-scrolled-settled.png` — `01 · The Lodges`' heading, "Two forests, known deeply," AFTER being
  scrolled into view and allowed to settle (the same element measured at `scrollHeight 67` post-settle
  above). Every letter and every descender ("deeply"'s "y") renders cleanly; nothing is cut off.

Captured with `scripts/_scratch_probe_wordspan_rest.mjs` and `scripts/_scratch_probe_wordspan_scrolled.mjs`
— throwaway Playwright probes, run then deleted before commit (this project's own established convention
for a one-off investigative capture; their PNG/JSON output is the retained evidence,
`wordspan-rest-metrics.json` alongside them). Both against the same production server
(`npx next start -p 3100`), never `next dev`.

**Conclusion: visually inert, confirmed rather than assumed.** The 1,376 word-span "clips" this rig counts
are a measurement artefact of the rig never scrolling — not a defect a visitor can ever encounter, and not
the same mechanism as `.drift-frame`'s permanent, by-design oversize (§1.3). No product change follows from
this: there is nothing to fix. The `RoomCardStack`'s 49 genuine clips (§1.4) are unaffected by this finding
and remain a real, open item.

### 1.6 The confirmed real finding: the park map's labels do not scale at all

Every route's `nonScaling` count (the number of visible text-bearing elements whose computed `font-size`
is byte-identical before and after the root scale changes) was stable across every re-run — unlike the
clip/intersection totals (§1.9). On the property routes, `nonScaling` at 390–1024px is **18–19** (Mahua
Vann) and **32–39** (Mahua Tola), and **every sampled element is a `<text>` inside the property map's `<svg>`**
— `"Turia Gate"`, `"Karmajhiri Gate"`, `"Kolara"`, `"Moharli"`, etc. `PropertyMap.tsx`'s own
`LABEL_TEXT_SIZE` declares each tier as a literal Tailwind `text-[Npx]` class (e.g.
`"text-[24px] sm:text-[17px] md:text-[13px] lg:text-[11px]"`); an SVG `<text>` sized this way resolves
inside the ancestor `<svg viewBox>`'s own coordinate system, not as a real CSS pixel — so it never responds
to a visitor's OS-level text-size setting, at any width. **This is the real, confirmed finding the brief
asked for. It is not fixed here** — `PropertyMap.tsx`'s own comments record a long, hard-won history behind
its label sizing, and a fix belongs in its own task with its own review (see `CLAUDE.md`'s own instruction
to that effect).

### 1.7 A secondary, narrower non-scaling class: `clamp(rem, vw, rem)` headlines

While tracing §1.6's `nonScalingSample`, the home page showed a small number of ordinary headline words
(not the map) also failing to scale — but **only at specific widths**:

```
home @ tablet-768:  nonScaling = 0
home @ tablet-1024: nonScaling = 7  — "The" "wild" "and" "the" "calm," "held" "together", all 67.58px unchanged
home @ zoom-150:    nonScaling = 11 — the same 7, plus "Mahua" "Vann" "Mahua" at 44.16px unchanged
home @ zoom-200:    nonScaling = 0
```

**Minor, fix round 1: the `zoom-150` row's own sample only lists 10 words against a stated count of 11.**
That is `nonScalingSample`'s own pre-existing 10-item cap (`scripts/check_responsive.mjs`, the
`nonScalingSample.length < 10` guard), not a miscount or a fabricated word — the true count (`nonScaling`)
is always the authoritative figure and is what is quoted above; the sample is capped and, at `zoom-150`,
sits one below the true count.

Traced to `components/ui/TwoToneHeading.tsx`, whose `chapter`-size class is
`text-[clamp(2rem,4.2vw,3.5rem)]` (the `close` size is `clamp(2.4rem,5vw,4.4rem)`). A CSS `clamp()`'s
minimum and maximum are `rem` (and so scale with the root font-size), but **its middle/preferred term here
is `vw`-only** — at a viewport width where that `vw` value sits between the `rem`-derived min and max, the
*rendered* size tracks the **viewport width**, not the visitor's text-size setting, and is therefore no
different from a fixed `px` declaration for accessibility purposes at that width. Confirmed directly: the
same words render at the exact same px value before and after the 150% scale is applied, at 1024 and 960
width, but scale correctly at every other measured width (768, 390, 720). This is a **third, narrower**
category — distinct from the map (never scales, at any width) and a flat `px` class (never scales, at any
width): "sometimes non-scaling, and which widths depends on the specific `clamp()` bounds." **Not fixed
here** — recorded as a finding; see §1.8 for the full count of where this pattern occurs.

### 1.8 The static count: how many font sizes are declared in `px` rather than `rem`

A code-level count across every `.tsx`/`.ts` file (`grep`, not a runtime measurement — this is the
complementary static half of the brief's ask):

**Pure `px` font-size declarations: 15, across 2 components.**

| Component | Declaration |
|---|---|
| `components/ui/BrandMark.tsx` (header wordmark) | `text-[10px] min-[360px]:text-[11px] min-[400px]:text-[13px]` — 3 values |
| `components/sections/PropertyMap.tsx` (`LABEL_TEXT_SIZE`) | `emphasis`: 24/17/13/11px · `normal`: 22/16/12/10px · `lodge`: 26/18/14/12px — 12 values |

These **never** scale with a visitor's OS text-size setting, at any width — confirmed for the map in §1.6;
the wordmark's `nonScaling` count on the home page (1 element at every phone/landscape shape, the
`"Mahua Resorts"` link) confirms the same for `BrandMark`.

**Mixed `clamp(rem, vw, rem)` declarations: 19, across 8 components** — these scale *conditionally* (§1.7):
`TwoToneHeading.tsx` (2), `SiteMenu.tsx` (3), `FullBleedQuote.tsx` (2), `ExperienceCard.tsx` (2),
`LodgePanels.tsx` (6), `LodgeCards.tsx` (1), `JunglesBand.tsx` (1), `Hero.tsx` (2).

**Everything else** site-wide uses Tailwind's named `rem`-based scale (`text-xs`…`text-3xl`) or a bracket
`rem` value (`text-[1.05rem]`, `text-[0.62rem]`, etc.), and scales correctly — confirmed by `nonScaling`
reading 0 or 1 (the wordmark alone) across the 118–178 text-bearing elements checked per shape on the home
page, outside the categories above.

Command used for the static count: `grep`-equivalent search across `components/**/*.tsx` for
`text-\[[^\]]*px[^\]]*\]` (pure px) and `text-\[[^\]]*clamp[^\]]*\]` (mixed clamp), cross-checked against
`fontSize\s*[:=]|font-size\s*:` across `.tsx`/`.ts`/`.css` (zero hits beyond two doc-comment mentions in
`PropertyMap.tsx` — no component sets `style={{ fontSize: … }}` and no CSS file declares a literal
`font-size`).

### 1.9 A caveat on the headline number itself: assertion 6's raw total is not perfectly stable run-to-run

Two consecutive runs against the **same, unrebuilt production build**, same rig, same command (only the
`--out` path differing) produced:

```
node scripts/check_responsive.mjs --port 3100 --baseline docs/reviews/2026-08-27-mobile/after-pager-fixround1.json --out docs/reviews/2026-08-27-mobile/responsive-task5-variance-run.json
  → assertion 2: 54, assertion 3: 21, assertion 6: 1,976  (total 2,051)

node scripts/check_responsive.mjs --port 3100 --out docs/reviews/2026-08-27-mobile/responsive-task5.json
  → assertion 2: 54, assertion 3: 21, assertion 6: 2,414  (total 2,489)
```

Assertions 2 and 3 (both pure geometry) were **byte-identical** across both runs. Only assertion 6 varied —
by about 18%. This is very likely a font-loading/reflow timing race: assertion 6 sets
`document.documentElement.style.fontSize` and re-measures layout immediately afterward, across ~200
candidate elements per page, and if a web font finishes swapping in mid-measurement on one run but not the
other, clip/intersection counts would shift without anything in the page or rig actually changing. **This
is flagged as an instrument-reliability caveat, not chased to a fix** — a fix (e.g. waiting on
`document.fonts.ready` before every measurement) would be a rig change beyond this task's mandate, and
deserves its own look rather than a guess bundled in here. **2,414 is the figure quoted throughout this
document** (the second, later run, on the final committed `check_responsive.mjs`) — but do not treat it as
more precise than ±~440 until that timing question is settled.

---

## 2. Landscape phones — 844×390

### 2.1 Every assertion, per route

From the same `responsive-task5.json` run, the `phone-landscape` shape:

| | `/` | `/mahua-vann` | `/mahua-tola` |
|---|---|---|---|
| **1. Overflow** | 0px ✓ | 0px ✓ | 0px ✓ |
| **2. Target size (24×24)** | 0 under-24 ✓ (22 checked, 18 under-44 warning) | 0 under-24 ✓ (28 checked, 17 under-44) | 0 under-24 ✓ (26 checked, 17 under-44) |
| **3. Overlap** | 0 pairs | **3 pairs** — all `RoomCardStack` gallery links (`#room-gallery-vann-rooms-*`), the pre-existing, client-approved recede overlap | **6 pairs** — same mechanism, `#room-gallery-tola-rooms-*` |
| **4. Type floor** | no regression vs. baseline | no regression | no regression |
| **5. Zoom policy** | PASS (no `maximum-scale`/`user-scalable=no`) | PASS | PASS |
| **6. OS text scaling** | 0 genuine-new clips; 0 genuine-new intersections | 0 genuine-new clips; 6–10 genuine-new intersections (150%/200%) | 0 genuine-new clips; 7–14 genuine-new intersections |

**Assertion 3's 9 total pairs are the same, pre-existing room-card-stack recede mechanism already
identified in the Task 1 baseline** (client ruling: leave the stack alone) — confirmed present at this
specific shape too, not a new kind of overlap. **Assertion 6's room-card text-clipping defect (§1.4) does
not manifest at this width** — 844px is wide enough for the card's text column that its fixed-height budget
holds even at 150%/200% scale; the defect is narrower-viewport-specific.

**Fix round 1 correction:** this row originally read "7–14"/"9–16 real intersections", using
`intersectionOtherCount` (word-span split only, no rest-state check). With §1.4's new
`intersectionGenuineNewCount` (the same rest-state check now applied here), the true genuinely-new counts
are lower — **6–10** (Vann) and **7–14** (Tola) at 150%/200% — because some of these pairs (mostly the
map's own label × label pairs, per §1.4) already intersect at rest and are not a scaling effect at this
shape either.

### 2.2 Screenshots — opened, not assumed

Command: a Playwright script driving `viewport: {844, 390}`, `isMobile`/`hasTouch: true`, `deviceScaleFactor:
3`, waiting 2.7s for the welcome screen to clear (matching Task 3/4's own convention) plus a settle, then a
**viewport screenshot at a real scroll position** — never an element screenshot of a sticky container.

**Top of page, all three routes** (`landscape-{home,vann,tola}-top.png`): the hero holds up well at this
shape — headline, subhead, CTA pill and the "the journey begins" mark all sit fully inside the 390px height
with room to spare, no chrome overlap, no clipped type. **Good.**

**A real finding, confirmed by screenshot: the property map chapter leaves several near-empty screens of
scroll at this shape.** Scrolling through `vann-where`/`tola-where` at 844×390 (`landscape-{vann,tola}-map-
{15,40,65,90}.png`, sampled at four points through the chapter's own height):

- at 15% through the chapter: the "getting there" facts (heading + two rows) — reasonably filled
- **at 40% through the chapter: the legend list alone — 6–7 short rows in the top-left corner, the
  remaining ~80% of the 390px-tall viewport bare cream** (`landscape-vann-map-40.png`,
  `landscape-tola-map-40.png`)
- at 65–90%: the drawn map itself (gates, reservoir, compass) — reasonably filled

**Why**: below Tailwind's `lg` breakpoint, `PropertyMap.tsx`'s grid (`grid-cols-1 lg:grid-cols-12`) stacks
the facts/legend column and the map `<svg>` column **vertically, each full width** — a composition built for
a *tall, narrow* phone, where the legend's fixed height is a small fraction of an 844px-tall viewport.
At **844×390** (short and wide), the same legend content is now the largest thing on screen for a stretch of
scroll, because the map `<svg>` below it cannot appear until the legend has fully scrolled past. Unlike
`Hero.tsx`, `FullBleedQuote.tsx` and `Invitation.tsx` — which already use `short:` to compact exactly this
situation — `PropertyMap.tsx`'s legend column has **no `pocket:`/`short:` treatment at all**, confirmed by
reading its own source (`components/sections/PropertyMap.tsx`, the `<ul className="mt-8 space-y-2">` legend
block and the `dl` facts block above it — neither carries a `pocket:` or `short:` class).

**Not a hard defect** — nothing overlaps, clips, or becomes unreachable, and assertion 1 (overflow) and
assertion 3 (overlap) both pass here — but it is exactly the density/pacing weakness `pocket:`/`roomy:` were
written for, on the one chapter that has never been given that treatment. **Not fixed here**: the global
constraints for this whole body of work forbid changing any composition that measures sound and forbid any
visible-design change at any width; this is recorded as a finding for a follow-up task (a `pocket:`-scoped
compaction of `PropertyMap`'s legend/facts column, the same shape as the fix already applied to `Plate.tsx`,
`Hero.tsx`, `FullBleedQuote.tsx` and `Invitation.tsx`).

Deeper screenshots (`landscape-{home,vann,tola}-deep.png`, ~55% down the page) show content-rich, well-filled
screens on all three routes — cards, photographs, headings — no stranding there.

---

## 3. Why tablet-1024 shows more small type than tablet-768

### 3.1 The figures, traced rather than assumed

From `responsive-task5.json`, the `under12Count`/`under12MapCount` diagnostic added to assertion 4 this task
(additive — see `scripts/check_responsive.mjs`'s own comment on it): every visible, text-bearing element
whose computed font-size reads under 12px, and the subset of those sitting inside an `<svg>` (the only SVG
text on any of these three routes is the property map's).

| | 768 (`under12Count` / `under12MapCount`) | 1024 (`under12Count` / `under12MapCount`) | Δ total | Δ map |
|---|---|---|---|---|
| `/` (no map) | 23 / 0 | 23 / 0 | **0** | **0** |
| `/mahua-vann` | 43 / 0 | 60 / **17** | +17 | **+17** |
| `/mahua-tola` | 39 / 0 | 70 / **31** | +31 | **+31** |

**The entire increase, on both property routes, is exactly accounted for by the map's own `<svg>`.** 43→60
is +17, and `under12MapCount` goes from 0 to 17 — the same number. 39→70 is +31, and `under12MapCount` goes
from 0 to 31 — the same number again. Nothing outside the map moved.

### 3.2 The control arm

The home page carries no `PropertyMap` at all, and its `under12Count` is **flat — 23 at both 768 and 1024**.
If the jump were caused by something general to the `lg` breakpoint itself (a shared component, the header,
the booking bar), the home page would show it too. It does not. This rules out a page-wide or
breakpoint-general cause and narrows the mechanism to something that exists only on the two routes that
differ from the home page: the property map.

### 3.3 The mechanism, confirmed in the source

`PropertyMap.tsx`'s `declutterMobile` pass hides `village`/`road`-kind labels **unconditionally** below `lg`,
and additionally drops any colliding `gate`/`zone`/`water` label — all via
`className={declutter ? "hidden lg:inline" : undefined}` on each label's `<g>`. Tailwind's `lg` breakpoint
is the unmodified default, `min-width: 1024px` — confirmed by `app/globals.css`'s `@theme` block, which
carries no `--breakpoint-lg` override — so `lg:inline` activates **at exactly tablet-1024's own width**.

At the same breakpoint, `LABEL_TEXT_SIZE`'s four tiers get **smaller**, not bigger, at the top:

```
emphasis: text-[24px] sm:text-[17px] md:text-[13px] lg:text-[11px]
normal:   text-[22px] sm:text-[16px] md:text-[12px] lg:text-[10px]
lodge:    text-[26px] sm:text-[18px] md:text-[14px] lg:text-[12px]
```

Below `lg` (at 768, the `md:` tier applies): 13/12/14px — **none under 12**. At `lg` (1024 and up): 11/10/
12px — **two of three kinds under 12**. So two things happen at the exact same width, simultaneously: every
previously-hidden label (village, road, and anything the collision pass had dropped) is un-hidden by
`lg:inline`, **and** the surviving labels' own type shrinks from the md tier to the lg tier — both landing
squarely in "under 12px," and both confined to the map's own `<svg>`, which is exactly what §3.1's clean
delta shows.

### 3.4 Conclusion

**Established, not merely hypothesised.** The mechanism is confirmed three ways: (a) the delta in
`under12Count` and `under12MapCount` match exactly on both property routes, (b) the home page's identical
breakpoint crossing produces zero change (control arm), and (c) the source code names the precise
class-string mechanism (`hidden lg:inline` plus the `LABEL_TEXT_SIZE` tier table) that produces it, at the
one width where Tailwind's own `lg` breakpoint takes effect. **Not fixed here** — this is the same map
component `CLAUDE.md` names a long, hard-won history for, and a change belongs in its own task.

---

## Commands used, for re-derivation

```bash
npm run build
npx next start -p 3100

node scripts/check_responsive.mjs --port 3100 \
  --baseline docs/reviews/2026-08-27-mobile/after-pager-fixround1.json \
  --out docs/reviews/2026-08-27-mobile/responsive-task5.json

# the variance check (§1.9) — same command, run twice against one unrebuilt build,
# the second time with a different --out and no --baseline:
node scripts/check_responsive.mjs --port 3100 \
  --out docs/reviews/2026-08-27-mobile/responsive-task5-variance-run.json
```

Screenshots (§2): a Playwright script (not committed — throwaway, per this project's own convention for a
one-off investigative capture; the PNGs it produced are committed as the evidence) driving
`viewport: {844, 390}`, `isMobile`/`hasTouch: true`, `deviceScaleFactor: 3`, against the same production
server.

**Fix round 1 (28 Aug 2026) — after the additive rig changes in §1.3/§1.4, re-run against a fresh production
build:**

```bash
npm run build
npx next start -p 3100

node scripts/check_responsive.mjs --port 3100 \
  --baseline docs/reviews/2026-08-27-mobile/after-pager-fixround1.json \
  --out docs/reviews/2026-08-27-mobile/responsive-task5-fixround1.json

# same-server stability check, no --baseline:
node scripts/check_responsive.mjs --port 3100 \
  --out docs/reviews/2026-08-27-mobile/responsive-task5-fixround1-variance.json
```

The visual-inertness probes (§1.5), both throwaway Playwright scripts run then deleted before commit, their
PNG/JSON output committed as evidence, against the same production server:

```bash
node scripts/_scratch_probe_wordspan_rest.mjs      # wordspan-rest-{desktop-1440,phone-390}.png, wordspan-rest-metrics.json
node scripts/_scratch_probe_wordspan_scrolled.mjs  # wordspan-scrolled-settled.png
```

## Files in this directory from this task

- `responsive-task5.json` — the original run (2,489 findings: 54/21/2,414); §2 and §3's figures are still
  read from it (neither section's own measurement changed in fix round 1).
- `responsive-task5-variance-run.json` — the original task's own variance check, cited in §1.9 only.
- `responsive-task5-fixround1.json` — **the current canonical run for §1.3/§1.4's corrected figures**
  (identical totals to `responsive-task5.json` — 54/21/2,414 — the fix round added fields, not a different
  measurement).
- `responsive-task5-fixround1-variance.json` — a same-server re-run confirming every fix-round-1 figure,
  including the new `intersectionAtRestCount`/`intersectionGenuineNewCount` fields, reproduced byte-for-byte.
- `wordspan-rest-desktop-1440.png`, `wordspan-rest-phone-390.png` — the hero headline at rest, 1440×900 and
  390×844, evidence for §1.5.
- `wordspan-rest-metrics.json` — the raw computed-style/geometry dump behind §1.5's numbers.
- `wordspan-scrolled-settled.png` — `01 · The Lodges`' heading after being scrolled into view and settled,
  evidence for §1.5.
- `landscape-{home,vann,tola}-{top,mid,deep}.png` — real viewport screenshots at 844×390, real scroll
  positions.
- `landscape-{vann,tola}-map-{15,40,65,90}.png` — the property map chapter sampled across its own height at
  844×390, evidence for §2.2's finding.

## What this task did NOT fix, and why

**One finding from the first pass turned out not to need fixing at all** — established, not assumed: the
`[data-word]` entrance-mask overflow that accounted for 1,376 of assertion 6's clips and most of its
word-span intersections is confirmed visually inert (§1.5). It is a rig artefact (this rig never scrolls),
not a defect; no product change follows from it.

Four genuine findings remain, all deliberately left alone:

1. **The room card stack's text clips at 150%/200% OS text scale** (§1.4) — touches `RoomCardStack`/
   `RoomCard`, which this plan's file structure lists as deliberately untouched, and the client's 27 Aug
   ruling was to leave that stack alone.
2. **`PropertyContact`'s email/address block wraps into itself at 150%/200% OS text scale** (§1.4, new in
   fix round 1 — confirmed genuinely scaling-caused, zero of its 18 findings are at rest) — no product code
   was touched by this task per its own brief; recorded for a follow-up task.
3. **The property map's legend leaves near-empty screens at 844×390** (§2.2) — would need a `pocket:`
   compaction of `PropertyMap.tsx`'s facts/legend column; forbidden by this plan's own "no change to any
   composition that measures sound" and "the visible design must not change at any width."
4. **The property map's labels never scale with OS text size, grow the small-type count at `lg`, and
   already intersect each other at rest 70 times over** (§1.6, §1.4, §3) — `PropertyMap.tsx`'s own comments
   record a long, hard-won history behind its label sizing; `CLAUDE.md` says explicitly that a fix belongs
   in its own task with its own review.
