# Mahua Resorts — Website 2.0

A new home page for [Mahua Resorts](https://www.mahuaresorts.com/) — family-run boutique wildlife lodges at
the gates of **Pench** and **Tadoba**, in central India's tiger country.

The concept: **the scroll is a single day at the lodge.** You begin in the dark forest before dawn, the day
opens into warm light, and you close under the night sky — rendered throughout in a hand-drawn field-guide
idiom.

Replaces a WordPress template site that the brand describes as *"monotone"* and *"very text heavy."*

## Status

**Foundation built; the real home page is not yet built.** The colour system that drives the whole scroll
concept (`lib/palette.ts`, `lib/day-surface.ts`), the copy module (`content/home.ts`), and the core motion
primitives (smooth scroll, scroll reveal, parallax, film grain, the continuously bleeding day/night
background) are implemented and covered by tests. `/preview/light-states` is a working demo of the full
seven-state scroll, and is the best way to see the concept running today. `/`, the actual home page, is
still a minimal holding page — the full sectioned, photographed page described in the spec has not been
built yet.

## Start here

| | |
|---|---|
| **The approved spec** | [`docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md`](docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md) |
| **Working notes for AI sessions** | [`CLAUDE.md`](CLAUDE.md) |
| **See it running** | `npm run dev`, then visit [`/preview/light-states`](http://localhost:3000/preview/light-states) |

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

- `/` is the current holding page.
- [`/preview/light-states`](http://localhost:3000/preview/light-states) is the seven-panel scroll demo —
  the concept described above, actually running. This is the page to look at.

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
