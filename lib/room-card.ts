import { media, type MediaId } from "@/lib/media";

/**
 * Which of the two card compositions a room gets, decided by the photograph
 * rather than by hand.
 *
 * The section this replaces carried a `scale` field per room, set by a human
 * and justified in a comment. Five of the seven room photographs are 2.29:1 or
 * wider, and two of them were being cropped by ~35% of their width to reach a
 * squarer box — a decision nothing in the codebase could check. Deriving the
 * composition from the asset is the same rule the leaf, the lantern, the
 * welcome logo and the forest tint all follow.
 */
export type RoomCardLayout = "stacked" | "beside";

/**
 * Wider than this and the photograph lies across the top of the card; squarer
 * and it stands beside the words.
 *
 * 1.9 separates the two real populations — 2.29 and up against 1.50 and 0.67 —
 * with the widest margin available. `room-card.test.ts` asserts no room is
 * within 0.35 of it, so this number is only ever crossed on purpose.
 */
export const ROOM_CARD_ASPECT_THRESHOLD = 1.9;

export function roomCardAspect(mediaId: MediaId): number {
  // `media()` (lib/media.ts) does the lookup and throws `Unknown media id: …`
  // on a miss — reused rather than re-implemented, since MEDIA is an array
  // (from MANIFEST), not a map, so it cannot be indexed by id directly.
  const entry = media(mediaId);
  return entry.width / entry.height;
}

export function roomCardLayout(mediaId: MediaId): RoomCardLayout {
  return roomCardAspect(mediaId) >= ROOM_CARD_ASPECT_THRESHOLD ? "stacked" : "beside";
}
