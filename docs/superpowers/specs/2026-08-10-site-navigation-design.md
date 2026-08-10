# Mahua Resorts — One Website: the Places Menu and the Directory Footer

**Design specification · 10 August 2026**

Status: **approved in conversation** (brainstormed with Yagya Malik, 10 Aug 2026); awaiting his read of this document.

## 1. Why this exists

The site is three well-made pages that do not behave like one website. The menu overlay lists only the
*current page's* chapters as anchor links — from `/mahua-vann` there is no route to Home or to Tola except
the closing sibling banner and the browser's back button. The brand lockup in the header is inert. No page
has a footer: the home page ends with no address, phone or legal line anywhere on it, and with JavaScript
off the menu cannot open, leaving the site with **no cross-page navigation at all**.

Both reference points were revisited live on 10 Aug before this spec was written:

- **thesujanlife.com** (the client's chosen benchmark): its menu leads with the camps, each named with its
  region; everything else is secondary. Its logo links home. Its footer is a full directory — contact
  block, explore links, legal — plus newsletter/social/awards we do not have.
- **mahuaresorts.com** (the live site being replaced): logo links home; footer carries Terms & Conditions,
  Work With Us, `sales@mahuaresorts.com`, the Gurugram office and a © line. It also still sells Mahua Bagh,
  which is retired — a standing reminder that the live site is a *source*, never an authority.

## 2. The client's two rulings (10 Aug)

| Ruling | Consequence |
|---|---|
| **The menu is places only.** Home, Mahua Vann, Mahua Tola — real page links. The chapter lists leave the menu on every page, including the home page's | The 18-screen home page goes back to being scrolled, which `ChapterMenu`'s own doc calls "the page's actual proposition". The property pages' chapter numbering stays as page furniture. The menu's *mechanics* (dialog semantics, focus trap, Escape-to-trigger, the Lenis-aware scroll lock, cream-on-dark) are reviewed and keep |
| **The Website Directory ships now, as a footer on all three pages** | This is the section the client named on 9 Aug when dropping the enquiry form ("we can just share the contact details in the Website Directory section when we build it later"). Later is now |

**One controller revision to the sketch the client saw, open to veto:** the menu carries **no Book pill**.
Booking is per-lodge (two AsiaTech tokens), so one pill in a site-wide menu is ambiguous on the home page —
and the ask already exists in every page's header pill, both property bars and both closing invitations.
The menu stays pure wayfinding, which is also the "seduce, not convert" reading (non-negotiable #2).

## 3. The design

### 3.1 `SiteMenu` (the renamed `ChapterMenu`)

The overlay lists the three places, in fixed order: **Home**, **Mahua Vann** with *Pench* beside it in
gold small caps, **Mahua Tola** with *Tadoba* beside it — the same register the old menu gave chapter
numbers, and Sujan's own presentation of its camps. Links are ordinary `href` anchors to `/`,
`/mahua-vann`, `/mahua-tola`.

**The current place is marked, not linked out of.** The row for the page you are standing on carries
`aria-current="page"`, sits dimmed, and closes the menu on click rather than reloading the route. So the
menu also answers "where am I".

The `chapters` prop leaves the menu path entirely. `SiteHeader` keeps taking `chapters` only for the
hero-watch (`chapters[0].id`). The menu-copy strings (`menu`, `menuTitle`, `menuClose`, `menuHint`) and the
places list move to a new **`content/site.ts`**, one source consumed by menu and footer both — the
duplicated `VANN_NAV` / `TOLA_NAV` / `HOME.nav` menu strings collapse into it. `menuHint`'s copy changes
from "Jump to a chapter" to a places register ("Where next", or as written in `content/site.ts`).

### 3.2 The lockup links Home

The brand lockup in every header becomes `<a href="/">`, `aria-label` naming it, `data-rule="none"` (a
hairline under an image lockup reads as a fault — the same opt-out the pills carry). On the home page it
is a scroll-to-top-equivalent and stays a plain link; no special casing.

### 3.3 `SiteFooter` — the Website Directory

One server-rendered band, **no `"use client"` anywhere in its tree**, mounted once in `app/layout.tsx`
after `{children}`, so every route carries it identically. Cream on the deeper paper (`--surface`),
hairline rules, small caps labels — a colophon, not a marketing band. Contents, all from `content/site.ts`
and the existing contact constants:

1. The wordmark line.
2. **The Places** — Home, Mahua Vann · Pench, Mahua Tola · Tadoba. Real links: this is what finally gives
   the site working navigation with JavaScript off, closing the menu's one documented honest limitation.
3. **Both lodges' contact** — phone, email, each lodge's address — imported from `VANN_CONTACT` /
   `TOLA_CONTACT`, not re-typed, so the footer can never disagree with the pages.
4. **The office** — the Gurugram address from the live site's own footer.
5. The small-print row: © line, **Terms & Conditions** and **Work With Us**, both pointing at the live
   site's pages for now (interim, exactly as Book points at AsiaTech).

### 3.4 The property bar learns about the footer

`PropertyBar` steps aside over the closing invitation; without a change it would **reappear over the
footer**, floating a Book bar on top of the directory's own contact details. Its visibility becomes: past
the hero, and neither the invitation nor the footer on screen. Same observer mechanism, one more target;
fail-towards-absent unchanged.

## 4. What this does not do

- **No pages that do not exist.** About Us, In The News, Offers are live-site pages with no equivalent
  here; the places array in `content/site.ts` is where they are added when built. The footer links no
  ghost.
- **No WhatsApp bubble, no socials, no newsletter** — the live site's bubble and Sujan's footer extras are
  out of scope; socials are undecided brand territory.
- **No press in the footer.** Vann's press band question (fold into its invitation?) is open with the
  client in `DECISIONS.md` §5 and is not preempted here.
- **The home page's chapters, copy and components are untouched** beyond the header/menu/footer chrome.

## 5. Verification

Existing rigs cover most of this unasked: `check_rule_in.mjs` walks every link on every route (the new
footer and lockup links included); `measure_density.mjs` re-run on all three routes (the footer is a
mostly-type band at page end — measure, don't assume); `check_header.mjs` for the header's states with the
lockup now a link; the JS budget must not move at all, since menu machinery is reused and the footer
carries none.

New tests, each watched failing first: the menu lists exactly the places and marks the current one
(`aria-current`); `content/site.ts`'s places match the routes that exist (a test importing the app's route
folders, so a ghost link is a red test); the footer renders real `tel:`/`mailto:`/page anchors with no
client component in its tree; `PropertyBar` stays absent while the footer is on screen (driven through the
observer seam, as its existing tests are).

Then screenshots at 390/768/1440/1920 on all three routes, looked at — including 390px, where every rig has
a documented blind spot (`DECISIONS.md` §2 #29).
