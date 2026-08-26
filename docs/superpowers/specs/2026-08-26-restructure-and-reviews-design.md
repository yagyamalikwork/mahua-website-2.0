# The restructure, and the reviews widget — design

**Status:** approved by the client, 26 August 2026. Ready to plan.
**Branch:** `feat/journal-and-mobile`.
**Order:** this is **B**, the first of the three bodies of work agreed on 26 Aug — see
[`2026-08-26-journal-page-design.md`](2026-08-26-journal-page-design.md) §12 for the other two and why they
run in this order.

> **This document invents no copy.** Where a heading must be renamed, the client's own words are quoted.
> Where new words are needed and he has not supplied them, §8 says so rather than filling the gap.

---

## 1. What this is

Eleven changes across three pages, all of them the client's, given on 26 August 2026. None is a design
question we are answering for him — every one is a ruling we are carrying out. The value of this document
is that it records **what each change costs elsewhere**, because three of them move numbers that
non-negotiables bind.

---

## 2. Home page

### 2.1 The tiger comes off `05 · Experiences`

Client: *"Remove the tiger from 'The Experience' section, hence removing the big gap between the activities
and the text for this section."*

**The gap is structural, not padding, and both halves must change.** `ExperienceStrip.tsx`'s header band is
`lg:grid-cols-12` split 7/5 — copy in `lg:col-span-7`, the film in `lg:col-span-5` through the `figure`
slot. Removing the film leaves the five columns behind it, empty. So:

- `app/page.tsx` stops passing `figure` to `ExperienceStrip`.
- The header band collapses to one column. The chapter mark, heading and paragraph take the full measure.
- The `figure` prop and `.experience-figure` are removed from the component, not left dangling — nothing
  else has ever passed it.

**The film is unmounted, not deleted.** `components/signature/SignatureFilm.tsx`, `/media/tiger-film.mp4`,
its poster and `scripts/check_films.mjs` are untouched, exactly as the lantern, the potter's film and the
hornbill tint were handled when the v2 restructure dropped them (`app/page.tsx`'s own comments record all
three). `feat/image-sizing` still ships it.

**Consequence, recorded so it is not read as a regression:** `scripts/check_films.mjs` asserts two films.
The potter left this branch on 19 Aug; the tiger leaves now. **The rig will have nothing to check and will
fail on this branch. That failure is the client's ruling.** It must be stated in `CLAUDE.md` and
`DECISIONS.md` at the same commit, or the next session will "fix" it.

**Density:** the film is counted by `measure_density.mjs`'s coverage pass as a `<video>`. Removing it takes
imagery out of `field-days`, and closing the band takes height out. The net is not predictable from the
armchair — **measure it**. `field-days` currently reads 27.0% mean / 31.1% worst against a 45% ceiling, so
there is margin, but a removal on this project has form for leaving a hole the shape of what it removed.

### 2.2 The Elfsight widget replaces the review carousel

Client supplied the embed:

```html
<script src="https://elfsightcdn.com/platform.js" async></script>
<div class="elfsight-app-9735be0a-7667-475d-938e-2de773f1c7de" data-elfsight-app-lazy></div>
```

**Retired outright**, one week after shipping: `components/sections/ReviewCarousel.tsx` (both
`ReviewCarousel` and `ReviewPanels`), `lib/reviews.ts` and its tests, `REVIEWS` in `lib/motion.ts`,
`app/globals.css`'s `.reviews*` block, `scripts/check_reviews.mjs`, and `content/home.ts`'s three
placeholder `quotes` with their `GuestQuote` type.

**This also answers an open client question rather than leaving it open.** `REVIEWS.mode` was built with
two arms — `loop` and `settle` — precisely so he could choose on the real page, and non-negotiable #5
carries a dated exception for the loop pending that ruling. **The widget supersedes the question. The
exception, and the only perpetual motion on this site, goes with it** — unless the widget itself
auto-scrolls, which is §2.3.

