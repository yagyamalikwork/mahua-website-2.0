import type { Metadata } from "next";
import { PropertyPage } from "@/components/property/PropertyPage";
import { TOLA_CHAPTERS, TOLA_COPY, TOLA_NAV } from "@/content/mahua-tola";

export const metadata: Metadata = {
  title: "Mahua Tola, Tadoba — Mahua Resorts",
  description:
    "Mahua Tola: five kilometres from Kolara Gate at Tadoba-Andhari Tiger Reserve. Rooms, dining, safaris and how to reach us.",
};

export default function MahuaTolaPage() {
  return (
    <PropertyPage
      chapters={TOLA_CHAPTERS}
      copy={TOLA_COPY}
      scrim={{
        // These figures were first tuned against TWD5337, the candlelit
        // poolside dinner that was briefly this page's hero (its fairy-light
        // highlights needed `flat` and `bottom` raised together). The hero is
        // now DSC00044 — the lodge across its lily pond at dusk — and the
        // same scrim measures comfortably clear over it: headline worst
        // 4.20:1 (1440px) against the 3.0 floor, sub worst 4.84:1 (390px)
        // against 4.5, quote worst 3.66:1 (1440px) against 3.0. Re-measured
        // by the route-aware contrast rig, 9 Aug 2026 —
        // docs/reviews/2026-08-08-property-pages/tola-contrast.json.
        "tola-hero": { top: 0.92, bottom: 0.6, corner: 0.85, flat: 0.12 },
        "tola-guest-word": { flat: 0.36, centre: 0.42 },
      }}
      bookHref="https://asiatech.in/booking_engine/index3?token=ODM1MA=="
      bookLabel={TOLA_COPY.fieldNotesCopy!["tola-field-notes"].bookLabel}
      enquireHref="mailto:sales@mahuaresorts.com?subject=Enquiry%20—%20Mahua%20Tola"
      siblingHref="/mahua-vann"
      nav={TOLA_NAV}
    />
  );
}
