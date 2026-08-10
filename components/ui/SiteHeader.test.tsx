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
    // The header grid renders: SiteMenu (which contains a[href='/'], then the
    // lockup anchor, then the pill. Selector must distinguish the lockup from
    // the menu's own Home link—include data-rule="none" to be specific.
    const home = container.querySelector("a[href='/'][data-rule='none']");
    expect(home).not.toBeNull();
    expect(home?.getAttribute("data-rule")).toBe("none");
    expect(home?.getAttribute("aria-label")).toBeTruthy();
  });
});
