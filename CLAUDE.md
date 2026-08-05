# Mahua Resorts — Website 2.0

New home page for **Mahua Resorts**, a family-run boutique wildlife lodge brand in central India.
Replaces a monotone WordPress template site. Concept: **a dense, image-led journey in chapters** — cream
throughout, in the layout language of [thesujanlife.com](https://thesujanlife.com/), rendered in a
hand-drawn field-guide idiom.

> **Read these four, in order, before doing any work:**
> 0. [`docs/DECISIONS.md`](docs/DECISIONS.md) — **every client ruling, the fourteen-instance defect
>    pattern, and the things that look broken and are not.** Distilled from the per-task ledgers, which are
>    git-ignored and do not survive a clone. Read it before relitigating anything.
> 1. [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) — where we are, what came before, what the client has
>    said, and what is still owed. **Start here for state.**
> 2. [`docs/superpowers/plans/2026-08-05-scroll-craft.md`](docs/superpowers/plans/2026-08-05-scroll-craft.md)
>    — the most recent plan, complete. Its predecessor,
>    [`2026-08-03-rebuild-chapters-layout.md`](docs/superpowers/plans/2026-08-03-rebuild-chapters-layout.md),
>    is also complete and still describes the page's structure. Both override the original spec where they
>    conflict with it.
> 3. [`docs/reference-sujan-layout.md`](docs/reference-sujan-layout.md) — the layout language the client
>    asked us to follow, analysed from the live reference site.
>
> The original spec,
> [`docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md`](docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md),
> still holds for everything the plan doesn't touch — its §3, §4.1 and §13 are superseded.

## Status

| | |
|---|---|
| **Phase** | **Plan 4, the scroll craft, complete** — on `feat/chapters-rebuild`, reviewed whole-branch and cleared to show the client. Plan 3 finished before it. A fixed header that gains cream and the brand's brown, CSS entrances measured off the reference, a pinned collage on *02 · Rooted like the mahua*, the emblem turning once, and **GSAP moved out of the critical path**. Plan 5 is next: the leaf cursor and the ink tiger. |
| **Working mode** | Implementer + adversarial reviewer per task, fix rounds where needed. Plan 4 ran seven tasks, five fix rounds, and a whole-branch review. |
| **Scope** | Home page only. Other pages, booking restyle, CMS wiring are all out of scope. |
| **See it** | `npm run dev` → `/`. Twelve chapters, 34 photographs, ~17 screens at 1440×900. **Demo above 1500px** — the pinned collage needs ≥1440 of *layout* viewport, so a Windows laptop at 1440 with a classic scrollbar will not show it. |
| **Tests** | **219**, all green. `npm test` must stay green before any commit claiming completion. |
| **Evidence** | `docs/reviews/2026-08-05-scroll-craft/` (Plan 4) and `2026-08-04-task-7/` (Plan 3). **Every number is re-derivable with one command** — the rigs live in `scripts/` and each one asserts. `npm run verify:budget` builds, serves, measures and propagates its exit code. |

## The non-negotiables

Decided and reasoned through with the client. **Do not relitigate these without being asked to:**

1. **Two properties** — Mahua Vann (Pench) and Mahua Tola (Tadoba). Mahua Bagh is removed from the brand;
   the live site still shows it and is wrong.
2. **Seduce, not convert.** Unhurried and warm, gentle push toward "discover". Not a booking funnel.
3. **Cream is the page, throughout.** Base `#F1E9D7`, second surface `#E9DFC8`, ink `#31402C`, dim
   `#5A5240`. No dark sections except photographs and their overlays — see spec §9, the client raised this
   and was right, and Plan 3's rejected-build review reconfirmed it.
4. **Restraint is a requirement, not a preference.** Sujan is both the tone and the layout benchmark now —
   it reads expensive because it holds back. Nothing bounces. If you notice the animation, it is too fast.
5. **The tiger arrives, performs, then dozes** (Plan 4, not yet built). It is not a permanent fixture —
   permanent peripheral motion contradicts #2 and #4.

   **`rooted` is the page's one pinned scene** (Plan 4 Task 3c) and the only place `StickyScene` is mounted.
   The rule it was written under still binds anything else that reaches for it: use it only where the content
   genuinely advances through the pin. There, a chapter is held still while three photographs rise past it at
   three rates — measured at 0px of headline movement over 840px of scroll, and 126/89/50px of drift. The
   pin is **server-rendered off**, because `position: sticky` would pin perfectly well with no JavaScript over
   a composition that, with no JavaScript, can never move — two paid-for empty screens. Script may only switch
   it on, and only above `(min-width: 1440px) and (min-height: 860px)`, where the frozen chapter fits one
   screen. Re-derive any of it with `node scripts/check_pinned_collage.mjs`.
6. **Budgets beat effects.** Largest image < 200 KB; **initial page transfer < 1.5 MB**; hero photograph
   on screen in < 2.5s on simulated 4G. Most traffic is Indian mobile. If a beautiful effect cannot hit
   budget, the effect loses.

   **The 1.5 MB is the initial load, not the whole scroll — the client ruled this on 4 Aug**, when the two
   readings collided with the image density that answered their rejection of the previous build. "Initial
   load" is what a visitor pays before scrolling; everything below the fold is lazy. Measured after the
   responsive-image work:

   | | Initial load | Whole page scrolled |
   |---|---|---|
   | 390px | **574 KB** ✓ | 1,501 KB |
   | 1440px | **698 KB** ✓ | 2,320 KB |

   Both initial figures fell on 5 Aug (from 613 and 730 KB) when Plan 4 took the tween library out of the
   first load — see `docs/reviews/2026-08-05-scroll-craft/`. At DPR 3 the same page is 673 KB and 960 KB
   initial, still inside budget.

   **These rose on 5 Aug and the rise was bought deliberately.** The table read 399/763 KB until the client
   chose the sharp hero: `sizes` now hands a 390px phone the 1440-wide hero (192 KB) rather than the
   400-wide one (21 KB), because at 400 the photograph was drawn at a third of the resolution it needed and
   shipped visibly blurred. Initial load still passes at both widths. Do not "restore" the old figures by
   reverting that — it is one line in `components/sections/Hero.tsx`, and it brings the blur back.

   **Desktop whole-scroll sits above 1.5 MB and is accepted under this reading.** Do not "fix" it by
   cutting photographs — density is why this plan exists (non-negotiable #8), and the client has already
   traded that number away deliberately.

   **Do not check the < 2.5s with Lighthouse's LCP.** Chrome resolves this page's LCP to a paragraph, not
   to the hero photograph, so LCP read 1.4s on 4 Aug while the hero itself was landing at 4.9s on a
   throttled link. `scripts/measure_page.mjs` reports the hero's own `responseEnd` — **currently 3,419 ms at
   DPR 1 and 3,922 ms at DPR 3, against the 2,500 ms budget.** It fails, knowingly: the sharp hero costs
   the time. **Medians of five runs only** — single runs on this page vary 2,462-4,140 ms on a
   byte-identical build; `scripts/measure_lcp_arms.mjs --runs 5` is the instrument for that.

   **No lever left on the table closes this gap, and that is now measured rather than assumed** (Task 6,
   5 Aug, `docs/reviews/2026-08-05-scroll-craft/`). Rebuilding with GSAP back in the critical path moved
   mobile LCP by **0 ms** — 1,488 ms either way — and the hero by 213 ms. Blocking *every* font byte buys
   the hero 565 ms, but the lever actually available is subsetting (~43 of the 110 KB loaded), worth about
   215 ms; dropping the fonts' `rel=preload` buys 172 ms and delays the web font by 1.2s. **Each lever is
   worth ~200 ms and the gap is ~1,400 ms.** The hero is 192 KB sitting behind ~460 KB of first-screen
   bytes on a ~200 KB/s link — it is bandwidth-bound. Closing it needs a smaller hero or a smaller first
   screen, which is the client's call, not an engineering one.

   **LCP is text on this page, every time.** Across 35 measured loads LCP equalled FCP exactly and resolved
   to a paragraph on mobile and to the `<h1>` on desktop — never once to a photograph.
7. **Gold is decorative only.** `gold` (`#BB8F2E`) is for rules, ornaments, the emblem — it measures
   ~2.5:1 on cream and must never carry text. `goldText` (`#7A5C18`) is the legible sibling; use it for any
   text or link that would otherwise sit in gold. Guarded by `lib/palette.test.ts`.
8. **Every screen must carry weight.** No section may render more than **45%** empty space at 1440×900. If
   a section cannot be filled, it is cut or merged — not padded. This is the direct fix for the client's
   "too much empty space" complaint.

   **The figure was 30% until 4 Aug 2026, and 30% was wrong.** It was set by intuition before anything had
   been measured. When Task 8 finally measured it, the same rig pointed at
   [thesujanlife.com](https://thesujanlife.com/) — the reference the client chose — scored it **58.1% mean
   empty, failing on 38 of its 45 screens**, against our own **42.9%**. The rule was stricter than the
   benchmark it existed to chase, and it failed 8 of our 12 chapters while the page was already denser than
   the thing it was being compared to. 45% is the midpoint the client picked between the two, and the page
   as a whole already sits inside it.

   **`rooted` is 40% since the pinned collage landed**, up from 35.3%, and that ~4.7 points is the price of
   the effect: at the two ends of the drift its flanks have moved ±67px from centre and leave a band of
   cream at one edge. It is inside the rule with 5 points to spare.

   **The pin was three screens for one day and the client shortened it to two on 5 Aug 2026.** A pin buys
   scroll and this one adds no photographs, so at three screens the page-wide figure the client actually
   cares about went the wrong way: imagery per screen 2.08 → 1.87, and the join below `rooted` 61.7% →
   64.9% empty. Shortening bought most of it back — **1.98 photographs per screen, page mean 39.5%, the join
   63.5%** — and cost `rooted` itself nothing (40.2% → 40%, worst 42.3% → 40.8%). The lesson is in that last
   pair: a chapter's *mean* is set by its composition, not by how many screens of it there are, so the pin
   length is a page-density lever and not a chapter-density one. Look at images-per-screen, not at the
   chapter, when judging whether a pin is worth its scroll.

   **All twelve chapters are inside it as of 5 Aug 2026.** The three that were over were fixed by taking
   width and height back rather than by adding filler: `details` 58% → **42.1%** (a shared plate frame,
   imposed only where a grid's photographs disagree about their shape), `field-days` 51.1% → **41.6%** (the
   reserve photograph off the bench, and the thin band recomposed), `lantern-hour` 46.7% → **36.6%** (100px
   of screen width moved from the prose column to the photographs). Page mean 42.9% → **39%**; imagery is
   53.8% of the average screen, up from 49.7%.

   The five emptiest screens on the page belonged to **no chapter at all** — they were the joins, where one
   section's bottom padding met the next one's top, 192px of stacked cream appearing in nobody's score.
   That is now 160px. If a future chapter drifts over, look there before looking at the chapter.

   Measure with `node scripts/measure_density.mjs` against a production build; the per-chapter table is
   written to `docs/reviews/2026-08-03-chapters/density.json`. Do not lower the rule again to make a
   chapter pass.
9. **A pin must earn its scroll, and its drift budget is spent.** `rooted` is the only pinned chapter and
   holds for one screen. The leading photograph drifts at exactly `PARALLAX_MAX`, so **a further shortening
   must drop the pin, not shrink it** — less scroll would mean less drift, and the cap cannot rise.
   Measured 5 Aug: the pin costs 793px and 0.10 images per screen, and buys the page's only moment of
   stillness in 17 screens. At three screens it was indefensible; at two it is roughly break-even. If it is
   ever asked to do more, the lever is **more photographs in `rooted`**, not a longer hold — the effect the
   client asked for needs images entering and leaving, and three cannot produce that at any rate.
10. **Alternate the rhythm.** Never two consecutive text-only screens — a full-bleed photograph or an
   image-led block must sit between them. Enforced mechanically by a test on `content/chapters.ts`, not by
   good intentions.
11. **Only images ≥ 1400px wide may go full-bleed.** Narrower images tiled edge-to-edge is exactly the
    "resemblance to a template, not the reference" complaint. `lib/media.ts` marks each entry
    `fullBleedSafe`; below 1400px it must be `false`.

**Contrast is checked by test, not by eye.** `lib/contrast.ts` + `lib/palette.test.ts` guard the fixed
palette (≥4.5:1 body text, ≥4.5:1 links, on both paper surfaces). Text laid over a photograph (hero,
full-bleed quotes) needs its own check — a scrim or equivalent, verified by a contrast test against the
actual rendered result, not assumed from the image looking dark enough.

## Architecture rule

Two files are **dials**. No component may hard-code a colour, a duration, or a string of copy — all three
are imported:

| File | Holds |
|---|---|
| `lib/palette.ts` | The fixed cream palette (`PALETTE`) |
| `lib/motion.ts` | Every duration and easing |
| `content/home.ts` | Every word on the page |

**A client component's `import`s are what ship to the browser; its `children` are not.** `PinnedCollage` is a
server component that hands two finished compositions to the client one that picks between them, because
importing `ui/Photo.tsx` from a `"use client"` file would drag all thirty-four entries of
`lib/media-manifest.ts` — each with a base64 blur URI — into the first load. Passing rendered children keeps
it on the server. Anything that needs a browser decision over server-rendered markup should do the same, and
`npm run verify:budget` is what proves it did.

Each chapter section component (`components/sections/`, Plan 3 Task 7) is self-contained and never reaches
into another. `content/chapters.ts` is the page's spine — twelve chapters, 32 distinct photographs, and the
rhythm rule. The sequence lives there, not in `app/page.tsx`, and `content/chapters.test.ts` enforces it.

## Where things are

| Path | What |
|---|---|
| `docs/superpowers/specs/` | The original approved spec |
| `docs/superpowers/plans/` | Plan history — `2026-08-03-rebuild-chapters-layout.md` is current |
| `docs/PROJECT-STATE.md` | **Session handoff** — state, history, client findings, what's owed |
| `docs/reference-sujan-layout.md` | The reference site's layout DNA, analysed from screenshots |
| `reference/site-copy.md` | 3,036 words of the live site's copy, by page (Plan 3 Task 2) |
| `docs/copy-provenance.md` | **Where every line came from**, and the eleven hard numbers awaiting the client |
| `Mahua-property-logos/` | Client-supplied **vector** logos — real paths, not traced. Emblem is 340 paths / 439 groups, so petals and leaves already separate |
| `public/media/` | 34 curated images at four widths each (400/640/960/1440), 17 of them `fullBleedSafe`. **Distinctness is guarded by perceptual hash** — four pairs turned out to be the same photograph under two ids on 4 Aug |
| `reference/video-stills/` | Frames harvested from the client's property video — the petal table, the bonfire, the hammocks. 1920px, so all three go full-bleed |
| `reference/wp-media/` | ~56 images from the live site (30 MB) — crawl + media API |
| `reference/mockup-media/` | 31 images extracted from the prior HTML mockups — **better curated than the live site's** |
| `reference/docs-text/` | Plain text of the four strategy/audit documents |
| `reference/wp-pages/` | Crawled HTML of the current site — **git-ignored; regenerate locally** |
| `scripts/` | The image pipeline, the browser measurement rigs, and the crawl/extract scripts — see Commands |
| `../Mahua_Resorts_Master_Brand_Record.md` | **Single source of truth** for brand, voice, properties, philosophy |
| `../0[1-4]_Mahua_*.docx` | Audit, recommendations, roadmap, benchmark brands |

## Conventions

- **British spelling** in all copy (the current site mixes conventions; the audit flags it).
- **All copy lives in `content/`.** No user-facing strings in components.
- **Verify hard numbers with the client; do not trust the sources.** **Both lodges are 5 km from their
  gate** — Vann from Turia, Tola from Kolara (client-confirmed). The sources publish *five* different
  distances between them and not one is right: Turia as 3 km and 4 km, Kolara as 6 km, 10 km and 12 km.
  Room counts, acreage and drive times deserve the same suspicion — see
  [`docs/copy-provenance.md`](docs/copy-provenance.md) for what is still unconfirmed, and spec §12.
- Copy is drafted from the Master Brand Record and the live site's own text (Plan 3 Task 2), in the
  existing brand voice. The client reviews every line.
- Specificity is the brand's luxury — name a gate, a tigress, a tree, a dish. Avoid reaching for adjectives.
- Never reintroduce the phrase "boutique nature resorts in India" as filler; over-repetition is a named
  audit finding.
- Everything decorative (leaf cursor, tiger, butterfly, grain) is `aria-hidden` and has a defined still
  state under `prefers-reduced-motion`.

## Commands

```bash
npm run dev             # local dev server
npm test                # vitest
npm run build           # production build — must pass before any commit claiming completion
npm run lint
npm run verify:budget   # the JS budget guard, end to end — see below
```

**`npm run verify:budget` is not optional before a commit that touches motion.** It builds, starts a
server, runs `scripts/measure_js_budget.mjs` against it, kills the server and propagates the exit code —
because that rig needs a build plus a running server, cannot join `npm test`, and this repo has no CI, so
its real failure mode was somebody forgetting the three manual steps. It **refuses to measure a server it
did not start**: a stale `next start` on the port would otherwise be measured silently, reporting the
JavaScript of a build that no longer exists. `-- --no-build` reuses `.next`; `-- --port N` moves it;
anything else is passed to the rig (`--width 390`, `--max-untouched-kb`, `--out`).

The browser measurements. **Every committed number in `docs/reviews/` comes from one of these** — they live
in `scripts/` precisely so nobody has to trust a figure they cannot re-derive:

```bash
node scripts/build_images.mjs                    # re-encode public/media + lib/media-manifest.ts

npm run build && npx next start -p 3100          # then, against the production build:
node scripts/measure_page.mjs                    # transfer, hero responseEnd on Slow 4G, motion, overflow
node scripts/check_contrast_over_photos.mjs      # worst-pixel contrast for type laid over a photograph
node scripts/check_image_resolution.mjs          # is any photograph served below its own box
node scripts/measure_density.mjs                 # empty space per chapter, against non-negotiable #8
node scripts/check_entrances.mjs                 # did each entrance stage and settle, and did EVERY parallax move
node scripts/check_pinned_collage.mjs            # is `rooted`'s headline frozen and are its photographs drifting apart
node scripts/check_header.mjs                    # the header that stays: both states at 320-1920, reduced motion, no-JS
node scripts/measure_js_budget.mjs --port 3100   # what JS a visitor pays for before scrolling — or `npm run verify:budget`
node scripts/measure_lcp_arms.mjs --runs 5       # LCP + hero, MEDIANS. --arm no-fonts / no-font-preload costs a lever
node scripts/capture_motion_filmstrips.mjs       # filmstrips for a human to read; its one real check is a floor on distinct entrance samples
```

**`measure_lcp_arms.mjs` is the one to reach for on any arrival question**, because `measure_page.mjs`
runs each figure once and single runs on this page vary by 1.7s. It does not replace it: transfer, motion,
reduced motion and overflow still come from `measure_page.mjs`.

Reference material (already run; rerun only to refresh):

```bash
python scripts/crawl_site.py           # crawl live site pages + imagery they use
python scripts/fetch_wp_media.py       # WordPress media library via its API
python scripts/extract_mockup_imgs.py  # pull images out of the prior HTML mockups
python scripts/extract_docx.py         # plain text of the strategy documents
```

## Verification

**If nothing animates, check the operating system before the code.** Windows *Settings → Accessibility →
Visual effects → Animation effects*, off, makes Chrome report `prefers-reduced-motion: reduce`, and this page
then deliberately switches off every entrance, the emblem turn and the pin. It looks exactly like a broken
build and it caught the client out on 5 Aug. Same code, same server: **37 staged entrances and a pinned
collage with the setting on; 0 and unpinned with it off.** Related: the pin needs 1440px of *layout*
viewport, so a 1440px window with a classic scrollbar silently shows the unpinned version — **demo above
1500px**.

Do not claim work is done without showing it — **verify by running the page, not by asserting it works.**
Run the real page, screenshot at 390 / 768 / 1440 / 1920 px. Automated tests cannot judge whether a page
feels expensive, but every mechanical rule above (rhythm, full-bleed eligibility, contrast, palette) is
covered by a test and must stay green.

**Do not check the image budget with Lighthouse alone.** Chrome resolves this page's LCP to a paragraph,
not to the hero photograph, so LCP passed at 1.4s on 4 Aug while the hero itself was landing at 4.9s on a
throttled link. `scripts/measure_page.mjs` reports the hero's own `responseEnd`; that is the number that
means anything here.
