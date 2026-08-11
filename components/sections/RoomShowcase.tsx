import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { PropertyChapter } from "@/content/property-chapters";
import { ENTER } from "@/lib/motion";
import type { RoomEntryCopy, RoomScale, RoomShowcaseCopy } from "./RoomShowcase.types";

export type { RoomEntryCopy, RoomScale, RoomShowcaseCopy };

/** Interim: `scale` left the content model in Task 1; this component dies in Task 7. */
const INTERIM_SCALE: RoomScale = "wide";

/** Exported for `lib/sizes.test.ts`, like every other section's. */
export const ROOM_SIZES: Record<RoomScale, string> = {
  wide: "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
  offsetRight: "(min-width: 1600px) 860px, (min-width: 1024px) 56vw, calc(100vw - 48px)",
  offsetLeft: "(min-width: 1600px) 990px, (min-width: 1024px) 64vw, calc(100vw - 48px)",
};

export const ROOM_BOXES: Record<RoomScale, number> = {
  wide: 21 / 9,
  offsetRight: 4 / 3,
  offsetLeft: 3 / 2,
};

const FRAME: Record<RoomScale, string> = {
  wide: "aspect-[21/9]",
  offsetRight: "aspect-[4/3]",
  offsetLeft: "aspect-[3/2]",
};

/** Where the photograph and its words sit, per scale. */
const LAYOUT: Record<RoomScale, { photo: string; text: string }> = {
  wide: { photo: "lg:col-span-12", text: "lg:col-span-8" },
  offsetRight: { photo: "lg:col-span-7 lg:col-start-6 lg:order-2", text: "lg:col-span-4 lg:row-start-1" },
  offsetLeft: { photo: "lg:col-span-8", text: "lg:col-span-3 lg:col-start-10" },
};

/**
 * The rooms, shown rather than tabulated.
 *
 * `RoomsIndex`, which this replaces, drew Size / Bed / View as three ruled
 * rows per room type and repeated the band down the page. It measured 60.3%
 * and 53% empty against the 45% ceiling *and* read as a datasheet — the two
 * failures had one cause, which is that a table is neither dense nor
 * seductive. Here each room is a photograph at its own scale, one sentence,
 * and its facts as a single caption line.
 */
export function RoomShowcase({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: RoomShowcaseCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
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

        <div className="mt-10 space-y-14 md:mt-12 lg:space-y-20">
          {copy.rooms.map((room) => (
            <div
              key={room.name}
              className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:items-end lg:gap-x-10"
            >
              <div className={LAYOUT[INTERIM_SCALE].photo}>
                <Enter>
                  <ImageReveal className={`block w-full ${FRAME[INTERIM_SCALE]}`}>
                    <Photo
                      id={room.mediaId}
                      sizes={ROOM_SIZES[INTERIM_SCALE]}
                      box={ROOM_BOXES[INTERIM_SCALE]}
                      pictureClassName="block h-full w-full"
                      className="h-full w-full object-cover"
                    />
                  </ImageReveal>
                </Enter>
              </div>

              <div className={LAYOUT[INTERIM_SCALE].text}>
                <Enter delay={ENTER.stagger}>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-light leading-tight text-[color:var(--text)] md:text-3xl">
                      {room.name}
                    </h3>
                    <p
                      className="mt-3 max-w-[42ch] font-[family-name:var(--font-body)] text-[1.02rem] leading-[1.7]"
                      style={{ color: "var(--dim)" }}
                    >
                      {room.line}
                    </p>
                    <p
                      className="mt-4 border-t pt-3 font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
                      style={{ borderColor: "var(--accent)", color: "var(--accent-text)" }}
                    >
                      {room.facts.join(" · ")}
                    </p>
                    {room.note && (
                      <p
                        className="mt-3 font-[family-name:var(--font-body)] text-xs italic"
                        style={{ color: "var(--dim)" }}
                      >
                        {room.note}
                      </p>
                    )}
                  </div>
                </Enter>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChapterSurface>
  );
}
