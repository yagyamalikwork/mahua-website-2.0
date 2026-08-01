# Mahua Resorts — Website 2.0

New home page for **Mahua Resorts**, a family-run boutique wildlife lodge brand in central India.
Replaces a monotone WordPress template site. Concept: **the scroll is a single day at the lodge**, dawn to
night, rendered in a hand-drawn field-guide idiom.

> **Read [`docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md`](docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md) before doing any work.**
> It is the approved spec — narrative, palette, interactions, architecture. This file is the map; the spec is the territory.

## Status

| | |
|---|---|
| **Phase** | Spec approved. Implementation not yet started. |
| **Scope** | Home page only. Other pages, booking restyle, CMS wiring are all out of scope. |
| **Next step** | Implementation plan, then the light-states preview page. |

## The non-negotiables

Decided and reasoned through with the client. **Do not relitigate these without being asked to:**

1. **Two properties** — Mahua Vann (Pench) and Mahua Tola (Tadoba). Mahua Bagh is removed from the brand;
   the live site still shows it and is wrong.
2. **Seduce, not convert.** Unhurried and warm, gentle push toward "discover". Not a booking funnel.
3. **The page must stay warm.** Cream/warm paper is the home key, ~80% of page height. Dark is punctuation
   only, always warm-toned (`#232B21`, never cold blue-black). See spec §9 — the client raised this and was
   right.
4. **Restraint is a requirement, not a preference.** Sujan is the benchmark: it reads expensive because it
   holds back. Nothing bounces. If you notice the animation, it is too fast.
5. **The tiger arrives, performs, then dozes.** It is not a permanent fixture — permanent peripheral motion
   contradicts #2 and #4.
6. **Budgets beat effects.** Hero < 200 KB, first load < 2.5s on 4G. Most traffic is Indian mobile. If a
   beautiful effect cannot hit budget, the effect loses.

## Architecture rule

Four files are **dials**. No component may hard-code a colour, a duration, or a string of copy — all three
are imported:

| File | Holds |
|---|---|
| `lib/palette.ts` | The seven light states |
| `lib/motion.ts` | Every duration and easing |
| `content/home.ts` | Every word on the page |
| `lib/tiger/rig.ts` | Tiger skeleton + state machine (art swaps separately) |

Each of the seven movements is a self-contained file that never reaches into another.

## Where things are

| Path | What |
|---|---|
| `docs/superpowers/specs/` | The approved spec |
| `reference/wp-media/` | ~56 images from the live site (30 MB) — crawl + media API |
| `reference/mockup-media/` | 31 images extracted from the prior HTML mockups — **better curated than the live site's** |
| `reference/docs-text/` | Plain text of the four strategy/audit documents |
| `reference/wp-pages/` | Crawled HTML of the current site — **git-ignored; regenerate locally** |
| `scripts/` | The crawl/extract scripts — rerun to refresh reference material |
| `../Mahua_Resorts_Master_Brand_Record.md` | **Single source of truth** for brand, voice, properties, philosophy |
| `../0[1-4]_Mahua_*.docx` | Audit, recommendations, roadmap, benchmark brands |

## Conventions

- **British spelling** in all copy (the current site mixes conventions; the audit flags it).
- Copy is drafted from the Master Brand Record, in the existing brand voice. The client reviews every line.
- Specificity is the brand's luxury — name a gate, a tigress, a tree, a dish. Avoid reaching for adjectives.
- Never reintroduce the phrase "boutique nature resorts in India" as filler; over-repetition is a named
  audit finding.
- Everything decorative (leaf cursor, tiger, butterfly, grain) is `aria-hidden` and has a defined still
  state under `prefers-reduced-motion`.
- Contrast must be checked **independently at each of the seven light states** — text colour changes seven
  times down the page.

## Commands

Nothing is scaffolded yet. Once Next.js is initialised:

```bash
npm run dev      # local dev server
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

Do not claim work is done without showing it. Run the real page, screenshot at 390 / 768 / 1440 / 1920 px.
Automated tests cannot judge whether a page feels expensive — but the **tiger state machine is pure logic
and must be tested properly**. Lighthouse against the budgets above.
