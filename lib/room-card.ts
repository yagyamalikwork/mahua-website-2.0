import { media, type MediaId } from "@/lib/media";

/**
 * A photograph's WORST-CASE aspect ratio across every tier it is emitted at —
 * not the manifest's canonical top-level `width`/`height`.
 *
 * Until 13 Aug 2026 this module also decided which of two card compositions
 * (`stacked`/`beside`) a room got, from that same aspect. The client's own
 * ruling that day retired the choice: every room card is now `beside`,
 * alternating which side the photograph sits on — see `RoomCard.tsx`. What
 * survives here is the one thing the solved crop bound in `RoomCard.tsx`
 * still needs: a photograph's aspect. Full history of why a composition was
 * ever derived from the photograph, and of the ruling that ended it: see
 * `docs/DECISIONS.md` §17/§18.
 *
 * **Corrected 14 Aug 2026 (image-sizing Task 4 review, Critical 1): "the
 * photograph's aspect" is not one number.** `scripts/build_images.mjs` resizes
 * each tier independently and rounds its height to a whole pixel on its own,
 * so a photograph's tiers do not all share exactly the same ratio — and
 * `scripts/check_card_stack.mjs` measures whichever tier the BROWSER actually
 * loaded (`img.naturalWidth`/`naturalHeight`), which depends on `sizes` and
 * the viewport, never the manifest's canonical (largest) tier alone. Reading
 * only `entry.width`/`entry.height` — the canonical tier — solved
 * `RoomCard.tsx`'s crop bound against a number the rig does not enforce.
 * Measured, not assumed: `vann-room-cottage-plain`'s canonical tier
 * (1184x789) is 1.500634, but its OWN 640-wide tier is 640x426 = 1.502347 —
 * HIGHER, and a real candidate `sizes` can select at 1024x1366. Solving the
 * 25%-width-crop bound against 1.500634 and then serving 1.502347 pushed the
 * real crop to 25.08%, over the rig's ceiling. Taking the MAXIMUM aspect
 * across every emitted tier (`entry.sources`, which always includes the
 * canonical tier as its own last entry — `lib/media.ts`'s own contract) is
 * the number that bounds every candidate the browser might actually pick, so
 * the guarantee holds regardless of which one it is.
 */
export function roomCardAspect(mediaId: MediaId): number {
  // `media()` (lib/media.ts) does the lookup and throws `Unknown media id: …`
  // on a miss — reused rather than re-implemented, since MEDIA is an array
  // (from MANIFEST), not a map, so it cannot be indexed by id directly.
  const entry = media(mediaId);
  return Math.max(...entry.sources.map((s) => s.width / s.height));
}
