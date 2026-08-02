import { Plate } from "@/components/ui/Plate";
import { movementCopy } from "@/content/home";
import { MovementSection } from "./MovementSection";

/**
 * "rooted" — content/movements.ts: lateAfternoon, weight 18. Its one plate,
 * potters-hands, is the narrowest photograph in the manifest (700px — see
 * lib/media-manifest.ts and the Task 5 report's resolution note) and must never
 * be stretched edge-to-edge. Constraining its column to `max-w-md` (28rem)
 * keeps it at or below its native width at ordinary viewport sizes rather than
 * upscaling it, so it is used as `Plate` — never `FullBleed`.
 */
export function Rooted() {
  const copy = movementCopy("lateAfternoon");
  const [plate] = copy.plates ?? [];

  return (
    <MovementSection id="rooted" chapter={copy.chapter} heading={copy.heading} body={copy.body}>
      {plate && (
        <div className="max-w-md">
          <Plate id={plate.mediaId} caption={plate.caption} plate={plate.plate} />
        </div>
      )}
    </MovementSection>
  );
}
