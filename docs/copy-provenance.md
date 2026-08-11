# Where every line of the home page came from

Written for the client review of `content/home.ts` (Plan 3 Task 6, 4 Aug 2026). Three sources:

- **Live site** — `reference/site-copy.md`, harvested from mahuaresorts.com. Facts and detail reused;
  wording rewritten, because the audit's finding that the current copy is keyword-stuffed still stands.
- **Brand record** — `../Mahua_Resorts_Master_Brand_Record.md`, v5.
- **New** — written for this page.

## By chapter

| Chapter | Source | Notes |
|---|---|---|
| Hero | Brand record | "The wild and the calm, held together" is the brand vision line, unchanged |
| 01 · The Lodges | Brand record + live site | "Two forests known deeply rather than many known in passing" is the owner's own line. Xylo, the Hattinala river and the three new machaans are from the brand record; the eco park is from the live site |
| Pull-quote (tiger) | Brand record | The vision statement compressed to one line |
| 02 · Rooted like the mahua | Brand record + live site | The mahua philosophy and *kalpavriksha* are the brand record almost verbatim — it is the best-written thing in either source. Pachdhar and the Kumhar families are from the live site's Mahua Vann page |
| 03 · The Forest | Live site + new | Species and the Tadoba density claim are the live site's. The Kipling line is new |
| 04 · Days in the Field | Live site | Six experiences condensed from the live site's twelve, dropping the ones that undercut the positioning (karaoke, conferences, indoor games) |
| 05 · The Rooms | Live site + brand record | Room types and the decked cottages are the live site's; the totals are the brand record's |
| Pull-quote (night) | New | |
| 06 · The Lantern Hour | Brand record | Full-moon ritual, Mahua Kheer on the open chula, Chulai ki Bhaaji, the telescope on the lawn — all the brand record's, which is far ahead of the live site here |
| 07 · Details | Brand record | "A welcome inked by hand on a leaf" and "anticipation over request" are the record's |
| Guests | **Live site, verbatim** | See below |
| The close | Brand record | Season dates and peak months |

## The guest quotes are real and nothing about them is written by us

Three Tripadvisor reviews, pulled from the Trustindex widget in the crawled HTML of the live site
(`reference/wp-pages/resorts_mahua-tola.html`), quoted verbatim and trimmed only at sentence boundaries.
Names, years and the source are as published.

**Agreed 4 Aug:** these hard-coded quotes are the interim. The site will be wired to Tripadvisor directly
for live reviews, which also settles the two problems with quoting them statically — that a 2019 review
hard-coded into the page still says 2019 in 2030, and that the aggregate rating and review count are
currently missing (the widget reports "126 reviews" on *both* property pages, so it cannot be attributed to
either lodge, and no star rating was recoverable from the crawl). The live feed supplies all of it.

That integration is **Plan 5** work, alongside the CMS wiring — not this plan.

Nothing else on the page is a testimonial, and `content/home.test.ts` fails if a quote appears without a
name, a source and a year — so an invented one cannot be added quietly.

## Every hard number on the page, and how much we trust it

CLAUDE.md's standing rule is to verify numbers with you rather than trust either source. These are all the
numbers now in the copy:

| Claim | Source | Confidence |
|---|---|---|
| **Five kilometres from Turia Gate** (Vann) | **You, 3 and 4 Aug** | ✅ Confirmed twice. The live site publishes 3 km on the homepage and 4 km on About Us; the brand record says 4 km. All three are wrong and should be corrected wherever they still appear |
| **Five kilometres from Kolara Gate** (Tola) | **You, 4 Aug** | ✅ Confirmed. The live site publishes 6 km, 10 km *and* 12 km across three places. All three are wrong |
| Twenty-six rooms at Mahua Vann | Brand record | ⚠️ Cross-checks against the live site's own room list (13 + 5 + 8 = 26) |
| ~~Fourteen~~ **Eleven** rooms at Mahua Tola | The client's own booking engine, 12 Aug 2026 | ✅ **Settled, and both sources were half-right.** The engine sells 5 Deluxe + 2 Suite + 3 Super Deluxe Cottage + 1 Family Suite = **eleven**, identical across five date ranges over nine months including peak. The live site's *twelve* was these eleven plus the **Camping Hut, which the client confirmed on 12 Aug is retired**. The record's *fourteen* is these eleven plus the three river-facing machaans still under construction — a future number the home page had been stating in the present tense. Corrected in `content/home.ts` and `content/mahua-tola.ts`. **Confirm with the client before treating as final:** an engine reports what is *sellable*, not what is built |
| Eight cottages with a deck | Live site | ⚠️ Unverified |
| More than a hundred Kumhar families at Pachdhar | Live site | ⚠️ Unverified |
| Some three hundred recorded birds | Live site | ⚠️ Unverified |
| Tadoba's tiger density among the highest in the country | Live site | ⚠️ The live site says 115 tigers and the highest Sighting Rating Index in India. We softened it to a comparative claim rather than repeat a specific count that will date |
| Park open 1 October – 30 June | Brand record | ⚠️ Unverified |
| December/January busiest, April/May best for cats | Brand record | ⚠️ Unverified |
| Xylo, the dominant male at the new river-facing machaans | Brand record | ⚠️ Unverified, and the most specific claim on the page — worth being sure of |

**Two numbers were deliberately left out** rather than published wrong: the distance from Nagpur (the live
site says 80 km to Vann, the brand record says 104–112 km to both) and the eco park's acreage (the live site
says 37 acres in one place and describes 7.5 acres at Tola in another).

## What we dropped from the live site, and why

- **Mahua Bagh, Murud** — retired from the brand, but still sold on the live site as a "signature eco
  lodge". Every mention is marked `[RETIRED PROPERTY]` in `reference/site-copy.md`.
- **"Boutique nature resorts in India"** — used seven times on the homepage alone. A named audit finding,
  and a test now fails if it comes back.
- **Karaoke, conferences, indoor and outdoor games, wildlife documentaries.** All real, none of them a
  reason to choose this lodge over another, and each one spends a line that a tigress could have had. They
  belong on the property pages, not the home page.
- **"Home away from home", "oasis of serenity", "nature's majesty", "pure bliss", "tropical paradise".**
  Adjectives standing in for specifics, which is the one thing the brand values say not to do.
