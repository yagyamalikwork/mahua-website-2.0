# Mahua Resorts — Property Pages, Redesigned

**Design specification · 9 August 2026**

Status: **approved** (brainstormed and signed off with Yagya Malik, 9 Aug 2026)

Supersedes [`2026-08-08-property-pages-design.md`](2026-08-08-property-pages-design.md) wherever the two
conflict. That spec's D1 (two dedicated pages), D3 (quiet Book + Enquire), D4 (the lodges' own photography),
D6 (each page restarts its numbering) and D7 (no global footer) still hold and are not relitigated here. Its
D8 — "no hand-drawn map, this round" — is **overturned**: the asset it said did not exist does exist, on the
client's own live site. See §5.

---

## 1. Why this exists

`/mahua-vann` and `/mahua-tola` shipped on 9 August and the client rejected the design the same day:

> "They look very wordpress and templaty. We want them to present the respective properties with Quiet
> Luxury while maintaining the cream theme from homepage."

This is not a defect list. The pages pass every mechanical rule the project has — density, contrast,
rule-in, budgets, all green. **They pass the rules and fail the brief**, which is the more expensive kind of
failure and the reason this is a redesign rather than a fix round.

### The diagnosis

Four findings, each of which the redesign answers directly:

1. **One section shape, repeated.** Chapters 02, 03 and 04 open with the identical move — small-caps
   eyebrow with a number, display heading left, `dim` paragraph right, grid beneath. Four times counting
   Dining. *That repetition is what a WordPress theme is*: one section component, applied down the page.
   No amount of good photography inside a repeated frame reads as considered.

2. **The rooms are a spec table.** Size / Bed / View, three ruled rows, repeated per room type. It is the
   live site's tab widget re-skinned. Quiet luxury shows a room and names one thing about it; it does not
   lead with a datasheet.

3. **The ask is invisible.** Booking is two pills in the corner of the sixth screen. A visitor who has
   decided must scroll the whole page to act.

4. **The two properties are structurally identical** — same shapes, same order, same lengths, and both
   opening chapter 01 with the same headline, *"Five kilometres from the gate."* A visitor cannot feel
   which lodge they are on. Two pages generated from one template is the literal definition of the
   complaint.

### And the pages are thin

An audit of the crawled live pages (`reference/wp-pages/resorts_mahua-{vann,tola}.html`, parsed section by
section on 9 Aug) found we are presenting roughly **a quarter** of what the client already publishes:

| | Live site carries | We shipped |
|---|---|---|
| Named experiences | **Vann 12, Tola 8** — Jungle Safari, Kohka Lake, Bird Watching in a **37-acre private eco park**, Candlelight Bush Dinner, Pachdhar potters' village (100+ Kumhar families), Serene Nature Walk, Wildlife Documentaries, Conferences, Swimming, Cycling, Indoor & Outdoor Games, Karaoke | 4 photographs, one paragraph |
| Maps | **Two per property** — a park map naming every gate with the lodge marked, and an India locator | none |
| Press | Condé Nast Traveller, Travel + Leisure, The Guardian (Vann); none for Tola | none |
| Room photography | Cottage without Deck **has its own photograph** (`Mahua-Website-Images_TC.jpg`, 1919px) | "Shown: Cottage with Deck" |

The thinness is not why the pages read as templaty, but it is why they feel like a brochure stub. Both are
fixed here.

---

## 2. Decisions taken

