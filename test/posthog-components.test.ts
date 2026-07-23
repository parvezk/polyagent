import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  capture: vi.fn(),
  createClient: vi.fn(),
  getClaims: vi.fn(),
  identify: vi.fn(),
  pathname: "/sessions",
  query: "",
  searchParams: {
    toString: vi.fn(),
  },
  shouldTrackAnalytics: vi.fn(),
  useEffect: vi.fn(),
}));

vi.mock("react", () => ({
  useEffect: dependencies.useEffect,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => dependencies.pathname,
  useSearchParams: () => dependencies.searchParams,
}));

vi.mock("posthog-js", () => ({
  default: {
    capture: dependencies.capture,
    identify: dependencies.identify,
  },
}));

vi.mock("@/lib/posthog", () => ({
  shouldTrackAnalytics: dependencies.shouldTrackAnalytics,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: dependencies.createClient,
}));

import { PostHogIdentify } from "../web/components/posthog-identify";
import { PostHogPageView } from "../web/components/posthog-pageview";

describe("PostHog analytics components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.pathname = "/sessions";
    dependencies.query = "";
    dependencies.searchParams.toString.mockImplementation(() => dependencies.query);
    dependencies.shouldTrackAnalytics.mockReturnValue(true);
    dependencies.useEffect.mockImplementation((effect: () => void) => effect());
    dependencies.createClient.mockReturnValue({
      auth: { getClaims: dependencies.getClaims },
    });
  });

  describe("PostHogPageView", () => {
    it.each([
      { query: "", currentUrl: "/sessions" },
      {
        query: "status=running&page=2",
        currentUrl: "/sessions?status=running&page=2",
      },
    ])("captures a pageview for $currentUrl", ({ query, currentUrl }) => {
      dependencies.query = query;

      PostHogPageView();

      expect(dependencies.capture).toHaveBeenCalledOnce();
      expect(dependencies.capture).toHaveBeenCalledWith("$pageview", {
        $current_url: currentUrl,
      });
    });

    it("does not capture a pageview when analytics is disabled", () => {
      dependencies.shouldTrackAnalytics.mockReturnValue(false);

      PostHogPageView();

      expect(dependencies.capture).not.toHaveBeenCalled();
    });

    it("captures a new pageview when the pathname changes", () => {
      let initialized = false;
      let previousDependencies: readonly unknown[] | undefined;
      dependencies.useEffect.mockImplementation(
        (effect: () => void, effectDependencies?: readonly unknown[]) => {
          const previous = previousDependencies;
          const dependenciesChanged =
            !initialized ||
            effectDependencies === undefined ||
            previous === undefined ||
            effectDependencies.length !== previous.length ||
            effectDependencies.some(
              (dependency, index) => !Object.is(dependency, previous[index]),
            );

          initialized = true;
          previousDependencies = effectDependencies;
          if (dependenciesChanged) effect();
        },
      );

      PostHogPageView();
      dependencies.pathname = "/settings";
      PostHogPageView();

      expect(dependencies.capture).toHaveBeenCalledTimes(2);
      expect(dependencies.capture).toHaveBeenNthCalledWith(1, "$pageview", {
        $current_url: "/sessions",
      });
      expect(dependencies.capture).toHaveBeenNthCalledWith(2, "$pageview", {
        $current_url: "/settings",
      });
    });
  });

  describe("PostHogIdentify", () => {
    it("identifies the authenticated user from Supabase claims", async () => {
      dependencies.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-42",
            email: "person@example.com",
          },
        },
      });

      PostHogIdentify();

      await vi.waitFor(() => {
        expect(dependencies.identify).toHaveBeenCalledOnce();
      });
      expect(dependencies.identify).toHaveBeenCalledWith("user-42", {
        email: "person@example.com",
      });
    });

    it("does not identify claims without a subject", async () => {
      dependencies.getClaims.mockResolvedValue({
        data: {
          claims: {
            email: "person@example.com",
          },
        },
      });

      PostHogIdentify();
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(dependencies.getClaims).toHaveBeenCalledOnce();
      expect(dependencies.identify).not.toHaveBeenCalled();
    });

    it("does not read auth claims when analytics is disabled", () => {
      dependencies.shouldTrackAnalytics.mockReturnValue(false);

      PostHogIdentify();

      expect(dependencies.createClient).not.toHaveBeenCalled();
      expect(dependencies.getClaims).not.toHaveBeenCalled();
      expect(dependencies.identify).not.toHaveBeenCalled();
    });
  });
});
