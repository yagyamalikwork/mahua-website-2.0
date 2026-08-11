# Task 6 — site navigation: verification and evidence

10-11 Aug 2026. Every figure below is re-derivable with the command shown; none is transcribed from memory
or a screenshot. Server: `npm run build && npx next start -p 3100`, a fresh process for every measurement
pass — a stale server, and a build clobbering `.next` under a running one, have both produced fictional
numbers on this project before (the second one happened during this very task; see §6).

**Working tree at the start of this task was clean** (`git status` — nothing to commit, no other session's
uncommitted work present), so nothing here is contaminated by a concurrent home-page session. This task's
own commits are the only changes reflected in these figures.

**Fix round 1 (11 Aug):** a reviewer found the glass-wash derivation write-up did not reproduce under its
own stated method, and asked whether the wash needed to move at all rather than just accepting the first
number that passed. Both are addressed in §3 below and in `docs/DECISIONS.md` §16: the derivation is
corrected (a luminance fit, not a per-channel one, is what actually reproduces the shipped figure), and two
variants were measured — the glass now ships at **97%** with gold regions (Variant B, solved by binary
search, not 98%), with an ink-region alternative at the **original 82%** (Variant A) recorded but not
applied, for the client to choose between. Every figure below reflects that corrected, final state; the
files with a `-variant-a-ink` or `-variant-b-gold` suffix are the side-by-side comparison.

## Contents

| File | What |
|---|---|
| `home-density.json`, `vann-density.json`, `tola-density.json` | Empty space per chapter, non-negotiable #8 |
| `home-contrast.json`, `vann-contrast.json`, `tola-contrast.json` | Worst-pixel contrast for every run of type over a photograph, including the new `menu · …` probes, measured on the **shipped build (Variant B, 97% wash, gold regions)** |
| `{home,vann,tola}-contrast-variant-a-ink.json` | The same probes against **Variant A** (region label in ink, wash left at 82%) — measured and recorded, not shipped |
| `_weakened-glass-40pct-watch-fail.json` | The deliberately-broken build (glass wash forced to 40%) — evidence the new probe genuinely fails |
| `home-rule-in.json`, `vann-rule-in.json`, `tola-rule-in.json` | The sliding hairline: coverage, travel, keyboard, both surfaces |
| `header.json` | The header's two states, both routes' worth of behaviour, re-run clean after a build-race contaminated the first attempt (§6) |
| `menu.json` | `check_menu.mjs`, rewritten for `SiteMenu`: scroll lock, the three places, focus trap, real route navigation |
| `leaf-cursor.json` | `check_leaf_cursor.mjs`, confirming the `site-menu` selector fix |
| `js-budget.json` | First-load JS, via `npm run verify:budget` |
| `home-{390,768,1440,1920}.png` | Full-page home route |
| `mahua-{vann,tola}-{390,768,1440,1920}.png` | Full-page property routes (`capture_property_pages.mjs`) |
| `menu-{home,mahua-vann}-{390,1440}-variant-a-ink.png` | The menu open, Variant A (ink regions, 82% wash) |
| `menu-{home,mahua-vann}-{390,1440}-variant-b-gold.png` | The menu open, Variant B (gold regions, 97% wash) — **shipped** |
| `footer-{home,mahua-vann,mahua-tola}-{390,1440}.png` | The page foot, viewport only — booking bar and footer, past the welcome screen's 2.1s |
| `header-{320,390,768,1440,1920}-{top,scrolled}.png`, `w{390,1440}-menu-open.png` | `check_header.mjs` / `check_menu.mjs`'s own evidence frames (the latter shows Variant B, the shipped state) |

---

## 1. The four rig gaps, three of them unnamed by the plan

The plan's own brief named two files to fix (`check_rule_in.mjs`, `check_contrast_over_photos.mjs`). Reading
the other two rigs that reference the old menu found real breakage in both, plus one gap the plan did not
mention at all:

- **`scripts/check_menu.mjs`** asserted against a chapter list (seven `href="#id"` anchors) that no longer
  exists. Rewritten for `SiteMenu`: three places, real routes, `aria-current`, the hamburger's
  `aria-label`/`aria-expanded`, and the focus-trap/Escape/inert/scroll-lock machinery, which is unchanged
  from `ChapterMenu` and still asserted the same way. Added: a real-navigation check (the current page's own
  link is a same-page no-op that still closes the menu; a different place's link performs a genuine browser
  navigation, since the links are plain `<a href>`).
