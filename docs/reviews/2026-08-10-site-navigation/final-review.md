# Final whole-branch review — site navigation plan (2026-08-10)

Reviewed 11 Aug 2026 against `docs/superpowers/plans/2026-08-10-site-navigation.md`, the ten-commit diff
(`ac1ad18..9ea3582`, plus the docs commits `e611039`/`e6a0789`/`319b35c` that the diff's path scoping
excluded), `docs/DECISIONS.md` §2 and §16, and CLAUDE.md's non-negotiables. Method: every derivation in the
record was re-run from its own stated inputs; every guard in the diff was asked what it would still pass
against if the feature were broken; the gates were re-run, not trusted.

**Verdict: changes requested — narrowly.** No code defect, no constraint breach, no behavioural finding.
Both Task 6 fixes are substantively verified. What remains are two committed-record corrections, both the
catalogued defect shape (§2: a record that does not reproduce or does not match the shipped value), one of
them *inside the passage written to fix exactly that*. Each is a one-line edit.

---

## 1. The two Task 6 fixes, re-verified

### Fix 1 — the §16 derivation (commit `e6a0789`): **verified, with one residue (finding I-1)**

I re-ran the arithmetic from §16's own two data points (82% → `[202,191,174]`, 95% → `[225,216,198]`),
independently, with the WCAG luminance formula:

| Quantity | §16 says | Re-derived |
|---|---|---|
| L(goldText `#7A5C18`) | 0.11858 | 0.11858 ✓ |
| L(82% composite) | 0.52874 | 0.52874 ✓ |
| L(95% composite) | 0.69197 | 0.69197 ✓ |
| Luminance fit @ 98% | L = 0.72963, contrast 4.625 | 0.72963, **4.6248** ✓ (rendered 4.62–4.66) |
| Per-channel fit 82→95 @ 98% | `[230,222,204]` → 4.65 "by luck" | `[230,222,204]` → 4.6466 ✓ |
| Luminance fit @ 97% | (shipped) | 4.5503 — matches rendered 4.55–4.60 ✓ |
| Luminance fit @ 96.5% / 96% | (recorded 4.52 / 4.49) | 4.5130 / 4.4758 — consistent ✓ |

The corrected narrative reproduces. The luminance fit predicts the 98% rendered result to within 0.04 and
independently corroborates all three binary-search measurements, and §16's honesty clause — that the fit is
empirically reliable rather than theoretically justified, since `color-mix()` blends RGB — is present and
correct. The rig script used for this re-derivation is
`C:\Users\yagya\...\scratchpad\verify16.mjs`-style ten lines anyone can retype from §16's table.

**The residue:** §16's counter-example does not reproduce from its own stated inputs. Line 816 claims the
per-channel fit on the **95%→100%(cream)** segment "predicts a visibly different `[235,226,208]`-ish
composite and a **4.97:1**". The composite is right — `[234.6, 226.2, 208.2]` — but its contrast against
goldText computes to **4.844**, not 4.97. 4.97 reproduces instead from the **82%→100%** segment
(per-channel 4.941; luminance 4.963). The passage's thesis survives either way — 4.84 ≠ 4.65 ≠ anything
rendered, so segment choice really does swamp the effect — but the specific number is attributed to the
wrong segment, in the record *and* in `app/globals.css`'s copy of it (lines 353–354). A derivation that
does not reproduce is this project's most-catalogued defect; this one sits inside the fix for the last one.

### Fix 2 — the wash solved to its minimum (commit `9ea3582`): **verified**

- `app/globals.css:381` ships `color-mix(in srgb, var(--bg) 97%, transparent)`; the no-`backdrop-filter`
  fallback at `:391` is 99%, still the more opaque path; `prefers-reduced-transparency` still goes fully
  solid. Fail ordering intact.
- The committed evidence matches that CSS. All three routes' contrast JSONs were re-measured **after** the
  97% change (measuredAt 21:03–21:08 UTC, i.e. between the code fix and the `e6a0789` evidence commit):
  `menu · region over frost` worst 4.55–4.61 across all routes and all four widths — consistent with the
  luminance fit's 4.550 prediction for 97%, and *not* with 98% (4.62–4.66) or 82% (3.43–3.55). The JSONs
  could not have been produced by any build other than the shipped one.
