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
see §4 below) — assertion 6 (OS text scaling, at 1.5× and 2×, three routes × eight shapes): **2,414**.

### 1.2 How the artefact class was separated from the real findings — a code check, not a guess

`scripts/check_responsive.mjs` was changed **additively** (see its own updated header comment) to tag every
assertion-6 finding with what it actually is, using real DOM checks rather than reading the failure
message's text:

- **`isWordSpan`** — `el.closest("[data-word]") !== null`. `components/motion/SplitLines.tsx` wraps every
  headline word in its own `overflow-hidden` mask (`[data-word]`, with a nested `[data-line-inner]` that
  actually carries the word and moves). A root text-scale changing a word's glyph metrics by even a
  fraction of a pixel registers as "clips" or "intersects" on hundreds of near-identical one-word boxes at
  once.
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

**Nothing about which elements fail changed.** `clippedCount`/`intersectionCount` are byte-identical to what
the untagged rig would report; the new fields (`isWordSpan`, `wasClippedAtRest`,
`clippedWordSpanCount`/`clippedAtRestCount`/`clippedGenuineNewCount`,
`intersectionWordSpanCount`/`intersectionOtherCount`) are a strictly additive breakdown of the same total.
This is the rig seeing more, never a number coming out differently.

### 1.3 The split

| Class | Clips | Intersections | Total |
|---|---:|---:|---:|
| **Word-span artefact** (`SplitLines`'s per-word mask) | 1,376 | 506 | **1,882** (78%) |
| **Pre-existing-at-rest artefact** (`.drift-frame`'s by-design oversize) | 282 | — | **282** (12%) |
| **Real** | 49 | 201 | **250** (10%) |
| **Total** | 1,707 | 707 | **2,414** |

**The real count is 250, not ~2,400.** Arithmetic checks: 1,376 + 506 (word-span) + 282 (at-rest,
non-word-span) + 49 + 201 (real) = 2,414. ✓

### 1.4 What the 250 real findings actually are

All **49 genuine-new clips** are the same defect: `RoomCardStack`'s `<li>` room cards clipping their own
text at 150%/200% root scale, on both property pages, across every room type sampled (Deluxe, Cottage
without/with Deck, Super Deluxe Cottage, Suite, Family Suite). Example:
`li "DeluxeHandmade in mud an" clips at 200% root text scale — scrollHeight 1164 over clientHeight 600`.
This is a real, substantive finding — the card's fixed-height text-reserve budget (`ROOM_STACK.textReserve`,
`CLAUDE.md` §17/§18) was solved for legibility at 100% root font-size and does not hold at 150%/200%. **Not
fixed here** — it touches the room card stack, which this plan's own file structure lists as deliberately
untouched, and the client's 27 Aug ruling was to leave that stack alone. **A finding for a follow-up task.**

Of the **201 real intersections**: 84 are the same room-card-text mechanism (paragraphs inside a card
growing into each other), 71 are **map label × map label** pairs (e.g. `text "Madnapur" × text "Tadoba
Lake"`), 18 are `PropertyContact`'s email/address block wrapping into itself, and 28 are further room-card
paragraph pairs a simple keyword filter didn't catch. **The 71 map-label pairs are noted, not fully traced**:
the map's own labels are confirmed (§1.5) never to change font-size under scaling, so their *mutual*
intersection under scale is plausibly a knock-on effect of other (correctly rem-scaling) content on the same
page growing and narrowing the map's own container — the SVG is `w-full` and its whole coordinate system,
labels included, scales with its rendered width. That causal chain was not independently confirmed within
this task's scope; recorded as an open question rather than an assertion.

### 1.5 The confirmed real finding: the park map's labels do not scale at all

Every route's `nonScaling` count (the number of visible text-bearing elements whose computed `font-size`
is byte-identical before and after the root scale changes) was stable across every re-run — unlike the
clip/intersection totals (§1.6). On the property routes, `nonScaling` at 390–1024px is **18–19** (Mahua
Vann) and **32–39** (Mahua Tola), and **every sampled element is a `<text>` inside the property map's `<svg>`**
— `"Turia Gate"`, `"Karmajhiri Gate"`, `"Kolara"`, `"Moharli"`, etc. `PropertyMap.tsx`'s own
`LABEL_TEXT_SIZE` declares each tier as a literal Tailwind `text-[Npx]` class (e.g.
`"text-[24px] sm:text-[17px] md:text-[13px] lg:text-[11px]"`); an SVG `<text>` sized this way resolves
inside the ancestor `<svg viewBox>`'s own coordinate system, not as a real CSS pixel — so it never responds
to a visitor's OS-level text-size setting, at any width. **This is the real, confirmed finding the brief
asked for. It is not fixed here** — `PropertyMap.tsx`'s own comments record a long, hard-won history behind
its label sizing, and a fix belongs in its own task with its own review (see `CLAUDE.md`'s own instruction
to that effect).

