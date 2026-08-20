# Deploying the demo

> **20 August 2026 — the demo is now the RESTRUCTURED home page, from `feat/home-v2`.**
>
> The client promoted it after reviewing it on a preview URL: seven chapters, the two joined lodge panels,
> the cropped Jungles band, the mirrored collages, the sideways Experiences strip, and the reviews under the
> closing pills. **`demo` was fast-forwarded to `feat/home-v2` to match**, because this file's whole premise
> is that `demo` names whatever is deployed.
>
> **The twelve-chapter page is not lost and is one command from returning:** it is intact on
> `feat/image-sizing`, `main` and `feat/chapters-rebuild` at `e0e3f69`, with the hanging lantern, the
> hornbill forest tint and the potter film all still mounted. To put it back:
> `git checkout feat/image-sizing && npx vercel --prod --yes`.
>
> **Two photographs are live without a client ruling** (`DECISIONS.md` §21.5): the safari card's frame
> changed for a consent reason, and the potters' photograph moved sections. Neither is a defect; both are
> recorded as open.
>
> **Preview deployments are private, and that is a trap worth knowing before a stakeholder meeting.**
> `npx vercel` without `--prod` gives a separate URL and leaves production alone — but Deployment
> Protection bounces anonymous visitors to a Vercel login, so a preview link cannot be shared until that is
> turned off in **Settings → Deployment Protection**. Verified anonymously, not from a logged-in session,
> which is the only way to see it.


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

## The three things that blocked a deploy on 14 Aug, and how to clear each

All three were hit in one session. None is obvious from the error it produces.

### 1. The commit author email — this one blocks *Git* deployments entirely

Vercel refuses a Git deployment whose commit author it cannot identify:

> *The commit author email (yagyamalikwork@gmail.com) is not a valid email address. This prevents Vercel
> from identifying the commit author and allowing the deployment.*

The repository's `git config` carried **`yagyamalikwork@gmail.com`** while the client's GitHub account is
**`yagyamalik.work@gmail.com`** — one missing dot. Every commit before 14 Aug carries the wrong one.

Corrected with `git config --global user.email "yagyamalik.work@gmail.com"`. **Past commits are not
rewritten and do not need to be** — Vercel only checks the commit that triggers a deployment, so the next
push is enough. The client found this himself from Vercel's own message.

### 2. The CLI's auth token expires, and the failure says "Not authorized"

`vercel link` writes `.env.local` with a `VERCEL_OIDC_TOKEN` that lives for hours, not days. A two-day-old
one produced `Not authorized` on `vercel --prod` while `vercel whoami`, `vercel project ls` and
`vercel ls` all still worked — reads kept working, writes did not, which reads like a permissions problem
and is not.

```bash
rm -f .env.local && npx vercel link --yes --project mahua-resorts
```

### 3. No `.vercelignore`, so the upload was 882 MB

A deploy sat at `Uploading (0.0B/882.6MB)` and never finished. That is not the site — it is the
repository's history and raw materials:

| | |
|---|---|
| `.git` | 926 MB — every version of every photograph ever committed |
| `node_modules` | 582 MB — Vercel runs its own `npm install` |
| `.next` | 172 MB — Vercel runs its own `next build` |
| `reference` | 77 MB — crawled source material, never shipped |

`.vercelignore` now excludes all of it. **882 MB → 133 MB.** If a build ever fails on a missing file, look
there first: excluding something the build needs fails loudly, but it looks like a code error rather than
an ignore-file one.

### The way to stop hitting any of this

**Connect Git.** Vercel then clones from GitHub on its own — no upload, no CLI, no token to expire, and a
push is the whole deploy. The email fix above is exactly what was blocking that route. It remains a
two-part action: **connect the repo AND set Production Branch to `demo`**, or the demo URL follows the
default branch instead.

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
