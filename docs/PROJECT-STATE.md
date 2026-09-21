# Project state — 29 August 2026

Written as a handoff so no context is lost when a session is compacted. **Read this second**, after
`CLAUDE.md`.

## ⚠ THIS BRANCH IS THE ONLY COPY OF 37 COMMITS UNTIL IT IS PUSHED

`feat/journal-and-mobile` had **no remote tracking branch at all** until 29 August 2026 — every commit of
both the 26 Aug restructure and the 27-28 Aug mobile work existed on one machine and nowhere else. A power
outage on 27 Aug had already cost this project one session mid-task.

**Check it before starting work and before stopping:**

```bash
git log --oneline origin/feat/journal-and-mobile..HEAD   # unpushed commits
git status -sb                                            # ahead/behind, in one line
```

**`feat/page-structure` is also 1 commit ahead of its own remote**, and has been since long before this
branch existed. Not urgent; recorded so it is not mistaken for something this work caused.

## Where the three agreed bodies of work stand (29 Aug 2026)

Three were agreed with the client on 26 August. Two are finished on this branch; the third is specified and
not started.

| | | |
|---|---|---|
| **B** — the restructure and the reviews widget | client's items 3 and 4a-4e | **DONE**, 25 commits, `docs/DECISIONS.md` §22 |
| **C** — mobile, tablet and zoom | client's item 2 | **DONE**, 12 commits, §23 |
| **A** — the Journal page | client's item 1 | **SPECIFIED, NOT BUILT** — `docs/superpowers/specs/2026-08-26-journal-page-design.md` |
| — | client's item 4f, the closing CTA | **NOT STARTED**, deferred by the client to last |

**501 tests, 167.2 KB brotli first load, `npm run verify:budget` PASS, `node scripts/check_docs.mjs` PASS.**
Neither merged nor deployed; `feat/home-v2` and the live demo are untouched.

**The Journal is the one that needs a decision before it can start**, and both blockers are the client's:
the Vercel plan (§9.1 of its spec — the free tier does not permit commercial use and this site is already
deployed on that account) and a privacy notice (§9.2 — the site has none, and a comment form collecting
email addresses requires one).

## The client is editing the site's copy — 20 Sep 2026

He asked for every word on the site in one document so he could rework it. That document is
[`WEBSITE-COPY.md`](WEBSITE-COPY.md): all three routes, the chrome, the hidden text (titles, descriptions,
photo descriptions, accessible names) and a section of discrepancies found while compiling it. It was taken
from a production build of this branch in a browser and checked back: every rendered string appears in it.
**It is a snapshot, not a source** — the site reads `content/*.ts`, never this file.

**When he sends it back, diff it against the version first written on 20 Sep 2026 and apply each change to
the file its §8 names** — his changes are edits in place, his questions are lines starting `NOTE:`. Then
re-measure before claiming done: copy changes length, and length moves density, the contrast of type over
photographs and the room card stack's text fit.

Discrepancies it raised, all unruled: Tola's Suite says "king bed" in its line and "Queen bed" in its facts;
the Super Deluxe Cottage has no size and the old site gives 300 sq ft; the home Tola panel describes the
three river machaans as existing though they were under construction on 12 Aug; `content/home.ts` still
holds an unrendered `rooms: "Fourteen rooms"` for Tola (and unrendered `gate`/`rooms` for both lodges —
`LodgePanels` reads neither).

## ⚠ ON `feat/home-v2` THE HOME PAGE IS SEVEN CHAPTERS, NOT TWELVE — 19-20 Aug 2026

**Check `git branch --show-current` before reading any home-page state below.** This branch carries the
stakeholders' restructure; everything after this section describes the twelve-chapter page that still ships
on `feat/image-sizing`, `main` and `demo`, and still serves the live demo.

**On `feat/journal-and-mobile` (branched from `feat/home-v2`, 26 Aug 2026, not yet merged or deployed),
this section is one layer further removed.** The seven-chapter page below is still the right shape, but the
tiger is off `05 · Experiences`, the reviews are the client's own Elfsight widget rather than the hand-built
carousel this section describes, and both property pages are restructured — none of which this document's
"What is still owed" list (below) reflected until the 27 Aug fix wave corrected it. **`CLAUDE.md`'s own
branch table is the authoritative one for which figure applies to which branch; `docs/DECISIONS.md` §22 is
the full account of what changed on this branch.**

**DEPLOYED to production on 20 Aug 2026**, after being built on a branch and shown on a preview URL — the
client's own framing was *"rather than deleting, let us create a completely new branch… we don't push it to
Vercel, I just present it on localhost to them,"* and he promoted it once he had seen it. **`demo` was moved
to match, because that branch exists to name what is live.**

**What the branch bought survives the deploy:** the twelve-chapter page is intact on `feat/image-sizing`,
`main` and `feat/chapters-rebuild` at `e0e3f69` — lantern, hornbill tint and potter film all still mounted —
and returns with `git checkout feat/image-sizing && npx vercel --prod --yes`.

### The page

Hero → **01 The Lodges** (two joined panels, the property heroes) → **02 The Jungles** (a cropped band, all
its words on the photograph) → **03 Rooted Like The Mahua** (text left, photographs right, potter removed) →
**04 Mahua Philosophy** (the mirror) → **05 Experiences** (a sideways strip of six cards) → the close, with
the reviews now under the two lodge pills.

Gone from the home page: `forest`, `rooms`, `after-dark`, `lantern-hour`, `details`, `guests`. **The lantern,
the hornbill tint and the potter film are untouched and still ship on the other branch** — they simply have
no mount here.

### The numbers

**(`feat/home-v2`, as of 20 Aug 2026 — see the banner above for what changed further on
`feat/journal-and-mobile`.) 491 tests. Every chapter inside the 45% ceiling; page mean 33.6%, worst 66.4%,
imagery 56.8% of the average screen, 2.03 photographs per screen.** Contrast: 156 probes on the home route,
0 failures; 318 across all three. Resolution: 0 under-served at every width, DPR 1 and 3. First-load JS
**167.5 KB brotli** — the same figure the restructure shipped at, because every effect added since has been
CSS. Initial transfer 669 KB at 390, 965 KB at 1440. Hero arrival 4,611ms at 390x844, medians of five,
against the standing 2,500ms budget that CLAUDE.md non-negotiable #6 records as knowingly failed.

**The page mean moved 33.2 → 33.6% when the review carousel landed (`feat/home-v2`, 20 Aug 2026)** and
`invitation` went 6.0 → 14.7%: the closing section grew, and `measure_density.mjs` scores the band below a
photograph as empty. It is still the emptiest chapter on the page by a wide margin and every chapter is
still inside 45%. **On `feat/journal-and-mobile`, re-measured 27 Aug 2026: page mean 32.9%, worst 61.4%,
still every chapter inside 45%** — `docs/reviews/2026-08-26-restructure/density.json`.

**The guests' reviews became a carousel on 20 Aug 2026** — auto-scrolling, pausing under the pointer, gold
rating circles, and a read-more panel on `:target`, all at **zero added JavaScript** (167.7 KB brotli,
unchanged to the byte). **It is not the Tripadvisor widget and it holds no scraped reviews**: their API caps
at five per property, scraping is not available, and — the argument that settled it — both lodges are rated
4.0, so an unfiltered feed publishes the one-star reviews on the home page. **He is assembling 15–20 himself;
that is the one thing outstanding.** `docs/DECISIONS.md` §21.10, `docs/reviews/2026-08-20-reviews/README.md`.

**The Experiences cards took the hover zoom on 20 Aug 2026**, and two other changes made the same day were
**reverted on 21 Aug**: the client's *"3D effect"* turned out to mean the closing chapter's **parallax** — its
photograph drifting while its words stay still — not a line-by-line rise.

**Three photographs drift now, where one did.** `02 · The Jungles` moves 70.6px against 16.1px of text (the
closing chapter reads 79.5 / 18.3), and the hero joined them at **half strength by the client's own choice**,
which overturns half of a documented decision that it should never move — the risk half of that decision was
overstated in its own sentence, and the return half was a judgement he reversed. **A drifting photograph is
drawn oversized, so it is a re-crop, and a re-crop is a re-solve**: both scrims were re-measured across the
drift rather than at one position and neither needed changing. Hero arrival unmoved. `docs/DECISIONS.md`
§21.9 and §21.11, `docs/reviews/2026-08-21-floating-text/README.md`.

**`imagesPerScreen` went 2.2 → 1.65 → 2.05 across this work.** The dip is the lesson: removing six chapters
took thirteen photographs and only ~5 screens of scroll. It is the figure the client's original density
complaint turns on — quote it beside the mean, never instead of it.

### What is still owed, and what he has not ruled on

0. **STALE on `feat/journal-and-mobile` — superseded 26 Aug 2026, kept below as history for `feat/home-v2`
   only.** This item described the hand-built `ReviewCarousel` and its open `REVIEWS.mode` question. Both
   are moot: the client supplied his own Elfsight/Tripadvisor widget instead, which replaced the carousel
   outright rather than choosing between its two modes (`docs/DECISIONS.md` §22.3). **Read the "From the 26
   August restructure" owed block further down this file** for what is actually still owed on this branch —
   his Tola Elfsight embed code, his Elfsight restyle, a paid plan, and the two density rulings. The
   paragraphs immediately below are the original, now-historical item, unedited:

   **The 15–20 Tripadvisor reviews, and it is the one thing blocking finished work.** The carousel is built,
   measured and shipping; it is running on the three reviews that were already there. Each new one needs the
   **text in full** (not an excerpt — the card cuts it with CSS so the site never stores an edited version of
   what a guest wrote), the **name** as Tripadvisor shows it, the **year**, and the **rating out of five**.
   `rating` is optional in the type and a review without one draws no circles, deliberately: the three
   standing there came off the live site's widget as text alone, and a plausible figure written in would read
   as that guest's own.

   **He also has `REVIEWS.mode` to rule on** — `loop` (continuous, pausing under the pointer, what he first
   described) against `settle` (slides in once, then rests). Both are built; one is meant to be deleted.

1. **The extra Philosophy copy.** It passes at 42.3% but reads as the shorter half of its pair — 55 words in
   a composition built for 139. `content/chapters.test.ts` carries a **named, dated exception** to
   non-negotiable #10 for that one adjacency, plus a test that fails the day the exception stops being
   needed. **Delete it when the copy lands.**
