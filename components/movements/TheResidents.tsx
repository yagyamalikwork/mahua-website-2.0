import { Plate } from "@/components/ui/Plate";
import { movementCopy } from "@/content/home";
import { MovementSection } from "./MovementSection";

/**
 * "the-residents" — content/movements.ts: midMorning, weight 18. Wildlife as
 * field-guide plates with specimen captions (spec section 3, movement 2):
 * Bengal tiger, Indian leopard, and the melanistic leopard.
 */
export function TheResidents() {
  const copy = movementCopy("midMorning");

  return (
    <MovementSection id="the-residents" chapter={copy.chapter} heading={copy.heading} body={copy.body}>
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
        {copy.plates?.map((p) => (
          <Plate key={p.mediaId} id={p.mediaId} caption={p.caption} plate={p.plate} />
        ))}
      </div>
    </MovementSection>
  );
}
