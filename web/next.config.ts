import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-only vendor SDKs — don't bundle (avoids Turbopack choking on
  // @cursor/sdk's .LICENSE.txt sidecars; required at runtime in API routes only).
  serverExternalPackages: ["@cursor/sdk", "@anthropic-ai/sdk"],
  // Allow the loopback hosts the Playwright E2E dev server is reached on, so dev
  // resources (HMR, chunks) load and the app hydrates under test. Dev-only setting.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
