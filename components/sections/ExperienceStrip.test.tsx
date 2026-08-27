import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperienceStrip, type StripCopy } from "@/components/sections/ExperienceStrip";
import { chapter } from "@/content/chapters";
import { chapterCopy, HOME, type ChapterCopyKey } from "@/content/home";

/**
 * The home page's own copy, fed in as props exactly the way `app/page.tsx`
 * does — so the existing tests below keep exercising real content rather than
 * a stand-in, even though the component itself no longer knows where
 * `content/home.ts` is.
 */
const FIELD_DAYS_COPY = chapterCopy("field-days" as ChapterCopyKey) as StripCopy;
const STRIP_LABELS = HOME.strip;

describe("ExperienceStrip", () => {
  it("has no figure column — the tiger came off on 26 Aug 2026", () => {
    const { container } = render(
      <ExperienceStrip chapter={chapter("field-days")} copy={FIELD_DAYS_COPY} labels={STRIP_LABELS} />,
    );
    expect(container.querySelector(".experience-figure")).toBeNull();
  });

  it("is a 5/7 header band — heading narrow, paragraph wide, fix round 1 of 26 Aug 2026", () => {
    // The tiger's grid was 7/5 (copy/film). Removing the film alone, then a
    // one-column attempt that measured worse, both came and went the same day
    // — see the component's own top-of-file comment and
    // docs/reviews/2026-08-26-restructure/ for the swept alternatives (6/6,
    // 7/5) this shape beat on density. Exactly one of each column, and the
    // right content in each: the heading in the narrow slot, the paragraph in
    // the wide one.
    const { container } = render(
      <ExperienceStrip chapter={chapter("field-days")} copy={FIELD_DAYS_COPY} labels={STRIP_LABELS} />,
    );
    const headingCol = container.querySelector(".lg\\:col-span-5");
    const paragraphCol = container.querySelector(".lg\\:col-span-7");
    expect(headingCol).not.toBeNull();
    expect(paragraphCol).not.toBeNull();
    expect(headingCol?.querySelector("h2")).not.toBeNull();
    expect(paragraphCol?.querySelector("p")).not.toBeNull();
    expect(container.querySelectorAll(".lg\\:col-span-5")).toHaveLength(1);
    expect(container.querySelectorAll(".lg\\:col-span-7")).toHaveLength(1);
  });

  it("still renders all six cards", () => {
    const { container } = render(
      <ExperienceStrip chapter={chapter("field-days")} copy={FIELD_DAYS_COPY} labels={STRIP_LABELS} />,
    );
    expect(container.querySelectorAll(".experience-card")).toHaveLength(6);
  });

  it("renders copy it is given, from any page's content module", () => {
    // The whole point of the refactor: nothing here comes from
    // `content/home.ts` or `content/chapters.ts`'s `Chapter` type. A
    // structurally-shaped `chapter` (as `PropertyChapter` will supply) and an
    // inline `StripCopy`/`StripLabels` are enough to render — proving the
    // property pages can mount this section without importing the home
    // page's content module.
    const { getByText } = render(
      <ExperienceStrip
        chapter={{ id: "vann-day", number: "03", label: "The Experience" }}
        copy={{
          heading: { text: "The day at Vann", dim: "day" },
          body: ["Morning and evening game drives."],
          experiences: [
            { mediaId: "tiger-golden-grass", label: "At dawn", title: "Jungle Safari", body: "Through Turia Gate." },
          ],
        }}
        labels={{ region: "Experiences — scroll sideways", hint: "Scroll →", jump: "Jump to" }}
      />,
    );
    expect(getByText("Jungle Safari")).toBeTruthy();
    expect(getByText("03")).toBeTruthy();
  });

  it("gives every pager link a hit area that clears the accessibility floor", () => {
    // The pager's six links render 13x15 against WCAG 2.5.8 (AA)'s 24x24 floor
    // — the one control on this site that fails a standard rather than merely
    // sitting under Apple/Google's 44px comfort guidance (`docs/reviews/
    // 2026-08-27-mobile/`, Task 3). `.tap` (`app/globals.css`) grows the
    // effective hit area on touch with no layout change; this only checks the
    // class lands on every link, not the geometry — that is
    // `scripts/check_responsive.mjs`'s job, against a real browser.
    const { container } = render(
      <ExperienceStrip chapter={chapter("field-days")} copy={FIELD_DAYS_COPY} labels={STRIP_LABELS} />,
    );
    const links = container.querySelectorAll("nav a");
    expect(links).toHaveLength(6);
    for (const a of links) {
      expect(a.className).toContain("tap");
    }
  });
});
