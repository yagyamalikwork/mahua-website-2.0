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

export type RoomEntryCopy = {
  readonly mediaId: MediaId;
  readonly name: string;
  readonly size: string;
  readonly bed: string;
  readonly view: string;
  /**
   * Set only when this room type shares a photograph with another entry in
   * the same list — the honest alternative to implying a distinct image that
   * does not exist. E.g. "Shown: Cottage with Deck".
   */
  readonly note?: string;
};

export type RoomsIndexCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly rooms: readonly RoomEntryCopy[];
};

const SIZES: Record<number, string> = {
  2: "(min-width: 1600px) 736px, (min-width: 640px) 50vw, calc(100vw - 48px)",
  3: "(min-width: 1600px) 480px, (min-width: 1024px) 34vw, (min-width: 640px) 50vw, calc(100vw - 48px)",
};

/**
 * The rooms index — the field notes register's first beat. A compact grid
 * built to be scanned, not lingered over: photo, name, then the facts a
 * planner is actually looking for, in one line each.
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
  const columns = copy.rooms.length >= 4 ? 3 : 2;
  const sizes = SIZES[columns] ?? SIZES[2];

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <Enter>
          <div>
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} />
            )}
            <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            <p
              className="mt-7 max-w-[62ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </div>
        </Enter>

        <div
          className={`mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-12 sm:grid-cols-2 ${
            columns === 3 ? "lg:grid-cols-3" : ""
          }`}
        >
          {copy.rooms.map((room, i) => (
            <Enter key={room.name} delay={ENTER.stagger * (i % columns)}>
              <article>
                <ImageReveal className="block aspect-[4/3] w-full">
                  <Photo
                    id={room.mediaId}
                    sizes={sizes}
                    box={4 / 3}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-light leading-tight text-[color:var(--text)]">
                  {room.name}
                </h3>
                <ul className="mt-2 space-y-1 font-[family-name:var(--font-body)] text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
                  <li>{room.size}</li>
                  <li>{room.bed}</li>
                  <li>{room.view}</li>
                </ul>
                {room.note && (
                  <p className="mt-2 font-[family-name:var(--font-body)] text-xs italic" style={{ color: "var(--dim)" }}>
                    {room.note}
                  </p>
                )}
              </article>
            </Enter>
          ))}
        </div>
      </div>
    </ChapterSurface>
  );
}