2. **The safari card's photograph changed and he has not ruled.** `tiger-crossing-track` could not be cropped
   to a portrait card without drawing its guests **2.65× larger**, and its consent clearance rests on them
   being small and turned away. `tiger-golden-grass` is in its place.
3. **`potters-hands` moved** from Rooted to Village Craft, because he chose it for the card and the page
   forbids a repeat. Rooted took `vann-potters-village`. Also unruled.
4. **Uncropped portrait originals ~900px wide for five strip photographs** — `docs/OWED-ORIGINALS.md`.

Full reasoning: [`DECISIONS.md` §21](DECISIONS.md). Evidence:
[`reviews/2026-08-19-home-v2/README.md`](reviews/2026-08-19-home-v2/README.md).

## `04 · Days in the Field` is a coverflow, and it passes non-negotiable #8 — 16-17 Aug 2026

Client: *"looks flat even though it has beautiful images."* Six activity cards on a pinned stage, advancing
on the visitor's own scroll, each a photograph with its own words laid on it, the neighbours behind and
veiled, the loop visible in the scroll. **Zero added JavaScript** — 168.2 KB brotli, delta 0. `SplitFeature`
retired. **481 tests.**

Evidence: [`reviews/2026-08-16-coverflow/README.md`](reviews/2026-08-16-coverflow/README.md).
Reasoning: [`DECISIONS.md` §20](DECISIONS.md). **Read §20.4 before quoting any density figure for this
chapter — that table has nine rows and only the last is current.**

### The number

**27.0% mean / 31.1% worst**, against 43.9% / 57.9% for the three bands it replaced and a 45% ceiling.
Cards are **1344 × 685**, the photographs' own dimensions, cropped 0.0%; the words are **centred** on them.
**`cardMaxPx` is spent exactly** — the next pixel is a soft photograph.
`passesWorst` **true**, 4.6 points clear. Page worst 66.9%.

**The carousel is linear, 01 to 06** — the client reversed his own 16 Aug loop request on 18 Aug once he had
seen it — **and the scroll is smooth rather than snapping**, at 381.4px per card. `scroll-snap` shipped for a
day and he rejected it as *"very snappy"*.

**It could not reach 45% at any card size on 16 August and does on 17 August, because the photographs
changed rather than the code.** That is the single most useful thing to carry out of this work. Four of the
six card frames had been 1163px 2.289:1 crops made for `/mahua-vann`, drawn at 1.288× the card's width and
running out at a 903px card when 45% needed ~1,090px. The client supplied all six at **1344 × 685**, the
draw factor fell to 1.1036, the ceiling rose past the ~1,090px 45% needed, and the same sweep that had
bottomed out at 55.0% read 41.0%. On 18 Aug the card went to the files' **own** 1344 × 685 — `CARD_BOX` is
now their exact ratio, so the crop is 0.0% and the draw factor 1.000 — and the chapter reads **31.1%**.
`cardMaxPx` is spent exactly: the next pixel is a soft photograph.

### What the client ruled, and what he sent

- **17 Aug, four changes**: remove the four-photograph collage and the *"day slows right down"* line; the
  carousel must open on 01 rather than 06; cards as large as the property pages' room cards; and the scroll
  must not fly past cards. All four are built.
- **He then supplied all six card photographs at 1344 × 685.** Three are different frames as well as bigger
  ones, and two of those are upgrades: the safari card gained a vehicle with guests in it, and Kohka Lake
  became an actual lake rather than the lodge's swimming pool.
- **Guest consent granted, 17 Aug**, for the safari frame and the three birders — recorded on their
  `CURATION` entries in `scripts/build_images.mjs`, not only here. The reason it had to be asked generalises:
  the safari frame had shipped for weeks at 541px where nobody is identifiable, and **enlarging a photograph
  is enough on its own to reopen consent**.
- **Scroll feel: "settles on a card"**, his choice over one-card-per-gesture, which he rejected as taking the
  page out of the visitor's hands.

### Still open

- **`vann-potters-village` wants a different photograph, not a wider file.** The 17 Aug re-crop moved the
  glaze highlights without removing them — 1.03:1 unwashed — so it still carries one of the heaviest washes
  on the page. [`OWED-ORIGINALS.md`](OWED-ORIGINALS.md), where group 1 is otherwise closed.
- **The tiger film now opens the chapter rather than closing it.** Non-negotiable #5 is about behaviour and
  all of it is intact, but the position changed and he has not ruled. The alternative measured 77.1%
  page-worst.
- **`lodges` at 48.6% worst is the one chapter still over the ceiling.** `rooms` and `guests` crossed under
  it on 17 Aug and **neither was touched** — `field-days` lost 56px and shifted the page against the sample
  grid. Do not record them as fixed.

### Five things a future session should not rediscover

- **The density rig's own 150px sampling step is an open question** — `DECISIONS.md` §5a. A 50px step finds
  3-7 points more empty on five chapters that nobody touched, and a chapter's figure moves when a chapter
  *above* it changes height by a non-multiple of 150. `05 · The Rooms` went 39.6% → 46.5% that way, with
  nothing in it changed. **A figure within a point or two of 45% is inside the instrument's own error.**

- **`position: sticky` does not freeze a view timeline.** A control arm built to fail passed; the freeze
  belongs to the *range phase* (`exit`/`contain` sat flat ~4,450px where `cover` swept). This **corrects the
  reason recorded in §17** for the rooms card stack, whose construction is right for a different reason than
  its own comment claims. Nothing licenses simplifying `.room-slot`.
- **A zero-sized scroll-snap target snaps nothing** — silently, under `proximity`, and it collapses every
  scroll to offset 0 under `mandatory`. `.coverflow-target` had been 0×0 since the day it was written.
- **A removal is not free.** Deleting the collage on the client's ruling made the chapter *worse* (52.0% /
  66.2%, page worst 82.9%) because the band kept its height and lost its imagery. Recomposing it was worth
  −11.2 points.
- **Snapping quantised the rig's own measurements** — `proximity` applies to programmatic scrolls, so 43
  requested sample positions became 6 actual rests, and three assertions were only ever asked where the
  carousel looks best. The rig now suppresses snapping for those and restores it for the one that tests it.

## The close chooses a lodge, and the plates float — 15 Aug 2026

Two client requests, both shipped and measured; `docs/reviews/2026-08-15-close-and-float/README.md`.

**The closing section.** The header's "Plan your stay" already pointed at `#invitation`, so only that
section's own button changed — one external link to `mahuaresorts.com` became two internal ones to
`/mahua-vann` and `/mahua-tola`, same `PillButton`, `size="large"`, plus a 3D raise. Landing under *"Two
forests are expecting you"* only to meet a second "Plan your stay" asked the visitor to choose nothing.

- **No lodge name is written in `Invitation.tsx`.** `content/site.ts` already carries label, region and
  route for both, and `SiteMenu`'s tiles read the same three fields.
- **They wrapped at every width at first** — the prose column is `max-w-[60ch]` (~530px) and the pair needs
  slightly more. The row sizes to its own content now, and wraps only at 390 where it genuinely cannot fit.
- **`.raise` could not be reused.** It is written `a:hover .raise`, so the raised thing is a child *inside*
  a link, and a `PillButton` **is** the link. `.pill-raise` is the same `--raise-*` numbers with the pill
  itself as the subject. Its shadow barely reads here — these sit on `--overlay` and the shadow is
  `--overlay` — and is kept because the class is not section-specific.

**The float.** `FLOAT` in `lib/motion.ts` is `RAISE` with the rotation removed: **6px rise, no tilt**, plus
a soft `--overlay` shadow, which is what sells *toward the viewer* rather than merely *upward*. The lift is
on the frame while the zoom stays on the `<picture>` inside it, so the two never touch the same element and
cannot compose into a transform neither was measured at.

| | rise | tilt | zoom |
|---|---|---|---|
| normal motion | **6px** | 0 | 1.06 |
| reduced motion | 0 | 0 | 1 |

**The float is the home page's only, by his ruling the same day** — offered for the property pages and
declined. `[data-hover-zoom]` living on `app/page.tsx` alone is a decision, not an oversight.

**First-load JavaScript delta 0** — both effects are CSS, the buttons are two links. 467 tests, tsc, lint
and build green.

**Three instrument errors on the way, all mine**, recorded in the review because the page was right every
time and the measurement was not: a probe that hovered one plate and read another, a "fully visible" filter
that excluded plates taller than the viewport, and coordinates taken while the smooth scroll was still
moving. What settled it was reading `document.querySelector("[data-image-frame]:hover")` — the element the
browser itself considers hovered — rather than one chosen by arithmetic.

## The lodge marker is the brand's flower — 15 Aug 2026

Client request. Both property maps marked the resort with a solid dot inside a hairline ring; that pair is
now `<image href="/brand/emblem-120.webp">` in the same 26×26 viewBox-unit box the outer ring occupied.
The lodge's name and the group transform are untouched, and the legend needed no change because `SWATCH`
has no `lodge` entry — nothing in the key ever described this marker.

**It overrides a decision that was recorded in the code**, and the override is the interesting part: the
old comment said the mark was drawn rather than rastered because *"at this size a 40px PNG would be the
only bitmap on an otherwise resolution-independent drawing."* True while the marker was two circles — and
not a reason to hand-redraw the client's emblem, which is exactly what this project refuses everywhere
else (`ui/BrandMark.tsx`: the flower is his artwork, not an approximation).

**`emblem-120` was chosen from a measurement, not by eye.** The marker renders 40.5px at 1920 and 36.1px at
1440 (49.1px on Tola, whose map draws wider at the same viewBox); `lib/sizes.ts` caps this project at DPR 2,
so the widest real demand is ~81px. 80 would sit a hair under, 160 is 2.6 KB for pixels nothing asks for,
and 120 is the tier the header itself loads on a DPR-2 desktop — a cache hit there rather than a request.

Verified on the live deployment, not just locally: flower present at both sizes, **zero old circles left**,
no failed requests, initial transfer 496/538 KB against a 1,500 KB budget, still `noindex`. 467 tests, tsc,
lint and build green. `docs/reviews/2026-08-15-map-emblem/README.md`.

## Three things blocked deployment on 14 Aug, and all three are fixed

Recorded in full in [`DEPLOY.md`](DEPLOY.md); named here because none is guessable from the error it
produces, and a returning session will hit them again otherwise.