| # | Decision | Reasoning |
|---|---|---|
| **R1** | **No two consecutive moments on a page may share a shape**, enforced by a test on the spine | The direct, mechanical fix for finding #1. A rule held by good intentions is a rule that decays; `content/chapters.test.ts` already proves the pattern works for the rhythm rule |
| **R2** | **A quiet persistent bar, plus a real closing invitation** | Client-chosen 9 Aug over "repeated quiet moments" and "one closing band". A visitor on a property page has already chosen a lodge, so asking is fair — non-negotiable #2's "seduce, not convert" governs the home page, not the page a visitor reaches by deciding |
| **R3** | **Six experiences given real space; the remainder named in one quiet line** | Client-chosen 9 Aug over "all twelve as an index" and "six only". Nothing is hidden from a family or a corporate booker; Karaoke and the conference hall simply do not get to set the tone |
| **R4** | ~~"Enquire" opens a real form~~ — **superseded 9 Aug, same day.** The pages carry **the lodge's contact details, not a form**: the bar pairs Book with a tap-to-call, and the closing band sets phone, email and address as plain tappable text | Client's ruling: *"we don't need an enquiry form, for the enquiries we can just share the contact details in the Website Directory section when we build it later."* It removes a third-party dependency, a signup, an environment variable and the entire class of "the form silently ate the enquiry" failure. The original problem stands and is still solved: today's bare `mailto:` does nothing on a phone with no mail client, and a phone number shown as text always works |
| **R5** | **The park maps are redrawn in the cream palette from the client's own artwork**, by a build script | Overturns the previous spec's D8. `docs/reference-sujan-layout.md` §5 already named an illustrated map "directly compatible with Mahua's field-guide idiom", and the audit praised the Pench map specifically. It answers "five kilometres from Turia Gate" in a way no sentence can, and it is the single strongest differentiator between the two pages |
| **R6** | **Traced, never hand-drawn** | `DECISIONS.md` §8 records three hand-authored tigers failing because hand-written bezier coordinates are slightly wrong everywhere, which is what reads as cheap. The maps' geography is the client's; only its colour and type change |
| **R7** | **The rooms' facts become one letterspaced caption line, not a table** | Finding #2. Same information, a quarter of the height, and it reads as a caption rather than a database |
| **R8** | **`PLATE I / II / III` numerals do not appear on property pages** | They are the home page's field-guide device for curated specimen boards. Applied to a photo grid they are decoration on filler |
| **R9** | **The two pages are deliberately different lengths and orders** | Vann carries three press mentions and no attributable guest quote; Tola carries an attributed quote and no press. The asymmetry is real, sourced, and is what stops them reading as one template twice |

---

## 3. The shape vocabulary

Every moment on a property page declares one `shape`. **R1 is enforced against this field.**

| Shape | What it is | Used for |
|---|---|---|
| `fullBleed` | Photograph fills the screen; type over it | Arrival, dining, a guest's word |
| `column` | A narrow centred column of prose on bare cream — no image, no eyebrow, no grid | The opening word |
| `map` | The drawn map, full width, on `paperDeep` | Where it is |
| `showcase` | One large photograph, a name, one line, facts as a single caption rule | The rooms |
| `pair` | Two photographs at deliberately different scales, text between | Experiences |
| `press` | Publication wordmark, headline, standfirst, a ruled link | In the press |
| `invitation` | The closing band, **carrying the sister lodge's photograph** | The ask |

