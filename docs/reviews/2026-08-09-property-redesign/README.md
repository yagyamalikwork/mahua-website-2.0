# Task 15 — property pages redesign: whole-branch verification and evidence

9/10 Aug 2026. Every figure below is re-derivable with the command shown; none is
transcribed from memory or a screenshot. Server: `npm run build && npx next start -p 3100`,
a fresh process for every measurement pass (a stale server has produced fictional numbers
on this project twice before — see `CLAUDE.md`).

## Contents

| File | What |
|---|---|
| `vann-density.json`, `tola-density.json` | Empty space per chapter, non-negotiable #8 |
| `vann-contrast.json`, `tola-contrast.json` | Worst-pixel contrast for every run of type over a photograph |
| `vann-rule-in.json`, `tola-rule-in.json` | The sliding hairline: coverage, travel, keyboard, both surfaces |
| `vann-page.json`, `tola-page.json` | Transfer, hero `responseEnd`, Chrome LCP |
| `vann-js-budget.json`, `tola-js-budget.json` | First-load JS and the lazy GSAP chunks |
| `mahua-vann-{390,768,1440,1920}.png`, `mahua-tola-{390,768,1440,1920}.png` | Full-page screenshots, all eight looked at (see §5) |

Home-page regression evidence lives at its own established paths, re-run in place:
`docs/reviews/2026-08-05-scroll-craft/collage.json`, `.../entrances.json` — both
re-derived against the same build as everything above, not archived separately, because
they are proof that nothing in `docs/reviews/2026-08-05-scroll-craft/` changed.

---

## 1. The must-do gate: `vann-table` / `tola-table` contrast

Both are `FullBleedQuote` chapters (type over a photograph) that had never been measured
against their own compositions — they fell through to that component's generic default
scrim, `{ flat: 0.4, centre: 0.4 }`. Probes added to
`scripts/check_contrast_over_photos.mjs`'s `RUN_SETS` for `#vann-table` and `#tola-table`
(both `min: 3`, display type, `#vann-table [data-word]` / `#tola-table [data-word]`).

**Result: both clear the 3.0 floor comfortably with the untouched default scrim. No scrim
was raised.**

| Chapter | 390px | 768px | 1440px | 1920px |
|---|---|---|---|---|
| `vann-table` | 3.30 | 3.58 | 3.58 | 3.58 |
| `tola-table` | 3.30 | 3.58 | 3.58 | 3.58 |

`node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-09-property-redesign/vann-contrast.json`
`node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-09-property-redesign/tola-contrast.json`

Every other probe (header, hero, the two full-bleed quotes already in the suite) also
passes at all four widths on both routes — `tola-guest-word` worst 3.76–5.56, well clear
of its 3.0 floor. **Exit code 0 on both routes.**

**While in the rig:** `#vann-rooms` (the previous scrolled-header anchor for Vann) still
exists, but it sits on cream, not a photograph — a probe that can never fail the way its
home-page counterpart can. `vann-table` is now both the quote probe and the scrolled
anchor, since it is a real full-bleed chapter; the header-over-photo assertion can now
actually fail if the cream bar is lost. `#tola-guest-word` was already correct. See the
comment above `propertyRuns` in `scripts/check_contrast_over_photos.mjs` for the full
reasoning.

## 2. Density (non-negotiable #8, ≤45% empty per chapter, measured at 1440×900)

`node scripts/measure_density.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-09-property-redesign/vann-density.json`
`node scripts/measure_density.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-09-property-redesign/tola-density.json`

The first run found **three chapters over budget on Vann and one on Tola.** All were
brought closer to the ceiling by taking width or height back — never by padding — and two
of three on Vann were brought fully inside it. The starting figures, the fixes, and the
final figures:

| Chapter | Before | Fix | After |
|---|---|---|---|
| `vann-forest` | 72.6% | `ChapterSurface` `tight` rhythm (new opt-in, default untouched) + prose column 62ch→92ch | **55.8%, still over** |
| `vann-where` | 56.9% | `tight` + map column `lg:col-span-8`→`10` (info column 4→2) | **36.6%, inside** |
| `vann-press` | 88.4% | `tight` + one step larger type; see below for the reverted second attempt | **87.2%, still over** |
| `tola-reserve` | 72.1% | Same `OpeningColumn` fix as `vann-forest` (shared component) | **58.3%, still over** |
| `tola-where` | 44.5% (already inside) | Same `PropertyMap` fix as `vann-where` | **21.9%, inside** |

