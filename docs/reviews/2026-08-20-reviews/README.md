# The guests' review carousel — evidence

**20 August 2026, on `feat/home-v2`.** Client request:

> *"Replace the placeholder reviews on the last section with the Tripadvisor carousel widget, with slow
> auto-scrolling review cards and the scroll pauses when the viewer hovers over the carousel. The cards
> should be rectangles with same dimensions for the review we have placed for now, showing the rating/stars
> as solid golden … for example 5 stars mean 5 circles and 4.5 means four and a half circles. Also I
> understand the complete reviews cannot be shown in such small space, so add a clickable read more button on
> the reviews that get cut in the middle, and when the viewer clicks on it the popup window/gallery will show
> the complete text. For these reviews we need to scrape at least 100 reviews from our Tripadvisor."*

**Everything in it is built. The reviews themselves are the one thing outstanding**, and that is by his own
ruling — see §1.

## 1 · Why it is not the Tripadvisor widget, and not 100 scraped reviews

Four findings were put to him before anything was built, and he ruled on all three questions.

| | |
|---|---|
| **The official Content API returns 5 reviews per property.** | Their hard ceiling. Ten across both lodges, with their logo and green bubbles required beside them. |
| **Scraping is not available.** | Their terms forbid it, they block it, and the review text belongs to the people who wrote it rather than to Mahua. |
| **Both properties are rated 4.0, and an unfiltered feed publishes that.** | Among the first reviews surfaced: *"It's Not Resort…it's a military school"*, *"Scaring experience"*, and one about polythene in a dinner. **This is the decisive one** — it is a business argument rather than a technical one. |
| **The reviews are split across at least five listings**, some under previous operators. | Vann: **421** on `d1599459` plus a separate "V Resorts Mahua Vann Pench". Tola: **22** on "Mahua Tola Tadoba" but **131** on "Mahua Tola Resort", plus a third. Worth consolidating with Tripadvisor regardless of the website — it is splitting the ranking. |

**His rulings**: the reviews are a curated set *he* assembles from his own management centre; **15–20** of them;
and both motion modes built so he can choose on the real page.

So the reviews live in `content/home.ts` like every other word on this site, and
`components/sections/ReviewCarousel.tsx` draws whatever is there.

## 2 · Zero JavaScript, all three parts

The movement is a CSS animation, the pause is `:hover`, and the full-text panel is CSS `:target` — the
construction the room gallery was rebuilt on after the Popover API was measured nesting its own panels
(`DECISIONS.md` §18).

**First-load JavaScript: 167.7 KB brotli, identical to the figure before this work.**

## 3 · Measured, on the shipped build

`node scripts/check_reviews.mjs --port 3131` — **11 assertions, PASS.**

| | |
|---|---|
| card | **302 × 207px** at a **342px pitch** — the 304 × 122 the three standing blocks measured, at his own request, plus the two rows he asked to add |
| frame | **986px** at 1440, the same width the three blocks spanned; **310px** inside a 312px content box at 360 |
| speed | **52px/s** — 73px of travel in 1.4s, a 21s loop over three reviews |
| pause | rail moves **0px** in 1.4s under the pointer, and starts again when it leaves |
| panel | opens on `:target` at **z-index 60**, carries the full text, box 544px |
| contrast | **worst 7.04:1 over eight phases of the loop**, against a 4.5 floor (7.66 / 7.16 / 7.16 / 7.22 / 7.04 / 7.04 / 7.04 / 7.04) |
| reduced motion | rail still (**0px** in 1.6s), three cards still in frame |
| no JavaScript | cards and panels server-rendered; `:target` still opens the panel |
| 360 × 800 | card 279px in a 310px frame, **31px of peek**, no horizontal page scroll |

Page gates: **496 tests**, build / `tsc` / lint clean, `check_contrast_over_photos.mjs` **156 probes, 0
failures**, density **all seven chapters inside 45%** (page mean 33.6%, worst 66.4% — `invitation` 6.0% → 14.7%
as the section grew, still the emptiest chapter on the page by a wide margin).

## 4 · Four things this cost, and each is a general lesson

**A card in a marquee cannot be measured by one screenshot.** Two runs were added to
`check_contrast_over_photos.mjs` and removed the same hour: that rig crops one frame to an element's rect, and
half the cards are outside the viewport at any moment — a `bad extract area` crash, not a wrong number. More
to the point, a card visits every part of the photograph behind it, so a scrim solved for one position is a
scrim solved for one twentieth of a second. `check_reviews.mjs` assertion 11 freezes the marquee at **eight
phases** and reads real composited pixels at each.

**A rig that shares one page across assertions must restore what it disturbed.** Assertion 6 navigates to a
review's fragment; assertion 11 then measured the carousel sitting under `SiteHeader`'s fixed cream bar and
reported **1.00:1 on all eight phases** — cream on cream, which is a real failure mode of this section and
was not what was happening. **Third instance on this project of an instrument steering what it measures**,
after `scroll-snap` quantising two rigs' samples and a per-frame layout read pushing the hero's reveal by
700ms.

**`transform` and `translate` are different properties, and this stylesheet uses the second.** The rig's first
run reported "the carousel is not scrolling" because it read `getComputedStyle(rail).transform`, which is the
string `"none"` for the whole of a running loop. It reads a bounding rect now — agnostic about which property
put the element where it is, which is the property a measurement should have.

**A width that is the emergent maximum of whatever is inside is a width that changes when the content does.**
`08 · The Invitation` is a flex container and `Enter` takes no `className`, so the section's flex item had no
width of its own — it was ~992px *by accident*, because a three-column grid of quotes happened to be its
widest child. The carousel broke that in both directions: first to **986px inside a 360px viewport**, when a
`max-content` rail reached all the way up the chain (found by the rig reporting "693px of peek" at 360, a
number only possible if the frame is three times the screen); then, once `contain: inline-size` stopped that,
down to **540px at 1440**, because with the rail hidden from intrinsic sizing the widest remaining child was a
paragraph. Both fixed by stating the width.

## 5 · Still open — one thing, and it is the client's

**The 15–20 reviews.** Each needs: the text in full, the guest's name as Tripadvisor shows it, the year, and
**the rating out of five**. `rating` is optional in the type and a review without one renders with no circles,
deliberately — the three reviews standing there came off the live site's widget as text alone, and a plausible
number written in would read as the guest's own. This project has been within one edit of that before.

Until they arrive the carousel runs on those three, and `check_reviews.mjs` reports that no rating exists to
measure the gold circles against.

**And `REVIEWS.mode` is his to rule on.** `loop` ships today — what he originally described, and the first
thing on this site that never stops (non-negotiable #5 is why that is worth saying). `settle` is built beside
it: a real scroller whose cards slide into place once as the section arrives, then rest. **One of the two is
meant to be deleted** once he has looked.
