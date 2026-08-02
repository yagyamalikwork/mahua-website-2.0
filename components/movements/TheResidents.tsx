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
 *
 * Task 7 fix: below `sm` (640px), three *portrait* plates stacked one per row
 * (the grid's pre-fix `grid-cols-1`) ran to ~2199px of content against this
 * band's ~1809px weight-derived box at 390×844 — a measured ~391px overflow,
 * the tallest single overflow of any band at mobile width (see the Task 7
 * report). `the-lodges` and `the-ritual` share this same collapse-to-one-
 * column pattern but never overflow at any measured width, because their
 * plates are landscape, not portrait — this band is tall specifically
 * *because* its three plates are portrait-oriented. Two columns even below
 * `sm` roughly halves each plate's rendered width (and so its height, since
 * `Plate` scales height from intrinsic aspect ratio), which is enough
 * headroom that the fitted content stays inside the box down to 320px wide
 * (see the Task 7 report's re-measurement) without hiding a plate or
 * touching this band's `weight`.
 */
export function TheResidents() {
  const copy = movementCopy("midMorning");

  return (
    <MovementSection id="the-residents" chapter={copy.chapter} heading={copy.heading} body={copy.body}>
      <div className="grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-10">
        {copy.plates?.map((p) => (
          <Plate key={p.mediaId} id={p.mediaId} caption={p.caption} plate={p.plate} />
        ))}
      </div>
    </MovementSection>
  );
}
