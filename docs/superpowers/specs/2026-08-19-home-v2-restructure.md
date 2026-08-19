# Home page v2 — the stakeholders' restructure

**Date:** 19 August 2026
**Status:** **APPROVED by the client, on `feat/home-v2`. NOT to be deployed to production.**
**Scope:** the home page (`/`) only. Neither property page changes.

---

## 0. Why this is a branch, and what that buys

The client, after a stakeholder discussion: *"rather than deleting, let us create a completely new branch for
these changes so we don't need to redo or undo or delete and remove any of the work we did… and we don't
push it to Vercel, I just present it on localhost to them."*

**That is the whole reason this spec can be aggressive.** Three pieces of artwork lose their home here — the
hanging lantern (`06 · The Lantern Hour`), the hornbill forest tint (`03 · The Forest`), and the potter film
in `rooted` — and two of them the client supplied or re-rendered himself. On a branch, none of it is
deleted, made dormant, or explained away: `feat/image-sizing` keeps them intact and shipping. If the
stakeholders prefer what exists, walking away from this branch costs nothing.

**`https://mahua-resorts.vercel.app` must keep serving the current build.** A production deploy from this
branch is the one thing that would make this irreversible.

## 1. The page, before and after

| now (12 chapters) | v2 (6) |
|---|---|
| `arrival` — hero | **The Journey Begins** — unchanged |
| `lodges` 01 · The Lodges | **01 · The Lodges** — rebuilt as two panels |
| `why-you-came` — full-bleed quote | **02 · The Jungles** — cropped band, new photograph |
| `rooted` 02 · Rooted like the mahua | **03 · Rooted Like The Mahua** — realigned, potter removed |
| `forest` 03 · The Forest | **removed** — its paragraph moves into 02 |
| `field-days` 04 · Days in the Field | **05 · Experiences** — new cards, new activities |
| `rooms` 05 · The Rooms | **removed** — its paragraph becomes 04 |
| — | **04 · Mahua Philosophy** — new, mirrors 03 |
| `after-dark` — full-bleed quote | **removed** |
| `lantern-hour` 06 · The Lantern Hour | **removed** |
| `details` 07 · Details | **removed** |
| `guests` — testimonials | **moved** below the closing buttons |
| `invitation` — closing | unchanged, now carries the reviews |

## 2. `01 · The Lodges` — two panels, in the reference's shape

Model: [ecotriip.co](https://www.ecotriip.co/)'s India / Africa split, supplied as a screenshot. Two
photographs side by side, each full-height, each carrying a small region label, a two-tone heading, one
sentence, and a button.

- Left: **Mahua Vann**, label `PENCH`. Right: **Mahua Tola**, label `TADOBA`.
- Buttons go to `/mahua-vann` and `/mahua-tola`.
- **Names, regions and routes come from `content/site.ts`**, which already carries all three for both
  lodges — the closing section and the site menu read the same fields. No lodge name is written twice.
- Below 768px the two panels stack.

**This is two full-bleed photographs, so it does not breach non-negotiable #3** (cream throughout; dark only
for photographs and their overlays). Type over them needs its own solved scrim, per #7 and the contrast rule.

## 3. `02 · The Jungles` — the quote band, cropped and turned into a chapter

`why-you-came` today is a **100svh** full-bleed photograph with a centred quote. The client: *"it covers the
whole screen currently and feels too overwhelming… cropped from the length, keeping the width, giving the
section more room to breathe with the newly created headroom and legroom, making it look sleeker."*

- **Photograph becomes `reference/home-v2/cats-stitch.png`** — 3168 × 1344, 2.357:1, a stitched forest frame
  carrying a black panther, two leopards on a rock, and a tiger.
- **Height cropped, width kept.** The band is shorter than the viewport, with cream above and below it.
- **The chapter is numbered now**: `02 · The Jungles`, in the page's own chapter-mark idiom.
- **Heading left-aligned**, at a smaller size than the current centred quote.
- **The paragraph from `03 · The Forest` moves here**, set to the right of the heading.

## 4. `03 · Rooted Like The Mahua` — realigned, and the potter goes

Keeps its pinned construction (the text holds while photographs rise past it). Changes:

- **The potter film is removed.**
- **Text left, left-aligned. Photographs line up on the right** and scroll while the text stays.

## 5. `04 · Mahua Philosophy` — new, and a deliberate mirror

