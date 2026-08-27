"use client";

import { useEffect, useState } from "react";
import { ContactLine, type PropertyContactCopy } from "@/components/property/PropertyContact";
import { PillButton } from "@/components/ui/PillButton";

/**
 * The quiet, always-reachable ask.
 *
 * Client's ruling, 9 Aug: a visitor on a property page has already chosen a
 * lodge, so asking is fair here — "seduce, not convert" (non-negotiable #2)
 * governs the home page, which is where a visitor is still deciding.
 *
 * **It fails towards absent, for the two failure modes it actually guards.**
 * With no JavaScript, `visible` never leaves its `false` default, because
 * `shown` is `undefined` and neither observer effect can run — nothing
 * renders. Without `IntersectionObserver` (an old browser, or the property
 * stubbed out in a test) the effect returns before either observer is
 * created, for the same result. That is the welcome screen's contract
 * (`docs/DECISIONS.md` §14) and it binds anything fixed over the page's
 * content: a bar that cannot be dismissed and cannot be scrolled past is a
 * wall, and the failure mode of a wall must be non-existence.
 *
 * **A thrown error is not one of those two modes.** Nothing here catches
 * one, and there is no error boundary above this component — a throw inside
 * `PropertyPage`'s own tree would surface the same way it would anywhere
 * else in the app, not as an absent bar. Said here plainly rather than
 * folded into the sentence above, which is what overclaimed it until the
 * whole-branch review's fix wave (10 Aug 2026) caught it.
 *
 * It steps aside over the closing invitation and over the site-wide footer
 * below it, so the ask is never on screen twice at once and never floats
 * over the directory's own contact details.
 *
 * `shown` is a test seam only — production always drives it from the three
 * observers below.
 */
export function PropertyBar({
  name,
  bookHref,
  bookLabel,
  contact,
  heroId,
  invitationId,
  footerId,
  shown,
}: {
  name: string;
  bookHref: string;
  bookLabel: string;
  contact: PropertyContactCopy;
  heroId: string;
  invitationId: string;
  footerId: string;
  shown?: boolean;
}) {
  const [pastHero, setPastHero] = useState(false);
  const [atInvitation, setAtInvitation] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const watch = (id: string, set: (v: boolean) => void, whenVisible: boolean) => {
      const el = document.getElementById(id);
      if (!el) return () => {};
      const o = new IntersectionObserver(([e]) => set(e.isIntersecting === whenVisible), {
        threshold: 0,
      });
      o.observe(el);
      return () => o.disconnect();
    };
    // Order matters: the tests drive these observer callbacks by array
    // index (hero, invitation, footer), so create them in that order.
    const stopHero = watch(heroId, setPastHero, false);
    const stopInvitation = watch(invitationId, setAtInvitation, true);
    const stopFooter = watch(footerId, setAtFooter, true);
    return () => {
      stopHero();
      stopInvitation();
      stopFooter();
    };
  }, [heroId, invitationId, footerId]);

  const visible = shown ?? (pastHero && !atInvitation && !atFooter);
  if (!visible) return null;

  return (
    <div
      data-property-bar
      className="fixed inset-x-0 bottom-0 z-40 border-t"
      style={{ backgroundColor: "var(--bg)", borderColor: "var(--accent)" }}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-3.5 md:px-12">
        <span
          className="truncate font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.22em]"
          style={{ color: "var(--dim)" }}
        >
          {name}
        </span>
        <div className="flex shrink-0 items-center gap-5">
          {/*
           * `tap` on both links (see `app/globals.css`) — the client's 27 Aug
           * ruling: neither changes how it looks, only the region a thumb can
           * land on. `gap-5` (20px) between them is real, measured room: the
           * rig re-run after this task (`docs/reviews/2026-08-27-mobile/
           * after-tap.json`) is what actually proves the two 44px regions
           * never touch, rather than this comment asserting it.
           */}
          <ContactLine copy={contact} className="tap" />
          <PillButton href={bookHref} external className="tap">
            {bookLabel}
          </PillButton>
        </div>
      </div>
    </div>
  );
}
