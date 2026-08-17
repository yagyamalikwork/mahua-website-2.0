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
| 15 Aug | **The home page closes by choosing a lodge, not by asking again** | *"Replace the 'Plan Your Stay' button on the last section with 'Mahua Vann, Pench' and 'Mahua Tola, Tadoba' … rather than another Plan Your Stay button that takes them to mahuaresorts.com."* The header's pill already pointed at `#invitation`, so only that section's own button changed: one external link became two internal ones, same `PillButton`, plus the 3D raise he asked for. **No lodge name is written in `Invitation.tsx`** — `content/site.ts` already carries label, region and route for both, and the menu's tiles read the same three fields, so a renamed or a third lodge lands in both places at once |
| 15 Aug | **Photographs float on the home page — rise only, no tilt, and the zoom stays** | *"The zoom we added a few days ago is perfectly fine, I just want them to very slightly lift and rise towards the viewer and no tilt, which will give the images a float like effect."* `FLOAT` is `RAISE` with the rotation removed: 6px against the menu tiles' 8, because these frames are far larger, so the same distance reads as more movement. The tilt is what makes a tile read as a *card being picked up*; a photograph here is meant to read as lifting off the paper |
| 15 Aug | **The float is the home page's only — asked, and declined for the property pages** | Offered on the same day it shipped: *"no need to add float to the property pages we will keep it for the homepage only."* So `[data-hover-zoom]` staying on `app/page.tsx` alone is now a **decision**, not an oversight. A future session finding the property pages without it should not read that as a gap |
| 15 Aug | **The lodge marker on both property maps is the brand's flower** | *"Replace it with the Mahua Resorts emblem flower and keep it the same size as the circles marking the resort locations currently."* Two concentric circles became `<image href="/brand/emblem-120.webp">` in the same 26×26 viewBox-unit box the outer ring occupied. **It overrides a recorded decision**, and deliberately: a comment there said the mark was drawn rather than rastered because a bitmap would be the only one on an otherwise resolution-independent drawing. Fair while it was two circles; not a reason to hand-redraw his emblem, which this project refuses everywhere else (`ui/BrandMark.tsx`). `emblem-120` was chosen from a measurement — the marker renders 40.5px at 1920 and `lib/sizes.ts` caps density at 2×, so ~81px is the real demand; 80 sits under it, 160 is 2.6 KB for pixels nothing asks for, and 120 is also the header's own DPR-2 tier, so it is often a cache hit. `docs/reviews/2026-08-15-map-emblem/README.md` |
| 12 Aug | **The plates that squeezed, and how they should behave when zoomed** | He reported images squeezing on smaller laptops, tablets and at zoom, on `03 · The Forest`, `05 · The Rooms` and `07 · The Details` — the only three chapters that use `PlateGrid`, so the diagnosis followed his own observation exactly. Measured at up to **230% wider than the photograph's true shape** on a 1366×768 laptop. Asked what should happen at deep zoom, he chose **full size, scroll more** over shrink-to-fit: *zoomed in but the photographs got smaller* is the wrong direction. `docs/reviews/2026-08-12-plate-squeeze/README.md` |
| 12 Aug | **`07 · The Details` may stay a 2-wide stack between 1024 and 1279px** | The other half of his squeeze report was *"images **wrap**"*. Chased separately: the stagger switches on at `lg` (1024) but a four-plate grid's fourth column only arrives at `xl` (1280), so for a 256px band that chapter is a tall 2×2 with the right column hanging low while `forest` is already 3-across. Offered the fix — bring the fourth column in at `lg` — and he declined: *"It's fine."* **Looked at and accepted, not unexamined.** A future session finding this band should not read it as a defect |
| 12 Aug | **Desktop is the lens for now; the phone is a later pass** | *"Right now our only focus is how it looks on a computer/laptop screen, we can workout and optimize mobile screens later."* Given in answer to the card stack's mobile scroll growth (+35.9% / +43.6% against the ~27% / ~38% he had accepted), so it is a **sequencing** ruling, not a quality one. **It does not relax non-negotiable #6** — most traffic is still Indian mobile, the byte and arrival budgets still bind, and every rig still measures 390. What it defers is *tuning* the phone, not *checking* it: this plan's two worst defects were both found at 390, one by a human reading a screenshot, and the instruments that found them stay on |
| 11 Aug | **The re-rendered forest ships, and the tint question is closed** | *"Looks fine, we can keep it for now."* Kept, not acclaimed — so it is settled unless he raises it. The new drawing delivered what the dials could not: foliage at **0.267** against the old 0.135 and the three hornbills reading as the chapter's darkest element, both under the *same* 4.5:1 guarantee. §15 |
| 9 Aug | **Both property pages shipped** — `/mahua-vann` and `/mahua-tola`, every chapter inside the 45% ceiling, every rig green at the real routes | Built 8 Aug, then reviewed and corrected 9 Aug after the client found the build session had silently fallen back to a smaller model: the first pass had committed failing density and a failed contrast run as "verified". Evidence and the full correction story in `docs/reviews/2026-08-08-property-pages/README.md`. **Awaiting the client:** Tola's room count (12 vs 14), the home page's cottage/suite caption fix, Tola's hero swap, and a Nagpur distance |
| 9 Aug | **Both property pages rebuilt in a "shape vocabulary"** — eight chapters each, no two adjacent chapters sharing a shape, mechanically enforced (`findRepeatedShape`) — replacing the first ship's `ChapterIntro`/`PlateGrid`/`RoomsIndex`/`FieldNotes` structure that read as a template | Three client decisions inside this redesign: **(1) a persistent booking bar**, quiet and always reachable, that slides in past the hero and steps aside over the closing invitation — *"a visitor on a property page has already chosen a lodge, so asking is fair here"*, distinct from the home page's "seduce, not convert" (non-negotiable #2), and built to fail towards absent with no JavaScript, the welcome screen's own contract (§14); **(2) six experiences per property, each given real space, plus one honest "also" line** naming what did not make the six (karaoke, the conference hall, wildlife documentaries, indoor games) rather than promoting or deleting them; **(3) the enquiry form dropped for plain contact details** — *"we don't need an enquiry form, for the enquiries we can just share the contact details in the Website Directory section when we build it later"* — which fixes the same defect a form would have (a bare `mailto:` doing nothing on a phone with no mail client) better than a form does: a real `tel:` link works on every device, with scripting off, with no third party and nothing to sign up for |
| 10 Aug | **A guest's face comes off the site on consent grounds, and the photograph is deleted rather than shelved** | Mahua Tola's Bonfire entry (`DSC00097-scaled.jpg`, the live site's own) showed a guest clearly enough to identify her. *"It directly shows a person's face who was a guest, which we don't want."* Replaced with `bonfire-circle-night` — a frame from **the client's own Mahua Tola property video**, so it is honestly this lodge's bonfire and not a stand-in from Pench, and it carries no people at all. **The withdrawn entry was removed from `CURATION`, not left curated-but-unused:** an id that stays in the manifest is an id a later chapter reaches for by name, and the next person wanting a bonfire would find it without ever seeing the face in it. Restoring it needs the guest's consent, not a code change. **This is the second image rejected on these grounds** — the original curation dropped one for the same reason — and the rule was simply not applied when this one was curated on 9 Aug. Both instances are now recorded in `scripts/build_images.mjs`'s own comment, which is the only place that survives a clone |
| 9/10 Aug | **Task 15 closed the redesign out** — both routes' rigs green, home page proven untouched, `vann-table`/`tola-table` measured for the first time (both clear their contrast floor on the untouched default scrim) | Density's first read found `vann-forest` 72.6%, `vann-where` 56.9%, `vann-press` 88.4% and `tola-reserve` 72.1% over the 45% ceiling — all four are chapters shorter than one 900px screen, which `measure_density.mjs` scores on the single window centred over them, mostly some neighbour's own padding rather than the chapter's content. `vann-where` and `tola-where` were brought fully inside (56.9%→36.6%, 44.5%→21.9%) by widening the map's own column and a new opt-in `tight` rhythm on `ChapterSurface` (default untouched, so the home page is provably unaffected — see §4 of the task's own evidence). `vann-forest`/`tola-reserve` (`OpeningColumn`, widened 62ch→92ch) and `vann-press` (`PressBand`) improved but remain over — 55.8%, 58.3%, 87.2% — and were reported rather than forced: the remaining levers would either widen a "held breath" screen past what non-negotiable #4 protects, or enlarge three press citations past what "set quietly" (that component's own words) means. Full figures, both readings PressBand tried, and the screenshot findings: `docs/reviews/2026-08-09-property-redesign/README.md` |
| 10 Aug | **The menu is places only** — Home, Mahua Vann, Mahua Tola, as real page links; the per-page chapter lists leave the menu on every page, including the home page's | The site was three well-made pages that did not behave like one — from `/mahua-vann` there was no route to Home or Tola except the closing sibling banner and the browser's back button. The 18-screen home page goes back to being scrolled, which `ChapterMenu`'s own doc called "the page's actual proposition". The property pages keep their chapter numbering as page furniture; the menu's reviewed mechanics (dialog semantics, focus trap, Escape-to-trigger, the Lenis-aware scroll lock) carry over unchanged into `SiteMenu`, `ChapterMenu`'s successor |
| 10 Aug | **The Website Directory ships now, as a footer on all three pages** | *"we can just share the contact details in the Website Directory section when we build it later"* (9 Aug, when the enquiry form was dropped) — later is now. One server-rendered band, zero JavaScript anywhere in its import graph (enforced by a test that walks it), mounted once in `app/layout.tsx` so every route carries it identically — and it is what finally gives the site working cross-page navigation with JavaScript off, which the menu alone cannot |
| 10 Aug | **The lodges appear in the menu with their own photographs; Home is a plain type row** | *"Like The Sujan Life"* — whose menu presents each camp as an image card with its region. Home carries no image: it is wayfinding, not a destination being sold. The card photographs mount into the DOM only on the menu's first open, not at page load — the panel is permanently present (`inert` while closed) for the accessibility machinery, and `visibility: hidden` does not stop a lazy image intersecting the viewport, so an always-mounted eager card would have joined every page's initial transfer for nothing the visitor asked for |
| 10 Aug | **The menu surface is cream glass, with a hamburger trigger, on gold accents** | *"a blurred transparent background … or Liquid Glass"* and, for the icon, *"Like the Sujan Life"* — both chosen over previewed alternatives (dark glass; the word "Menu"). A *pure* transparent blur cannot guarantee legible type over an arbitrary photograph, so the glass carries a translucent wash of the site's own paper; type turns ink. Verified, not assumed — and the verification found a real failure, not a hypothetical one. Full story in §16 |
| 11 Aug | **Keep the glass; spend the gold.** Every text run in the menu panel is ink, and the wash stays at the 82% the effect was designed at | The gold region labels measured **3.43:1** on that wash against a 4.5:1 floor, and the only way to save them was thickening the cream to **97%** — which made the panel effectively solid and threw away the "Liquid Glass" brief that produced it. Both were built, measured and screenshotted before he was asked. *"Lets go ahead with Option A… if in case we need to change it later we can do that."* Ink measures **6.02–6.63:1** across all three routes at four widths — roughly a third of the panel's opacity in hand. Gold keeps this panel's rules and focus ring, which are non-text at a 3:1 floor. **The two facts are one decision: gold text here forces the wash back to ~97%** |
| 11 Aug | **The lodges sit side by side in the menu, and much larger** | *"like The Sujan Life… bigger and placed side by side."* Each tile is now half the panel — ~650px at a 1440 screen, against the 208px thumbnail it replaced — photograph above, name and region beneath. Home stays what he asked for on 10 Aug, a plain type row, so the menu reads as one destination and two offers rather than three equal links. Below 640px they stack full-width: two columns on a phone would have made each tile *smaller* than the row it replaced, which is the opposite of the request |
| 11 Aug | **A tile lifts toward the pointer — the "3D raise"** | Hand-caused motion, so it is exempt from "nothing moves unbidden" on the same footing as the lantern's swing and the films' hover-replay, and it is a transition with nothing left running. Genuinely dimensional (`rotateX`) rather than a slide, but 2.5° and 8px: the tile is a large photograph, so the angle that would vanish on a button is ample here. Under `prefers-reduced-motion` the movement goes and the shadow stays — a visitor who asked for less motion should still get an answer when they point at something |
| 11 Aug | **The Website Directory is the brown of the logo's own wordmark** | *"the Muddy Brown color from the text on Mahua Resorts Logo."* `PALETTE.brand` (#7F5C24), which already existed for the header lockup and was sampled from the vector at 64,730 pixels of type rather than eyedropped. **A deliberate exception to non-negotiable #3** (cream throughout, no dark sections), and the shape that rule can bear: a terminal band, below everything, reached once. It is not licence to darken anything above it. Every colour in the footer inverted — `--dim` and `goldText` measure 1.1:1 and 2.0:1 on the brown — so cream carries what is read and the deeper paper carries the second rank, at 5.02:1 and 4.58:1, guarded by `palette.test.ts` as a third surface |
| 11 Aug | **The rooms chapter becomes a card stack** on both property pages — each room a card that sticks below the header while the next rises over it, covered cards receding | Client request. Chosen over a plain pile-up and a peel-away deck: *"pile up, with recede."* Replaces `RoomShowcase`'s three-scale composition, which was cropping two of seven room photographs ~35% of their width and one (portrait) by half its height, all by hand-assigned `scale` values nothing in the codebase checked |
| 12 Aug | **The Camping Hut is retired — off the site, and its photograph deleted from the pipeline** | *"The Camping Hut is no longer offered."* It was still the fourth room card on `/mahua-tola` and was named in the home page's own rooms copy, while the client's booking engine offered no such room on any of five date ranges sampled across nine months. The id is **deleted** from `CURATION` rather than left curated-but-unused — the rule the two consent rejections already follow, because an id in that manifest is an id a later chapter reaches for by name |
| 12 Aug | **The Super Deluxe Cottages get the card the Camping Hut had**, and the client supplied the photograph the same day | Three real rooms, on sale every date sampled, and until now invisible: the previous session had recorded, correctly, that no interior photograph of one existed anywhere in the live site's media, so the room could only be named in the intro. That blocker is gone. **Cropped 3:2 → 2.29 before curation** — see §2 #40 for why that was not a taste decision |
| 12 Aug | **Tola has eleven rooms, not twelve or fourteen** | Settled from his own engine and his confirmation that the hut is retired: 5 Deluxe + 2 Suite + 3 Super Deluxe Cottage + 1 Family Suite. The live site's *twelve* was these eleven plus the hut; the brand record's *fourteen* is these eleven plus three machaans still under construction, which the **home page had been stating in the present tense**. Both sources held half the answer. Corrected in `content/home.ts` and `content/mahua-tola.ts`; still worth his confirmation, since an engine reports what is sellable rather than what is built |

---

## 2. The defect that keeps happening — fifty-three instances

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
| 37 | **A fix that existed only in a discarded working tree.** | `build_forest_overlay.mjs` never clamped alpha. It was found and fixed during a two-segment attempt the build itself rejected, and the `git checkout` that withdrew the attempt took the unrelated fix with it. The same bug then surfaced a second time on the new artwork — `rgb(-181,-174,-157)`, a contrast of −32:1 — because it had never been latent: it was invisible only while every solved strength stayed under 1. A fix living in a branch you are about to abandon is not a fix; lift it out first |
| 38 | **An acceptance threshold that warned while its purpose was met.** | The re-render brief capped ink coverage at 45% and the drawing arrived at 47.3%, so the script warned. But coverage was only ever a proxy for *is the dark spread everywhere or concentrated*, and the deep-dark fraction — the thing that actually binds the contrast floor — had fallen 35.6% → 11.9%. The proxy was overruled deliberately. **A threshold that can fail while the property it stands for holds is measuring the wrong quantity**; if this is revisited, key it on deep darks |
| 39 | **`check_image_resolution.mjs` reporting "0 under-served" about photographs it had never seen.** | The menu's two lodge tiles are gated behind `everOpened`, so they are not in the document until the panel has been opened once — and the rig only ever scrolled. On 11 Aug 2026 the tiles were rebuilt to half the panel each and their `sizes` rewritten from fixed 112/160/208px boxes to `calc()` of the viewport; the rig passed at all five viewports **without the new sizing being measured at any of them**. It now opens the menu first: 39 images became 41 |
| 40 | **A check asking WHETHER the room card stack's recede ever ran, not WHEN, relative to being covered.** | Both a broken and a working construction "receded" eventually, so the first question passed on both. Card-as-a-direct-child, driving `animation-timeline: view()` off its own position, measured **opacity 1.00 throughout** the entire time a covered card was still the one being read — it only dimmed once already scrolled out of view, because a *stuck* element's own flow position barely advances until something dislodges it. Only sampling *while a card is on screen and pinned* told the two constructions apart. §17 |
| 41 | **A flex item's `min-height: auto`**, resolving to a content-based minimum from the `<img>`'s own aspect. | Silently overrode a declared `aspect-ratio` for the one portrait photograph among seven rooms (`tola-room-family`) — it rendered 513px where 273.6 was intended at 390px, clipping its own words below the card's `overflow: hidden`. Six of seven rooms are wider than their box, so the same override never bound anywhere else and nothing had ever asserted the box's *height*, only its width-crop. §17 |
| 42 | **An assertion bounding a room photograph's WIDTH crop to 25%.** | Said nothing about whether the photo FIT the card's own solved height. Five, then six, stacked cards' photo bands rendered 3–17px taller than their cards at 1440/1920 and the words landed entirely below `overflow: hidden` — and the diagnostic script built to confirm the fix shared the exact blind spot of the rig it was checking: it read the text rect against the *viewport*, never against the card's *own clip box*, and undercounted one card (Tola's Camping Hut) as legible when it was pure photograph. Reproduced in the very tool built to find the squeeze. §17 |
| 43 | **A rig's first seven assertions, all measuring a room card's outer box.** | None ever looked at the words. A card could pass all seven while its text was entirely invisible, which is exactly what five (then six) cards were doing. Assertion 8 — a text-block sweep requiring a scroll position simultaneously inside `[header, bar]`, inside the card's own clip box, and at opacity ≥0.98 — closed it, watched failing on the reverted build with ten failures naming exactly the affected cards and widths. §17 |
| 44 | **A media query that named a height and meant a phone.** | `short:` was `(max-height: 800px)`, written for a landscape phone, and `ui/Plate.tsx` used it to cap a plate at 24vh. It fires on a 1366×768 laptop, a 1024×768 tablet and any browser zoomed past ~110%. Worse, the cap and the base `w-full` both applied, so which won was framework emission order — the height clamped, the width did not, and photographs rendered **up to 230% wider than their true shape**. Instance 22 in this table is the same cascade defect on the lantern. Now keyed to the viewport's *shape* (`pocket:`, short AND ≥2:1), with every state naming its own width |
| 45 | **No rig had ever measured a short, normal-width viewport.** | Every instrument here samples 390, 768, 1440 and 1920 — and 768 is a *width*, never a height. So no case in the whole suite resembled an ordinary laptop, and instance 44 was found by the client opening the site on his own. Third defect in two days living in the gap between fixed sample points, after the card stack's 51% crop at 1024×1366. **A grid of fixed shapes is not coverage** |
| 46 | **A like-for-like photograph swap that silently changed a component's composition.** | `roomCardLayout` derives a room card's whole layout from its photograph's aspect ratio — at or above 1.9 the card is `stacked`, below it `beside`. The retired Camping Hut was 2.29; the client's replacement was a true 3:2. Dropping it in flipped the card's composition, and with it the chapter's height: `tola-rooms` went 33.8% → **37.1% mean, 44.3% → 47.9% worst**, breaking non-negotiable #8's 45% ceiling. **The full suite stayed green** — nothing tests a chapter's density. Caught only by running `measure_density.mjs` on the route, which nothing obliged me to do. **An image's aspect ratio can be an input to layout logic, not just to cropping; check what reads it before swapping one.** The first fix, cropping to 2.00 (the stacked box exactly, so zero render crop), was then rejected by `lib/room-card.test.ts` — it requires 0.35 of clearance from the threshold so no card is one re-encode from flipping, and 2.00 clears by 0.10. 2.29, its siblings' own ratio, is what shipped |
| 47 | **A guard that suppressed the wrong error, in the test written to prove the guard.** | `Money` was branded and a `@ts-expect-error` test was added to prove a forged literal would not compile. The test never imported `Money`, so the directive was suppressing `TS2304: Cannot find name` — and with the brand **deleted** the project type-check still exited 0. The implementer's own verification used `tsc --strict` on the single file, outside `tsconfig.json`, which hid it. **Check a guard under the same config as the build, and in both directions** |
| 48 | **A deferral falsified by a later fix, with nobody re-reading it.** | `MockProvider.quote()` resolving a room id across both properties was correctly parked as unfixable — `BookingProvider.quote` carries no property. Task 4's own fix then threaded the search query through the continuation, putting `context.query.property` in reach, and the parked note was never revisited. The final review's probe quoted and booked `vann-cottage-deck` at Vann's rate under a Tola search. **A parked finding's rationale is a claim about the code; when that code changes, the parking expires** |
| 49 | **A code comment and a spec both asserting `popover="auto"` guarantees at most one open panel.** | The HTML Popover API's own rule treats a popover invoked from a button INSIDE another open one as nested rather than replaced — and the gallery's arrows have to live inside their own panel to sit beside its own figure, so this was true of every single click, not an edge case. `RoomCardStack.tsx`'s own comment and `2026-08-13-image-sizing-design.md` §3 both stated the opposite as fact, unmeasured; the spec shipped the markup that guaranteed the bug it claimed could not happen. §18 |
| 50 | **A code comment asserting the popover's own `margin: auto` centres the panel.** | Tailwind's preflight (`* { margin: 0 }`) — author-origin — silently zeroed it; author origin always beats UA origin regardless of selector specificity. Every panel rendered pinned to the viewport's own top-left corner, `{left: 0, top: 0}`, confirmed live. A fixed test point (the gallery's own light-dismiss probe) passed at one width and failed at another for a reason that had nothing to do with dismiss — the same "a fixed point cannot see a distinction across shapes" lesson instance 44/45 already paid for once. §18 |
| 51 | **A CSS comment naming `[data-site-header]`'s z-index as 90, to justify the gallery's own 100 — written to avoid exactly this failure, and committing it anyway.** | The header carries `z-40` (`StickyHeader.tsx`); `[data-site-header]`'s own rules in `app/globals.css` set no z-index at all. The real `z-index: 90` belongs to `[data-welcome]`, the opaque welcome screen — which the gallery's own `100` then sat ABOVE, newly reachable because `:target` applies on first paint and every gallery open is now a real history entry, so a reload, a bookmarked link, or Back can load a room fragment straight into the URL before the welcome has finished its ~2.1s hold. Found only by reading every stacked value in the file instead of trusting the one already written down. §18 |
| 52 | **A fix that moved a breakpoint to answer a defect that was continuous.** | The plate boards shrank between whichever two breakpoints were current, at any window width or zoom level — moving the three-column tier from `lg` to `xl` could only relocate where that was visible, never remove it. The rig built alongside that fix then certified it anyway, because its own floor assertion carried an 85% shrink tolerance (plus a 65% exemption for a board at minimum columns) rather than a real floor — 483 failures were sitting behind a green rig. Found by the client resizing his own browser window a day later. §19 |
| 53 | **A layout that passed every rig and was visibly wrong.** | CSS Grid's `auto-fit` states a reflowing board's rule as directly as CSS can, and measured 0% distortion and the correct floor at every sampled width. It still stranded a trailing plate beside an empty, plate-width cell of bare cream, because a Grid track is shared across every row and an under-full row leaves its other tracks simply unoccupied — non-negotiable #8's own language, failed by the fix meant to satisfy it. No assertion this project has ever written checks for a bare cell beside a filled one; found only by opening a screenshot. §19 |

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

### The re-render arrived, and it unlocked a second solve

`Forest-illustrations/forest-overlay-2.png`, 10 Aug. Shipped 11 Aug as `1e623e9`; the client's verdict is
*"looks fine, we can keep it for now"* — kept, not acclaimed.

| Brief | Delivered |
|---|---|
| 2400px minimum | **2752×1536** ✓ |
| birds the only solid dark masses | **deep darks 11.9%** of the frame, from 35.6% ✓ |
| under 45% ink coverage | **47.3%** — over, and it did not matter |

**The coverage warning fired and was overruled on purpose, which is the interesting part.** 45% was a proxy
for *is the dark spread everywhere or concentrated*, and the drawing satisfies the thing the proxy stood for
while missing the proxy. A threshold that can be over while its purpose is met is a threshold worth
distrusting — the deep-dark fraction is the honest measure and is what the script should key on if this is
ever revisited.

Because the artwork now separates cleanly, the tint is solved in **two segments against the same 4.55:1
floor** — `BIRD_MAX = 70` splits them, and `INK_FLOOR` drops to 20 because this drawing's own range needs no
lifting:

| segment | solved strength |
|---|---|
| foliage | **0.267** |
| birds | 0.135 |

One multiplier is capped by the darkest pixel anywhere, so the birds were holding the foliage to their own
0.135. Solved apart, the foliage takes double while the birds sit exactly at the floor — the darkest thing on
the page's palest chapter, which is what the client asked for.

**Nothing was relaxed to get that, and the distinction matters**: both segments target body copy's 4.5:1, and
the closing assertion still measures every pixel. This is *not* the earlier attempt that gave the birds a
lower bar and was rejected by the build at 2.1:1. Measured on the page at four widths afterwards: headline
3.64–7.08:1, intro 4.64–6:1, rig exits 0.

**One real bug surfaced, and it was in the committed script: alpha was never clamped.** It could not bite
while the blacks were lifted high enough to hold every solved strength under 1. This drawing, keeping its own
range at ink floor 20, walked straight into it — the solver reported −32:1 over `rgb(-181,-174,-157)`. Now
clamped in both `worstAt` and `flatten`. It had been found and fixed once during the rejected two-segment
attempt, then lost to a `git checkout`; a fix that only exists in a discarded working tree is not a fix.

**Encoded to 1600 rather than 2400 despite the source carrying it.** This is a near-flat texture, so a 1920
screen upscaling 1.2× is invisible, and 2400 cost 149 KB against 92 for no visible difference on a decoration
several screens below the fold. Initial load is unchanged at 600/724 KB — the tint is lazy and below the
fold; whole-page grew 61 KB at 1440.

### Still open

- **On a phone it is a whisper.** The drawing keeps its own 1.79:1 aspect rather than being stretched to the
  section's 0.17:1, which would zoom tenfold into a sliver — so it is a faint band behind the heading and
  gone by the paragraph. Unchanged by the re-render: it is a layout consequence, not a resolution one.
- **The resolution compromise is closed.** 1600px files from a 2752px source; the browser now stretches
  ~1.2× at 1920 rather than ~1.9× from 1024.

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

- **HIGHER-RESOLUTION ORIGINALS ARE NEEDED FOR SEVEN PHOTOGRAPHS, AWAITING THE CLIENT (14 Aug).** The
  plate-reflow fix (§19) lets a board's one-column state draw a plate at up to ~864px instead of ~421px,
  and at device pixel ratio ≥2 (a Retina Mac, an iPad, a Windows laptop at 150% scaling) that state now
  falls **22–46% short** of the pixels it needs. The three Forest cats (`tiger-pair-profile`,
  `leopard-on-rock`, `melanistic-leopard`) are curated at **900px** wide; the four Rooms photographs top out
  at **1440px** — neither was ever asked to fill a whole container's width before this fix. Not caught by
  `check_image_resolution.mjs`, whose DPR sweep never samples a wide viewport at DPR above 1, exactly the
  combination this fix introduces. **The ask: uncropped originals, roughly 1800px wide for the three Forest
  cats and 2600px wide for the four Rooms photographs.** Full derivation: `docs/reviews/
  2026-08-14-plate-reflow/README.md` §8.
- **THE CHECKOUT IS BLOCKED ON ASIATECH, AND THE ASK IS WRITTEN (12 Aug).** The client wants a Mahua-branded
  checkout where the guest pays on our site and never sees AsiaTech. Nothing visitor-facing can be built until
  they answer, and the interim fallback was **tested and does not work**: their engine cannot be pre-filled
  (a GET 500s, query parameters are ignored, and a cross-origin POST returns an orphaned fragment with no
  route to payment), so a branded search box would make a guest type their dates twice. Three questions, in
  order of ambition, in `docs/superpowers/specs/2026-08-12-branded-checkout-design.md` §8:
  a **prefill deep link** (small, unblocks an interim improvement), a **partner API** (large, unblocks the
  real goal, and must say whether the payment gateway can be in Mahua Resorts' own name), and **total
  inventory per room type**. The third already paid for itself — reading their engine settled Tola's room
  count and found a retired room still being advertised.
- **The room counts want one word of confirmation.** Eleven at Tola is what the engine sells and what the
  site now says; fourteen is that plus three machaans still being built. An engine reports what is *sellable*,
  which need not equal what exists.


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
- **A fourth, fifth and sixth join the open count, on the HOME page** — found by image-sizing Task 8's
  whole-plan verification (14 Aug 2026) and confirmed pre-existing, not caused by that plan. Read on the
  same worst-screen statistic as the three above (the ceiling is a per-screen bound; `passesMean` is
  informative, `passesWorst` is the rule): `lodges` **48.6%** worst (43.7% mean), `field-days` **57.9%**
  worst (43.9% mean), `rooms` **47.2%** worst (36.9% mean) — all `passesMean: true, passesWorst: false`
  in `docs/reviews/2026-08-03-chapters/density.json`. Verified against the merge base rather than
  assumed: `git show 995697e:docs/reviews/2026-08-03-chapters/density.json` — `feat/chapters-rebuild`'s
  own HEAD, the exact commit `feat/image-sizing` was cut from — reports the identical three chapters at
  the identical figures. Nothing in the image-sizing plan's seven tasks touches `lodges`, `field-days`
  or `rooms`; they are pre-existing and open, unrelated to that plan's own work. Not yet put to the
  client in these terms — CLAUDE.md's non-negotiable #8 table has read "all twelve chapters inside it"
  since 5 Aug 2026, which was true then and had stopped being true by at least 11 Aug (identical figures
  already sit at `995697e`); nobody had re-checked `passesWorst` specifically against the twelve-chapter
  claim until this review. Full derivation: `docs/reviews/2026-08-13-image-sizing/README.md` §2.2.
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
- **Ten hard numbers in the copy are unconfirmed** — see `docs/copy-provenance.md`. **The sharpest of them,
  Tola's room count, was settled on 12 Aug 2026 and is no longer one of them.** The client's own booking
  engine sells eleven rooms (5 Deluxe + 2 Suite + 3 Super Deluxe Cottage + 1 Family Suite), identical across
  five date ranges over nine months. The live site's *twelve* counted the Camping Hut, which the client
  confirmed that day is retired; the brand record's *fourteen* counts three machaan rooms still being built,
  and the home page had been quoting it in the present tense. Both sources held half the answer and neither
  knew it. **Still worth one word from the client**: an engine reports what is sellable, not what is built.
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
- ~~**The rooms card stack's mobile growth.**~~ **Relayed and answered, 12 Aug.** He was given the real
  figures — **+35.9% (Vann) and +43.6% (Tola)** against the ~27% and ~38% he had accepted — and ruled that
  **the phone is not the current lens**: *"right now our only focus is how it looks on a computer/laptop
  screen, we can workout and optimize mobile screens later."* The number is therefore recorded rather than
  acted on. **This is a sequencing decision and not a licence to break a phone** — see the ruling in §1 and
  the caveat under it.
- ~~**`ROOM_CARD_BOXES` is a hand-derived minimum, not solved from `MEDIA`.**~~ **Done, 13–14 Aug 2026, as
  a side effect of the client's own composition ruling, not as a direct answer to this note.** The
  client's 13 Aug decision that every card is `beside` retired `ROOM_CARD_BOXES` and
  `ROOM_STACK.textReserve` outright rather than fixing them in place — the crop bound is now solved per
  card, at build/render time, from `roomCardAspect`'s worst-emitted-tier read of `MEDIA`
  (`RoomCard.tsx`'s `ROOM_PHOTO_KEEP`/`ROOM_PHOTO_MARGIN`), exactly the "solve for the limit" shape this
  note was asking for — see `docs/DECISIONS.md` §18's "per-card crop bound" subsection for the full
  derivation and the two Criticals a review found and fixed in it.
- ~~**THE ROOMS-CHAPTER DENSITY LINE IS BROKEN, AWAITING THE CLIENT (14 Aug 2026).**~~ **Resolved, same
  day.** `vann-rooms` and `tola-rooms` had measured 43.9%/49.4% and 44.3%/50.1%, over the image-sizing
  plan's own ceiling and, on their worst screen, over non-negotiable #8's general 45% ceiling too — the
  direct, measured cost of the client's own 13 Aug composition ruling (every room card `beside`,
  alternating) against his own 4 Aug density ceiling. The first of the spec's three named levers, the `xl`
  photo share, had been declared spent at 65% — the spec's own worked example, never actually swept to
  find its real ceiling. Swept upward (68/70/72/75/78, `lg` held 5 points below `xl`) and re-measured:
  75%/70% is the first value that clears the ceiling with real margin and still reads as a text column
  beside the photograph rather than a caption stuck to one (78% passed with more margin but was rejected
  on sight — a 4→5-line facts row breaking a word mid-wrap). Shipped: `lg:w-[70%] xl:w-[75%]`,
  `vann-rooms` **36.0%/43.2%**, `tola-rooms` **36.3%/43.5%**, both inside 45% worst.
  `check_card_stack.mjs` (9/9, both arms) and `check_image_resolution.mjs` (0 under-served) both re-pass.
  Full sweep table and the screenshot comparison: `docs/reviews/2026-08-13-image-sizing/README.md` §2.5;
  the retirement/solve context: `docs/DECISIONS.md` §18.
- **`vann-room-cottage-plain`'s copy line no longer matches its shipped photograph, deliberately left
  unfixed pending the client (14 Aug 2026).** Image-sizing Task 3's crop correction moved the room card's
  photograph to `left: 0` (`scripts/build_images.mjs`), which shows the bed, the framed print, the lamp
  and the glass doors onto the forest — and drops the cane sit-out and its chair, the source's two
  features being ~1740px apart in a 1931px frame with no 1184px window able to hold both. The card's own
  copy (`content/mahua-vann.ts`, `vann-room-cottage-plain`'s `line`) still opens "A private sit-out under
  cane..." — the feature the photograph no longer shows. This was a controller decision, not an oversight:
  the bed wins the crop because the card's one job is to sell the room, not one amenity in it, and the
  words were deliberately left alone because the sit-out is real (still named in the room's own `facts`
  array, "King bed, private sit-out") and the client reviews every line — a copy rewrite is his call, not
  a controller's to make unilaterally on an image trade-off. Compare `content/mahua-tola.ts`'s
  `tola-room-super-deluxe` line, which DID get a full re-read and rewrite the same day, because that
  room's crop change added a feature (the timber-beamed ceiling) back into frame rather than removing one
  the line depended on. Recorded here because the only prior record was
  `.superpowers/sdd/2026-08-13-image-sizing/task-3-report.md`, which `.gitignore` excludes and does not
  survive a clone; also recorded at the line itself, `content/mahua-vann.ts`'s comment above the `line`
  field. Options for the client, for when he is asked: accept the mismatch (the words are still true of
  the room, only not of this specific photograph); rewrite the line to lead with the bed instead; or
  re-open the crop trade if the sit-out matters enough to the sell to be worth losing the bed for it.
- Then Tripadvisor wiring, the SEO redirect map, Sanity.

---

## 5a. The density rig's sampling step — an open question about every #8 figure on this project

**Found 18 Aug 2026 while making the coverflow linear. Recorded, not acted on, because it is a question
about the instrument rather than about any one chapter.**

`scripts/measure_density.mjs` walks a chapter in **150px** steps. Two things surfaced on the same day:

1. **Re-sampling at a 50px step finds 3–7 points more empty on five chapters** — including `rooted`
   (44.5 → 47.3) and `guests` (43.8 → 48.6), neither of which that day's work touched. **Every
   non-negotiable #8 figure ever recorded on this project is a 150px-step figure**, so every one of them is
   an optimistic estimate of the chapter's true worst screen, by an unknown amount that is at least
   sometimes enough to change a pass into a fail.
2. **A chapter's figure moves when a chapter *above* it changes height by a non-multiple of 150.**
   `05 · The Rooms` went 39.6% → 46.5% worst with nothing in it altered, because `field-days` lost 72px and
   every downstream chapter is now sampled at a different phase. Proven rather than asserted: changing
   `COVERFLOW.screens` moved the document by 450px and 900px — both multiples of 150 — and moved **not one
   figure** below that chapter.

**The padding was deliberately not tuned to a multiple of 150 to make (2) go away.** Doing that would be
fitting the page to the instrument, which is the shape of defect this file exists to catalogue.

**What this does not mean.** It is not a reason to relitigate a chapter that passes, and it is not a reason
to lower the ceiling — CLAUDE.md's #8 already says never to do that. What it means is that a figure sitting
within a point or two of 45% is inside the instrument's own error, and **"it passes" and "it fails" are both
weaker claims than they look at that margin.** `field-days` at 40.4% and `lodges` at 48.6% are outside it;
`rooms` at 46.5% is not.

**Before acting on it, decide what the rig is for.** A smaller step is not obviously more correct: it costs
run time on every route, and a 900px window slid 50px at a time reports many nearly-identical screens, which
flatters nothing but does weight the *worst* statistic toward whatever the page's tallest run of cream
happens to be. The honest options are to keep 150 and record that every figure is an estimate, or to move to
a smaller step and **re-baseline every chapter on the same day**, so no two figures in `density.json` are
ever measured at different steps. Full working: `docs/reviews/2026-08-16-coverflow/linear.md` §5.2.

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
| **97%** | **4.55–4.60:1 (390px)** | **Clears with a sensible margin — the solved minimum, superseded 11 Aug** |

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

### What shipped: Variant A. The client chose the glass, 11 Aug 2026

Both variants were built, measured, screenshotted at 390 and 1440, and put to the client side by side —
because switching the label's colour is a real design choice, not a free win to take unilaterally on the
strength of better numbers. **He chose A**: *"Lets go ahead with Option A and if in case we need to change
it later we can do that."*

**Implementing A took one thing the comparison had not covered, and it would have shipped broken.** Variant
A was measured *before* the "Where next" hint had a probe at all (§2 #35) — so A's recorded figures covered
the region label and the place names, and said nothing about the panel's other goldText run. Dropping the
wash to 82% with that hint still gold would simply have moved the failure from one gold label to another,
at the same ~3.4:1, with the freshly-built probe now watching it. **A means every text run in the panel is
ink**, not just the regions. Re-measured on the shipped build, all three routes, all four widths:

| Route | `menu · place` (floor 3.0) | `menu · region` (floor 4.5) | `menu · hint` (floor 4.5) |
|---|---|---|---|
| `/` | 6.07–6.24:1 | 6.05–6.17:1 | 6.09–6.28:1 |
| `/mahua-vann` | 6.17–6.30:1 | 6.16–6.25:1 | 6.09–6.22:1 |
| `/mahua-tola` | 6.15–6.28:1 | 6.04–6.43:1 | 6.20–6.40:1 |

**Re-measured 11 Aug after the tiles were rebuilt** (side by side, half the panel each — §1's ruling of the
same day). The panel's geometry changed underneath these figures, so they were taken again rather than
carried over; they moved by hundredths, which is the point — the wash and the ink are what set them, not the
layout.

Gold keeps this panel's hairline rules and its focus ring — non-text, a 3:1 floor, and clear of it even when
gold *text* was failing. `GOLD_TEXT` in `check_contrast_over_photos.mjs` is now unused and deliberately
retained: it is the value to restore if gold text ever returns here.

**The 97% solved minimum is kept on record for exactly that case.** Nothing renders at it now. Gold text in
this panel and an 82% wash cannot both be true, and the CSS, the component and the rig each say so at the
site of the change, because the failure mode is somebody restoring one without the other.

A third alternative, considered and still rejected: darkening `goldText`
itself just for this context would also have cleared the floor without moving the wash at all, but it is a
hard-coded, one-off colour outside `lib/palette.ts` — the architecture rule this project holds everywhere
else — and it would make the region labels a different colour here than anywhere else they appear.
Reclassifying the label as WCAG "large text" (a 3.0:1 floor the original 82% would already clear) was also
not done: the label is 9.92–12px, nowhere near the 18px/14px-bold threshold, and lowering a floor to make a
number pass is the one thing CLAUDE.md says never to do again.

---

## 17. The rooms card stack — sticky's view-timeline, wrong twice in opposite directions

Client request, 11 Aug 2026: *"pile up, with recede"* — chosen over a plain pile-up and a peel-away deck —
for the `rooms` chapter on both property pages. Each room becomes a card that sticks below the header while
the next rises over it, and a covered card recedes (scales down, dims) so the deck reads as depth rather
than as stacked paper. Full design in
[`docs/superpowers/specs/2026-08-11-room-card-stack-design.md`](superpowers/specs/2026-08-11-room-card-stack-design.md);
what follows is what the design got wrong, twice, in opposite directions, and why both wrong turns are the
expensive part.

### Three constructions, measured in Chrome 151 over four cards

| construction | cards ever pinned | when a covered card dims |
|---|---|---|
| A — card inside a slot of the card's own height | 0 of 4 | while still fully visible, **0.58** — dims too early, because it never actually stays pinned: `position: sticky` is clamped to its containing block, and a slot exactly as tall as the card leaves zero slack |
| B — card as a direct child, `animation-timeline: view()` on the card itself | 3 of 4 | **never** — opacity **1.00 throughout** the whole time it is the card being read |
| **C — shipped: a non-sticky SIBLING slot, WITH real slack, naming the card's timeline via `timeline-scope`** | 3 of 4 | **0.77 when fully covered** — correctly, while still pinned |

### Two premises, and getting either one wrong shipped a broken page

The design's first draft (construction A) wrapped each card in a slot of exactly the card's own height,
reasoning that a sticky element cannot drive a scroll-linked animation off its own position and therefore
needs an external, non-sticky timeline source. Task 3 found two things wrong with that at once: mechanically,
a slot exactly as tall as the card leaves `position: sticky` zero slack, so the card renders exactly as
`static` — 0 of 4 ever pinned. And the reasoning behind the wrapper was also wrong: `animation-timeline:
view()` tracks an element's own **flow** position, not its stuck one, so a sticky element *can* drive its own
timeline. Both readings pointed the same way — delete the wrapper, attach `view()` straight to the card
(construction B) — and by the only check that existed at the time ("does the card ever recede"), it worked:
3 of 4 pinned, all four eventually dimmed. Shipped.

**The second premise was also wrong, in the opposite direction, and the shape of the failure is this
project's own catalogue entry (§2 #40): a check that confirms a mechanism runs, not that it runs *when it
needs to*.** Everything about construction B "worked" by that first check — cards pinned, recede fired —
except the recede only fired **after** a card had already scrolled out of view. A sticky element's own
`view()` timeline does track flow position, but a *stuck* element's flow position, relative to the viewport,
barely changes while it is actually stuck — that is the entire point of `position: sticky`. So its exit
progress barely advances until something dislodges it: the next card's arrival, right at the very end of its
stuck life, well past the point a visitor is still reading it. The wrapper's *premise* ("sticky can't drive
itself") was too strong, but discarding the wrapper entirely threw away the one thing it accidentally
supplied: a timeline source with real slack, so exit progress advances smoothly across the whole covered
span instead of jumping at its final instant.

**What shipped, construction C, is a third thing — not a reversion to A.** A non-sticky sibling
`<li class="room-slot">`, `aria-hidden`, contributing zero net height to the stack's own flow (an
equal-and-opposite `margin-bottom`, so a card's un-stuck position is unchanged from a stack with no slots in
it at all), sized to exactly the remaining slack — `(room-count − i − 1) × card-height` — and carrying a
unique `view-timeline-name` per card (`--room-slot-0`, `--room-slot-1`, …), published to the `<ol>` via
`timeline-scope` because `view-timeline-name` resolves by tree order and every card sharing one name would
all bind to the first slot in the list. The card itself reads that name, not `view()`. Cards remain direct
children of `.room-stack` — that structural fact from the first draft was correct all along, and it stayed
load-bearing for a second reason: `scripts/check_card_stack.mjs` selects `ol.room-stack > li.room-card`
directly and reads that exact element's geometry for every assertion, so wrapping the card itself in
anything would have made the rig measure the wrong box.

### Why the flag on the last card is a prop and an attribute, not `:last-child`

**Corrected 11 Aug 2026, fix wave (Finding 4): this section previously said the break showed for "the final
~250–350px of scroll" — measured false, along with the same claim in `app/globals.css`, `RoomCard.tsx` and
the spec's own §7, all four corrected together.** A card dims because something is covering it. Nothing
covers the last one. Without an exemption, a covered-card sweep with the exemption removed found the last
card at `opacity: 0.55` / `scale: 0.94` for nearly the *entire* time it was on screen, not a brief tail —
**35 of 36 on-screen samples at Vann@390, 37 of 38 at Tola@1440** — the already-dimmed deck visible through
the last card the whole time it was still the one being read. The real mechanism: the last card's own
`.room-slot` sibling is sized to `(room-count − i − 1) × card-height`, which is `0px` when `i = room-count −
1`, and a named view-timeline with a zero-length range resolves to 100% progress immediately — the recede's
end state applies from the first frame, not `view()` "tracking flow position" past the point the card is
covered (that language described construction B, which this design does not ship — see above).

`data-room-card-last`, written from an `isLast` prop on `RoomCardStack` (the one place that knows the room
count), turns `animation: none` on for exactly that card. Not `:last-child`: the `<ol>`'s children today are
not one-per-room — each room contributes an invisible `.room-slot` sibling immediately before its
`.room-card` (§4 above), so the list is `slot, card, slot, card, …`, and only because tree order happens to
end on a card does `:last-child` currently pick out the right element at all. A selector standing in for
that coincidence stops matching the day the markup's shape changes, silently, in the tail of the page where
nobody looks.

### The bar reserve, and reduced motion — restated because both are load-bearing

`PropertyBar` returns `null` over the hero, the invitation and the footer, so its own measured height flips
between 0 and 69px as the visitor scrolls — and card height is computed from it, so a live value would
resize every card in the chapter mid-read. `--property-bar-reserve: 72px` is a constant instead;
`check_card_stack.mjs` assertion 3 measures the real bar at all four widths and fails if it ever grows past
the reserve, so the drift a constant invites is caught rather than shipped.

Reduced motion keeps the stack and drops only the recede — deliberately unlike `StickyScene`, which
collapses entirely. The two are not alike: `StickyScene` reserves *empty* scroll that only means anything
once something moves through it, so with motion off it is screens of nothing. A card stack's scroll is the
visitor's own movement, 1:1, with nothing animating at them; what goes is the one part not under their hand.

### The phone as the binding case, a first for this project

Every measured dial in `ROOM_STACK` is spent against the *slack* between the sticky header and the booking
bar — **706px on a 390×844 phone**, the tightest of the four review widths, against 724–904px on the other
three. Every other signature effect on this page (the pin, the lantern, the collage) was designed against
1440 first and checked on a phone after. This one had to be designed against the phone first, because it is
the binding case.

### The photographs the old design cropped, and the bound that was checked in only one dimension

Two of the seven room photographs were being cropped ~35% of their width in the design this replaces (both
Deluxes, 2.29:1 forced into a 3:2 box); one, `tola-room-family`, is portrait (0.67:1) and was losing about
half its height. The new rule is a bound, not a hand-picked ratio: no photograph may lose more than 25% of
its own width, at any of the four review widths — checked by `check_card_stack.mjs` assertion 6, comparing
the loaded `<img>`'s natural aspect against its rendered box. Losing height is unbounded by design: every
documented crop constraint on this page is about width, and a room interior tolerates a trimmed ceiling far
better than a trimmed wall.

**That last sentence turned out to be only half the story, twice, on two unrelated mechanisms — §2 #41 and
#42.**

- **`tola-room-family`, the one portrait photograph, hit a flex quirk the other six never triggered.** A
  flex item's default `min-height: auto` resolves to the *larger* of any explicit minimum and an automatic,
  content-based one; for a box whose only child is a replaced element (the `<img>`, sized by its own real
  `width`/`height` attributes), that automatic minimum is derived from the image's *own* aspect, not the
  wrapper's declared `aspect-ratio`. Six of seven room photographs are wider than their target box, so the
  content-derived minimum never binds. The seventh is narrower — it is the one that needed the `beside`
  layout at all — and the content-derived minimum won, silently overriding `aspect-ratio: 1.25`: the photo
  wrapper rendered 513px at 390px width where 273.6 was intended, and the words, following it in flow,
  landed under the card's own `overflow: hidden`. One class, `min-h-0`, fixed it.
- **`ROOM_CARD_BOXES.stacked` (`aspect-ratio: 2.0`) was solved to keep width-crop inside the 25% bound, and
  never checked against the card's own solved height.** At 1440/1920 the card is wide enough that a 2:1
  photo band is *taller* than the card itself: measured live and unreceded, five stacked cards' photo
  wrappers rendered 3–17px taller than their own cards, and the words fell entirely below the visible box.
  **Not four cards but five, then six.** The diagnostic script built to confirm the fix
  (`_sweep_text_legibility.mjs`, itself built in an earlier fix round) reported Tola's Camping Hut as
  legible — 32 and 41 samples, indistinguishable from a healthy card — because its own criterion was "the
  text rect sits inside `[0, innerHeight − barHeight]`," true by coincidence: the card's `overflow: hidden`
  clips everything below its own edge, and the words rect never crosses back inside that clip once the photo
  overflows. **The sweep checked the viewport; it never checked the card's own box — the exact defect shape
  the fix's own new rig assertion exists to close, reproduced in the tool built to find it.** Fixed with a
  height ceiling on the stacked photo wrapper (`ROOM_STACK.textReserve`, `app/globals.css`) plus a paired
  `lg:`-only tightening of the words block's own padding (`RoomCard.tsx`) — the ceiling alone recovered
  legibility but pushed both chapters' worst screen over the 45% density ceiling (below), and the padding
  trim is what closed that gap without loosening the ceiling.

**The rig's own gap, closed as assertion 8 (§2 #43):** `check_card_stack.mjs`'s first seven assertions all
measured a card's outer box — position, clipping against the header/bar, deck visibility, recede magnitude,
photograph crop. None of them ever looked at the words. A card could pass all seven while its text was
entirely invisible, exactly the state five (then six) cards were shipping in. Assertion 8 sweeps every
card's text block at 20px steps and requires a scroll position where it sits simultaneously inside
`[header, bar]`, inside the card's *own* clip box, and at opacity ≥0.98 — the middle clause is the half the
viewport-only check above lacked. Watched failing on the reverted build: ten failures, naming exactly the
five affected cards at exactly the two affected widths.

### The density cost of fixing it, and why the mid-plan figure is not a target

Fixing the clip gives back to cream and type exactly the area an overflowing, unreadable photograph had been
claiming as 100% imagery — `measure_density.mjs` hit-tests what is painted, and a photograph clipping past
its own card's edge painted every pixel down to that edge regardless of whether a visitor could read
anything. So the intermediate figures recorded mid-plan — `vann-rooms` 24.8% mean, `tola-rooms` 27.4%
mean — were partly the defect's own side effect, not a real density win, and it is the same lesson this
project already learned once from the forest tint (§15): a number that improved because something was
broken is worth a warning, not a celebration. The honest figures, on the fixed build:

| chapter | before this plan (`RoomShowcase`) | mid-plan, five/six cards illegible | shipped |
|---|---|---|---|
| `vann-rooms` mean / worst | 40.1% mean | 24.8% / 42.1% | **31.5% / 42.1%** |
| `tola-rooms` mean / worst | 39.0% mean | 27.4% / 42.4% | **33.8% / 44.3%** |

Both stay inside the 45% ceiling — `tola-rooms` by 0.7 points. Neither chapter's mean returns to its
mid-plan figure, and per the finding above, it structurally cannot: that figure belonged to a page with
illegible cards.

### The mobile length, relayed 12 Aug and deferred by the client

The spec's §9 projected Vann's `rooms` chapter growing ~27% and Tola's ~38% on a phone, and the client
accepted those numbers on 11 Aug. Measured on the shipped build (`#vann-rooms` / `#tola-rooms`'s own
`getBoundingClientRect().height` at 390×844): **Vann +35.9% (1,738px → 2,362px), Tola +43.6% (2,035px →
2,922px)** — about 9 and 5.6 points more than what he agreed to. The direction is right and desktop shrank
as projected (Vann 2,437px → 2,371px, Tola 3,266px → 2,984px), but the specific mobile figure he signed off
on undersells what shipped. Corrected in the spec's own §9.

**Relayed 12 Aug, and he deferred it**: *"right now our only focus is how it looks on a computer/laptop
screen, we can workout and optimize mobile screens later."* So the figure stands as measured and unactioned,
and the lever if it is ever picked up is a shorter card at that width — `ROOM_STACK.heightMax` and a smaller
`deckStep` below `md` — not dropping the effect. **What is deferred is optimising the phone, not measuring
it.** Every rig here still runs at 390, and it must: the two worst defects this plan produced were both
found at that width, one of them by a human reading a screenshot. Removing the phone from the instruments
would remove the thing that has been catching the errors.

## 18. The room gallery's arrows nested instead of replacing — `popover` swapped for `:target`, 14 Aug 2026

Image-sizing Task 7 was scoped as pure verification: prove, in a browser, the one claim Task 6's own code
review had flagged as reasoned rather than measured (does the enlarged photograph really stay deferred until
a visitor opens it). Building the rig to prove that one thing found two more, unasked, both stated as fact —
not measured — in the original spec and in `RoomCardStack.tsx`'s own code comment.

### What the rig found, watching its own first assertion pass

The deferred-image claim held, once the rig was corrected for a real, benign confound: every gallery
`<Photo>` shares its media id with its own room card's `<Photo>` — the enlarged view is the same photograph,
by design — so at some viewports the two components' different `sizes` strings resolve to the identical
candidate file, and Chromium serves the closed panel's `naturalWidth` from its own in-memory decoded-image
cache with zero new network requests. A blanket `naturalWidth === 0` cannot tell that apart from a genuine
early fetch; the corrected check additionally requires the shared file to be byte-identical to the card's own
and requested exactly once across the page.

While proving that, the rig's own click-through of the arrows surfaced something the spec never checked:
clicking "next" opened the neighbouring panel **without** closing the one still open. Both panels stayed
`:popover-open` simultaneously. Confirmed before trusting it, with a two-element fixture outside this
codebase — two sibling `[popover=auto]` divs; a button *inside* the first, targeting the second, nests (both
end up open); the identical markup with the invoking button moved *outside* both popovers replaces cleanly.
**Mechanism:** the HTML Popover API's "topmost popover ancestor" rule treats a popover invoked from a button
that is itself a descendant of an *already open* popover as nested inside it rather than a replacement — the
same rule that lets a menu button open a submenu without closing its parent, working exactly as specified
against markup that never asked for a submenu. `RoomCardStack.tsx`'s arrows have to live inside their own
panel to sit beside its own figure, so every "next"/"previous" click was, by construction, an invoker inside
an open popover targeting a sibling.

**A second, independent finding from the same pass: the panel was never actually centred.**
`getComputedStyle(panel).margin` read `"0px"` at every shape tried; `getBoundingClientRect()` showed
`{left: 0, top: 0}` — pinned to the viewport's corner. Tailwind's own preflight (`* { margin: 0 }`) is an
author-origin rule, and author origin always wins over the popover UA stylesheet's own `margin: auto`
centring, regardless of selector specificity. At 390×844 the panel happened to be short enough that a probe
point chosen assuming centring still landed outside it by luck; at 1440×900 the same point landed inside the
panel, which is what actually exposed the bug — a fixed test point can pass or fail for a reason that has
nothing to do with the thing it means to test, the same lesson §2 #45 already paid for once.

Both were **the plan's own defect, not the implementer's**: the spec (`2026-08-13-image-sizing-design.md`
§3) states outright, *"`popover="auto"` guarantees at most one open panel — opening the neighbour closes the
current one, which *is* the navigation"* and *"the panel's `max-width` ... with `margin: auto` centring (the
UA's own popover default) always leaves at least 4vw clear."* Both sentences were written from how the
mechanism is *supposed* to work, not from a browser. Task 6's code carried the same premise into its own
comment. Read together with §2's own catalogue, this is the forty-ninth and fiftieth instances of the one
defect shape this whole document exists to name: a claim about a mechanism, stated with confidence, never
run.

### The fix: CSS `:target`, which cannot nest by construction

Rather than patch the popover version (harden the invoker, add a script listener to force-close siblings —
both reintroduce the JavaScript this whole gallery was built to avoid), the mechanism changed outright.
`location.hash` is one string, so at most one element in a document can ever match `:target` — there is no
"nested" state for it to fall into, independent of where the link that set it lives in the DOM. Confirmed
live, both routes, both widths, before trusting it: clicking "next" from an open panel now leaves *exactly*
one `.room-gallery` with a computed `display` other than `none` at every step of a full wraparound walk (`n`
clicks returns to panel 0; "previous" from panel 0 wraps to the last panel) — checked by rendered visibility,
deliberately, not by `:target` itself, because `:target`'s own "exactly one" guarantee is unfalsifiable by
construction and could never have caught a broken CSS author rule the way it caught the popover's nesting.
Centring moved to the panel's own box, `transform: translate(-50%, -50%)`, which never reads `margin` at all
— the same preflight reset cannot reach it a second time.

**What the swap costs — TWO separate things, not one, and both measured rather than only described.**

(1) `:target` has no Escape key. Popover's Esc-to-close was free UA behaviour; a keyboard binding for a pure
CSS/URL mechanism would need a `keydown` listener, which this construction deliberately still has none of.
`scripts/check_room_gallery.mjs`'s own "Esc closes" assertion is retired, not silently deleted — replaced
with one that proves the close control and the real, now-addressable backdrop link each independently work.
A visitor without a mouse can still reach either by Tab then **Enter only** — an `<a href>` activates on
Enter, not Space (Space scrolls the page); an earlier draft of this section said "Enter/Space" and that was
wrong, corrected the same review pass that caught it. What is gone is closing from anywhere with one
keypress.

(2) **Closing does not return focus — a real regression, found on review, not by the original fix.** The
popover version's hide algorithm restored focus to the invoker, free UA behaviour; `:target` has nothing
equivalent. Closing navigates to `ROOM_GALLERY_CLOSED`, a fragment matching no element, so no HTML "focusing
steps" run at all, and the previously-focused link — now inside a `display: none` subtree — is dropped by
the browser to `<body>`. A keyboard visitor who opens the third room and closes it does not land back on
that room's own trigger; they restart Tab from the top of the page. Not fixed (the fix needs a listener this
construction deliberately has none of) but no longer only a claim: `check_room_gallery.mjs` reads
`document.activeElement` after the close control fires, the same way it already did after opening, and
`RoomCardStack.tsx`'s own comment records it beside the Esc trade rather than only here.

**A third cost in the same family, found on the whole-plan review (14 Aug 2026) and also not fixed: no
focus containment.** Tab from the panel's own Close link walks into the page behind the backdrop;
Shift+Tab from the panel's first focusable element walks back into the room-card triggers underneath
it. This is not a new gap the `:target` swap introduced on its own — the popover version never had a
trap either, top-layer stacking just made the reachable surface smaller — but it is real, and the
brief that commissioned this review classed it non-blocking rather than something to fix here. A real
trap needs a `keydown` listener cycling focus at the panel's own edges, which is exactly the script this
whole construction was built to avoid, so closing it would mean reopening the same trade the Esc-key and
focus-restore costs above already accepted. The honest description is a non-modal dialog with an escape
hatch either direction, which is correctly what this is — **do not add `aria-modal`/`role="dialog"` to
paper over this entry**; either would assert a containment guarantee the markup does not provide, making
the accessibility tree lie rather than fixing the gap it describes. Recorded in three places, matching
the pattern §18 already uses for the Esc and focus-restore costs: `RoomCardStack.tsx`'s own comment,
`docs/reviews/2026-08-13-image-sizing/gallery.json`'s `knownDefects` (`no-focus-containment`), and here.

**A genuine, arguably-a-feature side effect — measured three deep, not extrapolated from one Back press.**
Every fragment navigation is a real history entry. The first draft of this section claimed "a visitor who
has looked at three rooms can back out of them one at a time" from a single measured step — exactly the
unread-confidence shape §2 exists to catalogue, caught on the SAME review that found the two z-index
mistakes below. Corrected by actually opening three rooms in sequence and pressing Back three times, on both
routes: each press correctly returns to the previous room, and the fourth would land on the page with
nothing open. `check_room_gallery.mjs`'s own `backButtonDeep`.

**Also newly, genuinely provable: the mechanism needs no script at all**, unlike the popover version, whose
invoker attributes still depended on native browser support even though this codebase never wired a
listener to them. `check_room_gallery.mjs` now opens and closes a panel with `javaScriptEnabled: false` and
asserts it worked, not merely that nothing broke — the first time this gallery's "zero JavaScript" claim was
checked as a positive capability rather than only as an absence of errors.

### The z-index was wrong twice over, and the second time collided with the welcome screen

A code-review pass on the fix above (14 Aug 2026) came back with two more findings, both in the same CSS
comment, both instances of §2's own defect shape — **§2 #51**, and both corrected here rather than left as
a private fix, because the wrong version had already been committed once.

**The comment claimed `[data-site-header]` was `z-index: 90`. It never was.** The header carries `z-40` as
a Tailwind class (`StickyHeader.tsx`), and `[data-site-header]`'s own rules in `app/globals.css` set no
z-index at all. The one `z-index: 90` in the whole file belongs to `[data-welcome]` — the welcome screen,
opaque cream, `fixed inset-0`, covering the entire viewport for its ~2.1s hold (`WELCOME.hold` +
`WELCOME.fade`, `lib/motion.ts`). A comment written specifically to avoid citing an unread value cited one
anyway, in the same fix round that names the failure mode.

**And the gallery's own `z-index: 100` — chosen to sit "above" that misremembered 90 — actually sat above
the REAL 90, the welcome screen itself.** This was not cosmetic: `:target` applies on first paint, needing
no load event and no script, so a page requested with a room's own fragment already in the URL — a reload
with a panel open, a bookmarked or copied link, the browser's own Back into a page that had one open (every
open is now a real history entry, per the paragraph above) — opens that panel from the very first frame,
while the welcome screen is still holding. At `z-index: 100`, the gallery would have painted OVER the
welcome intro on every one of those paths, all of them newly reachable because of the very fix this section
describes.

**Fixed by reading every stacked value in the file instead of trusting the one already written down**: header
and booking bar `z-40`, site menu and grain `z-50`, welcome `z-90` — confirmed live with
`getComputedStyle`, not assumed from the source. `.room-gallery` moved to `z-index: 60`, deliberately above
every persistent-chrome value and deliberately below the welcome's 90. Deep-link-opens is kept as a real,
working capability rather than suppressed: the opaque welcome screen now correctly covers the panel for the
whole hold, and the panel is already sitting there, correctly open, the instant the welcome clears.

**Proven, not merely reasoned about — and the proof itself needed a second fix.** `check_room_gallery.mjs`'s
`checkWelcomeCollision` loads a route with a room fragment already in the URL and samples what is actually
painted partway through the welcome's hold. Its first version used `document.elementFromPoint` at the
viewport's centre and reported the welcome screen was NOT on top — on a build where it demonstrably was
(z-index 90 > 60). Cause: `WelcomeScreen` is deliberately `pointer-events-none` (a curtain a click should
pass through), and `elementFromPoint` — like `elementsFromPoint` — skips elements with `pointer-events: none`
when hit-testing, **the exact mechanism §2 #21 already catalogued for `measure_density.mjs` and the hanging
lantern, tripped a second time by this rig's own first draft of its own review-response fix.** Corrected the
same way #21 was: the welcome element is switched hit-testable for the instant of the sample, then restored.
Confirmed both ways after the fix: passes on the current (60) build at all four route/width combinations,
and — reverting `z-index` to the old 100 as a standalone check — fails cleanly on both its own sub-checks
(the numeric ordering and the paint hit-test) at all four, then passes again once reverted.

### Two more real defects the same review pass measured and fixed

**The panel's box overflowed horizontally at the narrowest shape — Minor 6, real but narrower than the
arithmetic alone suggested.** The box capped at `min(92vw, 96rem)` while the image inside is `max-w-[88vw]`
plus the box's own `3rem` of horizontal padding; arithmetic alone predicts overflow anywhere below ~1200px
of viewport width. Measured instead of trusted: `box.scrollWidth − box.clientWidth` was exactly `10px` at
390×844, on every room, both routes — and `0px` at 768×1024 and 1440×900, narrower than the arithmetic's own
prediction (a `<Photo>`'s real sizing has more give across most rooms than either bare cap alone suggests).
Fixed by widening the box's own cap to `min(calc(88vw + 3rem), 96rem)`.

**A third review pass (14 Aug 2026) found the fix's own write-up repeating the exact mistake it was
correcting.** This section originally said the new cap is "provably never smaller than the old `92vw` below
1200px (equal to it above)" — written without solving the second half, and false: the two formulas are
equal only AT 1200px (both 1104px) and again from `w ≈ 1690.9px` upward, where both saturate at the shared
`96rem` (1536px) ceiling. **Between roughly 1200px and 1690.9px the new cap is strictly SMALLER than the
old one** — at 1500px, old `0.92 × 1500 = 1380px` against new `0.88 × 1500 + 48 = 1368px`, 12px narrower;
the gap peaks around 1670px at roughly 19px. Every fixed-shape rig on this project samples
390/768/1440/1920 — never inside that band — and the `0px` reading at 1440×900 is silent about it for an
unrelated reason: at 1440 the photograph is height-constrained by its own `max-h-[78svh]` before its width
ever reaches 88vw, so neither cap, old or new, actually binds there. A true measurement that happened to
prove nothing about which formula is wider, cited as though it did.

**Corrected by measuring inside the band, not by restating the claim a second time (14 Aug 2026, third
pass).** A new check, `checkBoxOverflowBand`, sampled 1500×900 — the coordinator's own worked example — for
every room on both routes: `0px` of overflow, all seven rooms. Read at the time as "a measured absence of a
defect at the one sampled point inside the ~490px band, not a proof that none exists across the whole
range" — true as far as it went, but under-specified in exactly the shape `docs/DECISIONS.md`'s own
[[mahua-measure-the-right-question]] lesson warns about: it read like a check that could, in principle, have
caught something, when actually sampled a point that COULD NOT FAIL.

**A fourth pass (image-sizing Task 7, narrow follow-up) found the check could never have failed at any
height, and deleted it rather than widen the sample.** `checkBoxOverflowBand`'s own hardcoded `900` height
was the first, surface symptom, and the obvious fix looked like "sample a taller height." Deriving that
height honestly — `78svh × aspect ≥ 88vw`, solved for `h` — predicts the cap should start binding above
roughly 1128px of height at 1500px width. It does not, at any height: the gallery `<Photo>`'s own `sizes`
(`RoomCardStack.tsx`'s `GALLERY_SIZES`, `"(min-width: 768px) 80vw, calc(100vw - 32px)"`) independently caps
the img's effective rendered width at exactly its own `sizes`-resolved value for any viewport ≥768px wide —
a `srcset` with `w` descriptors makes the browser report the img's DENSITY-CORRECTED intrinsic width (what
`width:auto` layout, and `naturalWidth`, actually read) as the `sizes` value, not the real fetched file's
pixel count. Confirmed against `sharp`'s own read of the on-disk AVIF bytes, which stayed fixed while the
browser's reported "natural" width moved with the viewport — the tell that something other than the file
itself was setting that number. `80vw` is strictly narrower than the same `<img>`'s own `max-w-[88vw]` for
every viewport ≥768px, so `max-w-[88vw]` — and the box's cap, built to hold exactly an 88vw-wide image — is
dead code in that whole regime: the photo can never reach 88vw for the cap to need to hold, at any height.

Verified empirically, not only algebraically: sweeping height 400→1400px at 1250/1440/1500px width left
every landscape room's rendered width flat at its own `sizes`-implied 80vw, never climbing toward 88vw no
matter how tall the sample; sweeping width 400→1200px at a height chosen to rule out `max-h-[78svh]` ever
binding found `0px` overflow throughout, both routes, all seven rooms — including 700–767px, where `sizes`
genuinely does exceed 88vw (the regime the original Minor 6 fix covers, still correctly tested at 390×844 by
`assertion2.boxOverflow`, unaffected by any of this).

**The corrected framing is not "we only sampled one width in the band" — it is "no height at any width in
this band can ever make the cap bind."** `checkBoxOverflowBand` was deleted rather than kept as a
now-provably-permanent no-op. `app/globals.css`'s own comment on `.room-gallery-box` carries the full
derivation; `scripts/check_room_gallery.mjs` carries the same reasoning where the deleted function used to
live, plus the corrected `boxOverflow` summary field.

**A genuinely different, reachable overflow existed WIDER than this band — FIXED, image-sizing Task 8,
14 Aug 2026 (was: deliberately left unfixed and unwired from any check, flagged rather than hidden).** Past
≈1858px of viewport width, paired with a viewport taller than a plain 16:9/16:10 monitor's own ratio (a
browser window snapped to half of a 4K or ultrawide display; a portrait-oriented external monitor — both
real, neither exotic), the box's own cap SATURATES at `96rem` (1536px, ~1690.9px of viewport width) and
stops growing, while the gallery `<Photo>`'s own `max-width` had no matching ceiling — a bare `max-w-[88vw]`,
unbounded — so past that point the two diverged and the image pushed past its own box. Measured on the
pre-fix, already-shipped build: 26px of overflow at 1920×1500, 90px at 2000×1500, 250px at 2200×1600,
~480px at 2560×1700, ~713px at 3000×1900 — all landscape rooms, both routes, growing without bound as the
viewport widened further. This is a different mechanism from the ~1200–1690.9px story above (not an
old-vs-new cap-formula comparison — the shipped cap had always behaved this way).

**The fix: the image's own CSS `max-width` and the box's own inner width, made the identical formula, by
construction, rather than fixed at a value chosen to clear the samples measured.** The box's inner (content)
width is its own outer cap minus its `3rem` of horizontal padding: `min(88vw + 3rem, 96rem) − 3rem =
min(88vw, 96rem − 3rem) = min(88vw, 93rem)`. `RoomCardStack.tsx`'s gallery `<Photo className>` changed from
`max-w-[88vw]` to `max-w-[min(88vw,93rem)]` — solved, not assumed, for both regimes: below ~1690.9px
(`93rem ÷ 0.88` = `1690.9px`), neither side has saturated and the two formulas are both `88vw`, exactly
equal; above it, both have saturated and the two are both `93rem`, exactly equal again. The two bounds are
therefore identical at every viewport width, not merely "never smaller" — the image cannot exceed the box's
inner width again regardless of how the viewport is shaped, the same discipline CLAUDE.md's own "the one to
copy" (`build_forest_overlay.mjs`) uses for a different problem: solve for the bound, don't hand-pick a
number under it.

`GALLERY_SIZES`'s own `80vw` term was deliberately left unchanged — a considered choice, stated rather than
silently decided. It governs which FILE `srcset` selects (via the density-corrected "intrinsic" size the
browser reports), not the rendered layout width; the fixed CSS `max-width` above is a hard layout constraint
that always wins over what `sizes` implies is wanted, so the image's actual on-screen width can no longer
exceed `min(88vw,93rem)` regardless of what `GALLERY_SIZES` says. `ui/Photo.tsx`'s own comment states which
way a `sizes` mismatch is safe to round — over-stating a box costs a tier of bytes at worst, under-stating it
ships a visibly soft photograph — and `80vw` already rounds down relative to the new cap, the conservative
direction.

Verified in a browser, both directions, not merely computed: `scripts/check_room_gallery.mjs`'s new
`checkWideOverflow` opened every room, both routes, at 1920×1500 and 2400×1800 (the shape the defect was
originally measured at, and one wider/taller case past it) against the pre-fix build FIRST — the exact
figures above reproduced live (26px at 1920×1500, growing to 410px at 2400×1800, on every landscape room;
the one portrait room, `tola-rooms-3`, read 0px throughout, both before and after, since its own height
constraint binds before either width cap does) — then again after the fix, reading 0px at every room, both
shapes, both routes. Recorded verbatim in `docs/reviews/2026-08-13-image-sizing/gallery.json`'s own
`watchedFailing` field (`f-wide-viewport-overflow-prefix`) and `wideOverflow` field (the clean, post-fix
readings), not only in this paragraph.

**No new `watchedFailing` arm accompanies `checkBoxOverflowBand`'s own deletion specifically** (a separate
question from the wide-viewport fix just above, which does have one — `f-wide-viewport-overflow-prefix`,
cited above) — deletion, not repair, is the outcome the task's own brief calls for once "no reachable
viewport can make the cap bind" is genuinely established for that band, and there is nothing left in the
rig to sabotage-and-revert for a check that no longer exists.

