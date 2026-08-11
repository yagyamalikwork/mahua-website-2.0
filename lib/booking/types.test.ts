import { describe, expect, it } from "vitest";
import { addMoney, nightsBetween, rupees, stayDate } from "./types";

describe("Money", () => {
  it("holds integer paise and a currency", () => {
    const money = rupees(1545000);
    expect(money.amount).toBe(1545000);
    expect(money.currency).toBe("INR");
  });

  it("refuses a fractional amount — paise are the smallest unit there is", () => {
    expect(() => rupees(100.5)).toThrow(/integer/i);
  });

  it("refuses a negative amount", () => {
    expect(() => rupees(-1)).toThrow(/negative/i);
  });

  it("adds without leaving the integers", () => {
    const sum = addMoney(rupees(1545000), rupees(1930000));
    expect(sum.amount).toBe(3475000);
    expect(sum.currency).toBe("INR");
  });

  it("cannot be forged — rupees() is the only way to make Money", () => {
    // @ts-expect-error a bare object literal is not Money: the brand is unforgeable
    const forged: Money = { amount: 100.5, currency: "INR" };
    expect(forged).toBeTruthy();
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

  it("refuses a check-out before check-in, not merely one equal to it", () => {
    expect(() => nightsBetween(stayDate("2026-11-16"), stayDate("2026-11-14"))).toThrow(/after/i);
  });
});
