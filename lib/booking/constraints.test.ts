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
    for (const { file, text } of sources) {
      expect(text, `${file} imports outside lib/booking`).not.toMatch(
        /from\s+["']@\/(components|content)\/|media-manifest/,
      );
    }
  });

  it("does no floating-point money arithmetic", () => {
    // Paise are integers. A `/` or a `parseFloat` in a file that computes a
    // total is how a bill stops matching the arithmetic behind it.
    for (const { file, text } of sources) {
      const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(stripped, `${file} uses parseFloat`).not.toMatch(/parseFloat|Number\.parseFloat/);
      expect(stripped, `${file} uses toFixed`).not.toMatch(/toFixed/);
    }
  });
});
