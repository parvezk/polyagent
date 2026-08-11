import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shouldTrackAnalytics } from "../web/lib/posthog.js";

function setHostname(hostname: string): void {
  vi.stubGlobal("window", { location: { hostname } });
}

describe("shouldTrackAnalytics", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not track outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    setHostname("www.polyagent.pro");

    expect(shouldTrackAnalytics()).toBe(false);
  });

  it.each(["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"])(
    "does not track without %s",
    (variable) => {
      vi.stubEnv(variable, "");
      setHostname("www.polyagent.pro");

      expect(shouldTrackAnalytics()).toBe(false);
    },
  );

  it.each(["polyagent.pro", "www.polyagent.pro"])(
    "tracks on the production host %s",
    (hostname) => {
      setHostname(hostname);

      expect(shouldTrackAnalytics()).toBe(true);
    },
  );

  it.each([
    "localhost",
    "polyagent.vercel.app",
    "staging.polyagent.pro",
    "www.polyagent.pro.example.com",
  ])("does not track on unapproved host %s", (hostname) => {
    setHostname(hostname);

    expect(shouldTrackAnalytics()).toBe(false);
  });
});