An extension of 03, not a separate idea — *"make sure it is in continuity as it is an extension of an
already existing section."*

- **Text right, right-aligned. Photographs on the left**, scrolling — the mirror of 03.
- **Its words are `05 · The Rooms`' intro paragraph**, moved here without that section's heading.

## 6. `05 · Experiences` — renamed, renumbered, re-carded

Was `04 · Days in the Field`.

- **Heading, body copy and the tiger film stay exactly as they are.** *"We keep the text and the tiger where
  they are and not touch them."*
- **The pinned coverflow is replaced by a plain horizontal card strip** — the client's ruling, choosing the
  reference's "Curated Group Departures" behaviour over the pinned stage built 16-18 Aug: tall portrait
  cards, the page scrolling past normally, the strip dragged or arrowed sideways.
- **Six activities, in the client's own order**, from `Brand&Design-Guidelines/mahua-home-v2-dusk.html`:

| # | Card | Words | Photograph |
|---|---|---|---|
| 1 | **Private Bush Dinners** (renamed from "Lantern dinners") | Tables under the trees, a fire going, the forest listening in. | `bonfire-dinner` |
| 2 | **Wellness** — label *Stillness* | Lawn yoga, pranayama and candlelit sound baths. | `sound-healing` |
| 3 | **Screenings and Star Talks** | Telescopes on the lawn and wildlife documentaries under the trees. | **new** — `reference/home-v2/star-talks.jpg`, 900 × 1350 |
| 4 | **Nature Walks and Birding** | Guided trails around the lodge — pugmarks, birdcalls, small dramas. | `guide-sunrise` — **see 6a** |
| 5 | **Village Craft** | Pottery at the wheel, learnt from the villages next door. | `potters-hands` |
| 6 | **Jungle Safari** | the current `field-days` safari card's own words | `tiger-crossing-track` — **see 6a** |

The client added Jungle Safari to the document's five and set this order himself.

### 6a. FINDING — portrait cards want portrait photographs, and two of these are not

The reference's cards are **tall portraits**. Two of the six sources are landscape crops the client supplied
on 17 Aug for a 1.96:1 card:

| id | now | in a 3:4 card |
|---|---|---|
| `guide-sunrise` | 1344 × 685 (1.962:1) | ~62% of its width cropped |
| `tiger-crossing-track` | 1344 × 685 (1.962:1) | ~62% cropped |

The design document's own copies are gentler — `guide-binoculars-sunrise.jpg` is 1000 × 666 (1.5:1) — and
the new `star-talks.jpg` is genuinely portrait at 900 × 1350.

**Measure this against the project's 25% crop bound before the card's aspect is fixed.** The honest outcomes
are a shallower card, different frames for those two, or an ask to the client for portrait re-exports. Do not
silently crop past the bound.

## 7. Everything after Experiences is removed, and the reviews move

Removed outright from the home page: `rooms`, `after-dark`, `lantern-hour`, `details`.

`invitation` — the closing section with the two property buttons — stays exactly as it is, and **the
`guests` testimonials move to sit below those buttons**. The client: *"later when we get the TripAdvisor API
we will change it to auto-scrolling reviews, but what I meant is that this will be the new place for the
reviews, below the two property buttons."* The placeholder reviews keep their placeholder status; only their
position changes.

## 8. What must be re-measured, not assumed

The page goes from twelve chapters to six, so every page-level figure this project holds itself to is
invalid until re-run:

- **Non-negotiable #8** — 45% empty on a chapter's worst screen, every chapter, plus the page mean and
  `imagesPerScreen`. `DECISIONS.md` §5a: the rig samples every 150px, so anything within a point or two of
  45% is inside its own error.
- **Non-negotiable #10** — never two consecutive text-led screens. `content/chapters.test.ts` enforces it
  mechanically, and the new spine must satisfy it rather than be exempted from it.
- **Non-negotiable #6** — initial transfer under 1.5 MB, and the hero's arrival. Removing six chapters
  should help; the two-panel Lodges section adds two large photographs above the fold and may not.
- **Contrast** — the Lodges panels and the Jungles band are both type over photographs, and each needs a
  solved scrim with its own run in `check_contrast_over_photos.mjs`.
- **The JavaScript budget** — `npm run verify:budget`, delta reported rather than the total.

## 9. Deliberately not in scope

Both property pages. The site menu, header and footer. The booking contract. The demo deployment.
