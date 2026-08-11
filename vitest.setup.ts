/**
 * Registers jest-dom's matchers (toHaveAttribute, toBeInTheDocument, …) on
 * Vitest's own `expect`. Referencing the package path directly as a
 * `setupFiles` string in `vitest.config.ts` registers the matchers at
 * runtime but leaves `tsc` unaware of them — module augmentation only
 * applies to files `tsc` actually includes in its program, and a bare string
 * in a config array is never parsed as an import. This file exists so the
 * `import` is real and `tsconfig.json`'s `**\/*.ts` glob pulls it into the
 * program, which is what makes `expect(...).toHaveAttribute(...)` type-check
 * in every `.test.tsx` file, not only run.
 */
import "@testing-library/jest-dom/vitest";
