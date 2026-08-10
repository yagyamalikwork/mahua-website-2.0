# Site Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make three pages behave as one website — a places menu on cream glass behind a hamburger, the lodges as image cards, a zero-JS directory footer on every route, the lockup linking Home, and the property bar staying quiet over the footer.

**Architecture:** One new content dial (`content/site.ts`) feeds both a rewritten menu (`SiteMenu`, keeping `ChapterMenu`'s reviewed dialog/focus/scroll-lock machinery) and a new server-only `SiteFooter` mounted once in `app/layout.tsx`. The menu's photograph cards are rendered on the server (through `SiteHeader`) and passed as children so the media manifest never enters the client bundle — the PinnedCollage pattern — and are inserted into the DOM only on the menu's first open so they cost page load nothing.

**Tech Stack:** Next.js App Router, React server components, TypeScript, Tailwind v4, Vitest, Playwright rigs.

## Global Constraints

- Cream palette only, via CSS variables — `var(--bg)`, `var(--surface)`, `var(--text)`, `var(--dim)`, `var(--accent)`, `var(--accent-text)`. **Never a hard-coded hex.**
- **Gold (`--accent`) never carries text**; `--accent-text` is the legible sibling.
- Every user-facing string lives in `content/` — none written into a component. British spelling.
- **A client component's `import`s ship to the browser; its `children` do not.** Nothing may import `lib/media` / `ui/Photo` from a `"use client"` file (CLAUDE.md architecture rule; `npm run verify:budget` is the proof).
- Anything fixed over content **fails towards absent** — no JS, no `IntersectionObserver`, a thrown error ⇒ not there.
- Restraint: one entrance curve, nothing bounces; the overlay keeps its single opacity transition.
- Every new guard is **watched failing** before its pass is trusted (30 catalogued instances of why).
- `npm test`, `npm run build`, `npm run lint`, `npx tsc --noEmit` green before any commit claiming completion. Read exit codes, never piped output.
- Kill any stale server on port 3100 before measuring; restart after every rebuild.
- Another session may be editing home-page files (forest overlay). **Do not touch `app/page.tsx`, `content/chapters.ts`, `content/home.ts` beyond what a task names, and never commit files a task did not change.**

---

## File structure

| File | Responsibility |
|---|---|
| `content/site.ts` | **New.** The site dial: nav strings, the places (with regions + card media ids), footer copy, `SITE_FOOTER_ID` |
| `content/site.test.ts` | **New.** Places ↔ real routes; card ids resolve; British forms |
| `components/ui/SiteFooter.tsx` | **New.** The Website Directory. Server-only, zero JS |
| `components/ui/SiteFooter.test.tsx` | **New** |
| `components/ui/SiteMenu.tsx` | **New (from `ChapterMenu.tsx`, which is deleted).** The places overlay on cream glass |
| `components/ui/SiteMenu.test.tsx` | **New** |
| `components/ui/SiteHeader.tsx` | **Modified.** Hamburger wiring, server-rendered cards, lockup links Home; `nav` prop gone |
| `app/layout.tsx` | **Modified.** Mounts `SiteFooter` after `{children}` inside `SmoothScroll` |
| `app/globals.css` | **Modified.** `.site-menu-glass` + fallbacks |
| `components/property/PropertyBar.tsx` | **Modified.** Footer quiet zone |
| `components/property/PropertyPage.tsx` | **Modified.** Drops `nav`; passes `footerId` |
| `app/mahua-vann/page.tsx`, `app/mahua-tola/page.tsx` | **Modified.** Drop `nav={…}` |
| `content/mahua-vann.ts`, `content/mahua-tola.ts` | **Modified.** `VANN_NAV` / `TOLA_NAV` deleted |
| `content/home.ts` | **Modified (minimal).** `nav` shrinks to `{ cta }` |
| `lib/sizes.test.ts` | **Modified.** `MENU_CARD_SIZES` slot + `CASES` entry |
| `scripts/check_rule_in.mjs`, `scripts/check_contrast_over_photos.mjs` | **Modified.** `chapter-menu` → `site-menu` selectors; a menu-over-photograph probe |

---

### Task 1: `content/site.ts` — the site dial

**Files:**
- Create: `content/site.ts`, `content/site.test.ts`

**Interfaces:**
- Produces: `SITE` (shape below), `SitePlace`, `SITE_FOOTER_ID = "site-footer"`. Consumed by Tasks 2–5.

- [ ] **Step 1: Write the failing test**

```ts
// content/site.test.ts
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import { SITE, SITE_FOOTER_ID } from "./site";

describe("SITE", () => {
  it("links only to routes that exist", () => {
    // The footer and menu must never link a ghost. Checked against the app
    // directory itself, so adding a place without building its page is a red
    // test — and building a page without listing it here is visible in review.
    const root = path.resolve(import.meta.dirname, "..", "app");
    for (const place of SITE.places) {
      const dir = place.href === "/" ? root : path.join(root, place.href.slice(1));
      expect(existsSync(path.join(dir, "page.tsx")), `${place.href} has no page`).toBe(true);
    }
  });

  it("opens with Home, then the two lodges in brand order", () => {
    expect(SITE.places.map((p) => p.href)).toEqual(["/", "/mahua-vann", "/mahua-tola"]);
  });

  it("gives every lodge a region and a real card photograph, and Home neither", () => {
    // The client's ruling: lodges as image cards in Sujan's manner, Home a
    // plain tag. A lodge without a card renders as a bare link and the menu
    // silently loses its point.
    for (const place of SITE.places) {
      if (place.href === "/") {
        expect(place.region).toBeUndefined();
        expect(place.cardMediaId).toBeUndefined();
      } else {
        expect(place.region, `${place.label} has no region`).toBeDefined();
        expect(place.cardMediaId, `${place.label} has no card`).toBeDefined();
        expect(() => media(place.cardMediaId!)).not.toThrow();
      }
    }
  });

  it("has a footer id, since two components must agree on it", () => {
    expect(SITE_FOOTER_ID).toBe("site-footer");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run content/site.test.ts`
Expected: FAIL — `./site` does not exist.

- [ ] **Step 3: Write `content/site.ts`**

```ts
import type { MediaId } from "@/lib/media";

/**
 * The site itself, as a dial — everything that is true on every page: the
 * places, the menu's words, the directory footer's words. One source for the
 * menu and the footer both, so the two can never disagree about what the
 * site contains.
 *
 * `SITE_FOOTER_ID` lives here rather than in `SiteFooter.tsx` because
 * `PropertyBar` (a client component) also needs it, and importing it from
 * the footer would drag the footer's server-only imports — both content
 * dials — into the client bundle.
 */
export const SITE_FOOTER_ID = "site-footer";

export type SitePlace = {
  readonly label: string;
  readonly href: "/" | "/mahua-vann" | "/mahua-tola";
  /** Gold small caps beside the name — Sujan's own register for a camp's region. */
  readonly region?: string;
  /** The lodge's card photograph in the menu. Home carries none: it is wayfinding, not a destination being sold. */
  readonly cardMediaId?: MediaId;
};

export const SITE = {
  nav: {
    /** The hamburger's aria-label — the word moved off the screen, not out of the accessibility tree. */
    menuLabel: "Menu",
    menuTitle: "The places",
    menuClose: "Close",
    menuHint: "Where next",
  },
  places: [
    { label: "Home", href: "/" },
    { label: "Mahua Vann", href: "/mahua-vann", region: "Pench", cardMediaId: "vann-hero" },
    { label: "Mahua Tola", href: "/mahua-tola", region: "Tadoba", cardMediaId: "tola-hero" },
  ] as readonly SitePlace[],
  footer: {
    placesLabel: "The places",
    officeLabel: "The office",
    /** The live site's own footer address, transcribed 10 Aug 2026. */
    office: "1574, Sector 17C, Gurugram, Haryana 122001",
    /** Interim external links to the live site, exactly as Book points at AsiaTech. */
    legal: [
      { label: "Terms & Conditions", href: "https://mahuaresorts.com/terms-conditions/" },
      { label: "Work With Us", href: "https://mahuaresorts.com/mahuaresorts/work-with-us/" },
    ],
    copyright: "© 2026 Mahua Resorts. All rights reserved.",
  },
} as const;
```

- [ ] **Step 4: Run the test** — `npx vitest run content/site.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add content/site.ts content/site.test.ts
git commit -m "feat: the site dial — places, menu words, directory copy, one source"
```

---

### Task 2: `SiteFooter` — the Website Directory

**Files:**
- Create: `components/ui/SiteFooter.tsx`, `components/ui/SiteFooter.test.tsx`
- Modify: `app/layout.tsx` (mount after `{children}`, inside `SmoothScroll`)

**Interfaces:**
- Consumes: `SITE`, `SITE_FOOTER_ID` (Task 1); `VANN_CONTACT` / `TOLA_CONTACT` from the dials (`{ phone: { label, value, href }, email: { … }, address: { label, value } }`).
- Produces: `SiteFooter` — mounted by layout; its `id` watched by Task 5.

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/SiteFooter.test.tsx
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SITE, SITE_FOOTER_ID } from "@/content/site";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("carries no JavaScript at all", () => {
    // The directory is the site's no-JS navigation — the menu cannot open
    // without script, and this is what covers for it. A "use client" anywhere
    // in this file would be the fail-safe failing.
    const src = readFileSync(
      path.resolve(import.meta.dirname, "SiteFooter.tsx"),
      "utf8",
    );
    expect(src).not.toContain('"use client"');
    expect(src).not.toMatch(/\buse(State|Effect|Ref|Callback)\b/);
  });

  it("links every place with a real href", () => {
    const { container } = render(<SiteFooter />);
    for (const place of SITE.places) {
      expect(
        container.querySelector(`a[href='${place.href}']`),
        `${place.label} missing`,
      ).not.toBeNull();
    }
  });

  it("gives both lodges working tel: and mailto: links", () => {
    const { container } = render(<SiteFooter />);
    expect(container.querySelectorAll("a[href^='tel:']").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll("a[href^='mailto:']").length).toBeGreaterThanOrEqual(2);
  });

  it("carries the office, the legal links and the copyright line", () => {
    const { getByText, container } = render(<SiteFooter />);
    expect(getByText(SITE.footer.office)).toBeTruthy();
    expect(getByText(SITE.footer.copyright)).toBeTruthy();
    for (const l of SITE.footer.legal) {
      const a = container.querySelector(`a[href='${l.href}']`);
      expect(a, `${l.label} missing`).not.toBeNull();
      expect(a?.getAttribute("target")).toBe("_blank");
    }
  });

  it("is findable by the id the property bar watches", () => {
    const { container } = render(<SiteFooter />);
    expect(container.querySelector(`footer#${SITE_FOOTER_ID}`)).not.toBeNull();
  });

  it("covers every link with the hairline contract", () => {
    const { container } = render(<SiteFooter />);
    for (const a of container.querySelectorAll("a[href]")) {
      expect(
        a.classList.contains("rule-in") || a.hasAttribute("data-rule"),
        `${a.getAttribute("href")} carries neither rule-in nor data-rule`,
      ).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails** — `npx vitest run components/ui/SiteFooter.test.tsx` — Expected: FAIL, module not found.

- [ ] **Step 3: Write the component**

```tsx
// components/ui/SiteFooter.tsx
import { TOLA_CONTACT } from "@/content/mahua-tola";
import { VANN_CONTACT } from "@/content/mahua-vann";
import { SITE, SITE_FOOTER_ID } from "@/content/site";
import type { PropertyContactCopy } from "@/components/property/PropertyContact";

/**
 * The Website Directory — the section the client named on 9 Aug when he
 * dropped the enquiry form, built 10 Aug. One band, identical on every
 * route, mounted once in `app/layout.tsx`.
 *
 * **Server-only, zero JavaScript, deliberately.** With script off the menu
 * cannot open (its one documented honest limitation); this footer is what
 * covers for it — plain anchors to every place, on every page. A `"use
 * client"` in this tree would be the fail-safe failing, and the test beside
 * this file greps for exactly that.
 *
 * The lodges' contact details are imported from the dials' own constants,
 * not re-typed, so the footer can never disagree with the pages.
 *
 * A colophon, not a marketing band: the deeper paper, hairlines, small caps.
 */
const LABEL =
  "font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]";
const LINK =
  "rule-in inline-block pb-0.5 font-[family-name:var(--font-body)] text-[0.98rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]";

function LodgeContact({ name, contact }: { name: string; contact: PropertyContactCopy }) {
  return (
    <div>
      <p className={LABEL} style={{ color: "var(--accent-text)" }}>
        {name}
      </p>
      <ul className="mt-3 space-y-1.5">
        <li>
          <a href={contact.phone.href} className={LINK} style={{ color: "var(--text)" }}>
            {contact.phone.value}
          </a>
        </li>
        <li>
          <a href={contact.email.href} className={LINK} style={{ color: "var(--text)" }}>
            {contact.email.value}
          </a>
        </li>
        <li
          className="max-w-[36ch] font-[family-name:var(--font-body)] text-sm leading-relaxed"
          style={{ color: "var(--dim)" }}
        >
          {contact.address.value}
        </li>
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer
      id={SITE_FOOTER_ID}
      className="border-t"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--accent)" }}
    >
      <div className="mx-auto max-w-[1600px] px-6 py-14 md:px-12 md:py-16">
        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10">
          <div>
            <p className={LABEL} style={{ color: "var(--accent-text)" }}>
              {SITE.footer.placesLabel}
            </p>
            <ul className="mt-3 space-y-1.5">
              {SITE.places.map((place) => (
                <li key={place.href}>
                  <a href={place.href} className={LINK} style={{ color: "var(--text)" }}>
                    {place.label}
                    {place.region && (
                      <span className={`${LABEL} ml-2`} style={{ color: "var(--accent-text)" }}>
                        {place.region}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <LodgeContact name={`${SITE.places[1].label} · ${SITE.places[1].region}`} contact={VANN_CONTACT} />
          <LodgeContact name={`${SITE.places[2].label} · ${SITE.places[2].region}`} contact={TOLA_CONTACT} />

          <div>
            <p className={LABEL} style={{ color: "var(--accent-text)" }}>
              {SITE.footer.officeLabel}
            </p>
            <p
              className="mt-3 max-w-[36ch] font-[family-name:var(--font-body)] text-sm leading-relaxed"
              style={{ color: "var(--dim)" }}
            >
              {SITE.footer.office}
            </p>
          </div>
        </div>

        <div
          className="mt-12 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t pt-6"
          style={{ borderColor: "var(--accent)" }}
        >
          <p className="font-[family-name:var(--font-body)] text-sm" style={{ color: "var(--dim)" }}>
            {SITE.footer.copyright}
          </p>
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {SITE.footer.legal.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`${LABEL} rule-in inline-block pb-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]`}
                  style={{ color: "var(--accent-text)" }}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Mount it in `app/layout.tsx`**

Add `import { SiteFooter } from "@/components/ui/SiteFooter";` and place `<SiteFooter />` **after `{children}`, inside `<SmoothScroll>`** — the footer scrolls with the page; only the welcome sits outside the scroller.

- [ ] **Step 5: Run tests, then the full gate**

Run: `npx vitest run components/ui/SiteFooter.test.tsx content/site.test.ts` — Expected: PASS.
Run: `npm test && npm run build && npm run lint` — Expected: green (layout change touches every route's render).

- [ ] **Step 6: Commit**

```bash
git add components/ui/SiteFooter.tsx components/ui/SiteFooter.test.tsx app/layout.tsx
git commit -m "feat: the Website Directory — one zero-JS footer on every route

The section the client named when dropping the enquiry form. Plain
anchors to every place on every page, which is also the site's first
working no-JS navigation — the menu's one documented limitation,
finally covered. Contact imported from the dials' own constants so the
footer can never disagree with the pages."
```

---

### Task 3: `SiteMenu` — the places on cream glass, behind a hamburger

**Files:**
- Create: `components/ui/SiteMenu.tsx`, `components/ui/SiteMenu.test.tsx`
- Delete: `components/ui/ChapterMenu.tsx`
- Modify: `components/ui/SiteHeader.tsx`, `app/globals.css`, `lib/sizes.test.ts`
- Modify: `scripts/check_rule_in.mjs`, `scripts/check_contrast_over_photos.mjs` (selector rename only, in this task)

**Interfaces:**
- Consumes: `SITE` (Task 1); `Photo`, `useScrollControl`, `usePathname` from `next/navigation`.
- Produces: `SiteMenu({ places, cards })` where `places: readonly { label; href; region? }[]` (serialisable) and `cards: Partial<Record<string, React.ReactNode>>` keyed by href; `MENU_CARD_SIZES` / `MENU_CARD_BOX` exported from **`SiteHeader.tsx`** (the server file that renders the `Photo`s).

**The two structural rules this task lives or dies by:**

1. **`SiteMenu` is `"use client"` and must not import `Photo` or `lib/media`.** The cards are rendered on the server in `SiteHeader` and passed in as `children`-style props — the PinnedCollage pattern. Importing `Photo` from the client file drags every manifest entry's base64 blur into the first load; `npm run verify:budget` is the tripwire.
2. **The card `<Photo>`s must not be in the DOM until the menu first opens.** The panel is permanently mounted (inert while closed) for its accessibility machinery, and `visibility: hidden` does not stop an image intersecting the viewport — rendered eagerly, both cards join every page's initial transfer against the hero on 4G. Gate their *insertion* on first open: the React elements arrive as props either way (cheap markup in the RSC payload), but `{everOpened && cards[href]}` keeps the `<img>`s out of the document until asked.

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/SiteMenu.test.tsx
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SITE } from "@/content/site";
import { SiteMenu } from "./SiteMenu";

// SiteMenu reads the current route to mark "you are here".
const pathname = vi.hoisted(() => ({ value: "/mahua-vann" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

const CARDS = {
  "/mahua-vann": <img data-testid="vann-card" alt="" />,
  "/mahua-tola": <img data-testid="tola-card" alt="" />,
};

const open = (r: ReturnType<typeof render>) =>
  fireEvent.click(r.container.querySelector("button[aria-controls='site-menu']")!);

describe("SiteMenu", () => {
  it("is a hamburger with its name in the accessibility tree, not on screen", () => {
    const { container } = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    const trigger = container.querySelector("button[aria-controls='site-menu']")!;
    expect(trigger.getAttribute("aria-label")).toBe(SITE.nav.menuLabel);
    expect(trigger.textContent?.trim()).toBe("");
    expect(trigger.querySelector("svg")).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps the card photographs out of the DOM until the first open", () => {
    // The panel is always mounted for its dialog machinery, and visibility:
    // hidden does not stop an image intersecting the viewport — eager cards
    // would join every page's initial transfer against the hero on 4G.
    const r = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    expect(r.queryByTestId("vann-card")).toBeNull();
    open(r);
    expect(r.queryByTestId("vann-card")).not.toBeNull();
    expect(r.queryByTestId("tola-card")).not.toBeNull();
  });

  it("lists every place and marks the one you are standing on", () => {
    const r = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    open(r);
    for (const place of SITE.places) {
      expect(
        r.container.querySelector(`#site-menu a[href='${place.href}']`),
        `${place.label} missing`,
      ).not.toBeNull();
    }
    const current = r.container.querySelector("#site-menu a[aria-current='page']");
    expect(current?.getAttribute("href")).toBe("/mahua-vann");
  });

  it("closes on the current place instead of reloading it", () => {
    const r = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    open(r);
    const current = r.container.querySelector("#site-menu a[aria-current='page']")!;
    const clicked = fireEvent.click(current);
    // fireEvent.click returns false when preventDefault was called.
    expect(clicked).toBe(false);
    expect(
      r.container.querySelector("button[aria-controls='site-menu']")?.getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("gives each lodge its region in the accessible name and Home none", () => {
    const r = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    open(r);
    const vann = r.container.querySelector("#site-menu a[href='/mahua-vann']")!;
    expect(vann.textContent).toContain("Pench");
    const home = r.container.querySelector("#site-menu a[href='/']")!;
    expect(home.textContent?.trim()).toBe("Home");
  });
});
```

- [ ] **Step 2: Run it to verify it fails** — `npx vitest run components/ui/SiteMenu.test.tsx` — Expected: FAIL, module not found.

- [ ] **Step 3: Write `SiteMenu.tsx`**

Start from `ChapterMenu.tsx` — its open/close state, focus trap, Escape-to-trigger, `inert`, and `useScrollControl` lock are reviewed and keep, verbatim where possible, including their comments. What changes:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useScrollControl } from "@/components/motion/SmoothScroll";
import { SITE, type SitePlace } from "@/content/site";

/**
 * The places, on cream glass, behind a hamburger. `ChapterMenu`'s successor —
 * same reviewed dialog machinery (focus trap, Escape-to-trigger, inert-when-
 * closed, the Lenis-aware scroll lock), new job: the menu is the *site's*,
 * not the page's. Client rulings, 10 Aug 2026.
 *
 * **No `Photo` import here, ever.** This file is `"use client"`, and Photo
 * drags the whole media manifest with it. The lodge cards arrive from
 * `SiteHeader` (a server component) as rendered elements in `cards` — and
 * they are inserted only after the first open, because the always-mounted
 * panel would otherwise put two lazy images inside the viewport's box at
 * every page load, visibility: hidden notwithstanding.
 */
export function SiteMenu({
  places,
  cards,
}: {
  places: readonly SitePlace[];
  cards: Partial<Record<string, React.ReactNode>>;
}) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const pathname = usePathname();
  // …triggerRef/panelRef/closeRef/scroll + close() + the focus/Escape effect,
  // carried over from ChapterMenu unchanged, with `id="site-menu"` throughout…

  const current = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  const show = () => {
    setOpen(true);
    setEverOpened(true);
  };
  // trigger onClick: open ? close() : show()
  // …
}
```

The trigger (replacing the text button; keeps `data-header-tint="ink"`, `aria-expanded`, `aria-controls="site-menu"`, the `--header-ink` focus ring):

```tsx
<button
  ref={triggerRef}
  type="button"
  aria-label={SITE.nav.menuLabel}
  aria-expanded={open}
  aria-controls="site-menu"
  onClick={() => (open ? close() : show())}
  data-header-tint="ink"
  // -m-2 p-2 buys a ~40px hit target without moving the visual mark.
  className="pointer-events-auto -m-2 justify-self-start p-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--header-ink)]"
>
  {/* Three hairlines in the header's own ink — cream over the hero, ink on
      the cream bar — via currentColor, exactly as the word was. */}
  <svg aria-hidden="true" width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M0 1h24M0 8h24M0 15h24" />
  </svg>
</button>
```

The panel: same fixed full-screen dialog, `id="site-menu"`, but `className` gains `site-menu-glass` and **loses** the inline `backgroundColor: var(--overlay)`. Type inside turns ink: the hint stays `--accent-text`, Close becomes `--text` with an `--accent-text` focus ring. The list:

```tsx
<nav aria-label={SITE.nav.menuTitle} className="flex flex-1 flex-col justify-center py-12 short:py-6">
  <ul>
    {places.map((place) => (
      <li key={place.href} className="border-t" style={{ borderColor: "var(--accent)" }}>
        <a
          href={place.href}
          aria-current={current(place.href) ? "page" : undefined}
          onClick={(e) => {
            if (current(place.href)) e.preventDefault();
            close();
          }}
          className={`group flex items-center gap-6 py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)] md:gap-10 md:py-6 short:py-3 ${
            current(place.href) ? "opacity-50" : ""
          }`}
        >
          {place.cardMediaId && (
            <span className="block w-28 shrink-0 overflow-hidden sm:w-40 md:w-52" aria-hidden="true">
              {/* 3:2 box; the server rendered the Photo, we only decide when
                  it enters the document. */}
              {everOpened && cards[place.href]}
            </span>
          )}
          <span className="flex flex-col gap-1">
            <span className="rule-in font-[family-name:var(--font-display)] text-[clamp(1.6rem,4.6vw,3.2rem)] font-light leading-[1.1] text-[color:var(--text)] short:text-[clamp(1.2rem,3vw,1.8rem)]">
              {place.label}
            </span>
            {place.region && (
              <span className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.24em] md:text-xs" style={{ color: "var(--accent-text)" }}>
                {place.region}
              </span>
            )}
          </span>
        </a>
      </li>
    ))}
  </ul>
</nav>
```

- [ ] **Step 4: The glass, in `app/globals.css`**

```css
/*
 * The menu's cream glass. A pure transparent blur cannot guarantee legible
 * type over an arbitrary page, so the frost carries the site's own paper as
 * a wash; the worst-pixel contrast of ink type over it is MEASURED by
 * scripts/check_contrast_over_photos.mjs with the menu opened over a
 * full-bleed photograph — the worst backdrop the site can produce.
 *
 * Three states, in order of grace: blur where supported; near-solid paper
 * where backdrop-filter does not exist (raw page behind ink type is the
 * failure this rules out); solid paper for a visitor who asked for reduced
 * transparency.
 */
.site-menu-glass {
  background-color: color-mix(in srgb, var(--bg) 82%, transparent);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .site-menu-glass {
    background-color: color-mix(in srgb, var(--bg) 97%, transparent);
  }
}
@media (prefers-reduced-transparency: reduce) {
  .site-menu-glass {
    background-color: var(--bg);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
```

- [ ] **Step 5: Rewire `SiteHeader.tsx`, delete `ChapterMenu.tsx`**

`SiteHeader` keeps `ctaHref`/`ctaLabel`/`chapters` (hero-watch only) and **loses `nav`**. It renders the cards on the server and exports their sizes:

```tsx
import { Photo } from "@/components/ui/Photo";
import { SiteMenu } from "@/components/ui/SiteMenu";
import { SITE } from "@/content/site";

/**
 * The menu's lodge cards, drawn at up to ~208px (`md:w-52`). Rendered HERE,
 * on the server, and handed to the client menu as elements — `SiteMenu` must
 * never import `Photo` (see the architecture rule; the manifest is the
 * payload). Exported for `lib/sizes.test.ts`.
 */
export const MENU_CARD_SIZES = "(min-width: 768px) 208px, (min-width: 640px) 160px, 112px";
export const MENU_CARD_BOX = 3 / 2;

const menuCards = Object.fromEntries(
  SITE.places
    .filter((p) => p.cardMediaId)
    .map((p) => [
      p.href,
      <span key={p.href} className="block aspect-[3/2] w-full">
        <Photo
          id={p.cardMediaId!}
          decorative
          sizes={MENU_CARD_SIZES}
          box={MENU_CARD_BOX}
          pictureClassName="block h-full w-full"
          className="h-full w-full object-cover"
        />
      </span>,
    ]),
);
```

…and in the JSX, `<ChapterMenu chapters={chapters} nav={nav} />` becomes `<SiteMenu places={SITE.places} cards={menuCards} />`. Then `git rm components/ui/ChapterMenu.tsx`.

- [ ] **Step 6: `lib/sizes.test.ts`** — add the import from `SiteHeader`, a `{ name: "SiteMenu.card", sizes: MENU_CARD_SIZES, box: MENU_CARD_BOX }` slot, and `{ file: "components/ui/SiteHeader.tsx", declared: MENU_CARD_BOX }` in `CASES` with a one-line comment. Run the suite, read the distinct-string count it reports (expect 23 → 24 — the card string is new), set it, comment why.

- [ ] **Step 7: Rig selector rename** — in `scripts/check_rule_in.mjs` and `scripts/check_contrast_over_photos.mjs`, every `chapter-menu` becomes `site-menu` (the `aria-controls` click targets and the `#chapter-menu` panel selectors). Do not change probe logic in this task.

- [ ] **Step 8: Callers of the old `nav` prop** — `components/property/PropertyPage.tsx` drops its `nav` prop and stops passing it to `SiteHeader`; `app/mahua-vann/page.tsx` / `app/mahua-tola/page.tsx` drop `nav={VANN_NAV}` / `nav={TOLA_NAV}`; `content/mahua-vann.ts` / `content/mahua-tola.ts` delete `VANN_NAV` / `TOLA_NAV`; `content/home.ts`'s `nav` shrinks to `{ cta: … }` (touch nothing else in that file — another session works nearby). Home's menu strings lived in `HOME.nav` and die with it.

- [ ] **Step 9: Watch the card-gating test fail** — temporarily render `{cards[place.href]}` without the `everOpened` gate; `npx vitest run components/ui/SiteMenu.test.tsx` must go red on "keeps the card photographs out of the DOM until the first open"; restore, green.

- [ ] **Step 10: Full gate** — `npm test && npm run build && npm run lint && npx tsc --noEmit`, then `npm run verify:budget` (the menu's client bundle must not have grown by a manifest — this is the structural rule's tripwire).

- [ ] **Step 11: Commit**

```bash
git add -A components/ui content app/globals.css app/mahua-vann app/mahua-tola components/property lib/sizes.test.ts scripts/check_rule_in.mjs scripts/check_contrast_over_photos.mjs
git commit -m "feat: the places menu — cream glass, hamburger, the lodges as cards

ChapterMenu's reviewed dialog machinery, new job: the menu is the
site's, not the page's. Cards render on the server and enter the DOM
only on first open, so they cost the page load nothing; the glass
carries the site's own paper as a wash with an @supports fallback, and
its contrast is measured, not assumed."
```

---

### Task 4: The lockup links Home

**Files:**
- Modify: `components/ui/SiteHeader.tsx`
- Test: extend `components/ui/StickyHeader.test.tsx` if it renders the header's children; otherwise add the assertion to `components/ui/SiteMenu.test.tsx`'s file as a separate `describe("SiteHeader lockup")` only if `SiteHeader` is renderable in jsdom — it is (server component, no hooks). Create `components/ui/SiteHeader.test.tsx` if none exists.

- [ ] **Step 1: Failing test**

```tsx
// components/ui/SiteHeader.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("makes the lockup a link home, opted out of the hairline", () => {
    // The lockup was inert — on a subpage, a dead end where every visitor
    // expects a way back. data-rule="none" because a hairline under an image
    // lockup reads as a rendering fault (the pills' own opt-out).
    const { container } = render(<SiteHeader ctaHref="#invitation" />);
    const home = container.querySelector("a[href='/']");
    expect(home).not.toBeNull();
    expect(home?.getAttribute("data-rule")).toBe("none");
    expect(home?.getAttribute("aria-label")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it, watch it fail.** Then wrap `<BrandMark className="justify-self-center" />` as:

```tsx
<a
  href="/"
  aria-label="Mahua Resorts — home"
  data-rule="none"
  className="pointer-events-auto justify-self-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--header-ink)]"
>
  <BrandMark />
</a>
```

Note `aria-label` here is chrome naming, like the hamburger's — not page copy; it stays in the component as every `aria-label` on fixed chrome does. `pointer-events-auto` matters: the header's grid children re-enable pointer events individually.

- [ ] **Step 3: Green, then full gate** (`npm test && npm run build && npm run lint`), then commit:

```bash
git add components/ui/SiteHeader.tsx components/ui/SiteHeader.test.tsx
git commit -m "feat: the lockup links Home from every page"
```

---

### Task 5: `PropertyBar` learns the footer is quiet ground

**Files:**
- Modify: `components/property/PropertyBar.tsx`, `components/property/PropertyBar.test.tsx`, `components/property/PropertyPage.tsx`

**Interfaces:**
- Consumes: `SITE_FOOTER_ID` from `content/site.ts` (NOT from `SiteFooter.tsx` — that import would drag the footer's server-only dial imports into the client bundle).
- Produces: `PropertyBar` gains required prop `footerId: string`; `PropertyPage` passes `footerId={SITE_FOOTER_ID}`.

- [ ] **Step 1: Failing test** — extend the existing observer-seam test file:

```tsx
it("stays away while the footer is on screen", () => {
  // Without this, the bar steps aside at the invitation and then REAPPEARS
  // over the directory footer — a Book bar floating on the site's own
  // contact details, doubling the ask the invitation just made quietly.
  const observers: Array<(entries: { isIntersecting: boolean }[]) => void> = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        observers.push(cb);
      }
      observe() {}
      disconnect() {}
    },
  );
  document.body.innerHTML = `<div id="vann-hero"></div><div id="vann-invitation"></div><div id="site-footer"></div>`;
  const { container } = render(<PropertyBar {...props} footerId="site-footer" />);
  // observers: [hero, invitation, footer] in mount order.
  act(() => observers[0]([{ isIntersecting: false }])); // past the hero — bar arrives
  expect(container.querySelector("[data-property-bar]")).not.toBeNull();
  act(() => observers[2]([{ isIntersecting: true }])); // footer on screen — bar leaves
  expect(container.querySelector("[data-property-bar]")).toBeNull();
  act(() => observers[2]([{ isIntersecting: false }])); // scrolled back up — bar returns
  expect(container.querySelector("[data-property-bar]")).not.toBeNull();
});
```

Also update the existing tests' `props` to carry `footerId: "site-footer"`, and the mount-order comment.

- [ ] **Step 2: Watch it fail** (`observers[2]` is undefined — only two observers exist). Then implement: a third state `atFooter`, a third `watch(footerId, setAtFooter, true)`, and `const visible = shown ?? (pastHero && !atInvitation && !atFooter);`. Update the doc comment's step-aside sentence to name both quiet zones.

- [ ] **Step 3: Green, full gate, commit**

```bash
git add components/property/PropertyBar.tsx components/property/PropertyBar.test.tsx components/property/PropertyPage.tsx
git commit -m "fix: the booking bar treats the directory footer as quiet ground"
```

---

### Task 6: The menu-over-photograph probe, verification, evidence

**Files:**
- Modify: `scripts/check_contrast_over_photos.mjs` (one new capability + probes)
- Create: `docs/reviews/2026-08-10-site-navigation/` (artefacts + README)
- Modify: `docs/DECISIONS.md`, `docs/PROJECT-STATE.md`, `CLAUDE.md` (status, commands, counts)

- [ ] **Step 1: Give the contrast rig an "open the menu first" probe.** In `measure()`, honour an optional `pre: "menu"` on a run: after scrolling to `run.at`, `await page.click("button[aria-controls='site-menu']"); await page.waitForTimeout(700);` before collecting boxes. Add to EVERY route's probe set (the frost's worst case is the hero photograph behind it, so `at` = that route's hero):

```js
{ name: "menu · place over frost", min: 3, at: "#<heroId>", pre: "menu", container: "#site-menu", sel: "#site-menu a span.rule-in", text: INK },
{ name: "menu · region over frost", min: 4.5, at: "#<heroId>", pre: "menu", container: "#site-menu", sel: "#site-menu a [class*='--accent-text']", text: [0x7a, 0x5c, 0x18] },
```

(Adjust the region selector to whatever the shipped markup exposes — add a `data-contrast="menu-region"` hook in `SiteMenu` if a class selector proves brittle, following the header-pill precedent.) The home route's set gains the same pair. **Watch one fail**: temporarily set the glass wash to 40% and confirm the probe goes red over the hero, then restore 82%.

- [ ] **Step 2: The measurement pass.** Kill port 3100, `npm run build`, fresh `npx next start -p 3100`, then against it:

```bash
node scripts/measure_density.mjs --url http://localhost:3100/            --out docs/reviews/2026-08-10-site-navigation/home-density.json
node scripts/measure_density.mjs --url http://localhost:3100/mahua-vann  --out docs/reviews/2026-08-10-site-navigation/vann-density.json
node scripts/measure_density.mjs --url http://localhost:3100/mahua-tola  --out docs/reviews/2026-08-10-site-navigation/tola-density.json
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/            --out docs/reviews/2026-08-10-site-navigation/home-contrast.json
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-vann  --out docs/reviews/2026-08-10-site-navigation/vann-contrast.json
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-tola  --out docs/reviews/2026-08-10-site-navigation/tola-contrast.json
node scripts/check_rule_in.mjs --url http://localhost:3100/            --out docs/reviews/2026-08-10-site-navigation/home-rule-in.json
node scripts/check_rule_in.mjs --url http://localhost:3100/mahua-vann  --out docs/reviews/2026-08-10-site-navigation/vann-rule-in.json
node scripts/check_rule_in.mjs --url http://localhost:3100/mahua-tola  --out docs/reviews/2026-08-10-site-navigation/tola-rule-in.json
node scripts/check_header.mjs --port 3100
npm run verify:budget -- --no-build
```

Expected: all exit 0. The footer adds links on every route — rule-in walks them automatically. Density: the footer is a mostly-type band at each page's end; if any *chapter* newly fails its 45%, something moved that should not have — investigate, do not re-tune. **Read exit codes.**

**Caveat before starting:** if `git status` shows another session's uncommitted home-page work (forest overlay), note in the README that measurements were taken with it present, or coordinate a clean build — do not silently publish contaminated figures. This bit us on 10 Aug.

- [ ] **Step 3: Screenshots and eyes.** `node scripts/capture_property_pages.mjs --port 3100 --out docs/reviews/2026-08-10-site-navigation` for the property routes, plus capture `/` at the four widths, plus **the menu open** at 390 and 1440 on `/` and `/mahua-vann` (a short Playwright snippet in the same style: goto, click `button[aria-controls='site-menu']`, wait 700ms, screenshot viewport). Open every one with the Read tool. Judge by eye, and say what you saw: the glass legible over the hero at 390 (`DECISIONS.md` §2 #29 is the standing warning that no rig looks there); the hamburger visible in both header states; the cards cropping sensibly at 112px wide; the footer scanning as a colophon, not a marketing band; the bar absent over the footer.

- [ ] **Step 4: The record.** Write `docs/reviews/2026-08-10-site-navigation/README.md` (figures + artefact links + anything open). Update: `CLAUDE.md` status table (menu/footer shipped; test count re-read from `npm test`, not guessed), `docs/PROJECT-STATE.md` (the navigation is site-wide; ChapterMenu retired), `docs/DECISIONS.md` §1 (the four 10 Aug rulings: places-only menu, directory footer now, image cards + Home plain, cream glass + hamburger — with the client's own words where he gave them).

- [ ] **Step 5: Final commit**

```bash
git add docs/reviews/2026-08-10-site-navigation docs/DECISIONS.md docs/PROJECT-STATE.md CLAUDE.md scripts/check_contrast_over_photos.mjs
git commit -m "docs: close out the site navigation with evidence

Density, contrast (including the new menu-over-photograph probes),
rule-in and the JS budget re-derived on all three routes; the menu
screenshotted open over the hero at 390 and looked at, because no rig
measures type over a translucent surface at phone width."
```

---

## What this plan deliberately does not do

- **No pages that do not exist** — About Us / In The News / Offers slot into `SITE.places` when built.
- **No WhatsApp bubble, socials, or newsletter** (spec §4).
- **No press in the footer** — the `vann-press` question stays open with the client, unpreempted.
- **No home-page content changes** — chrome only; the forest-overlay session owns that ground.
