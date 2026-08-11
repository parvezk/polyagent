import { describe, expect, it } from "vitest";

import { shouldRenderFirstMessage } from "../web/components/session-drawer-messages";

describe("SessionDrawer firstMessage rendering", () => {
  it("renders a stored first message when there are no live messages", () => {
    expect(shouldRenderFirstMessage("hello", [])).toBe(true);
  });

  it("does not render a stored first message that is already in live messages", () => {
    expect(shouldRenderFirstMessage("hello", [{ role: "agent", content: "hello" }])).toBe(
      false,
    );
  });

  it("renders a stored first message when live messages do not include it", () => {
    expect(shouldRenderFirstMessage("hello", [{ role: "agent", content: "different" }])).toBe(
      true,
    );
  });
});
