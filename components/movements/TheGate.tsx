import { Plate } from "@/components/ui/Plate";
import { movementCopy } from "@/content/home";
import { MovementSection } from "./MovementSection";

/**
 * "the-gate" — content/movements.ts: firstLight. The first band on
 * the page carrying an actual photograph, so its plate is the one image marked
 * `priority` (see app/page.tsx and the Task 6 report — the opening movement,
 * "mahua-falls", has none).
 */
export function TheGate() {
  const copy = movementCopy("firstLight");
  const [plate] = copy.plates ?? [];

  return (
    <MovementSection id="the-gate" chapter={copy.chapter} heading={copy.heading} body={copy.body}>
      {plate && (
        <div className="max-w-xl">
          <Plate id={plate.mediaId} caption={plate.caption} plate={plate.plate} priority />
        </div>
      )}
    </MovementSection>
  );
}
