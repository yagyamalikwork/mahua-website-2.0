import type { StripLabels } from "@/components/sections/ExperienceStrip";
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
   * existing.
   *
   * **The strip's own three strings (`region`/`hint`/`jump`) lived in
   * `content/home.ts`'s `HOME.strip` from 19 Aug until 26 Aug 2026**, on the
   * reasoning that they belonged to one section of one page while this dial
   * was for strings the menu and the footer must not be able to disagree
   * about. The client's ruling that both property pages carry the identical
   * card strip made that reasoning false — see `STRIP_LABELS`, below `SITE`,
   * for where they live now and why.
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

/**
 * The three fixed strings around `05 · Experiences`'/`03 · The Experience`'s
 * card strip that are not per-card: the scroll region's accessible name, the
 * "Scroll →" hint, and the pager's "Jump to" prefix.
 *
 * **Moved here from `content/home.ts`'s `HOME.strip` on 26 August 2026**, the
 * day the client asked for the identical card strip on both property pages
 * (*"replace it with the exact same copy-pasted activities carousel from our
 * homepage"*). A string all three pages must agree on belongs beside
 * `SITE.nav`'s own four — the ones the menu and the footer must never name
 * differently — not inside one page's own content module. `content/home.ts`
 * now reads `strip: STRIP_LABELS` and re-exports it as `HOME.strip` unchanged,
 * so nothing that already reached for `HOME.strip` had to change.
 *
 * Not folded into `SITE` itself: `SITE.nav`/`.places`/`.footer` are strings
 * that appear on every route regardless of what a page is about; these three
 * belong to one specific chapter that happens to now recur on three pages,
 * which is a narrower claim. A standalone export says exactly that.
 */
export const STRIP_LABELS: StripLabels = {
  /**
   * The accessible name of the scroll container, and of the pager beside it.
   *
   * A scrollable region is announced by its label or not at all, and "list"
   * on its own tells a screen-reader user nothing about why they have landed
   * in one that moves horizontally. It names the thing and says which way.
   */
  region: "Experiences — scroll sideways",
  /**
   * The visible affordance under the strip.
   *
   * **The client's own document's, verbatim** —
   * `Brand&Design-Guidelines/mahua-home-v2-dusk.html` sets
   * `.hint { Scroll → }` beneath its filmstrip. `aria-hidden` in the markup:
   * it duplicates what `region` already says, and the arrow is a glyph rather
   * than a word.
   */
  hint: "Scroll →",
  /**
   * The accessible name of a pager link, followed by the activity's own title.
   *
   * The visible text of each is a two-digit number, and six numbers are six
   * links a screen reader cannot tell apart. "Show — Village Craft" is
   * distinct by construction and invents no copy: the second half is the
   * card's own title.
   */
  jump: "Show",
};

/**
 * The reviews widget's one shared string — its region landmark's accessible
 * name.
 *
 * **Moved here from `content/home.ts`'s own `HOME.reviews.region` on 26 August
 * 2026, for the identical reason `STRIP_LABELS` moved here above it the same
 * day.** `ReviewWidget` mounts under `04 · Written About` on both property
 * pages now, as well as at the foot of the home page, and this project's own
 * rule is one string, one place: three call sites reaching for their own copy
 * of the same sentence is exactly the drift `content/site.ts` exists to rule
 * out, not a second, unrelated instance of it.
 *
 * `content/home.ts` still reads `HOME.reviews.region` — it now points here
 * rather than holding the literal — so `Invitation.tsx`'s existing call site
 * and every test written against it keep working with no edit required, the
 * same trick `STRIP_LABELS` played for `HOME.strip`.
 *
 * Nobody at Mahua wrote this sentence and no client review will ever ask for
 * it to change: it exists so the widget's `aria-label` says something truthful
 * to a screen reader instead of nothing. **Named Tripadvisor on purpose** —
 * `ReviewWidget` mounts the client's own Elfsight embed, and that embed
 * genuinely is a live Tripadvisor feed (`lib/elfsight.ts`). The wording claims
 * nothing about what the reviews say, only where they come from.
 */
export const REVIEWS_LABEL = "Guest reviews from Tripadvisor";
