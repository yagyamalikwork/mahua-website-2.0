# Decisions and hard-won findings

The durable record. **Everything here was learned by measuring something, and most of it cost a defect to
learn.** It lives in git because the per-task ledgers it was distilled from
(`.superpowers/sdd/*/progress.md`) are git-ignored and would not survive a fresh clone.

Read this when you are about to relitigate a decision, or when a number in another document looks wrong.

---

## 1. What the client has ruled

Each of these was a real decision with a real trade. Do not reopen one without being asked.

| Date | Ruling | Why it went that way |
|---|---|---|
| 3 Aug | **Two properties only** — Mahua Vann (Pench), Mahua Tola (Tadoba) | Mahua Bagh is retired from the brand. The live site still sells it and is wrong |
| 3 Aug | **Seduce, not convert** | Unhurried and warm. Not a booking funnel |
| 3 Aug | **Cream throughout; retire the day-arc** | The scroll-through-a-day colour system forced section heights to be sized by colour ratio instead of content, which is what made the rejected build sparse |
| 3 Aug | **Creative freedom over the guidelines** | "Keep what is good, rework what is not, invent where neither serves us." Explicitly *not* line-by-line compliance |
| 4 Aug | **The 1.5 MB budget means initial load, not whole scroll** | It collided with the image density that answered their rejection. 32 photographs cannot fit 1.5 MB. Desktop whole-scroll sits above it and is accepted |
| 4 Aug | **Both lodges are 5 km from their gate** | Vann from Turia, Tola from Kolara. The sources publish **five different distances** between them and not one is right |
| 4 Aug | **The empty-space rule is 45%, not 30%** | The same rig pointed at the client's own chosen reference scored it **58.1% mean empty**, failing 38 of its 45 screens, against our 42.9%. The rule was stricter than the benchmark it existed to chase. 45% is the midpoint they picked |
| 5 Aug | **Keep the hero sharp, accept the time** | At the smaller tier the hero was drawn at a third of the resolution it needed and shipped visibly blurred. Costs ~750 ms |
| 5 Aug | **Tripadvisor quotes are interim** | Hard-coded reviews now; the site will be wired to Tripadvisor directly (Plan 5+) for live reviews, ratings and counts |
| 5 Aug | **The header lockup is flower + the original serif wordmark**, horizontal | They preferred the pre-logo wordmark. "The best from your build and my choice" |
| 5 Aug | **Scroll craft before the characters** | Plan 4 = header, entrances, collage, emblem. Leaf cursor and ink tiger deferred to Plan 5 |
| 5 Aug | **Shorten the pin rather than drop it** | It bought ~1.9 screens and added zero photographs, dropping images/screen 2.08 → 1.87 against their original "too few images" complaint. Shortened to one held screen; recovered to 1.98 |
| 5 Aug | **The hero's speed budget can wait** | Measured as unreachable with available levers — see §3 |
| 5 Aug | **The leaf follows the pointer everywhere**, not only over links | Chosen over the more restrained "hover-state only" option with both trade-offs on the table |
| 5 Aug | **The leaf cursor must be trivially removable** | "I'm not too sure about the leaf cursor." Enforced by a test, not a promise — see §7 |
| 5 Aug | **A hairline slides in under links on hover**, left to right | Client-requested addition to Plan 5 |
| 6 Aug | **The tiger is the client's licensed vector, not my drawing** | Three hand-authored attempts failed. Hand-writing bezier coordinates for a quadruped produces outlines slightly wrong everywhere, which is what reads as cheap — see §8 |
| 6 Aug | **The tiger became film** | Client supplied an animated illustration. It does the one thing the drawing could not: the tail moves and the head turns |
| 6 Aug | **Films play once and hold. They never loop** | Client asked for a loop; non-negotiable #5 forbids permanent peripheral motion, and a loop decodes video for as long as a visitor reads. Play-once *is* "arrives, performs, dozes" |
| 6 Aug | **Hover replays a film** | Client's addition. A deliberate hover is the visitor asking, which is a different thing from motion happening at them |
| 7 Aug | **The coloured tiger idea is parked, not dead** | Assets kept in `Tiger-illustrations/`. The `darken` finding in §9 is what makes it possible whenever they return to it |
| 7 Aug | **The potter closes `rooted`, as an accessory** | Not a band of its own. "It still feels pretty disconnected from the section" — the figure belongs *in* the chapter's existing space, not below it |
| 7 Aug | **The lantern hangs out of `after-dark` into `06 · The Lantern Hour`, and swings when pushed** | Client request, with their own watercolour. Keep the navy: it descends from a night photograph, and the flame carries the page's gold — see §11 |
| 8 Aug | **The butterfly is parked, not cancelled** | Their overlay films cannot be used (chroma green; butterflies 1.9% of frame width). Restart brief in §13. *"Skip the butterfly for now, make a note of it"* |
| 8 Aug | **A welcome screen: the logo centred, the flower turning once, then a fade** | *"Quick enough that it doesn't come as too long of a break and gently welcoming"* — see §14 |
| 8 Aug | **A half turn, identical to the header's; every page load** | Chosen over a full 360° and over once-per-session. Every load is what lets it carry no JavaScript at all, which is what stops it ever becoming a wall |
| 8 Aug | **~2.1s, not 1.35s** | *"A few more milliseconds."* Chosen from three measured options, all of which finish before the hero photograph arrives |
| 8 Aug | **The client's own stacked logo on the welcome**, not the header's lockup | Their real artwork — flower above MAHUA above RESORTS — with the flower doing the turn |
| 8 Aug | **The logo stays, at 320 ms of hero arrival** | Given the measured figure and the option to revert: *"My logo is fine, we can anyways replace it if we ever find a problem with it."* **Do not revert it on performance grounds without asking again** |
| 8 Aug | **Property pages are the next piece of work** | In the style of the current site's property pages and of thesujanlife.com's. Mahua Vann and Mahua Tola; Mahua Bagh stays removed |
| 10 Aug | **The client's forest drawing goes behind a chapter, as background** | *"Between the cream background and the content."* Malabar pied hornbills are native to Pench, which is Mahua Vann's park |
| 10 Aug | **`03 · The Forest`, not the lodge cards** | Corrected the same day. The right home twice over: that chapter's copy already counts "three hundred recorded birds" |
| 10 Aug | **Stronger than the first attempt** | *"It is almost not visible."* The fault was the arithmetic, not the drawing — see §15 |
| 10 Aug | **Re-render the forest drawing rather than push the dials** | *"Increase the opacity, and the birds are an important detail I want to show."* Both are unavailable by tuning — body copy sits on the drawing, so the contrast floor caps every pixel including the birds. Brief in §15 |
| 9 Aug | **Both property pages shipped** — `/mahua-vann` and `/mahua-tola`, every chapter inside the 45% ceiling, every rig green at the real routes | Built 8 Aug, then reviewed and corrected 9 Aug after the client found the build session had silently fallen back to a smaller model: the first pass had committed failing density and a failed contrast run as "verified". Evidence and the full correction story in `docs/reviews/2026-08-08-property-pages/README.md`. **Awaiting the client:** Tola's room count (12 vs 14), the home page's cottage/suite caption fix, Tola's hero swap, and a Nagpur distance |
| 9 Aug | **Both property pages rebuilt in a "shape vocabulary"** — eight chapters each, no two adjacent chapters sharing a shape, mechanically enforced (`findRepeatedShape`) — replacing the first ship's `ChapterIntro`/`PlateGrid`/`RoomsIndex`/`FieldNotes` structure that read as a template | Three client decisions inside this redesign: **(1) a persistent booking bar**, quiet and always reachable, that slides in past the hero and steps aside over the closing invitation — *"a visitor on a property page has already chosen a lodge, so asking is fair here"*, distinct from the home page's "seduce, not convert" (non-negotiable #2), and built to fail towards absent with no JavaScript, the welcome screen's own contract (§14); **(2) six experiences per property, each given real space, plus one honest "also" line** naming what did not make the six (karaoke, the conference hall, wildlife documentaries, indoor games) rather than promoting or deleting them; **(3) the enquiry form dropped for plain contact details** — *"we don't need an enquiry form, for the enquiries we can just share the contact details in the Website Directory section when we build it later"* — which fixes the same defect a form would have (a bare `mailto:` doing nothing on a phone with no mail client) better than a form does: a real `tel:` link works on every device, with scripting off, with no third party and nothing to sign up for |
| 10 Aug | **A guest's face comes off the site on consent grounds, and the photograph is deleted rather than shelved** | Mahua Tola's Bonfire entry (`DSC00097-scaled.jpg`, the live site's own) showed a guest clearly enough to identify her. *"It directly shows a person's face who was a guest, which we don't want."* Replaced with `bonfire-circle-night` — a frame from **the client's own Mahua Tola property video**, so it is honestly this lodge's bonfire and not a stand-in from Pench, and it carries no people at all. **The withdrawn entry was removed from `CURATION`, not left curated-but-unused:** an id that stays in the manifest is an id a later chapter reaches for by name, and the next person wanting a bonfire would find it without ever seeing the face in it. Restoring it needs the guest's consent, not a code change. **This is the second image rejected on these grounds** — the original curation dropped one for the same reason — and the rule was simply not applied when this one was curated on 9 Aug. Both instances are now recorded in `scripts/build_images.mjs`'s own comment, which is the only place that survives a clone |
| 9/10 Aug | **Task 15 closed the redesign out** — both routes' rigs green, home page proven untouched, `vann-table`/`tola-table` measured for the first time (both clear their contrast floor on the untouched default scrim) | Density's first read found `vann-forest` 72.6%, `vann-where` 56.9%, `vann-press` 88.4% and `tola-reserve` 72.1% over the 45% ceiling — all four are chapters shorter than one 900px screen, which `measure_density.mjs` scores on the single window centred over them, mostly some neighbour's own padding rather than the chapter's content. `vann-where` and `tola-where` were brought fully inside (56.9%→36.6%, 44.5%→21.9%) by widening the map's own column and a new opt-in `tight` rhythm on `ChapterSurface` (default untouched, so the home page is provably unaffected — see §4 of the task's own evidence). `vann-forest`/`tola-reserve` (`OpeningColumn`, widened 62ch→92ch) and `vann-press` (`PressBand`) improved but remain over — 55.8%, 58.3%, 87.2% — and were reported rather than forced: the remaining levers would either widen a "held breath" screen past what non-negotiable #4 protects, or enlarge three press citations past what "set quietly" (that component's own words) means. Full figures, both readings PressBand tried, and the screenshot findings: `docs/reviews/2026-08-09-property-redesign/README.md` |
| 10 Aug | **The menu is places only** — Home, Mahua Vann, Mahua Tola, as real page links; the per-page chapter lists leave the menu on every page, including the home page's | The site was three well-made pages that did not behave like one — from `/mahua-vann` there was no route to Home or Tola except the closing sibling banner and the browser's back button. The 18-screen home page goes back to being scrolled, which `ChapterMenu`'s own doc called "the page's actual proposition". The property pages keep their chapter numbering as page furniture; the menu's reviewed mechanics (dialog semantics, focus trap, Escape-to-trigger, the Lenis-aware scroll lock) carry over unchanged into `SiteMenu`, `ChapterMenu`'s successor |
| 10 Aug | **The Website Directory ships now, as a footer on all three pages** | *"we can just share the contact details in the Website Directory section when we build it later"* (9 Aug, when the enquiry form was dropped) — later is now. One server-rendered band, zero JavaScript anywhere in its import graph (enforced by a test that walks it), mounted once in `app/layout.tsx` so every route carries it identically — and it is what finally gives the site working cross-page navigation with JavaScript off, which the menu alone cannot |
| 10 Aug | **The lodges appear in the menu with their own photographs; Home is a plain type row** | *"Like The Sujan Life"* — whose menu presents each camp as an image card with its region. Home carries no image: it is wayfinding, not a destination being sold. The card photographs mount into the DOM only on the menu's first open, not at page load — the panel is permanently present (`inert` while closed) for the accessibility machinery, and `visibility: hidden` does not stop a lazy image intersecting the viewport, so an always-mounted eager card would have joined every page's initial transfer for nothing the visitor asked for |
| 10 Aug | **The menu surface is cream glass, with a hamburger trigger, on gold accents** | *"a blurred transparent background … or Liquid Glass"* and, for the icon, *"Like the Sujan Life"* — both chosen over previewed alternatives (dark glass; the word "Menu"). A *pure* transparent blur cannot guarantee legible type over an arbitrary photograph, so the glass carries a translucent wash of the site's own paper; type turns ink, the region labels stay `goldText`. Verified, not assumed — and the verification found a real failure, not a hypothetical one. Full story in §16 |

---

## 2. The defect that keeps happening — thirty-six instances

**A check confirmed that a mechanism was configured, rather than that behaviour had changed.** Every one of
these passed its own gate while the thing it guarded was broken.

| # | The check | What it missed |
|---|---|---|
| 1 | A reveal asserting a CSS property was set | Content popped invisible on load |
| 2 | A contrast sweep over seven *static* colour states | Text hit 1.85:1 across 16% of the scroll, because the background moved *between* those states |
| 3 | A warmth guard written `red >= blue` | Pure black passes `0 >= 0`. The test for cold colours could not detect the coldest one |
| 4 | An image budget that was a `console.warn` | A 636 KB file shipped |
| 5 | "Never show the same photograph twice" comparing **filenames** | Four pairs were the same picture under two ids; two pairs sat in the *same* grid |
| 6 | `sizes` describing the element's **box** | Cover-cropped photographs drew 4× wider than their box; the hero and the tiger shipped blurred |
| 7 | The rig built to catch #6 **also measured the box** | Reported "0 under-served" while the hero sat at 0.32 |
| 8 | Performance measured at **device pixel ratio 1** | No phone has DPR 1. At DPR 3 the hero was 192 KB, not 21 KB |
| 9 | A scroll lock asserting `overflow: hidden` was applied | The wheel still scrolled the page 1,485 px, because Lenis bypasses it |
| 10 | A contrast target found **structurally** (`header > div > p`) | The markup changed; the selector matched nothing; "not visible" counted as neither pass nor fail |
| 11 | A GSAP probe searching the page's **HTML** for `"gsap"` | A bundled copy never appears there. **The plan's entire premise was built on this** |
| 12 | A guard grepping **source** for a static import | A one-line margin change would have undone a 110 KB saving with everything green |
| 13 | Parallax sampled at **two fixed document offsets** | Those offsets fell inside exactly **1 of 12** elements' ranges. "1/12 moved" was blindness reported as a pass |
| 14 | A click-through check watching `page.url()` | The links are `target="_blank"`, so the check could never fail |
| 15 | A mid-transition sample **racing the wall clock** | Read 0.597 on one run and 0.000 on the next against a byte-identical build. It could fail correct code *and* pass broken code on a lucky sample. Fixed by pausing the transition and seeking two interior points |
| 16 | A cursor-lag check comparing the leaf to **where the hand had already moved on to** | Read 98.7px against a 12px clamp on a *correct* build — 12 exactly, plus 86.7 of pointer travel in the same frame. No cursor can do better; the OS arrow is a frame behind too |
| 17 | A removability guard matching **any mention** of a path | A rig tripped it on its own *output filename*, `2026-08-05-signature/leaf-cursor.json`. The same weakness pointing the other way would hide a real importer that spelled the path differently |
| 18 | A stagger test asserting **the opposite of what was needed** | It demanded waves be separated, and shipped the stutter it existed to prevent: twenty strokes drawing, then nothing for ~0.15s, eight times. The client saw it immediately |
| 19 | **A commit landing with tests red**, because `npm test \| tail` swallowed the exit code | The suite CLAUDE.md requires green before any commit failed into a void. Read exit codes; do not eyeball output |
| 20 | A frame counter proving a decorative loop had stopped, that **counted the whole page's frames** | Reported 189 frames still running on a lantern that had correctly gone to sleep — they were Lenis's, which never stops. Fixed with a *control*: idle rate, rate during the effect, rate after. Without the middle one, "adds no frames at rest" is trivially true of something that never ran |
| 21 | `measure_density.mjs` **could not see** a `pointer-events: none` element | It hit-tests with `elementsFromPoint`, which does not return them, so the click-through lantern scored as bare paper. It gave itself away by disagreeing with *itself* — same report, image counted in the inventory, zero coverage |
| 22 | A fit check asserting the lantern **covered no words**, and never its size | True, and useless: a Tailwind width rule that lost the cascade shipped it 128px wide where 200 was meant, with every check green. Assert every property the change was meant to affect, not the one easiest to phrase |
| 23 | Overlapping CSS rules resolved by **framework sort order** | Tailwind emitted an arbitrary `min-[1440px]:` variant *before* a named `xl:`; at 1920 both matched, specificity tied, and the wrong one won. Disjoint closed intervals cannot care how a framework sorts them |
| 24 | The welcome rig's **own clock**, twice | First it sampled mid-stream before the animation had started and read the base style — "already gone at 150ms". Then, waiting on `domcontentloaded`, the first navigation after `next start` took **6,628 ms** and every sample landed after the welcome had finished — "never visible in 34 samples". Both on a page working perfectly. Warm the server; wait on the thing you are measuring, not on the page |
| 25 | A ceiling that was **a design budget pretending to be a hang guard** | `MUST_BE_GONE_BY_MS` was 3s while the animation was 1.35s, so the client's own request to lengthen the greeting turned the rig red on correct work. A guard against "never leaves" should have no opinion about how long the greeting is |
| 26 | The contrast rig's scroll anchor **falling through `?? 0` when its selector matched nothing** | Run against `/mahua-vann` with the home page's probe list, it measured the *unscrolled hero* while asserting the scrolled header's ink palette — 1.04:1 "failures" on a header that was fine, seven `pass: null` on the type that actually needed measuring, an exit code of 1 — **and the artefact was committed as "verified"**. The rig now refuses a route it has no probes for, and a missing anchor is a fatal miss |
| 27 | "GSAP is deferred" verified as **a dynamic import existing**, on one page's geometry | The deferral's gate was proximity — load when a scrub target is within a screen — which on the home page implied scrolling only because its first target sits deep. The property pages' first target sits exactly one screen down, so the "deferred" library was fetched before the visitor did anything: 201 KB of pre-scroll JS against a 175 KB budget, with the import exactly as dynamic as ever. The gate now also requires the first scrolled pixel |
| 28 | `measure_js_budget.mjs`'s own default `--scroll 1400`, **tuned for the home page's geometry and never re-checked against another one** | Pointed at `/mahua-vann` with no `--scroll` override, it printed "nothing at all was fetched on scroll — GSAP is not deferred, it is unreachable, and every scrubbed effect on the page is dead" — a load-bearing claim about the *shipped page*, produced entirely by the *rig's* untested default. The home page's first scrub target sits within 1400px; Vann's (`vann-table`) sits at ~4,677px, Tola's (`tola-guest-word`) at ~2,354px — 1400px never brought either into `Parallax`'s rootMargin, on a page whose GSAP was in fact correctly deferred and reachable. Fixed by scrolling past each route's own first `fullBleed` chapter (`--scroll 5000` / `--scroll 2700`), not by touching the page — Task 15, `docs/reviews/2026-08-09-property-redesign/README.md` §3 |
| 29 | **Every rig on the project measured the map at a width where it worked.** | The redesign's signature element — the drawn park map — was *illegible on a phone*, and fifteen task reviews plus a whole-branch verification all passed it. `PropertyMap` set label type at a fixed `fontSize={10}` inside a `viewBox` the SVG scales down to the column width: at 390px that is ×0.43 on Vann, so 10px rendered at **~4.3px**, and Tola's thirty labels overprinted each other. Nothing caught it because **`measure_density.mjs` runs at 1440×900 and `check_contrast_over_photos.mjs` only probes type laid over a *photograph*** — type over cream, at a width nobody measured, was outside every instrument's field of view at once. Found by the final review opening a 390px screenshot and *looking*. The lesson is not "add a probe": it is that a suite of rigs can have a shared blind spot, and the only thing that finds it is a human eye at the width the visitor actually holds |
| 30 | **An anti-template guard that covered one string of five.** | The client's complaint was that two properties introduced themselves in the same words. A test was added asserting the two pages' *opening headlines* differ — and shipped while the **invitation line** (the last sentence a visitor reads on either page) was byte-identical bar the gate name, both chapter-01 openers shared a clause verbatim, and "five kilometres from the gate" appeared five times per page in the same five slots on both. The guard was written against the one instance that had been noticed, not against the *rule*, so it certified as fixed a problem that was four-fifths intact. Widened to compare the invitation line and `columnCopy.body[0]`, and watched failing |
| 31 | **A tint's strength chosen by hand rather than solved for.** | The contrast floor is set by the drawing's single darkest pixel, and this one contains pure black — so one outline dictated how faintly the other 99% printed. 0.2 shipped where 1.047 was available at the *same* worst case, and the client's verdict was "it is almost not visible". The build now binary-searches the strongest tint that clears the floor |
| 32 | **A solver and its own assertion measuring different things.** | The search worked in floating point; the check that follows it measured the rounded bytes actually written to the file. They disagreed by 0.01 and the script rejected a strength it had just proved. Both now measure the rounded pixels, and the search rounds *down* |
| 33 | **A contrast target found by structure: `#forest p`.** | It also matched `ChapterMark`'s two gold paragraphs, so the rig measured the chapter *number* as though it were body copy and reported 1:1. Instance 10 in this same table is the same mistake; the intro now carries a `data-contrast` hook |
| 34 | **A correction to a non-reproducing derivation, itself carrying a non-reproducing figure.** | §16 was rewritten *because* its per-channel RGB fit did not reproduce. The rewrite's own counter-example then quoted 4.97:1 for the 95%→100% segment — a figure belonging to the 82%→100% one. Recomputed from the composite the passage itself prints: **4.844:1**. The shape survived the fix aimed at it, in the same paragraph. Caught by a reviewer retyping four numbers |
| 35 | **The probe set measured two of the three gold runs on the glass.** | `menu-place` and `menu-region` were probed; the panel's "Where next" label — the same `goldText`, on the same wash — was not. It measures **4.56:1**, all but identical to the region label's 4.6 that *failed* at the original 82%. It was failing too, was rescued by a fix aimed at something else, and no instrument would have reported it either way |
| 36 | **A comment claiming a check confirms what the check filters out.** | `check_rule_in.mjs` said check 1 "confirms" the hamburger's `data-rule="none"` opt-out. Check 1's coverage filter is `textContent.trim().length > 0`, so a text-free control never reaches it — nothing in the file has ever read that attribute. The check was right; only its account of itself was wrong |

**The rule this bought:** *run every guard against the broken state before trusting it to pass.* A guard
nobody has watched fail is not a guard. Several were caught only because someone did exactly that —
including three an implementer found in its own instruments before reporting.

**The corollary:** the browser is the only authority on rendered behaviour. Type-checking, unit tests, the
build and the linter all passed while photographs shipped blurred, masks never wiped, and a page scrolled
behind a lock.

---

## 3. Why the hero misses its budget, and why no lever closes it

The hero photograph lands at **3,975 ms** on Slow 4G against a 2,500 ms budget — median of five, range
3,964-3,984. Every lever has been measured by rebuilding and A/B-ing rather than reasoned about:

| Lever | Worth |
|---|---|
| **Deferring the two film posters (spent, 7 Aug)** | **537 ms on the hero**, 103 KB off the initial load |
| Deferring GSAP (spent, 5 Aug) | 213 ms on the hero, **0 ms on LCP** |
| Subsetting the fonts (unspent) | ~215 ms |
| Dropping the fonts' `rel=preload` (unspent) | ~172 ms |

**The posters were worth more than everything else put together, and they were pure waste.** A
`<video poster="…">` is fetched immediately however far down the page it sits — `preload="none"` defers the
video and does nothing for its poster, and there is no lazy equivalent. Two chapters several screens down
were costing 103 KB of the ~460 KB first screen. Medians of five on one build with only that change
differing: **hero 4,512 ms → 3,975 ms**, both ranges inside 60 ms. LCP is text and moved 1,272 → 1,340 ms,
which is inside its own noise (988-1,436 across the ten runs) and means nothing either way. The fix is in
`components/signature/SignatureFilm.tsx`; three things there are load-bearing and commented at the site.

**That is the exception that proves the rule, not a route to the budget.** Every *remaining* lever is
~200 ms and the gap is still ~1,475 ms. The hero is 192 KB queued behind ~360 KB on a 200 KB/s link — it is
**bandwidth-bound**. Closing it needs a smaller hero or a lighter first screen, which is a design decision,
not an optimisation. The client has deferred it.

*Worth checking before anything else is attempted:* both stills are encoded at their film's full
resolution — `tiger-film-poster.webp` 810×1080 for a box drawn at 240-300 CSS px, `potter-film-poster.webp`
1080×1256 for one drawn at 150-220. That is ~2.5x oversampled at DPR 1. It costs nothing before the fold
any more, so it is no longer a hero question, but it is free weight for anyone who scrolls.

**Do not read Chrome's LCP as the hero's arrival.** Across **45 runs** it resolved to text every single time
— a paragraph on mobile, the `<h1>` on desktop — never once to a photograph. Mobile LCP reads ~1,300 ms
while the hero lands at 3,975. Use `scripts/measure_page.mjs`, and **medians of five**: an unchanged build
has produced LCP anywhere from 988 to 4,140 ms. The hero's own `responseEnd` is far steadier than LCP is —
the ten runs on 7 Aug held to 60 ms within each arm — so a *hero* difference of a few hundred ms is real
where the same difference in LCP is noise.

**`measure_lcp_arms.mjs` defaults to port 3210, not 3100.** Pass `--port` or it fails on a connection
refused that reads like a broken rig.

*Unexamined:* the desktop hero (4,107 ms) is slower than the mobile one.

---

## 4. Things that look broken and are not

- **No animations at all?** Check the operating system's reduced-motion setting before anything else.
  Windows: *Settings → Accessibility → Visual effects → Animation effects*. With it off, Chrome reports
  `prefers-reduced-motion: reduce` and the page deliberately switches off every entrance, the emblem turn
  and the pin, and gives back the pin's reserved scroll. **This happened to the client on 5 Aug** and looked
  exactly like a broken build. Confirmed same-code, same-server: 37 staged entrances and a pinned collage
  with the setting on; 0 and unpinned with it off.
- **The pinned collage not pinning?** It needs **1440px of *layout* viewport**. A Windows window at 1440
  with a classic scrollbar falls ~16px short and silently shows the unpinned composition. **Demo above
  1500px.**
- **A stale `next start` on port 3100** has misled measurement several times. Confirm what you are measuring.

---

## 7. The leaf cursor's removability contract

The client asked for it to be easy to remove or change. That is enforced rather than intended:

- Everything lives in `components/signature/leaf-cursor/`.
- **Exactly one** file outside it may import from it — `app/layout.tsx`.
- `removability.test.ts` fails if a second importer appears, **and** fails if the mount stops using a
  dynamic import — because a static one would leave every byte behind after the line was deleted.
- The artwork is one constant in one file. The client's own hand-drawn leaf replaced a drawn SVG, which
  replaced one extracted from their logo. Swapping it is `node scripts/build_leaf.mjs` over a new PNG.

**Their logo genuinely contains eight leaves** — four `#465E44`, four `#2B3F2A`, real vector paths — and the
extraction worked. It does not survive 24px: those leaves are stylised for a rosette, with no stem and no
point because the lockup hides both. All three attempts are rendered side by side in
`docs/reviews/2026-08-05-signature/leaf-{extracted,drawn}-*.png`.

---

## 8. Why three hand-drawn tigers failed, and what replaced them

Three attempts, each fixing a real diagnosis, none good enough:
`docs/reviews/2026-08-05-signature/tiger-attempt{2,3}.png`. The diagnosis was never a missing detail — it
was the method. **Hand-authoring bezier coordinates for a quadruped produces outlines that are slightly
wrong everywhere, and slightly wrong everywhere is exactly what reads as cheap** beside thirty-four real
photographs.

What the client then supplied, in order, and what each was worth:

| Supplied | Verdict |
|---|---|
| Five stock rasters | **All unlicensed previews.** Three visibly watermarked; one carried `VectorStock.com/61335879` in its own metadata; one was an iStock 612px comp. Flagged as a real business risk, not a technicality |
| Three "pose" SVGs + a 3D model | **None usable.** The SVGs are closed *filled* silhouettes — no line to draw along. The `.glb` is an unrigged trimesh export: no skins, no animations, so no part of it can move |
| A licensed lying-tiger vector | **This one worked.** 162 open, stroked paths. Open and stroked is the whole requirement: an open path has a length that `stroke-dashoffset` can walk |

**The ink tiger still exists and is one line from returning** — `components/signature/InkTiger.tsx`,
`lib/tiger-art.ts`, `scripts/build_tiger.mjs` and its tests are all intact. What removing it from the page
cost: 17 KB inlined with zero JavaScript, and `field-days` at 41.2% empty rather than 44.6%.

---

## 9. Everything learned about putting film on this page

**`mix-blend-mode: darken` is what makes a rectangular video sit on cream with no box.** Every pixel lighter
than the page's cream is replaced by it; everything painted survives.

**The artwork's background must therefore be *lighter* than the cream, and flat.** Not matched to it —
lighter. Two reasons, and the second is the one that decides it:

1. The page alternates two creams (`#F1E9D7` and `#E9DFC8`), so an exact match breaks the moment a chapter
   moves or one is inserted above it.
2. **Video compression will not hold a flat colour.** 4:2:0 subsampling and block artefacts turn a matched
   field mottled; every pixel landing darker than the cream shows as a blotch. White gives 22 levels of
   tolerance and swallows the noise entirely.

Measured margins, after compression: the tiger's palest border pixel is 242, the potter's 235, against a
cream of 233. Both hold. A supplied file whose background was a painted tan (216,200,167) could not be
saved this way at all.

### The specification to hand an illustrator

4:5 portrait, 1080×1350 minimum; 6–10 seconds; 24fps; **no audio**; master uncompressed (do not let them
optimise for web); **transparent background if at all possible** — PNG sequence, ProRes 4444 or WebM/VP9
alpha — otherwise flat pure white, no vignette, no gradient, no drop shadow. It must **start and end on the
same pose**, which is what allows both looping and holding. The animal moves; the camera never does. Leave
~8% clear margin on all sides.

### Encoding

`ffmpeg -an -vf scale=W:-2 -c:v libx264 -crf 28..30 -preset slow -movflags +faststart`, plus a WebP poster
from the final frame. Tiger 12.7 MB → 616 KB at 810 wide; potter 10 MB → 686 KB at 1080 wide, cropped to its
own ink first. H.264 beat VP9 on both. `preload="none"` so nothing but the poster loads before a visitor
scrolls to it.

---

## 10. What a figure does to a chapter's density, learned three times

**A narrow portrait figure centred in a full-width band is the worst of all worlds.** The band's height is
set by the figure, so a small one leaves almost all of it bare. Measured on `rooted`: at 380px it took the
chapter to 45.7% against the 45% ceiling and pushed the join below it to **81.2%**, worse than the 63.5% it
started at.

**Widening helps** — the band fills proportionally — but it buys scroll. At 680px `rooted` was 45.0%: passing,
and sitting exactly on the line.

**The right answer is not to create a band at all.** Use space the section already has. `ChapterSurface`
carries 80px of bottom padding (`lg:py-20`) that is empty by construction; a negative margin puts a figure
in it for free. At 220px the potter costs 216px instead of 823 and `rooted` is 41.8%.

**Do not assume where the slack is — measure it.** In `rooted` at 1280 there are **24px** below the prose,
and at 1024 the text column is *taller* than the photographs. `field-days` has no 350×180 hole anywhere near
its foot; its largest empty rectangle there is 500×180. Both were found with a largest-empty-rectangle scan
over the chapter's real glyph and image boxes, which is worth rebuilding whenever this question comes up.

`scripts/measure_density.mjs` **does** count `<video>` as imagery (line 172), so these figures are real.
`imagesPerScreen` counts only `<img>`, so it under-reports once films are on the page.

### A figure below a pinned scene is not where the layout puts it — fourth lesson, 7 Aug 2026

The potter was 16px below the composition in the markup and **148px below the nearest photograph and 268px
below the last paragraph** by the time a visitor saw it, alone in a band of cream. The client's word was
"disconnected", and every static measurement said the placement was fine.

**The cause is the drift, and it does not stop when the pin does.** `CollageStage` scrubs each photograph
from `+half` to `-half` of `reserved × rate`, so when `position: sticky` lets go the three are still
displaced — measured **-81 / -57 / -32px at 1920×1080**, -64 / -45 / -26 at 1440×860. The composition has
risen; the footer is not part of the scene and has not. What looks like a margin problem is a residue of the
effect.

**The room to pull it back into is `items-center`'s, and it is exactly `(H - C) / 2`** for screen height H
and centre-column ink C — 252px at 1080, 212px at 1000, 162px at 900, 115px at 1440×860. The flanks fill the
pinned screen and the centre column does not.

So the margin is a formula, `50vh - C/2 - 56px`, which holds the gap at **56px from 1440×860 to 2560×1440**.
Two fixed values were tried first and both were measured failing: 80px stranded it at 172px on a 1080 screen,
and 192px put it 20px from the copy at 1000. C changes only at 1600, where `max-w-[1600px]` stops the
container growing — hence two constants, 344 and 371.

**What it bought:** `rooted` worst screen **55.9% → 44.5%** (from over the ceiling to inside it), mean
41.8% → 39.7%, and the `rooted / forest` join — the emptiest place on the page — **76.9% → 68.8%**. Both
figures measured on one build with only that margin differing.

**It is guarded.** `scripts/check_pinned_collage.mjs` now scrolls to where the figure is read and asserts the
gap to the last paragraph is 24-100px, plus that it overlaps no photograph. Run against the pre-change build
first, it reports 151px and exits 1. It measures the gap a visitor sees, not the margin — a check of the
margin would pass with the figure a screen adrift, which is defect shape #2 exactly.

---

## 15. The forest tint behind `03 · The Forest`

Client request, 10 Aug 2026, with their own drawing —
`Forest-illustrations/forest-overlay.jfif`, a 1024×572 JPEG of a line-drawn forest with three Malabar pied
hornbills on a white sky. Asked for behind the lodge cards, corrected the same day to `03 · The Forest`.

### Three reasons it could not be used the way the films are

`mix-blend-mode: darken` erases the tiger's and the potter's white ground (§9). Wrong here, and each reason
was measured rather than guessed:

| | |
|---|---|
| Its bottom corners are **(73,88,65)** and **(85,100,77)** | It is a scene with a white *sky*, not a figure on white. `darken` would leave its lower two-thirds a dark band across the section — non-negotiable #3 |
| **64.4% of its ink is dark** (luma < 110) | Type over that is unreadable whatever the blend mode |
| **It is 1024px wide** | Non-negotiable #11 sets 1400 as the floor for edge-to-edge imagery |

So the ink becomes a faint tint, **flattened onto the cream at build time**.

### Flattening is worth 45× the bytes

| How the same tint is carried | At 1024px |
|---|---|
| Semi-transparent WebP, drawing's own colours | **282 KB** |
| Semi-transparent WebP, one flat ink colour | 116 KB |
| **Flattened onto the cream, opaque** | **~38 KB** |

Almost all of the cost is the alpha plane — a full frame of fine foliage encoded as per-pixel opacity. The
first of those is past non-negotiable #6's 200 KB ceiling for a single image, for a decoration. The price of
flattening is that a file belongs to one cream, so both are emitted at ~38 KB each and the component is
handed the surface it stands on.

### The strength is solved, and hand-picking it was the defect

**The contrast floor is set by the drawing's single darkest pixel, and this one contains pure black.** With
the blacks lifted to 60, the strongest tint clearing 4.55:1 is 0.201 — one outline dictating how faintly the
other 99% printed. Lifting them compresses the range and buys strength at the *same* worst case:

| ink floor | solved strength | mean ink laid down |
|---|---|---|
| 60 | 0.201 | 0.085 |
| 120 | 0.458 | 0.134 |
| **160** | **1.047** | **0.218** |

It shipped at 60 and the client said *"it is almost not visible"* — correctly. **2.6× the presence for an
identical guarantee.** Past ~160 the outlines lose their bite and it reads as fog; 120 keeps more line and
less presence if it is ever judged too heavy.

`scripts/build_forest_overlay.mjs` now **binary-searches** the strongest tint that clears the floor, so the
only dial left is `INK_FLOOR`. Rendered on the page at four widths: headline 3.64–6.84:1, intro 4.56–6:1.
The build's arithmetic worst is 4.55 and the browser's 4.56 — the agreement you want between two
instruments.

### The density figure it produces is flattering, and should be read as such

`forest` went **35.5% → 12.4% empty**, because the tint is real imagery and `measure_density.mjs` counts it.
It does genuinely fill that chapter's bare middle — but 12.4% puts it beside the hero at 0.3%, which is not
a fair comparison. The improvement is real; the number overstates it. Page mean 40.1% → 36.6%, imagery
51.9% → 54.2%, 2.03 → 2.2 photographs per screen.

### The ceiling is the artwork, not the dials — and the client chose to re-render

10 Aug, second round: *"We need to increase the opacity, and the birds are an important detail I want to
show."* **Neither is available by tuning, and that was measured rather than argued.**

| ink floor | solved strength | mean inked luma on paper |
|---|---|---|
| 160 (shipped) | 1.047 | 221.4 |
| 175 | 1.626 | 221.6 |
| 190 | 2.912 | 221.7 |
| 205 | 7.999 | 223.2 |

**Raising the dial buys nothing.** The reason is the same one that stops the birds going darker: **body copy
sits on the drawing** — at 768px the intro paragraph covers about 90% of it — so the 4.5:1 floor binds
almost everywhere, and the birds, being the darkest thing in the frame, are what it grips first. Giving them
their own darker treatment was built and rejected by the build's own assertion: body text over them measured
**2.1:1**.

So everything is compressed into the narrow band the floor allows — on `paperDeep` the darkest any pixel may
be is about **rgb(205,198,184)**. A drawing that is **75.5% inked** arrives in that band as flat mush; a
sparse one arrives as clean line work at the *same* average luminance. What the eye reads here is line
contrast, not area fill.

**The brief for the replacement**, which the client took on 10 Aug:

> Same scene and composition — forest with the three Malabar pied hornbills on their branch, on a pure white
> sky. Drawn as **line work, not a filled illustration**: under 45% ink coverage, foliage as outline with
> little solid fill. The **three hornbills solid and dark**, and the only large solid dark masses in the
> frame. **2800px wide** (2400 minimum), same landscape proportion. No texture, grain, vignette or
> watermark. JPEG or PNG both fine — the white ground is used, not transparency.

`scripts/build_forest_overlay.mjs` measures the arriving artwork against that brief and warns on both counts
— coverage and width — so acceptance is a number rather than an opinion. The width half also ends the
resolution compromise below.

### Still open

- **On a phone it is a whisper.** The drawing keeps its own 1.79:1 aspect rather than being stretched to the
  section's 0.17:1, which would zoom tenfold into a sliver — so it is a faint band behind the heading and
  gone by the paragraph.
- **A re-render at ~2800px would remove the last compromise** for about 20 KB. The browser currently
  stretches the 1024px source ~1.9× at 1920. Tolerable for a near-flat texture, and it would not be for a
  photograph.
- **The client has not yet judged it.** 10 Aug: *"Looks fine for now, let me sleep on it."*

---

## 14. The welcome screen, and why it has no JavaScript

Client request, 8 Aug 2026: the lockup centred, the flower turning once as it does in the header, then a
smooth fade to the site — "quick enough that it doesn't come as too long of a break". Their two rulings:
**a half turn, identical to the header's**, and **every page load** rather than once per session.

### The base style is hidden, and that is the whole feature

**A welcome screen that fails to leave is a site nobody can use**, and every route that could strand one
runs through script: a chunk that never arrives, a handler that throws, a timer in a backgrounded tab. So
there is none. It is server-rendered and a CSS animation takes it away — the thing that removes it is the
thing that drew it.

And it is written the reverse of the usual way round. `[data-welcome]` is `opacity: 0; visibility: hidden`
in its base style; the animation's **backwards** fill makes it visible from the first painted frame and its
**forwards** fill leaves it hidden afterwards. So:

| | |
|---|---|
| animation runs | visible, fades, gone. As designed |
| animation never runs | base style stands. **No welcome, site works** |

Written visible-by-default and hidden-by-animation, that second row is a cream screen with a logo on it and
no way past, on exactly the browsers least able to recover.

`--welcome-hold` is an `animation-delay`, not a keyframe percentage, so both durations stay adjustable from
`lib/motion.ts` alone. **2.1s of animation** since the client asked for "a few more milliseconds" on 8 Aug
and chose from three measured options; up from first paint, gone by **~2.4s** on the page's own clock.
There is room for it: the hero lands at ~3,990 ms, so the greeting finishes before the site's first
photograph either way — headroom that disappears the day the hero gets faster.

**Reduced motion needs its own line and it is load-bearing.** The blanket `*` rule crushes
`animation-duration`; it does not touch `animation-delay`, and this one is 0.85s. Without an explicit
`animation: none` a visitor who asked for less motion would get a blank cream screen held for the full delay
and *then* a 0.001ms fade — a wall with none of the gesture that justifies it.

### It is the client's own logo, split so the flower can turn

**Not the header's lockup**, which is a horizontal assembly of the flower plus live type built because the
client's brown is unreadable over the hero photograph. None of that applies on a cream screen with no
photograph, and on 8 Aug the client asked for the real thing: flower above MAHUA above RESORTS, as they
drew it, with the flower doing the turn.

They pointed at `Mahua-property-logos/Mahua-Resorts/Mahua-Resorts.jpg`; the build reads the **`.png`** beside
it — same artwork, same folder, but a JPEG cannot carry transparency and would put a white square on cream.
Checked rather than assumed: 90.3% of that PNG's canvas is clear and its corners are at alpha 0, which is
exactly the check the lantern's PNG failed (§11).

`scripts/build_welcome_logo.mjs` splits it by **scanning the artwork's own bands of ink** — three of them,
the flower and the two words — and records each part's box as a fraction of the whole. The component lays
them back out at those fractions, so the result is the client's logo to the pixel and only one piece
rotates. A redrawn logo re-splits itself; one that no longer separates fails loudly instead of shipping a
wordmark with half a flower on it.

### What it costs, measured rather than assumed

The first version cost nothing — it borrowed the header's flower and set the name live. The client's own
logo is two files of its own, and they are **on the first screen**: a curtain that must be there at once
cannot be deferred. That is a real charge against non-negotiable #6:

| | Header lockup | Client's logo |
|---|---|---|
| Initial load, 390 / 1440 | 581 / 705 KB | **599 / 723 KB** |
| Hero photograph (median of 5) | 3,987 ms | **4,308 ms** |

**~320 ms, and it was not accepted without a fight.** Two things were tried and measured:

| | Hero |
|---|---|
| First encode, `quality: 90 / alphaQuality: 92`, 20.4 KB | 4,377 ms |
| `quality: 86 / alphaQuality: 80`, 17.4 KB — visually identical at 2x drawn size | 4,306 ms |
| The same, fetched eagerly instead of `loading="lazy"` | 4,308 ms |

So the lighter encode recovered ~70 ms of the original 390 — **`alphaQuality` above ~90 pushes libwebp
towards a lossless alpha plane and nearly doubled both files** — and *when* the files are asked for makes
no difference at all. The hypothesis that lazy images were landing mid-flight against the hero and stealing
its bandwidth was measured and is wrong. What remains is the bytes and the two requests themselves, and
nothing in this component's gift removes them.

`loading="lazy"` is gone anyway: it is wrong on its face for the only thing on the first screen, even
though it costs nothing either way. `fetchPriority="low"` stays so they cannot outrank the hero's preload.
`check_welcome.mjs` asserts there are exactly two of them — a tripwire against somebody later pointing this
at a full-resolution logo.

**The client was given the figure and kept the logo** — 8 Aug 2026: *"my logo is fine, we can anyways
replace it if we ever find a problem with it."* Do not revert it on performance grounds without asking
them again. If they ever do change their mind it is one component: `WelcomeScreen` returning to
`<BrandMark />` on cream, which cost nothing because it borrows the header's flower and sets the name in
live type.

### Three defects it introduced, none visible in the numbers

1. **The brand name rendered cream on cream** (first version, header lockup). `BrandMark`'s wordmark takes
   its colour from the header's own state; standing anywhere else it has none. The welcome showed a flower,
   off centre, with an invisible word beside it holding the space — and every assertion in the rig passed.
   **A screenshot caught it.** Moot now that the wordmark is artwork, but it is why the rig checks that both
   halves of the logo actually *decoded*.
2. **It gave `check_contrast_over_photos.mjs` a second target** (first version). That rig queries
   `data-contrast` **globally** — its `container` field only scopes what it *hides* — so it found the
   welcome's hidden wordmark, measured it against the hero photograph, and reported the header failing at
   1:1 on a page that was fine. **Reusing a component reuses its hooks; check whether any of them are
   promises about being unique.** Moot now that the welcome shares no component with the header.
3. **The rig's own clock was wrong twice, and both times it called a working page broken.** First it
   sampled from `waitUntil: "commit"` on the rig's clock, mid-stream, before the animation had started, and
   read the base style — "already gone at 150ms". Then, switched to `domcontentloaded`, the first
   navigation after `next start` took **6,628 ms** to resolve and every sample landed after the welcome had
   finished — "never visible in any of 34 samples". It now warms the server with a throwaway navigation and
   waits on `getAnimations().length > 0`, which is neither earlier nor later than the moment there is
   something to measure.

**And the ceiling was a design budget pretending to be a hang guard.** `MUST_BE_GONE_BY_MS` was 3s while
the animation was 1.35s; the client's lengthening to 2.1s tripped it at 3,210ms on a page working exactly
as asked. It is 5s now, and commented as what it is: a guard against a welcome that never leaves, which
should have no opinion about how long the greeting is.

---

## 13. The butterfly — parked 8 Aug 2026, and how to restart it

**The client parked this deliberately, after seeing the measurements below.** It is not cancelled and
nothing about it is owed. If it comes back, everything needed is here: skip to *What would work* at the
foot, which carries a re-render brief that can go straight to an illustrator.

### Why the supplied films could not be used

Checked 8 Aug 2026: `Butterfly-overlays/Butterflies-Overlay.mp4` (1.8 MB) and `-bright.mp4` (5.0 MB). Same
footage, one graded brighter. **Neither can go on this page, and the reason is size before it is anything
else.**

| | |
|---|---|
| Background | **Chroma green, RGB (0, 175, 63)** — not white |
| Frame | 1920×1080, 40s, 30fps, **with an AAC audio track** |
| Butterflies | **six**, the largest **37×22px — 1.9% of frame width** |
| Useful pixels | **0.110% of the frame.** The other 99.89% is green |

**The size is decisive on its own.** Drawn at the tiger's 300px the largest butterfly would be **5.8px**. To
reach even 60px the film would have to be laid out 3,160px wide — an upscale of a 1920 source, of which
99.89% would be background needing removal. There is no crop that rescues it either: each butterfly
travels across the frame, so a fixed crop does not follow one.

**And the green cannot be erased the way the tiger's and potter's white is.** `mix-blend-mode: darken` takes
the per-channel minimum, and green is darker than cream in every channel — `darken((0,175,63), (241,233,215))`
is the green, untouched. `multiply` gives (0,160,53), also green. `screen` gives a pale green cast and blows
the butterflies out. **No blend mode rescues a chroma key**; that trick works only for a ground *lighter*
than the page (§9). Real transparency would mean VP9-with-alpha WebM for Chrome and Firefox plus
HEVC-with-alpha for Safari, which ffmpeg cannot produce — two encodes and still a gap.

No watermark was visible in the frames checked, and the blob scan found exactly six butterfly-shaped
regions and nothing else. Licence was therefore not the blocker here; geometry was.

### What would work, if the butterfly is restarted

Either:

1. **A re-render to the specification that has worked twice** — one butterfly, filling most of the frame,
   on flat white (so `darken` erases it), 4:5 at 1080px or more, ≤10s, 24-30fps, **no audio**, camera
   static, starting and ending on the same pose so holding the last frame reads as deliberate. That is the
   brief that produced the tiger and the potter on the first try.
2. **Or drawn art rather than film**, which is what Plan 5 task 8 originally specified: a small butterfly
   that crosses a path once when the chapter is reached, then settles. ~5 KB against 1.8 MB, and it can
   stop, which continuous flight cannot.

**Worth asking before either: the page now carries a tiger, a potter and a lantern.** A fourth figure is a
restraint question (non-negotiable #4) before it is a technical one, and that is the client's call.

---

## 12. The films' rig, and what each break proved

`scripts/check_films.mjs`, 8 Aug 2026. The two films were the last signature interaction with **no
automated check of any kind** — `npm test` reported 276 passing while nothing guarded whether either one
ran, stopped, held its last frame, or showed its white background to a visitor. A unit test cannot watch a
video play.

Ten assertions, each about what a visitor gets. Three deliberate breaks first, before any pass was trusted:

| Break | Caught by | What it read |
|---|---|---|
| `mix-blend-mode: darken` removed from the film | the **pixel** check | corners 44 and 55 levels off the chapter's cream — a white rectangle |
| `loop` added | six assertions at once | "still running 4.44 → 5.14 → 5.85s after its own duration" |
| `poster` attribute restored | the first-load check | "2 film stills fetched before anything scrolled" |

**The pixel check is the one worth keeping in mind.** Reading `mixBlendMode` off the computed style would
have passed on the broken build for one of the two films, because the *still* still carried it. Screenshot
the film's own box, sample its four corners, compare them against the cream the chapter actually sits on:
1 level out when it works, 44-55 when it does not. That is the only form of this check that cannot be
satisfied by a declaration.

**The `loop` break is why the rig samples position three times after the film ends** rather than once. A
single reading catches a rewind but not a slow second pass.

**And one assertion is weaker than it looks** — see §5. "With the pointer parked it does not replay" passed
on a build with the `armed` guard deleted, because Chromium never re-fires `pointerenter` under a
stationary cursor. Recorded rather than quietly relied upon.

---

## 11. The hanging lantern, and what it cost to hang it

The client asked on 7 Aug 2026 for their watercolour lantern to hang out of the night photograph above
`06 · The Lantern Hour`, over the chapter, and to swing when pushed. It does. Four things were learned.

### The supplied PNG had no transparency, and every tool said it did

2048×2048, four channels, `hasAlpha: true` — and **every pixel fully opaque, corners pure white.** Dropped
on the page as-is it is a white square on cream. `lib/media.ts` never sees brand art, so nothing else in the
pipeline would have caught it either. `scripts/build_lantern.mjs` cuts it: a flood fill **from the edges**,
never a global "white is transparent" threshold, because the lantern has white highlights on its glass and
inside the ring at the top of its chain that a global threshold punches holes through. It throws rather than
shipping a white box if the fill stops finding a ground.

**`mix-blend-mode: darken` was the obvious reuse and it was measured and rejected.** It is how both films'
white backgrounds are erased (§9), but 9% of this artwork's pixels are brighter than the cream in some
channel and nearly all of them are the flame. `darken` would have clamped exactly the part of the picture
the lantern exists for.

### A pendulum is the only peripheral motion this page allows, because it is the only one that ends

Non-negotiable #4 forbids motion you notice; #5 requires arrive, perform, doze. A damped oscillator does all
of it unmanaged, and its rest state is the still lantern the server renders. Integrated against **real
elapsed time**, not one frame — a fixed step swings at half speed on a 30 Hz laptop and double on a 120 Hz
display, and nobody thinks to check that.

**ζ was 0.1 for one build and 0.1 was wrong.** A real lantern is under-damped, so it is the physically
honest figure — but the envelope decays as `e^(-ζωt)` and at 0.1 a ten-degree push takes **13.5 seconds** to
reach rest. Thirteen seconds of frame loop and of movement at the edge of someone's eye. ζ = 0.14 settles it
in ~3.5 swings and 6.7s. Restraint beats accuracy here as everywhere else on this page.

### It fits only where the composition leaves room, and that is not everywhere

The lantern hangs into the space between the section's top edge and the first thing below it, and that space
is `items-center`'s: `ChapterIntro` centres its prose against the flanking photographs, the flanks grow with
width, so the prose starts lower the wider the window. Measured, and independent of viewport height:

| width | 1024 | 1120 | 1280 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|
| room | 80px | 96px | 196px | 243px | 286px | 393px |

So: 200px from 1440 up, 128px from 1280, 168px below `lg` where the layout stacks and it hangs over the
bonfire instead — which is where it looks best of all. **1024–1279 has no answer and the lantern is hidden
there.** The alternative measured that day was a lantern printed through the words "The other half of the
day". If that band ever matters, the fix is to hang it over the bonfire flank as the stacked layout does.

**Every width rule is a closed interval and that is load-bearing.** The first version mixed Tailwind's `md:`
and `xl:` with an arbitrary `min-[1440px]:`, and Tailwind emitted the arbitrary rule *first* — so at 1920
both matched, specificity tied, and `xl:w-[128px]` won on source order. The lantern shipped 128px wide where
200 was meant, with every other check green. Disjoint rules cannot care how a framework sorts them.

### The two instruments that were wrong before the page was

- **`check_lantern.mjs` counted the wrong frames.** It patched `requestAnimationFrame` and reported 189
  frames still running after the lantern slept — but Lenis drives the page's smooth scroll from rAF and
  never stops. The fix is a control: measure the page's idle rate, the rate while swinging, and the rate
  after rest, and assert the middle one is higher than the other two. Without the "is it higher while
  swinging" half, the rest check would pass on a lantern with no loop at all.
- **`measure_density.mjs` could not see it.** It hit-tests with `document.elementsFromPoint`, which does not
  return `pointer-events: none` elements — and the lantern is click-through on purpose, because it hangs
  over the copy and must not eat a caret. It appeared in the report's image inventory and contributed
  nothing to coverage. Now switched clickable for the duration of a sample and put back. `lantern-hour`
  37.9% → **36.5%**.

Run against the broken state first, as always: with the stop condition removed the rig reports 184.7 frames/s
against 129.3 idle and exits 1, on a lantern that *settled at −0.013 degrees* and looked perfect in a
screenshot. With the push zeroed it reports 0 degrees and 0 crossings.

---

## 5. Owed, and open

- **THE MENU'S GLASS, AWAITING THE CLIENT (11 Aug).** The client asked for the places menu to open on
  "a blurred transparent background… or Liquid Glass". Built that way, at an 82% cream wash, the panel's
  **gold** region labels (`Pench`, `Tadoba`) measured **3.43:1** over the hero — under the 4.5:1 floor.
  There are two ways out and **both are built and measured**; §16 carries the arithmetic.

  | | Wash | Region label | Lodge names | Reads as |
  |---|---|---|---|---|
  | **A — regions in ink** | 82% | 6.09–6.63:1 | 6.02–6.48:1 | real glass; the hero shows through |
  | **B — regions in gold** *(on the branch)* | 97% | 4.55–4.61:1 | 8.08–8.16:1 | effectively solid cream |

  **B is what is committed**, because it preserves the design the client last saw and nothing illegible
  may ship while he decides. **The recommendation put to him is A**: it is the only one of the two that is
  actually the effect he asked for; it spends gold on the two smallest words in the panel, where gold was
  doing least; and it clears the floor with room to spare, where B passes by 0.05 of a point and could be
  pushed back under by any future hero brighter than today's. Switching is one line plus a re-measure.
  Screenshots at 390 and 1440, both variants, are in `docs/reviews/2026-08-10-site-navigation/`.
- **THE DENSITY QUESTION, AWAITING THE CLIENT (10 Aug).** Three chapters on the redesigned property pages
  sit above non-negotiable #8's 45%-empty ceiling: `vann-forest` **55.8%**, `tola-reserve` **58.3%** and
  `vann-press` **87.2%**. Page means are *better* than the home page's 40.1% — Vann **36.2%**, Tola
  **31.3%** — so this is three chapters, not a sparse page.

  **The first two are the `column` shape, and the reviewer's argument is that they cannot be fixed and
  should not be reported.** A shape whose definition is "one screen of bare cream carrying only type"
  cannot satisfy a rule reading "no screen may be over 45% empty"; the two are in direct logical
  contradiction. `OpeningColumn`'s own doc comment calls it "the page's one held breath, and what buys the
  right to be dense everywhere else". Genuine attempts were made and measured (72.6 → 55.8, 72.1 → 58.3, by
  a new `tight` rhythm plus a wider prose measure) — the remainder is the shape being itself.
  **Recommendation: write `column` into non-negotiable #8 as a named exception**, so the next implementer
  does not "fix" a red number by deleting the thing it exists to be. *Not done unilaterally — 45% is the
  client's own figure, chosen by him as a midpoint, so amending it is his call.*

  **`vann-press` is different and is a real defect.** 87.2% is partly an artefact — the band is 514px, 0.57
  of a screen, so ~43% of every window scored against it is the *neighbours'* padding, the same effect
  CLAUDE.md documents for the home page's joins but charged to a chapter instead of to nobody. Even scored
  against its own box it is ~84% empty. Larger type and a stacked layout were both tried and both measured
  worse. The diagnosis is not typographic: **three press citations are a footnote being asked to hold a
  numbered chapter.** Recommendation put to the client: **fold them into `vann-invitation` as a ruled strip
  above the sibling photograph** — credibility beside the ask, the weakest band on either page gone, no
  content lost, and Vann keeps an asymmetry Tola does not have.
- **Fresh evidence captures for the property pages.** The screenshots and density JSON under
  `docs/reviews/2026-08-09-property-redesign/` predate the bonfire swap, and a re-capture on 10 Aug was
  deliberately *not* committed: the working tree carried another session's in-progress forest-overlay work
  (`ChapterSurface.tsx` among others), so any measurement taken then reflects code that is not this
  branch's. Re-run once that settles. The figures themselves did not move — Tola's mean stayed 31.3%.
- **Tola's map gate and zone markers** were still judged too close to tell apart by eye at Task 15, before
  the final fix wave redrew the legend marks as distinct shapes. Worth one more look on a clean build.
- **The targeted shot list** (`docs/shot-list.md`) — six source photographs top out at 541–1000px and cannot
  fill a high-DPR phone. `potters-hands` and `forest-shrine-incense` are the two that limit the collage.
- **More photographs in `rooted`** if the pinned collage is ever to deliver the client's "memory album
  drifting by". Three cannot do it at any rate inside the parallax cap; the library has one image spare.
- **Eleven hard numbers in the copy are unconfirmed** — see `docs/copy-provenance.md`. The sharpest: the
  live site's room list for Mahua Tola totals **twelve** while the brand record says fourteen.
- **Plan 5, tasks 8–10.** The butterfly; the tiger's browser rig (**must be rewritten for video** — the
  SVG-inking version in the plan is obsolete); whole-page verification.
