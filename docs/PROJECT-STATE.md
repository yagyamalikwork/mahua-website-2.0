# Project state — 3 August 2026

Written as a handoff so no context is lost when a session is compacted. **Read this second**, after
`CLAUDE.md`.

## Where we are

**Branch `feat/chapters-rebuild`.** Executing
[`docs/superpowers/plans/2026-08-03-rebuild-chapters-layout.md`](superpowers/plans/2026-08-03-rebuild-chapters-layout.md)
— the rebuild after the client rejected the previous build.

| Task | State |
|---|---|
| 1 · Retire the day-arc | ✅ 996 lines removed |
| 2 · Harvest the live site's copy | ✅ `reference/site-copy.md` |
| 3 · Expand the image library | ✅ 14 → 35 images |
| 4 · The chapter sequence | ✅ 12 chapters, 32 distinct images |
| 5 · Scroll choreography | ✅ measured in a browser, see `docs/reviews/2026-08-04-motion/` |
| 6 · The copy | ✅ see `docs/copy-provenance.md` |
| 7 · Build the sections | ⬜ **next — stop here for review** |
| 8 · Verify against the complaints | ⬜ |

59 tests. `/` is a placeholder heading until Task 7.

**The motion vocabulary (Task 5).** `ImageReveal` (a mask wipes up off a photograph while it settles from
1.08 scale), `SplitLines` (headline lines rise from behind a mask, staggered per *visual* line, measured
after layout) and `StickyScene` (plain CSS `position: sticky`, clamped to three screens). All three are
**fail-safe by construction**: the server markup is the at-rest state, and script only ever moves things
out of view in order to bring them back — so no JavaScript, a thrown error, or reduced motion all leave the
page readable. Captured and measured in Chromium; see the review folder, which also records the one real
defect found (a flicker on headlines already on screen at load) and two false alarms worth not repeating.

**The spine (Task 4).** `content/chapters.ts` holds twelve chapters carrying **32 of the 34 curated
photographs**, none repeated, all four guideline categories present. Two are held in reserve
(`bonfire-dinner`, `pool-daylight-forest`). Two editorial calls worth knowing:
the hero is the **lantern-lit arrival**, not a tiger — every wildlife lodge in central India opens on a
tiger and almost none can open on that light, so the tiger is spent at full viewport two chapters later;
and **05 · The Rooms** is new, because the rejected build had no rooms chapter at all on a site selling
rooms. There is no village chapter: the library has one potter photograph and nothing else, so Pachdhar
folds into *02 · Rooted like the mahua* rather than being faked. That gap belongs on the shot list.

**Agreed working mode (Option C, 3 Aug):** proceed solo through Tasks 4–6, then **stop before Task 7** so the
page build — where design judgement matters most — gets the full implementer/reviewer treatment. Usage
limits have renewed, so subagents are available.

## The two builds that came before

Both are on branches and in git history; neither is live.

- **Plan 1** (`main`) — the seven-state scroll-through-a-day colour system. Client approved it at a preview
  gate.
- **Plan 2** (`feat/page-structure`) — nine content bands built on that system. **Client rejected it**: too
  few images, no perceptible scroll animation, too much empty space, no resemblance to the reference.

The day-arc was the root cause: band heights had to be derived from each band's share of the colour timeline
rather than from how much content it held, so heavy sections reserved three screens for a paragraph. Retired
3 Aug. Do not revive it.

## Client feedback that drives everything now (3 Aug, verbatim in substance)

1. Too few images · no scroll animation · too much empty space · no resemblance to Sujan.
2. **Take heavy inspiration from the Sujan homepage** — layout, scroll behaviour, image and text placement.
3. **Present the experience as a journey in chapters**, as the v3 fieldguide guidelines do.
4. **Use the existing mahuaresorts.com text and images** — both were under-used.
5. **Creative freedom over the guidelines.** Keep what is good, rework what is not, invent where neither the
   guidelines nor the reference serve us. Explicitly *not* line-by-line compliance.

See [`docs/reference-sujan-layout.md`](reference-sujan-layout.md) for the layout analysis this produced.

## Findings the client needs, independent of the build

**The guest quotes on the page are real Tripadvisor reviews**, pulled verbatim from the Trustindex widget
in the crawled HTML and attributed by name and year. Client confirmed 4 Aug that these hard-coded quotes
are the **interim**: the site will be wired to Tripadvisor directly for live reviews (Plan 5), which also
supplies the aggregate rating and review count currently missing. A test fails if any quote appears without
a name, source and year, so an invented testimonial cannot slip in.