- The minimum is supported, not merely asserted: 96% FAIL (4.49) and 96.5% too-thin (4.52) are recorded in
  §16/README without committed JSON artifacts, but both are corroborated to two decimals by the
  reproducible fit above and are re-derivable with one rebuild each. The probe itself is proven able to
  fail: `_weakened-glass-40pct-watch-fail.json` shows both menu probes red (2.29 and 1.29) against a
  40%-wash build.
- Variant A (ink regions, 82%) is measured, screenshotted, recorded in §16, and **not applied** — correctly
  left as the client's design call, per the give-the-number rule.

---

## 2. Findings

### Important

**I-1 — A figure in the corrected §16 still does not reproduce.** `docs/DECISIONS.md:816` and
`app/globals.css:353-354` attribute 4.97:1 to the per-channel 95%→100% segment; that segment computes to
4.844 from the record's own composite, and 4.97 belongs to the 82%→100% segment. One-line correction in
two places (or drop the specific number and keep the segment-dependence point, which is true).

**I-2 — The contrast rig's own comment points at a superseded wash value.**
`scripts/check_contrast_over_photos.mjs:62` says `.site-menu-glass`'s comment "carries the full working for
why it is **95%** now". The shipped wash is 97%; 95% is the recorded *failed* first attempt (4.40–4.44:1).
A future session trusting the instrument's own pointer lands on a number that measurably fails — the exact
record-vs-shipped drift `e6a0789`'s message claimed was fully purged ("no remaining reference").

### Minor

- `app/globals.css:46` and `:134` — two comments still name `ChapterMenu`, deleted by this plan; the
  README's stale-comment sweep (§1) named three files and missed this one.
- `scripts/check_rule_in.mjs:102` — the retargeting comment overclaims: "check 1's coverage still confirms
  it opts out". The hamburger carries no `data-rule` and check 1's text filter
  (`textContent.trim().length > 0`) never sees a text-free control — it is *exempt*, not confirmed.
- `js-budget.json` (measuredAt 20:12 UTC) predates the last two code commits (20:34, 21:24 UTC); the
  shipped client bundle differs by one `data-contrast` attribute on `SiteMenu`. Immaterial to the 175 KB
  budget (159 KB measured), but the committed artifact is one build behind the tree it sits beside.
- The menu's "Where next" hint is goldText over the same glass but sits in the panel's top strip, outside
  `MENU_RUNS`' probed boxes; at 97% wash only 3% of the photograph shows through, so exposure is small, but
  the hint is the one goldText run on the glass no probe reads.
- `content/site.test.ts` omits the "British forms" check the plan's file table promised (nothing in `SITE`'s
  current copy is at risk; the promise is simply unkept).
- The SiteFooter import-graph walk resolves only `@/` specifiers; a *relative* value import (`./x`)
  appearing in the walked tree would be skipped silently. Today every import in that tree is `import type`
  (verified file by file), so there is no live hole — but the walk fails open, not closed, on that shape.

---

## 3. What was probed for the catalogued defect shape, and held

Each new guard was asked: *what would this still pass against if the feature were broken?*

- **The zero-JS footer guard** (`components/ui/SiteFooter.test.tsx`) — the directive check is line-anchored
  (`/^\s*['"]use client['"]\s*;?\s*$/m`), so `PropertyContact.tsx`'s doc-comment sentence 'No `"use
  client"`' does not trip it; it walks value imports recursively, skips `import type` (erased at compile
  time, cannot reach the runtime tree), and names the offending chain on failure. Watched failing per
  `fe3c021`'s message — the naive substring version *did* flag the doc comment when the walk first reached
  the file, which is how the anchor got there. A `"use client"` landing in `content/site.ts` or either
  property dial would now fail this test; the single-file grep alone would not have.
- **`check_menu.mjs`** drives behaviour, not configuration: real wheel turns and key presses against
  `window.scrollY` for the lock; a real click on the current place asserting the URL did *not* change and
  the panel went inert; a real click on the other place asserting a genuine browser navigation landed on
  `/mahua-vann` (menu.json confirms, both widths). It now aggregates failures from semantics and navigation
  into the exit code, where the old version exit-coded only the scroll lock.