- **One assertion in `check_films.mjs` is weaker than it looks.** "With the pointer parked it does not
  replay again" passed unchanged on a build with the `armed` ref deleted: Chromium does not re-fire
  `pointerenter` under a stationary pointer, so only the `finished` guard is ever reached there. It is a
  real check on what a visitor gets — it caught a looping film outright — and it is **not** evidence that
  both guards exist. Do not delete `armed` on the strength of it. Noted at the assertion itself too.
- **The two film posters are 103 KB of the initial load and nobody has scrolled to them.**
  `tiger-film-poster.webp` (56 KB) and `potter-film-poster.webp` (47 KB) are fetched at ~28 ms at both 390
  and 1440, ahead of the first screen's own imagery. `preload="none"` does not defer a poster and there is
  no `loading="lazy"` for one. Against a hero that is bandwidth-bound and ~1,400 ms over budget, this is a
  larger lever than anything measured in Plan 4 Task 6 (§3). The fix is to attach `poster` only when the
  film is near, the way the film itself already waits. **Raised with the client 7 Aug; not yet done.**
- **`field-days / rooms` is now the page's emptiest join at 73.1%**, the one the tiger closes. It has not had
  the treatment `rooted`'s join just had, and its photographs drift 7-24px rather than 126, so the cause is
  probably not the same — measure before assuming.
