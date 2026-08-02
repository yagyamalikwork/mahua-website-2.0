import { Plate } from "@/components/ui/Plate";
import { movementCopy } from "@/content/home";
import { MovementSection } from "./MovementSection";

/**
 * "the-ritual" — content/movements.ts: dusk. Mahua 2.0's real differentiator
 * (spec section 3, movement 5): full-moon manifestation nights and Mahua
 * Kheer on the open chula.
 *
 * The grid is capped at `max-w-5xl` (fix round 1) — see components/movements/
 * TheResidents.tsx's comment for why.
 */
export function TheRitual() {
  const copy = movementCopy("dusk");

  return (
    <MovementSection id="the-ritual" chapter={copy.chapter} heading={copy.heading} body={copy.body}>
      <div className="grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-2">
        {copy.plates?.map((p) => (
          <Plate key={p.mediaId} id={p.mediaId} caption={p.caption} plate={p.plate} />
        ))}
      </div>
    </MovementSection>
  );
}
