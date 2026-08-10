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
// The one place the hairline-plus-focus-ring fragment is written. `LINK` adds
// this chapter's body-copy sizing on top of it; the legal links below compose
// it with `LABEL` instead. Neither ever re-derives the ring, so a future
// change to it cannot silently miss one or the other.
const RULE_IN_LINK =
  "rule-in inline-block pb-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]";
const LINK = `${RULE_IN_LINK} font-[family-name:var(--font-body)] text-[0.98rem]`;

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
                  className={`${LABEL} ${RULE_IN_LINK}`}
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