- **The lantern is hidden between 1024 and 1279px** — the composition leaves 80–196px there and the smallest
  lantern worth drawing needs 179. See §11. The client knows; if that band matters the fix is to hang it
  over the bonfire flank as the stacked layout already does.
- **The butterfly is parked, at the client's request on 8 Aug 2026 — not abandoned.** Everything needed to
  pick it up again is in §13: why the supplied overlay films cannot be used, and the two routes that would
  work, one of them a re-render specification ready to hand to an illustrator. Nothing is owed until the
  client asks for it.
- Then Tripadvisor wiring, the SEO redirect map, Sanity.

---

## 6. Deferred minors carried out of Plan 4

None block anything. Listed so they are not rediscovered as new.

- `SplitLines` prose calls the block rise and line reveal "one settle"; they are 0.9s and 1.0s + stagger.
- Per-line stagger delays are read at mount and not re-measured on resize or after a late font swap.
- `potters-hands` at 768px is served at 0.68 source pixels per CSS pixel — the reorder favoured the ≥1440
  pinned composition. Fix is a larger source file, not code.
- `invitation[0]`'s parallax is sampled over 24% of its scrub; the tween is linear so it can only
  under-report, never fabricate movement.
- Evidence folders `2026-08-05-header/` and `2026-08-05-scroll-craft/` overlap.