1. **The commit author email.** Commits carried `yagyamalikwork@gmail.com` against a GitHub account of
   `yagyamalik.work@gmail.com` — one missing dot — and Vercel refuses a Git deployment whose author it
   cannot identify. **The client found this himself** from Vercel's own message. `git config --global
   user.email` is corrected; past commits are not rewritten and do not need to be, since only the
   triggering commit is checked.
2. **The CLI's auth token expires in hours, not days.** A two-day-old one fails as `Not authorized` while
   `whoami`, `project ls` and `ls` all keep working — reads fine, writes refused, which reads like a
   permissions problem and is not. Fix: `rm -f .env.local && npx vercel link --yes --project mahua-resorts`.
3. **No `.vercelignore`, so a deploy sat at 882.6 MB and never finished** — `.git` 926 MB, `node_modules`
   582 MB, `.next` 172 MB, `reference` 77 MB, none of which Vercel needs since it installs and builds its
   own. Now **882 MB → 133 MB**, and a deploy lands in under a minute.

**Connecting Git in Vercel removes all three at once**, and the email fix was exactly what had been
blocking that route. It remains a two-part action — connect the repo *and* set Production Branch to
`demo` — or the demo URL follows the default branch instead.

## The plate boards, fixed a second time — 14 Aug 2026, superseding the entry below

The section immediately below this one ("Image sizing — reflow, beside cards, gallery") describes a 13 Aug
fix for the home page's three `PlateGrid` boards as complete. It was not: the client re-tested it himself
within a day, on his own machine, and the shrink he had already reported once was still there. This entry
is the fix that actually closed it, `commit d88c0e6`, `docs/DECISIONS.md` §19,
`docs/reviews/2026-08-14-plate-reflow/README.md`.

**His words:** *"The images on all three section i told you on homepage (03, 05 and 07) still shrink with
the smaller screen size as well as i checked and tested it by just transforming the size of Google Chrome
window on which the link is open reducing it rather than on a full screen mode, also shrink when zoom
value reaches 150% and above when tested on the chrome browser."* Everything else the same plan shipped —
the alternating room cards, the gallery — he confirmed as "perfect, no changes there."

**Why the 13 Aug fix missed it.** It moved the three-column tier's breakpoint from `lg` to `xl` — a fix for
a defect that fires at one point, aimed at a defect that was continuous: between whichever two breakpoints
were current, every plate was still `N%` of the viewport, so it kept shrinking as the window narrowed or
the page zoomed. The rig built alongside it certified the fix anyway, because its own floor assertion
carried an 85% shrink tolerance (65% exemption for a board at minimum columns) rather than a real floor.
Watched failing against that build: **483 failures**, e.g. Forest at 368px against a 421px reference at
1280×720 — matching the client's own report exactly.

**The rule that replaced it:** a plate may never render narrower than its own width at 1440×900; a board
drops a column the moment holding it would breach that floor; at one column the plate fills the container.
Put to the client and answered the same day: fill-the-width was his choice over holding the plate's
full-screen size with cream either side, because holding size would leave roughly half the screen bare —
over non-negotiable #8's ceiling. Built on `flex flex-wrap` with a solved, whole-pixel `flex-basis` per
board (420/650/316px) — **not** CSS Grid's `auto-fit`, which was built first, passed every rig, and was
visibly wrong: a Grid track is shared across every row, so a trailing plate that doesn't fill a full row
was stranded beside an empty, plate-width cell of bare cream (screenshotted on Forest and Details at
1024px before switching away from it — found by looking, not by any assertion). `check_plates.mjs`'s floor
assertion moved from 0.85 to 1.0, exemption removed.

**One new owed item, and it is the only thing outstanding.** A one-column board can now draw a plate at up
to ~864px, more than double the old ~421px, and at device pixel ratio ≥2 (Retina Mac, iPad, a Windows
laptop at 150% scaling) that falls **22–46% short** of the pixels it needs. The three Forest cats are
curated at 900px wide, the four Rooms photographs at 1440px — neither was ever asked to fill a whole
container before this fix. Not caught by `check_image_resolution.mjs`, whose DPR sweep never samples a
wide viewport at DPR above 1. **The ask: uncropped originals, ~1800px for the three Forest cats and
~2600px for the four Rooms photographs.** `docs/DECISIONS.md` §5, §19.

**Verified unchanged:** density at the fixed 1440×900 point on all three routes (no chapter newly over
45%), initial-load transfer under 1.5 MB at both widths on all three routes, `components/ui/Plate.tsx` and
`components/ui/Photo.tsx` (the other session's files) untouched. Suite is **467** tests, all green.

## Image sizing — reflow, beside cards, gallery, all measured — 13-14 Aug 2026

Eight tasks on `feat/image-sizing` (cut from `feat/chapters-rebuild`), answering the client's own two
requests of 13 Aug: the home page's plate boards were shrinking on smaller laptops and at zoom, and he
wanted the room cards side-by-side with an alternating photo side, plus a click-to-expand gallery. All
three are built. **Read `docs/DECISIONS.md` §18 before touching `PlateGrid.tsx`, `RoomCard.tsx`,
`RoomCardStack.tsx` or the room gallery** — it carries the three 13 Aug rulings verbatim, the retirement
of `ROOM_STACK.textReserve`/`ROOM_CARD_BOXES` (§17's stacked-layout machinery, superseded, not merely
edited), the per-card solved crop bound, the plate floor rule, and the gallery's own mechanism swap
(Popover API → CSS `:target`, because the arrows nested instead of replacing — measured, not assumed).
Full evidence: `docs/reviews/2026-08-13-image-sizing/README.md`.

**The rooms-chapter density breach found by this task's own verification is resolved, same day (14
Aug).** The side-by-side room cards had measured **`vann-rooms` 43.9% mean / 49.4% worst, `tola-rooms`
44.3% / 50.1% empty** — over the plan's own ceiling (31.5%/42.1%, 33.8%/44.3%) and, on the worst screen
of each, over non-negotiable #8's general 45% ceiling too, the direct cost of the client's own 13 Aug
composition choice (photo beside words, not stacked) measured against his own 4 Aug density rule. Of the
three levers the plan named, two were genuinely inert (the words block's padding, the card's own height
cap), but the first — the photo's own width share — had been declared spent at 65% without ever being
swept: 65% was the plan's worked example, not a measured limit, and non-negotiable #8 bounds a value the
same way the forest tint's tint-strength did, which this project's own standing rule says to solve for
rather than accept the first number under. Swept upward (68/70/72/75/78%, `lg` held 5 points below `xl`)
and re-measured on both routes at each step: `lg:w-[70%] xl:w-[75%]` is the chosen value — the first to
clear the ceiling with real margin, and the most margin of any candidate that still reads as a text
column beside a photograph rather than a caption stuck to one (78% passed with more room to spare but was
rejected on sight, screenshotted at three widths on both routes: a room's facts line wrapped from 4 lines
to 5 and broke a word mid-wrap). Now measures **`vann-rooms` 36.0% mean / 43.2% worst, `tola-rooms` 36.3%
/ 43.5% worst** — both inside 45% worst. `check_card_stack.mjs` (9/9 assertions, both arms, both routes,
all six shapes) and `check_image_resolution.mjs` (0 images under-served, both routes) both re-pass
against the shipped build. Full sweep table, the cap arithmetic that predicted the fix was safe before it
was swept, and the screenshot comparison: `docs/reviews/2026-08-13-image-sizing/README.md` §2.5;
`docs/DECISIONS.md` §18 and §5 carry the same resolution.

**Also found and explained, not a defect of this plan**: `verify:budget` now reads 172,272 bytes brotli
against the 172,209 CLAUDE.md cites, +63 bytes. Traced to two specific chunks, confirmed deterministic
across two independent clean rebuilds, and matched byte-for-byte to a sibling session's own commit
message (`e12af07`, "a softer scroll, and a slow zoom inside a frame that never moves" — client requests
3/4, 12 Aug, landed on `feat/chapters-rebuild` before this plan's branch point): *"+63 bytes of
first-load JavaScript."* Not this plan's cost; CLAUDE.md's cited figure needs updating with this
attribution. Full chunk-level tracing in the review README §1.8.

Suite is **461** tests, green throughout (was 453 before this plan; Tasks 2, 4, 5, 6 and 7 each added
coverage). `components/ui/Plate.tsx` and `components/ui/Photo.tsx` — the other session's files — are
untouched, confirmed by `git diff` at every task's own close and again at this one's.

## The demo is live — 12 Aug 2026

**https://mahua-resorts.vercel.app**, Vercel project `mahua-resorts` under `yagyamalikworks-projects`.
Full detail in [`DEPLOY.md`](DEPLOY.md); the parts a returning session most needs:

- **It is not git-connected.** Deployed straight from the CLI, so **pushing changes nothing on the demo
  URL**. Republish with `npx vercel --prod --yes` from a checkout of what should be live. This is the safe
  arrangement before a presentation and was chosen deliberately.
- **Connecting the repo in Vercel is a two-part action or it is a defect.** Vercel defaults the production
  branch to the repository's default; connecting without also setting Production Branch to `demo` points
  the demo URL at whatever `main` holds.
- **`main`, `demo` and `feat/chapters-rebuild` are all at the same commit**, local and origin, as of
  12 Aug. `main` was **221 commits behind** and was fast-forwarded on the client's ruling, so a fresh clone
  now gets the real site rather than the pre-rebuild one. Nothing was lost — it was a clean fast-forward.
- **Nothing deployed is indexable, by construction.** `lib/indexing.ts` defaults closed; only the exact
  string `NEXT_PUBLIC_ALLOW_INDEXING=true` opens it. Both layers ship — `robots.txt` to stop a fetch, a
  `robots` meta tag to stop an index of a page fetched anyway. Verified in both directions on a production
  build, and verified again against the live URL.
- Verified live, not locally: three routes and `robots.txt` at 200 with no login wall, and a real browser
  found **41 / 16 / 18 images with none broken, two videos, no failed requests**. Screenshots in
  `docs/reviews/2026-08-12-vercel-demo/`.

**Client's working arrangement, 12 Aug:** he does the Vercel dashboard; this side handles git, deploys and
verification. He asked for the demo to be republished on request rather than automatically.

## The plates that squeezed — fixed 12 Aug 2026

**Client-reported, and the first defect on this project a visitor would have seen on an ordinary laptop.**
He opened the site on a smaller screen and found the photographs in `03 · The Forest`, `05 · The Rooms` and
`07 · The Details` squeezing — the only three chapters that use `PlateGrid`, so his own observation named
the component.

Two faults, stacked:

- **A media query that said `max-height: 800px` and meant "a phone held sideways".** `ui/Plate.tsx` used
  `short:` to cap a plate at 24vh. It fires on a 1366×768 laptop, a 1024×768 tablet, and any browser zoomed
  past ~110%, because zoom shrinks the CSS viewport. A one-pixel cliff: at 1440×801 the forest plates are
  701×686; at 1440×800 they are 701×356.
- **And the cap squashed rather than scaled**, because `w-full` and `short:w-auto` both applied and the
  winner was Tailwind's emission order. Photographs rendered **up to 230% wider than their true shape**.
  Instance 22 in `DECISIONS.md` §2 — the 128px lantern — is the same cascade defect on a different element.

Fixed with a `pocket:` / `roomy:` variant pair keyed to the viewport's **shape**, not its height, and with
every state naming its own width so no emission order can reproduce the squash. **Aspect rather than width
is the trick**: a landscape phone is ~2.16:1, while a 150% zoom on a 1440×900 screen is 960×600 — 1.60:1,
and only ~30px narrower than that phone, so a width threshold would have had to thread a gap too small to
be safe. `short:` / `tall:` are deliberately untouched; they still compact type and padding in `Hero`,
`FullBleedQuote` and `Invitation`, which is right on a short laptop.

**Measured 0% distortion at all thirteen viewports swept**, including both landscape phones where the
compact treatment correctly still applies. Evidence and the full table:
`docs/reviews/2026-08-12-plate-squeeze/README.md`.

**Two client rulings came out of it** (`DECISIONS.md` §1): at deep zoom the plates keep full size and the
visitor scrolls more — *"zoomed in, but the photographs got smaller"* is the wrong direction; and
`07 · The Details` may stay a 2-wide stack between 1024 and 1279px, which was offered as a fix and
declined — **looked at and accepted, not unexamined.**

**The lesson, and it is the expensive one:** no rig here could have caught this. Every instrument samples
390, 768, 1440 and 1920, and **768 is a width in all of them, never a height** — so nothing in the suite
resembled an ordinary laptop. Catalogue instances 44 and 45. A grid of fixed shapes is not coverage.
**Still unactioned: adding short-but-normal-width shapes (1366×768, 1024×768) to the rig suite**, which
would close the class rather than the instance.

## The booking contract — built 12 Aug 2026, blocked on one vendor answer

`lib/booking/` exists: a `BookingProvider` interface, a `MockProvider` that can produce every named failure
mode on demand, and an `AsiaTechProvider` that deliberately throws on every call. Six tasks, each reviewed,
**every one needing a fix round**. Suite 419 → **453**. Plan
`docs/superpowers/plans/2026-08-12-booking-contract.md`; spec §8a carries what the UI plan must inherit.

**Nothing visitor-facing was built, and that is the design.** AsiaTech has no usable API — PHP with jQuery
1.9.1, form posts returning HTML fragments, no partner token, no versioning — and their engine **cannot be
pre-filled**: a GET 500s, query parameters are silently ignored, and a cross-origin POST returns an orphaned
fragment with no route onward to payment. So the interim "collect dates on our page, hand them over" step is
not buildable, and a branded search box without it would make a guest type their dates twice. The three
questions to put to AsiaTech are in the spec's §8.

**Two primitives are fixed because both are where money and dates go quietly wrong.** `Money` is integer
paise behind a compile-time brand, so `rupees()` is the only way to obtain one — and the brand is
`declare const`, not a real `Symbol()`, because `JSON.stringify` drops symbol keys and money is the one
value here that crosses HTTP. A `StayDate` is a branded `YYYY-MM-DD` civil date, never a `Date`: a hotel
night is a calendar day at Kolara Gate, and an instant read in London is a different one.

**Six defects were found in the plan itself** — a `Money` that declared a brand it did not have, a
`@ts-expect-error` suppressing a missing-import error rather than the type error it claimed to prove, an
`as const` whose removal no test would catch, a failure-mode test that passed when a throw moved to the
wrong method, a `quote()` that silently halved the total `search()` had just shown, and a guest-facing
message bent to satisfy a badly-aimed regex. **The last one is the shape to remember: a badly-aimed test
made a product string worse**, pushing "this provider is not implemented" into words a guest would read.

**And one deferral was falsified by a later fix.** `quote()` resolving a room id across both properties was
correctly deferred as unfixable — the interface carries no property on `quote`. Task 4's own fix then put
`context.query.property` in reach and nobody noticed the ground had moved; the final review's probe booked a
Vann cottage at Vann's rate under a Tola search. **Re-examine a parked finding when the code it was parked
against changes.**

## Tola's rooms corrected — 12 Aug 2026, found while scoping the checkout

Scoping the branded checkout meant reading the client's own AsiaTech booking engine, and that turned up two
errors on live pages. Both are fixed; commit below.

- **`/mahua-tola` was advertising a room nobody could book and hiding one on sale every day.** The Camping
  Hut was the fourth room card; the engine offered no such room on **five date ranges sampled across nine
  months**, while three Super Deluxe Cottages appeared at every one and were named nowhere but a half
  sentence in the intro. The client confirmed on 12 Aug that the hut is **retired**, and supplied a
  photograph of a Super Deluxe Cottage the same day — which removes the blocker the previous session had
  recorded honestly: no interior shot of one existed anywhere in the live site's media.
- **The home page stated a future room count in the present tense.** "Fourteen at Tola" is eleven plus three
  river-facing machaans still under construction. The engine sells **eleven** (5 Deluxe + 2 Suite + 3 Super
  Deluxe Cottage + 1 Family Suite), identical at every date sampled. The live site's *twelve* was those
  eleven plus the retired hut. **Both sources held half the answer and neither knew it**; this closes the
  "12 vs 14" that had sat open in `docs/DECISIONS.md` §5 since the copy-provenance work. Vann's twenty-six
  is right and was checked the same way (13 + 8 + 5).

**The swap was not like-for-like, and the test suite did not notice — `DECISIONS.md` §2 #46.**
`roomCardLayout` derives a card's whole composition from its photograph's aspect: ≥1.9 is `stacked`, below
is `beside`. The hut was 2.29 and the client's photograph is a true 3:2, so dropping it in flipped the
card's layout and with it the chapter's height — `tola-rooms` went **33.8% → 37.1% mean and 44.3% → 47.9%
worst**, over non-negotiable #8's 45% ceiling, with all 419 tests green. Nothing tests density; it was
caught only by running `measure_density.mjs` on the route. Cropping to 2.00 (the stacked box exactly) was
then rejected by `lib/room-card.test.ts`, which requires 0.35 of clearance from the threshold so no card is
one re-encode from flipping. **2.29 shipped** — its siblings' own ratio — and `tola-rooms` is now **30.5%
mean / 44.7% worst**, better than the baseline it started from. The uncropped original is kept beside the
crop in `reference/client-photos/`.

**Verified:** 419 tests, build, lint, `check_card_stack.mjs` (4 rooms, text legible 4/4 at all six widths),
`check_image_resolution.mjs` (41 images, 0 under-served), density on the route, and the new card looked at
by eye at 1440 and 390.

## The rooms card stack — complete, 11 Aug 2026

Client request, the same day as the chrome's second pass below: *"pile up, with recede"* for the `rooms`
chapter on `/mahua-vann` and `/mahua-tola`, chosen over a plain pile-up and a peel-away deck. Eight tasks
(`docs/superpowers/plans/2026-08-11-room-card-stack.md`), on `feat/chapters-rebuild`, commits
`460726b..ea7655b`.

- **`RoomShowcase` is retired; `RoomCardStack` replaces it on both property routes.** Each room sticks
  below the header while the next rises over it; a covered card scales down and dims so the deck reads as
  depth. **Zero added JavaScript** — first-load stayed at 172,209 bytes brotli, delta 0, across every
  round, against the baseline Task 1 took before touching anything.
- **The construction was wrong twice, in opposite directions, before the third one shipped.** A card
  wrapped in a slot of its own height leaves `position: sticky` no slack — 0 of 4 cards ever pinned. The
  card driving its own `view()` timeline pins correctly but never dims while still visible — measured
  opacity **1.00 throughout**, because a sticky element's own timeline effectively freezes while it is
  stuck. What shipped is a third thing: a non-sticky sibling `<li class="room-slot">`, sized to the
  remaining slack, naming the card's timeline through `timeline-scope`. Full working, and why it is this
  project's own catalogued defect shape (a check confirming an effect ran, not *when*): `docs/DECISIONS.md`
  §17.
- **A photograph's width-crop bound said nothing about whether it fit the card's own height, and shipped
  illegible on five, then six, cards at 1440/1920 before it was caught.** Fixed with a height ceiling
  (`ROOM_STACK.textReserve`) and a paired padding trim; the rig gained an eighth assertion — sweeping each
  card's own text block, not just its outer box — watched failing on the reverted build with ten failures
  naming exactly the affected cards and widths. A second, unrelated bug (`min-height: auto` silently
  overriding a declared `aspect-ratio`) clipped the one portrait room photograph's words below 1024px; one
  Tailwind class fixed it.
- **Density: `vann-rooms` 40.1% → 31.5% mean (42.1% worst); `tola-rooms` 39.0% → 33.8% mean (44.3% worst) —
  both inside the 45% ceiling.** A figure recorded mid-plan (24.8%/27.4%) was inflated by the clipping
  defect itself — an overflowing photograph scores as 100% imagery to `measure_density.mjs` — and must not
  be quoted as current.
- **Mobile growth is larger than what the client accepted. Told 12 Aug; he deferred the phone.**
  He signed off on ~27% (Vann) / ~38% (Tola) on 11 Aug; the shipped build measures **+35.9% (Vann) and
  +43.6% (Tola)**. Corrected in the design spec's own §9. His ruling: *"right now our only focus is how it
  looks on a computer/laptop screen, we can workout and optimize mobile screens later."* Recorded, not
  acted on — and **the phone stays in every rig**, because that is where this plan's two worst defects were
  found. See `docs/DECISIONS.md` §1 and §5.

  **The deferral is spent as of 27 August 2026 and the card stack was re-examined under it.** The client
  reversed the 12 Aug sequencing himself — *"I want the website experience and optimization for every zoom
  and every device to be on point"* — and the mobile work that followed measured this chapter on a phone
  properly. **It is not broken there**: `scripts/check_card_stack.mjs` assertion 8 already asserts every
  card's text is legible at 390×844 and passes on both routes, and the section reads 2.8 screens (Vann) /
  3.4 (Tola) at ~38% bare, in line with the page. A first reconnaissance claimed it was "six screens of
  blank cream" and that claim was **false** — one of three false findings traced to measuring `next dev` and
  to element-screenshotting a `position: sticky` container. **The client was shown the correction and ruled
  the stack stays.** `docs/DECISIONS.md` §23.1 and §23.2.

  **One genuinely new finding about it stands unfixed and unruled**: at 150%/200% *OS text scale* — the
  phone's own accessibility setting, not browser zoom — a room card's text clips out of its own card, 49
  instances. That is a different failure from the growth figure above and it reaches a real visitor. See the
  four unfixed findings in "What is still owed".
- **The rig**, `scripts/check_card_stack.mjs`, runs eight assertions on both routes at four widths: cards
  pin and dim on time, no clipping by the header or booking bar, the bar's reserve really covers the
  measured bar, the deck is visible, a covered card is measurably smaller and dimmer, no photograph crops
  past 25% of its own width, the last card never recedes, and — the eighth, added in the fix round above —
  a visitor can actually read every card. Watched failing against six deliberate breakages (Task 6) and
  against the reverted build before assertion 8 existed (Task 7's second fix round).

**Evidence:** `docs/reviews/2026-08-11-card-stack/`. **419 tests, all green.**

## The chrome's second pass — 11 Aug 2026, all four from the client

He looked at the finished navigation and asked for four things. All are in, on `feat/chapters-rebuild`,
commit `80e7ddd`. Verdict: *"It looks better now."*

- **The lodge tiles are side by side and much larger**, in the reference site's manner — half the panel
  each, ~650px at a 1440 screen against the **208px thumbnail** they replaced, photograph above with name
  and region beneath. Home stays the plain type row he asked for on 10 Aug, so the menu reads as one
  destination and two offers. **Below 640px they stack full-width**: two columns on a phone would have made
  each tile *smaller* than the row it replaced, which is the opposite of the request. The split is by
  `cardMediaId` presence, not by index, so a third lodge in `content/site.ts` lands in the grid on its own.
- **The tiles lift toward the pointer** — his "3D raise". 8px, a real 2.5° `rotateX` so it is dimensional
  rather than a slide, a hair of scale, and a shadow in `--overlay` (the palette's dark green) because a
  neutral shadow on this cream goes grey and cold. All five numbers are `RAISE` in `lib/motion.ts`. It sits
  on the *photograph*, not the whole tile, so the type beneath stays put — a name that tips with its
  picture reads as a wobble. Under `prefers-reduced-motion` the movement goes and the shadow stays, so a
  visitor who asked for less motion still gets an answer when they point at something.
- **A hairline bug he spotted, and the cause was arithmetic.** `.rule-in`'s rule sits `-0.28em` below its
  text — a body-copy number. On a place name running to 51px that is **14px**, against a 4px gap to the
  region label, so it drew straight through "PENCH". Fixed with `.rule-in--fixed`, a **pixel** offset,
  because the fault was precisely that the offset scaled with the font while the gap under it did not.
- **The Website Directory is now `PALETTE.brand` (#7F5C24)**, the brown of the wordmark in his own logo —
  which already existed in the palette, sampled from the vector at 64,730 pixels of that type rather than
  eyedropped. **Every colour in the footer had to invert and none of it could be inherited**: `--dim`
  measures 1.1:1 on that brown and `goldText` 2.0:1, and both were what the footer used on cream. Cream
  (`--bg`, 5.02:1) now carries anything read or clicked, the deeper paper (`--surface`, 4.58:1) the second
  rank, hierarchy coming from size and tracking rather than colour. The focus ring went cream too — a gold
  ring on brown is the same 2.0:1. Verified from the rendered DOM, not from the source: `rgb(127,92,36)`
  ground, `rgb(241,233,215)` links, `rgb(233,223,200)` labels.

**This is a client-made exception to non-negotiable #3** (cream throughout, no dark sections), and the
shape that rule can bear — a terminal band, below everything, reached once. It is **not** licence to darken
anything above it. `lib/palette.test.ts` gained the brown as a third surface, asserting both the pairs that
pass and the two that fail, so the reason is a measurement rather than a memory.

**A rig was found blind in the process — `docs/DECISIONS.md` §2 #39.** `check_image_resolution.mjs`
reported "0 under-served" across five viewports on the very build whose menu `sizes` had just been rewritten
from fixed 112/160/208px boxes to `calc()` of the viewport. True and meaningless: the tiles are gated behind
`everOpened`, so they are not in the document until the panel has been opened once, and the rig only ever
scrolled. It opens the menu now — **39 images became 41**, and both tiles clear at every viewport.

**398 tests at the time (419 now, after the card stack), build, lint, `verify:budget` (159 KB,
unmoved), and the contrast, menu, rule-in, leaf-cursor and image-resolution rigs all green.** Menu contrast re-measured on all three routes at four widths after
the rebuild: 6.04–6.43:1.

## Site-wide navigation — complete 10-11 Aug 2026

The three pages now behave as one website, closing the gap the client raised on 10 Aug: from `/mahua-vann`
there was no route to Home or Tola except the closing sibling banner and the browser's back button, no page
had a footer, and with JavaScript off the menu could not open, leaving **no cross-page navigation at all**.

- **`SiteMenu`** (`ChapterMenu`'s successor — same reviewed dialog machinery, new job) lists **the three
  places, not the current page's chapters**: Home as a plain type row, Mahua Vann and Mahua Tola as
  photograph cards with their region in gold small caps, in Sujan's own manner. The current page is marked
  `aria-current="page"` and closes the menu on click rather than reloading. The trigger is a hamburger, not
  the word "Menu". The surface is cream glass — a translucent wash of the site's own paper, blurred.
- **`SiteFooter`** — the Website Directory the client named on 9 Aug when dropping the enquiry form — is a
  zero-JavaScript band (enforced by a test that walks its whole import graph) mounted once in `app/layout.tsx`,
  present on every route identically. It is what finally gives the site working navigation with scripting off.
- **`PropertyBar`** now steps aside over the footer as well as the closing invitation, so the booking ask is
  never on screen twice and never floats over the directory's own contact details.
- **A real accessibility failure was found and fixed, not just documented.** The new menu-over-photograph
  contrast probe (`check_contrast_over_photos.mjs`'s `pre: "menu"`) found the glass's shipped 82% wash left
  the gold region labels at 3.43-3.55:1 over a hero photograph, against non-negotiable #7's 4.5:1 floor — a
  promise the spec made and nothing had measured until this task built the capability to. **The fix took
  three attempts, corrected by a fix round.** The first reverse-solved the photograph pixel from one rendered
  composite and shipped 95%, which *still measured 4.40-4.44:1* on rebuild. The second fit two real composites
  and shipped 98% (measured 4.62-4.66:1, a real pass) — but the write-up claiming a per-channel RGB fit
  predicted that number did not reproduce under independent review; what actually reproduces it is a linear
  fit of the two composites' *scalar relative luminance*. The third attempt then asked whether 98% had been
  forced at all: the only failure was the *gold* region label, and setting it in *ink* instead clears both
  floors at the *original* 82% with large margin. Both variants were built, measured and screenshotted, and
  **the client chose the glass on 11 Aug** — *"Lets go ahead with Option A"*. **What ships is ink type on
  the 82% wash**, measured 6.02–6.63:1 across all three routes at four widths; the binary-searched 97% is
  kept on record as the number to return to only if gold text ever comes back to that panel.
  **Implementing it took one thing the comparison had not covered:** Variant A had been measured before the
  panel's "Where next" hint had any probe, so dropping the wash with that hint still gold would have moved
  the failure rather than fixed it. Option A means *every* text run in the panel is ink. Gold keeps the
  panel's rules and focus ring — non-text, a 3:1 floor. Full working, including both wrong turns, in
  `docs/DECISIONS.md` §16.
- **Three rig gaps the plan didn't name were also found and fixed**: `check_menu.mjs` was still asserting
  against a seven-anchor chapter list that no longer exists (rewritten for three places, real routes,
  `aria-current`, and the same focus-trap/scroll-lock machinery, unchanged); `check_leaf_cursor.mjs` and
  `check_rule_in.mjs` still selected `#chapter-menu`; and `check_rule_in.mjs`'s checks 2-5 and 6 probed the
  hamburger for a hairline it correctly does not carry (retargeted to the footer's own "Mahua Vann" link).
  A latent instrument defect was also caught and fixed: `check_rule_in.mjs`'s check 7 mis-parsed
  `color-mix()`'s `color(srgb …)` computed-style serialisation and reported a luminance delta of
  231,251,768.592 — comfortably over its own 0.15 floor either way, so never a false pass on a broken rule,
  but never really measuring the claim it reported either.

**Evidence:** `docs/reviews/2026-08-10-site-navigation/` — density, contrast (all three routes, before and
after the glass fix), rule-in, header, the JS budget (159 KB untouched, unchanged), `check_menu.mjs`,
`check_leaf_cursor.mjs`, and 20+ screenshots including the menu opened at 390 and 1440 on `/` and
`/mahua-vann`, looked at rather than only captured. **396 tests at the time, all green** (419 now).

## Where we were before that

**Branch `feat/chapters-rebuild`.** **Plans 3, 4, 5, 6 and 7 are all complete.** The home page opens with a
welcome carrying the client's logo, runs twelve chapters, and carries five signature interactions — the
sliding rule, the leaf cursor, two films and a hanging lantern — plus, since 10 Aug, **the client's forest
drawing tinted into the background of `03 · The Forest`**, re-rendered by him and re-shipped on 11 Aug so the
three Malabar pied hornbills read as the chapter's darkest element (§15). **Both property pages are live**,
`/mahua-vann` and `/mahua-tola`, and were **rebuilt again in Plan 7** into a "shape vocabulary" — eight
chapters each, no two adjacent chapters sharing a shape (mechanically enforced), a persistent booking bar,
the client's own park maps drawn in cream, rooms as a showcase rather than a spec table, six experiences
per property with an honest "also" line for what did not make the six, and contact details in place of the
enquiry form the client dropped. This superseded Plan 6's `ChapterIntro`/`PlateGrid`/`RoomsIndex`/
`FieldNotes` structure, which the client had approved but which still read as a template. The home page's
lodge cards link to both pages internally. Every page verified in a browser by rigs that have been watched
failing first.

**Done 10 Aug, after Plan 7 closed.** The final whole-branch review (run on the most capable model) returned
one Critical and two Important findings that fifteen task reviews had all passed, and all were fixed
(`6dad619`, `cb65fef`, `765a464`):

- **The map was illegible on a phone** — 4.3px labels at 390px, Tola's thirty overprinting. The redesign's
  signature element, decoration on the traffic that matters most. Fixed by growing the type *and* thinning
  the label set below `lg` with a collision-reach calculation (Tola drops 30 labels to 12). `DECISIONS.md`
  §2 #29 records why every rig missed it.
- **The two pages still shared sentences** — the invitation line was byte-identical bar the gate name, and
  it is the last line a visitor reads on either page. The anti-template guard covered the opening headline
  only. Both lines rewritten, guard widened and watched failing. §2 #30.
- **The legend marks could not be told apart** — `gate` and `road` were the same swatch, `zone` had none.

**Also 10 Aug: a guest's face withdrawn on consent grounds** from Mahua Tola's Bonfire entry, replaced with
a frame from the client's own Tola property video that carries no people, and the withdrawn photograph
deleted from the pipeline rather than shelved (`DECISIONS.md` §1, 10 Aug).

**Nothing is half-built.** One task is parked at the client's request (the butterfly, §13 of
[`DECISIONS.md`](DECISIONS.md)). The client-decisions list gained the property pages' first four items from
Plan 6 (see `docs/reviews/2026-08-08-property-pages/README.md`) and Plan 7 added its own three — the
persistent bar, six experiences with an also-line, contact details instead of a form (`docs/DECISIONS.md`
§1, 9 Aug).

