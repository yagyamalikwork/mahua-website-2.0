// components/ui/SiteFooter.test.tsx
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SITE, SITE_FOOTER_ID } from "@/content/site";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("carries no JavaScript at all", () => {
    // The directory is the site's no-JS navigation — the menu cannot open
    // without script, and this is what covers for it. A "use client" anywhere
    // in this file would be the fail-safe failing.
    const src = readFileSync(
      path.resolve(import.meta.dirname, "SiteFooter.tsx"),
      "utf8",
    );
    expect(src).not.toContain('"use client"');
    expect(src).not.toMatch(/\buse(State|Effect|Ref|Callback)\b/);
  });

  it("links every place with a real href", () => {
    const { container } = render(<SiteFooter />);
    for (const place of SITE.places) {
      expect(
        container.querySelector(`a[href='${place.href}']`),
        `${place.label} missing`,
      ).not.toBeNull();
    }
  });

  it("gives both lodges working tel: and mailto: links", () => {
    const { container } = render(<SiteFooter />);
    expect(container.querySelectorAll("a[href^='tel:']").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll("a[href^='mailto:']").length).toBeGreaterThanOrEqual(2);
  });

  it("carries the office, the legal links and the copyright line", () => {
    const { getByText, container } = render(<SiteFooter />);
    expect(getByText(SITE.footer.office)).toBeTruthy();
    expect(getByText(SITE.footer.copyright)).toBeTruthy();
    for (const l of SITE.footer.legal) {
      const a = container.querySelector(`a[href='${l.href}']`);
      expect(a, `${l.label} missing`).not.toBeNull();
      expect(a?.getAttribute("target")).toBe("_blank");
    }
  });

  it("is findable by the id the property bar watches", () => {
    const { container } = render(<SiteFooter />);
    expect(container.querySelector(`footer#${SITE_FOOTER_ID}`)).not.toBeNull();
  });

  it("covers every link with the hairline contract", () => {
    const { container } = render(<SiteFooter />);
    for (const a of container.querySelectorAll("a[href]")) {
      expect(
        a.classList.contains("rule-in") || a.hasAttribute("data-rule"),
        `${a.getAttribute("href")} carries neither rule-in nor data-rule`,
      ).toBe(true);
    }
  });
});