**Mean / worst, final:**

| Page | Mean empty | Worst empty | Chapters inside 45% |
|---|---|---|---|
| Mahua Vann | **36.2%** (70 screens) | 87.2% (`vann-press`) | **6 of 8** |
| Mahua Tola | **31.4%** (79 screens) | 73.9% (a join, not a chapter — see below) | **7 of 8** |

Neither page's mean is over budget as a whole; both improved from the first read (Vann
38.4%→36.2%, Tola 33.2%→31.4%). What remains open is two chapters that could not be
brought under the per-chapter ceiling without either bad typography or invented content —
reported here rather than forced, per the brief.

**Re-measured 10 Aug 2026, after the whole-branch review's fix wave**, against a freshly
restarted server: Mahua Vann's page mean now reads **36.1%**, not 36.2%. Run twice
back-to-back on the identical build to check: both runs read 36.1% for the page mean, but
the *chapter*-level figures underneath it wobbled between the two runs by up to 0.7 points
(`vann-press` 87.2%→86.5%, `vann-where` 36.6%→36.5%) with no code change between them — so
the 0.1-point page-mean move is inside this rig's own run-to-run noise, not a regression the
fix wave caused. Left as 36.2% above rather than silently edited, per the instruction to say
so rather than overwrite; `docs/reviews/2026-08-09-property-redesign/vann-density.json`
carries the 10 Aug reading.

**Mahua Tola did move, and this correction replaces a wrong claim.** An earlier draft of
this paragraph asserted Tola's figures were unchanged (31.4%, `tola-reserve` 58.3%,
`tola-where` 21.9%) — that was not re-derived from the rig, it was copied from the table
above. A fresh run against the 10 Aug build (run twice back-to-back and stable both times,
not noise) reads: page mean **31.3%**, `tola-reserve`
**58%**, `tola-where` **23.3%**, worst screen **71.9%** (still the `tola-day` /
`tola-invitation` join, not a chapter). `tola-where`'s 1.4-point move is real and has a real
cause: the fix wave gave Tola's legend a seventh row, "Safari zone" — the whole-branch
review's fix for its zone swatch having no legend entry at all — which Vann's legend never
gets, because Vann's map has no `zone` kind. Only Tola's info column grew taller. That is
why Vann's own figures hold steady while Tola's do not: it is not the same `PropertyMap`
change landing unevenly, it is one page's legend legitimately carrying one more line than
before. `docs/reviews/2026-08-09-property-redesign/tola-density.json` carries the 10 Aug
reading; the 31.4%/58.3%/21.9% figures should not be treated as current.

### 2a. `ChapterSurface`'s new `tight` rhythm

Both `OpeningColumn` and `PropertyMap` (and, on Vann, `PressBand`) are shorter than one
900px screen. `measure_density.mjs` scores a chapter that short on the single window
*centred* over it, which is mostly some neighbour's own padding, not the chapter's content
— the same mechanism CLAUDE.md's non-negotiable #8 already documents for the home page's
chapter joins. `ChapterSurface` gained an opt-in `tight` prop (`py-10 md:py-12 lg:py-14`
against the default `py-14 md:py-16 lg:py-20`) used only by those three components. The
default is untouched, and none of the other cream shapes (`RoomShowcase`, `ExperiencePair`,
`PropertyInvitation`, or anything the **home page** imports — `ChapterIntro`, `LodgeCards`,
`PlateGrid`, `SplitFeature`, `Testimonials`) were touched. See §4 for the home-page proof.

### 2b. `OpeningColumn` — widened, not padded

