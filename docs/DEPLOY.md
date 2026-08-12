# Deploying the demo

Written for whoever has to do this next, including a future session. Everything here was verified on
12 August 2026 against a real production build.

---

## Why there is a `demo` branch

**Not** to hold a compiled build — Vercel compiles from source on its own servers, and `.next/` is
gitignored, so `demo` holds exactly the same source as the branch it came from. There is nothing separate
to keep.

It exists for one reason: **Vercel redeploys on every push to the branch it watches, and more than one
session works on this repo.** If the demo pointed at `feat/chapters-rebuild`, somebody's commit could
change or break a live demo mid-presentation. `demo` only moves when a human moves it.

## Publishing a change to the demo

Work on `feat/chapters-rebuild` as normal. When the demo should catch up:

```bash
git checkout demo
git merge --ff-only feat/chapters-rebuild
git push origin demo
git checkout feat/chapters-rebuild
```

`--ff-only` is deliberate. If it refuses, `demo` has commits of its own — which it should never have.
Nothing is ever committed *to* `demo`; it is a pointer, not a place to work.

## It is live

**https://mahua-resorts.vercel.app** — deployed 12 August 2026, project `mahua-resorts` under
`yagyamalikworks-projects`.

Verified from the public internet, not from a local build: all three routes and `robots.txt` return 200
with no login wall, `robots.txt` is `Disallow: /`, every route carries `noindex, nofollow, nocache`, and a
real browser loading each page found **41 / 16 / 18 images with none broken, two videos, and no failed
requests**. Screenshots in `docs/reviews/2026-08-12-vercel-demo/`.

### It is NOT git-connected yet, and that is deliberate

This was deployed straight from the CLI, so **pushing to `demo` does not currently redeploy anything.**
Re-publish with:

```bash
npx vercel --prod --yes      # from a checkout of what you want live
```

**To switch to auto-deploy, do both halves in the same visit:**

1. Vercel dashboard → **Settings → Git → Connect** `yagyamalikwork/mahua-website-2.0`
2. Vercel dashboard → **Settings → Git → Production Branch → `demo`**

**Doing the first without the second would break the demo.** Vercel defaults the production branch to the
repository's default branch, which here is `main` — and `main` is far behind this work. Connecting Git
alone would point https://mahua-resorts.vercel.app at a stale site.

## Vercel setup, once

1. **New Project** → import `yagyamalikwork/mahua-website-2.0`.
2. Framework preset **Next.js**, detected automatically. Build command, output directory and install
   command are all defaults — **do not override them**.
3. **Settings → Git → Production Branch → `demo`.** This is the one setting that matters. It gives the
   demo the clean project URL instead of a preview URL, and it stops pushes to the working branch
   redeploying the thing being presented.
4. No environment variables. The site needs none — see below for the one that exists and why it is unset.

Node: `package.json` pins `>=20.9.0`; Vercel's default satisfies it.

## Nothing here is indexable, and that is on purpose

Mahua has a live WordPress site. A demo Google indexes competes with it under a URL nobody wants ranked,
carrying facts that are still unconfirmed — a Nagpur distance, and room counts that took reading the
client's own booking engine to settle once already. Un-indexing a crawled page is far more work than never
being crawled.

Two layers, because they cover different failures:

| | covers |
|---|---|
| `app/robots.ts` → `robots.txt` | asks a crawler not to **fetch** |
| `robots` metadata in `app/layout.tsx` | tells a crawler that fetched anyway not to **index** |

The second is the one that actually matters: a page reached by a link from somewhere else is crawled
without `robots.txt` being read at all.

**The switch opens rather than closes.** `lib/indexing.ts` reads `NEXT_PUBLIC_ALLOW_INDEXING`, and only the
exact string `"true"` opens indexing — `"1"`, `"yes"` and a typo all leave it shut. Every deployment is a
demo until somebody decides otherwise, so the safe answer is the one you get by doing nothing.

**To go live for real:** set `NEXT_PUBLIC_ALLOW_INDEXING=true` in that one Vercel environment and redeploy.
Verified in both directions on a production build — with the flag absent, `robots.txt` is `Disallow: /` and
all three routes carry `noindex, nofollow, nocache`; with it set, `robots.txt` is `Allow: /` and the meta
tag is gone entirely.

## What the demo actually contains

All four routes are **fully static** — no server functions, nothing to cold-start:

```
○ /              ○ /mahua-vann     ○ /mahua-tola     ○ /robots.txt
```

- 46 MB of assets in `public/`, almost all of it the 53 curated photographs.
- First-load JavaScript **172,209 bytes brotli**, against this project's own 175 KB ceiling.
- **Demo above 1500px.** The home page's pinned collage needs ≥1440px of *layout* viewport, so a Windows
  laptop at exactly 1440 with a classic scrollbar will not show it, and the lantern is at full size only
  from 1440 up. Both property pages pin their rooms chapter at any width.
- **If nothing animates, check the operating system before the code.** Windows *Settings → Accessibility →
  Visual effects → Animation effects*, off, makes Chrome report `prefers-reduced-motion: reduce`, and this
  page then deliberately switches off every entrance, the emblem turn and the pin. It looks exactly like a
  broken build and it has caught the client out before.

## Known, and deliberate

- **The phone is a later pass.** Client ruling, 12 Aug: *"right now our only focus is how it looks on a
  computer/laptop screen."* The site works on a phone and is measured there; it is not tuned there.
- Three chapters on the property pages sit over the 45%-empty ceiling after measured attempts — see
  `docs/DECISIONS.md` §5. Two arguably cannot satisfy it by their own definition.
- The hero photograph lands at ~4.3s on a throttled connection against a 2.5s budget, knowingly: the client
  chose the sharp hero over the fast one. `docs/DECISIONS.md` §3.
- `lib/booking/` ships a provider contract with **no screens and no payments**, blocked on a vendor answer.
  Nothing in it is reachable from any page.
