// lib/booking/constraints.test.ts
//
// Two rules in this module hold only by intention: nothing here reaches into
// the app, and no money arithmetic goes through floating point. Both rot the
// moment nobody is watching them, so both become mechanical checks here.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const sources = readdirSync(DIR)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => ({ file: f, text: readFileSync(path.join(DIR, f), "utf8") }));

describe("the booking module keeps its two load-bearing rules", () => {
  it("never reaches into the app — no component, content, or media-manifest import", () => {
    // The manifest carries a base64 blur URI per photograph; anything that
    // imports it drags all of them into whatever bundle it lands in.
    //
    // Matches both the `@/` alias and a relative escape (`../../content/home`)
    // — the alias is house style, but a relative path reaches the exact same
    // code and used to slip past this guard entirely, because the first
    // alternation required the `@/` prefix.
    for (const { file, text } of sources) {
      expect(text, `${file} imports outside lib/booking`).not.toMatch(
        /from\s+["'](?:@\/|(?:\.\.\/)+)(components|content)\/|media-manifest/,
      );
    }
  });

  it("does no floating-point money arithmetic", () => {
    // Paise are integers. A `parseFloat(` or `.toFixed(` call in a file that
    // computes a total is how a bill stops matching the arithmetic behind it.
    //
    // This matches the *call form* (trailing paren) against the raw,
    // unstripped source, rather than stripping comments first and matching
    // the bare word. Comment-stripping used to run via
    // `text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")`, and
    // that second replace is not string-literal-aware: a `//` inside an
    // ordinary string (e.g. a URL) on the same line as a real call would
    // delete everything after it, including the call, producing a false
    // pass. Matching the call form directly removes the hole *and* the
    // reason stripping existed — a prose mention like "no `parseFloat`" has
    // no trailing `(` and does not trip this. Do not reintroduce stripping.
    for (const { file, text } of sources) {
      expect(text, `${file} uses parseFloat(`).not.toMatch(/parseFloat\s*\(/);
      expect(text, `${file} uses .toFixed(`).not.toMatch(/\.toFixed\s*\(/);
    }
  });
});
