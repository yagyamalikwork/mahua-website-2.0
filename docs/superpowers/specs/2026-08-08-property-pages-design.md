# Mahua Resorts — Individual Property Pages

**Design specification · 8 August 2026**

Status: **approved** (brainstormed and signed off section by section with Yagya Malik, 8 Aug 2026)

---

## 1. What we are building

Two new pages: `/mahua-vann` and `/mahua-tola`. Dedicated pages for each property — not one page
covering both — in the style of the current `mahuaresorts.com` property pages and of
[thesujanlife.com](https://thesujanlife.com/)'s camp pages. Each is presented as an extension of the
finished home page, the way Sujan's `/sujan-camps/sujan-sher-bagh` extends `thesujanlife.com/`: same
chrome, same idiom, same restraint, arrived at from the home page's "Discover Mahua Vann / Discover Mahua
Tola" cards.

The home page is finished (Plans 3–5, `docs/PROJECT-STATE.md`) and is not reopened by this work except for
two small, necessary edits described in §5.

**Mahua Vann** (Pench, Madhya Pradesh, 5 km from Turia Gate) and **Mahua Tola** (Tadoba, Maharashtra, 5 km
from Kolara Gate) are built in that order — Vann first, through a full design-review-fix cycle; Tola second,
from the proven template, with its own copy and photography. Mahua Bagh stays retired from the brand
(`docs/DECISIONS.md` §1).

### Reference points

| Site | What we take from it |
|---|---|
| [thesujanlife.com](https://thesujanlife.com/)'s camp pages (analysed via `/sujan-camps/sujan-sher-bagh`) | The two-register shape: a story told in the home page's own idiom, then an openly practical band — not its volume (see D2). |
| The current `mahuaresorts.com` property pages (`reference/wp-pages/resorts_mahua-{vann,tola}.html`, `reference/site-copy.md`) | The words, the room inventory, the named experiences, the booking links. Everything under-used, per the client's 3 Aug feedback. |

---

## 2. Decisions taken (and the reasoning, so they are not relitigated)

| # | Decision | Reasoning |
|---|---|---|
| D1 | **Two dedicated pages**, `/mahua-vann` and `/mahua-tola`, not one page covering both | Client-confirmed 8 Aug: matches both the current site's structure and Sujan's per-camp pages. |
| D2 | **Two registers on one page: story, then practicalities** — Sujan's *shape*, not its *volume* | Client-chosen over "journey only" (a planner leaves without answers) and "practical-first" (reads like the WordPress site we're replacing). No carousels, no 40-image gallery, no packing-list/weather accordions — those cost more restraint budget (non-negotiable #4) than they earn, and read as generic hotel-website filler against "specificity is the brand's luxury." |
| D3 | **Quiet Book + Enquire, not a booking funnel** | Client-chosen. "Book" links to the property's real AsiaTech engine; "Enquire" is a softer contact route. Both drawn restrained, appearing near the rooms and at the page's foot — never in the hero, never shouting. Consistent with non-negotiable #2, "seduce, not convert." |
| D4 | **Room and experience photography sourced from `reference/wp-media/`'s own per-property images** | Client-directed 8 Aug: "you can get those from Mahua Resorts Property pages for Mahua Vann and Mahua Tola, exactly the pages we are building." These are the lodges' own real photographs (`Mahua-Website-Images_Pench_Deluxe.jpg`, `_Tadoba_Suite-room.jpg`, etc.), not stock or harvested-elsewhere substitutes. **Checked, not assumed: coverage is uneven even on the live pages themselves** — see §6. |
| D5 | **Vann first, fully; Tola mirrors it** | Vann's content is richer and more settled — 26 rooms across 3 types, ~12 named experiences, the Pachdhar potter story, all three press mentions. Tola's room inventory is the sharpest open number in the whole project (12 on the live site vs. 14 in the brand record) — better to prove the template on the settled property first. |
| D6 | **Each property page restarts its own chapter numbering at `01`** | It is a self-contained journey reached from the home page, not chapter thirteen of it. |
| D7 | **No new global `Footer` component** | The home page has none — it closes on `Invitation` instead. Each property page closes on its own band (address, sister-property link) in the same spirit, rather than introducing site-wide footer chrome nothing has asked for yet (YAGNI). |
| D8 | **No hand-drawn map, this round** | `docs/reference-sujan-layout.md` §5 praises Sujan's illustrated map as "directly compatible with Mahua's field-guide idiom," but no such asset exists in this repo. Flagged as future work (§8), not built now — commissioning one is a client decision, not an engineering one. |

---

## 3. The page spine, per property

Built on the existing `Chapter` / `ChapterKind` machinery in `content/chapters.ts`, so the 45%-empty
ceiling, the rhythm-alternation rule, and full-bleed eligibility all apply exactly as they do on the home
page — extended to run against the new routes (§7).

### Register one — the journey (reused components, property-specific content)

| # | Chapter | Component | Content |
|---|---|---|---|
| — | Hero | `Hero` | Property photograph, name, one-line essence |
| 01 | The place | `ChapterIntro` | The forest, the gate (5 km, both client-confirmed), what arriving feels like |
| 02 | The stay | `SplitFeature` or `PlateGrid` | The *feel* of the rooms — mud cottages and machaans for Vann, forest-view suites for Tola. 2–3 photographs, prose. Facts live in the rooms index, not here |
| — | A guest's word | `FullBleedQuote` | A property-specific Tripadvisor quote, if the harvest has one for that lodge. **If not, this chapter is dropped** — the rhythm rule is still satisfied without it, since `Hero`, `PlateGrid` and the rooms index are already image-led (`IMAGE_LED_KINDS`), not patched with an invented quote |
| 03 | Dining | `SplitFeature` | Chulai ki Bhaaji / Mahua Kheer for Vann; Maharashtrian specialties for Tola |
| 04 | Experiences | `PlateGrid` | 4–6 curated, named experiences — not all 12–14 on the live page. Vann: Potter's Village (Pachdhar), Kohka Lake, Jungle Safari, Candlelight Bush Dinner. Tola: Tiger Safari (115 tigers, resident male Xylo), River Walk, Village Walk & Bamboo Crafts Market, Bonfire |

### Register two — field notes (new components, §4)

- **Rooms index** — every real room type (3 for Vann, 5 for Tola) as a compact grid: photo, name, size, bed,
  view. Scannable, not prose.
- **Getting there** — by air/train, by road, the gate distance, as a short list.
- **Book + Enquire** — the quiet CTA pairing (D3).
- **Find us / sister property** — address, plus a small closing nudge to the other lodge's page.

---

## 4. What's new vs. what's reused

**Reused, unmodified:** `Hero`, `ChapterIntro`, `SplitFeature`, `PlateGrid`, `FullBleedQuote`,
`TwoToneHeading`, `ChapterMark`, `ChapterSurface`, `Photo`, `PillButton`. Everything mounted globally in
`app/layout.tsx` — `Grain`, `SmoothScroll`, `LeafCursorMount`, the `rule-in` hairline — carries over with no
extra work, because it is layout-level, not page-level.

**New, small, and in the same visual language (same cream, same restraint, same type scale — denser, not
different):**

- A rooms-index component (photo + name + size + bed + view). No existing component does this shape.
- A getting-there / facts block.
- The Book + Enquire pairing.

No new design language is introduced. The gear-change from register one to register two is legibility and
density, not colour, motion or typography.

---

## 5. Two edits to existing home-page code this work requires

1. **`content/home.ts:118,130`** — `LodgeCards`'s "Discover Mahua Vann" / "Discover Mahua Tola" currently
   link externally to the live WordPress site, with `target="_blank" rel="noreferrer noopener"`
   (`components/sections/LodgeCards.tsx`). Once `/mahua-vann` and `/mahua-tola` exist, these become internal
   links, and the external-link attributes come off.
2. **`components/ui/SiteHeader.tsx`'s `ChapterMenu`** currently reads the home page's global `CHAPTERS` list
   unconditionally. It needs parameterising to accept a link list, so a property page's header can offer its
   own short in-page menu (Stay · Dining · Experiences · Getting there) instead of the home page's twelve
   chapters. The header's CTA pill also changes per page — "Book" pointing at that property's engine link,
   rather than the generic `mahuaresorts.com` root the home page currently sends it to.

Both are scoped, mechanical changes to code that already exists — not a reopening of Plan 3–5's design
decisions.

---

## 6. Content, photography, and the numbers that need the client

**Copy.** Adapted from `reference/site-copy.md`'s Vann and Tola sections into the established brand voice
(British spelling, specificity over adjectives — CLAUDE.md's Conventions). One new content dial per
property, following `content/home.ts`'s `as const satisfies` pattern: `content/mahua-vann.ts` and
`content/mahua-tola.ts`. No user-facing string is hard-coded in a component.

**Photography.** Room and experience images come from `reference/wp-media/`'s own per-property, per-topic
files — `Mahua-Website-Images_Pench_Deluxe.jpg`, `Mahua-Website-Images_Tadoba_Suite-room.jpg`, and so on
(D4) — run through `scripts/build_images.mjs` so they get the same four widths, `fullBleedSafe` marking and
perceptual-hash distinctness check as the curated 34 on the home page. Not linked in at source resolution.

**Coverage is uneven, checked against the live pages' own `<img>` tags rather than assumed.** Mahua Vann's
live page carries only two room photographs for three room types — `Mahua-Website-Images_Pench_Deluxe.jpg`
and `Cottage-with-deck-2-scaled.jpg` — so *Cottages without Deck* has no distinct photograph anywhere in the
harvest. Mahua Tola fares better: Deluxe, Suite and Camping Hut each have their own
(`Mahua-Website-Images_Tadoba_{Deluxe-room,Suite-room,Camping-hut}.jpg`), but Super Deluxe Cottage and
Family Suite do not. The rooms index must handle this honestly — a room type without its own photograph
shares the nearest comparable one and says so in the caption (e.g. "shown: Cottage with Deck"), rather than
implying a distinct image that does not exist. This is exactly the shape of defect #5 in
`docs/DECISIONS.md` §2 ("never show the same photograph twice" comparing filenames) in reverse: the risk
here is not a false claim of distinctness but a false claim of coverage, and the fix is the same — check the
actual asset, don't infer from a room list.

**Numbers not to invent.** Mahua Tola's room count is already an open item (`docs/copy-provenance.md`: 12 on
the live site, 14 in the brand record) and must be confirmed with the client before the rooms index ships,
not guessed. Check-in/out times and what's included/excluded — standard on Sujan's pages — appear in no
harvested source for either property; that block is omitted entirely rather than invented, per "verify hard
numbers with the client; do not trust the sources" (CLAUDE.md Conventions).

---

## 7. Verification

Most of the existing browser rigs (`measure_density.mjs`, `check_rule_in.mjs`, `measure_page.mjs`,
`measure_js_budget.mjs`, `check_contrast_over_photos.mjs`) are currently hard-coded to `/`. Part of this
work is parameterising them by route, so `/mahua-vann` and `/mahua-tola` inherit the same 45%-empty ceiling,
transfer budget and contrast guarantees the home page has — not a separate, weaker bar for the new pages.

New mechanical tests follow the existing pattern: a rhythm-alternation test on each property's chapter list
(mirroring `content/chapters.test.ts`), and a join between the two content dials and their `CHAPTERS`-shaped
spines (mirroring the existing `id` join test).

Every guard is run against a deliberately broken build before its pass is trusted (`docs/DECISIONS.md` §2)
— that discipline carries over unchanged.

---

## 8. Owed, and explicitly out of scope

- **Mahua Tola's room count** must be confirmed with the client before the rooms index for that page ships
  (12 vs. 14, and the "three machaans under construction" detail in the brand record needs a status check).
- **A hand-drawn map**, if the client wants one — D8. Not built this round.
- **Tripadvisor wiring, the booking restyle, the SEO redirect map, Sanity CMS** — all already out of scope
  per CLAUDE.md and untouched by this work.
- **The two AsiaTech booking-engine links are used as-is**: Vann is
  `https://asiatech.in/booking_engine/index3?token=ODM1MQ==`, Tola is
  `https://asiatech.in/booking_engine/index3?token=ODM1MA==` (found in the crawled HTML, e.g.
  `reference/wp-pages/resorts_mahua-vann.html`). Replacing this engine is not part of this work.
