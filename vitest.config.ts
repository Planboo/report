import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup/vitest.setup.ts"],
    globals: true,
    css: true,
    exclude: ["**/node_modules/**", "**/e2e/**"],
    coverage: {
      reporter: ["text", "html", "lcov"],
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "**/*.d.ts", "e2e/**"],
    },
  },
});
