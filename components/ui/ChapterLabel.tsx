/**
 * The eyebrow above a section heading — Cinzel, wide-tracked small caps, coloured
 * from the accent-text channel so it reads as a chapter mark, not body copy
 * (field-guide idiom: every section is introduced before it is titled).
 *
 * No colour is hard-coded: `--accent-text` is written once, in app/layout.tsx,
 * from `PALETTE.goldText` (lib/palette.ts) and never changes afterwards — the
 * page is one static cream surface, not a sequence this label would need to
 * track.
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
