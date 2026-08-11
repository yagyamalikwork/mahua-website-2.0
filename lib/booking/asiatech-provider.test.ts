import { describe, expect, it } from "vitest";
import { AsiaTechProvider } from "./asiatech-provider";
import { BookingError } from "./errors";
import { stayDate } from "./types";

const QUERY = {
  property: "mahua-vann" as const,
  checkIn: stayDate("2026-11-14"),
  checkOut: stayDate("2026-11-16"),
  rooms: [{ adults: 2, children: 0 }],
};

describe("AsiaTechProvider", () => {
  it("refuses every call, plainly, until AsiaTech supply an API", async () => {
    const p = new AsiaTechProvider();
    const calls = [
      p.search(QUERY),
      p.quote({ continuation: "x", roomId: "y", ratePlanId: "z" }),
      p.book({ quoteId: "q", guest: { fullName: "A", email: "a@b.c", phone: "+91" } }),
    ];
    for (const call of calls) {
      await expect(call).rejects.toBeInstanceOf(BookingError);
      await expect(call).rejects.toMatchObject({
        code: "PROVIDER_DOWN",
        providerDetail: expect.stringMatching(/not implemented/i),
      });
      await call.catch((e: unknown) => {
        expect((e as Error).message).not.toMatch(/not implemented/i);
      });
    }
  });
});