- **`scripts/check_leaf_cursor.mjs`** selected `[aria-controls='chapter-menu']` for its "warms over a link"
  probe. One-line fix to `site-menu`.
- **`scripts/check_rule_in.mjs`** checks 2-5 and 6 probed the hamburger itself for a hairline it correctly
  does not carry (`data-rule="none"` — it is a non-text control). Retargeted at
  `#site-footer a[href='/mahua-vann']`, a real text link present on every route with no menu to open first.
  The keyboard check now Tab-hunts from a fresh load rather than assuming "first Tab" — the footer link is
  dozens of stops deep, not one.
- **Stale comments naming the old component** in `BrandMark.tsx`, `StickyHeader.tsx`, and
  `check_rule_in.mjs`'s own check-1 comment — corrected.

All four now run clean against the shipped build (§3, §4).

## 2. A fifth gap the rigs themselves didn't have a name for

Re-running `check_rule_in.mjs` after the rename surfaced a nonsensical number: check 7's "menu overlay"
luminance delta read **231,251,768.592** — clearly wrong, though it happened to sit comfortably over the
0.15 floor either way, so it was never a false pass on a broken rule. Its `parse()` helper assumed every
computed `background-color` comes back as `rgb(R, G, B)` with 0-255 integers; `.site-menu-glass`'s
`color-mix(in srgb, …)` serialises as CSS Color 4's `color(srgb R G B / A)` with **0-1 floats**, and
splitting `"0.945098"` at its decimal point handed the ratio calculation a "channel" of 945098. Fixed by
parsing both formats explicitly. Re-run: `home-rule-in.json`'s check 7 now reads **0.774** for the menu
overlay, a real and sane number.

## 3. The measurement pass, and a real accessibility failure it found

`node scripts/measure_density.mjs --url http://localhost:3100/{,mahua-vann,mahua-tola} --out …`
`node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/{,mahua-vann,mahua-tola} --out …`
`node scripts/check_rule_in.mjs --url http://localhost:3100/{,mahua-vann,mahua-tola} --out …`

The contrast rig gained the brief's `pre: "menu"` capability (`measure()` opens the panel over `run.at`
before collecting boxes, and closes it again on every exit path so a later probe in the same page is never
measured behind a leftover full-viewport overlay) and two new probes per route: the ink place-labels
(`min: 3`) and the gold `--accent-text` region labels (`min: 4.5`, the region span's own `data-contrast`
hook — the class-selector the brief first proposed matches nothing, since the colour is set inline via a
CSS custom property, not a class).

**The first run found a real failure**, on the page as it had shipped: the region labels ("Pench", "Tadoba")
read **3.43-3.55:1 against their 4.5:1 floor**, over the hero's own darkest patch showing through the
glass's 82% wash. This is exactly what the spec had promised would be measured and never was — no earlier
probe in this file had ever looked at type over a translucent surface.

**The fix took three attempts, and a fix round on this task corrected both the number and the story around
it.** A first pass reverse-solved the photograph pixel from a single rendered composite, forward-solved a
"minimum" of 94%, and shipped 95% for margin — rebuilt and re-measured, it read **4.40-4.44:1, still short**.
A second pass fit two *real* rendered composites (82% and the failed 95%) instead of one modelled point and
shipped 98%, which measured 4.62-4.66:1 — a real, passing number. **What was wrong was the write-up, not the
number**: the comment claimed a per-channel RGB fit of those two points predicted 98%'s result, and a
reviewer's independent check of that exact method got 4.97, not 4.65. What actually reproduces the shipped
figure to within 0.002 is fitting the two composites' *scalar relative luminance* linearly, not their RGB
channels separately — full arithmetic, and an honest statement of why the luminance fit works empirically
without being more theoretically justified, in `docs/DECISIONS.md` §16.

**The same fix round asked a question the first pass skipped: was 98% forced at all?** The only failing run
was the *gold* region label; the *ink* place-labels cleared even the original 82% by a wide margin
(6.02-6.17:1), so the gap was never a legibility problem with the glass itself, only with gold on it. Two
variants were measured rather than one shipped by feel:

