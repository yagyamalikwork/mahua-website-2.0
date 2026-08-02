import { Plate } from "@/components/ui/Plate";
import { movementCopy } from "@/content/home";
import { MovementSection } from "./MovementSection";

/**
 * "the-ritual" — content/movements.ts: dusk, weight 18. Mahua 2.0's real
 * differentiator (spec section 3, movement 5): full-moon manifestation nights
 * and Mahua Kheer on the open chula.
 */
export function TheRitual() {
  const copy = movementCopy("dusk");

  return (
    <MovementSection id="the-ritual" chapter={copy.chapter} heading={copy.heading} body={copy.body}>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {copy.plates?.map((p) => (
          <Plate key={p.mediaId} id={p.mediaId} caption={p.caption} plate={p.plate} />
        ))}
      </div>
    </MovementSection>
  );
}
