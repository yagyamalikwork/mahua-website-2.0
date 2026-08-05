import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DIR = "components/signature/leaf-cursor";

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(path.join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(path.join(ROOT, rel)).isDirectory()) sourceFiles(rel, out);
    else if (/\.(ts|tsx|mjs)$/.test(name)) out.push(rel);
  }
  return out;
}

describe("the leaf cursor stays removable", () => {
  /**
   * The client asked for this one specifically — "I'm not too sure about the
   * leaf cursor, so build it in a way that we can easily remove or edit it" —
   * so removability is a requirement with teeth rather than an intention.
   *
   * Deleting the single mount in `app/layout.tsx` must remove the whole feature,
   * and because the component behind it is dynamically imported, its bytes go
   * with it rather than lingering as dead weight in the bundle.
   *
   * **This is the test that keeps that true in three months rather than only
   * today.** A second importer is how a removable feature quietly becomes a
   * load-bearing one, and it would never show up in a build, a type check or a
   * screenshot.
   */
  it("is imported by exactly one file outside its own directory", () => {
    /**
     * Matches an actual import, not a mention.
     *
     * This grepped for the bare path at first, and `scripts/check_leaf_cursor.mjs`
     * tripped it — on its *output filename*,
     * `docs/reviews/2026-08-05-signature/leaf-cursor.json`, which happens to
     * contain the same substring. A false positive is the cheap failure here; the
     * expensive one is the same weakness in the other direction, where a real
     * importer hides because it spelled the path differently. Requiring the path
     * to sit inside a `from "…"` or `import("…")` is both narrower and stricter
     * than a substring, because it is the syntax that actually creates a
     * dependency.
     */
    const IMPORTS = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)["'][^"']*signature\/leaf-cursor/;

    const importers = sourceFiles("components")
      .concat(sourceFiles("app"), sourceFiles("lib"), sourceFiles("scripts"))
      .filter((f) => !f.startsWith(DIR))
      .filter((f) => IMPORTS.test(readFileSync(path.join(ROOT, f), "utf8")));

    expect(importers).toEqual(["app/layout.tsx"]);
  });

  /**
   * The other half of the same promise. The mount is what makes the feature
   * optional, so it must not be the thing that also knows how to draw a leaf:
   * if `app/layout.tsx` imported the component directly, deleting the line would
   * still leave every byte of it in the first load.
   */
  it("reaches its component through a dynamic import, so removing it removes its weight", () => {
    const index = readFileSync(path.join(ROOT, DIR, "index.tsx"), "utf8");
    expect(index).toMatch(/dynamic\(\s*\(\)\s*=>\s*import\(/);
    // And the artwork must arrive with the component, never with the mount.
    expect(index).not.toContain("leaf-art");
  });
});