- **The menu-over-photograph probes** measure rendered pixels behind glyph boxes (the panel opened first,
  closed again on every exit path), at all four widths including 390 — this rig is not 1440-only. Watched
  failing at a 40% wash.
- **`check_rule_in.mjs`'s `parse()`** was silently mangling CSS Color 4 `color(srgb …)` floats into a
  945098 "channel" (delta 231,251,768) — found by this task, fixed to parse both serialisations, and
  honestly recorded as never-a-false-pass-but-never-a-measurement. The keyboard check Tab-hunts from a
  fresh load instead of hard-coding a stop count.
- **The 390 blind spot** (§2 #29) was answered with eyes, not rigs: I opened
  `menu-home-390-variant-b-gold.png`, `footer-mahua-vann-390.png`, `header-390-{top,scrolled}.png` myself.
  The gold "PENCH"/"TADOBA" small caps are crisp at 390; "Home" reads dimmed as the current row; the cards
  crop to recognisable photographs at 112px; the footer scans as a colophon with no booking bar over it;
  the hamburger is legible in both header states.

Architecture and constraints, checked directly: `SiteMenu` (`"use client"`) imports only hooks,
`next/navigation`, `SmoothScroll` and `content/site` (whose one import is a type) — no `Photo`, no
manifest; the cards render in `SiteHeader` (server, no directive) and enter the DOM only on first open,
with the gating test present. `verify:budget` PASS at 159 KB against 175. No hard-coded colour, duration or
user-facing string in any new component (the two `aria-label`s are chrome naming, sanctioned by the plan);
gold never carries text — the old menu's gold-on-dark hint is now goldText, an improvement; every footer
and menu link carries `rule-in` or `data-rule`, with a rendered test over both; British spelling holds.
`PropertyBar` still fails towards absent (IO-gated, `shown` a test seam) and treats the footer as quiet
ground via a third observer that the extended test drives through both transitions. `lib/sizes.test.ts`
carries the `SiteMenu.card` slot and the 23→24 distinct-string step, read off the suite — this file is in
the working tree and commit `c6fd2af` but absent from the review diff's stat; the diff's path scoping
missed it, not the implementation.

## 4. Gates

`npm test` — **396/396 green** (matches the record's count). `npm run lint` — 0 errors (2 pre-existing
`no-img-element`/anchor warnings, both deliberate and commented). `npm run build` — clean, all four routes
static. Browser rigs were not re-run against a fresh server for this review; every committed JSON was
instead checked for internal consistency, timestamp ordering against the commit sequence, and agreement
with the independently re-derived arithmetic — all three held.

---

## 5. Fixes applied (11 Aug 2026)

All seven items closed, each re-verified rather than assumed. In order:

**I-1 — the §16 counter-example's number, corrected in both places.** `docs/DECISIONS.md:816` and
`app/globals.css:353-354` claimed the per-channel fit on the **95%→100%(cream)** segment predicts 4.97:1.
Re-derived independently (`GOLD_TEXT = [122,92,24]`, `CREAM = [241,233,215]`, the two real composites from
§16's own table — 82% → `[202,191,174]`, 95% → `[225,216,198]`):

- Per-channel fit, 95%→100% segment, extrapolated to 98%: `[225,216,198] + 0.6×([241,233,215]−[225,216,198])
  = [234.6, 226.2, 208.2]`. `L(composite) = 0.766741`, `L(goldText) = 0.118578`. Contrast
  `= (0.766741+0.05)/(0.118578+0.05) = 4.8440:1`. **This is the corrected figure: 4.844:1, on the 95%→100%
  segment.**
- For comparison, re-derived where 4.97 actually belongs: the **82%→100% segment** at 98% gives
  `[236.67,228.33,210.44]` → **4.941:1** per-channel (4.963:1 on the luminance fit) — matching the review's
  finding that 4.97 was attributed to the wrong segment, not invented.

Both files now read 4.844:1 and name the 95%→100% segment explicitly, so a future reader can retype the same
four numbers and land on the same answer in one step. The passage's thesis is unchanged: 4.844 ≠ 4.65 (the
theoretical per-channel fit through 82%→95%) ≠ anything rendered, so which two points you interpolate still
swamps the effect — only the specific number was wrong.

**I-2 — the rig's comment now points at the CSS, not at a value.**
`scripts/check_contrast_over_photos.mjs:62` said "why it is 95% now"; the shipped wash is 97%, and 95% was
the recorded failed attempt. Rewritten to name `app/globals.css`'s `.site-menu-glass` comment as the
authority on the current value, without restating a number that would go stale the next time the wash is
re-solved.

**Minor 1 — `ChapterMenu` renamed to `SiteMenu`** in both `app/globals.css` comments (the `scroll-padding-top`
note and the `header button`/`header span` structural-selector warning). The second comment also had its own
staleness fixed in passing: it still said the panel was "cream type on the dark overlay," which described the
menu this plan replaced — `SiteMenu`'s panel is ink and goldText type on the cream glass wash.

**Minor 2 — `scripts/check_rule_in.mjs:102`'s comment rewritten**, not the check. It no longer claims check 1
"confirms" the hamburger's `data-rule="none"` opt-out; check 1's own coverage filter
(`textContent.trim().length > 0`) excludes a text-free control before it ever gets there, so nothing in the
file reads that attribute off the hamburger. The comment now says what check 1 actually covers and why
probing the hamburger for a *travelling* rule (checks 2-5) fails on correct code.

**Minor 3 — British-spelling test added to `content/site.test.ts`**, mirroring `content/home.test.ts`'s
existing pattern (a `strings()` flatten helper plus a broad American-forms regex) over every user-facing
string in `SITE`: the nav labels, both lodges' labels and regions, and all footer copy (labels, office
address, legal-link labels, copyright line). **Watched it fail**: temporarily changed
`SITE.footer.officeLabel` to `"The office (organize)"`, ran `npx vitest run content/site.test.ts`, got
`AssertionError: American spelling in: "The office (organize)": expected true to be false`, then reverted the
copy and reran to confirm green (5/5 tests passing).

