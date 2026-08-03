# Mahua Resorts — Website 2.0

A new home page for [Mahua Resorts](https://www.mahuaresorts.com/) — family-run boutique wildlife lodges at
the gates of **Pench** and **Tadoba**, in central India's tiger country.

The concept: **a dense, image-led journey in chapters** — full-bleed photography alternating with compact
cream content screens, cream throughout, rendered in a hand-drawn field-guide idiom. Earlier builds moved
the background through a day's light from dawn to night; that scroll-driven colour system was retired on
3 August 2026 (see Status below) in favour of chapters, closer to the brand's own field-guide idiom and to
[thesujanlife.com](https://thesujanlife.com/), which the client named as the layout reference.

Replaces a WordPress template site that the brand describes as *"monotone"* and *"very text heavy."*

## Status

**Rebuilding as chapters, on `feat/chapters-rebuild`.** The client rejected the day-arc build: too few
images, no perceptible scroll animation, too much empty space, no resemblance to the reference site. Plan 3
(`docs/superpowers/plans/2026-08-03-rebuild-chapters-layout.md`) retires that colour system for a fixed
cream palette (`lib/palette.ts`) and a chapter rhythm — full-bleed photographic screens alternating with
compact cream ones, sized to their content rather than to a share of a colour timeline. `/`, the actual home
page, is currently a placeholder single heading; the full chaptered page is built in that plan's Task 7.

## Start here

| | |
|---|---|
| **The approved spec** | [`docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md`](docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md) — §3, §4.1 and §13 are superseded by Plan 3 |
| **The current plan** | [`docs/superpowers/plans/2026-08-03-rebuild-chapters-layout.md`](docs/superpowers/plans/2026-08-03-rebuild-chapters-layout.md) |
| **Working notes for AI sessions** | [`CLAUDE.md`](CLAUDE.md) |
| **See it running** | `npm run dev`, then visit `/` — currently a placeholder heading; the real page lands in Plan 3 Task 7 |

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · GSAP + Lenis (scroll and motion) · Vitest + Testing
Library (unit tests) · ESLint · Vercel · Sanity (later)

## Running it

```bash
npm install       # install dependencies
npm run dev       # start the dev server at http://localhost:3000
npm test          # run the test suite (vitest)
npm run build     # production build
npm run lint      # eslint
```

Once the dev server is running:

- `/` is currently a placeholder heading. The chaptered page it becomes is built out in
  `docs/superpowers/plans/2026-08-03-rebuild-chapters-layout.md`, Task 7.

## Reference material

`reference/` holds imagery and page HTML pulled from the current live site, plus photographs extracted from
earlier design mockups. Regenerate any of it with:

```bash
python scripts/crawl_site.py           # live site: pages + the imagery they use
python scripts/fetch_wp_media.py       # WordPress media library via its API
python scripts/extract_mockup_imgs.py  # photographs embedded in the prior HTML mockups
python scripts/extract_docx.py         # plain text of the strategy documents
```

The brand strategy documents themselves live in the parent folder, outside this repository.
`Mahua_Resorts_Master_Brand_Record.md` is the single source of truth for brand, voice and property detail.