**Plan 6 carries a warning worth keeping**, even though its structure is superseded. Its execution session
silently fell back from the intended model after a mid-session interruption, shipped `/mahua-vann` with
failing density evidence committed as "verified", and was caught by the client the same night. The 9 Aug
review-and-correction pass that followed is written up in the evidence README; DECISIONS.md §2 gained
instances 26 and 27 from it. **When resuming an interrupted session, check the model first.**

| Plan | State |
|---|---|
| 3 · [The chapters rebuild](superpowers/plans/2026-08-03-rebuild-chapters-layout.md) | ✅ eight tasks. Day-arc retired, copy harvested, library 14 → 34, twelve chapters, motion primitives, copy, the page, and the verification pass |
| 4 · [The scroll craft](superpowers/plans/2026-08-05-scroll-craft.md) | ✅ seven tasks, five fix rounds. Fixed header, CSS entrances, pinned collage, emblem turn, GSAP out of the critical path |
| 5 · [The signature interactions](superpowers/plans/2026-08-05-signature-interactions.md) | ✅ **nine of ten tasks; the butterfly parked by the client.** Plus three things the plan never contained: the two films, the lantern and the welcome |
| 6 · [The property pages](superpowers/plans/2026-08-08-property-pages.md) | ✅ (superseded by Plan 7) twelve tasks, then a full review-and-correction round (9 Aug). Library 34 → 53 photographs; the contrast rig made route-aware; GSAP's loader gated on the first scrolled pixel |
| 7 · [The property pages redesign](superpowers/plans/2026-08-09-property-pages-redesign.md) | ✅ fifteen tasks. New shape vocabulary (`fullBleed`/`column`/`map`/`showcase`/`pair`/`press`/`invitation`) replaces Plan 6's structure; the client's Pench and Tadoba maps traced into cream field-guide artwork (`scripts/build_map.mjs`); Task 15 closed it out with both routes' rigs green and the home page proven untouched — `docs/reviews/2026-08-09-property-redesign/README.md` |
| 8 · [Site navigation](superpowers/plans/2026-08-10-site-navigation.md) | ✅ six tasks. `SiteMenu` (places, not chapters) and `SiteFooter` (the Website Directory) ship on all three routes; `ChapterMenu` retired. Task 6 closed it out — found and fixed a real 4.5:1 contrast failure in the menu's glass wash that no earlier probe had looked for, plus three unnamed rig gaps and one instrument defect — `docs/reviews/2026-08-10-site-navigation/README.md`, `docs/DECISIONS.md` §16 |
| 9 · [The rooms card stack](superpowers/plans/2026-08-11-room-card-stack.md) | ✅ eight tasks and **six fix rounds** — Tasks 3, 5 and 6, twice on Task 7 from findings its own 390px read produced, and one after the whole-plan review found a Critical all eight tasks had missed (a photograph losing 51% of its width at 1024×1366, outside the four viewport shapes every rig samples). `RoomShowcase` retired on both property routes; the sticky/`view()`-timeline construction was wrong twice in opposite directions before what shipped, and a photograph's width-crop bound shipped illegible on five (then six) cards before an eighth rig assertion closed the gap — `docs/reviews/2026-08-11-card-stack/README.md`, `docs/DECISIONS.md` §17 |

