import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { PillButton } from "@/components/ui/PillButton";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import type { MediaId } from "@/lib/media";
import { ENTER } from "@/lib/motion";

export type FieldNotesCopy = {
  readonly heading: TwoTone;
  readonly gettingThere: readonly { readonly label: string; readonly value: string }[];
  readonly address: string;
  readonly bookLabel: string;
  readonly enquireLabel: string;
  /**
   * The closing nudge to the other lodge — a photograph of the sister
   * property with the invitation under it, not a bare text link. The spec's
   * register two ends on exactly this beat ("Find us / sister property"),
   * and it is Sujan's own move: every camp page closes by showing the next
   * camp, because a visitor leaving one lodge's page is a visitor choosing,
   * not leaving.
   */
  readonly sibling: { readonly mediaId: MediaId; readonly label: string };
};

/**
 * Exported for `lib/sizes.test.ts`, like every other section's `SIZES`.
 *
 * The sibling banner runs the full container width — the same string as
 * `PlateGrid`'s one-up plate, written out rather than imported so neither
 * section's layout can be changed by editing the other's. The 21:9 box keeps
 * a full-width photograph from swallowing a whole screen on its own: it is a
 * closing image, not a second hero.
 */
export const FIELD_NOTES_SIBLING_SIZES =
  "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)";
export const FIELD_NOTES_SIBLING_BOX = 21 / 9;

/**
 * The field notes register's close — getting there, the address, the page's
 * one quiet ask, and the sister lodge. Recomposed 9 Aug 2026: the first build
 * of this band carried no photography and measured 79.5% (Vann) and 84.6%
 * (Tola) empty at its worst screen — the emptiest place in the whole project,
 * against a 45% ceiling that exists because "too much empty space" is the
 * client's original complaint. The sibling photograph is what fills the
 * right-hand half, and it earns its place: it is the one image on the page
 * that belongs to the *other* property, doing the register's closing job.
 */
export function FieldNotes({
  chapter,
  copy,
  bookHref,
  enquireHref,
  siblingHref,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: FieldNotesCopy;
  bookHref: string;
  enquireHref: string;
  siblingHref: string;
  surface?: boolean;
}) {
  return (
    // `pt-*` overrides only the top half of `ChapterSurface`'s vertical rhythm
    // (Tailwind orders `pt` after `py`, so the override is reliable): the rooms
    // and this band are one register, and the full 160px join between them was
    // both wrong for that reading and the emptiest place on the page — 79.5%
    // (Vann) / 84.6% (Tola) before this and the sibling photograph landed.
    <ChapterSurface id={chapter.id} surface={surface} className="pt-6 md:pt-8 lg:pt-10">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-6">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
              <dl className="mt-8 space-y-4">
                {copy.gettingThere.map((fact) => (
                  <div key={fact.label} className="border-t pt-3" style={{ borderColor: "var(--accent)" }}>
                    <dt
                      className="font-[family-name:var(--font-label)] text-[0.65rem] uppercase tracking-[0.2em]"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {fact.label}
                    </dt>
                    <dd
                      className="mt-1 font-[family-name:var(--font-body)] text-[1.02rem]"
                      style={{ color: "var(--text)" }}
                    >
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Enter>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Enter delay={ENTER.stagger}>
            <div className="flex h-full flex-col justify-end gap-8 lg:pb-1">
              <p className="font-[family-name:var(--font-body)] text-sm" style={{ color: "var(--dim)" }}>
                {copy.address}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <PillButton href={bookHref} size="large" external>
                  {copy.bookLabel}
                </PillButton>
                <PillButton href={enquireHref} size="large">
                  {copy.enquireLabel}
                </PillButton>
              </div>
            </div>
          </Enter>
        </div>
      </div>

      {/* The page closes on the other lodge, full width — Sujan's own move:
          a visitor leaving one camp's page is a visitor choosing, not
          leaving, so the last thing this page shows is the next one. One
          anchor around photograph and label; the label carries the hairline
          (`a:hover .rule-in::after` slides it in from anywhere on the
          banner), and `check_rule_in.mjs` counts a descendant rule as
          covering the link. */}
      <div className="mt-12 md:mt-14">
        <Enter>
          <a
            href={siblingHref}
            className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
          >
            <ImageReveal className="block aspect-[21/9] w-full">
              <Photo
                id={copy.sibling.mediaId}
                sizes={FIELD_NOTES_SIBLING_SIZES}
                box={FIELD_NOTES_SIBLING_BOX}
                pictureClassName="block h-full w-full"
                className="h-full w-full object-cover"
              />
            </ImageReveal>
            <span
              className="rule-in rule-in--rest mt-5 inline-block pb-1 font-[family-name:var(--font-label)] text-[0.7rem] uppercase tracking-[0.22em]"
              style={{ color: "var(--accent-text)" }}
            >
              {copy.sibling.label}
            </span>
          </a>
        </Enter>
      </div>
    </ChapterSurface>
  );
}