| Variant | Wash | `menu · place over frost` | `menu · region over frost` |
|---|---|---|---|
| Shipped originally (rejected in this fix round) | 98% | 8.19-8.26 | 4.62-4.66 — PASS, but more opaque than needed |
| **A — region label set to ink, not gold** | 82% (unchanged) | 6.02-6.48 | **6.09-6.63 — PASS with large margin** |
| **B — region label stays gold, wash solved to its minimum** | **97%** | **8.08-8.16** | **4.55-4.61 — PASS with sensible margin** |

Variant B's 97% was reached by binary search against real rebuilds, not a round number: 96% measured 4.49
(FAIL), 96.5% measured 4.52 (margin too thin to trust), 97% measured 4.55-4.60 across all three routes and
four widths. **Variant B (gold, 97%) is what shipped** — closer to the already-approved design — and
Variant A's numbers are recorded as the alternative on the table, not applied: it is a real, visible design
choice (ink loses the gold accent that distinguishes a region from a place name everywhere else on the site,
but reads far closer to the client's own "Liquid Glass" brief) that the client should see both screenshots
of and choose, not one this task should make for him. The `@supports not (backdrop-filter)` fallback stays
at 99%, unchanged, still the more opaque of the two paths. Full working for both variants, including the two
wrong turns before Variant B, in `docs/DECISIONS.md` §16 and in `.site-menu-glass`'s own comment in
`app/globals.css`.

**Cost:** even Variant B's 97% reads less see-through than the 82% wash the client's brief was written
against — see §8 for what it looks like now, and for Variant A's noticeably more transparent alternative.
Not yet put back to the client the way the forest tint's strength was, because clearing the floor is a hard
accessibility requirement rather than a taste trade; flagged in DECISIONS.md as worth a look, with both
variants ready to show.

**Every other run passed at every width, both properties, throughout every attempt** — the ink
place-labels were never in danger, and nothing else in either probe set regressed. Final state, all three
routes, Variant B (shipped):

| Route | Widths | Failures | Missing targets |
|---|---|---|---|
| `/` | 390/768/1440/1920 | 0 | 0 |
| `/mahua-vann` | 390/768/1440/1920 | 0 | 0 |
| `/mahua-tola` | 390/768/1440/1920 | 0 | 0 |

## 4. Density (unaffected by the glass fix — a CSS custom property change, not new content)

| Route | Mean empty | Worst screen | Chapters over 45% |
|---|---|---|---|
| `/` | 37.9% | 73.4% (`field-days`/`rooms` join — a screen, not a chapter) | **0 of 12** |
| `/mahua-vann` | 36.5% | 86.5% (`vann-day`/`vann-press`/`vann-invitation` join) | 2 of 8 — `vann-forest` 55.8%, `vann-press` 86.5% |
| `/mahua-tola` | 32.0% | 72.0% (`tola-day`/`tola-invitation` join) | 1 of 8 — `tola-reserve` 58.0% |

These three over-budget chapters are the same ones `docs/reviews/2026-08-09-property-redesign/README.md`
already reported and reasoned through — the footer adds a mostly-type band at each page's end, and did not
move any chapter's own score. **Not re-tuned**, per the brief: a chapter newly failing would mean something
moved that should not have; nothing did.

## 5. Rule-in, header, menu, leaf cursor, JS budget

`node scripts/check_rule_in.mjs` — **PASS, 0 failures, all three routes.** Coverage 18 (home) / 22 (vann) /
19 (tola) links and text controls, all carrying `rule-in` or an explicit `data-rule` opt-out. The footer's
"Mahua Vann" link (the new probe target) travels over 400ms, completes at scaleX 1.000, reaches the same
state by keyboard after 8/12/9 real Tab presses depending on the route, and the menu-overlay luminance delta
now reads 0.774 (§2).

`node scripts/check_header.mjs --port 3100` — **PASS, 0 failures**, all five widths, both header states, the
emblem turn, reduced motion, no-JS, and the reload-mid-page crossfade check. (Its first run under this task
returned 15 nonsensical failures — `rgb(0, 0, 238)` link-blue, a 1781px header, sideways scroll — because it
ran concurrently with `verify:budget`'s own internal `npm run build`, which rewrites `.next` while
`check_header` was mid-request against the still-running port-3100 server. Not a page defect: killed the
server, rebuilt cleanly, restarted, re-ran alone. §6.)

`node scripts/check_menu.mjs` — **PASS, 0 failures.** Scroll lock holds across all four configurations
(1440/390 × normal/reduced-motion): wheel blocked while open, keyboard blocked while open, both restored on
close. The panel holds exactly 3 places at the three real routes, the current one marked, focus lands on
"Close" on open, the trap wraps at both ends across 4 focusables. Real navigation: clicking the current
page's own link is a same-page no-op that still closes the menu; clicking another place's link performs a
genuine browser navigation (`/` → `/mahua-vann` confirmed at both 390 and 1440px).

`node scripts/check_leaf_cursor.mjs` — **PASS, 0 failures**, including "it warms over something interactive"
against the hamburger via the corrected `[aria-controls='site-menu']` selector.

`npm run verify:budget` — **PASS.** 159 KB untouched (9 files), 203 KB after scroll (11 files) — unchanged
from the figure Tasks 1-5 shipped, as expected: this task added no client-side script, only a rewritten rig,
a CSS custom-property value, and one `data-contrast` attribute.

## 6. The one contamination this task caused, and how it was found

Running `check_header.mjs` against the already-serving port-3100 build **concurrently** with
`verify:budget` — which does its own `npm run build` internally — corrupted the response `check_header`
was reading mid-request: the rebuild was rewriting `.next/` while the running `next start` process was
reading compiled assets from it. The symptoms (browser-default link-blue `rgb(0, 0, 238)`, a header
computed at 1781px tall, `document.documentElement.scrollWidth` reading 2760 at a 768px viewport) are the
signature of a page that partially loaded its own CSS/JS and fell back to unstyled defaults — not a defect
in the shipped page. Confirmed by killing the server, rebuilding once (no concurrent build), restarting, and
re-running `check_header.mjs` alone: clean PASS, 0 failures, identical to every other measurement in this
task. **Lesson for the next session touching this build pipeline: never run `npm run build` (including
inside `verify:budget`) at the same time as a rig is measuring an already-running server on the same
directory**, even though `verify:budget` uses its own port — the collision is in the shared `.next/`
directory, not the port.

## 7. Watching the probe fail

`.site-menu-glass`'s wash was temporarily forced to 40%, the build re-run, the server restarted, and
`check_contrast_over_photos.mjs` re-run at 390px against it:

```
menu · place over frost  floor 3    worst 2.29   FAIL
menu · region over frost floor 4.5  worst 1.29   FAIL
```

Both menu probes go red — proof the new capability genuinely can fail, not only that it happens to pass.
Restored to shipped (Variant B, 97%), rebuilt, re-measured clean (§3). Artefact:
`_weakened-glass-40pct-watch-fail.json`.

## 8. The eyes — screenshots, looked at

`node scripts/capture_property_pages.mjs --port 3100 --out …`, plus a short Playwright script in the same
style for the home route and for the menu opened at 390/1440 on `/` and `/mahua-vann`, plus targeted
viewport captures at the very foot of all three routes (past the welcome screen's 2.1s — see the note
below).

- **The glass at 390px is legible in both variants, and looks meaningfully different between them.**
  `menu-home-390-variant-b-gold.png` (shipped, 97%): "PENCH" and "TADOBA" keep their gold, and a faint
  warmth is visible where the first-ship 98% was flatly solid, but the hero photograph itself is not really
  perceptible behind the panel. `menu-home-390-variant-a-ink.png` (82%, recorded not applied): the hero's
  soft blurred greens and warm tones genuinely show through the cream, and at 1440px
  (`menu-home-1440-variant-a-ink.png`) a faint gold shape from the header's own pill is visible through the
  glass behind "CLOSE" — this is the "Liquid Glass" character from the client's own brief. Both variants:
  "WHERE NEXT" and "CLOSE" in gold/ink small caps, "Home" as the dimmed current row, and the lodge cards all
  read cleanly. Worth a look before the client sees either, per DECISIONS.md §16.
- **The hamburger is visible in both header states.** `header-390-top.png`: three cream hairlines over the
  dark hero photograph, beside the cream wordmark and the gold pill. `header-390-scrolled.png`: the same
  three hairlines now in dark ink on the cream bar. Both legible, both consistent with the wordmark's own
  colour change.
- **The lodge cards crop sensibly at 112px** (the narrowest of `MENU_CARD_SIZES`'s three steps). Vann's card
  shows the lodge's ochre facade with two urns and a rangoli in the doorway; Tola's shows its pond and
  thatched roofline through foliage — both read as real, specific photographs rather than an indistinct
  crop, at every width captured (390 through 1920).
- **The footer reads as a colophon, not a marketing band**, on all three routes: cream on the deeper
  `--surface`, small-caps labels in gold, hairline rules, four blocks (Places, both lodges' contact, the
  office) stacking to one column at 390px without collision. `footer-{home,mahua-vann,mahua-tola}-390.png`
  and their 1440px counterparts.
- **The booking bar is genuinely absent over the footer**, on both property routes, at both widths captured
  — confirmed with a targeted viewport screenshot scrolled to the document's end, not inferred from a
  full-page capture (which mishandles `position: fixed` elements). No trace of `PropertyBar` in any of the
  four `footer-mahua-{vann,tola}-{390,1440}.png` frames.
- **A false alarm, corrected before it became a finding.** The first attempt at the footer screenshots
  (before a 2.6-second wait was added) showed what looked like the client's flower-and-wordmark logo
  interposed between the two lodges' contact blocks — alarming, since `SiteFooter.tsx`'s own source has no
  such element. It was the **welcome screen** (`WelcomeScreen.tsx`, mounted on every route in
  `app/layout.tsx`, `position: fixed`, gone at 2.1s per `lib/motion.ts`'s `WELCOME`) still mid-fade when the
  page was captured too soon after navigation. Re-captured with a 2.6s wait past `networkidle`: clean, no
  such element, as §8's footer findings above describe. Recorded here because it is the same lesson as §6 in
  smaller clothes — a wrong-looking result from this task's own instrument, not the page.

## 9. Closed by the client, 11 Aug — and what shipped after this review

**The glass question below is answered.** The client chose **Variant A** — *"Lets go ahead with Option A and
if in case we need to change it later we can do that."* Ink type on the 82% wash; the binary-searched 97% is
kept on record only as the number to return to if gold text ever comes back to the panel. Implementing it
took one thing this review had not covered: Variant A's figures were measured *before* the "Where next" hint
had a probe, so shipping it with that hint still gold would have moved the failure rather than fixed it.
**Option A means every text run in the panel is ink.**

**He then asked for four more changes the same day**, all shipped in `80e7ddd` and verified against this
same rig set:

1. **The lodge tiles are side by side and much larger** — half the panel each, ~650px at 1440 against the
   208px thumbnail, stacking full-width below 640px.
2. **They lift toward the pointer** — 8px, a real 2.5° `rotateX`, shadow in `--overlay`; movement removed
   and shadow kept under `prefers-reduced-motion`.
3. **A hairline bug he found**: `.rule-in`'s `-0.28em` offset is 14px on a 51px display name and cut through
   the region label. Fixed in pixels, because the fault was the offset scaling with the font while the gap
   under it did not.
4. **The Website Directory is `PALETTE.brand` (#7F5C24)**, the wordmark brown from his logo — the site's one
   dark band and a deliberate exception to non-negotiable #3. Every colour inverted: `--dim` is 1.1:1 there
   and `goldText` 2.0:1, so cream (5.02:1) and the deeper paper (4.58:1) carry it, guarded by
   `lib/palette.test.ts` as a third surface.

**A rig was found blind while checking (3) and (1)** — see §2 #39 in `DECISIONS.md`.
`check_image_resolution.mjs` reported "0 under-served" at five viewports on the build whose menu `sizes` had
just been rewritten: the tiles are gated behind `everOpened` and the rig only scrolled, so it had never seen
them. It opens the menu now — **39 images became 41**, all clear.

**Re-verified after all four: 398 tests, build, lint, `verify:budget` 159 KB unmoved, contrast on all three
routes at four widths (6.04–6.43:1 on the menu), and the menu, rule-in, leaf-cursor and image-resolution
rigs green.**

## Open

- Nothing from this task. Everything it touched is closed: all three routes' rigs green, 398 tests, JS
  budget unchanged, and the three chapters over the density ceiling are the same pre-existing ones
  `docs/reviews/2026-08-09-property-redesign/README.md` already reported — untouched by this task.
- Still with the client, from earlier work: the density trade on those three chapters, Tola's room count
  (12 vs 14), and a Nagpur distance. `docs/DECISIONS.md` §5.
