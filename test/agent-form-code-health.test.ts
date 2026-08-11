import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VENDORS } from "../web/utils/constants";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("useAgentForm code health", () => {
  it("does not hardcode vendor names in the hook", () => {
    const source = readFileSync(
      new URL("../web/components/use-agent-form.ts", import.meta.url),
      "utf8",
    );
    const vendorPattern = VENDORS.map(escapeRegExp).join("|");

    expect(source).not.toMatch(new RegExp(`["'](?:${vendorPattern})["']`));
  });

  it("does not hardcode vendor-specific source URLs in the hook", () => {
    const source = readFileSync(
      new URL("../web/components/use-agent-form.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("/api/jules/sources");
  });
});