**One component, three mount points.** The same embed is needed on `/`, `/mahua-vann` and `/mahua-tola`, so
it is one component taking the app id as a prop, and the script tag is loaded **once** per document however
many widgets are on the page — two on a property page would otherwise inject it twice.

### 2.3 What must be measured about the widget before it is called done

Not optional, and not by eye:

1. **`npm run verify:budget`.** This is third-party JavaScript on a page where 537 ms was bought back by
   deferring two image posters. `data-elfsight-app-lazy` and `async` should keep it out of the first load —
   *should*. Measure the delta at 390 and 1440.
2. **`measure_page.mjs`** — initial transfer still under 1.5 MB, hero `responseEnd` not worsened.
3. **Does it auto-scroll?** If it does, non-negotiable #5 is live again and it is the client's call whether
   it stays. Report the fact; do not decide it.
4. **Does it read as foreign on cream?** The widget brings its own typography, its own white cards and
   Tripadvisor's own green. Non-negotiable #3 is that cream is the page. Screenshot at 390 / 768 / 1440 /
   1920 and put it in front of the client rather than judging it alone.
5. **No-JavaScript behaviour.** The widget renders nothing without script. The section must not collapse to
   a bare heading over emptiness — decide a still state, as everything decorative on this site already has.

**One risk that cannot be measured away, recorded rather than solved.** `platform.js` is loaded from
Elfsight's CDN with no Subresource Integrity hash, which means the site executes whatever that CDN serves,
on every page, forever. SRI is the usual answer and **it is not available here**: a widget platform script
is updated by its vendor without notice, and pinning a hash would break the widget the first time they
shipped a change. This is the ordinary bargain of every third-party embed and the client has chosen the
embed, so it is accepted — but it is the first third-party script on this site, and it is worth knowing
that it is a trust relationship rather than a dependency. Two things keep it bounded and both should be
done: load it **only on the pages that use it**, never from `app/layout.tsx`, and keep `async` +
`data-elfsight-app-lazy` so it cannot block the first screen.

---

## 3. Property pages — the new spine

| Mahua Vann | | Mahua Tola |
|---|---|---|
| hero | | hero |
| **01 · The Forest** | | **01 · The Reserve** |
| *map — no heading, continues 01* | | *map — no heading, continues 01* |
| — | | ~~guest-quote band~~ **removed** |
| **02 · The Rooms** | | **02 · The Rooms** |
| ~~04 · The Table~~ **removed** | | ~~04 · The Table~~ **removed** |
| **03 · The Experience** — home's cards | | **03 · The Experience** — home's cards |
| **04 · Written About** + widget | | **04 · Written About** — widget only |
| Stay at Mahua Vann | | Stay at Mahua Tola |

### 3.1 Three full-bleed quote bands are removed (4a)

- Vann `vann-table` — *"Chulai ki Bhaaji, Mahua Kheer, and whatever the season gives…"*
- Tola `tola-guest-word` — *"One of the best forests for seeing tigers…"*
- Tola `tola-table` — *"Maharashtrian specialities and whatever the day brings fresh…"*

Their `quoteCopy` entries go with them. **`FullBleedQuote` becomes unrouted** — nothing on any page renders
a `fullBleed` chapter with a `quoteCopy` entry afterwards. It is **not deleted**: the `fullBleed` *shape*
is still what both heroes use, and an unrouted component with a known good scrim is the cheap way back if
the client changes his mind. Record it as unrouted, as `LodgeCards` already is.

**Three photographs are released** and become curated-but-unused. They are **not** to be quietly re-used
somewhere to "keep the density up" — `measure_density.mjs` scores what is painted, and a chapter that needs
imagery needs a composition, not a photograph parked in it.

**This is the change most likely to break a rule, and there are three to re-check:**

- **Non-negotiable #8, the 45% empty-space ceiling.** Three photograph bands leave three holes. Re-measure
  both routes. `vann-press` and `tola-reserve` were *already* over the ceiling before this
  (`DECISIONS.md` §5) — do not let this change be blamed for, or hide behind, a pre-existing failure.
  Measure at the commit before as well as after.
