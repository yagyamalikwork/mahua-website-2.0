"use client";

import { useEffect, useState } from "react";

/**
 * The one decision behind the header that stays — *has the hero gone?* — and the
 * two things that follow from it.
 *
 * It takes the finished header row as `children`, built by `SiteHeader` on the
 * server. That is not a stylistic split: this file is a client module, so
 * anything it *imports* lands in the browser bundle, and `BrandMark` alone would
 * drag `lib/brand-emblem.ts` and `content/home.ts` across the boundary with it.
 * Handed over as rendered children, the lockup, the pill and the copy stay on the
 * server, exactly as `CollageStage` keeps `lib/media-manifest.ts` off the client.
 *
 * ## Why the header may now follow at all
 *
 * Until 5 Aug 2026 this header was `absolute` and scrolled away with the hero,
 * and its comment explained why: cream type over a photograph is only legible
 * while there is a photograph under it. That objection was answered by measuring
 * the reference the client chose. `thesujanlife.com` is `fixed` at 77px from the
 * first pixel, transparent at the top and cream from the hero onward — **and its
 * nav type never changes colour at all** (`docs/reviews/2026-08-05-sujan-scroll/`).
 * A bar earns legibility by gaining a background, not by inverting its type. Ours
 * does both, because the client asked for the wordmark to arrive in the brand's
 * own brown once the bar is cream; the background is what makes that legible and
 * the background is what would carry the header even if the colour never moved.
 *
 * ## Three states, and the first one is what the server renders
 *
 * `static` -> `top` -> `scrolled`, and `static` is where every visitor starts:
 *
 * | | `position` | Bar | Menu | Wordmark |
 * |---|---|---|---|---|
 * | `static` | `absolute` | transparent | cream | cream |
 * | `top` | `fixed` | transparent | cream | cream |
 * | `scrolled` | `fixed` | `paper` + a gold hairline | `ink` | `brand` |
 *
 * **The header is server-rendered not-following, and only script may make it
 * follow** — the arrangement `CollageStage` uses for the pin, for the same class
 * of reason. A fixed bar that cannot be told when the photograph beneath it ran
 * out is cream type on a cream page: not merely unanimated, *invisible*. So
 * `fixed` is not applied until an observer has actually reported a state, which
 * folds every failure into one path. No JavaScript, no `IntersectionObserver`, a
 * thrown error, a hero that is not in the document — all of them leave the header
 * where it has always been, scrolling away with the hero it belongs to, readable
 * the whole way. Nothing has to remember to handle them separately.
 *
 * At scroll 0 `absolute` and `fixed` paint the same pixels, so the upgrade is
 * invisible to anyone loading the page at the top.
 *
 * Reduced motion is deliberately *not* a reason to stay `static`. Following is
 * not motion, and a visitor who asked for less of it still needs a legible
 * header; `app/globals.css` flattens the colour transition to nothing for them,
 * which makes the change instant rather than fast. CLAUDE.md non-negotiable #4.
 */

/**
 * How much of the hero must be left when the bar starts becoming cream.
 *
 * A quarter of the viewport, and it is a proportion rather than a pixel count so
 * that it is the same fraction of the same photograph at 320px and at 1920px —
 * the reason the state is observed at all instead of read off a scroll position.
 *
 * It is not zero, and that is the whole subtlety of this task. The two legible
 * states are *cream type on a photograph* and *dark type on a cream bar*, and
 * every frame of the crossfade between them is less legible than either end —
 * with a cream page beneath, a bar fading from `transparent` to `paper` is not
 * changing its backdrop at all, so for 0.9s the only thing moving is the type,
 * out of cream and toward ink, straight through invisible. Under the hero's
 * photograph the cream end of that fade is carried the whole way. So the change
 * has to **begin while the photograph is still there**.
 *
 * A quarter of a screen is enough at every viewport, and this is measured rather
 * than reasoned — the gap between where the hero's bottom edge sits when the
 * state flips and where the header's *content* ends (its box is taller than its
 * type):
 *
 * | viewport | hero bottom at the flip | header content ends | photograph to spare |
 * |---|---|---|---|
 * | 320x800 | 196px | 54px | 142px |
 * | 390x844 | 208px | 54px | 154px |
 * | 844x390 | 94px | 73px | **21px** |
 * | 1440x900 | 224px | 73px | 151px |
 * | 1920x900 | 224px | 73px | 151px |
 *
 * The landscape phone is the tight one and it still clears. Re-derive the table
 * with `scripts/check_header.mjs`.
 *
 * Written as a `rootMargin` on the top edge: shrinking the root's top by 25%
 * means the hero stops intersecting when its bottom edge passes a quarter of the
 * way down the screen.
 */
