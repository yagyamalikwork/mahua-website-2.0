import { describe, expect, it } from "vitest";
import { MEDIA } from "./media";
import { roomCardAspect } from "./room-card";
import { VANN_COPY } from "@/content/mahua-vann";
import { TOLA_COPY } from "@/content/mahua-tola";

// Every room across both content files — reused by the population guard
// below. MEDIA is an array (of MediaEntry, each carrying its own `id`), not a
// map — Object.keys(MEDIA) would yield array indices ("0", "1", ...) and make
// a coverage loop vacuous, so this collects ids straight off the content
// files instead of guessing at MEDIA's shape.
const EVERY_ROOM_MEDIA_ID = [
  ...VANN_COPY.showcaseCopy!["vann-rooms"].rooms.map((r) => r.mediaId),
  ...TOLA_COPY.showcaseCopy!["tola-rooms"].rooms.map((r) => r.mediaId),
];

describe("roomCardAspect", () => {
  it("reports the photograph's real aspect, not the card's", () => {
    expect(roomCardAspect("tola-room-family")).toBeCloseTo(1707 / 2560, 3);
  });
  it("throws on an unknown id rather than defaulting", () => {
    expect(() => roomCardAspect("no-such-photo" as never)).toThrow(/Unknown media id/);
  });
});

describe("the beside population", () => {
  // The composition is the client's own ruling (13 Aug 2026) and no longer
  // derived from the photograph — but the geometry still assumes no room
  // photograph reads wide. The solved bound keeps the CROP legal at any
  // aspect; what it cannot do is stop a 2.3:1 letterbox floating in a band of
  // cream inside its half (the exact look the ruling replaced). §2 #46 is the
  // history: a like-for-like photo swap silently reshaping a chapter. 1.6 is
  // 1.50 (the widest current room, cottage-plain's 1184/789) plus margin.
  it("keeps every room photograph at or under 1.6:1, in both content files", () => {
    expect(EVERY_ROOM_MEDIA_ID.length).toBe(7);
    for (const id of EVERY_ROOM_MEDIA_ID) {
      expect(roomCardAspect(id), id).toBeLessThanOrEqual(1.6);
    }
  });

  it("covers every room in both content files", () => {
    for (const { id } of MEDIA) {
      if (!id.includes("room") && id !== "suite-tiger-painting") continue;
      expect(() => roomCardAspect(id as never)).not.toThrow();
    }
  });
});