**The scroll-jump check had never been watched failing.** Every clean run reported `window.scrollY`
unmoved, which is exactly what a correctly-fixed build should report and indistinguishable, on its own, from
a check that could never report anything else. Fixed by adding a fifth sabotage arm — `position: fixed`
dropped from `.room-gallery` — which produced real, large jumps (~2,200–2,700px) on every route and width:
without fixed positioning the panel flows into the normal document at its point in the DOM, and `:target`'s
own "scroll the indicated part into view" step must move the page to reach it, exactly the behaviour fixed
positioning exists to avoid.

### The evidence, and where it actually lives

**Every one of the five sabotage arms above — plus the two supplementary ones (the old `z-index: 100`, and
the `.room-gallery-SABOTAGE` selector typo that caught a real bug in `check_image_resolution.mjs`, below) —
is recorded in `docs/reviews/2026-08-13-image-sizing/gallery.json`'s own `watchedFailing` field**: what was
sabotaged, which assertions fell, and the actual failing output quoted verbatim. This task's own prose
report (`.superpowers/sdd/2026-08-13-image-sizing/task-7-report.md`) has the full narrative, but
`.superpowers/` is git-ignored — the JSON this rig writes on every run is the one copy of this evidence that
survives a clone, which is why it carries the primary record now rather than a pointer to a path that does
not.