`column` is the page's one quiet screen and is only legal flanked by image-led shapes on both sides — the
existing rhythm rule (non-negotiable #10) still applies on top of R1.

**`press` is type-led and therefore counts as quiet**, which is why `invitation` carries a photograph: on
Vann the two sit adjacent, and a type-only band followed by a type-only close would break the rhythm rule
even while satisfying R1. The two rules are independent and both bind. `showcase`, `pair`, `fullBleed`,
`map` and `invitation` are image-led; `column` and `press` are not.

---

## 4. The spines

### Mahua Vann — 8 moments

| # | Moment | Shape | Carries |
|---|---|---|---|
| — | Arrival | `fullBleed` | The entrance court. Name, one line, one sub-line |
| 01 | The forest | `column` | Kipling wrote it without visiting; Turia Gate five kilometres off; what dawn is. Two short paragraphs, nothing else on screen |
| 02 | Where it is | `map` | Pench in cream — the reserve, Turia / Karmajhiri / Jamtara gates, the Pench river and reservoir, the villages, the lodge marked. Getting-there facts in a column beside it |
| 03 | The rooms | `showcase` | 26 rooms in 3 shapes, each at a different scale. Cottage without Deck gets its own photograph |
| 04 | The table | `fullBleed` | Chulai ki Bhaaji, Mahua Kheer, named |
| 05 | The day | `pair` | Six with real space — Jungle Safari, Kohka Lake, the 37-acre eco park, the Candlelight Bush Dinner, Pachdhar's potters, the Serene Nature Walk — then one `dim` line naming cycling, swimming, games, karaoke and the conference hall |
| 06 | In the press | `press` | Condé Nast Traveller, Travel + Leisure, The Guardian |
| — | The invitation | `invitation` | Book · Enquire · address · Mahua Tola |

### Mahua Tola — 8 moments, differently ordered

| # | Moment | Shape | Carries |
|---|---|---|---|
| — | Arrival | `fullBleed` | The lodge across its lily pond at dusk |
| 01 | The reserve | `column` | Tadoba's density, Kolara Gate, the Hattinala. **Its own headline, not Vann's** |
| 02 | Where it is | `map` | Tadoba in cream — the core and buffer zones, the four numbered safari zones, every gate the artwork marks, Tadoba / Jamni / Teliya / Pandharpauni lakes, the Irai Dam backwaters, the lodge marked beside Kolara. **Gate and village names are transcribed from the artwork during implementation, not from memory** |
| — | A guest's word | `fullBleed` | Vedant, 2019, Tripadvisor — verbatim, still joined to `content/home.ts` by test |
| 03 | The rooms | `showcase` | 12 rooms in 5 shapes |
| 04 | The table | `fullBleed` | Maharashtrian specialities; the candlelit dinner by the water |
| 05 | The day | `pair` | Six of its eight — Tiger Safari, the Hattinala river walk, the village and bamboo crafts market, the bonfire, the candlelit dinner, swimming — then the quiet line for the rest |
| — | The invitation | `invitation` | Book · Enquire · address · Mahua Vann |

No press band: Tola has no press mentions, and inventing parity would be inventing content.

---

## 5. The map

**The single most important new element, and the page's answer to "quiet luxury".**

### Palette

| Client's artwork | Ours |
|---|---|
| Core area, mid green | `ink` at 20% |
| Buffer zone, pale green | `ink` at 10% |
| Lakes, river, backwaters | `ink` at 34%, hairline edge at 50% |
| Main road, yellow | **`gold`**, filled — a rule carrying no text, exactly what non-negotiable #7 reserves gold for |
| Village dots | `ink`, 3px |
| Gate marks | Small `gold` glyphs |
| Zone numbers (Tadoba) | `gold` square, `ink` numeral |
| Orange "We're here!" callout | **The client's mahua flower**, in a hairline ring, the lodge's name set quietly beside it |
| Elaborate compass rose | A single hairline north arrow |
| Legend | Small caps, letterspaced, at the foot |

### How it is built — and what has already been proven

`scripts/build_map.mjs` reads the client's artwork
(`reference/wp-media/property-pages/Mahua-website_{Vann-pench,Tola-tadoba2}-map.jpg`), masks each region by
colour, and traces it to an SVG path with `potrace`. It writes `lib/vann-map-art.ts` and
`lib/tola-map-art.ts` — generated modules, never hand-edited, in the established swap-point pattern already
used by `build_leaf.mjs`, `build_lantern.mjs` and `build_welcome_logo.mjs`. **A new map from the client is
a dropped file and one command.**

**This pipeline was built and run against the real Pench artwork on 9 Aug before this spec was written**, and
four things it must handle were found by looking at the output rather than by reasoning about it:

1. **potrace fills dark regions.** A white-on-black mask traces the *inverse* — the first run produced a
   solid gold rectangle. The mask must be negated before tracing.
2. **The labels punch holes.** Type sits on top of the green, so a colour mask is perforated by its own
   place names. A blur-and-threshold pass (a morphological close) fills them; the park's full extent is
   best recovered as "not paper and not road" rather than by matching green, which swallows the labels,
   the callout and the water in one whole outline.
3. **The legend and compass must be cropped off** before masking, or their swatches trace as stray specks
   in the artwork.
4. **The road breaks where the callout crosses it.** Unresolved in the probe; the plan must either treat
   the callout's orange as road-continuous or bridge the gap explicitly. **Do not ship a road with a hole
   in it.**

Everything that is type — every label, gate name, village, lake, zone number and legend entry, with its
position — lives in `content/`, not in the generated module, because it is copy and CLAUDE.md's
architecture rule admits no exception.

### Reduced motion and no JavaScript

The map is a static SVG. It carries no animation, so it has nothing to disable, and it renders identically
with scripting off.

---

## 6. The ask

### The persistent bar

A cream bar, one hairline above it, ~64px tall: the property's name at the left, `Enquire` and `Book` at
the right. It slides in once the hero has left the viewport and **steps aside over the closing invitation**,
so the ask is never on screen twice at once.

It is `position: fixed` and sits over content, which makes it subject to two rules this project has already
paid to learn:

- **`docs/DECISIONS.md` §2 #21**: `measure_density.mjs` cannot see `pointer-events: none` elements. The bar
  is *not* click-through, so it will be seen — but the density rig skips `position: fixed` deliberately, as
  chrome belonging to no chapter, and that must stay true.
- **Fail towards absent** (the welcome screen's contract, §14): with no JavaScript the bar must not exist
  rather than existing permanently over the content. Server-render it hidden; script may only reveal it.

### The contact details

**No form.** The lodge's own details, shown plainly, in two places:

- **In the bar**, beside Book: the phone number, as a `tel:` link. On an Indian phone that is the shortest
  route from wanting to stay to speaking to someone, and it cannot fail.
- **In the closing band**: phone, email and the lodge's postal address, each set as text under a small
  letterspaced label, all tappable.

Both come from `content/` like every other word on the site. Nothing here is a control that can be pressed
to no effect — the failure this replaces was a bare `mailto:` doing nothing at all on a phone with no mail
client configured, with the visitor believing they had written to us.

**This site collects nothing and stores nothing.** There is no form, no endpoint, no third-party script and
no database — the enquiry route is a phone number and an email address the brand already publishes.

A site-wide directory carrying the full contact set is the client's stated next piece of work and is out of
scope here (§11).

---

## 7. Components

**New:**

| Component | Purpose |
|---|---|
| `components/property/PropertyBar.tsx` | The persistent bar |
| `components/property/PropertyContact.tsx` | The lodge's phone, email and address — a line for the bar, a block for the close |
| `components/sections/PropertyMap.tsx` | The map band — art, labels, legend, getting-there column |
| `components/sections/RoomShowcase.tsx` | Replaces `RoomsIndex`; one room, one scale, facts as a caption |
| `components/sections/ExperiencePair.tsx` | Two experiences at different scales |
| `components/sections/PressBand.tsx` | The three articles |
| `components/sections/OpeningColumn.tsx` | The narrow centred prose screen |
| `components/property/PropertyInvitation.tsx` | The closing band. **A distinct file from the home page's `components/sections/Invitation.tsx`**, which is not modified and not reused |
| `scripts/build_map.mjs` | Traces the client's map artwork into `lib/*-map-art.ts` |

**Modified:** `components/property/PropertyPage.tsx` (dispatches the new shapes and enforces R1 at the type
level), `content/property-chapters.ts` (gains `shape`), both content dials, `scripts/build_images.mjs` (the
newly-found photography).

**Retired:** `components/sections/RoomsIndex.tsx` and `components/sections/FieldNotes.tsx` — both replaced.
Neither is used by the home page; removing them is safe and the plan must confirm it by build, not by
assumption.

**Untouched:** every home-page component. This work does not reopen the home page.

---

## 8. Content, and the numbers that still need the client

**Copy** is adapted from `reference/site-copy.md` into the established voice — British spelling, specificity
over adjectives, no invented facts. All of it lives in `content/mahua-vann.ts` and `content/mahua-tola.ts`.

**Newly available photography**, to be curated through `scripts/build_images.mjs` with the same budget and
perceptual-hash distinctness checks as the existing 53: `Mahua-Website-Images_TC.jpg` (Cottage without
Deck), `Mahua-Website-Images_Pench_Conference.jpg`, and the four map source files. Every one must be
**looked at before it is curated** — `docs/DECISIONS.md` and five wrong alt texts found on 9 Aug are the
standing evidence that filenames are not.

**Still open with the client, and not to be guessed:**

- **Tola's room count** — twelve on the live site's own structured list, fourteen in the brand record with
  three river-facing machaans under construction.
- **A Nagpur distance** — the live site says 80 km for Vann, the brand record 104–112 km. The row names the
  city and claims no figure until confirmed.
- **The home page's cottage/suite caption**, corrected 9 Aug: one photograph must not be called a suite on
  one page and a cottage on another.
- **The 115-tiger figure and "highest Sighting Rating Index in the country"** stay softened to a
  comparative claim, following the home page's own precedent for a number that will date.

---

## 9. Verification

Everything the existing rigs already guard applies unchanged at both routes: density (non-negotiable #8's
45%), worst-pixel contrast over photographs, the rule-in hairline, transfer budgets, first-load JS, image
resolution. `check_contrast_over_photos.mjs` is already route-aware as of 9 Aug and gains probes for the new
type.

**New guards this design requires**, each to be watched failing against a deliberately broken build before
its pass is trusted:

1. **R1 itself** — a test asserting no two adjacent moments on either spine share a `shape`. It is the whole
   anti-template guarantee and must be mechanical.
2. **The bar** — that it is absent before the hero leaves, present after, absent again over the invitation,
   and **absent entirely with no JavaScript**. Assert the outcome (is it on screen, does it cover the
   invitation), not that a class was applied — `DECISIONS.md` §2 has twenty-seven instances of why.
3. **The contact details** — that the phone number is a real `tel:` link and the email a real `mailto:` in
   the served markup, on both routes, **with no JavaScript**. The whole reason for choosing details over a
   form is that they cannot fail; a test that only proves the text is present would not notice a number
   rendered as inert type.
4. **The map** — that every declared label has a position inside the artwork's box, that the road is
   continuous, and that the traced paths are not empty. A map that fails to trace must fail the build
   loudly, not render an empty cream rectangle.

---

## 10. On the size of this

This is a large single spec — eight new components, a build script, a third-party integration, two rewritten
content dials and four new guards. It is deliberately not decomposed, because every part of it serves one
brief the client stated in one sentence, and splitting it would ship half a redesign. The implementation
plan should expect to run to a comparable number of tasks as the previous property-pages plan, and the map
and the enquiry form are the two tasks most likely to need a fix round.

**The map should be built first.** It is the element with the most unknowns, the most visual risk, and the
greatest power to differentiate the two pages — and if it cannot be made to look expensive, the rest of the
design should be reconsidered before it is built around a hole.

---

## 11. Out of scope

- **The home page.** Untouched by this work.
- **The site-wide directory.** The client's stated next piece of work, and where the full contact set will
  live. These pages carry only each lodge's own phone, email and address.
- **Tripadvisor wiring, the booking-engine restyle, the SEO redirect map, Sanity CMS** — all still out of
  scope per CLAUDE.md.
- **The India locator map.** Fetched and available (`Mahua-website_{Vann,Tola}-location-map.jpg`) but not
  built this round: the park map does the work, and a second map on one page is repetition of exactly the
  kind this redesign exists to remove.
- **The Tripadvisor review widget** on the live property pages. Reviews stay as the home page handles them
  until the live wiring is commissioned.