### Where Plan 5 actually got to

The plan was written for a leaf cursor and a *hand-drawn* ink tiger. The tiger half of it was overtaken by
events — read [`DECISIONS.md`](DECISIONS.md) §8 and §9 before touching any of it.

| Task | State |
|---|---|
| 1 · The sliding rule | ✅ `currentColor` hairline under every link, on hover **and** focus. Coverage is a markup contract: every link carries `rule-in` or `data-rule="none"`. Rig: `scripts/check_rule_in.mjs` |
| 2 · The leaf | ✅ The client's own hand-drawn PNG. Two earlier attempts (extracted from their logo, then drawn by me) are kept as evidence |
| 3 · The leaf cursor | ✅ Follows, swings, warms to gold, stops its own loop. Removability enforced by test |
| 4 · Cursor rig | ✅ `scripts/check_leaf_cursor.mjs`, seven checks, three watched failing first |
| 5 · The ink tiger | ✅ built from the client's licensed vector — **then replaced by film.** Dormant, intact, one line from returning |
| 6 · It inks itself in | ✅ built, now dormant with the component |
| 7 · It lives, dozes, stirs | ✅ built, now dormant with the component |
| — · The two films | ✅ **not in the plan.** Tiger closes `field-days`, potter closes `rooted`. `SignatureFilm` serves both |
| — · The hanging lantern | ✅ **not in the plan.** Client request 7 Aug. Hangs out of `after-dark` into `06 · The Lantern Hour`, swings when pushed, comes to rest on its own |
| — · The welcome screen | ✅ **not in the plan.** Client request 8 Aug. Their own logo, flower turning, gone in 2.1s, **no JavaScript at all** |
| 8 · The butterfly | ⏸ **parked by the client, 8 Aug.** Their overlay films cannot be used — chroma green, butterflies 1.9% of frame width. Restart notes and a re-render brief in [`DECISIONS.md`](DECISIONS.md) §13 |
| 9 · The tiger rig | ✅ **rewritten for film**, 8 Aug. `scripts/check_films.mjs` — the plan's SVG-inking version was obsolete and was not built |
| 10 · Verification + docs | ✅ done 8 Aug. Eleven rigs green, 20 evidence frames, [`reviews/2026-08-05-signature/README.md`](reviews/2026-08-05-signature/README.md) |