const HERO_TAIL = "-25% 0px 0px 0px";

type HeaderState = "static" | "top" | "scrolled";

export function StickyHeader({
  heroId,
  children,
}: {
  /** The id of the chapter the bar is transparent over. `content/chapters.ts`. */
  heroId: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<HeaderState>("static");
  const [bar, setBar] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!bar) return;
    if (typeof IntersectionObserver === "undefined") return;
    const hero = document.getElementById(heroId);
    // Not defensive noise: the header is composed by `app/page.tsx` beside a
    // chapter list it does not control, and a bar left `fixed` with no way to
    // learn that the photograph has gone is the one outcome worse than a bar
    // that does not follow.
    if (!hero) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Every state change lives in the callback, which is what
        // `react-hooks/set-state-in-effect` asks for and also where it belongs:
        // an observer always delivers a first callback, so this is where the
        // header first learns which of its two states it is in, and where it
        // learns every time afterwards. Never disconnected on first sight — a
        // visitor scrolling back up must get the transparent bar again.
        for (const entry of entries) setState(entry.isIntersecting ? "top" : "scrolled");
      },
      { rootMargin: HERO_TAIL },
    );
    observer.observe(hero);

    /**
     * The bar's own height, published for `scroll-padding-top`.
     *
     * A fixed bar covers the top of whatever an anchor scrolls to, and
     * `ChapterMenu` navigates to seven chapters by `href="#id"`. The offset has
     * to be the header's height, and the header's height is three padding steps,
     * a font size that arrives with the webfont and a border — knowable only
     * after layout. So it is measured rather than restated in CSS, where it
     * would be a second copy free to drift from the first.
     *
     * Only ever set from here, so the fallback in `app/globals.css` is `0px` and
     * a page whose header is not following does not offset its anchors. That is
     * the correct answer for exactly the same reason it is the correct answer
     * for `static`.
     */
    const publishHeight = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${Math.round(bar.getBoundingClientRect().height)}px`,
      );
    };
    publishHeight();

    const resize =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(publishHeight);
    resize?.observe(bar);

    return () => {
      observer.disconnect();
      resize?.disconnect();
      document.documentElement.style.removeProperty("--header-height");
    };
  }, [bar, heroId]);

  return (
    <header
      // A callback ref, not `useRef`: the effect must re-run once the element
      // exists, and a ref object's `.current` changing does not do that.
      ref={setBar}
      data-site-header=""
      // Absent, never `"false"`. The absence of the attribute is the at-rest
      // state here exactly as it is for `data-enter`, so the rules in
      // `app/globals.css` describe the change and never the resting state.
      data-scrolled={state === "scrolled" ? "" : undefined}
      // `pointer-events-none` survives becoming fixed, and the `pointer-events-auto`
      // on the menu, the lockup's row and the pill is what makes those clickable.
      // A bar that spans the top of every screen for the whole page must not be
      // the thing that swallows a click meant for the page beneath it.
      className={`pointer-events-none inset-x-0 top-0 z-40 ${
        state === "static" ? "absolute" : "fixed"
      }`}
    >
      {children}
    </header>
  );
}
