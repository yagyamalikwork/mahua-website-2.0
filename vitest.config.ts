import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // `RoomCard.test.tsx` is the project's first test to reach for jest-dom
    // matchers (toHaveAttribute, toBeInTheDocument, toHaveTextContent); every
    // prior suite asserted on raw DOM properties instead. `@testing-library/
    // jest-dom` was already a dependency but never wired up. `./vitest.setup.ts`
    // is a real `import`, not a bare specifier, so `tsc` includes it in the
    // program and picks up the ambient `Assertion` augmentation too — see that
    // file for why a bare string here would run the matchers without tsc ever
    // knowing they exist.
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", ".tmp-scaffold"],
  },
  resolve: {
    alias: { "@": import.meta.dirname },
  },
});
