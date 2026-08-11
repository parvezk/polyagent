import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  shouldTrackAnalytics: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: { init: mocks.init },
}));

vi.mock("@/lib/posthog", () => ({
  shouldTrackAnalytics: mocks.shouldTrackAnalytics,
}));

async function loadInstrumentation(
  key: string | undefined,
  host: string | undefined,
): Promise<void> {
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", key);
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", host);
  await import("../web/instrumentation-client.js");
}

describe("PostHog instrumentation client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.shouldTrackAnalytics.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("initializes PostHog with the configured client options", async () => {
    await loadInstrumentation("ph_test", "https://us.i.posthog.com");

    expect(mocks.shouldTrackAnalytics).toHaveBeenCalledOnce();
    expect(mocks.init).toHaveBeenCalledOnce();
    expect(mocks.init).toHaveBeenCalledWith("ph_test", {
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      defaults: "2026-05-30",
    });
  });

  it.each([
    ["analytics are disabled", false, "ph_test", "https://us.i.posthog.com"],
    ["the key is missing", true, undefined, "https://us.i.posthog.com"],
    ["the host is missing", true, "ph_test", undefined],
  ])("does not initialize when %s", async (_reason, enabled, key, host) => {
    mocks.shouldTrackAnalytics.mockReturnValue(enabled);

    await loadInstrumentation(key, host);

    expect(mocks.init).not.toHaveBeenCalled();
  });
});
