import { ChapterLabel } from "@/components/ui/ChapterLabel";

/**
 * `01 —— The Lodges`. The number and its words, separated by a gold hairline.
 *
 * The rule is the only gold on the page that touches a chapter heading, and it
 * carries no text, which is the whole of CLAUDE.md non-negotiable #7. Both halves
 * are `ChapterLabel`s rather than a re-styled copy of one.
 *
 * `align` exists because the page uses the mark two ways: centred above a centred
 * chapter, and flush left above a two-column header. Nothing else varies.
 */
export function ChapterMark({
  number,
  label,
  align = "left",
}: {
  number: string;
  label: string;
  align?: "left" | "centre";
}) {
  return (
    <div
      className={`flex items-center gap-4 ${align === "centre" ? "justify-center" : "justify-start"}`}
    >
      <ChapterLabel>{number}</ChapterLabel>
      <span
        aria-hidden="true"
        className="h-px w-10 shrink-0 opacity-80"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <ChapterLabel>{label}</ChapterLabel>
    </div>
  );
}
