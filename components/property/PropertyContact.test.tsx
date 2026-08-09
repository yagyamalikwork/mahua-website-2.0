import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactBlock, ContactLine, type PropertyContactCopy } from "./PropertyContact";

const COPY: PropertyContactCopy = {
  phone: { label: "Speak to us", value: "+91 87448 67278", href: "tel:+918744867278" },
  email: { label: "Write", value: "sales@mahuaresorts.com", href: "mailto:sales@mahuaresorts.com" },
  address: { label: "Find us", value: "Village Kuppitola, Khawasa, Madhya Pradesh 480881" },
};

describe("ContactLine", () => {
  it("is a real tel: link, not type that looks like one", () => {
    // The whole reason details were chosen over a form: they cannot fail. A
    // number rendered as inert text would look identical in a screenshot and
    // be useless on the device most visitors are holding.
    const { container } = render(<ContactLine copy={COPY} />);
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe("tel:+918744867278");
    expect(a?.textContent).toContain("+91 87448 67278");
  });
});

describe("ContactBlock", () => {
  it("gives the phone and the email working links", () => {
    const { container } = render(<ContactBlock copy={COPY} />);
    expect(container.querySelector("a[href^='tel:']")).not.toBeNull();
    expect(container.querySelector("a[href^='mailto:']")).not.toBeNull();
  });

  it("sets the address as text, because an address is not a link", () => {
    const { getByText, container } = render(<ContactBlock copy={COPY} />);
    const address = getByText(/Village Kuppitola/);
    expect(address.closest("a")).toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(2);
  });

  it("labels every row, so the block scans without punctuation", () => {
    const { getByText } = render(<ContactBlock copy={COPY} />);
    expect(getByText("Speak to us")).toBeTruthy();
    expect(getByText("Write")).toBeTruthy();
    expect(getByText("Find us")).toBeTruthy();
  });

  it("carries the sliding hairline on every link it renders", () => {
    // scripts/check_rule_in.mjs fails any link carrying neither `rule-in` nor
    // an explicit data-rule opt-out. Catching it here costs a second; catching
    // it in the browser rig costs a build and a server.
    const { container } = render(<ContactBlock copy={COPY} />);
    for (const a of container.querySelectorAll("a[href]")) {
      expect(
        a.classList.contains("rule-in") || a.querySelector(".rule-in") !== null,
        `${a.getAttribute("href")} carries no rule`,
      ).toBe(true);
    }
  });
});
