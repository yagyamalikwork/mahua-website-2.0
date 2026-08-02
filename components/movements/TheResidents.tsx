import { Plate } from "@/components/ui/Plate";
import { movementCopy } from "@/content/home";
import { MovementSection } from "./MovementSection";

/**
 * "the-residents" — content/movements.ts: midMorning. Wildlife as field-guide
 * plates with specimen captions (spec section 3, movement 2): Bengal tiger,
 * Indian leopard, and the melanistic leopard.
 *
 * The grid is capped at `max-w-5xl` (fix round 1): without a cap, three
 * portrait plates in a row grow taller in lock-step with an unbounded
 * viewport width, which both re-softens 900px-source photographs (Task 5's
 * resolution warning) and makes this band's natural content height keep
 * climbing past whatever `weight` was tuned against. Capping the grid keeps
 * both bounded.
 */
export function TheResidents() {
  const copy = movementCopy("midMorning");

  return (
    <MovementSection id="the-residents" chapter={copy.chapter} heading={copy.heading} body={copy.body}>
      <div className="grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3">
        {copy.plates?.map((p) => (
          <Plate key={p.mediaId} id={p.mediaId} caption={p.caption} plate={p.plate} />
        ))}
      </div>
    </MovementSection>
  );
}
