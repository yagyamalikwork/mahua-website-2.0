import { media, type MediaId } from "@/lib/media";

/**
 * The photograph's own aspect ratio, read off the media manifest.
 *
 * Until 13 Aug 2026 this module also decided which of two card compositions
 * (`stacked`/`beside`) a room got, from that same aspect. The client's own
 * ruling that day retired the choice: every room card is now `beside`,
 * alternating which side the photograph sits on — see `RoomCard.tsx`. What
 * survives here is the one thing the solved crop bound in `RoomCard.tsx`
 * still needs: a photograph's real aspect. Full history of why a composition
 * was ever derived from the photograph, and of the ruling that ended it: see
 * `docs/DECISIONS.md` §17/§18.
 */
export function roomCardAspect(mediaId: MediaId): number {
  // `media()` (lib/media.ts) does the lookup and throws `Unknown media id: …`
  // on a miss — reused rather than re-implemented, since MEDIA is an array
  // (from MANIFEST), not a map, so it cannot be indexed by id directly.
  const entry = media(mediaId);
  return entry.width / entry.height;
}
