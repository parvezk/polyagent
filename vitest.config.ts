import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./web", import.meta.url).pathname,
    },
  },
  test: { include: ["test/**/*.test.ts"] },
});