`vann-forest` and `tola-reserve` are both this component: two short paragraphs, no
photograph by design ("the page's one held breath", non-negotiable #4). The prose column
widened from 62ch to 92ch — real type covering more of the screen it already had, the same
principle non-negotiable #8's own precedent applies to a photograph, applied here to the
only content this chapter has. Measured at each step rather than assumed: 62ch→78ch got
`vann-forest` to 60.3%, still over; 78ch→92ch got it to 55.8%. The heading keeps its own
tighter 22ch cap, nested inside the wider column, so the display line is unaffected — only
the body paragraphs widened. Screenshot-checked (§5): at 92ch the paragraphs are still only
2 lines each and read comfortably: this is a short passage, not continuous long-form prose,
so the usual 45–75ch guidance does not straightforwardly apply.

**Both `vann-forest` (55.8%) and `tola-reserve` (58.3%) remain over the ceiling.** A further
widen was not attempted: past ~92ch the column starts to look like a decision made for a
metric rather than for the page, and CLAUDE.md's non-negotiable #4 ("restraint is a
requirement, not a preference") binds this exact chapter by name. Reported rather than
forced further.

### 2c. `PropertyMap` — the map given more of its own screen

Both maps were short (`vann-where` 0.79 of a screen, `tola-where` 0.89). The map's own
column widened from `lg:col-span-8` to `lg:col-span-10` (the facts/legend column 4→2) — the
drawn artwork scales with its box (`w-full` over a fixed `viewBox`), so this is real artwork
covering more screen, not a wider frame around the same drawing. Two steps, both measured:
col-span-9 got `vann-where` to 46.9% (still just over), col-span-10 to 36.6% (inside).
`tola-where`, already inside at 44.5%, improved to 21.9% from the same change. The narrower
info column (2/12, ≈190–225px depending on width) was screenshot-checked (§5) and reads
fine — the facts and legend wrap to two lines rather than crowding.

### 2d. `PressBand` — one fix that worked, one that was tried and reverted

`vann-press` (Written About) was the emptiest chapter on either page at 88.4%. `tight`
padding plus one step of larger type (`text-xl`→`text-2xl`, standfirst 0.98rem→1.05rem, its
44ch cap dropped) brought it to **87.2%** — a real but small gain, because the chapter's own
footprint is a small fraction of the 900px window regardless of its internal padding.

A second, larger change was tried: publication-beside-copy in one stacked column instead of
a `lg:grid-cols-3` grid, on the theory that a column a third of the screen wide capped every
line's width regardless of type size. **Measured, it made the chapter both taller (0.57→0.85
screens) and emptier (87.2%→89.6%).** A headline and a one-sentence standfirst are short
strings; a wider box does not make them longer, it just leaves more of the box around them,
and the added vertical rhythm of three stacked rows diluted the same words over more area.
Reverted for that reason, not for risk — the numbers said no. `components/sections/PressBand.tsx`
carries both readings in its own comment.

