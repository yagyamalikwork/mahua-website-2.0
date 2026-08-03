import { describe, expect, it } from "vitest";
import { CHAPTERS } from "./chapters";
import { HOME, chapterCopy } from "./home";

const strings = (obj: unknown): string[] =>
  typeof obj === "string" ? [obj]
    : Array.isArray(obj) ? obj.flatMap(strings)
    : obj && typeof obj === "object" ? Object.values(obj).flatMap(strings)
    : [];

/** Every chapter entry, with its id, as a loosely-typed bag for the shape checks. */
const entries = Object.entries(HOME.chapters) as [string, Record<string, unknown>][];

describe("house style (CLAUDE.md conventions)", () => {
  const all = strings(HOME);

  it("uses British spelling", () => {
    // House convention is British with -ise endings (the brand record uses
    // "harmonise"). Only unambiguously American forms are listed: words like
    // "practice", "license" and "curb" are valid in British English too and
    // would produce false failures.
    const american =
      /\b(colors?|colored|coloring|gray|favorites?|centers?|centered|honors?|honored|flavors?|flavored|neighbors?|labor|humor|harbor|savor|splendor|somber|fiber|liters?|meters?|theaters?|defense|offense|jewelry|aluminum|catalog|dialog|specialty|program|travelers?|traveled|traveling|canceled|canceling|apologize|organize|realize|recognize|emphasize|minimize|maximize|customize|personalize|prioritize|harmonize|revitalize|analyze|paralyze|inquire|inquires|inquired|inquiring|inquiry|inquiries)\b/i;
    for (const s of all) {
      expect(american.test(s), `American spelling in: "${s}"`).toBe(false);
    }
  });

  it("does not reuse the old keyword filler", () => {
    for (const s of all) {
      expect(s.toLowerCase()).not.toContain("boutique nature resorts in india");
    }
  });

  it("opens with one confident line, not a paragraph", () => {
    expect(HOME.chapters.arrival.headline.length).toBeLessThanOrEqual(60);
    // A sentence break followed by more text means two sentences. A single
    // trailing full stop is fine; counting "." segments is not, since it both
    // passes run-ons with no punctuation and fails on abbreviations like "St.".
    expect(HOME.chapters.arrival.headline).not.toMatch(/[.!?]\s+\S/);
  });
});

describe("HOME.chapters", () => {
  it("gives every chapter its copy", () => {
    for (const c of CHAPTERS) {
      expect(() => chapterCopy(c.id as never), `no copy for chapter "${c.id}"`).not.toThrow();
    }
  });

  it("writes no copy for a chapter that is not on the page", () => {
    // The other direction. Without it, copy for a chapter deleted from the spine
    // sits here forever looking like it ships.
    const ids = new Set(CHAPTERS.map((c) => c.id));
    for (const [id] of entries) {
      expect(ids.has(id), `copy for "${id}", which is not in CHAPTERS`).toBe(true);
    }
  });

  it("keeps headings short enough to sit over a photograph", () => {
    for (const [id, entry] of entries) {
      const heading = entry.heading as { text: string } | undefined;
      if (!heading) continue;
      expect(heading.text.length, `${id} heading is ${heading.text.length} characters`)
        .toBeLessThanOrEqual(70);
    }
  });

  it("dims a word that is actually in its heading, exactly once", () => {
    // The reference's signature move is one word dropped to a lighter tone. If
    // the word is absent the effect silently does nothing; if it appears twice,
    // which occurrence gets dimmed is down to whichever way the component
    // happens to split. Both are invisible without this.
    for (const [id, entry] of entries) {
      const heading = entry.heading as { text: string; dim: string } | undefined;
      if (!heading) continue;
      const occurrences = heading.text.split(heading.dim).length - 1;
      expect(occurrences, `"${heading.dim}" appears ${occurrences}× in ${id}'s heading`).toBe(1);
    }
  });

  it("captions only the photographs its own chapter carries", () => {
    // The join that matters most: `chapters.ts` decides which photographs a
    // chapter shows and `home.ts` writes their captions, and nothing else would
    // notice a caption describing a plate that is not on the page — it would
    // simply render under the wrong photograph.
    for (const c of CHAPTERS) {
      const plates = (HOME.chapters[c.id as keyof typeof HOME.chapters] as {
        plates?: readonly { mediaId: string; caption: string }[];
      }).plates;
      if (!plates) continue;
      const carried = new Set<string>(c.media);
      for (const p of plates) {
        expect(carried.has(p.mediaId), `"${c.id}" captions ${p.mediaId}, which it does not show`)
          .toBe(true);
      }
      expect(new Set(plates.map((p) => p.mediaId)).size, `${c.id} captions one plate twice`)
        .toBe(plates.length);
    }
  });

  it("leaves nothing blank", () => {
    for (const s of strings(HOME)) {
      expect(s.trim().length, `an empty string in HOME`).toBeGreaterThan(0);
    }
  });

  it("attributes every guest quote to a named person and a source", () => {
    // Guardrail against inventing testimonials. These are verbatim from the
    // Tripadvisor widget on the live site; an unattributed quote here would mean
    // someone had written one.
    for (const q of HOME.chapters.guests.quotes) {
      expect(q.name.trim().length, "an unattributed quote").toBeGreaterThan(1);
      expect(q.source.trim().length, `${q.name} has no source`).toBeGreaterThan(1);
      expect(q.year, `${q.name} has no year`).toMatch(/^(19|20)\d{2}$/);
    }
  });
});
