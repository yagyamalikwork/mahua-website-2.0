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
   * 2026 ("gallery-style"), with arrows. Labels only; the mechanism is the
   * browser's own popover machinery and carries no script. */
  roomGallery: {
    open: "View larger",
    previous: "Previous room",
    next: "Next room",
    close: "Close",
  },
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