- **Non-negotiable #10, alternate the rhythm** — never two consecutive text-only screens.
- **`findRepeatedShape`** in `content/property-chapters.ts` — no two adjacent chapters may share a shape.
  The new spine is `column → map → showcase → strip → press → invitation`, which passes, but the test is the
  authority, not this table.

### 3.2 The map loses its heading (4b)

Client: *"the map is an extention to the first sections on both the pages 01-The Forest and 01-The Reserve
respectively."*

`vann-where` and `tola-where` drop their `number` and `label`. Both `PropertyMap` and `PressBand` already
render `ChapterMark` behind `chapter.number && chapter.label`, so this is a content edit.

**Decided rather than asked, and stated to the client:** *extension of* has a precedent on this site with a
defined meaning. On 19 Aug the client ruled that `04 · Mahua Philosophy` is *"an extension of an already
existing section"*, and `app/page.tsx`'s `continues` implements exactly two things — the second chapter
stands on the **same cream** as the first, and the two meet with **no band of cream between them**. The map
gets the same treatment, so it reads as part of 01 rather than as an unlabelled orphan.

Note the knock-on `app/page.tsx` already documents: a chapter that continues does **not** advance the cream
alternation, so every cream chapter below it keeps its surface. Check the property pages' own `cream++`
counter in `PropertyPage.tsx` does the same, or the surfaces below the map flip.

### 3.3 Renumbering and renaming (4c, 4e)

`03 · The Rooms` → **`02 · The Rooms`**. `05 · The Day` → **`03 · The Experience`** (renamed as well as
renumbered). `06 · Written About` → **`04 · Written About`**.

The `ChapterMark` label changes; each property's own `heading` (the `TwoTone` in `pairCopy`) is a separate
string and is covered by §3.4.

### 3.4 The activities become the home page's carousel (4d)

Client: *"remove all the activities we have in listed in the '05-The Day' sections … and replace it with the
exact same copy-pasted activities carousel from our homepage. The activities will be changed later for now
just place the entire carousel as it is."*

**Cards only — each property keeps its own heading and intro.** Asked directly, the client chose this over
copying the whole section. The reasoning he was given: Vann's intro names Turia Gate, Kohka Lake and the
Pachdhar potters' wheel, Tola's names its own, and three pages opening on identical sentences is the
*"very wordpress and templaty"* verdict that started the property redesign.

**The refactor this needs.** `ExperienceStrip` today reads `chapterCopy(chapter.id)` and `HOME.strip`
directly — it is a home-page component. To serve three pages it takes its copy as **props**, and
`app/page.tsx` passes the home page's. That is the architecture rule this repo already has (content in
`content/`, components take what they render), not a new pattern.

**`ExperiencePair` becomes unrouted** and `PropertyShape` gains `"strip"` and loses `"pair"`. Leaving a
`"pair"` in the union that nothing renders is a shape the next reader will believe in.

**The trap, and it has cost a day on this project before.** `CARD_SCRIM`'s six figures are solved **per
photograph at a specific card size** — `ExperienceStrip.tsx`'s own comment records the same pair measuring
4.64:1 on a 300px card and **7.33:1** on a 340px one, and separately records one card failing at 3.30:1
because a 23px narrower card wrapped a sentence and moved a line of type 24px. **If a property page renders
these cards at any other size, every one of the six is a fresh solve.** Run
`check_contrast_over_photos.mjs` on all three routes at every width from 360. The cheap answer is to make
the property strip render at the same card size as the home page's; then, and only then, the figures carry.

### 3.5 Written About, on both pages (4e)

**Vann:** renumbered to `04`, its three articles unchanged, the reviews widget below them.

**Tola:** a **new** `press` chapter with the same heading and the widget, and **no articles**.

**"Written About" on both, by the client's own choice.** He was told what it means — Tola has no press
mentions, and the section was deliberately left off that page because inventing three would have been
fabrication (`content/mahua-tola.ts` records exactly that reasoning at line 15) — and was offered a rename
covering press and reviews together. He chose to keep the name. So Tola's `04 · Written About` is a heading
over guest reviews, which is loose but defensible, and it is a ruling rather than an oversight.

