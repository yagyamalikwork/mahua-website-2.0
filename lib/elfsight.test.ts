import { describe, expect, it } from "vitest";
import { ELFSIGHT_SCRIPT, elfsightClass, REVIEWS_APP_ID } from "@/lib/elfsight";

describe("elfsight", () => {
  it("carries the client's own app id, verbatim", () => {
    expect(REVIEWS_APP_ID).toBe("9735be0a-7667-475d-938e-2de773f1c7de");
  });

  it("loads the platform from the vendor's CDN over https", () => {
    expect(ELFSIGHT_SCRIPT).toBe("https://elfsightcdn.com/platform.js");
  });

  it("builds the vendor's own class name, which is how their platform finds the mount", () => {
    expect(elfsightClass(REVIEWS_APP_ID)).toBe("elfsight-app-9735be0a-7667-475d-938e-2de773f1c7de");
  });

  it("refuses an id that is not a uuid, rather than rendering a mount nothing will ever fill", () => {
    expect(() => elfsightClass("not-a-uuid")).toThrow(/uuid/i);
  });
});