---

## 16. The menu's glass wash, and the region label it failed

10-11 Aug 2026, closing out the site navigation. The spec for `SiteMenu`'s glass promised the worst-pixel
contrast of ink type over it would be **measured** against the worst backdrop the site can produce — the
panel opened over a full-bleed photograph — "not assumed from the wash looking opaque enough." That
measurement had never actually been built: `scripts/check_contrast_over_photos.mjs` had no capability to
open the menu at all before this task added `pre: "menu"`. Built and run for the first time, it found the
promise broken.

### What failed, and by how much

Two runs per route, opened over that route's own hero: the ink place-labels ("Home", "Mahua Vann", "Mahua
Tola") against a 3.0:1 floor, and the gold `--accent-text` region labels ("Pench", "Tadoba") against 4.5:1
— non-negotiable #7's own number, since `goldText` exists specifically to be "the legible sibling" to
decorative gold.

| Run | Floor | Worst, at 82% wash |
|---|---|---|
| `menu · place over frost` (ink) | 3.0 | 6.02–6.17:1 — clear |
| `menu · region over frost` (goldText) | 4.5 | **3.43–3.55:1 — FAIL, all four widths, on the home route** |

The place labels were never in danger — ink is dark enough that even a thin wash holds. The region labels
were, and did: the worst pixel behind them, `[202, 191, 174]` at 390/768px, is where the hero photograph's
own darkest patch shows through the 18% of the wash that was not cream.