**Minor 4 — the "Where next" hint now has its own contrast probe.** `SiteMenu.tsx`'s hint `<p>` gained
`data-contrast="menu-hint"` (the same hook shape as the existing `menu-region` probe), and
`MENU_RUNS` in `scripts/check_contrast_over_photos.mjs` gained a third run, `menu · hint over frost`, at the
4.5:1 floor non-negotiable #7 sets for goldText. Re-ran the rig against a fresh production build on all three
routes: **the new probe passed everywhere, worst 4.56-4.60:1 across all three routes and all four widths**
(390/768/1440/1920) — consistent with the region label's own 4.55-4.61:1, since both sit in the same top
strip of the same wash. Refreshed and committed `home-contrast.json`, `vann-contrast.json`,
`tola-contrast.json`.

**Minor 5 — `SiteFooter.test.tsx`'s import-graph walk now resolves relative value imports.**
`resolveAtImport` (only `@/`) was replaced with `resolveImportSpecifier`, which also resolves `./`/`../`
specifiers relative to the importing file's own directory (trying `.ts`/`.tsx`, then `index.ts`/`index.tsx`).
**Watched it fail in both directions**: added a temporary `components/ui/__temp_relative_import_probe.ts`
carrying `"use client"`, imported it from `SiteFooter.tsx` as `import { probe } from
"./__temp_relative_import_probe"` — the test failed with `components/ui/SiteFooter.tsx ->
components/ui/__temp_relative_import_probe.ts: carries a "use client" directive: expected true to be false`,
naming the exact chain. Removed the import and the temp file; reran and confirmed green (7/7 tests passing).

**`js-budget.json` refreshed.** `npm run verify:budget -- --out docs/reviews/2026-08-10-site-navigation/js-budget.json`
against a fresh build: **PASS, 159 KB transferred against the 175 KB budget** (measuredAt
2026-08-10T22:03:59.264Z), matching the pre-existing figure — the one `data-contrast="menu-hint"` attribute
this task's own fix added is immaterial at this precision, same as the review's finding about the prior gap.

**Final gates, re-run after every fix above**: `npm test` — **397/397 green** (396 + the new British-spelling
test). `npm run build` — clean, all four routes static. `npm run lint` — 0 errors, the same 2 pre-existing
deliberate `no-img-element` warnings.
