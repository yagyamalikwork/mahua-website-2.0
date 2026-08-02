/**
 * The eyebrow above a movement's heading — Cinzel, wide-tracked small caps, coloured
 * from the accent channel so it reads as a chapter mark, not body copy (field-guide
 * idiom: every movement is introduced before it is titled).
 *
 * No colour is hard-coded: `--accent-text` is written continuously by DaySurface as
 * the page bleeds from dawn to night, so this label always matches the surface it
 * sits on without needing to know which movement it is in.
 */
export function ChapterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.28em]"
      style={{ color: "var(--accent-text)" }}
    >
      {children}
    </p>
  );
}