**Done 7 Aug:** the potter is up against the copy. The client's note — "it still feels pretty disconnected
from the section" — turned out to be about the *drift*, not the margin: the pinned photographs are still
displaced when the scene releases, so a figure laid out 16px below the composition was read 148px below the
nearest photograph and 268px below the prose. `PinnedCollage`'s footer now pulls up by `50vh - C/2 - 56px`,
holding the gap at **56px from 1440×860 to 2560×1440**, and `check_pinned_collage.mjs` asserts it. Full
working in [`DECISIONS.md`](DECISIONS.md) §10.

**Also done 7 Aug:** the client's watercolour lantern hangs out of `after-dark` into `06 · The Lantern Hour`
and swings when pushed — a damped pendulum that comes to rest on its own and stops its frame loop with it.
Measured: peak 8.9–13.1°, six or seven crossings of vertical, settles at 0.00°, and the page's frame rate
returns to its idle 130/s. It hangs at 200px from 1440 up, 128px from 1280, 168px below `lg` where it falls
over the bonfire, and **is hidden between 1024 and 1279px** where the composition leaves it no room. Full
working, including the two instruments that were wrong before the page was, in
[`DECISIONS.md`](DECISIONS.md) §11.

**Also done 7 Aug: the two films' stills came out of the initial load, and it bought the hero 537 ms** —
4,512 → 3,975 ms, medians of five on one build with only that change differing, both ranges inside 60 ms.
That is more than every other lever ever measured on this page put together, and it was pure waste rather
than a trade: a `<video poster>` is fetched immediately however far down the page it sits. Initial load
684 → **581 KB** at 390px and 808 → **705 KB** at 1440px. The still is now an `<img loading="lazy">` layered
under the film; see [`DECISIONS.md`](DECISIONS.md) §3 and the notes in
`components/signature/SignatureFilm.tsx`, three of which are load-bearing.

