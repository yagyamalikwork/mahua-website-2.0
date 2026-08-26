# The Journal — design

**Status:** approved by the client, 26 August 2026. Not yet planned, not yet built.
**Branch:** `feat/journal-and-mobile`.
**Order:** this is the **third** of three bodies of work agreed on 26 Aug. It is specified now so that the
hosting and privacy decisions it depends on can be made while the first two are built. See §12.

> **This document invents no copy.** There is not one line of sample journal prose, no example entry title
> and no placeholder guest comment anywhere in it — because on this project a worked example has shipped as
> real copy before. Every string a visitor will read is the client's, and the ones this design needs from
> him are listed in §11.

---

## 1. What the client asked for

Verbatim, 26 August 2026:

> We need to create a new "Journal" Page, like we have for the properties. The client wants to use this page
> to add their journal entries that the visitors can see and interact with like putting down comments and
> liking them. Also they want a image gallery on this page where they can upload new and fresh images for
> the visitors to view.

Four capabilities, and **the site today has machinery for none of them**: it is a static Next.js build with
every word in `content/*.ts`, every photograph pre-encoded by `scripts/build_images.mjs`, no database, no
API routes, no authentication and no upload path. That is the whole reason this needed a design rather than
a task.

### 1.1 What he decided when asked

| Question | Ruling |
|---|---|
| Cadence, and who writes | **Not sure yet** — design for "regular, one author", make adding editors a settings change rather than a rebuild |
| What an entry is | **A mix** — short photo-led field notes and long-form articles in one feed |
| Who may comment | **Anyone**, name + email, no account |
| When a comment appears | **Only after his approval** |
| Who uploads gallery photographs | **Him and his team only** — no visitor uploads |
| Gallery shape | **One standalone growing collection** on the Journal page, separate from the entries |
| Back-end cost | *"Tell me what you'd choose"* — the decision was delegated; §2 is the answer and its reasoning |
| Name and placement | **"Journal", in the site menu** as a fourth row |

### 1.2 What was decided for him, and stated

Two things were settled without spending a question, and both were told to him rather than assumed
silently:

- **Entries are published without a deploy.** He writes, it appears. This is what rules out the obvious
  cheap answer — entries as files in `content/` — however well that would match the rest of the site.
- **A like is anonymous and counted once per browser.** There are no accounts, so there is nothing else it
  could be. It is gameable by anyone determined; for a lodge journal that does not matter, and saying so is
  cheaper than a reader discovering it.

---

## 2. The stack, and why this one

**Payload CMS 3, self-hosted inside this same Next.js application**, with Postgres for data and Cloudflare
R2 for uploaded photographs.

### 2.1 The compatibility fact, checked rather than assumed

Payload supports Next.js **16.2.x** as of Payload **3.73.0**. This repo is on **16.2.12**
(`package.json`). That check was worth making before committing: **Next 15.5 through 16.1.x is explicitly
unsupported and will not be**, so the supported range is not a simple floor — a future Next upgrade is not
automatically safe, and a *downgrade* to fix something else would land in the dead zone.

One configuration consequence: Next 16 enables Turbopack by default and Payload historically injected
webpack config. The fix is an empty `turbopack: {}` in `next.config.ts`, which this repo's config does not
have today.

### 2.2 Why not a hosted CMS

Sanity and Contentful are faster to stand up, need no database of our own, and have excellent editors.
They were rejected on one fact from §1.1: **the client does not know whether lodge managers will
eventually post.** Per-seat pricing (~£15/editor/month) turns that uncertainty into a bill that arrives
precisely when the thing succeeds. Self-hosted Payload has no per-seat charge at any number of editors.

Three lesser reasons, in order of weight:

1. **Comments moderation lands in the same screen he writes in.** A separate comments service would be a
   second login and a second thing to remember. Here, `pending` comments are a collection in the admin he
   already has open.
2. **One repository, one deployment.** No second vendor, no webhook to rebuild the site, no drift between
   what the CMS thinks it published and what is live.
3. **The data is his** — entries, and in particular his guests' email addresses, sit in a database he owns
   rather than on a vendor's servers under a free plan's terms.

### 2.3 Running cost, honestly

| | Choice | Cost at this scale |
|---|---|---|
| CMS licence | Payload, self-hosted | **£0**, permanently |
| Database | Neon Postgres, free tier | **£0** — a free tier holds vastly more text than this journal will produce; if outgrown, ~£15/mo |
| Photograph storage | Cloudflare R2 | **~1.5p per GB per month**, and **zero egress fees**, which is the figure that matters for a photograph-led site |
| Hosting | Vercel, existing account | see §9.1 — **this needs checking and may already be a problem** |

Realistically **£0 for the first year**, then single-digit pounds a month. These figures were current at
26 Aug 2026 and must be re-confirmed at build time rather than quoted from here.

### 2.4 What this does NOT change

**Only `/journal`, `/journal/*` and `/admin` become dynamic. Every existing page stays exactly as static
and as fast as it is today.** The home page and both property pages are untouched by this work — no shared
layout gains a database call, and `npm run verify:budget`'s first-load figure for `/` must be unchanged
after this lands, which is an assertion and not an aspiration (§10).

