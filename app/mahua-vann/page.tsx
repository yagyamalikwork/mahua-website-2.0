import type { Metadata } from "next";
import { PropertyPage } from "@/components/property/PropertyPage";
import { VANN_CHAPTERS, VANN_COPY, VANN_NAV } from "@/content/mahua-vann";

export const metadata: Metadata = {
  title: "Mahua Vann, Pench — Mahua Resorts",
  description:
    "Mahua Vann: five kilometres from Turia Gate at Pench National Park. Rooms, dining, safaris and how to reach us.",
};

export default function MahuaVannPage() {
  return (
    <PropertyPage
      chapters={VANN_CHAPTERS}
      copy={VANN_COPY}
      // `Hero`'s default scrim is tuned for the home page's hero photograph,
      // not this one — reused unchanged it measured the headline's worst word
      // at 2.79:1 against a 3.0 floor (a bright ochre wall behind "hour").
      // `corner` raised to 0.88 cleared it at 1440/1920 — and then the first
      // run of the *route-aware* contrast rig (9 Aug 2026) found the 390px
      // crop still failing, headline 2.94 and sub 3.30 against 4.5, where the
      // portrait crop centres the pale stone floor under the type. `bottom`
      // raised until the worst pixel under the sub cleared 4.5. Figures in
      // `docs/reviews/2026-08-08-property-pages/vann-contrast.json`.
      scrim={{ "vann-hero": { top: 0.92, bottom: 0.78, corner: 0.88 } }}
      bookHref="https://asiatech.in/booking_engine/index3?token=ODM1MQ=="
      bookLabel={VANN_COPY.fieldNotesCopy!["vann-field-notes"].bookLabel}
      enquireHref="mailto:sales@mahuaresorts.com?subject=Enquiry%20—%20Mahua%20Vann"
      siblingHref="/mahua-tola"
      nav={VANN_NAV}
    />
  );
}
