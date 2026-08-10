import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "web"),
      "next/server": resolve(__dirname, "test/stubs/next-server.ts"),
    },
  },
  test: { include: ["test/**/*.test.ts"] },
});
