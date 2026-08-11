import type { Booking, GuestDetails, PropertyId, Quote, SearchQuery, SearchResult } from "./types";

/**
 * What any booking engine must be able to do. Three calls, in the order a
 * guest moves through them.
 *
 * Every method rejects with `BookingError` (see `./errors`) and nothing else.
 */
export interface BookingProvider {
  /** Rooms and rates for a date range. */
  search(query: SearchQuery): Promise<SearchResult>;

  /**
   * Re-price one chosen room and rate plan, and hold it briefly.
   *
   * **Separate from `search` on purpose.** A price can move and a room can sell
   * between a guest choosing and a guest paying. This is where that is caught —
   * not at payment, where the guest has already given their card.
   */
  quote(input: {
    readonly continuation: string;
    readonly roomId: string;
    readonly ratePlanId: string;
  }): Promise<Quote>;

  /** Commit. The only call that creates something a guest can be charged for. */
  book(input: { readonly quoteId: string; readonly guest: GuestDetails }): Promise<Booking>;
}

/**
 * The ids Mahua's own booking engine uses for each property, read from the
 * live booking links in `app/mahua-vann/page.tsx` and `app/mahua-tola/page.tsx`
 * (`?token=` is base64 of these). Kept here so a provider adapter never has to
 * guess, and so the mapping is asserted rather than remembered.
 */
export const PROPERTY_REGIDS: Record<PropertyId, string> = {
  "mahua-vann": "8351",
  "mahua-tola": "8350",
};
