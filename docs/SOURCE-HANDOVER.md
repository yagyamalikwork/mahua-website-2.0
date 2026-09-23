# Mahua Resorts — working on the source

For developers taking over or contributing to this codebase. Its companion,
[`STATIC-EXPORT-HANDOVER.md`](STATIC-EXPORT-HANDOVER.md), covers hosting the built output; this one covers
changing it.

---

## 1. The stack, and what it needs

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Tests | Vitest + Testing Library |
| Browser checks | Playwright |
| Node | **20.9 or newer** |

Nothing else. No database, no CMS, no API, no server code. **TypeScript compiles to JavaScript at build
time and never reaches your servers.** The Python files in `scripts/` were used once to crawl the old
WordPress site for reference material and are not part of the build — you can ignore them entirely.

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # writes ./out — the deployable folder
npm test           # 501 tests
npm run lint
```

---

## 2. Where things are

```
app/            routes — page.tsx per page, layout.tsx, robots.ts
components/
  sections/     one component per page section, self-contained
  ui/           shared building blocks (buttons, headings, surfaces)
  motion/       scroll and entrance effects
  property/     the two lodge pages' shared furniture
content/        EVERY WORD ON THE SITE lives here
lib/            palette, motion values, image manifest, helpers
public/media/   photographs, pre-encoded at eight widths each
scripts/        the image pipeline and the browser measurement checks
```

### The one architectural rule

**No component contains a colour, a duration, or a sentence.** All three are imported:

| Where | What |
|---|---|
| `lib/palette.ts` | every colour |
| `lib/motion.ts` | every duration and easing |
| `content/*.ts` | every user-facing string |

This is enforced by tests, and it is what makes a copy change or a colour change a one-line edit in one
file instead of a search across the codebase.

---

## 3. Making common changes

### Changing wording

Edit `content/home.ts`, `content/mahua-vann.ts`, `content/mahua-tola.ts` or `content/site.ts`. Nothing else.
Rebuild.

A full inventory of every string on the site, mapped to the file it lives in, is in
[`WEBSITE-COPY.md`](WEBSITE-COPY.md).

### Changing or adding a photograph

Photographs are **not** referenced directly. They go through a pipeline:

1. Put the original in the folder the script reads.
2. Run `node scripts/build_images.mjs`.
3. It re-encodes every image to eight widths in AVIF and WebP, writes them to `public/media/`, and
   regenerates `lib/media-manifest.ts` with real dimensions and a blur placeholder.
4. Reference the image by its id.

**Do not hand-edit `lib/media-manifest.ts`** — it is generated, and the tests compare it against what is
actually on disk.

Every piece of hand-drawn artwork works the same way: a source file, a `build_*.mjs` script, and a
generated `lib/*-art.ts` the component reads. Replace the source, re-run the script.

### Changing layout

Section components live in `components/sections/` and are self-contained — none reaches into another. The
page order is data, in `content/chapters.ts` and `content/property-chapters.ts`, not JSX.

---

## 4. The constraints, and why the checks exist

This site was built to measured limits agreed with the client, and those limits are enforced by scripts
rather than by good intentions. If a change breaks one, a check fails and tells you which. They are not
decoration — each was written after something shipped broken.

| Limit | Guard |
|---|---|
| First-load JavaScript stays inside budget | `npm run verify:budget` |
| Largest image under 200 KB; initial page under 1.5 MB | `node scripts/measure_page.mjs` |
| Text on a photograph stays legible (measured worst pixel, not by eye) | `node scripts/check_contrast_over_photos.mjs` |
| No section more than 45% empty space | `node scripts/measure_density.mjs` |
| No photograph served smaller than the box it fills | `node scripts/check_image_resolution.mjs` |
| Touch targets, zoom and text scaling across 8 screen shapes | `node scripts/check_responsive.mjs` |
| The palette stays legible | `npm test` |

Most need a production build and a running server first:

```bash
npm run build
npx next start -p 3100
node scripts/<check>.mjs --port 3100
```

**Two checks fail deliberately on this branch and are not bugs:** `check_films.mjs` looks for two
animations that were removed at the client's request, and `check_plates.mjs` looks for a layout that was
replaced. Both are kept because they still describe an older version of the site.

### Things that look broken and are not

- **If nothing animates**, check the operating system before the code. Windows *Settings → Accessibility →
  Visual effects → Animation effects*, off, makes Chrome report `prefers-reduced-motion`, and this site
  then deliberately disables every entrance and scroll effect. It looks exactly like a broken build.
- **`lib/media.test.ts` occasionally times out.** It decodes roughly 200 images from disk. It fails as a
  timeout, never as a wrong value, and passes on a re-run.
- **The reviews section is a third-party widget** (Elfsight) configured in the client's own account, not in
  this code. Its styling and content are changed there.

---

## 5. Shipping a change

```bash
npm test && npm run lint && npm run build
```

Then check it in a browser at phone, tablet and desktop widths — the automated checks cover the mechanical
rules, not whether a page still looks right.

`npm run build` writes `./out`, which is the whole deliverable. See
[`STATIC-EXPORT-HANDOVER.md`](STATIC-EXPORT-HANDOVER.md) for hosting it, including the IIS MIME-type
configuration and the search-indexing switch.

---

## 6. Two things to agree before both teams edit this

1. **Branching.** This branch, `Evolve-Dev`, exists for your work. The other branches carry earlier
   versions and the currently deployed site; please leave them as they are.
2. **Who owns which files.** `content/` (wording) and the section components are the likeliest places for
   both teams to edit the same lines. Worth agreeing up front who changes what.

Questions about any of it — ask. We would rather answer than have you work around something.
