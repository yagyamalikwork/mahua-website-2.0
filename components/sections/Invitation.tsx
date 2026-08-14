import { Enter } from "@/components/motion/Enter";
import { FullBleed } from "@/components/ui/FullBleed";
import { PillButton } from "@/components/ui/PillButton";
import { SITE } from "@/content/site";
import { Scrim } from "@/components/ui/Scrim";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { Chapter } from "@/content/chapters";
import { chapterCopy, type ChapterCopyKey, type TwoTone } from "@/content/home";

/**
 * The close: a full-bleed photograph at dusk, the season laid out honestly, and
 * one pill.
 *
 * Everything on it is cream over a scrim — the heading (its dimmed word in
 * `--surface` rather than `--dim`, which would disappear), both paragraphs, and
 * a gold rule. The pill is the one place gold is a fill rather than a line, and
 * its label is `--overlay` because neither white nor ink clears 4.5:1 on gold;
 * see `components/ui/PillButton.tsx` for the three measurements.
 *
 * This chapter carries the most text of any full-bleed screen on the page, so it
 * is the one that would overflow first on a landscape phone. The photograph is
 * absolutely positioned inside a `min-h-[100svh]` section rather than being the
 * thing that sets the height, so the section grows instead of clipping, and the
 * `--overlay` behind it means a section grown past 100vh shows the scrim's own
 * colour at the bottom rather than a strip of cream.
 */
type InvitationCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
};

export function Invitation({ chapter }: { chapter: Chapter }) {
  const copy = chapterCopy(chapter.id as ChapterCopyKey) as InvitationCopy;

  return (
    <section
      id={chapter.id}
      className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-6 py-24 md:px-12 short:py-14"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div className="absolute inset-0 -z-10">
        <FullBleed id={chapter.media[0]} heightVh={100} />
      </div>
      <div className="absolute inset-0 -z-10">
        {/* The heaviest scrim on the page, and the narrow viewports are why. This
            chapter's two paragraphs fill ~68% of a 768×1024 frame, so most of
            the type ends up outside a radial's falloff and only an even wash
            reaches it: the radial-led version measured 4.20:1 at 768 and 4.50 at
            390, both under the 4.5 floor for body text. The photograph pays for
            it — this is the darkest frame on the page. */}
        <Scrim flat={0.54} centre={0.46} />
      </div>

      <Enter>
        <div className="flex w-full max-w-[60ch] flex-col items-center text-center">
          <TwoToneHeading
            heading={copy.heading}
            align="centre"
            size="close"
            onPhoto
            className="max-w-[16ch]"
          />
          <span
            aria-hidden="true"
            className="mt-8 block h-px w-16 short:mt-5"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <div className="mt-8 space-y-5 short:mt-5 short:space-y-3">
            {copy.body.map((paragraph, i) => (
              <p
                key={i}
                className="font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] text-[color:var(--bg)] md:text-lg short:text-base short:leading-[1.55]"
              >
                {paragraph}
              </p>
            ))}
          </div>
          {/*
            * The close offers the two lodges, not a second "Plan your stay".
            *
            * Client request, 15 Aug 2026: the header's pill already scrolls here,
            * and landing under "Two forests are expecting you" only to meet
            * another button off to mahuaresorts.com asked the visitor to choose
            * nothing. These two do the choosing, and they go to our own property
            * pages rather than off the site.
            *
            * **Read off `content/site.ts`, so no lodge name is written here.**
            * That file already carries the name, the region and the route for
            * both, and the menu draws its tiles from the same three fields — so
            * a third lodge, or a renamed one, arrives in both places at once and
            * cannot disagree with itself. The comma is punctuation joining two
            * names already supplied, not new copy.
            */}
          {/*
            * `w-max` so the row sizes to the two pills rather than to the prose
            * column above it. The parent is `max-w-[60ch]` — about 530px — and
            * the pair needs a little more than that, so inside it they wrapped
            * onto two lines at every width. The parent is `items-center`, so a
            * `w-max` child still centres.
            *
            * `flex-wrap` with a viewport cap is what puts them back on two lines
            * where they genuinely do not fit — a phone — rather than letting
            * them run off the edge of a section that clips its overflow.
            */}
          <div className="mt-10 flex w-max max-w-[92vw] flex-wrap justify-center gap-4 short:mt-6">
            {SITE.places
              .filter((place) => place.region)
              .map((place) => (
                <PillButton key={place.href} href={place.href} size="large" raise>
                  {`${place.label}, ${place.region}`}
                </PillButton>
              ))}
          </div>
        </div>
      </Enter>
    </section>
  );
}
