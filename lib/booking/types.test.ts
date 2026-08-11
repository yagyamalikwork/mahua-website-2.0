import { describe, expect, it } from "vitest";
import { addMoney, nightsBetween, rupees, stayDate } from "./types";

describe("Money", () => {
  it("holds integer paise and a currency", () => {
    expect(rupees(1545000)).toEqual({ amount: 1545000, currency: "INR" });
  });

  it("refuses a fractional amount — paise are the smallest unit there is", () => {
    expect(() => rupees(100.5)).toThrow(/integer/i);
  });

  it("refuses a negative amount", () => {
    expect(() => rupees(-1)).toThrow(/negative/i);
  });

  it("adds without leaving the integers", () => {
    expect(addMoney(rupees(1545000), rupees(1930000))).toEqual({ amount: 3475000, currency: "INR" });
  });
});

describe("StayDate", () => {
  it("accepts a civil calendar date", () => {
    expect(stayDate("2026-11-14")).toBe("2026-11-14");
  });

  it("refuses anything that is not YYYY-MM-DD", () => {
    expect(() => stayDate("14/11/2026")).toThrow(/YYYY-MM-DD/);
    expect(() => stayDate("2026-11-14T00:00:00Z")).toThrow(/YYYY-MM-DD/);
  });

  it("refuses a date that does not exist", () => {
    expect(() => stayDate("2026-02-31")).toThrow(/not a real date/i);
  });

  it("counts nights, not days — check-in Saturday, check-out Monday is two nights", () => {
    expect(nightsBetween(stayDate("2026-11-14"), stayDate("2026-11-16"))).toBe(2);
  });

  it("counts nights across a month boundary", () => {
    expect(nightsBetween(stayDate("2026-11-29"), stayDate("2026-12-02"))).toBe(3);
  });

  it("refuses a check-out that is not after check-in", () => {
    expect(() => nightsBetween(stayDate("2026-11-16"), stayDate("2026-11-16"))).toThrow(/after/i);
  });
});
