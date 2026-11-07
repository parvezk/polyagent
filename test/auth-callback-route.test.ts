import { beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: fakes.createClient,
}));

import { GET, safePostAuthRedirect } from "../web/app/auth/callback/route";

const ORIGIN = "https://app.example.com";

function callbackRequest(query: string): Request {
  return new Request(`${ORIGIN}/auth/callback?${query}`);
}

describe("safePostAuthRedirect", () => {
  it("defaults to the site root", () => {
    expect(safePostAuthRedirect(ORIGIN, null)).toBe(`${ORIGIN}/`);
  });

  it("allows same-origin relative paths with query/hash", () => {
    expect(safePostAuthRedirect(ORIGIN, "/dashboard")).toBe(`${ORIGIN}/dashboard`);
    expect(safePostAuthRedirect(ORIGIN, "/sessions?tab=running")).toBe(
      `${ORIGIN}/sessions?tab=running`,
    );
    expect(safePostAuthRedirect(ORIGIN, "/x#y")).toBe(`${ORIGIN}/x#y`);
  });

  it("blocks userinfo open redirects via string concatenation (@host)", () => {
    expect(safePostAuthRedirect(ORIGIN, "@evil.com")).toBe(`${ORIGIN}/`);
    expect(safePostAuthRedirect(ORIGIN, "@evil.com/phish")).toBe(`${ORIGIN}/`);
  });

  it("blocks protocol-relative and absolute URLs", () => {
    expect(safePostAuthRedirect(ORIGIN, "//evil.com")).toBe(`${ORIGIN}/`);
    expect(safePostAuthRedirect(ORIGIN, "https://evil.com")).toBe(`${ORIGIN}/`);
    expect(safePostAuthRedirect(ORIGIN, "http://evil.com/x")).toBe(`${ORIGIN}/`);
  });

  it("blocks backslash tricks that URL resolution treats as authority", () => {
    expect(safePostAuthRedirect(ORIGIN, "/\\evil.com")).toBe(`${ORIGIN}/`);
    expect(safePostAuthRedirect(ORIGIN, "/\\\\evil.com")).toBe(`${ORIGIN}/`);
  });
});

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fakes.createClient.mockResolvedValue({
      auth: { exchangeCodeForSession: fakes.exchangeCodeForSession },
    });
    fakes.exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it("redirects to a safe relative next after exchanging the code", async () => {
    const response = await GET(callbackRequest("code=abc&next=/dashboard"));

    expect(fakes.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(`${ORIGIN}/dashboard`);
  });

  it("does not open-redirect to an attacker host via next=@evil.com", async () => {
    const response = await GET(callbackRequest("code=abc&next=@evil.com"));

    expect(fakes.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(`${ORIGIN}/`);
    expect(response.headers.get("Location")).not.toContain("evil.com");
  });

  it("does not open-redirect via protocol-relative next", async () => {
    const response = await GET(callbackRequest("code=abc&next=//evil.com"));

    expect(response.headers.get("Location")).toBe(`${ORIGIN}/`);
  });

  it("sends auth failures to login", async () => {
    fakes.exchangeCodeForSession.mockResolvedValue({ error: { message: "bad code" } });

    const response = await GET(callbackRequest("code=bad&next=@evil.com"));

    expect(response.headers.get("Location")).toBe(`${ORIGIN}/login?error=auth`);
  });

  it("sends missing codes to login without exchanging", async () => {
    const response = await GET(callbackRequest("next=/dashboard"));

    expect(fakes.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("Location")).toBe(`${ORIGIN}/login?error=auth`);
  });
});
