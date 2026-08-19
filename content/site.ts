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
  /** The room gallery — the click-to-expand the client asked for on 13 Aug
   * 2026 ("gallery-style"), with arrows. Labels only; the mechanism is CSS
   * `:target` (a first attempt on the browser's own popover machinery was
   * measured, in a browser, to nest its arrows instead of replacing them —
   * see docs/DECISIONS.md §18 — and was replaced same-day). Still carries
   * no script. */
  roomGallery: {
    open: "View larger",
    previous: "Previous room",
    next: "Next room",
    close: "Close",
  },
  /*
   * **`coverflow: { previous, next }` was here from 16 to 19 Aug 2026** — the
   * two arrow labels each card of the pinned carousel carried. That section is a
   * horizontal card strip now and its pager is six numbered links, each named by
   * its own activity's title, so there is no shared word for either of them to
   * borrow: nothing was reworded, the control that needed the words stopped
   * existing. `content/home.ts`'s `HOME.strip` carries the strip's three
   * strings, because they belong to one section of one page and this dial is for
   * strings the menu and the footer must not be able to disagree about.
   *
   * The half of that entry worth keeping is its own last paragraph, and it still
   * binds the pager: six links whose visible text is "01"…"06" are six links a
   * screen reader cannot tell apart, so each `aria-label` appends the activity's
   * own title — and the visible label stays a subset of the accessible name,
   * which is WCAG 2.5.3.
   */
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
