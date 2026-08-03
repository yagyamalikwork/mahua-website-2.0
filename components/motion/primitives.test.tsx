/* Plain <img> is deliberate here — next/image renders a wrapper and its own
   loader, which would put a layer between the test and the thing being tested. */
/* eslint-disable @next/next/no-img-element */
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageReveal } from "./ImageReveal";
import { SplitLines } from "./SplitLines";
import { StickyScene } from "./StickyScene";

/**
 * The plan asked for these components in prose — "never leave text hidden behind
 * a mask that never lifts" — and prescribed no test for it. That is the exact
 * failure that shipped once already: `Reveal` applied GSAP's "from" state when
 * its ScrollTrigger was created, so anything on screen at hydration went
 * invisible and stayed there. It was caught by eye, late. These are the checks
 * that would have caught it early.
 */

const HEADLINE = "A legacy of conservation woven through generations";

function withReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

/** Text as a reader would see it, with the per-word boxes flattened back out. */
function visibleText(node: HTMLElement) {
  return (node.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * jsdom reports every rect as zeros, so everything looks on-screen-at-mount.
 * Push the element below the fold to exercise the scroll-triggered path, where
 * GSAP applies its "from" state at mount and the words really are displaced.
 */
function placeBelowTheFold() {
  const rect = { top: 5000, bottom: 5400, left: 0, right: 900, width: 900, height: 400, x: 0, y: 5000 };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    ...rect,
    toJSON: () => rect,
  } as DOMRect);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SplitLines", () => {
  it("renders the headline as ordinary readable text with no JavaScript at all", () => {
    // Server markup is what a visitor gets before hydration, and all a visitor
    // with JavaScript disabled will ever get.
    const html = renderToStaticMarkup(<SplitLines as="h1">{HEADLINE}</SplitLines>);
    const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

    expect(text).toBe(HEADLINE);
    expect(html, "nothing may be hidden in markup that script has to undo").not.toMatch(
      /opacity:\s*0|visibility:\s*hidden|display:\s*none/,
    );
    expect(html, "no transform may displace the words at rest").not.toMatch(/transform:/);
  });

  it("leaves a headline that is already on screen completely alone", () => {
    // Measured in a real browser: animating an on-screen-at-mount headline
    // paints it settled, then drops it out of view and lifts it back — a
    // flicker. There is nothing to reveal, so nothing should move.
    withReducedMotion(false);
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    const heading = container.querySelector("h2");

    expect(heading).not.toBeNull();
    expect(visibleText(heading as HTMLElement)).toBe(HEADLINE);
    for (const inner of container.querySelectorAll<HTMLElement>("[data-line-inner]")) {
      expect(inner.style.transform, "an on-screen headline was displaced anyway").toBe("");
      expect(inner.style.opacity, "a word was faded out and never faded back").not.toBe("0");
    }
  });

  it("does hide the words when the headline is still below the fold", () => {
    // The other half of the rule above: if nothing is ever displaced, the
    // reveal is not happening at all and the two tests below prove nothing.
    withReducedMotion(false);
    placeBelowTheFold();
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    const displaced = [...container.querySelectorAll<HTMLElement>("[data-line-inner]")].filter(
      (i) => i.style.transform !== "",
    );
    expect(displaced.length, "no word was staged for its reveal").toBeGreaterThan(0);
  });

  it("leaves the words untransformed when the visitor asked for less motion", () => {
    withReducedMotion(true);
    // Below the fold on purpose: on screen, the component skips the tween for an
    // unrelated reason, and this test would pass without reduced motion doing
    // any work at all.
    placeBelowTheFold();
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);

    for (const inner of container.querySelectorAll<HTMLElement>("[data-line-inner]")) {
      expect(inner.style.transform, "reduced motion must be a still state, not a slow one").toBe("");
    }
    expect(visibleText(container.querySelector("h2") as HTMLElement)).toBe(HEADLINE);
  });

  it("puts the words back if it is unmounted mid-animation", () => {
    withReducedMotion(false);
    placeBelowTheFold();
    const { container, unmount } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    const inners = [...container.querySelectorAll<HTMLElement>("[data-line-inner]")];
    unmount();
    for (const inner of inners) {
      expect(inner.style.transform, "a killed tween left a word displaced").toBe("");
    }
  });

  it("renders the tag it was asked for", () => {
    withReducedMotion(false);
    const { container } = render(<SplitLines as="p">{HEADLINE}</SplitLines>);
    expect(container.querySelector("p")).not.toBeNull();
    expect(container.querySelector("h2")).toBeNull();
  });
});

describe("ImageReveal", () => {
  it("shows the photograph, not a cream panel, with no JavaScript", () => {
    const html = renderToStaticMarkup(
      <ImageReveal>
        <img src="/media/tiger-golden-grass-1440.jpg" alt="A tiger in golden grass" />
      </ImageReveal>,
    );
    // The mask must be collapsed in the markup. `scale-y-0` is the Tailwind
    // class that does it; if this is ever inverted to a covered-at-rest mask,
    // every photograph on the page goes blank without script.
    expect(html).toMatch(/data-image-mask[^>]*class="[^"]*scale-y-0/);
    expect(html).toContain("A tiger in golden grass");
  });

  it("hides the mask from assistive technology", () => {
    const { container } = render(
      <ImageReveal>
        <img src="/media/tiger-golden-grass-1440.jpg" alt="A tiger in golden grass" />
      </ImageReveal>,
    );
    expect(container.querySelector("[data-image-mask]")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("never touches GSAP when told it is static", () => {
    withReducedMotion(false);
    const { container } = render(
      <ImageReveal static>
        <img src="/media/reception-path-dusk-1440.jpg" alt="A lantern-lit path at dusk" />
      </ImageReveal>,
    );
    // The LCP escape hatch: no inline transform means no tween ran, so the hero
    // image cannot be charged to the metric.
    const inner = container.querySelector<HTMLElement>("[data-image-inner]");
    expect(inner?.style.transform).toBe("");
  });
});

describe("StickyScene", () => {
  it("clamps the scroll it reserves", () => {
    for (const [asked, expected] of [
      [9, 3],
      [0, 1],
      [-4, 1],
      [2, 2],
    ] as const) {
      const html = renderToStaticMarkup(<StickyScene screens={asked}>scene</StickyScene>);
      expect(html, `asked for ${asked} screens`).toContain(`--sticky-screens:${expected}`);
    }
  });
});
