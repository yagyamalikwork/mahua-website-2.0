# Mahua Resorts — the front-end, as plain files

For the team hosting this site. Everything below is about the folder you have been sent (or can build
yourself). **You do not need Node.js, npm, TypeScript, Python or any runtime on your servers.**

> **The built files are on the `Evolve-Dev-static` branch** — that branch holds the finished site and
> nothing else, no source, so *Code → Download ZIP* on it gives a folder that is ready to serve.
> `Evolve-Dev` is the **source** we edit; a partner sent there instead saw `.ts` files and reasonably
> concluded the site would not run on their stack (23 Sep 2026). Point people at the right one.

---

## 1. What this is

Three pages, pre-rendered to HTML at build time:

| URL | File |
|---|---|
| `/` | `index.html` |
| `/mahua-vann/` | `mahua-vann/index.html` |
| `/mahua-tola/` | `mahua-tola/index.html` |
| `/robots.txt` | `robots.txt` |
| any 404 | `404.html` |

Everything else is static assets under `_next/` (CSS, JavaScript, fonts) and `media/` (photographs).

**There is no server-side code, no database, no API and no build step at request time.** Each HTML file is
complete markup — view source and the copy, the headings and the `<picture>` elements are all there.
JavaScript only adds behaviour on top (menu, galleries, scroll effects); the pages read and navigate with
it disabled.

### Contents, measured

| | Files | Size |
|---|---|---|
| HTML | 6 | 793 KB |
| CSS | 1 | 64 KB |
| JavaScript | 16 | 774 KB |
| Images (`.avif`, `.webp`, `.jpg`, `.png`) | 680 | 43.9 MB |
| Fonts (`.woff2`) | 10 | 261 KB |
| Video (`.mp4`) | 2 | 1.3 MB |
| Navigation data (`.txt`) | 28 | 1.1 MB |
| Icons (`.ico`) | 2 | 3 KB |
| **Total** | **745** | **48.2 MB** |

Most of the weight is photographs, served at eight widths each so a phone downloads a small one. A visitor
loads roughly 670 KB on a phone and 970 KB on a desktop, not the whole folder.

**The two `.mp4` files are not referenced by any page in this build** and can be deleted if you want the
1.3 MB back. They are animations used on a different version of the site.

---

## 2. Hosting it

Any static file server. Copy the folder to your web root. Two things need to be true:

### 2.1 A folder must serve its `index.html`

This is the default on IIS, Apache and nginx. URLs are folders (`/mahua-vann/`), so **no URL rewrite rules
are needed** — that was deliberate, to avoid per-route rewrites.

### 2.2 The image and font types must be registered

**This is the one that will bite you on IIS.** IIS returns **404 for file extensions it does not know**, and
older installs do not know `.avif`, `.webp` or `.woff2`. That is 630 of the 745 files. The page would load
and every photograph would be missing.

A `web.config` in the web root fixes it:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <!-- remove first: harmless if absent, avoids a duplicate-entry 500 if present -->
      <remove fileExtension=".avif" />
      <mimeMap fileExtension=".avif" mimeType="image/avif" />
      <remove fileExtension=".webp" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
      <remove fileExtension=".mp4" />
      <mimeMap fileExtension=".mp4" mimeType="video/mp4" />
    </staticContent>

    <defaultDocument>
      <files>
        <add value="index.html" />
      </files>
    </defaultDocument>

    <httpErrors errorMode="Custom" existingResponse="Replace">
      <remove statusCode="404" />
      <error statusCode="404" path="/404.html" responseMode="ExecuteURL" />
    </httpErrors>
  </system.webServer>
</configuration>
```

### 2.3 Caching (optional, recommended)

Everything under `_next/static/` has a content hash in its filename and can be cached permanently. HTML
should not be.

```
/_next/static/*   Cache-Control: public, max-age=31536000, immutable
*.html            Cache-Control: no-cache
```

Compression: enable gzip or brotli for `.html`, `.css`, `.js`. Do **not** re-compress `.avif`, `.webp` or
`.mp4` — they are already compressed and it wastes CPU for nothing.

### 2.4 HTTPS

Required. The reviews widget (§4) is loaded over HTTPS and a mixed-content page will block it.

---

## 3. Building it yourself

Only needed if you want to rebuild after a content change. Node.js **20.9 or newer**.

```bash
npm ci
npm run build      # writes the ./out folder — that is the whole deliverable
```

`npm test` runs 501 tests if you want to check a change before shipping it.

### ⚠ 3.1 Search-engine indexing is OFF in this build

This site has been a private preview until now, so **every page carries `noindex, nofollow` and
`robots.txt` says `Disallow: /`.** If you publish this build as the live site, **Google will not index it.**

To turn indexing on, set an environment variable **at build time** (not on the server — it is compiled in):

```bash
# Windows
set NEXT_PUBLIC_ALLOW_INDEXING=true && npm run build

# Linux / macOS
NEXT_PUBLIC_ALLOW_INDEXING=true npm run build
```

Only the exact string `true` opens it. Confirm afterwards: `robots.txt` should read `Allow: /`, and the
`<meta name="robots">` tag should be gone from the page source.

**Please confirm with Mahua Resorts before enabling this** — the existing WordPress site is still live, and
two indexed copies of the same business compete with each other in search.

---

## 4. The one external dependency

The guest reviews section loads a **Tripadvisor widget from Elfsight** (`elfsightcdn.com`) in the browser.

- It needs outbound internet from the **visitor's** browser, not from your server.
- It is configured in Mahua Resorts' own Elfsight account, not in this code. Styling, which reviews appear,
  and the "Free Tripadvisor Reviews Widget" badge are all changed there.
- It loads only when a visitor scrolls near it, deliberately — it is about 590 KB, and loading it eagerly
  pushed the page over its weight budget.
- If it is blocked or fails, the rest of the page is unaffected.

Everything else — fonts included — is served from your own server. There are no Google Fonts requests, no
analytics and no trackers.

---

## 5. What is not in here

- **A Journal / blog page** was designed but not built. It needs entries, comments and image uploads, which
  means a database and an admin area — **it cannot be part of a static export** and would need building on
  your stack.
- **Booking** is not wired up. The "Book" buttons link out to the existing AsiaTech booking engine.
- **A CMS.** Text lives in the source (`content/*.ts`) and changing it means a rebuild. If the client needs
  to edit copy without a developer, that is a separate piece of work.

---

## 6. Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari), desktop and mobile. `.avif` images fall back to
`.webp` automatically through `<picture>`. Internet Explorer is not supported.

The site has been checked at eight screen shapes from a 360px phone to a 1920px desktop, plus 150% and 200%
browser zoom, and at larger operating-system text sizes.

---

## 7. Questions

Anything about the build, the structure or the assets — ask, and we will answer directly rather than
guessing at your environment.
