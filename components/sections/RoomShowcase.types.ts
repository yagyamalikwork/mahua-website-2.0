import type { MediaId } from "@/lib/media";
import type { TwoTone } from "@/content/home";

/**
 * The rooms' content model, kept apart from whatever component renders it.
 *
 * It lives here because the renderer changed (a card stack replaced a stack of
 * bands, 11 Aug 2026) and the words did not. A content type that imports from
 * the component that happens to draw it today makes every such change a churn
 * of unrelated import lines across `content/`.
 */

export type RoomEntryCopy = {
  readonly mediaId: MediaId;
  readonly name: string;
  /** One sentence. Not a description of the furniture. */
  readonly line: string;
  /** Set as a single letterspaced caption, joined by middots. */
  readonly facts: readonly string[];
  /** Only when this room shares a photograph with another — "Shown: Suite." */
  readonly note?: string;
};

export type RoomShowcaseCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly rooms: readonly RoomEntryCopy[];
};
