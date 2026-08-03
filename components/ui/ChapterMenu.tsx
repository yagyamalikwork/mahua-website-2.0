"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/content/chapters";
import { HOME } from "@/content/home";

/**
 * The header's menu, and the seven numbered chapters it goes to.
 *
 * It exists because the alternative was worse. The header carried a `<button>`
 * labelled "Menu" that did nothing at all — the most prominent affordance on the
 * page, promising something it had no intention of doing. Removing it was the
 * other option; this is the one that keeps the reference's three-item header and
 * makes the promise true.
 *
 * **The list is `content/chapters.ts`, filtered.** Not a second list of links
 * that can fall out of step with the page: a chapter with a `number` and a
 * `label` is by definition one the spine has named, and its `id` is already the
 * anchor `ChapterSurface` renders. Add a chapter there and it appears here.
 *
 * ## The accessibility, and why each piece is there
 *
 * - The panel is always in the DOM and `inert` while closed, so its seven links
 *   are never in the tab order and never announced when there is no menu open.
 * - `role="dialog"` + `aria-modal`, named by `nav.menuTitle`; the trigger carries
 *   `aria-expanded` and `aria-controls`.
 * - **Escape closes it and focus goes back to the trigger**, which is the whole
 *   point of trapping focus in the first place — a visitor who opens a menu by
 *   keyboard must not be dropped at the top of the document when they dismiss it.
 * - Tab cycles inside the panel while it is open.
 * - Scrolling is locked on `<html>` while it is open. The panel covers the
 *   viewport, so without this the wheel moves a page the visitor cannot see and
 *   dismissing the menu lands them somewhere they never chose.
 *
 * ## Motion
 *
 * One opacity transition, and `app/globals.css` already flattens every
 * transition under `prefers-reduced-motion: reduce`, so a visitor who asked for
 * less motion gets the panel appearing with no crossfade rather than a fast one.
 * Nothing slides. CLAUDE.md #4.
 *
 * ## The one honest limitation
 *
 * With JavaScript disabled the trigger cannot open the panel. Everything else on
 * this page is fail-safe by construction, and this is not — but every chapter it
 * would take you to is reachable by scrolling, which is the page's actual
 * proposition. The links themselves are ordinary `href="#id"` anchors, so nothing
 * about the navigation depends on script once the panel is open.
 */
export function ChapterMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const numbered = CHAPTERS.filter((c) => c.number && c.label);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const { style } = document.documentElement;
    const previousOverflow = style.overflow;
    style.overflow = "hidden";

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
      style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="chapter-menu"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="pointer-events-auto justify-self-start font-[family-name:var(--font-label)] text-[0.6rem] uppercase tracking-[0.24em] text-[color:var(--bg)] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bg)] sm:text-xs sm:tracking-[0.28em] md:text-sm"
      >
        {HOME.nav.menu}
      </button>

      <div
        ref={panelRef}
        id="chapter-menu"
        role="dialog"
        aria-modal="true"
        aria-label={HOME.nav.menuTitle}
        inert={!open}
        className={`pointer-events-auto fixed inset-0 z-50 overflow-y-auto transition-opacity duration-500 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        style={{ backgroundColor: "var(--overlay)" }}
      >
        <div className="mx-auto flex min-h-full max-w-[1600px] flex-col px-6 py-5 md:px-12 md:py-8">
          <div className="flex items-center justify-between">
            <p className="font-[family-name:var(--font-label)] text-[0.6rem] uppercase tracking-[0.24em] text-[color:var(--accent)] sm:text-xs sm:tracking-[0.28em]">
              {HOME.nav.menuHint}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="font-[family-name:var(--font-label)] text-[0.6rem] uppercase tracking-[0.24em] text-[color:var(--bg)] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bg)] sm:text-xs sm:tracking-[0.28em] md:text-sm"
            >
              {HOME.nav.menuClose}
            </button>
          </div>

          <nav
            aria-label={HOME.nav.menuTitle}
            className="flex flex-1 flex-col justify-center py-12 short:py-6"
          >
            <ol>
              {numbered.map((chapter) => (
                <li key={chapter.id} className="border-t" style={{ borderColor: "var(--accent)" }}>
                  <a
                    href={`#${chapter.id}`}
                    onClick={close}
                    className="flex items-baseline gap-5 py-4 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bg)] md:gap-8 md:py-5 short:py-2.5"
                  >
                    <span
                      className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.24em] md:text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      {chapter.number}
                    </span>
                    <span className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,4.4vw,3rem)] font-light leading-[1.1] text-[color:var(--bg)] short:text-[clamp(1.2rem,3vw,1.8rem)]">
                      {chapter.label}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </>
  );
}
