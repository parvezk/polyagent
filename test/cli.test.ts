import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("CLI error handling", () => {
  it("prints a rejected command error without exposing its stack trace", () => {
    const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, "dispatch", "test prompt", "--vendor", "claude"],
      {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        encoding: "utf8",
        env: {
          PATH: process.env.PATH ?? "",
          HOME: process.env.HOME ?? "",
          ANTHROPIC_API_KEY: "",
          DOTENV_CONFIG_QUIET: "true",
          NO_COLOR: "1",
        },
      },
    );

    expect(result.status).toBe(1);
    expect(result.signal).toBeNull();
    expect(result.stderr.trim()).toBe(
      "No API key for claude. Set ANTHROPIC_API_KEY in .env.local.",
    );
  });
});
