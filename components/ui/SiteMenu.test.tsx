import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SITE } from "@/content/site";
import { SiteMenu } from "./SiteMenu";

// SiteMenu reads the current route to mark "you are here".
const pathname = vi.hoisted(() => ({ value: "/mahua-vann" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

const CARDS = {
  "/mahua-vann": <img data-testid="vann-card" alt="" />,
  "/mahua-tola": <img data-testid="tola-card" alt="" />,
};

const open = (r: ReturnType<typeof render>) =>
  fireEvent.click(r.container.querySelector("button[aria-controls='site-menu']")!);

describe("SiteMenu", () => {
  it("is a hamburger with its name in the accessibility tree, not on screen", () => {
    const { container } = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    const trigger = container.querySelector("button[aria-controls='site-menu']")!;
    expect(trigger.getAttribute("aria-label")).toBe(SITE.nav.menuLabel);
    expect(trigger.textContent?.trim()).toBe("");
    expect(trigger.querySelector("svg")).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps the card photographs out of the DOM until the first open", () => {
    // The panel is always mounted for its dialog machinery, and visibility:
    // hidden does not stop an image intersecting the viewport — eager cards
    // would join every page's initial transfer against the hero on 4G.
    const r = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    expect(r.queryByTestId("vann-card")).toBeNull();
    open(r);
    expect(r.queryByTestId("vann-card")).not.toBeNull();
    expect(r.queryByTestId("tola-card")).not.toBeNull();
  });

  it("lists every place and marks the one you are standing on", () => {
    const r = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    open(r);
    for (const place of SITE.places) {
      expect(
        r.container.querySelector(`#site-menu a[href='${place.href}']`),
        `${place.label} missing`,
      ).not.toBeNull();
    }
    const current = r.container.querySelector("#site-menu a[aria-current='page']");
    expect(current?.getAttribute("href")).toBe("/mahua-vann");
  });

  it("closes on the current place instead of reloading it", () => {
    const r = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    open(r);
    const current = r.container.querySelector("#site-menu a[aria-current='page']")!;
    const clicked = fireEvent.click(current);
    // fireEvent.click returns false when preventDefault was called.
    expect(clicked).toBe(false);
    expect(
      r.container.querySelector("button[aria-controls='site-menu']")?.getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("gives each lodge its region in the accessible name and Home none", () => {
    const r = render(<SiteMenu places={SITE.places} cards={CARDS} />);
    open(r);
    const vann = r.container.querySelector("#site-menu a[href='/mahua-vann']")!;
    expect(vann.textContent).toContain("Pench");
    const home = r.container.querySelector("#site-menu a[href='/']")!;
    expect(home.textContent?.trim()).toBe("Home");
  });
});
