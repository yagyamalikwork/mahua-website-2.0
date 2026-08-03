# Mahua Resorts — Home Page MVP

**Design specification · 1 August 2026**

Status: **approved** (brainstormed and signed off section by section with Yagya Malik, 1 Aug 2026)

---

## 1. What we are building

A single page: the new Mahua Resorts home page. Not the whole site — one page, built as a demonstration
that is simultaneously the real foundation of the eventual site.

The brief, in the owner's words: the current WordPress site "looks like a template and very monotone, it
feels very text heavy." The new page must "look, feel and style as if the website itself is an experience
and a journey."

**Dual mandate (explicitly confirmed):** this is *both* a pitch piece that must win approval on emotional
impact, *and* Page 1 of the production site. Every architectural choice must survive into the remaining
pages without rework.

### Reference points

| Site | What we take from it |
|---|---|
| [thesujanlife.com](https://thesujanlife.com/) | The bar. One confident serif line over calm imagery, generous space, restraint as the signal of expense. Named in the client's own benchmark document. |
| [aramness.com](https://aramness.com/) | Cinematic full-screen hero (video hero not available to us — see §7). |
| [evolveback.com](https://evolveback.com/) | Clean multi-property presentation. |
| [pugdundeesafaris.com](https://pugdundeesafaris.com/) | Closest direct peer; conservation storytelling. |

---

## 2. Decisions taken (and the reasoning, so they are not relitigated)

| # | Decision | Reasoning |
|---|---|---|
| D1 | **Two properties only** — Mahua Vann (Pench) and Mahua Tola (Tadoba) | Mahua Bagh (Murud) is removed from the brand per the Master Brand Record and confirmed by the client. The live site still shows three; it is wrong. |
| D2 | **Seduce, not convert** | Family-run luxury wildlife brand. Unhurried, warm, with a gentle push toward "discover" — the Sujan posture. Explicitly *not* a booking funnel. |
| D3 | **Concept: "One Day at Mahua", drawn in a field-guide hand** | The scroll is a single day, dawn to night. Rendered in the hand-drawn field-guide idiom of the existing v3 mockup. See §3. |
| D4 | **Tiger is hand-drawn ink illustration (layered SVG)**, not 3D, not photographic | Avoids the uncanny valley, matches the brand's existing hand-drawn language, tiny file, fully owned. |
| D5 | **Tiger walks in; it does not jump** | A jump reads cartoon. A tiger padding in silently is truer and more unsettling. Client accepted the argument. |
| D6 | **Tiger settles and dozes; it is not a permanent fixture** | Permanent peripheral motion contradicts D2. It arrives, performs, then becomes a still ink drawing. Wakes on return/interaction. |
| D7 | **Palette is predominantly light (~80% cream/warm paper)** | See §9 — the client overruled an initial darker proposal. This was a correct catch and is recorded as a standing constraint. |
| D8 | **Leave WordPress. Next.js + TypeScript + Tailwind + GSAP + Lenis on Vercel** | See §6. |
| D9 | **Sanity CMS chosen, but deliberately not built in the MVP** | Copy lives in one structured file shaped to slot into Sanity later. Avoids paying for CMS setup before the page has won its argument. |
| D10 | **Design assuming no new photography or video** | Client is unsure of shoot budget. We build with existing stills and deliver a targeted shot list instead (§7). |
| D11 | **Full replacement is the intent, but must prove itself first** | Migration/SEO work is dormant, not cancelled. See §10. |
| D12 | **Test Cormorant Garamond for display sizes**, keep Gilda Display elsewhere | Gilda is a single delicate weight that reads weak at full-screen size. One-line revert if disliked. |
| D13 | **The two light↔dark crossings must fall where the page has no text.** Until then, text falls back to pure black/white through the crossing. | See §13 — a hard arithmetic limit, decided by the client on 2 Aug 2026. |

---

## 3. The scroll narrative — seven movements

The page runs **wild in the morning, calm in the afternoon**, which is the brand's central claim
("the wild and the calm, held together") expressed as structure rather than asserted as a sentence.

### 0 · Pre-dawn — *The Mahua Falls*
Forest green, near-dark. The logo draws in and turns almost imperceptibly. **Mahua blossoms fall** slowly
down the screen.

Not decoration — from the Master Brand Record: *"Each spring, Madhuca longifolia drops its cream-coloured
flowers before dawn, until the forest floor lies carpeted in pale blossom."* The falling blossom is
literally what happens at this hour, is the tree the brand is named for, is the shape in the logo, and is
the philosophy in one image.

**H1:** *The wild and the calm, held together.*
**Sub:** *Two family-run lodges at the gates of Pench and Tadoba.*

This is the direct fix for the audit finding: *"no single strong tagline or brand promise on first view."*

### 1 · First light — *The Gate*
Green lifts through warm sand. Full-bleed forest receding on scroll. The safari proposition stated as fact,
not sold: **five kilometres to Turia Gate**, first through at dawn, naturalists who track these particular
tigresses and their lineages.

**The tiger arrives here** — the hour one would actually be seen.

### 2 · Mid-morning — *The Residents*
Hard gold light. Wildlife as field-guide **plates** with specimen captions: *Bengal tiger — Panthera tigris
tigris*; *Indian leopard — Panthera pardus fusca*; the melanistic leopard. Then quieter: gaur, sloth bear,
dhole, and some three hundred birds.

*Cuttable if scope demands — see §8.*

### 3 · Afternoon — *The Two Lodges*
**Light turns to warm paper and stays there.** The hinge of the page: the wild half ends, the calm half begins.

Two large plates, unhurried:

| | **Mahua Vann** · Pench | **Mahua Tola** · Tadoba |
|---|---|---|
| Rooms | 26 | 14 (expanded from 11) |
| Gate | Turia Gate, **5 km** (also near Teliya, Khawasa) | Kolara Gate, 6 km · 7.5 acres |
| Character | Mud-plastered cottages under sal and mahua | River-facing *machaans* on a seasonal riverbed |

Each closes with the gentle push: **Discover Mahua Vann →**

### 4 · Late afternoon — *Rooted like the Mahua*
The origin story the audit says is missing and that luxury nature brands use to justify their rates. The
mahua as *kalpavriksha*, the wish-fulfilling tree. Local hiring, local produce, vernacular building.
**The hand-drawn Pench map lives here** — the audit calls it "one of the best elements on the whole site."

*Cuttable if scope demands — see §8.*

### 5 · Dusk — *The Ritual*
Warm ochre paper, lamplight. **Mahua 2.0's real differentiator, which no competitor has:** full-moon
manifestation nights — intention-setting, breathwork, the diya-water-flower ritual, the letter to the
universe. Yoga on the lawn. Mahua Kheer on the open chula.

### 6 · Night — *The Sky*
Returns to forest green. Telescope on the lawn, star talks.

**Social proof lands here** — TripAdvisor rating and two or three real guest lines. The audit is emphatic
the homepage needs it; placing it at nightfall just before the invitation means it reads as reassurance
rather than sales tactic. Then the close and the footer.

---

## 4. Visual system

### 4.1 The palette is the clock

The three palettes already explored in the Master Brand Record are not competing options — they are times
of day. Nothing explored is discarded, and the page ends where it began.

| Movement | Background | Text | Accent | Origin |
|---|---|---|---|---|
| 0 · Pre-dawn | `#232B21` forest green | `#E9DFC7` cream | `#D5A63E` antique gold | brand v1 "Forest" |
| 1 · First light | green → warm sand | — | — | transition |
| 2 · Mid-morning | `#F1E9D7` paper *(and it stays)* | `#31402C` ink green | `#BB8F2E` gold | brand v3 "Fieldguide" |
| 3 · Afternoon | `#F1E9D7` paper | `#31402C` | `#BB8F2E` | brand v3 |
| 4 · Late afternoon | `#E9DFC8` paper, deeper | `#31402C` | `#BB8F2E` | brand v3, shade 2 |
| 5 · Dusk | `#E4D2AC` warm ochre paper | `#6E4F2F` warm brown | `#DCA457` amber | new — lamplight |
| 6 · Night | `#232B21` forest green | `#E9DFC7` cream | `#BB8F2E` gold | brand v1 |

**~80% of page height is cream or warm paper** — the Sujan proportion. See §9 for why this matters.

The background is **one continuously bleeding surface**, not seven blocks. No boundary is ever visible.

**Dusk deliberately does not go dark.** It warms to lamplit ochre. It still reads as evening because the
*photographs* carry the hour — lanterns, low gold light, fire. The background never has to go black to
say "evening."

### 4.2 Typography

- **Display (full-screen moments):** Cormorant Garamond *(on trial — D12)*
- **Headings:** Gilda Display
- **Labels, chapter numbers, plate captions:** Cinzel, letter-spaced caps
- **Body:** Crimson Pro

Serif body is retained deliberately, against the audit's advice to use a sans. A sans body is correct
advice for a generic hotel site; here the field-guide idiom depends on the serif, and Crimson Pro is
genuinely readable at mobile sizes.

British spelling throughout, per the audit's recommendation (the current site mixes conventions).

### 4.3 The motion laws

1. **Nothing bounces.** No elastic, no springs, no overshoot. Everything decelerates and stops. The motion
   signature is *settling*.
2. **Things develop, they do not fly in.** No lateral slides. Elements fade up from 96% scale, like a print
   coming up in a darkroom tray. Major reveals run **800–1400ms**.
3. **Depth, not movement.** Parallax offset caps at **15%**.
4. **If you notice the animation, it is too fast.**

Scroll carries slight momentum (Lenis) so the page feels like something with mass.

### 4.4 Texture

Fine paper grain over the whole page at very low opacity. Ties everything to the field-guide idiom and stops
dark movements reading as flat rectangles. Cheap, and most of the difference between "expensive" and
"a website with a dark background."

---

## 5. The three signature interactions

### 5.1 Leaf cursor
A small mahua leaf following the pointer.

- **Trails behind the pointer** with slight lag and swings to catch up. A leaf locked rigidly to the cursor
  reads as a sticker; one that lags reads as falling through air.
- Tilts into direction of travel; sways to a stop.
- **Anchored by its stem tip at the exact pointer position**, body hanging down-right, so it never covers
  the click target.
- Lifts and warms to gold over interactive elements — a *second* affordance signal, never the only one.
- **Disabled entirely** on coarse pointers (phone/tablet) and while a text input is focused.
- Still and simple under `prefers-reduced-motion`.

### 5.2 Logo bloom
Petals clockwise, leaves anticlockwise, **~75s per rotation** — slow enough that you must stare to catch it,
which is what makes it feel alive rather than mechanical. Same component large in the hero, small in the
header. Holds still under `prefers-reduced-motion`.

**No vector source exists** (client confirmed; only a 560×438 PNG). The logo is **radially symmetric —
8 identical petals, 8 identical leaves, a radial stamen burst** — so it is **reconstructed, not traced**:
draw one petal, one leaf, one stamen, rotate-copy each eight times. Mathematically exact, crisp at any
size, tiny file, and petals/leaves fall out as **separate groups by construction**, which is exactly what
counter-rotation needs. A trace would have produced one welded blob.

The wordmark does not animate; the existing raster is adequate.

### 5.3 The tiger

| Phase | Behaviour |
|---|---|
| 1 · Stillness | Page loads. A beat of quiet first — the arrival only lands if there is silence before it. |
| 2 · Entrance | As pre-dawn lifts into first light, the tiger pads in from the left edge. |
| 3 · Crossing | Walks right over **8–12 seconds**. Unhurried, per the motion laws. |
| 4 · Settling | Slows, stops, sits with a real weight-shift — not a snap. |
| 5 · Alive | Breathing, tail flick, ear turn, a paw washed roughly every 15s. A butterfly wanders a loose loop and occasionally lands. |
| 6 · Dozing | Settles: eyes close, head lowers, becomes a still ink drawing. |
| 7 · Stirring | Wakes and looks up on return to the section or on interaction. |

- **Placement:** along the ground line at the bottom of the movement, ~20vh tall. **Never crosses readable text.**
- **Mobile:** still arrives (it is the show-stopper), with a shorter crossing and scale tuned for narrow screens.
- **Reduced motion:** already seated on arrival. Present, still.

**Architecture — rig and skin are separate:**

- **Rig** (`lib/tiger/rig.ts`): joint hierarchy, walk cycle, sit, paw-wash, butterfly path, and the state
  machine. Code. The hard part.
- **Skin** (`tiger-art.svg`): layered artwork, each part carrying an id matching a rig node.

**This separation is the insurance policy on the show-stopper.** The riskiest element is the *drawing*, and
the drawing is the replaceable part — hand an illustrator the part list, swap the file, and the walk cycle,
sit, doze and butterfly all survive untouched.

Rig nodes: `root, body, chest, neck, head, ear-L, ear-R, jaw, tail-1..3, foreleg-L{upper,lower,paw},
foreleg-R{...}, hindleg-L{...}, hindleg-R{...}`.

State machine: `entering → walking → stopping → sitting → idle → washing → dozing → waking → idle`.

---

## 6. Technical architecture

### 6.1 Stack

| Layer | Choice | Rejected |
|---|---|---|
| Framework | **Next.js + TypeScript** | Astro (leaner, but a booking integration is coming and more devs know Next); plain HTML (breaks at page two) |
| Styling | **Tailwind** + palette tokens | CSS Modules, styled-components |
| Motion | **GSAP** (now free incl. paid plugins — SplitText for line reveals, MorphSVG for tiger transitions) **+ Lenis** | Framer Motion (weak at long scroll choreography); CSS-only (cannot do scroll timelines or a rigged character) |
| Images | Next image pipeline → AVIF/WebP, responsive sizes | Cloudinary (good, unnecessary spend) |
| Hosting | **Vercel** — per-commit preview links to send the family | Netlify, Cloudflare Pages |
| Content | One structured file now → **Sanity** later (D9) | Headless WordPress (perpetual hosting + patching); Contentful/Storyblok |
| Enquiries | **Resend** | Formspree; plain mailto |
| Analytics | **Keep GA4** — do not disturb history | — |

**Why leave WordPress:** the page is mostly *choreography* — a background bleeding through seven states,
images drifting at different speeds, a rigged character with a state machine. WordPress has no opinion about
any of that; it would all be JavaScript bolted on anyway, while still charging rent in plugin updates,
security patching and a database query before first paint.

**Running cost:** ~$20/month (Vercel), against current WordPress hosting — plausibly a net saving.

### 6.2 Shape of the code

```
app/
  page.tsx                  composes the seven movements
  layout.tsx
components/
  movements/                Dawn · FirstLight · Residents · Lodges · Roots · Dusk · Night
  motion/                   Reveal · Parallax · DaySurface
  signature/                LeafCursor · LogoBloom · Tiger
  ui/                       Plate · ChapterLabel · SpecimenCaption
lib/
  palette.ts                the seven light states        ← THE DIAL
  motion.ts                 durations and easings
  tiger/rig.ts              skeleton + state machine
content/
  home.ts                   every word on the page
public/media/               curated, optimised imagery
```

**Four files are really dials**, and this is the point of the structure:

| File | Holds | Why it matters |
|---|---|---|
| `lib/palette.ts` | Seven light states as named tokens | **The safety net for §9.** Re-tune the whole day in one file, minutes not days. |
| `lib/motion.ts` | Every duration and easing | "It feels too fast" is one edit, not fifty. |
| `content/home.ts` | Every word | Copy edits never touch layout. Becomes the Sanity hook. |
| `lib/tiger/rig.ts` | Skeleton + state machine | Art swaps independently. |

**No component may hard-code a colour, a duration, or a string of copy.** All three are imported from the
files above. This is the constraint that keeps the dials real.

Each movement is a **self-contained file that never reaches into another** — dusk can be rebuilt with no
risk to dawn, and movements 2 and 4 can be removed cleanly (§8).

### 6.3 Build order

1. **Light-states preview page first** — the seven states bleeding into one another with the motion laws
   applied. **Client approves this before any movement is built on top of it.** Colour and motion cannot be
   judged from a table.
2. Palette, motion and content scaffolding.
3. Movements, in narrative order.
4. Signature interactions: logo → leaf cursor → tiger (hardest last).
5. Performance and accessibility pass against the budgets.

---

## 7. Assets

### What exists (downloaded to `reference/`)

- **~56 unique images from the live site** (30 MB), from two sources:
  - `scripts/crawl_site.py` — 34 originals actually used on pages (thumbnail variants collapsed)
  - `scripts/fetch_wp_media.py` — 27 from the WordPress media library API. Note the API *reports* 137
    items but exposes only 27 to unauthenticated callers; the rest would need credentials.
- **31 images extracted from the v1/v3 HTML mockups** — `scripts/extract_mockup_imgs.py`
- **Zero video.** Confirmed across the whole site.

### Honest quality assessment

| Asset | Verdict |
|---|---|
| WP homepage banners (1931×789) | **Unusable.** Text is baked into the image ("Go off the beaten track…"), flat midday light, letterbox crop that cannot go full-bleed. |
| Lantern bridge at dusk (mockup) | **Hero-grade.** Warm lantern light, strong leading lines, genuinely cinematic. |
| Room interiors (2560×1441) | Competent hotel photography. Fine for a rooms section, not a hero. |
| Video / drone | **None.** Aramness's video hero — which the client's own benchmark doc recommends copying — is not available to us. |

Roughly **6–8 images are genuinely hero-grade**, all stills. The cinematic quality must therefore be
manufactured in code: parallax depth, slow scale drift, masked reveals, grain, and light.

**This is why the day-arc concept earns its place practically as well as narratively:** under any other
structure, inconsistent lighting across the library is a defect. Under this one it is the plot.

### Deliverable: targeted shot list
Per D10, the project must produce a **specific list of the 3–4 photographs that would most transform the
page**, so a small shoot can be priced precisely rather than vaguely. To be written once the built page
shows where the gaps actually bite.

---

## 8. Scope and the release valve

Seven movements is a substantial page. If scope must be cut, **movements 2 (The Residents) and 4 (Rooted
like the Mahua)** are removable without breaking the arc — dawn → lodges → dusk → night still tells the
story. Build all seven if possible; this is the documented release valve, not a plan.

**Out of scope for this MVP:** all other pages; the booking engine restyle; Sanity wiring; the URL
migration; multi-language.

---

## 9. Standing constraint: the page must stay warm

**Recorded because the client raised it and was right.**

An initial palette proposal had **four of seven movements dark**, plus a cold indigo-slate (`#16232B`) in the
first-light state. The client objected: for a family-run hospitality brand, dark backgrounds drain warmth,
and both Sujan and the current site sit in cream.

The diagnosis: **the enemy was never "dark" — it was *cold* dark, and too much of it.** `#232B21` is a
*warm* near-black with yellow in it and reads like a lodge interior with the lamps on. `#16232B` is cold and
kills warmth.

The palette in §4.1 is the rebalance: two brief warm-green bookends, ~80% cream, and dusk warmed to lamplit
ochre rather than dropped to night.

**Standing rule for all future work on this project:** cream/warm paper is the home key. Dark is punctuation,
always warm-toned, never more than the two bookends without an explicit new decision. If the built page still
feels moody, `lib/palette.ts` retunes the entire arc in one file.

---

## 10. Dormant requirement: SEO preservation at cutover

Not relevant to the MVP. **Critical on the day of replacement.**

`mahuaresorts.com` has years of search history against URLs including:

```
/                     /about-us/            /offers/
/resorts/mahua-vann/  /resorts/mahua-tola/  /resorts/mahua-bagh/
/in-the-news/         /terms-conditions/    /work-with-us/
```

If these change or vanish without forwarding rules, **rankings drop and take months to recover.** Every old
address needs a redirect to its new home before cutover. `reference/_crawl_manifest.json` holds the
crawled URL list.

Note `/resorts/mahua-bagh/` — the removed property (D1) still needs a redirect target, most likely the
home page.

---

## 13. The light↔dark crossings — a binding constraint on Plan 2

**Discovered by the whole-branch review, 2 Aug 2026. Decided by the client the same day.**

The background blends continuously between light states; the text colour is chosen per scroll position. In
the four all-light segments both are warm and contrast sits at 5.0–9.1:1. But the **two segments that cross
between dark and light** (firstLight→midMorning, dusk→night) pass through a mid-luminance background that
**no warm colour can clear 4.5:1 against.**

This is arithmetic, not tuning. WCAG measures luminance alone, and this palette's endpoints are far enough
apart that the midpoint sits where neither the cream nor the ink family reaches the threshold. Measured
across every candidate:

| Warm tint in the fallback | Min contrast | % of scroll below 4.5:1 |
|---|---|---|
| 0% — pure black/white | 4.503 | 0.00% |
| 1–5% — imperceptible | 4.503 | 0.00% |
| 10% | 4.472 | 0.35% |
| 20% | 4.359 | 1.72% |
| 100% — `#14180F` / `#FBF6EA` | 4.093 | 4.50% |

**Only tints too subtle to see as warm survive the floor.** The original snapping design was far worse —
1.85:1 across 16.6% of the scroll — and shipped because the palette tests checked the seven states as static
endpoints while nothing ever evaluated text against a *moving* background.

### The decision

Text falls back to pure black/white through the crossings **for now**. This is acceptable only because it
appears on an internal preview page that carries text on every screen — the worst possible case.

**Plan 2 must place the two light↔dark crossings where the page has no text on screen** — a full-bleed
photograph, or a quiet gap between movements. The fallback then effectively never fires, and warmth (§9) and
legibility (§11) both hold with no compromise. This is a layout requirement, not a colour one.

Rejected alternatives, with the reason: lightening the dark bookends (removes the problem but softens
opening in near-darkness and closing under a night sky, which is what the whole concept rests on); fading
text out through the crossing (content vanishes mid-sentence, and needs separate handling for reduced-motion
visitors).

**Guard:** `lib/day-surface.test.ts` sweeps 1,001 scroll positions asserting
`contrastRatio(textAt(p), backgroundAt(p)) >= 4.5`. It was confirmed to fail against the old snapping
implementation before passing against the new one. Do not weaken it.

### Residual overlap — MUST FIX IN PLAN 3

Plan 2 moved the crossings into text-free bands, which removed the black/white fallback entirely (minimum
contrast where text is on screen rose from 4.503:1 to **7.098:1**). One residual case remains:

**At 390px width, the `into-the-dark` crossing overlaps the tail of `the-ritual`'s text by ~51px,
measuring 4.46:1 — just below the 4.5 floor.**

The cause is **geometric, not arithmetic.** A crossing band is exactly one viewport tall, so the
photograph fully covers the screen at only a single instant; any transition spread across that band
necessarily begins while the previous band's text still occupies half the viewport. A scroll-progress
formula change was attempted and **made it materially worse** — 2.52–3.55:1 across all three widths, with
three previously-clean boundaries newly overlapping. That change was reverted. Do not attempt another
normalisation fix; the problem is not in the progress calculation.

**The structural fix** is crossing bands of roughly two viewports, with the colour sweep confined to the
middle portion where only the photograph is on screen. Measured consequences at Plan 2's weights:

| Option | Light share | Page length | Blocker |
|---|---|---|---|
| Plan 2 as shipped | 70.21% | 13.4 screens | the 4.46:1 case |
| Crossings doubled | 67.59% | 15.4 screens | breaks the ≥70% rule (§9) |
| Doubled + dark bands trimmed | 70.87% | 14.7 screens | `mahua-falls` then overflows: 639px box, 728px content |

**Client decision, 3 Aug 2026: defer to Plan 3.** Reasoning: Plan 3 rewrites every movement's copy, which
changes each band's content height, which forces a weight re-tune regardless. Solving this against
placeholder prose would mean solving it twice, the second time against different numbers.

**This is a gate on Plan 3, not an observation.** Plan 3 must re-tune the weights with real copy in hand
and close this case, verifying `contrastRatio >= 4.5` at 390, 768, 1440 and 1920 px — not only in the unit
sweep, which tests the timeline in isolation and cannot see rendered overflow.

**Related trap, same root cause:** band heights are `min-height`, a floor rather than a ceiling. Content
taller than its box makes the band grow, which detaches rendered height from `weight` and desynchronises
the light from the content. This has already been hit twice — once at 390px width, once at viewport
heights ≤667px. Any copy or layout change must re-measure band content against its weight-derived box.

---

## 11. Verification

Automated tests cannot tell you whether a page feels expensive. Therefore:

- **Tested properly:** the tiger state machine. Walk → sit → idle → doze → wake is pure logic running on
  timers, and breaks in ways that are not visible by looking.
- **Measured:** Lighthouse against hard budgets — **hero < 200 KB, first load < 2.5s on 4G**, plus
  accessibility and SEO scores. If an effect cannot hit budget, the effect loses.
- **Contrast-checked independently at all seven light states.** Text colour changes seven times as you
  scroll; this is a real trap in this design and must be verified, not assumed.
- **Judged by eye:** the real page run at 390 / 768 / 1440 / 1920 px, screenshotted and shown. No claiming
  it works without showing it working.
- **Reduced-motion pass:** every animation has a defined still state.
- **Alt text on every image.** The current site has none on 22 of 27 — building fresh, we get this right by
  default.

---

## 12. Open questions

| # | Question | Owner | Blocking? |
|---|---|---|---|
| ~~Q1~~ | ~~Distance from Mahua Vann to Turia Gate~~ — **RESOLVED 1 Aug 2026: 5 km.** See warning below. | — | Closed |
| Q2 | Will a photography/video shoot be funded? | Client | No — D10 assumes not; shot list will inform the decision |
| Q3 | Current TripAdvisor rating and two or three approved guest quotes for movement 6 | Client | No — placeholder until supplied |

> **⚠️ Data-quality warning arising from Q1.** The client confirmed the true distance is **5 km**. Both
> existing sources were wrong: the Master Brand Record says 4 km, and the live site plus both HTML mockups
> say 3 km. Since the Master Brand Record is designated the single source of truth that all copy, OTA
> listings and B2B materials inherit from, **an error there propagates everywhere.** Correcting it is
> outside this project's scope but should be raised with the brand owner. Treat other hard numbers from
> either source (room counts, acreage, drive times) as worth verifying rather than trusted.

---

## Source documents

All in `h:\Mahua-Vann\` (parent of this repo):

- `Mahua_Resorts_Master_Brand_Record.md` — **single source of truth** for brand, voice, properties, philosophy
- `01_Mahua_Website_Analysis_and_Observations.docx` — audit of the current site
- `02_Mahua_Website_Feedback_and_Improvements.docx` — recommended fixes
- `03_Mahua_Priority_Action_Roadmap.docx` — phased plan
- `04_Mahua_Benchmark_Brands_and_What_to_Copy.docx` — the ten benchmark sites
- `mahua-home-v1-forest.html`, `mahua-home-v3-fieldguide.html` — prior static mockups
- `mahua-brand-guidelines-v1-forest.html`, `-v3-fieldguide.html` — palette and type systems
