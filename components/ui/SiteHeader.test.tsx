import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./SiteHeader";

// SiteHeader renders SiteMenu, which reads the current route.
const pathname = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

describe("SiteHeader", () => {
  it("makes the lockup a link home, opted out of the hairline", () => {
    // The lockup was inert — on a subpage, a dead end where every visitor
    // expects a way back. data-rule="none" because a hairline under an image
    // lockup reads as a rendering fault (the pills' own opt-out).
    const { container } = render(<SiteHeader ctaHref="#invitation" />);
    const home = container.querySelector("a[aria-label='Mahua Resorts — home']");
    expect(home).not.toBeNull();
    // Assert it carries the grid centring
    expect(home?.getAttribute("class")).toContain("justify-self-center");
    // Assert it wraps the lockup (BrandMark renders a flex span with gap)
    expect(home?.querySelector("span.flex")).not.toBeNull();
    // Assert the opt-out from the hairline rule
    expect(home?.getAttribute("data-rule")).toBe("none");
  });
});