### A silent-failure bug in the resolution rig's own gallery-opening code, found by the same review

`check_image_resolution.mjs`'s gallery-opening loop (added earlier the same day, to keep counting the
enlarged photographs after the mechanism swap) had two gaps of exactly the shape its own 35-line comment
describes for the menu (§2 #39): an empty `galleryPanelIds` would silently iterate zero times and report
fewer images with exit 0, and a panel whose image never finished loading was swallowed by a bare
`.catch(() => {})` and then dropped a second time by the shared `report` helper's own `if (needed === 0)
continue`. Fixed with a per-route expected-panel-count table and a recorded failure (not a silent skip) for
either gap — then watched failing for real: a deliberately typo'd selector (`.room-gallery-SABOTAGE`)
produced `TypeError: URL is not a constructor` on the FIRST attempt, because the new count-check's own `new
URL(URL).pathname` collided with this module's pre-existing `const URL = flag("url", ...)`, which shadows
the global constructor. Fixed with `new globalThis.URL(URL)`, confirmed to correctly report "expected 3
.room-gallery panels, found 0" at every viewport once the shadowing bug itself was out of the way, and
confirmed clean (21 images, unchanged) once the selector typo was reverted.

### The 13 Aug rulings this whole plan was built on, verbatim

Three decisions, put to the client on 13 Aug 2026, all now his rulings — the ones Tasks 1–7 were scoped
against:

1. **Boards reflow.** He asked first whether any image would be removed (no) and whether his own 1440+
   view would change (no). With both answered: *"Yes — go ahead."* This is Task 1/2 — the plate board's
   three-column tier now begins at `xl` (1280px), not `lg` (1024px).
2. **Crop the room photographs from the files already on hand, softness accepted.** *"You can crop and
   zoom into them to fit their half and if they still look blurry on large screen I'll let you [know] and
   we can fix it then but for now I feel that it'll not be an issue."* Told plainly that three sources
   (both Deluxes, the Tola Suite — 1163px web exports) would serve soft once cropped and enlarged; his own
   words are the accepted-risk record. Measured 14 Aug: those three serve at **0.60–0.67** of ideal
   resolution at 1920px in the shipped `beside` composition (softer than the spec's own worked 1.11×/1.28×
   estimate, because the composition's `xl:65%` share draws a wider box than that estimate assumed) —
   still correctly bucketed by `check_image_resolution.mjs` as *at the library's ceiling*, not
   *under-served*, which is the failure mode that would actually need the exemption list the spec
   anticipated. None was needed.
3. **Gallery: expand plus next/previous arrows, zero JavaScript, page scrolls behind it.** Built first on
   the HTML Popover API (§18 above, this same section), found to nest rather than replace, rebuilt on CSS
   `:target` the same day. The zero-JavaScript promise held through the rebuild: `check_room_gallery.mjs`
   now proves it as a positive capability (opens and closes with `javaScriptEnabled: false`), not merely as
   an absence of errors.

### The retirement of aspect-derived layout, and that §17's stacked machinery is gone with it

Before 13 Aug, a room card's composition (`stacked` vs `beside`) was **derived** from its photograph's own
aspect ratio (`roomCardLayout`, `ROOM_CARD_ASPECT_THRESHOLD`, §17's own subject) — a photograph at or above
1.9:1 got `stacked`, below it `beside`. The client's 13 Aug ruling supersedes the derivation outright: every
card is `beside` now, by his own choice, not by measurement of the photograph. `lib/room-card.ts` lost the
whole derivation (`RoomCardLayout`, `ROOM_CARD_ASPECT_THRESHOLD`, `roomCardLayout`) and kept only
`roomCardAspect`, which the solved crop bound (below) still needs. **Gone with it, because the mechanism it
existed for no longer ships:** `ROOM_STACK.textReserve` (the ~65-line comment and the constant both, from
`lib/motion.ts`), the `.room-card[data-card-layout="stacked"] > :first-child` height ceiling in
`app/globals.css`, the `lg:gap-2 lg:py-4` padding trim that was paired with it, and
`lib/room-card.test.ts`'s threshold-clearance test. **A future session reading §17 for "how the card stack
works" needs this paragraph first** — §17's own three-construction history (the sticky `view()` timeline
freeze, the non-sticky sibling slot) is still exactly how the stack *pins and recedes*, unchanged by any of
this; only the *stacked* composition's own machinery, which sat on top of that pinning mechanism, is gone.
`ROOM_CARD_BOXES` (the two-layout constant pair) is retired the same way, replaced by the per-card solve
below.

### The per-card crop bound, solved rather than hand-picked

The 25%-width-crop rule (`check_card_stack.mjs` assertion 6) used to be a hand-picked constant per layout
(`ROOM_CARD_BOXES.stacked`/`.beside`). It is now **solved per photograph**: `--room-photo-aspect` is set
inline per card as `(ROOM_PHOTO_KEEP + ROOM_PHOTO_MARGIN) × roomCardAspect(mediaId)` —
`roomCardAspect` reading the *worst-case* aspect across every emitted tier a photograph has, not only its
canonical (largest) one, because `check_card_stack.mjs` measures whichever tier the browser actually
loaded and a photograph's tiers do not all share exactly the same ratio (each is independently rounded to a
whole pixel by `build_images.mjs`). Two Criticals were found and fixed in this solve, both worked in full
in `RoomCard.tsx`'s own comments and not repeated here: solving against the canonical tier alone let a
narrower, independently-rounded tier the browser can actually serve push the real crop to 25.08% — over
the ceiling, zero margin; and a *separate* gap survives even the worst-tier fix, not in the CSS but in the
rig's own measuring instrument (`img.naturalWidth`/`naturalHeight` reports a `srcset` candidate's
*density-corrected* size, each dimension independently rounded to an integer afterward — not the file's
true aspect). `ROOM_PHOTO_MARGIN` (`0.01`) absorbs that second gap with roughly a 29× safety factor,
re-derived and corrected twice over — an earlier draft of the same comment claimed ~1,400× from a
mechanism (`LayoutUnit` rounding) that does not reproduce against the shipped geometry; the real
mechanism, the real sign, and the real safety factor are all in `ROOM_PHOTO_MARGIN`'s own comment,
corrected in place rather than left to mislead the next reader. Worst crop measured across the whole
14 Aug sweep: **24.034%** (Tola's Suite at 1280px), comfortably inside the 25% ceiling.

### The plate floor rule, and its one exemption

**A board may not hold a column count that renders its plates below 85% of their 1440-reference width,
unless it is already at its minimum column count** — Task 1's rule, closing the client's own 12 Aug
report that photographs rendered up to 230% wider than their true shape at some widths (a *different*,
now-fixed defect; §2 #44–45) and, separately, that plates simply shrank too far between 1024 and 1279px.
`forest`'s three-column tier now begins at `xl` (1280px); `details` (four columns) and `rooms` (two
columns, already minimum) are untouched — `details` never fell below 87% of reference and `rooms` cannot
reflow further without becoming a different composition. **The one exemption**: a board already at its
minimum column count (`rooms`, landscape-majority, minimum 2) is held to a lower floor, 65% rather than
85%, because its own measured worst (444/652 = 68%, at 1024px) is what the client looked at and accepted
on 12 Aug rather than a number invented for this rule — `check_plates.mjs` encodes it as one hard-coded
exemption, carrying a comment naming this spec, not a general escape hatch. Measured 14 Aug:
`forest`'s worst floor ratio is 87.34% (at 1280×720), `details`'s is 87.42%, `rooms`'s exempted worst is
68.1% — all three independently reproduce the spec's own hand-derived arithmetic to within rounding.

### The open question this task's own measurement raised, and did not answer

Every ruling above was the client's to make and he made it. **One more number now needs the same
treatment, and this task stops short of it on purpose**: `vann-rooms` measures 43.9% mean / 49.4% worst
and `tola-rooms` 44.3% / 50.1%, against the plan's own ceiling of 31.5%/42.1% and 33.8%/44.3% — and on
their worst screen, over non-negotiable #8's general 45% ceiling too. All three levers the spec named
(the `xl` photo share, the words block's padding, `ROOM_STACK.heightMax`) were pulled and measured; none
moved the number. Full working — the exact figures, the padding-trim rebuilds, and the geometric proof
that `heightMax` cannot bind at the review's own 1440×900 — is `docs/reviews/2026-08-13-image-sizing/
README.md` §2. This is the spec's own named contingency (§2: *"if every lever is spent and the line still
cannot be held, the numbers go to the client with the choice"*), not a defect in what Tasks 4–5 built —
the composition is exactly what he asked for on 13 Aug, measuring against the ceiling he separately set on
4 Aug, and the two now disagree. Recorded as open in §5, not decided here.

**RESOLVED, 14 Aug 2026, same day — the first lever was declared spent at the wrong number.** The line
above reads "the `xl` photo share... were pulled" as though 65% was the share's own limit; it was the
plan's own worked example, never swept, never solved for the bound the way this project's own rule for a
bounded value requires (`§15`'s forest-tint solve is the standing example). Swept upward from 65% with
`lg` held 5 points below `xl` (the baseline's own relationship) — 68, 70, 72, 75, 78 — and re-measured
against both routes at every step: 68 through 72 stayed over the ceiling, 75 was the first clear pass
(**`vann-rooms` 36.0%/43.2%, `tola-rooms` 36.3%/43.5%**, both inside 45% worst with 1.5–1.8pp to spare),
and 78 passed with still more margin (33.6%/41.2%, 33.8%/41.5%) but was rejected on sight — screenshotted
and opened at 1440×900/1024×768/390×844 on both routes, its words column had crossed from "narrower" to
"a caption stuck to a photograph" (Tola's Family Suite at 1024×768 wrapped to a 4-line description and a
5-line facts row, breaking "terracotta-" mid-word). **`lg:w-[70%] xl:w-[75%]`** is what shipped: the
candidate with the most margin that still reads as a text column, not the largest that merely cleared the
line. `check_card_stack.mjs` (9/9, both arms, both routes, all six shapes) and `check_image_resolution.mjs`
(0 under-served, both routes) both re-passed at this value. Full sweep table, the cap arithmetic that
predicted widening could only help (never hurt) the crop bound, and the screenshot comparison:
`docs/reviews/2026-08-13-image-sizing/README.md` §2.5. The §5 open item this raised is now closed, not
left standing.

---

## 19. The plates that still shrank — a breakpoint moved when the defect was continuous, 14 Aug 2026

`docs/reviews/2026-08-13-image-sizing/README.md` §1.2 records the 13 Aug fix for the plate boards as
closed: the three-column tier's breakpoint moved from `lg` (1024px) to `xl` (1280px), and
`check_plates.mjs` passed. It was not closed. The client re-tested it inside a day, on his own machine, and
found the exact defect he had reported once already — recorded here in full because §2's own catalogue
exists to stop this shape of failure from being learned twice.

### The re-test

His words, 14 Aug 2026:

> "The images on all three section i told you on homepage (03, 05 and 07) still shrink with the smaller
> screen size as well as i checked and tested it by just transforming the size of Google Chrome window on
> which the link is open reducing it rather than on a full screen mode, also shrink when zoom value reaches
> 150% and above when tested on the chrome browser. We need to fix this, as it will tamper with the
> viewers experience."

He added that everything else the same plan shipped — the alternating room cards, the click-to-expand
gallery — "looks and feels perfect, no changes there." The finding is scoped to the three `PlateGrid`
boards (`03 · The Forest`, `05 · The Rooms`, `07 · The Details`) alone, exactly as his first report on 12
Aug had been (`docs/reviews/2026-08-12-plate-squeeze/README.md`).

### Why the 13 Aug fix was inadequate

Moving a breakpoint answers a defect that fires at a fixed point. This defect was never that: between
whichever two breakpoints were current, every plate was still `N%` of the viewport, so it kept shrinking
continuously as the window narrowed or the browser zoomed. Relocating the breakpoint could only move where
the shrink started being visible, never remove it.

The rig built alongside that fix then certified it anyway, because its own floor assertion carried an 85%
shrink tolerance — with a further 65% exemption for a board already at its minimum column count — rather
than asserting a real floor. Measured on that build, the Forest board across a continuous width sweep:

| viewport width | 1440 | 1366 | 1280 | 1200 | 1100 | 1024 | 960 | 900 | 700 |
|---|---|---|---|---|---|---|---|---|---|
| Forest plate width | 421px | 397px | 368px | 532px | 482px | 444px | 416px | 386px | 310px |

960px is 150% zoom on a 1440 screen — still shrinking, exactly as the client reported. And the 1280→1200
jump is worth reading closely: the board holds three columns from 1440 down to 1280px, and every plate in
that band is *smaller* than at 1440 — a trough sitting inside a single column-count tier, not a gap between
tiers a breakpoint move could ever reach. A rig tolerating an 85% shrink cannot see either shape as a
failure; a client dragging his own browser's edge could not miss them. Watched failing against the exact
13 Aug build, before anything changed: **483 failures across the three boards**, e.g. `forest:
worstFloorRatio=0.8734 (368px vs 421.34px reference, at 1280x720)` —
`docs/reviews/2026-08-14-plate-reflow/plates-before.json`. This is catalogue instance **§2 #52**: a fix
that moved a threshold to answer a defect that was continuous, certified by a rig built for the same
mistaken premise.

### The rule that replaced it

**A plate may never render narrower than its own width at 1440×900. A board drops a column the moment
holding that count would take a plate below that reference, and at one column the plate fills the
container.**

No tolerance, no exemption for a board already at its minimum column count — the 65% carve-out in the 13
Aug rig existed for exactly the case (`vann-dining`-style boards already at two columns) that this rule now
covers unconditionally. Under the new construction (below) a board that cannot hold a column at its
1440-reference width simply drops to fewer, wider columns, so "already at minimum columns" stopped being a
special case that needed protecting.

### The fill-the-width ruling

Put to the client and answered the same day: when a board drops to one photograph per row, does the
photograph fill the container's width, or hold at its full-screen size with cream either side? He chose
**fill the width** — at a ~1000px window a Forest plate is now ~880px, more than double its full-screen
size, and the chapter runs taller for it. The reason given, and accepted: holding the plate at its 1440
size inside a narrower one-column container would leave roughly half the screen bare, breaching
non-negotiable #8's 45% empty-space ceiling. This continues his 12 Aug ruling on the same board family —
*"at deep zoom the plates keep full size and the visitor scrolls more"* — extended from zoom specifically to
narrow windows generally: the plate never shrinks below its 1440 width, and the page is free to grow taller
and let a visitor scroll for it, rather than shrinking the plate to fit.

### Implementation, and two things that are load-bearing

`PlateGrid.tsx` lays a board out on `flex flex-wrap`, not CSS Grid. Each plate carries `flex: 1 1 REFpx`
— grow and shrink from a solved `REFpx` basis, per board. A line holds as many plates as fit at `REFpx`
each before the next would overflow; within a line, `flex-grow` distributes any leftover width evenly; a
plate stranded alone on its own line has nothing to share the line with, so it receives the whole line's
leftover width — "fills the container," extended from the one-column case to a lone trailing plate on a
partial row too. `flex-shrink` with `min-width: 0` is what lets a board collapse all the way to one
full-width plate once `REFpx` itself would exceed the container.

- **`REF` is rounded DOWN to a whole pixel** (420 / 650 / 316 for the three boards' three/two/four-column
  tiers). At exactly 1440px the column arithmetic sits precisely on a whole number of columns for two of
  the three boards (`3.0`, `4.0`) — a floating-point `REF` used unrounded would tie the line-wrap boundary
  exactly at the client's own reference viewport, and a single hair of floating-point error either way
  could silently drop a board to fewer columns at the one width that matters most. `referenceWidth`'s own
  comment in `PlateGrid.tsx` works this arithmetic for all three boards, including why `Math.floor(exact) -
  1` rather than a bare floor.
- **CSS Grid `auto-fit` was built first, passed every rig, and was visibly wrong.**
  `grid-template-columns: repeat(auto-fit, minmax(min(REFpx, 100%), 1fr))` states the client's rule about
  as directly as CSS can, and it measured 0% distortion and the correct floor at every sampled width. It
  still shipped a bare cell of cream: a Grid track is shared across every row, so when a board's plate
  count is not a multiple of its current column count, the trailing plate lands alone in a new row inside
  a track sized like its neighbours — and every OTHER track in that row still exists, simply empty.
  Screenshotted at 1024px on both Forest (3 plates, 2 columns) and Details (4 plates, 3 columns) before
  switching away from it — found by opening the image, not by any assertion, and non-negotiable #8's own
  language ("every screen must carry weight") failed by the fix meant to satisfy it. Flexbox has no
  shared-track model: a wrapped line is sized independently of every other line, so a lone trailing plate
  is the only thing on its line and grows to fill it. This is catalogue instance **§2 #53**: a layout that
  passed every mechanical rig and was visibly wrong, found only by looking.

### Measured after the fix

Plate width and column count, independently re-derived against the running production build:

| window | Forest | Rooms | Details |
|---|---|---|---|
| 1440 | 421px, 3 | 652px, 2 | 318px, 4 |
| 1366 | 615px, 2 | 1270px, 1 | 407px, 3 |
| 1280 | 572px, 2 | 1184px, 1 | 379px, 3 |
| 1024 | 444px, 2 | 928px, 1 | 452px, 2 |
| 960 | 864px, 1 | 864px, 1 | 422px, 2 |
| 900 | 804px, 1 | 804px, 1 | 392px, 2 |
| 700 | 652px, 1 | 652px, 1 | 652px, 1 |

No plate is below its own 1440 width at any window ≥ 470px, with one geometric exception: the Rooms board
below a ~700px window, whose reference plate is 652px and simply cannot fit two-up in a viewport that
narrow — a physical limit of the rule as stated (a board at one column already fills the container), not a
defect.

### The rig

`scripts/check_plates.mjs`'s floor assertion moved from 0.85 to **1.0**, and the 65% minimum-column-count
exemption is removed outright. Watched failing first against the unmodified 13 Aug build — **483
failures**, matching the client's own reported numbers — then passing against the fix: `forest:floor=1
rooms:floor=1 details:floor=1` on all three boards, `/mahua-vann` and `/mahua-tola` unaffected (neither
route carries a `PlateGrid` board). Both runs committed: `docs/reviews/2026-08-14-plate-reflow/
plates-before.json` and `plates-final.json`.

### A new owed item for the client — the only thing outstanding

Because a plate can now be drawn at up to ~864px instead of ~421px, it asks its source photograph for far
more detail than the 13 Aug build ever did. At device pixel ratio 2 or above — a Retina Mac, an iPad, a
Windows laptop at 150% display scaling — the one-column state falls **22–46% short** of the pixels it
needs. The three Forest cats (`tiger-pair-profile`, `leopard-on-rock`, `melanistic-leopard`) are curated
into `lib/media-manifest.ts` at **900px** wide; the four Rooms photographs top out at **1440px**. Neither
was ever asked to fill a whole container's width before this fix — the Rooms board was two-column at every
width under the old construction, so it never drew a full-container box at all. This is new exposure, not
a pre-existing one.

**Not caught by `check_image_resolution.mjs`**, and not because the rig is broken: its DPR sweep is
390@1x, 390@3x, 768@1x, 1440@1x and 1920@1x, and it reports **0 under-served images on all three routes at
every one of those combinations**. It never samples a wide viewport (900–1100px, where the one-column state
actually renders) at a DPR above 1 — the exact combination this fix newly introduces. A true reading of a
question the rig was never built to ask at this width, the same shape §2 #8, #29 and #45 already catalogue.

**The ask, for when the client is next in touch:** uncropped originals, roughly **1800px wide** for the
three Forest cats and **2600px wide** for the four Rooms photographs. Not fixed here — it needs source
material this session does not have. Recorded in §5 and in
`docs/reviews/2026-08-14-plate-reflow/README.md` §8 so it is not lost.

### Verified unchanged

Density at the fixed 1440×900 measurement point is unchanged on all three routes and no chapter newly
exceeds 45% worst (home mean 37.9%, Vann mean 35.3%, Tola mean 30.9% — all matching the last recorded
figures within rounding, because this fix only changes column count in the 1024–1279px band and density is
measured at a fixed 1440×900). Initial-load transfer is unchanged and under 1.5 MB at both widths on all
three routes. **467 tests**, `tsc`, `lint` and `build` all green. `components/ui/Plate.tsx` and
`components/ui/Photo.tsx` — the other session's files — remain untouched. Full working:
`docs/reviews/2026-08-14-plate-reflow/README.md`.

## 20. The coverflow — a sticky stage does not freeze its timeline, and five other things measured, 16-17 Aug 2026

`04 · Days in the Field` became a pinned coverflow: six activity cards advancing on the visitor's own
scroll, the neighbours behind and to either side, at **zero added JavaScript** (168.2 KB brotli, delta 0).
Client request, 16 Aug: *"looks flat even though it has beautiful images."* The design is
`docs/superpowers/specs/2026-08-16-field-days-coverflow-design.md`; the plan and its running corrections are
`docs/superpowers/plans/2026-08-16-field-days-coverflow.md`; the evidence is `docs/reviews/2026-08-16-coverflow/`.

**Read §20.1 before touching `app/globals.css`'s `.coverflow*` block, and §20.4 before quoting any density
figure from this chapter.**

### 20.1 `position: sticky` does not freeze a view timeline. The range phase does.

This is the most valuable thing the work produced, and **it corrects what `app/globals.css` says above
`.room-stack`** — or rather, it explains it. That comment records a measured symptom ("its own exit-phase
progress does not advance… only catches up in one jump once the whole deck unsticks") and attributes it to
the element being sticky. The attribution was wrong; the symptom was right.

Task 1's probe built the sticky-self-animating construction *as a control arm, expecting it to fail*. It
passed, and was numerically identical to the non-sticky arms — Chrome computes a sticky subject's
view-timeline range with the sticky offset applied. Three further arms then isolated the real cause, same
construction, only the range phase differing:

| range | progress across the pin | longest flat run | after release |
|---|---|---|---|
| `cover 0% → 100%` | 0.884 → 0.319, continuous | 0px | keeps moving |
| `exit 0% → 100%` | 1.000 → 1.000 | **4,480px** | completes over 2 samples |
| `contain 0% → 100%` | 1.000 → 1.000 | **4,440px** | **completes in one 200px step** |

`cover`'s offsets are computed off the sticky-adjusted box; `exit` and `contain` are computed off boundaries
a stuck box never crosses. **Nothing here licenses simplifying `.room-slot` away** — `RoomCard` needs a
phase that tracks a card being *covered*, which is what a non-sticky sibling supplies. What it does mean is
that the coverflow's range must stay on `cover`, and that "tightening" it to `contain` — which reads as the
more precise choice for a subject taller than the viewport — freezes the whole carousel for its entire pin
and dumps it in one frame at the end.

### 20.2 Three geometry facts nobody would derive on paper

- **A view timeline is inset by the scroll container's `scroll-padding-top`.** That property is set in
  `globals.css` for *anchor links* and has nothing to do with animation, and it shortens `cover` by its own
  height. One step is 889px at 1440×900, not 900.
- **The sticky stage must clear the header out of its own height** (`calc(100svh - var(--header-height))`).
  At a flat `100svh` the last card centres **11px after the pin has released**.
- **The naive anchor-target placement is wrong with a *slope*, not an offset** — `−66 + 11·i`, because two
  things are wrong at once. A fix tuned on card 3 looks perfect and is 33px out at both ends. Solving from
  the track's own arithmetic lands every card at 0.00px; the negative control in the same run put four of
  six cards a full ±360px out, i.e. **arrows silently landing on the wrong card**.

### 20.3 The pin length was coupled to the card count, and did not have to be

Dividing *percentages of `cover`* into `n + 1` steps forces `screens ≥ card count` — six screens of pin for
six cards, against `STICKY_SCREENS_MAX` of 3 and a chapter that was 2.93 screens. That would have breached
non-negotiable #9 outright and the feature would have died there.

The fix is to express `animation-range` offsets as **lengths anchored to the pinned window** rather than
percentages of `cover`, since `cover` includes a viewport of entry travel and a tail that no card should
spend a step on. The two resolved values are self-proving: card 0 reads `cover 823px`, exactly where the
stage locks, and the last reads `cover 2700px`, exactly where it lets go. `screens` is now a free dial for
**pace alone** — measured at 2, 2.5, 3, 3.6, 4 and 6.

### 20.4 The density story, in the order it happened — quote only the last row

Every intermediate figure below is **stale and must not be quoted as current.**

| state | `field-days` mean | worst | page worst |
|---|---|---|---|
| the three bands this replaced | 43.9% | 57.9% | 64.6% |
| first build, `cardMaxPx: 560` | 70.7% | 83.1% | — |
| + header band recomposed | 65.2% | 82.9% | — |
| + `cardMaxPx` swept to 900 | 48.4% | 61.5% | 64.6% |
| + flank ghosts | 46.2% | **52.2%** | 64.6% |
| + tiger in its own band (rejected) | 48.6% | 62.3% | **77.1%** |
| tiger into the header band | 48.1% | 55.0% | 67.0% |
| + the client's six re-exports, collage removed (17 Aug) | 52.0% | 66.2% | 82.9% |
| + header band recomposed | 47.1% | 55.0% | 77.8% |
| **shipped** — `cardMaxPx` swept to 1217 | **26.4%** | **41.0%** | **71.4%** |

**It passes. 41.0% against the 45% ceiling, `passesWorst` TRUE, four points clear, zero screens over
budget** — against 43.9% / 57.9% for the three bands it replaced. Page mean 35.6%.

**It could not reach 45% at any card size on 16 August and does on 17 August, because the photographs
changed, not the code.** The client supplied all six at 1344 × 685 (§20.6). That is the single most useful
thing to carry out of this chapter: the lever was never in the CSS.

Four things decided those rows:

- **`cardMaxPx: 560` was never swept.** It came from the plan by analogy to `ROOM_STACK.heightMax`. This is
  the *same defect shape* as the beside-room-cards breach two days earlier (§18) — a number written in a
  plan read downstream as a bound and reported spent. Sweeping it costs **no scroll at all**: the chapter is
  3.34 screens and the document 16,686px at every arm from 560 to 1120.
- **`screens` cannot touch the worst screen and makes the chapter's mean *worse*** — every screen it adds is
  a pin screen. Measured at 2 / 2.5 / 3: mean 48.4 / 48.9 / 49.3%, worst 61.5% at all three.
- **The card sweep, re-run on the new files, is where the ceiling was finally cleared**: 900 / 1000 / 1100 /
  1217 → worst **55.0 / 51.2 / 46.5 / 41.0%**. Roughly seven points per 100px of card, and it still costs no
  scroll at all.
- **Removing the collage made the chapter WORSE before it made it better** (52.0% / 66.2%, and the page's
  worst screen 82.9%, the emptiest on the site). Deleting four photographs left the header band's *height*
  and took its imagery. Recomposing that band — 7/5 instead of 5/7, wider prose, 56px of cream out — was
  worth **−11.2 points** off the chapter's worst before the card sweep ran. **A removal is not free: it
  leaves a hole the shape of what it removed.**
- **The flank ghosts are worth 9.3 points and are free.** The worst screen was the first and last card's
  centre-hold, where one card sat alone because there is no card −1 or card 6. There is: the client asked
  for a loop, and rendering the wrap-around neighbours as `aria-hidden` ghosts at `--i: -1` and `6` fills
  exactly those screens *and* makes the loop visible in the scroll rather than only in the arrows. The
  existing `animation-range` formula placed them with no change. `distinctImages` is 42 in every arm, so
  none of the gain came from double-counting an image, and a card and its own ghost are never on stage
  together — which is what makes it read as wrapping round rather than as a photograph shown twice.
- **One line of markup was worth ten points.** The tiger film below `guide-sunrise` reads 51.6% / 65.3%;
  above it, 48.1% / 55.0%. Either end leaves the same strip of cream at the foot of the text column; the
  only variable is whether its neighbour across the gutter is a 300px drawing or a 761px photograph.

**An accounting trap worth carrying forward: a band sitting on a chapter boundary scores as a JOIN and is
excluded from that chapter's own mean, surfacing only in the page's worst.** The rejected tiger arm's 48.6%
was flattered by exactly this. The shipped arm makes the chapter pay for its own figure and still wins.

**The tiger now opens the chapter rather than closing it**, and non-negotiable #5 is untouched by that: it
is a rule about behaviour — arrive, perform once, doze, replay on hover — not about position. Candidate 1,
taking the band out of the pin instead, was built and rejected on measurement: it moves the same 297px of
78%-cream band 297px earlier, the join screen measures identical, and it costs 29% of the carousel's pace.

### 20.5 The card is a photograph with its words on it, and all six were illegible

Client's second ruling, 16 Aug: *"an image with text on it"*, like `why-you-came`. Denser than a
photo-above-text card (all imagery, not half) and it survives being overlapped — a stacked card at the edge
of a coverflow loses either its photograph or its words, while a photograph with type on it degrades into a
photograph.

**Unwashed, the type on these six cards measures 1.01–1.32:1 against a 4.5 floor.** The placeholder
`{ flat: 0.5 }` the cards shipped with for a day reached only 2.55–4.21 — **below the floor at every
width.** Solved per photograph: 4.91–8.82.

Two findings inside that:

- **The card's small-screen composition, not the photographs, forced the figures.** Bottom-anchored layers
  solve every card at 1440 almost free and cannot solve *any* card at 390: the words are 27% of the card's
  height at 1440 and **58%** at 390, so their top edge clears the `bottom` band entirely and only a `centre`
  layer reaches. The lever to lighten these is the card's composition at 390, not a lighter scrim.
- **The rig had to change to measure the right pixels.** A block-level heading's rect is the card's full
  width, and cropping its empty gutter read 1.00:1 where the glyphs measured 1.33. Per-line `Range` crops
  replaced element rects, and that moved solved figures by whole steps.

**A neighbour recedes by VEIL, never by opacity** — fading a card whose type sits on its own photograph
fades the words against the frame beneath them, so the depth cue would fight the legibility floor. More
scrim recedes the photograph and *raises* cream type's contrast. `COVERFLOW.sideDim` was retired before it
shipped and `lib/motion.test.ts` asserts the lever cannot grow back.

### 20.6 The photographs were the lever, and the client supplied them — 17 Aug 2026

**Everything this section said until 17 August was true of files that no longer exist**, and it is worth
reading as history rather than deleting, because the shape of the constraint is the lesson.

**What was true on 16 August.** Four of the six card photographs were **1163px, 2.289:1 crops** made for
`/mahua-vann`. `object-fit: cover` in a 16:9 box draws a photograph wider than its box by
`imageAspect / CARD_BOX`, so those four were drawn at **1.288 × the card's width** and ran out at a **903px**
card. 45% needed ~1,090px. `CARD_BOX` was 16:9 for the same reason — anything taller cropped them past the
25% bound — so **no portrait or square card was available**, and the chapter could not meet non-negotiable
#8 at any setting.

**What the client sent.** All six re-exported at **1344 × 685 (1.962:1)** — wider *and* taller, from the
original scenes rather than the property page's crops. Three of the six are different photographs as well as
bigger ones, and two of those are upgrades: the safari card gained a frame with the vehicle and guests in
it, and Kohka Lake became an actual lake rather than the lodge's swimming pool (§20.9).

**What that unlocked, in one line each:**

- The draw factor fell from 1.288 to **1.1036**, so the ceiling rose from 903px to **1217px** — past the
  ~1,090px 45% needed. Shipped at 1217, measured 41.0% worst.
- The minimum box fell from 1.7194 to **1.4715**. 16:9 now crops **9.4%**, not 22.45%, and a 3:2 or squarer
  card is available. `CARD_BOX` stays 16:9 on measurement, not inertia: at *every* box's own ceiling the
  card is 685px tall — the file's height — so a wider box buys width only, and at 390px the free space
  inside the card is 23px at 16:9 against 5px at 1.962, in an `overflow: hidden` box.
- **`check_image_resolution.mjs` does not guard this**, which is why `CoverflowCard.test.tsx` now does. A
  photograph already served its widest tier is classed `atLibraryCeiling` — a class that rig *reports* and
  does not enforce — so raising `cardMaxPx` past 1217 fails silently: green rig, green build, six visibly
  soft cards on the one screen the client tests on.

**Still owed.** `vann-potters-village` measures **1.03:1 unwashed** even after the re-crop — the glaze
highlights moved but still land where the body copy does, and it carries one of the heaviest washes on the
page for it. That frame wants a **different photograph from the same shoot**, not a bigger file.
`docs/OWED-ORIGINALS.md` carries it, along with the DPR-2 half of this group (1344px serves a 1344px card at
1.00 on an ordinary screen and 0.50 on a Retina one).

### 20.7 Two defects the fixed sample widths hid, again

- **The card painted over the tiger film below ~1430px of viewport** — headless at 1280, and pre-existing
  below ~1090px at the old card size. No rig saw it because `check_films.mjs` only ever measured 1440. It
  now samples six widths, and its message distinguishes *white ground present* from *covered by X*.
- **The cards sat ~24px off-centre between 768px and 948px** — the card is `min(900, 100vw − 48)` while
  `ChapterSurface` is `md:px-12`, so the card is wider than its stage and `margin: auto` collapses.
  Found only when a rig finally swept continuously.

That is the fourth and fifth time a defect on this project has lived between 390 / 768 / 1440 / 1920. The
plate squeeze, the room card's 51% crop and the map's 4.3px labels were the first three.

### 20.8 What the plan got wrong, and who caught it

Recorded because the pattern is the point: **eight of the nine corrections below were defects in the plan or
the probe, not in the implementations**, and every one was found by the person executing rather than by the
person who wrote it.

| # | The plan/probe said | The truth |
|---|---|---|
| 1 | `lib/coverflow.ts` produces `COVERFLOW_STEP_DENOMINATOR` | Defined nowhere and consumed by nothing; implementer declined to invent it |
| 2 | `COVERFLOW` carries `sideDim` | Stale against the plan's own correction C; `sideVeil` shipped |
| 3 | `tsc` passes at the end of Task 3 | It cannot — `app/page.tsx`'s exhaustive switch is *meant* to break until the case arm lands |
| 4 | `MediaId` is a branded type | A plain string-literal union; a genuine brand would have broken the test's cast |
| 5 | The scroll target sits inside the card | Measured wrong by a slope, and would emit duplicate ids |
| 6 | `@supports (…) and (not (prefers-reduced-motion: reduce))` | `not` over an invalid declaration is **true**; reduced motion would have done nothing, silently |
| 7 | A two-step window gives the client's effect | At the moment a card is centred its neighbours are at 0% and 100% of their own windows, i.e. off-stage; widened to four steps |
| 8 | "Exactly one card within 8px of centre at every sample" | Unachievable by any continuously-moving carousel; replaced with the invariant that does tile |
| 9 | `field-days` has six photographs matching six activities one-to-one | A count match, not a semantic one — two cards would have named a place their photograph is not |

`app/page.tsx`'s `CREAM_KINDS` appears in no task at all; omitting the new kind there would have flipped the
cream surface of every chapter below `field-days`.
