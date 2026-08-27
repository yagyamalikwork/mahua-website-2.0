import type { ReactNode } from "react";

export type ContactLink = {
  readonly label: string;
  readonly value: string;
  readonly href: string;
};

export type ContactFact = {
  readonly label: string;
  readonly value: string;
};

type ContactEntry = ContactLink | ContactFact;

export type PropertyContactCopy = {
  readonly phone: ContactLink;
  readonly email: ContactLink;
  readonly address: ContactFact;
};

/**
 * The lodge's own details, shown plainly.
 *
 * This is what the enquiry form became when the client removed it on 9 Aug —
 * and it solves the original problem better than the form would have. The
 * defect being fixed was a bare `mailto:` that does nothing on a phone with
 * no mail client, leaving the visitor believing they had written to us. A
 * phone number that is a real `tel:` link works on every device, with
 * scripting off, with no third party involved and with nothing to sign up
 * for.
 *
 * No `"use client"`, no state, no effect. Deliberately.
 */
const LINK_CLASS =
  "rule-in inline-block pb-0.5 font-[family-name:var(--font-body)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]";

function Row({ entry }: { entry: ContactEntry }) {
  const body: ReactNode = "href" in entry ? (
    <a href={entry.href} className={LINK_CLASS} style={{ color: "var(--accent-text)" }}>
      {entry.value}
    </a>
  ) : (
    <span className="font-[family-name:var(--font-body)]" style={{ color: "var(--text)" }}>
      {entry.value}
    </span>
  );

  return (
    <div
      className="grid grid-cols-1 gap-x-6 border-t py-3 sm:grid-cols-[8rem_minmax(0,1fr)]"
      style={{ borderColor: "var(--accent)" }}
    >
      <span
        className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
        style={{ color: "var(--accent-text)" }}
      >
        {entry.label}
      </span>
      <span className="mt-1 text-[1.02rem] leading-relaxed sm:mt-0">{body}</span>
    </div>
  );
}

/** The closing band's contact set: phone, email, address. */
export function ContactBlock({ copy }: { copy: PropertyContactCopy }) {
  return (
    <div>
      <Row entry={copy.phone} />
      <Row entry={copy.email} />
      <Row entry={copy.address} />
    </div>
  );
}

/**
 * The bar's one line — the phone number, tappable.
 *
 * On an Indian phone this is the shortest route there is from wanting to stay
 * to speaking to somebody, which is why it sits beside Book rather than
 * behind anything.
 *
 * Hidden on mobile (390px): the bar already holds the property name and booking pill,
 * and adding a third item wraps it to two lines. The number is one tap away in the
 * closing band's ContactBlock, so the bar's job at narrow widths is Book.
 */
export function ContactLine({
  copy,
  className = "",
}: {
  copy: PropertyContactCopy;
  /**
   * Same escape hatch as `PillButton`'s — `.tap` (`app/globals.css`) has to
   * land on this `<a>` itself, not on a wrapper around it, because a tap
   * inside the generated `::after` is dispatched to the element that
   * generated it. Empty by default so every existing render is unchanged.
   */
  className?: string;
}) {
  return (
    <a
      href={copy.phone.href}
      className={`rule-in hidden whitespace-nowrap pb-0.5 font-[family-name:var(--font-body)] text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)] sm:inline-block ${className}`}
      style={{ color: "var(--accent-text)" }}
    >
      {copy.phone.value}
    </a>
  );
}
