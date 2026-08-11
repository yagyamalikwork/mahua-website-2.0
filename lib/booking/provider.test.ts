import { describe, expect, it } from "vitest";
import { PROPERTY_REGIDS } from "./provider";

describe("PROPERTY_REGIDS", () => {
  it("maps both properties to the ids their booking engine uses", () => {
    expect(PROPERTY_REGIDS["mahua-vann"]).toBe("8351");
    expect(PROPERTY_REGIDS["mahua-tola"]).toBe("8350");
  });

  it("covers every property and nothing else", () => {
    expect(Object.keys(PROPERTY_REGIDS).sort()).toEqual(["mahua-tola", "mahua-vann"]);
  });
});
