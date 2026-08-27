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
 * A colophon, not a marketing band: hairlines, small caps, nothing selling.
 *
 * **It is the brand's brown, and it is the page's one dark band — the client
 * asked for it on 11 Aug 2026**, naming the colour of the wordmark in his own
 * logo. `PALETTE.brand` (#7F5C24) already existed for the header's lockup and
 * was sampled from that artwork rather than eyedropped, so this is literally
 * the ink of the logo's type.
 *
 * It is a deliberate, client-made exception to non-negotiable #3 ("cream is the
 * page, throughout; no dark sections"), and it is the shape that rule can
 * tolerate: a terminal band, below everything, that a visitor reaches once. **It
 * is not licence to darken anything above it** — the rule stands for the rest of
 * the site, and the last build that ignored it was rejected.
 *
 * **Every colour in here inverts, and none of it may be assumed.** On cream the
 * quiet text was `--dim` and the labels were `--accent-text`; both are
 * unreadable on brown (`--dim` at 1.1:1, gold at 2.0:1). So the hierarchy is
 * carried by size and tracking instead of by colour, with only two values doing
 * the work — `--bg` (cream, 5.02:1 on the brown) for anything a visitor reads or
 * clicks, `--surface` (the deeper paper, 4.58:1) for the quieter second rank.
 * Both floors are held by `lib/palette.test.ts`, which gained the brown as a
 * third surface the day this shipped.
 */
const LABEL =
  "font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]";
// The one place the hairline-plus-focus-ring fragment is written. `LINK` adds
// this chapter's body-copy sizing on top of it; the legal links below compose
// it with `LABEL` instead. Neither ever re-derives the ring, so a future
// change to it cannot silently miss one or the other.
//
// The focus ring is cream here, not `--accent-text`: a goldText ring on brown
// is the same 2.0:1 the labels were moved off, and a focus indicator nobody can
// see is the accessibility failure that matters most on a keyboard.
const RULE_IN_LINK =
  "rule-in inline-block pb-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bg)]";
const LINK = `${RULE_IN_LINK} font-[family-name:var(--font-body)] text-[0.98rem]`;
/** The hairline between the bands. Gold vanishes on brown; cream at 22% reads as a rule and not as a line of type. */
const RULE_ON_BROWN = "color-mix(in srgb, var(--bg) 22%, transparent)";

function LodgeContact({ name, contact }: { name: string; contact: PropertyContactCopy }) {
  return (
    <div>
      <p className={LABEL} style={{ color: "var(--surface)" }}>
        {name}
      </p>
      <ul className="mt-3 space-y-1.5">
        <li>
          <a href={contact.phone.href} className={LINK} style={{ color: "var(--bg)" }}>
            {contact.phone.value}
          </a>
        </li>
        <li>
          <a href={contact.email.href} className={LINK} style={{ color: "var(--bg)" }}>
            {contact.email.value}
          </a>
        </li>
        <li
          className="max-w-[36ch] font-[family-name:var(--font-body)] text-sm leading-relaxed"
          style={{ color: "var(--surface)" }}
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
      style={{ backgroundColor: "var(--brand)", borderColor: RULE_ON_BROWN }}
    >
      <div className="mx-auto max-w-[1600px] px-6 py-14 md:px-12 md:py-16">
        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10">
          <div>
            <p className={LABEL} style={{ color: "var(--surface)" }}>
              {SITE.footer.placesLabel}
            </p>
            <ul className="mt-3 space-y-1.5">
              {SITE.places.map((place) => (
                <li key={place.href}>
                  <a href={place.href} className={LINK} style={{ color: "var(--bg)" }}>
                    {place.label}
                    {place.region && (
                      <span className={`${LABEL} ml-2`} style={{ color: "var(--surface)" }}>
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
            <p className={LABEL} style={{ color: "var(--surface)" }}>
              {SITE.footer.officeLabel}
            </p>
            <p
              className="mt-3 max-w-[36ch] font-[family-name:var(--font-body)] text-sm leading-relaxed"
              style={{ color: "var(--surface)" }}
            >
              {SITE.footer.office}
            </p>
          </div>
        </div>

        <div
          className="mt-12 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t pt-6"
          style={{ borderColor: RULE_ON_BROWN }}
        >
          <p className="font-[family-name:var(--font-body)] text-sm" style={{ color: "var(--surface)" }}>
            {SITE.footer.copyright}
          </p>
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {SITE.footer.legal.map((l) => (
              <li key={l.href}>
                {/*
                 * `tap` (`app/globals.css`) — these two measured 144.77×16.88
                 * and 99.11×16.88 (`docs/reviews/2026-08-27-mobile/
                 * baseline.json`, assertion 2): under the 24×24 WCAG floor on
                 * height alone. `gap-x-8` (32px) between them and their own
                 * width (both already >44px) mean the invisible region only
                 * has to grow vertically, with no neighbour on either side —
                 * the copyright text beside them is not a link and does not
                 * count for assertion 3's overlap check.
                 */}
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`tap ${LABEL} ${RULE_IN_LINK}`}
                  style={{ color: "var(--bg)" }}
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
