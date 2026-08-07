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
> 2. [`docs/superpowers/plans/2026-08-05-signature-interactions.md`](docs/superpowers/plans/2026-08-05-signature-interactions.md)
>    — the current plan, **tasks 1–7 and 9 of 10 done**, and it now opens with a status table saying which of its
>    own tasks are still true. Its tiger half was overtaken by events: the client supplied film, so tasks
>    5–7 are built but dormant, **task 9 was obsolete as written** (it measures an SVG inking itself) and
>    shipped instead as `scripts/check_films.mjs`, and task 8 was written before the client supplied
>    butterfly films. **Task 8 is all that is left of the plan.** Two things on the page are in no plan at
>    all — the films and the hanging lantern. Read
>    `docs/DECISIONS.md` §8–§14 alongside it or you will redo work that was expensive to learn.
>    [`2026-08-05-scroll-craft.md`](docs/superpowers/plans/2026-08-05-scroll-craft.md) is complete, and its predecessor,
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
| **Phase** | **Plan 5, the signature interactions — tasks 1–7 and 9 of 10 done, plus two things the plan never had.** On `feat/chapters-rebuild`. A hairline that slides in under every link, the client's own mahua leaf following the pointer, **two animated films** — a tiger closing *04 · Days in the Field*, a potter closing *02 · Rooted like the mahua*, both playing once, holding their last frame and replaying on hover — and **a watercolour lantern hung out of the night photograph into *06 · The Lantern Hour*, which swings when you push it and comes to rest on its own.** Plans 3 and 4 complete before it. **Read [`docs/DECISIONS.md`](docs/DECISIONS.md) §8–§14 before touching the tiger, the films, the lantern, the welcome screen, or where a figure sits in a chapter** — that ground was covered expensively. |
| **Working mode** | Implementer + adversarial reviewer per task, fix rounds where needed. Plan 4 ran seven tasks, five fix rounds, and a whole-branch review. |
| **Scope** | Home page only. Other pages, booking restyle, CMS wiring are all out of scope. |
| **See it** | `npm run dev` → `/`. A welcome screen, then twelve chapters, 34 photographs, two films, a lantern, ~18 screens at 1440×900. **Demo above 1500px** — the pinned collage needs ≥1440 of *layout* viewport, so a Windows laptop at 1440 with a classic scrollbar will not show it, and the lantern is at its full size only from 1440 up. |
| **Tests** | **276**, all green. `npm test` must stay green before any commit claiming completion. |
| **Evidence** | `docs/reviews/2026-08-08-welcome/` (the welcome), `2026-08-08-films/` (the two films), `2026-08-07-lantern/` (the lantern), `2026-08-05-signature/` (Plan 5), `2026-08-05-scroll-craft/` (Plan 4), `2026-08-04-task-7/` (Plan 3). **Every number is re-derivable with one command** — the rigs live in `scripts/` and each one asserts. `npm run verify:budget` builds, serves, measures and propagates its exit code. |

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
5. **The tiger arrives, performs, then dozes.** It is not a permanent fixture — permanent peripheral motion
   contradicts #2 and #4.

   **Built 6–7 Aug, as film.** The client asked for a ten-second loop; a loop is exactly what this forbids,
   and it decodes video for as long as a visitor reads. So both films **play once and hold their last
   frame**, and **hover replays them** — a deliberate hover is the visitor asking, which is a different
   thing from motion happening at them. Two guards stop hover becoming a loop by another name: it is ignored
   while the film is still playing, and the pointer must *leave and return* before it can fire again.

   **All of it is now asserted in a browser by `node scripts/check_films.mjs`** — play-once, hold at 10.00s,
   hover-replay, hover ignored mid-play, and the white ground gone *measured as pixels* rather than as a
   declared blend mode. It fails against a looping film, a lost blend and a restored `poster`. See
   `docs/DECISIONS.md` §9 and §12 — including the one assertion in it that is weaker than it looks.

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
   | 390px | **599 KB** ✓ | 2,945 KB |
   | 1440px | **723 KB** ✓ | 3,763 KB |

   Both initial figures fell on 5 Aug (from 613 and 730 KB) when Plan 4 took the tween library out of the
   first load — see `docs/reviews/2026-08-05-scroll-craft/`.

   **This table was 574 / 698 KB initial and 1,501 / 2,320 KB whole until 7 Aug 2026, and it was stale, not
   wrong.** Nobody re-measured after the two films landed. The whole-scroll figures roughly doubled because
   a visitor who reaches the foot of the page now downloads both films; that sits under the same client
   ruling as the rest of the below-the-fold weight.

   **The films' two stills came out of the initial load on 7 Aug, worth exactly 103 KB at both widths**
   (684 → 581 and 808 → 705). They had been there because a `<video poster="…">` is fetched *immediately*
   however far down the page it sits: `preload="none"` defers the video and does nothing for its poster, and
   there is no lazy equivalent for one. Both were landing at ~28 ms, ahead of the first screen's own
   imagery, for chapters several screens down — 103 KB of ~460 KB of first-screen bytes.

   The fix is in `components/signature/SignatureFilm.tsx`: the still is now a real `<img loading="lazy">`
   layered under the film rather than a `poster` attribute, so the browser defers it natively with no
   JavaScript involved. **Do not "simplify" it back to a `poster`.** Three things there are load-bearing and
   each is commented at the site: the still is the element *in flow* (a `preload="none"` video with no
   poster has nothing to lay out), exactly one of the two is ever visible (both carry `mix-blend-mode:
   darken`, and a still left under a playing film ghosts through it), and the film is server-rendered
   `visibility: hidden` because what a browser paints for a frameless video is unspecified — an opaque black
   box under `darken` would black out the whole frame.

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
   throttled link. `scripts/measure_page.mjs` reports the hero's own `responseEnd` — **currently 4,308 ms
   against the 2,500 ms budget**, median of five, range 4,308-4,325. It fails, knowingly: the sharp hero
   costs the time. **Medians of five runs only** — single runs on this page vary 2,462-4,140 ms on a
   byte-identical build; `scripts/measure_lcp_arms.mjs --runs 5 --port 3100` is the instrument for that,
   and it **defaults to port 3210**, so omitting `--port` fails on a connection refused that looks like a
   broken rig.

   **One lever turned out to be worth more than all the others together, and it was spent on 7 Aug:
   deferring the two films' stills bought the hero 537 ms** — 4,512 → 3,975, medians of five on one build
   with only that change differing, both ranges inside 60 ms. It was pure waste rather than a trade: a
   `<video poster>` is fetched immediately however far down the page it sits. See `docs/DECISIONS.md` §3.

   **And ~320 ms of it went back on 8 Aug, deliberately, to the welcome screen** — 3,987 → 4,308 when the
   client asked for their own stacked logo there in place of the header's assembled lockup. That is 17 KB
   and two requests on the first screen. It was not accepted without a fight: a lighter encode recovered
   ~70 ms of the original 390 and fetching eagerly rather than lazily recovered **nothing** (4,306 vs
   4,308, medians of five). **The client has been told the figure**; if they would rather have the speed,
   reverting is one component. `docs/DECISIONS.md` §14.

   **No lever left on the table closes what remains, and that is measured rather than assumed** (Task 6,
   5 Aug, `docs/reviews/2026-08-05-scroll-craft/`). Rebuilding with GSAP back in the critical path moved
   mobile LCP by **0 ms** and the hero by 213 ms. Blocking *every* font byte buys the hero 565 ms, but the
   lever actually available is subsetting (~43 of the 110 KB loaded), worth about 215 ms; dropping the
   fonts' `rel=preload` buys 172 ms and delays the web font by 1.2s. **Each remaining lever is ~200 ms and
   the gap is ~1,475 ms.** The hero is 192 KB sitting behind ~360 KB of first-screen bytes on a ~200 KB/s
   link — it is bandwidth-bound. Closing it needs a smaller hero or a smaller first screen, which is the
   client's call, not an engineering one.

   **LCP is text on this page, every time.** Across 45 measured loads LCP equalled FCP exactly and resolved
   to a paragraph on mobile and to the `<h1>` on desktop — never once to a photograph. It is also far
   noisier than the hero's own `responseEnd`: 988-1,436 ms across ten runs on 7 Aug while the hero held to
   60 ms within each arm. A few hundred ms of *hero* difference is real; the same in LCP is nothing.
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

   **`rooted` is 39.7% mean and 44.5% worst as of 7 Aug 2026**, against 35.3% before the pinned collage
   landed. That ~4.4 points is the price of the effect: at the two ends of the drift its flanks have moved
   ±67px from centre and leave a band of cream at one edge.

   **Its worst screen was 55.9% — over the ceiling — for as long as the potter sat where it was laid out**,
   and moving the film up to 56px below the chapter's last paragraph is what brought that to 44.5%. The same
   edit took the `rooted / forest` join, the emptiest place on the whole page, from **76.9% to 68.8%**.
   Measured both ways on one build: `docs/reviews/2026-08-03-chapters/density.json` is the after, and the
   before is re-derivable by reverting `PinnedCollage`'s footer margin. See `docs/DECISIONS.md` §10.

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

   **Current, measured 7 Aug 2026 on the build that carries both films and the lantern: page mean 40.1%,
   worst screen 73.4%, 2.03 photographs per screen, imagery 51.9% of the average screen, and all twelve
   chapters inside 45%.** `lantern-hour` is 36.4%, down ~1.5 points when the lantern landed.

   **A film's still is not a photograph, and `collectImages` skips it.** Once the films' posters became real
   `<img loading="lazy">` elements (non-negotiable #6), counting them would have moved `distinctImages` by
   two and `imagesPerScreen` from 2.03 to 2.14 — the figure the client's whole density complaint turns on —
   for no new imagery whatsoever. The films themselves are still counted where it matters, as `<video>`, by
   the coverage pass. `check_pinned_collage.mjs` needed the same lesson: it reported the potter colliding
   with one of the chapter's photographs, and the photograph was its own still.

   **`measure_density.mjs` was blind to anything with `pointer-events: none` until 7 Aug 2026.** It
   hit-tests with `document.elementsFromPoint`, which does not return such elements, so the lantern — which
   is deliberately click-through because it hangs over the chapter's copy — scored as bare paper while
   appearing in the same report's image inventory. Two numbers from one instrument disagreeing is what gave
   it away. The rig now switches those elements clickable for the duration of a sample and puts them back.
   Fixed chrome (the grain, the leaf cursor) is still skipped: it belongs to no chapter.

   The five emptiest screens on the page belonged to **no chapter at all** — they were the joins, where one
   section's bottom padding met the next one's top, 192px of stacked cream appearing in nobody's score.
   That is now 160px. If a future chapter drifts over, look there before looking at the chapter. **The
   emptiest is now `field-days / rooms` at 73.1%**, which is the join the tiger closes; it has not been
   examined the way `rooted`'s was, and its photographs drift 7-24px rather than the pin's 126, so do not
   assume the cause is the same one without measuring it.

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
node scripts/build_lantern.mjs                   # cut the lantern's white ground to real alpha + lib/lantern-art.ts

npm run build && npx next start -p 3100          # then, against the production build:
node scripts/measure_page.mjs                    # transfer, hero responseEnd on Slow 4G, motion, overflow
node scripts/check_contrast_over_photos.mjs      # worst-pixel contrast for type laid over a photograph
node scripts/check_image_resolution.mjs          # is any photograph served below its own box
node scripts/measure_density.mjs                 # empty space per chapter, against non-negotiable #8
node scripts/check_entrances.mjs                 # did each entrance stage and settle, and did EVERY parallax move
node scripts/check_pinned_collage.mjs            # `rooted`: headline frozen, photographs drifting apart, closing figure not stranded
node scripts/check_header.mjs                    # the header that stays: both states at 320-1920, reduced motion, no-JS
node scripts/check_rule_in.mjs                   # the hairline under links: coverage, travel, keyboard, both surfaces
node scripts/check_leaf_cursor.mjs               # the leaf: follow, swing, gold, zero bytes on a phone, AND that its loop stops
node scripts/check_lantern.mjs                   # the hanging lantern: where it hangs, that a push swings it, and that it stops
node scripts/check_films.mjs                     # the two films: play once, hold, hover-replay, and the white ground gone (pixels)
node scripts/check_welcome.mjs                   # the welcome screen: it welcomes, and it ALWAYS leaves — including with no JS
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
