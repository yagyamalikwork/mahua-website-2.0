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

**This is a Node.js project, not a Python one.** There is no `pip install` that will start it — the
installer is `npm`. The only prerequisite is **Node.js 20.9 or newer** ([download it
here](https://nodejs.org/)); `.nvmrc` pins 24 for anyone using `nvm`. Nothing else needs installing, and
the repository carries no environment variables or secrets, so a fresh machine needs exactly this:

```bash
git clone <this repo>
cd website-mahua2.0
npm ci            # install the exact dependency versions from package-lock.json
npm run dev       # start the dev server at http://localhost:3000
```

Use `npm ci` rather than `npm install` on a new machine — it installs the exact versions recorded in
`package-lock.json`, so every computer runs the same build. `npm install` is for when you are deliberately
adding or updating a dependency.

The rest of the commands:

```bash
npm test          # run the test suite (vitest) — currently 222 tests, all green
npm run build     # production build
npm run lint      # eslint
npm run verify:budget   # the JS budget guard, end to end
```

Once the dev server is running, `/` is the finished home page — twelve chapters, 34 photographs, roughly
17 screens at 1440×900.

> **Demo it above 1500px.** The pinned collage on chapter *02 · Rooted like the mahua* needs at least
> 1440px of **layout** viewport, so a Windows laptop at 1440px with a classic scrollbar will fall just
> short and quietly show the unpinned version instead.

### The Python scripts

`requirements.txt` covers only the reference-harvesting scripts in `scripts/` (see
[Reference material](#reference-material) below) — **it does not install the website.** Those five scripts
use nothing but the Python standard library, so `requirements.txt` is deliberately empty and needs no
`pip install` at all. Any Python 3.9+ will run them.

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
