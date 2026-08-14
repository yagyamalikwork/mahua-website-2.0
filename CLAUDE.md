# Mahua Resorts — Website 2.0

New home page for **Mahua Resorts**, a family-run boutique wildlife lodge brand in central India.
Replaces a monotone WordPress template site. Concept: **a dense, image-led journey in chapters** — cream
throughout, in the layout language of [thesujanlife.com](https://thesujanlife.com/), rendered in a
hand-drawn field-guide idiom.

> **Read these four, in order, before doing any work:**
> 0. [`docs/DECISIONS.md`](docs/DECISIONS.md) — **every client ruling, the fifty-three-instance defect
>    pattern, and the things that look broken and are not.** §5 carries the open questions the client
>    still owns: three chapters above the 45% density ceiling and why two of them arguably cannot be
>    fixed, the rooms card stack's mobile growth (measured larger than what he accepted), and **higher-resolution
>    originals now needed for seven photographs** (§19 — the plate reflow's own new exposure, below). **The beside
>    room cards' own density breach — found and, the same day, resolved (14 Aug 2026)**: it measured over
>    the image-sizing plan's ceiling and, on their worst screen, over the general 45% one too, because the
>    photo's own width share had been declared spent at 65% without ever being swept to its real ceiling;
>    widened to `70%/75%` after a measured sweep, both chapters now clear 45% worst with margin. §18's own
>    close carries the sweep. **§19 is the plate boards, rebuilt a second time the same day**: the client
>    re-tested the 13 Aug breakpoint fix on his own machine and found the same shrink still there, because a
>    moved breakpoint cannot answer a defect that was continuous, and the rig built alongside it had
>    certified a page that still shrank every photograph (an 85% tolerance, not a real floor). The rule that
>    replaced it — a plate may never render narrower than its own 1440×900 width, and at one column it fills
>    the container — is now what `PlateGrid.tsx`, `check_plates.mjs` and every plate-width figure below
>    describe. **Read §19 before touching `PlateGrid.tsx`, `check_plates.mjs`, or any plate floor/column
>    figure** — it also carries the one thing still owed the client, higher-resolution originals for the
>    Forest cats and the Rooms photographs, now that a one-column board can draw a plate twice its old size.
>    §7–§15 are
>    the expensive findings: the leaf's
>    removability contract, why three hand-drawn tigers failed, film on cream, what a figure does to a
>    chapter's density, the lantern, the films' rig, the butterfly's restart brief, the welcome screen, and
>    the forest tint. **§17 is the rooms card stack** — a sticky element's `view()` timeline effectively
>    freezes while it is stuck, a wrapper of the card's own height leaves `position: sticky` no slack, and
>    what shipped is a third construction that is neither. **Read §18 alongside it, not instead of it**:
>    13 Aug 2026 retired §17's `stacked` composition and its machinery (`ROOM_STACK.textReserve`,
>    `ROOM_CARD_BOXES`) outright — every room card is `beside` now, by the client's own ruling — but
>    §17's own pinning/receding mechanism (the sticky `view()` freeze, the non-sticky sibling slot,
>    `.room-slot`) is unchanged and still exactly how the stack works. Read both before touching
>    `RoomCardStack`, `RoomCard`, `ROOM_STACK`, or `.room-slot`. Distilled from the per-task ledgers, which are
>    git-ignored and do not survive a clone. Read it before relitigating anything.
> 1. [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) — where we are, what came before, what the client has
>    said, and what is still owed. **Start here for state.**
> 2. [`docs/superpowers/plans/2026-08-05-signature-interactions.md`](docs/superpowers/plans/2026-08-05-signature-interactions.md)
>    — **complete**, and it opens with a status table saying which of its own tasks are still true. Its tiger half was overtaken by events: the client supplied film, so tasks
>    5–7 are built but dormant, **task 9 was obsolete as written** (it measures an SVG inking itself) and
>    shipped instead as `scripts/check_films.mjs`, and task 8 was written before the client supplied
>    butterfly films, which cannot be used and which the client parked. **Three things on the page are in
>    no plan at all** — the two films, the hanging lantern and the welcome screen. Read
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
| **Phase** | **Image sizing — reflow, beside cards, gallery — COMPLETE, DENSITY BREACH AND A SECOND PLATE DEFECT BOTH FOUND AND RESOLVED (13-14 Aug 2026).** Every room card on both property pages is photo-beside-words, alternating sides, its crop bound solved per photograph; and a click-to-expand room gallery ships on CSS `:target` (a Popover-API first attempt was proven, in a browser, to nest its arrows instead of replacing them — rebuilt the same day) at zero added JavaScript. **Read `docs/DECISIONS.md` §18 before touching `RoomCard.tsx`, `RoomCardStack.tsx` or the gallery** — it carries the three 13 Aug client rulings, the retirement of §17's `stacked` composition and its machinery, the per-card solved crop bound, and the density fix below. **A whole-plan verification then found the beside room cards over the density ceiling, and a same-day follow-up closed it**: the build had read `vann-rooms` 43.9% mean / 49.4% worst and `tola-rooms` 44.3% / 50.1% empty — over the plan's own ceiling and, on the worst screen of each, over non-negotiable #8's general 45% ceiling — because the photo's own width share (`RoomCard.tsx`'s `lg:w-[…] xl:w-[…]`) had been declared spent at 65% without ever being swept to its real ceiling. Swept upward (68/70/72/75/78%) and re-measured: `70%/75%` is the chosen value — the most margin of any candidate that still reads as a text column beside a photograph rather than a caption stuck to one (78% passed with more margin but was rejected on sight, screenshotted and opened at three widths on both routes). Now reads `vann-rooms` **36.0%/43.2%**, `tola-rooms` **36.3%/43.5%**, both inside 45% worst; `check_card_stack.mjs` (9/9, both arms) and `check_image_resolution.mjs` (0 under-served) both re-pass. Full sweep table: `docs/reviews/2026-08-13-image-sizing/README.md` §2.5. **The 13 Aug plate fix (moving the three-column tier's breakpoint to `xl`) was superseded the same day it was written — the client re-tested it himself and it still shrank.** His words: *"the images … still shrink with the smaller screen size … also shrink when zoom value reaches 150% and above"*, resizing his own Chrome window rather than using fixed viewport presets. A moved breakpoint cannot fix a continuous defect, and the 13 Aug rig had certified it anyway on an 85% shrink tolerance (65% exemption for a board at minimum columns) — watched failing against that build, 483 failures. **Read `docs/DECISIONS.md` §19 before touching `PlateGrid.tsx` or `check_plates.mjs`** — it carries the client's real rule (a plate never renders narrower than its own 1440×900 width; a board drops a column rather than shrink below it; at one column the plate fills the container, which the client chose over holding size with cream either side, because holding size would breach the 45% ceiling), the flex-wrap construction that replaced a CSS Grid `auto-fit` build that passed every rig and stranded a trailing plate beside bare cream (found by screenshot, not by measurement), and the one new owed item it created: at DPR≥2 the widened one-column state now under-serves the Forest cats (900px source) and Rooms photographs (1440px source) by 22–46%, not caught by `check_image_resolution.mjs`'s fixed DPR sweep. `check_plates.mjs`'s floor assertion is now 1.0 with no exemption. Full evidence: `docs/reviews/2026-08-14-plate-reflow/README.md`. **THE DEMO IS LIVE — https://mahua-resorts.vercel.app (12 Aug 2026).** Deployed from the Vercel CLI, **not** git-connected, so a push redeploys nothing — republish with `npx vercel --prod --yes`. **Read [`docs/DEPLOY.md`](docs/DEPLOY.md) before touching any of it**, especially before connecting the repo in Vercel: connecting without also setting Production Branch to `demo` would point the demo URL at whatever the default branch holds. `main`, `demo` and `feat/chapters-rebuild` are all at the same commit as of 12 Aug — **`main` was 221 commits behind and was fast-forwarded on the client's ruling**, so a fresh clone now gets the real site. **Nothing deployed is indexable**: `lib/indexing.ts` defaults closed and only `NEXT_PUBLIC_ALLOW_INDEXING=true` opens it. **The rooms card stack — COMPLETE (11-12 Aug 2026).** The rooms chapter on both property pages is now a stack of cards that pin below the header while the next rises over them, covered cards receding — **and it adds no JavaScript at all**, 172,272 bytes brotli (was 172,209 as measured 11-12 Aug; the card stack's own delta is still 0 — the +63 bytes is a later, unrelated hover-zoom/scroll feature that landed on the shared branch 13-14 Aug, see `docs/reviews/2026-08-13-image-sizing/README.md` §1.8). Eight tasks, six fix rounds, a whole-plan review that found a Critical the eight tasks had all missed. **Read `docs/DECISIONS.md` §17 before touching any of it.** **Client ruling 12 Aug: desktop is the lens for now** — *"right now our only focus is how it looks on a computer/laptop screen, we can workout and optimize mobile screens later"* — which is sequencing, not a relaxed bar; see §1 and the note under non-negotiable #8. **Site-wide navigation — COMPLETE (10-11 Aug 2026).** The three pages now behave as one website: a `SiteMenu` behind a hamburger lists **places, not chapters** — Home as a plain type row, Mahua Vann and Mahua Tola as **large photograph tiles side by side, half the panel each** (~650px at 1440, stacking full-width below 640px), each **lifting toward the pointer** on hover — on cream glass over every route, and a zero-JavaScript `SiteFooter` (the Website Directory) **in the logo's own wordmark brown** is mounted on all three. `ChapterMenu` is retired. **The tiles, the raise and the brown footer are all the client's, 11 Aug** — see `docs/DECISIONS.md` §1 for all three and non-negotiable #3 below for why the brown is the single dark band on the site. Read **`docs/DECISIONS.md` §16** before touching the glass's wash opacity (currently 82%) or the colour of any text in that panel — **all of it is ink, and the 82% depends on that**: gold text there measures ~3.4:1 against a 4.5:1 floor and forces the wash back to ~97%, which is the near-solid panel the client rejected on 11 Aug when he chose the glass over the accent — three attempts and a fix round sit behind that one number: a modelled fix that still failed measurement, a working fix whose *write-up* didn't reproduce under review, and a solved minimum that only shipped after a rejected-but-recorded ink alternative was measured too. **Plan 7, the property pages redesign — COMPLETE (9/10 Aug 2026), closed out by a fifteen-task whole-branch verification**, still holds beneath the new chrome. Both property pages run a "shape vocabulary" (eight chapters each, no two adjacent sharing a shape) that replaces Plan 6's structure: a persistent booking bar, the client's own Pench and Tadoba maps drawn in cream, six experiences per property with an honest also-line, and contact details in place of the enquiry form the client dropped. **The rooms chapter is now a card stack, shipped 11 Aug 2026** — each room a card that sticks below the header while the next rises over it, covered cards receding, zero added JavaScript (172,272 bytes brotli as of 14 Aug — see the note above; the card stack's own delta is still 0). It replaces the three-photograph-scale showcase, which was hand-cropping two of seven room photographs ~35% of their width and one (portrait) by half its height. **Read `docs/DECISIONS.md` §17 before touching `RoomCardStack`, `ROOM_STACK` or `.room-slot`** — the construction was got wrong twice in opposite directions before what shipped (a non-sticky sibling slot with real slack, not a wrapper and not the card driving its own `view()`), and the same is true of the crop bound: an assertion on photograph width crop said nothing about whether the photo fit the card's own height, and shipped illegible on five, then six, cards at 1440/1920 before `ROOM_STACK.textReserve` and rig assertion 8 closed it. Plans 3, 4, 5 and 6 complete before it: a hairline that slides in under every link, the client's own mahua leaf following the pointer, **two animated films** — a tiger closing *04 · Days in the Field*, a potter closing *02 · Rooted like the mahua*, both playing once, holding their last frame and replaying on hover — **a watercolour lantern hung out of the night photograph into *06 · The Lantern Hour*, which swings when you push it and comes to rest on its own**, and **a welcome screen carrying the client's own logo, its flower turning once, gone in 2.1s and carrying no JavaScript at all.** On `feat/chapters-rebuild`. **Read [`docs/DECISIONS.md`](docs/DECISIONS.md) §8–§14 before touching the tiger, the films, the lantern, the welcome screen, or where a figure sits in a chapter** — that ground was covered expensively. |
| **Working mode** | Implementer + adversarial reviewer per task, fix rounds where needed. Plan 4 ran seven tasks, five fix rounds, and a whole-branch review. Plan 7 ran fifteen tasks, closed by a whole-branch verification (Task 15) that also proved the home page untouched. The site-navigation task found and fixed a real accessibility failure the new measurement it built was written to look for — see §16. |
| **Scope** | The **home page, both property pages, and the site-wide chrome are all done.** `/`, `/mahua-vann` and `/mahua-tola`, rebuilt in Plan 7's shape vocabulary (9/10 Aug) and now sharing one `SiteMenu`/`SiteFooter` (10-11 Aug) in place of the old per-page `ChapterMenu`. Plan 6 shipped once on 8 Aug with failing evidence by a session that had silently dropped to a smaller model, then fully reviewed, corrected and re-verified on 9 Aug (`docs/reviews/2026-08-08-property-pages/README.md`, DECISIONS.md §2 instances 26–27); Plan 7's own Task 15 closed the redesign out (`docs/reviews/2026-08-09-property-redesign/README.md`, instance 28). Open items: a Nagpur distance for both lodges, Tola's map gate/zone marker legibility, and three chapters that remain over the 45% density ceiling after genuine, measured attempts (`vann-forest`, `vann-press`, `tola-reserve`) — full reasoning in that README. **Tola's room count is settled — eleven, 12 Aug 2026** (§1): the Camping Hut is retired and the brand record's fourteen counts three machaans still being built. **Higher-resolution originals are owed, 14 Aug 2026**: the plate boards' one-column state can now draw a plate at up to ~864px, and at DPR≥2 the three Forest cats (curated at 900px) and four Rooms photographs (curated at 1440px) fall 22–46% short — the ask is uncropped originals, ~1800px for the cats and ~2600px for the Rooms photographs (`docs/DECISIONS.md` §19, §5). **The checkout is opened but blocked on the vendor (12 Aug).** `lib/booking/` ships a `BookingProvider` contract, a `MockProvider` that can produce every failure mode on demand, and an `AsiaTechProvider` that throws on every call — **no screens and no payments, deliberately**. AsiaTech has no usable API and their engine **cannot be pre-filled** (tested: a GET 500s, query params are ignored, a cross-origin POST returns an orphaned fragment with no route to payment), so nothing visitor-facing is buildable until they answer the three questions in `docs/superpowers/specs/2026-08-12-branded-checkout-design.md` §8. **Read §8a before building the checkout UI** — it carries four things that plan must inherit. Tripadvisor wiring, the SEO redirect map and CMS remain out of scope until asked. |
| **See it** | `npm run dev` → `/`. A welcome screen, then twelve chapters, 34 photographs, two films, a lantern, ~18 screens at 1440×900. **Demo above 1500px** — the pinned collage needs ≥1440 of *layout* viewport, so a Windows laptop at 1440 with a classic scrollbar will not show it, and the lantern is at its full size only from 1440 up. `/mahua-vann` and `/mahua-tola` are eight chapters each. **Both now pin** — the rooms chapter is a card stack, so scroll into `05 · Rooms` (Vann) or `06 · Rooms` (Tola) and watch the cards pile up under the header. Unlike the home page's collage it needs no minimum width and works on a phone, though **the client's lens is the laptop as of 12 Aug** and the phone is a later pass. Every route carries the same hamburger (three hairlines, cream over a hero / ink on the cream bar) and, at the foot of the page, the Website Directory footer in the brand's brown — the booking bar steps aside for it on the property pages. **Open the menu to see the two lodge tiles**; they are the site's largest photographs after the hero, and they are not in the document until it has been opened once, which is why `check_image_resolution.mjs` now opens it (§2 #39). |
| **Tests** | **467**, all green (was 453 before the image-sizing plan; Tasks 2, 4, 5, 6 and 7 each added coverage, and the 14 Aug plate-reflow fix added the rest). `npm test` must stay green before any commit claiming completion. |
| **Evidence** | `docs/reviews/2026-08-14-plate-reflow/` (the plate boards' second fix — `check_plates.mjs` watched failing (483) against the superseded 13 Aug build, then passing at the real 1.0 floor, on all three routes; measured plate width/column count across nine windows on both live routes; density and transfer confirmed unchanged; the new DPR-under-serving finding), `docs/reviews/2026-08-13-image-sizing/` (the image-sizing plan's own close-out — `check_plates.mjs` and `check_room_gallery.mjs`'s first full runs, `check_card_stack.mjs`'s ninth assertion, density on all three routes including the open rooms-chapter finding, transfer on all three routes, a JS-budget delta traced to a sibling commit, and screenshots read by eye), `docs/reviews/2026-08-11-card-stack/` (the rooms card stack — the rig's eight assertions on both routes, before/after density, JS budget delta-0, and the measured mobile growth against the client's accepted projection), `docs/reviews/2026-08-10-site-navigation/` (the site-wide menu and footer — density/contrast/rule-in/header/JS-budget on all three routes, including the new menu-over-photograph contrast probes and the glass-wash fix in §16), `docs/reviews/2026-08-09-property-redesign/` (Plan 7's close-out — both property routes' density, contrast, rule-in, transfer, JS budget, and the home-page regression proof), `docs/reviews/2026-08-08-property-pages/` (Plan 6's own evidence, superseded), `2026-08-08-welcome/` (the welcome), `2026-08-08-films/` (the two films), `2026-08-07-lantern/` (the lantern), `2026-08-05-signature/` (Plan 5), `2026-08-05-scroll-craft/` (Plan 4), `2026-08-04-task-7/` (Plan 3). **Every number is re-derivable with one command** — the rigs live in `scripts/` and each one asserts. `npm run verify:budget` builds, serves, measures and propagates its exit code. |

## The non-negotiables

Decided and reasoned through with the client. **Do not relitigate these without being asked to:**

1. **Two properties** — Mahua Vann (Pench) and Mahua Tola (Tadoba). Mahua Bagh is removed from the brand;
   the live site still shows it and is wrong.
2. **Seduce, not convert.** Unhurried and warm, gentle push toward "discover". Not a booking funnel.
3. **Cream is the page, throughout.** Base `#F1E9D7`, second surface `#E9DFC8`, ink `#31402C`, dim
   `#5A5240`. No dark sections except photographs and their overlays — see spec §9, the client raised this
   and was right, and Plan 3's rejected-build review reconfirmed it.

   **One exception exists and the client made it himself on 11 Aug 2026: the Website Directory footer is
   `PALETTE.brand` (#7F5C24), the brown of the wordmark in his own logo.** It is the shape this rule can
   bear — a terminal band, below everything, reached once — and it is **not** licence to darken anything
   above it. If you are reaching for a dark section anywhere else, the answer is still no.

   **Anything laid on that brown must be re-measured, never inherited.** `dim` reads 1.1:1 on it and
   `goldText` 2.0:1 — both unreadable, and both were what the footer used while it sat on cream. Only
   `paper` (5.02:1) and `paperDeep` (4.58:1) carry text there, and `lib/palette.test.ts` guards the brown as
   a third surface, asserting the two that pass *and* the two that fail.
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

   **`goldText` is legible on cream, and cream is the only thing it is legible on.** Two surfaces on this
   site are not cream, and gold text failed on both — measured, not predicted. On the menu's translucent
   glass it read **3.43:1** over a hero, and on the footer's brand brown it reads **2.0:1**. Both now use
   ink and cream respectively. **Before putting `goldText` on any surface that is not `paper` or
   `paperDeep`, measure it**; the name promises legibility that only holds against the two surfaces the
   test actually checks.
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

   **Current, re-measured 11 Aug 2026 on the build that carries both films, the lantern and the client's
   re-rendered forest tint: page mean 37.9%, worst screen 73.4%, 2.2 photographs per screen, imagery 54.2% of
   the average screen.** (This entry read 36.6% for the page mean from 11 Aug until 14 Aug 2026 — a
   transcription error against `density.json`'s own committed figure of 37.9%, present at this same commit;
   corrected by the image-sizing plan's Task 8 whole-branch review, which needed the real baseline to judge
   its own +1.3pp reading and found CLAUDE.md's own cited number did not match the evidence file beside it.)
   Every figure held across the artwork swap — the tint occupies the same box whatever is drawn in it, so
   density is blind to a change the eye is not.

   **The 45% ceiling binds on a chapter's own worst sampled screen, not its mean** — `passesWorst` in
   `density.json` is the field that encodes the rule; `passesMean` is informative only. Applied
   consistently, **not all twelve chapters clear it**: `lodges` **48.6%** worst, `field-days` **57.9%**
   worst and `rooms` **47.2%** worst all fail `passesWorst` while passing on mean. Found and confirmed
   pre-existing — identical at the commit `feat/image-sizing` was cut from — by that plan's Task 8
   whole-branch review, 14 Aug 2026; not caused by that plan or any change to these three chapters. Open
   item, `docs/DECISIONS.md` §5.

   **`forest` reads 12.4% since the tint landed, against 35.5% before it, and that number is flattering.**
   The tint is real imagery and `collectImages` counts it, so the chapter now scores beside the hero's 0.3%.
   It does genuinely fill that chapter's bare middle; it is not four photographs' worth of density. Read the
   improvement as real and the figure as overstated — `docs/DECISIONS.md` §15. `lantern-hour` is 36.4%, down ~1.5 points when the lantern landed.

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

   **`vann-rooms` and `tola-rooms` (the property pages' rooms chapters) were 31.5% and 33.8% mean, 42.1%
   and 44.3% worst, from when the card stack shipped 11 Aug 2026 until 13 Aug** — both down from 40.1% and
   39.0% before it, and both inside the ceiling. **That pair is stale for two reasons layered on each
   other, and neither must be quoted as current.** The client's own 13 Aug ruling replaced the stacked
   composition with every card photo-beside-words, alternating sides, and the build that shipped that
   change at a 65%/60% photo width share measured (14 Aug) **`vann-rooms` 43.9% mean / 49.4% worst,
   `tola-rooms` 44.3% / 50.1% worst** — over the image-sizing plan's own ceiling and, on the worst screen
   of each, over THIS ceiling too. That breach was found and closed the same day: 65% had been declared
   the photo-share lever's limit without ever being swept, and non-negotiable #8 bounds a value the same
   way the forest tint's strength does — this project's own rule is to solve for the bound, not stop at
   the first number under it. Swept upward (68/70/72/75/78%, `lg` held 5 points below `xl`) and
   re-measured: **`lg:w-[70%] xl:w-[75%]`** is what shipped — `vann-rooms` **36.0% mean / 43.2% worst**,
   `tola-rooms` **36.3% / 43.5% worst**, both inside 45% worst — chosen over 78% (33.6%/41.2%,
   33.8%/41.5%, more margin still) because 78% was screenshotted, opened, and rejected: a room's facts
   line wrapped from 4 lines to 5 and broke a word mid-wrap, reading as a caption stuck to a photograph
   rather than a text column beside one. See `docs/DECISIONS.md` §18 and `docs/reviews/
   2026-08-13-image-sizing/README.md` §2.5 for the full sweep table and the screenshot comparison.
   **A number recorded mid-plan (during the card stack's own build) — 24.8% and 27.4% — is separately
   stale for a different reason and must not be quoted as current either: it was measured while five,
   then six, cards were rendering their photographs past the card's own edge, and `measure_density.mjs`
   scores an overflowing photograph as 100% imagery.** Fixing that clip gave real area back to cream and
   type, which is why the honest 11-13 Aug figure was higher, not lower, than the mid-plan one — the same
   lesson the forest tint taught below, in the opposite direction. Full working on the card stack's own construction:
   `docs/DECISIONS.md` §17.

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

**A recognisable guest's face never ships without consent.** Two photographs have now been rejected on
these grounds — one in the original curation, one withdrawn by the client on 10 Aug after it had already
shipped on `/mahua-tola`. A rejected image is **deleted from `CURATION`**, not left curated-but-unused: an
id in the manifest is an id a later chapter reaches for by name, without ever seeing the face in it. Both
instances are recorded in `scripts/build_images.mjs`'s own comment. Look at every frame before curating it.

**Desktop is the client's lens as of 12 Aug 2026, and that is a sequencing ruling, not a relaxation.**
*"Right now our only focus is how it looks on a computer/laptop screen, we can workout and optimize mobile
screens later."* Judge and tune against a laptop; take a phone-only refinement as deferred rather than owed.
**Non-negotiable #6 is untouched** — most traffic is still Indian mobile, and the byte and arrival budgets
still bind. And **every rig still measures 390, deliberately**: the two worst defects the card stack
produced were both found at that width, one of them by a human opening a screenshot and reading it. What is
deferred is optimising the phone, not looking at it. `docs/DECISIONS.md` §1.

**`short:` compacts type and padding. It must never size a photograph — that is `pocket:`.**
`short:` is `(max-height: 800px)`, which fires on a 1366×768 laptop, a 1024×768 tablet and any
browser zoomed past ~110%. Using it for *geometry* is what made the home page's plates render **up
to 230% wider than their true shape** on an ordinary laptop — the client's own report, 12 Aug.
`pocket:` / `roomy:` are keyed to the viewport's **shape** (short AND at least 2:1, i.e. a phone
held sideways) and are exact complements. Aspect rather than width is deliberate: a landscape phone
is ~2.16:1 while a 150% zoom on a 1440×900 screen is 1.60:1 and only ~30px narrower, so a width
threshold could not separate them safely. `docs/reviews/2026-08-12-plate-squeeze/README.md`,
`DECISIONS.md` §2 #44–45.

**Fixing the squash did not fix the shrink, and a plate's own width now has a real floor.** The 12 Aug fix
above stopped a plate being squashed at short heights; it said nothing about a plate continuously
shrinking as the window narrowed or the browser zoomed at ordinary (non-short) heights. A 13 Aug fix moved
one breakpoint and shipped with a rig tolerating an 85% shrink, and the client's own re-test — resizing his
Chrome window, not jumping between fixed presets — found the same complaint still true a day later. The
rule that replaced it, 14 Aug 2026: **a plate may never render narrower than its own width at 1440×900; a
board drops a column the moment holding it would breach that floor, and at one column the plate fills the
container** (his own choice — holding size there would leave roughly half the screen bare, over
non-negotiable #8's ceiling). Built on `flex flex-wrap` with a solved, whole-pixel `flex-basis` per board,
not CSS Grid's `auto-fit` — Grid measured correctly and still stranded a trailing plate beside an empty,
plate-width cell of bare cream, because a Grid track is shared across every row and Flexbox has no such
model. `docs/DECISIONS.md` §19, `docs/reviews/2026-08-14-plate-reflow/README.md`, `DECISIONS.md` §2 #52–53.

**Every rig on this project measures at 1440×900, and type over cream is measured nowhere.** That shared
blind spot let the redesign's signature element — the drawn park map — ship *illegible on a phone*, through
fifteen task reviews and a whole-branch verification, because its labels were 4.3px at 390px and no
instrument looks there. **Open a 390px screenshot and read it** before believing a page is done.
`DECISIONS.md` §2 #29.

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
| `lib/booking/` | The booking contract — **not wired to any page.** `Money` is integer paise behind a compile-time brand (`rupees()` is the only constructor); a `StayDate` is a branded `YYYY-MM-DD` civil date, never a `Date`. `constraints.test.ts` guards the module's import boundary and its integer money — **but only under `tsc`/`npm run build`, never under `npm test` alone** |
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
| `docs/DEPLOY.md` | **The live demo** — the Vercel project, why `demo` is a pointer rather than a build, how to republish, and the two-layer indexing block with the one flag that lifts it |
| `docs/reference-sujan-layout.md` | The reference site's layout DNA, analysed from screenshots |
| `reference/site-copy.md` | 3,036 words of the live site's copy, by page (Plan 3 Task 2) |
| `docs/copy-provenance.md` | **Where every line came from**, and the eleven hard numbers awaiting the client |
| `Mahua-property-logos/` | Client-supplied **vector** logos — real paths, not traced. Emblem is 340 paths / 439 groups, so petals and leaves already separate |
| `public/media/` | 53 curated images (34 home + 19 property) at responsive widths up to 1440. **Distinctness is guarded by perceptual hash** — four pairs turned out to be the same photograph under two ids on 4 Aug, and the guard has since caught two more live-site files that were one photograph under two names |
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

**Every piece of artwork on this page has a swap point, and it is always the same shape:** a source file
under `reference/client-art/` or `Mahua-property-logos/`, a `build_*.mjs` that derives everything from the
artwork's own ink rather than from hard-coded numbers, and a generated `lib/*-art.ts` the component reads.
Replacing a drawing means dropping the new file over the source and re-running one script — `lib/leaf-art.ts`,
`lib/lantern-art.ts`, `lib/welcome-logo.ts` and `lib/forest-overlay.ts` all say so at the top, and each has a
test or a build-time assertion that holds any replacement to the guarantees its component depends on.
**Never hand-edit a generated module.**

**`build_forest_overlay.mjs` goes furthest and is the one to copy.** It does not merely *check* its output —
it **solves** for it, binary-searching the strongest tint that still leaves `PALETTE.dim` above 4.5:1 on its
own darkest pixel, and throwing rather than emitting if even the faintest one would fail. The dial left to a
human is the artwork's flatness, not the guarantee. Hand-picking that number instead is what shipped a
drawing the client could not see (`docs/DECISIONS.md` §15).

It now solves **twice**, because the client's re-rendered drawing separates into pale foliage and three solid
hornbills: `BIRD_MAX` splits them and each segment gets its own strength — **0.267 and 0.135**. One
multiplier is capped by the darkest pixel anywhere, so before the split the birds were holding the whole
drawing down to theirs. **Both segments target the same 4.55:1 floor**; giving the darker one a lower bar was
built and the script rejected it at 2.1:1, so if a future edit makes the segments disagree about the floor,
that is the regression. Its acceptance checks also warn on the artwork's ink coverage — which fired at 47.3%
and was overruled on purpose, because coverage is a proxy and the quantity that binds is the deep-dark
fraction (§2 #38).

The browser measurements. **Every committed number in `docs/reviews/` comes from one of these** — they live
in `scripts/` precisely so nobody has to trust a figure they cannot re-derive:

```bash
node scripts/build_images.mjs                    # re-encode public/media + lib/media-manifest.ts
node scripts/build_brand.mjs                     # the header's flower + lib/brand-emblem.ts
node scripts/build_leaf.mjs                      # the cursor's leaf + lib/leaf-art.ts
node scripts/build_lantern.mjs                   # cut the lantern's white ground to real alpha + lib/lantern-art.ts
node scripts/build_welcome_logo.mjs              # split the client's logo into flower + wordmark, + lib/welcome-logo.ts
node scripts/build_map.mjs                       # trace the client's Pench/Tadoba park maps + lib/vann-map-art.ts, lib/tola-map-art.ts
node scripts/build_forest_overlay.mjs           # the hornbill drawing -> a tint that can sit under type + lib/forest-overlay.ts

npm run build && npx next start -p 3100          # then, against the production build:
node scripts/measure_page.mjs                    # transfer, hero responseEnd on Slow 4G, motion, overflow
node scripts/check_contrast_over_photos.mjs      # worst-pixel contrast for type over a photograph — route-aware; --url any of /, /mahua-vann, /mahua-tola
node scripts/check_image_resolution.mjs          # is any photograph served below its own box
node scripts/measure_density.mjs                 # empty space per chapter, against non-negotiable #8
node scripts/check_entrances.mjs                 # did each entrance stage and settle, and did EVERY parallax move
node scripts/check_pinned_collage.mjs            # `rooted`: headline frozen, photographs drifting apart, closing figure not stranded
node scripts/check_header.mjs                    # the header that stays: both states at 320-1920, reduced motion, no-JS
node scripts/check_menu.mjs                      # the site menu: real scroll lock (wheel/keys, not the CSS property), the three places, focus trap, real route navigation
node scripts/check_rule_in.mjs                   # the hairline under links: coverage, travel, keyboard, both surfaces
node scripts/check_leaf_cursor.mjs               # the leaf: follow, swing, gold, zero bytes on a phone, AND that its loop stops
node scripts/check_lantern.mjs                   # the hanging lantern: where it hangs, that a push swings it, and that it stops
node scripts/check_plates.mjs                    # the plate boards: continuous-width distortion sweep + a real floor — no plate ever renders narrower than its own 1440x900 width, no exemption (14 Aug 2026, replacing an 85%-tolerance floor the client's own re-test caught)
node scripts/check_card_stack.mjs                # the rooms card stack: cards pin and recede on time, no clipping, the deck is visible, no photo crops >25%, the last card never recedes, every card's text is actually legible, AND (assertion 9) the photo's side genuinely alternates at lg+
node scripts/check_room_gallery.mjs              # the room gallery: lazy until opened, next/prev/close/backdrop, no-JS capability, the welcome-screen z-index collision, wide-viewport overflow
node scripts/check_films.mjs                     # the two films: play once, hold, hover-replay, and the white ground gone (pixels)
node scripts/check_welcome.mjs                   # the welcome screen: it welcomes, and it ALWAYS leaves — including with no JS
node scripts/capture_signature.mjs               # the 20 evidence frames: every signature scene, 4 widths, reduced motion, no JS
node scripts/capture_property_pages.mjs          # full-page captures of /mahua-vann and /mahua-tola at the four review widths
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
