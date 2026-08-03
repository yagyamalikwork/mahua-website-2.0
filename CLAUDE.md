# Mahua Resorts — Website 2.0

New home page for **Mahua Resorts**, a family-run boutique wildlife lodge brand in central India.
Replaces a monotone WordPress template site. Concept: **a dense, image-led journey in chapters** — cream
throughout, in the layout language of [thesujanlife.com](https://thesujanlife.com/), rendered in a
hand-drawn field-guide idiom.

> **Read these three, in order, before doing any work:**
> 1. [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) — where we are, what came before, what the client has
>    said, and what is still owed. **Start here.**
> 2. [`docs/superpowers/plans/2026-08-03-rebuild-chapters-layout.md`](docs/superpowers/plans/2026-08-03-rebuild-chapters-layout.md)
>    — the current plan. Overrides the original spec where they conflict.
> 3. [`docs/reference-sujan-layout.md`](docs/reference-sujan-layout.md) — the layout language the client
>    asked us to follow, analysed from the live reference site.
>
> The original spec,
> [`docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md`](docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md),
> still holds for everything the plan doesn't touch — its §3, §4.1 and §13 are superseded.

## Status

| | |
|---|---|
| **Phase** | Plan 3, the chapters rebuild, on `feat/chapters-rebuild`. **Tasks 1–7 done.** Day-arc retired, live copy harvested, image library 14 → 35, chapter sequence defined, scroll primitives built and measured, copy written, **and the page built and composed**. Task 7 awaits review. |
| **Working mode** | Solo through Tasks 4–6; Task 7 built by an implementer and **awaiting the reviewer**. Agreed with the client 3 Aug. |
| **Scope** | Home page only. Other pages, booking restyle, CMS wiring are all out of scope. |
| **See it** | `npm run dev` → `/`. Twelve chapters, 32 photographs, 16 screens at 1440×900. |
| **Tests** | 66, all green. `npm test` must stay green before any commit claiming completion. |
| **Evidence** | `docs/reviews/2026-08-04-task-7/` — every chapter screenshotted at 390/768/1440/1920, plus measured contrast, transfer and motion figures. |

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
6. **Budgets beat effects.** Largest image < 200 KB, total page transfer < 1.5 MB, LCP < 2.5s on simulated
   4G. Most traffic is Indian mobile. If a beautiful effect cannot hit budget, the effect loses.
7. **Gold is decorative only.** `gold` (`#BB8F2E`) is for rules, ornaments, the emblem — it measures
   ~2.5:1 on cream and must never carry text. `goldText` (`#7A5C18`) is the legible sibling; use it for any
   text or link that would otherwise sit in gold. Guarded by `lib/palette.test.ts`.
8. **Every screen must carry weight.** No section may render more than ~30% empty space at 1440×900. If a
   section cannot be filled, it is cut or merged — not padded. This is the direct fix for the client's
   "too much empty space" complaint.
9. **Alternate the rhythm.** Never two consecutive text-only screens — a full-bleed photograph or an
   image-led block must sit between them. Enforced mechanically by a test on `content/chapters.ts`, not by
   good intentions.
10. **Only images ≥ 1400px wide may go full-bleed.** Narrower images tiled edge-to-edge is exactly the
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
| `Mahua property logos/` | Client-supplied **vector** logos — real paths, not traced. Emblem is 340 paths / 439 groups, so petals and leaves already separate |
| `public/media/` | 34 curated images, 17 of them `fullBleedSafe`. **Distinctness is guarded by perceptual hash** — four pairs turned out to be the same photograph under two ids on 4 Aug |
| `reference/video-stills/` | Frames harvested from the client's property video — the petal table, the bonfire, the hammocks. 1920px, so all three go full-bleed |
| `reference/wp-media/` | ~56 images from the live site (30 MB) — crawl + media API |
| `reference/mockup-media/` | 31 images extracted from the prior HTML mockups — **better curated than the live site's** |
| `reference/docs-text/` | Plain text of the four strategy/audit documents |
| `reference/wp-pages/` | Crawled HTML of the current site — **git-ignored; regenerate locally** |
| `scripts/` | The crawl/extract scripts — rerun to refresh reference material |
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
npm run dev      # local dev server
npm test         # vitest
npm run build    # production build — must pass before any commit claiming completion
npm run lint
```

Reference material (already run; rerun only to refresh):

```bash
python scripts/crawl_site.py           # crawl live site pages + imagery they use
python scripts/fetch_wp_media.py       # WordPress media library via its API
python scripts/extract_mockup_imgs.py  # pull images out of the prior HTML mockups
python scripts/extract_docx.py         # plain text of the strategy documents
```

## Verification

Do not claim work is done without showing it — **verify by running the page, not by asserting it works.**
Run the real page, screenshot at 390 / 768 / 1440 / 1920 px. Automated tests cannot judge whether a page
feels expensive, but every mechanical rule above (rhythm, full-bleed eligibility, contrast, palette) is
covered by a test and must stay green. Lighthouse against the budgets in non-negotiable #6.
