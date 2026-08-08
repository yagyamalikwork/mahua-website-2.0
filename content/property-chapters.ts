import type { MediaId } from "@/lib/media";

/**
 * The kinds a property page's spine may use. A deliberately small subset of
 * the home page's `ChapterKind` — property pages do not carry the home
 * page's signature interactions (the lantern, the two films, the pinned
 * collage), so those kinds have no equivalent here.
 */
export type PropertyChapterKind =
  | "hero"
  | "chapterIntro"
  | "plateGrid"
  | "fullBleedQuote"
  | "roomsIndex"
  | "fieldNotes";

export type PropertyChapter = {
  id: string;
  number?: string;
  label?: string;
  kind: PropertyChapterKind;
  media: readonly MediaId[];
};

/**
 * The kinds that count as carrying a screen on their photography, for the
 * rhythm-alternation test each property's own test file runs.
 *
 * `roomsIndex` is counted image-led here, unlike the home page's
 * (deliberately conservative) treatment of visually similar layouts —
 * every entry in it is a real photograph of a real room, which is closer in
 * spirit to `plateGrid`'s specimen board than to `chapterIntro`'s prose
 * column with photographs at the margins.
 */
export const PROPERTY_IMAGE_LED_KINDS: readonly PropertyChapterKind[] = [
  "hero",
  "plateGrid",
  "fullBleedQuote",
  "roomsIndex",
];

/** Mirrors `FULL_BLEED_KINDS` in `content/chapters.ts` — CLAUDE.md non-negotiable #11. */
export const PROPERTY_FULL_BLEED_KINDS: readonly PropertyChapterKind[] = ["hero", "fullBleedQuote"];
