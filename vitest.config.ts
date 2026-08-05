import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: { include: ["test/**/*.test.ts"] },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./web", import.meta.url)),
      "next/server": fileURLToPath(new URL("./test/support/next-server.ts", import.meta.url)),
    },
  },
});
