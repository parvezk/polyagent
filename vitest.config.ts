import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": fromRoot("./web"),
      "next/navigation": fromRoot("./web/node_modules/next/navigation.js"),
      "next/server": fromRoot("./test/stubs/next-server.ts"),
      "posthog-js": fromRoot("./web/node_modules/posthog-js/dist/main.js"),
      react: fromRoot("./web/node_modules/react/index.js"),
    },
  },
  test: { include: ["test/**/*.test.ts"] },
});
