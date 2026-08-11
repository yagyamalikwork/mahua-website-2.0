import { BookingError } from "./errors";
import type { BookingProvider } from "./provider";
import type { Booking, GuestDetails, Quote, SearchQuery, SearchResult } from "./types";

/**
 * The real provider, unimplemented on purpose.
 *
 * **AsiaTech had no usable API as of 12 Aug 2026.** Their engine is PHP with
 * jQuery 1.9.1; its two endpoints (`rooms_availabilty1.php`,
 * `availability-calender.php`) take form posts and answer with HTML fragments —
 * no JSON, no partner token, no versioning, no contract. Scraping them would
 * break on their next markup change and would be resting this client's booking
 * revenue on it, so this file waits instead.
 *
 * Three things are needed from them before it can be written; the spec's §8
 * has the wording. When they arrive, this file is the only one that changes —
 * that is what the interface is for.
 *
 * **Do not "temporarily" implement this by posting to those endpoints.**
 */
export class AsiaTechProvider implements BookingProvider {
  private refuse(): never {
    throw new BookingError(
      "PROVIDER_DOWN",
      "Online booking is not available yet — this provider is not implemented.",
      "AsiaTechProvider: not implemented — awaiting AsiaTech API documentation (spec §8)",
    );
  }

  async search(_query: SearchQuery): Promise<SearchResult> {
    this.refuse();
  }

  async quote(_input: { continuation: string; roomId: string; ratePlanId: string }): Promise<Quote> {
    this.refuse();
  }

  async book(_input: { quoteId: string; guest: GuestDetails }): Promise<Booking> {
    this.refuse();
  }
}
