import type { ReactNode } from "react";
import { DaySurface } from "@/components/motion/DaySurface";
import { Grain } from "@/components/motion/Grain";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { FullBleed } from "@/components/ui/FullBleed";
import { MahuaFalls } from "@/components/movements/MahuaFalls";
import { Rooted } from "@/components/movements/Rooted";
import { TheGate } from "@/components/movements/TheGate";
import { TheLodges } from "@/components/movements/TheLodges";
import { TheResidents } from "@/components/movements/TheResidents";
import { TheRitual } from "@/components/movements/TheRitual";
import { TheSky } from "@/components/movements/TheSky";
import { BANDS, type Band } from "@/content/movements";
import { HOME } from "@/content/home";

export const metadata = { title: HOME.meta.homeTitle };

/**
 * One case per id in `content/movements.ts`'s `BANDS` — the only place that
 * decides which component a band renders. Scroll *order* itself is never
 * repeated here; the page below renders `BANDS` in the array's own order, so
 * reordering a movement there reorders the rendered page too, and the two
 * `FullBleed` crossing bands (`carriesText: false`) use the images `BANDS`
 * already names for them rather than a second, independent choice.
 *
 * `priority` goes on "the-gate"'s plate only — the first photograph the
 * visitor reaches ("mahua-falls" above it is text-only; see
 * components/movements/MahuaFalls.tsx).
 */
function renderBand(band: Band): ReactNode {
  switch (band.id) {
    case "mahua-falls":
      return <MahuaFalls key={band.id} />;
    case "the-gate":
      return <TheGate key={band.id} />;
    case "into-the-day":
      return <FullBleed key={band.id} id="tiger-golden-grass" bandId={band.id} />;
    case "the-residents":
      return <TheResidents key={band.id} />;
    case "the-lodges":
      return <TheLodges key={band.id} />;
    case "rooted":
      return <Rooted key={band.id} />;
    case "the-ritual":
      return <TheRitual key={band.id} />;
    case "into-the-dark":
      return <FullBleed key={band.id} id="mahua-tola-pool" bandId={band.id} />;
    case "the-sky":
      return <TheSky key={band.id} />;
    default:
      throw new Error(`No component registered for band "${band.id}"`);
  }
}

export default function Home() {
  return (
    <SmoothScroll>
      <DaySurface />
      <Grain />
      <main>{BANDS.map(renderBand)}</main>
    </SmoothScroll>
  );
}
