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
 *
 * ## The accessibility, and why each piece is there
 *
 * - The panel is always in the DOM and `inert` while closed, so its links are
 *   never in the tab order and never announced when there is no menu open.
 * - `role="dialog"` + `aria-modal`, named by `nav.menuTitle`; the trigger
 *   carries `aria-expanded` and `aria-controls`.
 * - **Escape closes it and focus goes back to the trigger**, which is the
 *   whole point of trapping focus in the first place — a visitor who opens a
 *   menu by keyboard must not be dropped at the top of the document when
 *   they dismiss it.
 * - Tab cycles inside the panel while it is open.
 * - **Scrolling is locked through `useScrollControl`, not through CSS here.**
 *   The first version set `overflow: hidden` on `<html>` and that is not a
 *   lock on this page: Lenis intercepts the wheel and scrolls
 *   programmatically, so the keyboard stopped and the wheel did not — the
 *   hidden page still travelled ~1,485px, and Escape returned the visitor
 *   somewhere they never chose. It also slipped through verification,
 *   because what was checked was that the CSS property had been *set*, not
 *   that scrolling had *stopped*. Those are different claims and only the
 *   second one is the requirement.
 *
 * ## Motion
 *
 * One opacity transition, and `app/globals.css` already flattens every
 * transition under `prefers-reduced-motion: reduce`, so a visitor who asked
 * for less motion gets the panel appearing with no crossfade rather than a
 * fast one. Nothing slides. CLAUDE.md #4.
 *
 * ## The one honest limitation
 *
 * With JavaScript disabled the trigger cannot open the panel. Everything
 * else on this page is fail-safe by construction, and this is not — but
 * every place it would take you to is reachable directly, by its own URL.
 * The links themselves are ordinary `href` anchors, so nothing about the
 * navigation depends on script once the panel is open.
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

  /*
   * Split by whether a place has a photograph, not by index or by name. The
   * dial decides what a place *is* — `content/site.ts` gives the two lodges a
   * `cardMediaId` and Home none — so adding a third lodge there puts it in the
   * grid automatically, and a fourth plain link lands in the row above it,
   * without anyone editing this file. A hard-coded `places.slice(1)` would have
   * been shorter and would have silently mis-sorted the first thing added.
   */
  const plainPlaces = places.filter((p) => !p.cardMediaId);
  const cardPlaces = places.filter((p) => p.cardMediaId);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scroll = useScrollControl();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    scroll?.lock();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>("a[href], button");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Unlock runs in the cleanup, not in `close`, so that unmounting while open
      // cannot leave Lenis stopped and the page frozen with nothing to unfreeze it.
      scroll?.unlock();
    };
  }, [open, close, scroll]);

  const current = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  const show = () => {
    setOpen(true);
    setEverOpened(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={SITE.nav.menuLabel}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => (open ? close() : show())}
        /*
         * The trigger is the only part of this component that lives in the
         * header's own bar, so it is the only part that changes colour with
         * it: cream over the hero's photograph, `ink` once the bar is cream.
         * `--header-ink` is set by `app/globals.css` from the header's state
         * and falls back to cream, which is what a `SiteMenu` rendered
         * anywhere else — or before script has decided anything — would get.
         * `data-header-tint` is what carries both the colour and its
         * transition.
         *
         * The focus ring takes the same value. A cream ring on a cream bar is
         * a focus indicator that exists in the markup and not on the screen.
         */
        data-header-tint="ink"
        // -m-2 p-2 buys a ~40px hit target without moving the visual mark.
        className="pointer-events-auto -m-2 justify-self-start p-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--header-ink)]"
      >
        {/* Three hairlines in the header's own ink — cream over the hero, ink on
            the cream bar — via currentColor, exactly as the word was. */}
        <svg
          aria-hidden="true"
          width="24"
          height="16"
          viewBox="0 0 24 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M0 1h24M0 8h24M0 15h24" />
        </svg>
      </button>

      <div
        ref={panelRef}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label={SITE.nav.menuTitle}
        inert={!open}
        className={`site-menu-glass pointer-events-auto fixed inset-0 z-50 overflow-y-auto transition-opacity duration-500 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="mx-auto flex min-h-full max-w-[1600px] flex-col px-6 py-5 md:px-12 md:py-8">
          <div className="flex items-center justify-between">
            <p
              /*
               * Ink, not `--accent-text`, and that is load-bearing rather than a
               * taste call: this label sits on the 82% glass, where gold measures
               * ~3.4:1 against its 4.5:1 floor. Gold here would force the wash back
               * to ~97% — the near-opaque panel the client rejected on 11 Aug when
               * he chose the glass over the accent. See `app/globals.css`'s
               * `.site-menu-glass` comment; the two decisions are one.
               *
               * It was gold until then, and no probe ever read it: `data-contrast`
               * is the hook `scripts/check_contrast_over_photos.mjs` finds it by
               * (the colour is inline, not a class, so a `[class*='--accent-text']`
               * selector matches nothing), and it was only added in the 10-11 Aug
               * review follow-up. It had been failing beside the region label that
               * triggered the whole investigation. `docs/DECISIONS.md` §2 #35.
               */
              data-contrast="menu-hint"
              className="font-[family-name:var(--font-label)] text-[0.6rem] uppercase tracking-[0.24em] sm:text-xs sm:tracking-[0.28em]"
              style={{ color: "var(--text)" }}
            >
              {SITE.nav.menuHint}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="rule-in font-[family-name:var(--font-label)] text-[0.6rem] uppercase tracking-[0.24em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)] sm:text-xs sm:tracking-[0.28em] md:text-sm"
            >
              {SITE.nav.menuClose}
            </button>
          </div>

          <nav aria-label={SITE.nav.menuTitle} className="flex flex-1 flex-col justify-center py-12 short:py-6">
            {/*
             * Two lists, because the menu holds two kinds of thing. Home is a
             * destination; the lodges are the offer. The client asked for
             * exactly this split on 10 Aug ("For Home Page we can do a simple
             * 'Home' tag") and for the lodges to sit side by side, larger, in
             * the reference site's manner, on 11 Aug.
             */}
            <ul>
              {plainPlaces.map((place) => (
                <li key={place.href} className="border-y" style={{ borderColor: "var(--accent)" }}>
                  <a
                    href={place.href}
                    aria-current={current(place.href) ? "page" : undefined}
                    onClick={(e) => {
                      if (current(place.href)) e.preventDefault();
                      close();
                    }}
                    className={`inline-block py-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)] short:py-2 ${
                      current(place.href) ? "opacity-50" : ""
                    }`}
                  >
                    <span className="rule-in rule-in--fixed font-[family-name:var(--font-display)] text-[clamp(1.3rem,3vw,2rem)] font-light leading-[1.1] text-[color:var(--text)]">
                      {place.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {/*
             * The lodges. `sm:grid-cols-2` and not sooner: at 390px two columns
             * would put each photograph under ~170px wide, which is smaller than
             * the row it replaced — the request was for *bigger*, so on a phone
             * they stack and run full width instead.
             */}
            <ul className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 md:mt-10 md:gap-10 short:mt-5 short:gap-5">
              {cardPlaces.map((place) => (
                <li key={place.href}>
                  <a
                    href={place.href}
                    aria-current={current(place.href) ? "page" : undefined}
                    onClick={(e) => {
                      if (current(place.href)) e.preventDefault();
                      close();
                    }}
                    className={`group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)] ${
                      current(place.href) ? "opacity-50" : ""
                    }`}
                  >
                    {place.cardMediaId && (
                      /*
                       * `.raise` is the hover lift, and it sits on the
                       * photograph rather than on the whole tile so the type
                       * beneath stays put — a name that tips with its picture
                       * reads as a wobble, not as depth.
                       */
                      <span className="raise block overflow-hidden" aria-hidden="true">
                        {/* 3:2 box; the server rendered the Photo, we only decide when
                            it enters the document. */}
                        {everOpened && cards[place.href]}
                      </span>
                    )}
                    <span className="mt-4 flex flex-col gap-2 md:mt-5">
                      <span className="rule-in rule-in--fixed self-start font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.4vw,2.6rem)] font-light leading-[1.1] text-[color:var(--text)] short:text-[clamp(1.2rem,3vw,1.8rem)]">
                        {place.label}
                      </span>
                      {place.region && (
                        <span
                          /*
                           * Ink, not `--accent-text`. This is the label that failed —
                           * 3.43-3.55:1 on the 82% glass against a 4.5:1 floor — and
                           * the client's ruling on 11 Aug 2026 was to keep the glass
                           * and spend the gold: the region reads in ink at 6.09-6.63:1
                           * and the wash stays where the effect was designed. Putting
                           * gold back here forces the wash to ~97% and the "Liquid
                           * Glass" brief is gone. `app/globals.css` `.site-menu-glass`.
                           *
                           * `data-contrast` is the hook
                           * `scripts/check_contrast_over_photos.mjs` finds this by. The
                           * colour is set inline via a CSS custom property, not a
                           * class, so a `[class*='--accent-text']` selector (the shape
                           * the brief for this probe first suggested) would match
                           * nothing — same lesson as `BrandMark`'s wordmark, which
                           * carries the identical hook for the identical reason.
                           */
                          data-contrast="menu-region"
                          className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.24em] md:text-xs"
                          style={{ color: "var(--text)" }}
                        >
                          {place.region}
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