---

## 3. The routes

| Route | What | Rendering |
|---|---|---|
| `/journal` | The Journal — entries feed, then the gallery | Dynamic, cached; revalidated on publish |
| `/journal/<slug>` | One entry, with its comments and its like control | Dynamic, cached; revalidated on publish and on comment approval |
| `/admin` | Payload's editor — entries, gallery, comment queue | Dynamic, authenticated |

Each entry having **its own address** is not a preference: comments and likes need something to attach to,
and a shareable link is the whole point of a journal.

---

## 4. The content model

Five collections. Field lists here are the shape, not the schema — the plan writes the schema.

**`entries`**
`title`, `slug` (from the title, editable, immutable once published), `publishedAt`, `kind`
(`note` | `article`), `lead` (one photograph), `body` (rich text, photographs allowed inline), `author`,
`status` (`draft` | `published`), `commentsOpen` (default true).

**There is deliberately no per-entry gallery field.** The client was offered "both — entry galleries and a
standalone one" and chose the standalone gallery alone. An entry carries photographs *inside its body*,
where they sit with the words that explain them; the gallery is a separate collection with its own
purpose. Adding a second, per-entry gallery would be a shape nobody asked for and a second place to
maintain.

`kind` is what lets a three-paragraph sighting and a two-thousand-word essay share one feed without the
short one reading as thin — see §5.

**`gallery`** — the standalone collection, independent of entries.
`image`, `caption`, `takenAt`, `order`, `published`.

**`comments`**
`entry` (ref), `name`, `email` (**stored, never rendered**), `body`, `status`
(`pending` | `approved` | `spam`), `createdAt`, `ip` (for rate limiting, retained briefly).

**`likes`**
`entry` (ref), `browserId` (an opaque id in a first-party cookie), `createdAt`.
Unique on (`entry`, `browserId`), so the count is a real count of browsers.

**`media`** — Payload's upload collection, backing every photograph above. See §7.

---

## 5. The page, in the site's own language

The Journal is a **fourth page of this website**, not a blog bolted to the side of it. Non-negotiables #3
(cream throughout), #4 (restraint), #8 (45% empty-space ceiling), #10 (alternate the rhythm) and #11
(full-bleed floor) all bind here exactly as they bind everywhere else, and `scripts/measure_density.mjs`
and `scripts/check_contrast_over_photos.mjs` must both be pointed at `/journal` and pass before it ships.

It takes the property pages' numbered-chapter idiom, because the client's own words were *"like we have for
the properties"*.

**The feed handles both entry kinds by giving them different room** rather than by giving them different
components: an `article` takes a full-width band with its lead photograph large; a `note` takes a narrower
card. Adjacent entries of the same kind must not repeat a shape — this is the same rule
`findRepeatedShape` already enforces on the property pages (`content/property-chapters.ts`), and the
Journal's feed is exactly the case that rule exists for, since the order is the client's and not ours.

**The gallery sits below the entries** as its own chapter. It reuses the plate-board reflow rules
(`DECISIONS.md` §19): a photograph never renders narrower than its own 1440×900 width, the board drops a
column rather than shrink below that floor, and at one column the plate fills the container. That is a
solved problem on this project and must not be re-solved differently here.

**Comments and the like control sit at the foot of an entry page**, on cream, in the site's own type. No
third-party comment widget, no avatars, no threading.

---

## 6. Comments — the flow, and the risk it manages

1. A visitor fills in name, email and their comment on an entry page.
2. A server action validates, rate-limits by IP, and stores the comment as **`pending`**.
3. The client gets an email that one has arrived.
4. He approves or bins it in `/admin`, where he already is.
5. Approved comments render on the entry; the page revalidates.

**The approval gate is what makes the spam problem tractable.** A public comment box with no sign-in is
found by bots, reliably, within days. Because nothing renders until a human says so, spam is a chore in a
queue rather than casino links under a tiger photograph. Two cheap defences keep the queue small: a
honeypot field bots fill and humans never see, and a per-IP rate limit. **Neither is a gate — the gate is
the approval step**, and that distinction matters, because a defence that fails open is fine here and would
not be if comments published themselves.

**Email is collected and never rendered.** It exists so the client can reply privately and can recognise a
returning guest. It is personal data, which is why §9.2 exists.

**`commentsOpen` per entry** so an entry that attracts nothing but noise can be closed without deleting
what is already there.

---

## 7. Photographs, and the budget trap

This is the part most likely to break something quietly, so it is specified rather than left to the build.