**Done 8 Aug: Plan 5 task 9, rewritten for film.** `scripts/check_films.mjs` covers what the plan's
SVG-inking version never could — both films play once, hold their last frame at 10.00s, replay on a
deliberate hover, ignore a hover mid-play, stay put under a parked pointer, re-arm when it leaves and
returns, and show no white rectangle (sampled as pixels, 1 level off the chapter's cream). Reduced motion
and no-JS keep the still and never play. Failed against three deliberate breaks before it was trusted; see
[`DECISIONS.md`](DECISIONS.md) §12, including the one assertion that is weaker than it looks.

**Checked 8 Aug: the two butterfly overlay films cannot be used.** Chroma green rather than white, so no
blend mode can erase the ground; and the butterflies are 1.9% of frame width — 5.8px if the film were drawn
at the tiger's size, with 99.89% of 1.8 MB being background. Measurements and the two routes that would
work are in [`DECISIONS.md`](DECISIONS.md) §13. **Task 8 is now blocked on a client decision**, and the
prior question is whether a fourth figure is wanted beside the tiger, the potter and the lantern at all.

**Done 8 Aug: a welcome screen, carrying the client's own logo.** Their rulings: **the real stacked logo**
(not the header's lockup), **a half turn**, **every page load**, and ~2.1s — chosen from three measured
options after they asked for "a few more milliseconds". It carries **no JavaScript at all**, and its base
style is *hidden* so a failed animation means no welcome rather than a wall. `scripts/build_welcome_logo.mjs`
splits the client's PNG into a flower and a wordmark by scanning its own bands of ink, so the flower can
turn inside a logo that is otherwise theirs to the pixel. `scripts/check_welcome.mjs` checks four routes
including scripting-off.

**It is not free, and that is the one open question on it.** The two logo files sit on the first screen, so
they are charged against the hero — see [`DECISIONS.md`](DECISIONS.md) §14 for what that costs and what was
tried. Three instrument defects it exposed along the way are recorded there too.

## Where Plan 7 actually got to

**The redesign, and why it exists.** Plan 6 shipped and the client approved it, then asked for a second
pass 9 Aug: the pages still read like a template, the client's own park maps were unused, and an enquiry
form was a defect waiting to happen (a bare `mailto:` on a phone with no mail client leaves the visitor
believing they wrote to someone). Plan 7 is that second pass, not a bug-fix round on Plan 6.

**The new component inventory** (`components/sections/`, `components/property/`) — each rendered by
`PropertyPage.tsx`'s shape dispatcher, which switches on `PropertyChapter.shape` with an exhaustive
never-check, so a shape with no renderer is a compile error:

| Component | Shape | Carries |
|---|---|---|
| `Hero` (shared with the home page) | `fullBleed` (chapter 0 only) | The opening photograph and headline. Explicitly opts out of `Parallax` — it is the LCP element |
| `FullBleedQuote` (shared with the home page) | `fullBleed` (non-hero, with `quoteCopy`) | A photograph with one line of type on it |
| `OpeningColumn` | `column` | The page's one held breath — heading and two paragraphs, no photograph by design |
| `PropertyMap` | `map` | The client's own park artwork (`lib/vann-map-art.ts` / `lib/tola-map-art.ts`, built by `scripts/build_map.mjs`), gates/water/villages/safari zones, the getting-there facts |
| `RoomCardStack` + `RoomCard` | `showcase` | **Replaced `RoomShowcase` on 11 Aug 2026.** Each room is a card that pins below the header while the next rises over it; covered cards recede. Zero JavaScript — `position: sticky` plus a scroll-driven animation off a non-sticky sibling slot's named timeline. The card's composition is derived from the photograph's own aspect (`lib/room-card.ts`), not hand-set. `docs/DECISIONS.md` §17 |
| `ExperiencePair` | `pair` | Six experiences at two weights (`hero`/`quiet`) plus an optional `alsoLine` naming what did not make the six |
| `PressBand` | `press` | Vann only — three real press citations, set as type, deliberately not as three foreign publications' logos |
| `PropertyInvitation` | `invitation` | The closing ask: heading, the booking pill, `ContactBlock`, and a full-width photograph of the *other* lodge |
| `PropertyBar` | (fixed chrome, not a chapter) | The persistent booking bar — slides in past the hero, steps aside over the closing invitation, renders nothing without JavaScript |
| `ContactLine` / `ContactBlock` (`PropertyContact.tsx`) | — | The phone/email/address that replaced the enquiry form. `ContactLine` (the bar's own line) is hidden below 640px, present from 640px up |

`RoomsIndex` and `FieldNotes` (Plan 6) are retired — nothing imports them and `tsc --noEmit` proves it.

**Task 15 closed the branch out** (9/10 Aug): every rig green at both real routes, the home page proven
untouched by the same three rigs that guard it, `vann-table`/`tola-table` measured for the first time
(both clear their contrast floor on `FullBleedQuote`'s untouched default scrim), and eight screenshots
opened and read rather than only captured. Three of eight chapters across both pages could not be brought
inside the 45% density ceiling despite genuine, measured attempts (`vann-forest` 55.8%, `vann-press` 87.2%,
`tola-reserve` 58.3%) — reported rather than forced; see `docs/reviews/2026-08-09-property-redesign/README.md`
for the full working and what was tried and reverted. **371 tests, all green.**

## What a Plan 6 inherits

**A finished home page and a clean base.** 280 tests, `tsc` / `build` / `lint` / `verify:budget` all clean,
and **fourteen asserting rigs** in `scripts/`, every one of which exits non-zero on failure and has been
watched failing against a deliberately broken build. Nothing is half-built and nothing is owed from Plans 3
or 4 beyond the deferred minors in [`DECISIONS.md`](DECISIONS.md) §6.

**Two things are the client's to settle, and neither blocks anything:**

1. **The hero photograph lands at 4,308 ms against a 2,500 ms budget.** Every engineering lever has been
   measured and each remaining one is worth ~200 ms; the gap is ~1,808 ms. It needs a **smaller hero
   photograph or a lighter first screen**, which is a design decision. §3.
2. **Eleven hard numbers in the copy are unconfirmed** — room counts, acreage, drive times. The sharpest:
   the live site lists twelve rooms for Mahua Tola while the brand record says fourteen.
   [`copy-provenance.md`](copy-provenance.md).

**And one is parked:** the butterfly, §13, with a re-render brief ready for an illustrator.

**The most obvious next piece of work on the page itself** is the `field-days / rooms` join, the emptiest
screen on the page at 73.4%. It is the join the tiger closes, and it has never had the treatment `rooted`'s
join got on 7 Aug. Look there before looking at any chapter — §10.

Out of scope until asked: other pages, the booking restyle, Tripadvisor wiring, the SEO redirect map, Sanity.

**The current density figures**, measured 7 Aug with both films in place and the potter moved — every
chapter inside non-negotiable #8's 45% ceiling:

| | mean empty | worst screen | note |
|---|---|---|---|
| `rooted` | **39.7%** | 44.5% | potter 56px below the last paragraph; was 41.8% / **55.9%** before the move |
| `field-days` | **44%** | 58% | tiger film at 300px |
| `lantern-hour` | **36.4%** | 41% | lantern hung at 200px; was 37.9% / 41.7% |
| page | **40.1%** | 73.4% | 2.03 photographs per screen, 51.9% imagery |

Re-measured 8 Aug on the final build. **All twelve chapters are inside the 45% ceiling.** Plan 5 left the
page ~0.6 points emptier on the mean than it found it — a figure standing in a chapter adds height as well
as imagery — and `field-days` is the one that moved the wrong way, 41.6% → 43.9%, which is what the tiger
costs it.

`measure_density.mjs` could not see the lantern at all until it was fixed on 7 Aug — `elementsFromPoint`
skips `pointer-events: none`. Any future ornament that hangs over copy has the same problem; the rig now
handles it, but the lesson is that an image can be on the page and absent from the measurement.

The page's emptiest screen is the `field-days / rooms` join at 73.1%. `rooted / forest` was 76.9% and is now
**68.8%**, which the potter's move bought.

**Two things Plan 5 inherits and must respect:**

- **Non-negotiable #5** — the tiger *arrives, performs, then dozes*. It is not a permanent fixture;
  permanent peripheral motion contradicts "seduce, not convert" and "restraint is a requirement".
- **The critical path is clean and must stay clean.** Plan 4 took first-load JS from 750.6 to 642.7 KB by
  moving GSAP behind a dynamic import, and `npm run verify:budget` **fails on the bytes** if that stops
  being true. A cursor that follows the pointer and a tiger that walks are both scrub-shaped work — they
  belong behind the same deferred import, not in the first load.

**219 tests.** `/` is twelve chapters and 34 photographs over ~17 screens at 1440×900.

## Where the durable record lives

**[`docs/DECISIONS.md`](DECISIONS.md)** holds every client ruling with its reasoning, the forty-three-instance
catalogue of this project's recurring defect, why the hero's budget is unreachable, and the things that look
broken and are not. It exists because the per-task ledgers at `.superpowers/sdd/*/progress.md` are
**git-ignored** — 335 lines across four plans that would not survive a fresh clone. Anything learned that
outlives a task belongs there, not only in a ledger.

## Two decisions sitting with the client

Neither blocks Plan 5. Both were measured rather than argued, and both are recorded here because they exist
nowhere else a future session will look.

**1. The hero photograph misses its 2,500 ms budget and no available lever closes the gap.** It lands at
**3,419 ms** on Slow 4G. Task 6 measured every lever by rebuilding and A/B-ing rather than reasoning:

| Lever | Worth |
|---|---|
| Deferring GSAP (**spent by Plan 4**) | 213 ms on the hero, **0 ms on LCP** |
| Subsetting the fonts (unspent) | ~215 ms |
| Dropping the fonts' `rel=preload` (uncosted until now) | 172 ms |

**Each lever is worth about 200 ms and the gap is about 1,400 ms.** The hero is 192 KB queued behind roughly
460 KB on a 200 KB/s link — it is bandwidth-bound. Closing it needs **a smaller hero or a smaller first
screen**, which is a design decision, not an optimisation. Note the client chose the sharp hero deliberately
on 5 Aug, knowing it cost time, because at the smaller tier it shipped visibly blurred.

**2. The pinned collage half-delivers, and the lever is photographs, not motion.** The client asked for the
reference's "memory album drifting by". What ships is a headline held still — 0px over 840px of scroll —
while three photographs drift 126/89/50px. The review's judgement: *"Nothing enters and nothing leaves. The
album never turns a page."* It is structural: three photographs cannot produce that effect at any rate inside
`PARALLAX_MAX`. The client already shortened the pin once to stop it costing image density. **If it is ever
asked to do more, the lever is more photographs in `rooted`** — and the library has exactly one image spare.

## Do not read Chrome's LCP as the hero's arrival

Confirmed across **35 runs** in Task 6: LCP resolved to **text every single time** — a paragraph on mobile,
the `<h1>` on desktop — and never once to a photograph. Mobile LCP reads 1,488 ms while the hero itself
lands at 3,419 ms. `scripts/measure_page.mjs` reports the hero's own `responseEnd`; that is the number that
means anything here. **Medians of five** — an unchanged build has produced LCP anywhere from 2,462 to
4,140 ms.

Unexamined anomaly worth a look one day: the **desktop** hero (4,107 ms) is *slower* than the mobile one.

## What Plan 4 built, and what it cost

| | Before | After |
|---|---|---|
| First-load JS | 750.6 KB raw / 232.2 gz | **642.7 / 190.7** (−14.4% / −17.9%) |
| Initial transfer 390 / 1440 | 613 / 730 KB | **574 / 698 KB** |
| Page mean empty · images per screen | 39.0% · 2.08 | 39.3% · 1.98 |

GSAP is no longer in the critical path — it loads in two chunks only once the visitor scrolls, and
`npm run verify:budget` fails on the **bytes** if that ever stops being true. Simple entrances are CSS and
one `IntersectionObserver`; GSAP is kept for scrub-linked work, which is what the reference uses it for too.

**Demo above 1500px.** The pin needs ≥1440 of *layout* viewport, so a Windows laptop at 1440 with a classic
scrollbar will not fire the signature effect at all.

## The measurement rigs, and why they can be trusted

Ten rigs in `scripts/`, every one of them asserting. They earned that in Plan 4: the parallax check was found
to be **blind to 11 of 12 elements** — its two fixed sample offsets fell inside exactly one element's range —
and the proof of the repair was to run the *old* rig against a build with two deliberately-killed parallaxes
and watch it report "1/12 moved, PASS".

**Fourteen defects on this project have been one shape: a check that confirmed a mechanism was configured
rather than that behaviour changed.** Four of them surfaced inside Plan 4, including three that an
implementer found in its own instruments before reporting. When adding a guard here, run it against the
broken state first — that is the house standard, not a nicety.

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

- **`Mahua-property-logos/`** — client-supplied vector logos, added 3 Aug. `Mahua-Resorts.svg` is genuine
  artwork: **340 paths, 0 embedded rasters, 439 groups, viewBox 0 0 500 500**. Per-property marks for Vann
  and Tola, plus EPS/PDF/PNG and a 3D render. **This removes the need to reconstruct the emblem** for the
  planned counter-rotation animation (petals clockwise, leaves anticlockwise) — real petal and leaf groups
  already exist.
- **`public/media/`** — 34 curated images at **four widths each** (400 / 640 / 960 / 1440, plus the source's
  own width where it falls between them), 127 AVIF derivatives, ~20 MB on disk, largest 199.7 KB. **17 are
  `fullBleedSafe`** (≥1400px), up from 2 across the whole previous build. Categories: `lanternHour` 9,
  `forest` 7, `lodgeLife` 13, `details` 5. Disk went up so that transfer could come down: a phone now
  downloads 799 KB for the whole page instead of 3,386 KB. **Distinctness is guarded by perceptual hash** —
  see
  [`docs/reviews/2026-08-04-image-audit/`](reviews/2026-08-04-image-audit/), where four pairs turned out to
  be the same photograph under two ids.
- **`reference/video-stills/`** — three frames harvested from the client's Mahua Tola property video: the
  candlelit petal table, the bonfire, the hammocks. All 1920px, wider than anything from the live site.
- **`reference/video/`** — the client's 1080p property video (25 MB, **git-ignored**). Not usable as video:
  44 shots in 54 seconds, and it shows BeyondStay branding in close-up.
- **`reference/site-copy.md`** — 3,036 words of the live site's copy, by page.

## Open with the client

1. ~~**Does CLAUDE.md #6's 1.5 MB mean the initial load or the whole scroll?**~~ **Ruled 4 Aug: the initial
   load.** A phone pays 399 KB initially (799 KB for the whole scroll) and a 1440px desktop 763 KB
   (1,966 KB scrolled), so both pass. Desktop whole-scroll stays above 1.5 MB and is accepted — the client
   traded that number for the image density that answered their rejection. Written into CLAUDE.md #6.
2. **Is the closing photograph too dark?** It carries the heaviest scrim on the page (`flat .54`), and the
   trade is real: the lighter, radial-led version measured 4.20:1 on body text at 768px against a 4.5 floor.
3. **Should the two `chapterIntro` chapters have a CTA?** Ruled *no* on 4 Aug — the header, the lodge cards
   and the closing invitation already invite, and a fourth would make the page a booking funnel. Reopen only
   if the client asks.

## Still owed to the client

**From the 26 August restructure (`feat/journal-and-mobile`), still owed — see `docs/DECISIONS.md` §22:**

- **The widget's no-JavaScript fallback sentence.** `ReviewWidget` renders a `<noscript>` line only when it
  is given a `fallback` prop, and `Invitation.tsx`'s own comment records that it currently passes none — "an
  omission rather than a choice." Not invented; not owed a copy edit until he supplies one.
- **His Elfsight restyle.** The widget currently renders solid black cards, white text and a green
  Tripadvisor roundel directly on cream, on both property pages (screenshotted, not assumed) — foreign
  against non-negotiable #3. He is restyling it himself in his own Elfsight dashboard; values already given:
  card background `#F1E9D7`, text `#31402C`, meta `#5A5240`, rating `#BB8F2E`, link `#7A5C18`. **Caveat on
  the rating value**: `#BB8F2E` is `PALETTE.gold`, ~2.5:1 on cream — non-negotiable #7 says gold must never
  carry text. Fine for the rating **circles** themselves (decorative); a breach if Elfsight's own theme
  editor paints a numeral (e.g. "4.5") in that colour rather than a shape.
- **His Mahua Tola Elfsight embed code.** Both property pages currently mount the same Elfsight app
  (`REVIEWS_APP_ID`, tied to his Vann/Pench Tripadvisor listing), so Tola's own "Written About" band shows
  Vann's reviews — found in the whole-branch fix wave, 27 Aug 2026, and his ruling was to leave it exactly
  as it is until he sends a Tola-specific embed: *"Keep it as it is for now and i'll share the embeded code
  for the Mahua Tola widget later when i make it — keep it same for all three pages for now."*
  `PressBandCopy.reviewsAppId` (`content/mahua-tola.ts`, `pressCopy["tola-press"]`) is where it goes — a
  one-line drop-in, not a code change. `docs/DECISIONS.md` §22.11.
- **A paid Elfsight plan**, to remove the free-tier "Free Tripadvisor Reviews Widget" badge stamped under the
  review cards at every width, before launch.
- **Confirmation of the Vercel plan.** The free tier does not permit commercial use, and the site is already
  deployed (`feat/home-v2`, `https://mahua-resorts.vercel.app`) — this needs settling independent of anything
  this restructure changed.
- **A ruling on `vann-press`/`tola-press`** at 80.0%/82.1% empty — both real, measured figures now (a
  shadow-DOM instrument fix stopped the rig scoring the widget's own review cards as bare cream), both
  improved over their pre-branch figures, and both still well over the 45% ceiling. **Both figures swing
  with the widget's own carousel state and must not be quoted as settled** — `docs/DECISIONS.md` §22.9–§22.10
  and `docs/reviews/2026-08-26-restructure/density-variance-NOTE.md` have the full before/after and the
  observed range.
- **A ruling on `tola-rooms`**, newly reading 45.3% worst (`vann-rooms` passes at 43.7%) — a real,
  reproducible figure first noted in a task report's prose and never put to him. `docs/DECISIONS.md` §22.9.
- **His "a few minor changes"**, noted while reviewing the 26 August restructure on 27 Aug and chosen to
  give later rather than in that sitting — ask for them before this branch closes. Nothing else is recorded
  about what they are.

**From the mobile, tablet and zoom work (`feat/journal-and-mobile`, 27-28 Aug 2026), still owed — see
`docs/DECISIONS.md` §23:**

Nothing here is blocking; everything below is a genuine finding this plan traced and deliberately left
unfixed, either because it touches a composition the client has ruled to leave alone, because fixing it
would be a visible-design change the plan's own global constraint forbids, or because it needs its own task
and review the way `CLAUDE.md` already says a park-map fix does.

- **(a) `RoomCardStack`'s room cards clip their own text at 150%/200% OS text scale.** The client's 27 Aug
  ruling was to leave the card stack alone architecturally — that ruling answered a *different*, false
  finding ("six screens of blank cream"), not this one. This is a real accessibility gap for a visitor who
  has set larger system text, and he has not been told about it. **The newest of these four, and the one
  that most affects a real visitor.**
- **(b) `PropertyContact`'s email/address block wraps into itself at the same 150%/200% OS text scales** —
  confirmed genuinely new (none of its 18 findings are already present at 100% zoom), not touched by any
  ruling to date.
- **(c) The property map's legend column wastes roughly 1.5 screens of scroll at landscape-phone width
  (844×390)** — `PropertyMap.tsx`'s facts/legend column has never been given the `pocket:`/`short:`
  compaction `Hero.tsx`, `FullBleedQuote.tsx` and `Invitation.tsx` already carry for exactly this shape.
- **(d) The property map's `<text>` labels are already crowded at rest, independent of OS text scaling** —
  the committed Mahua Tola screenshot at 390px shows two real collisions with no scaling applied at all:
  `Nimdela` running into the `Zone 3` marker, and `Devada Adegaon` overlapping `Zone 4`. 70 of 71 map-label ×
  map-label pairs already intersect before any scaling is applied — a pre-existing crowding fact, not a
  scaling regression. Separately, the labels also never move with OS text size at all, at any width:
  `LABEL_TEXT_SIZE` sizes each tier as a literal pixel value inside the SVG's own coordinate system. Same
  component `CLAUDE.md` already says a label fix needs its own task and review for.

**The Journal page — approved, not yet planned or built.** This is why the branch is named
`feat/journal-and-mobile` rather than for the restructure above, which is the second of three bodies of work
the client agreed to on 26 Aug 2026.
[`docs/superpowers/specs/2026-08-26-journal-page-design.md`](superpowers/specs/2026-08-26-journal-page-design.md)
carries his rulings (entries mixing short field notes and long-form articles, unauthenticated comments held
for his approval, a standalone photo gallery he and his team alone upload to) and invents no copy. Not
started.

- **The targeted shot list** — the 3–4 photographs that would most transform the page, so a small shoot can
  be priced precisely. The library tops out at 1920px and only 17 of 34 images clear 1400px. **More urgent
  than it was**: the audit of 4 Aug cut four duplicates out of what was thought to be a 35-image library,
  and three of the replacements are frame-grabs from a property video. The client confirmed a fresh photo
  and video shoot is planned but **not soon**, and that newer assets can replace these later.
- **Plan 4:** the signature interactions — spinning mahua emblem, leaf cursor, ink tiger.
- **Plan 5:** performance hardening, the SEO redirect map (spec §10), Sanity CMS wiring.

**From Plan 7 (9/10 Aug), still owed:**

- **Tola's room count** — twelve on the live site's own structured list, fourteen in the brand record (three
  river-facing machaan rooms under construction, no published facts yet). `content/mahua-tola.ts` states
  twelve and flags it; not this task's call.
- **Nagpur's distance from both lodges** — Vann: 80 km live vs 104–112 km brand record; Tola: 100 km live,
  uncorroborated. Both pages name Nagpur as the gateway city and state no figure.
- **Tola's map: the gate/zone marker distinction is confirmed too subtle by eye**, and there is no legend
  entry at all for what a safari-zone square means. Screenshotted and reported, not fixed —
  `docs/reviews/2026-08-09-property-redesign/README.md` §5.
- **Three chapters remain over the 45% density ceiling** — `vann-forest` (55.8%), `vann-press` (87.2%),
  `tola-reserve` (58.3%) — after real, measured improvement. The remaining levers would either widen a
  deliberately quiet screen past what non-negotiable #4 protects or enlarge press citations past "set
  quietly". Same README, §2.

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