### The fix took three attempts. The first two are both worth remembering, for different reasons

The lesson `build_forest_overlay.mjs` already taught this project (§15): when a rule bounds a value, solve
for the bound instead of hand-picking a number under it. **The first attempt did that and was still wrong.**
It reverse-solved the photograph pixel from the single rendered composite at 82% — `(cream × 0.82) −
composite`, divided by `0.18` — landing near `(24, 0, 0)`, forward-solved a "minimum" of 94% from that one
modelled point, and shipped 95% for margin. Rebuilt and re-measured, the region label read **4.40–4.44:1 —
still short of 4.5.** Dividing by 0.18 to back out a single real measurement amplifies whatever rounding sits
in it roughly sixfold, and that is exactly what happened: the modelled 82% composite was `[202,191,176]`
against a *rendered* `[202,191,174]`, close enough to look right and wrong enough to break the extrapolation
built on it.

**The second attempt used two real rendered composites instead of one modelled one — and the number it
shipped was real even though the reasoning written down for it was not.** Two composites, taken from actual
renders (82% → `[202,191,174]`, the failed 95% → `[225,216,198]`), a build at 98%, and a rendered
4.62–4.66:1 that genuinely cleared the floor. What went in the record alongside those numbers was wrong: it
claimed a **per-channel RGB** linear fit through the same two points predicted the 98% result, and it does
not. Interpolating `[202,191,174]` and `[225,216,198]` per channel to 98% predicts `[230,222,204]` → 4.65:1
— close by luck, not by method, and a caught-by-review check of the *identical* extrapolation using the
95%→100%(cream) segment instead of the 82%→95% one (both equally "two real points, no assumption about the
photograph") predicts a visibly different `[235,226,208]`-ish composite and, on that **95%→100% segment**,
a contrast of **4.844:1** — not the theoretical fit's 4.65:1, and not anything measured. Per-channel RGB
fits from only two noisy 8-bit samples are not reliable here: color-mix blends linearly in theory, but AVIF
re-encoding and anti-aliasing put enough noise into three separate channels that which two points you pick
changes the extrapolated colour by more than the effect being measured.

**What actually reproduces the shipped number, checked independently and matching to within 0.002, is
fitting the two composites' *scalar relative luminance* linearly** — not the three RGB channels separately.
The two real points:

| Wash | Composite (390/768px worst case) | Relative luminance |
|---|---|---|
| 82% | `[202, 191, 174]` | 0.52874 |
| 95% (failed) | `[225, 216, 198]` | 0.69197 |

`L(a) = L₈₂ + (a − 0.82) / (0.95 − 0.82) × (L₉₅ − L₈₂)`. At `a = 0.98`: `L = 0.52874 + (0.16/0.13) ×
0.16323 = 0.72963`, and `(L + 0.05) / (Lgold + 0.05) = (0.72963 + 0.05) / (0.11858 + 0.05) = 4.625` —
against a rendered 4.62–4.66. **Be honest about why this works and the per-channel fit does not: it is not
more theoretically justified — color-mix blends RGB, not luminance, so "linear in luminance" has no
first-principles basis the way "linear per channel" does.** It works empirically because contrast ratio is
*itself* a function of luminance alone, so fitting the one already-computed scalar the question actually
turns on absorbs the three channels' independent rounding noise into a single number instead of propagating
three separately-noisy fits through a further nonlinear gamma step. A luminance fit is the pragmatic
instrument for *this* question — "what wash clears a contrast floor" — not a more correct model of what
`color-mix()` does. Anyone re-deriving this number should fit luminance, not RGB, and should still confirm
against a real rebuild rather than trust either fit past two decimal places — see the `~96.3%` estimate
below, which the luminance fit gets right and a real measurement still had to confirm.

### The third attempt asked the question §16 should have asked the first time: was 98% forced at all?

The only failing run was the **gold** region label at its 4.5:1 floor. The **ink** place-labels, at a 3.0:1
floor, cleared even the original 82% wash by a wide margin (6.02–6.17:1) — there was never a legibility
problem with ink on this glass, only with gold. Two variants were built and measured rather than one shipped
by feel:

**Variant A — set the region label in `--text` (ink) instead of `--accent-text` (gold), wash left at 82%.**
Reuses a palette token already in the file; breaks no architecture rule. Measured, all three routes, all
four widths (`docs/reviews/2026-08-10-site-navigation/{home,vann,tola}-contrast-variant-a-ink.json`):

| Route | `menu · place over frost` (ink, floor 3.0) | `menu · region over frost` (now ink, floor 4.5) |
|---|---|---|
| `/` | 6.02–6.17:1 | 6.09–6.29:1 |
| `/mahua-vann` | 6.07–6.48:1 | 6.23–6.59:1 |
| `/mahua-tola` | 6.08–6.46:1 | 6.37–6.63:1 |

Every run clears its floor with enormous margin, at the **original 82%** — the wash the client's own
"blurred transparent…or Liquid Glass" brief was written against. By eye
(`menu-home-{390,1440}-variant-a-ink.png`, `menu-mahua-vann-{390,1440}-variant-a-ink.png`): the hero
photograph is genuinely visible through the panel — soft blurred greens and warm tones bleed through the
cream, and at 1440px on the home route a faint gold shape (the header's own pill) is visible through the
glass behind "CLOSE". This is the "Liquid Glass" character the client described. The cost: "Pench" and
"Tadoba" read in the same ink as the place names above them, losing the gold accent that distinguishes a
region from a destination name elsewhere on the site.

**Variant B — keep gold, solve for the lowest wash that clears 4.5:1 with a sensible margin, by binary
search against real rebuilds.** Not a round number chosen and hoped for:

| Wash | `menu · region over frost`, 390px | Verdict |
|---|---|---|
| 96% | 4.49:1 | FAIL |
| 96.5% | 4.52:1 | Clears, margin too thin to trust against measurement noise |
| **97%** | **4.55–4.60:1 (390px)** | **Clears with a sensible margin — shipped** |

Confirmed across all three routes, all four widths after the rebuild
(`docs/reviews/2026-08-10-site-navigation/{home,vann,tola}-contrast.json`):

| Route | `menu · place over frost` | `menu · region over frost` |
|---|---|---|
| `/` | 8.08–8.10:1 | 4.55–4.60:1 |
| `/mahua-vann` | 8.08–8.15:1 | 4.56–4.61:1 |
| `/mahua-tola` | 8.08–8.16:1 | 4.59–4.61:1 |

By eye (`menu-home-{390,1440}-variant-b-gold.png`): "Pench" and "Tadoba" keep their gold; the panel is
still noticeably more opaque than Variant A's 82%, but a faint warmth is visible where flatly solid was not
at the 98% first ship. The `@supports not (backdrop-filter)` fallback stays at 99%, still the more opaque of
the two paths.

### What is in the tree, and what is not this task's call

**Variant B — gold regions, 97% wash — is what is shipped**, because it is closer to the design that was
already approved (gold distinguishes a region from a place name everywhere else on the site) and it clears
the floor with real margin, solved rather than guessed. **Variant A's numbers are recorded here, not
applied**: switching the region label's colour is a real, visible design choice — closer to the client's own
"Liquid Glass" brief, at the cost of the gold accent — and it is the client's to make with both screenshots
in front of him, not something to switch unilaterally because the numbers are better. Both variants' JSON
and all eight menu screenshots (four per variant) are in `docs/reviews/2026-08-10-site-navigation/`.

Going from 82% to 97% (Variant B, shipped) is still a real, visible change from the wash the client's brief
was written against — see the screenshots — even though it is a smaller jump than the first ship's 98%.
**Not yet put to the client.** A third alternative, considered and still rejected: darkening `goldText`
itself just for this context would also have cleared the floor without moving the wash at all, but it is a
hard-coded, one-off colour outside `lib/palette.ts` — the architecture rule this project holds everywhere
else — and it would make the region labels a different colour here than anywhere else they appear.
Reclassifying the label as WCAG "large text" (a 3.0:1 floor the original 82% would already clear) was also
not done: the label is 9.92–12px, nowhere near the 18px/14px-bold threshold, and lowering a floor to make a
number pass is the one thing CLAUDE.md says never to do again.
