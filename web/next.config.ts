import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-only vendor SDKs — don't bundle (avoids Turbopack choking on
  // @cursor/sdk's .LICENSE.txt sidecars; required at runtime in API routes only).
  serverExternalPackages: ["@cursor/sdk", "@anthropic-ai/sdk"],
};

export default nextConfig;
