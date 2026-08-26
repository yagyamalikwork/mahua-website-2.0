import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewWidget } from "@/components/ui/ReviewWidget";
import { REVIEWS_APP_ID } from "@/lib/elfsight";

describe("ReviewWidget", () => {
  it("renders the vendor's mount, which their platform finds by class name", () => {
    const { container } = render(<ReviewWidget />);
    const mount = container.querySelector(`.elfsight-app-${REVIEWS_APP_ID}`);
    expect(mount).not.toBeNull();
  });

  it("keeps the lazy attribute, so the widget is not fetched above the fold", () => {
    const { container } = render(<ReviewWidget />);
    const mount = container.querySelector(`.elfsight-app-${REVIEWS_APP_ID}`);
    expect(mount?.hasAttribute("data-elfsight-app-lazy")).toBe(true);
  });

  /**
   * React 19 hoists `<script async src=…>` out of the render tree into
   * `document.head` and de-duplicates it by `src` — that hoist is the whole
   * mechanism `ReviewWidget`'s doc comment depends on (two mounts on one
   * page load the platform once, so neither needs a client boundary), so
   * this asserts against `document`, not `container`, where the brief's own
   * draft asserted and where the node never actually lands.
   *
   * **Deliberately no cleanup strips this between tests.** Once React has
   * recorded a `src` as inserted into `<head>` it will not insert it again —
   * verified directly: removing the node by hand after a render and then
   * rendering again leaves `<head>` empty, because React's own bookkeeping,
   * not the live DOM, is what it consults. Stripping it in an `afterEach`
   * was tried and broke every test in this file after the first render, for
   * that reason. Leaving it in `<head>` is harmless — no test here asserts
   * its absence, and Vitest gives each test *file* its own `document`, so
   * nothing here reaches another file.
   */
  it("loads the platform script asynchronously, so it cannot block the first screen", () => {
    render(<ReviewWidget />);
    const script = document.querySelector('script[src="https://elfsightcdn.com/platform.js"]');
    expect(script).not.toBeNull();
    expect(script?.hasAttribute("async")).toBe(true);
  });

  it("is labelled, because a region a screen reader lands in must say what it is", () => {
    const { getByRole } = render(<ReviewWidget label="What guests say" />);
    expect(getByRole("region", { name: "What guests say" })).toBeTruthy();
  });
});