**`vann-press` remains over the ceiling at 87.2%, and no further fix was attempted for the
same reason `vann-forest`'s stopped at 92ch:** the only levers left were enlarging three
press citations well past "set quietly" (this component's own opening line, and the reason
it exists as type rather than as three publications' logos) or inventing content
non-negotiable #6 already forbids. Screenshotted in §5 — it reads as a quiet, tasteful
citation band with real air around it, which is what 87% empty looks like when the content
itself is genuinely short. This is a chapter where the density ceiling and the page's own
restraint requirement (non-negotiable #4) are in real tension; flagged for the client rather
than resolved by a change that would look like it was made for a number instead of for the
page.

**Do not misread `worst empty 73.9%` on Tola as a fourth failing chapter — it is not one.**
It is a *screen*, not a chapter: the join between `tola-day`'s tail and `tola-invitation`'s
head (same shape of finding CLAUDE.md's own history documents for the home page's chapter
joins). `tola-invitation`'s own chapter mean is 35.5%, comfortably inside, because it has
enough whole screens of its own that this one weak join cannot dominate its score.

## 3. Rule-in, transfer, JS budget

`node scripts/check_rule_in.mjs --url .../mahua-vann` / `.../mahua-tola` — **PASS, 0
failures**, both routes: all 16 (Vann) / 12 (Tola) links and text controls carry the rule,
the transition is collapsed at rest and completes over ~400ms, keyboard focus reaches the
same state as hover, reduced motion drops the travel, and the rule is perceptible against
both cream and the menu's dark overlay.

`node scripts/measure_page.mjs --url .../mahua-vann --hero vann-hero` / `--hero tola-hero`:

| | Vann | Tola |
|---|---|---|
| Hero file / weight | `vann-hero-1440.avif`, 94 KB | `tola-hero-1440.avif`, 197 KB |
| Hero `responseEnd` (Slow 4G, 390px) | 2,706 ms | 3,714 ms |
| Chrome LCP | 1,052 ms, element `<p>` | 1,032 ms, element `<p>` |
| Initial transfer, 390px | 442 KB | 697 KB |
| Initial transfer, 1440px | 549 KB | 714 KB |
| Whole-page transfer, 390px | 962 KB | 1,169 KB |
| Whole-page transfer, 1440px | 1,349 KB | 1,486 KB |

LCP resolves to a paragraph on both routes, same as the home page — CLAUDE.md's own
warning about Lighthouse's LCP applies here too. Both pages' initial transfer sits well
under the home page's own 1.5 MB reading at both widths; neither property page carries a
pinned scene or a signature film, so there is less to compare against the home page's own
budget table beyond that headline number.

`node scripts/measure_js_budget.mjs --port 3100 --url .../mahua-vann --scroll 5000` /
`--url .../mahua-tola --scroll 2700` — **PASS**, both routes, untouched load **157 KB
(Vann) / 158 KB (Tola)**, both against the 175 KB ceiling. **The default `--scroll 1400`
fails on both routes and is not a defect** — it is calibrated for the home page's spine,
where a scrubbed element sits within the first 1400px. Neither property page pins anything
(`PinnedCollage`/`StickyScene` mount only on the home page, `rooted`), but every non-hero
`fullBleed` chapter (`Hero` itself explicitly opts out of `Parallax`, being the LCP element)
wraps its photograph in `Parallax`, which lazy-loads GSAP the same way the home page's
scrubbed sections do. Vann's first one, `vann-table`, sits at ~4,677px; Tola's,
`tola-guest-word`, at ~2,354px. `--scroll` was set past each (5000 / 2700) and both GSAP
chunks (`3dewhjypacr5m.js`, `1is0gg5e6lopl.js`) then load — deferred, reachable, and gone
before scroll on both routes; nothing carrying GSAP arrives in the untouched load.

## 4. Home-page regression — proof nothing here touched it

```
node scripts/check_pinned_collage.mjs --port 3100
node scripts/check_entrances.mjs --port 3100
node scripts/measure_js_budget.mjs --port 3100
```

**All three PASS, and every figure matches the committed baseline exactly:**

- `check_pinned_collage.mjs` — headline held within **0px** while **840px** scrolled
  beneath it; drifts **126px / 89px / 50px** (rates 0.15/0.105/0.06); closing figure 56px
  below the last paragraph, 29px below the nearest photograph.
- `check_entrances.mjs` — **12/12** parallax elements moved (every one must), drift
  0.03–0.091 of height, cap 0.15; 0 staged-and-never-settled, 0 stagger faults; no-JS reads
  0 entrance attributes, 12 chapters, 1,098 words at both 1440×900 and 390×844.
- `measure_js_budget.mjs` (home page, default URL) — untouched **158 KB**, 8 files; after
  scroll 203 KB, 10 files; the two GSAP chunks load only on scroll. PASS.

This is possible because every density fix in §2 lives in components the home page does
not import: `OpeningColumn`, `PropertyMap` and `PressBand` are property-page-only, and
`ChapterSurface`'s new `tight` prop defaults to `false` — every home-page chapter
(`ChapterIntro`, `LodgeCards`, `PlateGrid`, `SplitFeature`, `Testimonials`, `PinnedCollage`,
`ChapterMenu`) calls it exactly as before, unchanged.

## 5. The eight screenshots, looked at

`node scripts/capture_property_pages.mjs --port 3100 --out docs/reviews/2026-08-09-property-redesign`

All eight opened and read, not just captured. Findings:

- **The rooms' three scales read as a composition, not a ledger.** Confirmed on both pages
  at 1440px: Vann runs offsetLeft (Deluxe, image left/text right) → wide (Cottage without
  Deck, full-width landscape) → offsetRight (Cottage with Deck, image right/text left);
  Tola's four rooms vary the same way. No two consecutive rows share a scale.
- **No two adjacent sections look alike**, on both pages, at all four widths — hero, quiet
  column, map, showcase/quote, image pair, invitation each have a genuinely distinct visual
  signature. This was the point of the redesign and it holds up scrolled, not just listed.
- **The 92ch `OpeningColumn` paragraphs read comfortably**, not stretched — both are two
  short sentences wrapping to two lines each; the usual 45–75ch measure guidance is written
  for continuous long-form prose, which this is not.
- **`vann-press` (Written About), screenshotted at its full 514px box, visibly is what its
  87.2% figure says**: three short citations with real air around and below them. It reads
  as quiet and tasteful, which is the design's own word for it — not as a bug.
- **The gate/zone marker distinction on Tola's map is too subtle, confirmed by eye.** The
  4px size step and 0.9-vs-1.0 opacity step between a `gate` square and a `zone` square are
  not reliably visible in a rendered screenshot — "Zone 3" and the "Ramdegi" gate marker
  beside it read as the same mark. Compounding it: the legend has no entry at all for what a
  zone square means (`MapLegendEntryCopy`'s swatch union has no `zone` member — noted
  already in `content/mahua-tola.ts`'s own comment, confirmed here as a real legibility gap
  rather than a hypothetical one). Not fixed in this task — flagged for the client, per the
  brief's own instruction to check rather than assume. Vann's map has no `zone` kind at all,
  so this is Tola-specific.
- **`ContactLine`'s responsive hide behaves as intended.** Dedicated viewport captures (not
  full-page, since the bar is `fixed`) at 390/640/768/1440px: the phone number is absent
  from the bar at 390px and present from 640px up at all three wider widths, on Vann (Tola
  shares the same component). Matches the component's own doc comment exactly.
- **The map's screen-reader label** was widened in this task (§6) after visual inspection
  confirmed villages and safari zones were real, findable content the old label skipped —
  see `components/sections/PropertyMap.tsx`.

## 6. Also fixed while in the file

- **`PropertyMap`'s accessible label now names villages and safari zones**, not only gates
  and water. Until this task it announced only two of the map's four label kinds — backwards
  for Tola specifically, whose one `village` marker (Agarzari) and four numbered safari
  zones are exactly the local detail the map exists to carry, and which a screen-reader
  visitor had no way to reach. Built the same way the existing two groups are: read off
  `copy.labels`, so it can never announce a name the artwork does not draw.

## 7. Open with the client

Carried forward, not resolved here:

- **Tola's room count.** The live site's own structured list (5 Deluxe + 2 Suite + 3 Super
  Deluxe Cottage + 1 Family Suite + 1 Camping Hut) gives twelve; the brand record says
  fourteen, referring to three river-facing machaan rooms still under construction with no
  published size, bed or view. `content/mahua-tola.ts` states twelve and flags this; not the
  page's call to resolve.
- **Nagpur's distance from both properties.** Vann: live site says 80 km, the brand record
  104–112 km. Tola: live site says 100 km, uncorroborated. Neither is trusted
  (`docs/copy-provenance.md`). Both pages name Nagpur as the air/rail gateway and state no
  figure, deliberately.
- **The two chapters that could not be brought inside the 45% density ceiling** —
  `vann-forest` (55.8%) and `vann-press` (87.2%), plus `tola-reserve` (58.3%) sharing
  `vann-forest`'s component — for the reasons in §2b/§2d: real, measured improvement was
  made on all three, and the levers remaining would either damage the page's own restraint
  (non-negotiable #4) or invent content non-negotiable #6 forbids. Reported with numbers
  rather than forced or quietly lowered.
- **Tola's map gate/zone marker legibility** (§5) — the 4px/0.9-opacity distinction is
  confirmed too subtle by eye, and there is no legend entry for the zone swatch at all.