Every photograph on this site today is pre-encoded by `scripts/build_images.mjs` into responsive widths and
held under **200 KB** (non-negotiable #6), and `lib/media.ts` marks anything under 1400px as not
full-bleed-safe (non-negotiable #11). **An uploaded photograph bypasses all of it.** One 6 MB phone JPEG
dropped into the gallery would break the largest-image budget and, on the Journal's first screen, the
1.5 MB initial-load budget too.

So:

- **Payload generates the derivative sizes on upload**, matching the ladder `lib/media.ts` already serves,
  and the originals live in R2.
- **A minimum upload width is enforced at the CMS**, and it rejects rather than warns. A photograph that
  cannot go full-bleed must not be able to reach a full-bleed slot.
- **`scripts/check_image_resolution.mjs` gains `/journal`**, so an under-served photograph is caught by the
  same instrument that catches them everywhere else.
- **Type is never laid over a gallery photograph.** Captions sit beneath the plate on cream. This is the
  one place the CMS could create a contrast failure nobody solved, because the photograph is unknown until
  after the build — and the cheapest way to guarantee a solved scrim is to need no scrim.
- **An entry's lead photograph is the one exception**, since a title over a lead is the shape the rest of
  this site uses. It gets `PLACEHOLDER_SCRIM`'s deliberately heavy wash — the pattern
  `ExperienceStrip.tsx` already carries, which fails towards muddy (a reviewer sees it) rather than towards
  illegible (they may not). **If the client later wants a specific lead lightened, that is a solve against
  that photograph** with `check_contrast_over_photos.mjs`, stored beside the entry — never a global
  lowering of the fallback.

---

## 8. Deliberately out of scope

No visitor uploads. No visitor accounts. No categories, tags, search, RSS, related-posts, share buttons,
newsletter capture, or comment threading. No analytics.

All are cheap to add once there are thirty entries and the client knows which he actually wants. Building
them now is guessing, and every one of them is a surface that has to be designed, measured for density and
contrast, and maintained.

---

## 9. Two things this design depends on that are not code

### 9.1 The Vercel plan — and this is already true today

Vercel's free Hobby plan **does not permit commercial use**, and this is a commercial lodge site that is
already deployed (`docs/DEPLOY.md`). Which plan the account is on needs checking **before** the Journal
adds a database and an admin panel to it. Flagged as a finding of this design, not created by it.

### 9.2 A privacy notice — and the site has none

`grep` across `app/`, `components/`, `content/` and `lib/` finds no privacy policy, cookie notice or
consent mechanism anywhere on this site. The moment a comment form collects an email address, one is
needed. It is short, and a draft is cheap — but **the words are the client's**, like every other word on
this site (CLAUDE.md: *"All copy lives in `content/`"*, *"The client reviews every line"*).

Scope of what it must cover, given this design: commenter names and emails, the like cookie, retention, and
who to write to for deletion. It is a page, and it belongs in the footer's Website Directory.

---

## 10. How this gets verified

The rule on this project is that no number is quoted that cannot be re-derived by a command in `scripts/`.
The Journal inherits every existing rig and adds one.

| Rig | What it must show |
|---|---|
| `measure_density.mjs` | `/journal` and an entry page inside the 45% worst-screen ceiling |
| `check_contrast_over_photos.mjs` | every scrap of type over a photograph clears its floor, at every width from 360 |
| `check_image_resolution.mjs` | no uploaded photograph served below its own box |
| `check_plates.mjs` | the gallery's boards obey the 1.0 floor with no exemption |
| `measure_js_budget.mjs` / `verify:budget` | **`/`'s first-load JavaScript is unchanged** — the proof that §2.4 is true |
| `measure_page.mjs` | `/journal` initial transfer under 1.5 MB |
| **new — `check_journal.mjs`** | a comment cannot appear without approval; the like counts once per browser; the honeypot rejects; the rate limit holds; an oversized upload is refused; `commentsOpen: false` renders no form |

The new rig's first assertion is the important one, and it must be **watched failing** against a build with
the approval gate removed before it is believed. That is this project's standing practice
(`DECISIONS.md` §2), and it exists because a rig that has never failed has proved nothing.

---

## 11. What is owed by the client before this can ship

1. **The privacy notice's words** (§9.2) — blocking, because the comment form cannot collect an email
   without it.
2. **Confirmation of the Vercel plan** (§9.1) — blocking for the deploy, not for the build.
3. **The first entries.** Not blocking; the page can ship empty and the empty state is part of the design.
4. **A decision on the notification address** — where the "a comment arrived" email goes.

---

## 12. Where this sits in the agreed order

Three bodies of work were separated on 26 Aug 2026 and the client chose the order:

1. **B — home and property page restructure.** His items 3 and 4. Surgical, and first.
2. **C — mobile, tablet and zoom optimisation, site-wide.** His item 2. Second, over the settled structure,
   so nothing is optimised and then deleted.
3. **A — this.** Third, so it is built responsive from the start and inherits C's patterns natively rather
   than being retrofitted.

Specifying it first, and building it last, is deliberate: §9.1 and §9.2 both need the client and both take
real-world time.

---

## 13. Related reading

- `CLAUDE.md` — the non-negotiables this page inherits, and which branch you are on
- `docs/DECISIONS.md` §19 (the plate floor the gallery reuses), §20.5 (a re-crop is a re-solve), §21 (the
  v2 home page's rulings)
- `docs/DEPLOY.md` — the CLI deploy, and why `demo` is a pointer
- `docs/PROJECT-STATE.md` — what else is owed by the client
