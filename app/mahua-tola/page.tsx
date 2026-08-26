import type { Metadata } from "next";
import { PropertyPage } from "@/components/property/PropertyPage";
import { TOLA_BAR, TOLA_CHAPTERS, TOLA_COPY } from "@/content/mahua-tola";

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
        // `tola-guest-word` (`{ flat: 0.36, centre: 0.42 }`) washed this page's
        // guest's-word `fullBleed` band — removed on 26 August 2026, with the
        // chapter it belonged to, on the client's own ruling (Task 5 of the
        // 26 Aug restructure; `content/mahua-tola.ts`'s own removal comment
        // carries his words). `tola-guest-word` no longer names anything in
        // `TOLA_CHAPTERS`, so `scrim[chapter.id]` can never look this key up
        // again — kept here as a pointer to a figure worth its history, not
        // as a live entry.
        //
        // `tola-table`, this page's other former `fullBleed` chapter, is gone
        // the same way and for the same reason. While it existed it rendered
        // as a `FullBleedQuote` (it carried a `quoteCopy` entry) and Task 15
        // measured it against the real composition (9/10 Aug 2026):
        // worst-pixel contrast 3.30 at 390px, 3.58 at 768/1440/1920,
        // comfortably clear of the 3.0 floor on the untouched default scrim,
        // so no entry was ever added for it here either.
        // docs/reviews/2026-08-09-property-redesign/README.md §1.
      }}
      bookHref="https://asiatech.in/booking_engine/index3?token=ODM1MA=="
      bar={TOLA_BAR}
      siblingHref="/mahua-vann"
    />
  );
}
