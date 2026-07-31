import type { NextConfig } from "next";
import { withWorkflow } from "@workflow/next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Server-only vendor SDKs — don't bundle (avoids Turbopack choking on
  // @cursor/sdk's .LICENSE.txt sidecars; required at runtime in API routes only).
  serverExternalPackages: ["@cursor/sdk", "@anthropic-ai/sdk"],
};

export default withWorkflow(nextConfig);
