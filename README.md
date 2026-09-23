# Mahua Resorts — the website, as plain files

**This branch contains the finished website and nothing else. There is no TypeScript here, no
source code, and no build step.** Copy these files to your web root and the site is live.

To download it: **Code → Download ZIP**, with this branch (`Evolve-Dev-static`) selected.

---

## Why the other branch looked wrong

If you opened `Evolve-Dev` and saw `.ts` files, that was our mistake in pointing you there — that
branch holds the *source* we edit. **TypeScript is a build-time language. It is compiled to ordinary
JavaScript before the site is published and never reaches a server.** The files in this branch are
the compiled result.

Nothing here runs on your server. There is no Node.js, no Python, no TypeScript, no server-side
rendering and no database. Your server only has to send these files to a browser, exactly as it
would for any hand-written HTML site. Your .NET and SQL stack is unaffected because nothing in this
site touches it.

## What is in here

| Type | Files | Size |
|---|---:|---:|
| HTML | 6 | 793 KB |
| CSS | 1 | 64 KB |
| JavaScript | 16 | 774 KB |
| Images (`.avif`, `.webp`, `.jpg`, `.png`) | 680 | 43.9 MB |
| Fonts (`.woff2`) | 10 | 261 KB |
| Video (`.mp4`) | 2 | 1.3 MB |
| Data (`.txt`, used for page-to-page navigation) | 28 | 1.1 MB |
| Icons (`.ico`) | 2 | 3 KB |
| **Total** | **745** | **48.2 MB** |

Each photograph exists at eight sizes so a phone downloads a small one. A visitor loads roughly
670 KB on a phone and 970 KB on a desktop — not the whole folder.

## The pages

| URL | File |
|---|---|
| `/` | `index.html` |
| `/mahua-vann/` | `mahua-vann/index.html` |
| `/mahua-tola/` | `mahua-tola/index.html` |
| `/robots.txt` | `robots.txt` |
| any unknown URL | `404.html` |

URLs are folders containing an `index.html`, which is what every web server already serves by
default. **No URL rewrite rules are needed** — that was deliberate.

---

## Two things before you go live

### 1. `web.config` is included, and on IIS you need it

**IIS returns 404 for file extensions it does not recognise**, and older installs do not recognise
`.avif`, `.webp` or `.woff2`. That is 630 of the 745 files here. Without the included `web.config`,
the pages will load and **every photograph will be missing**. Copy it to the web root with
everything else.

### 2. Search engines are blocked in this build

Every page carries `noindex, nofollow` and `robots.txt` says `Disallow: /`, because this site has
been a private preview. **If you publish it as-is, Google will not index it.**

This is compiled into the HTML, so it cannot be changed on the server — it needs a rebuild with one
environment variable set. **Tell Mahua Resorts before you go live and we will send you a build with
indexing enabled**, or you can produce one yourself (see below). It is worth confirming timing with
them first: the existing WordPress site is still live, and two indexed copies of the same business
compete in search.

---

## Optional: rebuilding it yourself

Only if you want to change content. Node.js 20.9+, from the `Evolve-Dev` branch:

```bash
npm ci
npm run build          # writes ./out — the contents of this branch
```

To enable search indexing:

```bash
set NEXT_PUBLIC_ALLOW_INDEXING=true && npm run build     # Windows
```

## Optional: caching and compression

```
/_next/static/*   Cache-Control: public, max-age=31536000, immutable
*.html            Cache-Control: no-cache
```

Enable gzip or brotli for `.html`, `.css` and `.js`. Do **not** re-compress `.avif`, `.webp`, `.jpg`
or `.mp4` — they are already compressed and it costs CPU for nothing.

---

## One external dependency

The guest reviews section loads a Tripadvisor widget from `elfsightcdn.com` in the **visitor's**
browser. Your server does not need outbound internet. It is configured in Mahua Resorts' own
Elfsight account, not in these files. If it is blocked, the rest of the page is unaffected.

Everything else — fonts included — is served from your own server. No Google Fonts, no analytics, no
trackers.

## Not included

- A **Journal / blog page** was designed but not built. It needs entries, comments and uploads,
  which means a database and an admin area — it cannot be part of a static site like this one.
- **Booking** is not wired up. The Book buttons link out to the existing AsiaTech booking engine.
- **A CMS.** Changing text means a rebuild. If the client needs to edit copy without a developer,
  that is separate work.

---

Questions about any of it — ask, and we will answer directly rather than guessing at your setup.
