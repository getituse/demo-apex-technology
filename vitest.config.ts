import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    // Bound cold Windows worker startup without relaxing test deadlines or assertions.
    maxWorkers: 2,
    minWorkers: 1,
    reporters: ["basic", "json"],
    outputFile: "build/vitest-results.json",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
