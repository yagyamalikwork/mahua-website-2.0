import { Plate } from "@/components/ui/Plate";
import { movementCopy } from "@/content/home";
import { MovementSection } from "./MovementSection";

/**
 * "the-lodges" — content/movements.ts: afternoon, the heaviest band on the
 * page. The hinge of the day (spec section 3, movement 3): two large,
 * unhurried plates, one per property.
 *
 * The grid is capped at `max-w-5xl` (fix round 1) — see components/movements/
 * TheResidents.tsx's comment for why: an uncapped grid grows its images taller
 * in step with viewport width, re-softening 960px-source photographs and
 * pulling this band's natural content height past whatever `weight` assumed.
 */
export function TheLodges() {
  const copy = movementCopy("afternoon");

  return (
    <MovementSection id="the-lodges" chapter={copy.chapter} heading={copy.heading} body={copy.body}>
      <div className="grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-2">
        {copy.plates?.map((p) => (
          <Plate key={p.mediaId} id={p.mediaId} caption={p.caption} plate={p.plate} />
        ))}
      </div>
    </MovementSection>
  );
}