**Ten hard numbers now sit in the copy and only two are confirmed** (5 km to both gates). The full table,
with the two numbers deliberately left out rather than published wrong, is in
[`docs/copy-provenance.md`](copy-provenance.md). The sharpest open question: the live site's room list for
Mahua Tola totals **twelve**, while the brand record says fourteen.

**The live site's distances are all wrong and contradict each other.** Five published claims across two
lodges; not one is correct:

| Gate | Homepage | About Us | Elsewhere | Truth |
|---|---|---|---|---|
| Turia (Mahua Vann) | 3 km | 4 km | — | **5 km** (client-confirmed 3 and 4 Aug) |
| Kolara (Mahua Tola) | 6 km | 10 km | 12 km (review widget) | **5 km** (client-confirmed 4 Aug) |

Five published distances across two lodges, and **not one of them is right**. Both are 5 km.

**Mahua Bagh is still being sold** on About Us and its own page as a "signature eco lodge", though the brand
record retired it. Every mention in `reference/site-copy.md` is marked `[RETIRED PROPERTY — do not reuse]`.

**Best raw material found:** *"Explore 'Pachdhar', a village adjoining Pench National Park, where over 100
'Kumhars' families have upheld the art of pottery."* Named place, real number, living craft — and it explains
the potter's-hands photograph in the library. Strong candidate for its own chapter.

**Two images excluded on consent grounds**, not quality: `bush-breakfast` (a guest's face, lit and in focus)
and `stargazing-telescope` (a figure's features discernible; guest or staff unclear). Four other
people-containing images were kept after inspection — `guide-sunrise`, `sound-healing`, `tiger-crossing-track`,
`potters-hands`. **The client can reinstate any of these if releases exist.**

## Assets

- **`Mahua property logos/`** — client-supplied vector logos, added 3 Aug. `Mahua Resorts.svg` is genuine
  artwork: **340 paths, 0 embedded rasters, 439 groups, viewBox 0 0 500 500**. Per-property marks for Vann
  and Tola, plus EPS/PDF/PNG and a 3D render. **This removes the need to reconstruct the emblem** for the
  planned counter-rotation animation (petals clockwise, leaves anticlockwise) — real petal and leaf groups
  already exist.
- **`public/media/`** — 34 curated images, largest derivative 199.7 KB. **17 are `fullBleedSafe`**
  (≥1400px), up from 2 across the whole previous build. Categories: `lanternHour` 9, `forest` 7,
  `lodgeLife` 13, `details` 5. **Distinctness is guarded by perceptual hash** — see
  [`docs/reviews/2026-08-04-image-audit/`](reviews/2026-08-04-image-audit/), where four pairs turned out to
  be the same photograph under two ids.
- **`reference/video-stills/`** — three frames harvested from the client's Mahua Tola property video: the
  candlelit petal table, the bonfire, the hammocks. All 1920px, wider than anything from the live site.
- **`reference/video/`** — the client's 1080p property video (25 MB, **git-ignored**). Not usable as video:
  44 shots in 54 seconds, and it shows BeyondStay branding in close-up.
- **`reference/site-copy.md`** — 3,036 words of the live site's copy, by page.

## Still owed to the client

- **The targeted shot list** — the 3–4 photographs that would most transform the page, so a small shoot can
  be priced precisely. The library tops out at 1920px and only 17 of 34 images clear 1400px. **More urgent
  than it was**: the audit of 4 Aug cut four duplicates out of what was thought to be a 35-image library,
  and three of the replacements are frame-grabs from a property video. The client confirmed a fresh photo
  and video shoot is planned but **not soon**, and that newer assets can replace these later.
- **Plan 4:** the signature interactions — spinning mahua emblem, leaf cursor, ink tiger.
- **Plan 5:** performance hardening, the SEO redirect map (spec §10), Sanity CMS wiring.

## Process notes worth keeping

The implementer/reviewer split has caught something real in **every task**, and the defects have almost
always been in the *plan* rather than the implementation. Examples worth remembering:

- A colour timeline that could never interpolate — every transition squeezed to zero width.
- A warmth test written as `red >= blue`, which pure black (`0 >= 0`) passes trivially.
- A contrast guard that only tested seven static states while the background moved between them.
- An image budget that was a `console.warn` nothing checked — which is how a 636 KB file shipped.

**One fix round on Task 3 was done by the controller solo** (during the usage-limit window) and never got
independent review. Flagged in the ledger; the whole-branch review should look at commit `04a82c2`
specifically.

The SDD ledger at `.superpowers/sdd/2026-08-03-rebuild-chapters-layout/progress.md` (git-ignored) holds the
full per-task record.
