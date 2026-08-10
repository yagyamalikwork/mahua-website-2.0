// components/ui/SiteFooter.test.tsx
import { render } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SITE, SITE_FOOTER_ID } from "@/content/site";
import { SiteFooter } from "./SiteFooter";

// Repo root — `@/` resolves here, same as tsconfig's `paths`.
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const ENTRY = path.resolve(import.meta.dirname, "SiteFooter.tsx");

function toRepoRelative(absPath: string): string {
  return path.relative(ROOT, absPath).split(path.sep).join("/");
}

/**
 * Every `import ... from "..."` statement in `source`, multi-line brace
 * blocks included, tagged with whether it was written as a full
 * `import type { … } from "…"` — those are erased by TypeScript at compile
 * time, so a client component sitting behind one can never reach the
 * runtime tree, and this walk must not follow it.
 *
 * This distinguishes only by the literal `type` keyword on the import
 * statement, not by how the imported binding is used in the file body: a
 * mixed `import { type Foo, Bar }` line, or a plain `import { Foo }` whose
 * `Foo` happens to be used only in a type position, is treated as a value
 * import and followed. That is deliberately conservative — it can walk one
 * more file than strictly necessary, never fewer — and it is exactly the
 * distinction this footer's own imports need: a full `import type { … }`.
 */
function extractImportSpecifiers(source: string): { typeOnly: boolean; specifier: string }[] {
  const importRe = /import\s+(type\s+)?[\s\S]*?from\s+["']([^"']+)["']/g;
  const specifiers: { typeOnly: boolean; specifier: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = importRe.exec(source)) !== null) {
    specifiers.push({ typeOnly: Boolean(match[1]), specifier: match[2] });
  }
  return specifiers;
}

/** Resolves an `@/`-prefixed specifier to a real `.ts`/`.tsx` file, or null. */
function resolveAtImport(specifier: string): string | null {
  if (!specifier.startsWith("@/")) return null;
  const base = path.resolve(ROOT, specifier.slice(2));
  for (const ext of [".ts", ".tsx"]) {
    const candidate = `${base}${ext}`;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Walks the import graph rooted at `entryPath` and asserts every module
 * reached by a VALUE import — never a full `import type` — carries no
 * `"use client"` directive and no React hook. Cycle-safe via `visited`.
 *
 * On failure, the assertion message names both the offending file and the
 * chain of imports that reached it, because the point of walking the graph
 * over grepping one file is knowing where to go and fix it.
 */
// A real directive is its own statement — typically the file's first line —
// not a substring anywhere. Anchored to a whole line so a doc-comment that
// *mentions* the phrase (PropertyContact.tsx has one: "No `"use client"`, no
// state, no effect. Deliberately.") is not itself flagged as carrying it —
// that false positive is exactly what walking into real files, rather than
// grepping one known-clean one, turned up.
const USE_CLIENT_DIRECTIVE = /^\s*['"]use client['"]\s*;?\s*$/m;

function assertServerOnlyTree(entryPath: string): void {
  const visited = new Set<string>();

  function visit(absPath: string, chain: string[]): void {
    if (visited.has(absPath)) return;
    visited.add(absPath);
    const relPath = toRepoRelative(absPath);
    const trail = [...chain, relPath].join(" -> ");
    const source = readFileSync(absPath, "utf8");

    expect(USE_CLIENT_DIRECTIVE.test(source), `${trail}: carries a "use client" directive`).toBe(false);
    expect(source, `${trail}: uses a React hook`).not.toMatch(/\buse(State|Effect|Ref|Callback)\b/);

    for (const { typeOnly, specifier } of extractImportSpecifiers(source)) {
      if (typeOnly) continue; // erased at compile time — cannot reach the runtime tree
      const resolved = resolveAtImport(specifier);
      if (!resolved) continue; // not an "@/" module on disk (e.g. "react") — nothing to walk
      visit(resolved, [...chain, relPath]);
    }
  }

  visit(entryPath, []);
}

describe("SiteFooter", () => {
  it("carries no JavaScript at all", () => {
    // The directory is the site's no-JS navigation — the menu cannot open
    // without script, and this is what covers for it. A "use client" anywhere
    // in this file would be the fail-safe failing. Cheap and localises the
    // common case; the import-graph walk below is what makes the claim true
    // of the whole tree, not just this one file.
    const src = readFileSync(ENTRY, "utf8");
    expect(src).not.toContain('"use client"');
    expect(src).not.toMatch(/\buse(State|Effect|Ref|Callback)\b/);
  });

  it("carries no JavaScript anywhere in its import graph", () => {
    // The property this footer exists for is about its whole tree, not its
    // own file: it imports content/site.ts, content/mahua-vann.ts and
    // content/mahua-tola.ts as values, and a type from
    // components/property/PropertyContact.tsx. A "use client" landing in any
    // of the value-imported files later would make the footer client-side
    // while a single-file grep stayed green — this is what fails that case.
    assertServerOnlyTree(ENTRY);
  });

  it("links every place with a real href", () => {
    const { container } = render(<SiteFooter />);
    for (const place of SITE.places) {
      expect(
        container.querySelector(`a[href='${place.href}']`),
        `${place.label} missing`,
      ).not.toBeNull();
    }
  });

  it("gives both lodges working tel: and mailto: links", () => {
    const { container } = render(<SiteFooter />);
    expect(container.querySelectorAll("a[href^='tel:']").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll("a[href^='mailto:']").length).toBeGreaterThanOrEqual(2);
  });

  it("carries the office, the legal links and the copyright line", () => {
    const { getByText, container } = render(<SiteFooter />);
    expect(getByText(SITE.footer.office)).toBeTruthy();
    expect(getByText(SITE.footer.copyright)).toBeTruthy();
    for (const l of SITE.footer.legal) {
      const a = container.querySelector(`a[href='${l.href}']`);
      expect(a, `${l.label} missing`).not.toBeNull();
      expect(a?.getAttribute("target")).toBe("_blank");
    }
  });

  it("is findable by the id the property bar watches", () => {
    const { container } = render(<SiteFooter />);
    expect(container.querySelector(`footer#${SITE_FOOTER_ID}`)).not.toBeNull();
  });

  it("covers every link with the hairline contract", () => {
    const { container } = render(<SiteFooter />);
    for (const a of container.querySelectorAll("a[href]")) {
      expect(
        a.classList.contains("rule-in") || a.hasAttribute("data-rule"),
        `${a.getAttribute("href")} carries neither rule-in nor data-rule`,
      ).toBe(true);
    }
  });
});