**`PressBandCopy.articles` must therefore become optional**, and the component must render a heading and the
widget with no article list without collapsing. That is a real code change, not a content one.

### 3.6 The closing CTA (4f) — deferred, by the client

Client: *"we need to work on our CTA the 'Stay at Mahua Vann/Tola' section as it looks very bland and not at
all appealing, but we'll do that in the last once we are done with everything above."*

**Explicitly out of scope for this plan.** It is a design question needing its own brainstorm, and it is
sequenced last by the client. Nothing in this work may change the invitation chapter beyond what
renumbering above it forces.

---

## 4. What comes out of the repository

| Retired | Why |
|---|---|
| `ReviewCarousel.tsx`, `lib/reviews.ts` (+tests), `REVIEWS`, `.reviews*` CSS, `check_reviews.mjs` | replaced by the widget (§2.2) |
| `content/home.ts` `quotes` / `GuestQuote` | the placeholder reviews they held |
| Three `quoteCopy` entries | §3.1 |
| `ExperiencePair.tsx` (+test), `"pair"` shape | replaced by the strip (§3.4) |
| `figure` prop, `.experience-figure` | the tiger's slot (§2.1) |

**Unmounted but deliberately kept:** the tiger film and its rig; `FullBleedQuote`.

---

## 5. What must be re-measured, on all three routes

No number in `docs/reviews/` may be quoted that a command in `scripts/` cannot re-derive. This work moves
enough that the following are **required**, not advisory:

| Rig | Why this change needs it |
|---|---|
| `measure_density.mjs` | three photograph bands removed, one film removed, one band recomposed (§2.1, §3.1) |
| `check_contrast_over_photos.mjs` | six card scrims possibly on a new card size (§3.4) — **every width from 360** |
| `check_experience_strip.mjs` | its 13 assertions must pass on all three routes now, not one |
| `verify:budget` + `measure_page.mjs` | third-party script (§2.3) |
| `check_image_resolution.mjs` | six photographs newly drawn on two more routes |
| `npm test` | `content/property-chapters.test.ts`'s shape and rhythm rules against the new spine |
| `check_docs.mjs` | CLAUDE.md and DECISIONS.md describe a page that has changed substantially |

**Screenshots at 390 / 768 / 1440 / 1920, read by a human**, for the widget on cream and for both
restructured property pages. This project's own record is that its worst two defects were found by opening a
picture, not by a rig.

---

## 6. What could go wrong, ranked

1. **The widget breaks a budget or the cream.** Third-party script and third-party styling, neither of which
   we control. Mitigation: measure early, in its own commit, before the restructure lands on top of it.
2. **The card scrims are wrong on the property pages.** Six illegible cards shipped for a day the last time
   this was assumed. Mitigation: same card size, then verify anyway.
3. **Density breaks on a property page.** Three holes. Mitigation: measure before and after, and recompose
   rather than pad — non-negotiable #8 is explicit that a section that cannot be filled is cut or merged.
4. **The next session "fixes" `check_films.mjs`.** Mitigation: §2.1's note, written into `CLAUDE.md` and
   `DECISIONS.md` in the same commit that unmounts the film.

---

## 7. Verification gate

`npm test`, `npm run build` and `npm run lint` green; `npm run verify:budget` passing; every rig in §5 run
and its output committed to `docs/reviews/2026-08-26-restructure/`; screenshots read. Nothing here is
claimed complete on the strength of the code looking right.

---

## 8. What is owed by the client

1. **A still state for the widget where JavaScript is off or the embed fails** — or agreement that the
   section simply does not render. §2.3 #5.
2. **A ruling on the widget's own motion**, if it turns out to auto-scroll. §2.3 #3.
3. Nothing else. Every string this work needs already exists, and the one new section (Tola's
   `04 · Written About`) reuses Vann's heading by his own choice.
