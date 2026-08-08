import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import type { MediaId } from "@/lib/media";
import { ENTER } from "@/lib/motion";

export type RoomFactsCopy = {
  readonly name: string;
  readonly size: string;
  readonly bed: string;
  readonly view: string;
};

/**
 * One band: one photograph, and every room type that photograph honestly
 * covers. A room type without its own photograph does not get a repeat of a
 * neighbour's image implying one — it shares the neighbour's band as a second
 * entry, and the band's `note` says what is actually shown. That is the same
 * coverage-honesty rule the spec set (§6), enforced by shape rather than by
 * remembering: the grid layout this replaced repeated one Suite photograph
 * three times across Tola's five room types, each repeat pretending to be a
 * different room.
 */
export type RoomBandCopy = {
  readonly mediaId: MediaId;
  /** Set only when `entries` outnumber the photographs — e.g. "Shown: Suite." */
  readonly note?: string;
  readonly entries: readonly RoomFactsCopy[];
};

export type RoomsIndexCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly bands: readonly RoomBandCopy[];
};

/**
 * Exported, like every other section's `SIZES`/`BOXES`, so `lib/sizes.test.ts`
 * can import the live strings rather than a copy of them.
 *
 * Every band draws its photograph across eight of twelve columns (~990px
 * inside the 1504px container at 1600), at 4:3. Both figures were measured
 * into place on 9 Aug 2026, against non-negotiable #8's 45% ceiling: seven
 * columns left vann-rooms at 54.2% empty, and 3:2 left tola-rooms at 50.9% —
 * the facts column is short, so the photograph's own width and depth are the
 * only things that can carry a band. A portrait source (Tola's Family Suite)
 * takes the same 4:3 crop as its neighbours: `object-cover` centres it on the
 * bed, and a uniform plate is what makes four bands read as one ledger.
 */
export const ROOMS_SIZES = "(min-width: 1600px) 990px, (min-width: 1024px) 62vw, calc(100vw - 48px)";
export const ROOMS_BOX = 4 / 3;

/** One fact row: hairline, small gold label, the fact itself. */
function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-t py-2"
      style={{ borderColor: "var(--accent)" }}
    >
      <dt
        className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
        style={{ color: "var(--accent-text)" }}
      >
        {label}
      </dt>
      <dd
        className="font-[family-name:var(--font-body)] text-[0.98rem]"
        style={{ color: "var(--text)" }}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * The rooms index — the field notes register's first beat, recomposed 9 Aug
 * 2026 from a card grid into full-width alternating bands after the grid
 * measured 60.3% (Vann) and 53% (Tola) empty against non-negotiable #8's 45%
 * ceiling (`docs/reviews/2026-08-08-property-pages/`). Three small cards in a
 * row could never claim the width; one large photograph a band can. The facts
 * column keeps the job the same: name, then what a planner actually needs, one
 * line each.
 */
export function RoomsIndex({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: RoomsIndexCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        {/* Heading left, intro right — `PlateGrid`'s own two-column header, so
            the field-notes register opens in the same layout language as the
            specimen boards above it. Also ~120px shorter than the stacked
            version this replaced: a full-width type-only block is exactly the
            kind of height the 45% ceiling cannot afford here (the first build
            measured this chapter at 54.2% with it). */}
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            </div>
          </Enter>
          <Enter delay={ENTER.stagger}>
            <p
              className="max-w-[58ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </Enter>
        </div>

        <div className="mt-10 space-y-10 md:mt-12 lg:space-y-12">
          {copy.bands.map((band, i) => {
            const mirrored = i % 2 === 1;

            return (
              <div
                key={band.mediaId}
                className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:items-center lg:gap-x-10"
              >
                <div className={`lg:col-span-8 ${mirrored ? "lg:order-2 lg:col-start-5" : ""}`}>
                  <Enter>
                    <ImageReveal className="block aspect-[4/3] w-full">
                      <Photo
                        id={band.mediaId}
                        sizes={ROOMS_SIZES}
                        box={ROOMS_BOX}
                        pictureClassName="block h-full w-full"
                        className="h-full w-full object-cover"
                      />
                    </ImageReveal>
                  </Enter>
                </div>

                <div className="lg:col-span-4">
                  <Enter delay={ENTER.stagger}>
                    <div>
                      {band.entries.map((room, j) => (
                        <div key={room.name} className={j > 0 ? "mt-8" : ""}>
                          <h3 className="font-[family-name:var(--font-display)] text-2xl font-light leading-tight text-[color:var(--text)] md:text-3xl">
                            {room.name}
                          </h3>
                          <dl className="mt-4">
                            <FactRow label="Size" value={room.size} />
                            <FactRow label="Bed" value={room.bed} />
                            <FactRow label="View" value={room.view} />
                          </dl>
                        </div>
                      ))}
                      {band.note && (
                        <p
                          className="mt-4 font-[family-name:var(--font-body)] text-xs italic"
                          style={{ color: "var(--dim)" }}
                        >
                          {band.note}
                        </p>
                      )}
                    </div>
                  </Enter>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChapterSurface>
  );
}