### 1.6 A secondary, narrower non-scaling class: `clamp(rem, vw, rem)` headlines

While tracing §1.5's `nonScalingSample`, the home page showed a small number of ordinary headline words
(not the map) also failing to scale — but **only at specific widths**:

```
home @ tablet-768:  nonScaling = 0
home @ tablet-1024: nonScaling = 7  — "The" "wild" "and" "the" "calm," "held" "together", all 67.58px unchanged
home @ zoom-150:    nonScaling = 11 — the same 7, plus "Mahua" "Vann" "Mahua" at 44.16px unchanged
home @ zoom-200:    nonScaling = 0
```

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
here** — recorded as a finding; see §1.7 for the full count of where this pattern occurs.

### 1.7 The static count: how many font sizes are declared in `px` rather than `rem`

A code-level count across every `.tsx`/`.ts` file (`grep`, not a runtime measurement — this is the
complementary static half of the brief's ask):

**Pure `px` font-size declarations: 15, across 2 components.**

| Component | Declaration |
|---|---|
| `components/ui/BrandMark.tsx` (header wordmark) | `text-[10px] min-[360px]:text-[11px] min-[400px]:text-[13px]` — 3 values |
| `components/sections/PropertyMap.tsx` (`LABEL_TEXT_SIZE`) | `emphasis`: 24/17/13/11px · `normal`: 22/16/12/10px · `lodge`: 26/18/14/12px — 12 values |

These **never** scale with a visitor's OS text-size setting, at any width — confirmed for the map in §1.5;
the wordmark's `nonScaling` count on the home page (1 element at every phone/landscape shape, the
`"Mahua Resorts"` link) confirms the same for `BrandMark`.

**Mixed `clamp(rem, vw, rem)` declarations: 19, across 8 components** — these scale *conditionally* (§1.6):
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

### 1.8 A caveat on the headline number itself: assertion 6's raw total is not perfectly stable run-to-run

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
| **6. OS text scaling** | 0 genuine-new clips; 0 real intersections | 0 genuine-new clips; 7–14 real intersections (150%/200%) | 0 genuine-new clips; 9–16 real intersections |

**Assertion 3's 9 total pairs are the same, pre-existing room-card-stack recede mechanism already
identified in the Task 1 baseline** (client ruling: leave the stack alone) — confirmed present at this
specific shape too, not a new kind of overlap. **Assertion 6's room-card text-clipping defect (§1.4) does
not manifest at this width** — 844px is wide enough for the card's text column that its fixed-height budget
holds even at 150%/200% scale; the defect is narrower-viewport-specific.

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

# the variance check (§1.8) — same command, run twice against one unrebuilt build,
# the second time with a different --out and no --baseline:
node scripts/check_responsive.mjs --port 3100 \
  --out docs/reviews/2026-08-27-mobile/responsive-task5-variance-run.json
```

Screenshots: a Playwright script (not committed — throwaway, per this project's own convention for a
one-off investigative capture; the PNGs it produced are committed as the evidence) driving
`viewport: {844, 390}`, `isMobile`/`hasTouch: true`, `deviceScaleFactor: 3`, against the same production
server.

## Files in this directory from this task

- `responsive-task5.json` — the final, canonical run (2,489 findings: 54/21/2,414), all §1–§3 figures above
  are read from it.
- `responsive-task5-variance-run.json` — the earlier run on the same unrebuilt build, cited in §1.8 only.
- `landscape-{home,vann,tola}-{top,mid,deep}.png` — real viewport screenshots at 844×390, real scroll
  positions.
- `landscape-{vann,tola}-map-{15,40,65,90}.png` — the property map chapter sampled across its own height at
  844×390, evidence for §2.2's finding.

## What this task did NOT fix, and why

Three genuine findings, all deliberately left alone:

1. **The room card stack's text clips at 150%/200% OS text scale** (§1.4) — touches `RoomCardStack`/
   `RoomCard`, which this plan's file structure lists as deliberately untouched, and the client's 27 Aug
   ruling was to leave that stack alone.
2. **The property map's legend leaves near-empty screens at 844×390** (§2.2) — would need a `pocket:`
   compaction of `PropertyMap.tsx`'s facts/legend column; forbidden by this plan's own "no change to any
   composition that measures sound" and "the visible design must not change at any width."
3. **The property map's labels never scale with OS text size, and grow the small-type count at `lg`**
   (§1.5, §3) — `PropertyMap.tsx`'s own comments record a long, hard-won history behind its label sizing;
   `CLAUDE.md` says explicitly that a fix belongs in its own task with its own review.
