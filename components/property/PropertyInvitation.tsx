import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { ContactBlock, type PropertyContactCopy } from "@/components/property/PropertyContact";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { PillButton } from "@/components/ui/PillButton";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import type { MediaId } from "@/lib/media";
import { ENTER } from "@/lib/motion";

export type PropertyInvitationCopy = {
  readonly heading: TwoTone;
  readonly line: string;
  readonly bookLabel: string;
  /** Phone, email and address — the enquiry route since the form was dropped. */
  readonly contact: PropertyContactCopy;
  /** The other lodge. A visitor leaving this page is choosing, not leaving. */
  readonly sibling: { readonly mediaId: MediaId; readonly label: string };
};

/** Exported for `lib/sizes.test.ts`. Full container width, 21:9. */
export const INVITATION_SIZES =
  "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)";
export const INVITATION_BOX = 21 / 9;

/**
 * The page's close, and its one unhurried ask.
 *
 * **It carries the sister lodge's photograph on purpose.** On Mahua Vann it
 * follows the type-led press band, and a quiet close after a quiet band would
 * break the rhythm rule while satisfying the shape rule — the two are
 * independent and both bind (see `content/property-chapters.ts`).
 *
 * Distinct from `components/sections/Invitation.tsx`, which closes the home
 * page and is not touched by this work.
 */
export function PropertyInvitation({
  chapter,
  copy,
  bookHref,
  siblingHref,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: PropertyInvitationCopy;
  bookHref: string;
  siblingHref: string;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:items-end lg:gap-x-10">
        <div className="lg:col-span-6">
          <Enter>
            <div>
              <TwoToneHeading heading={copy.heading} className="max-w-[14ch]" />
              <p
                className="mt-6 max-w-[46ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
                style={{ color: "var(--dim)" }}
              >
                {copy.line}
              </p>
            </div>
          </Enter>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Enter delay={ENTER.stagger}>
            <div>
              <PillButton href={bookHref} size="large" external>
                {copy.bookLabel}
              </PillButton>
              <div className="mt-9">
                <ContactBlock copy={copy.contact} />
              </div>
            </div>
          </Enter>
        </div>
      </div>

      <div className="mt-12 md:mt-14">
        <Enter>
          <a
            href={siblingHref}
            className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
          >
            <ImageReveal className="block aspect-[21/9] w-full">
              <Photo
                id={copy.sibling.mediaId}
                sizes={INVITATION_SIZES}
                box={INVITATION_BOX}
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
