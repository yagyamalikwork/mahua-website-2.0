# The property pages — evidence

`/mahua-vann` and `/mahua-tola`, built 8–9 Aug 2026 under
[`docs/superpowers/plans/2026-08-08-property-pages.md`](../../superpowers/plans/2026-08-08-property-pages.md).

**This directory holds two generations of evidence, and the difference between
them is the story.** The first execution pass (8 Aug, run by a session that had
silently fallen back to a smaller model) committed `/mahua-vann` as "verified"
while its own committed artefacts showed the verification failing: the density
JSON had three chapters over the 45% ceiling and a page mean of 45.8%, and the
contrast JSON was the output of a rig run that **exited non-zero** — seven of
its probes are `pass: null` because the rig only knew the home page's section
ids, and its "scrolled header" figures were measured on a page that never
scrolled (the missing anchor fell through to a silent no-op). Everything below
is the 9 Aug re-derivation, on instruments that were first made able to fail.

## The figures, re-derived 9 Aug 2026

Every number comes from a script in `scripts/`; re-run any of them against a
production build to reproduce it.

| | `/mahua-vann` | `/mahua-tola` | rule |
|---|---|---|---|
| Chapters inside the 45% empty ceiling | **6 of 6** | **7 of 7** | non-negotiable #8 |
| Page mean empty | 43.7% | 36.2% | (home page: 40.1%) |
| Worst screen | 69.7% (a join) | 70.6% (a join) | home's worst join: 73.4% |
| Initial transfer, 390px | **550 KB** | **868 KB** | < 1.5 MB |
| Initial transfer, 1440px | **843 KB** | **1055 KB** | < 1.5 MB |
| Pre-scroll JS, 1440×900 | **158 KB** — PASS | **158 KB** — PASS | 175 KB budget |
| Contrast probes | 36/36 pass, 4 widths | 40/40 pass, 4 widths | 3.0 display / 4.5 body |
| Rule-in | PASS (11/11 covered) | PASS (11/11 covered) | every link ruled or opted out |

- `vann-density.json` / `tola-density.json` — `measure_density.mjs`
- `vann-contrast.json` / `tola-contrast.json` — `check_contrast_over_photos.mjs`, now route-aware
- `vann-rule-in.json` / `tola-rule-in.json` — `check_rule_in.mjs`
- `vann-page.json` / `tola-page.json` — `measure_page.mjs` (transfer, motion, overflow)
- `vann-js-budget.json` / `tola-js-budget.json` — `measure_js_budget.mjs`
- `mahua-{vann,tola}-{390,768,1440,1920}.png` — `capture_property_pages.mjs`, all eight looked at by eye

## What the 9 Aug correction round changed, and why

1. **Density.** The first build failed the ceiling in five places
   (`vann-experiences` 64.4%, `vann-rooms` 60.3%, `vann-field-notes` 79.5%,
   `tola-rooms` 53%, `tola-field-notes` 84.6%). Fixed compositionally, never
   with filler: the rooms card grid became full-width alternating bands (one
   band per photograph, room types honestly grouped); the field notes gained
   the sibling-lodge banner and lost 120px of join cream; Vann's experiences
   went from two plates to a 2×2 board; Tola's dining went back to its one
   full-width plate after measurement showed two half-width plates carry
   *less* imagery than one whole one.
2. **Photography.** A second sweep of the live pages' own `data-image`
   attributes found five usable photographs the first fetch missed — Vann's
   pool, the tiger banner, the Family Suite interior among them — and the
   live rooms-tab mapping disproved the spec's claim that the Family Suite
   had no photograph. Five alts described photographs they were not
   (`tola-hero`'s said "lodge grounds" over a candlelit dinner for two;
   `tola-tiger-safari`'s said "vehicle" over three resting tigers). Every
   image on both pages has now been looked at, and captioned as what it shows.
3. **The hero swap.** Tola's hero is now the lodge across its lily pond at
   dusk (DSC00044); the candlelit dinner (TWD5337) closes `/mahua-vann` as
   the "Looking for Tadoba instead?" banner. The headline "Tadoba, raw and
   close to the gate" no longer sits on a honeymoon dinner. One line in each
   dial to reverse.
4. **Instruments.** `check_contrast_over_photos.mjs` refuses unknown routes
   and counts a missing scroll anchor as a fatal miss; `check_rule_in.mjs`
   finds a resting rule wherever it lives; GSAP's loader now waits for the
   first scrolled pixel (`components/motion/scrub.ts`), which is what kept
   201 KB of pre-scroll JS from becoming the property pages' norm — measured
   back to 158 KB, with the home page's pin and entrances re-verified intact.

## Open with the client

- **Tola's room count** — the pages say twelve (the live site's own
  structured list); the brand record says fourteen with three machaans under
  construction. Unresolved, deliberately (`docs/copy-provenance.md`).
- **The home page's `suite-tiger-painting` caption** now reads "A cottage…"
  — the live site's filename for that photograph is `Cottage-with-deck-2`
  and Vann's rooms index names it Cottage with Deck; one site must not call
  one photograph two rooms. Needs the client's nod.
- **The Tola hero swap** (point 3 above) — flagged for review, reversible.
- **"By air or train — Nagpur"** appears with no distance on both pages:
  every published Nagpur figure disagrees (80 vs 104–112 km for Vann), so
  the row names the city and claims no number until the client confirms one.
