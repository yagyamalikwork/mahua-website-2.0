# Mahua Resorts — Website 2.0

A new home page for [Mahua Resorts](https://www.mahuaresorts.com/) — family-run boutique wildlife lodges at
the gates of **Pench** and **Tadoba**, in central India's tiger country.

The concept: **the scroll is a single day at the lodge.** You begin in the dark forest before dawn, the day
opens into warm light, and you close under the night sky — rendered throughout in a hand-drawn field-guide
idiom.

Replaces a WordPress template site that the brand describes as *"monotone"* and *"very text heavy."*

## Status

**Spec approved, implementation not yet started.** Home page only.

## Start here

| | |
|---|---|
| **The approved spec** | [`docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md`](docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md) |
| **Working notes for AI sessions** | [`CLAUDE.md`](CLAUDE.md) |

## Planned stack

Next.js · TypeScript · Tailwind · GSAP + Lenis · Vercel · Sanity (later)

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
