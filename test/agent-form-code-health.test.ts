import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("useAgentForm code health", () => {
  it("does not hardcode vendor names in the hook", () => {
    const source = readFileSync(
      new URL("../web/components/use-agent-form.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toMatch(/["'](?:claude|jules|cursor|gemini)["']/);
  });
});
