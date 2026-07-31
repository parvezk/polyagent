import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./web", import.meta.url)),
      "next/server": fileURLToPath(new URL("./test/support/next-server.ts", import.meta.url)),
    },
  },
  test: { include: ["test/**/*.test.ts"] },
});
