import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { GET } from "./route";

function request(url: string) {
  return new Request(url) as NextRequest;
}

function mockCodeExchange(error: { message: string } | null = null) {
  const exchangeCodeForSession = vi.fn().mockResolvedValue({ error });
  createClientMock.mockResolvedValue({
    auth: { exchangeCodeForSession },
  });

  return exchangeCodeForSession;
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a missing code before creating a Supabase client", async () => {
    await expect(
      GET(request("https://aptivio.test/auth/callback?next=%2Fdashboard")),
    ).rejects.toThrow("NEXT_REDIRECT:/sign-in?error=callback");

    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("uses a generic sign-in redirect when the code is invalid or expired", async () => {
    const exchangeCodeForSession = mockCodeExchange({
      message: "provider-specific invalid or expired code detail",
    });

    await expect(
      GET(request("https://aptivio.test/auth/callback?code=invalid-code")),
    ).rejects.toThrow("NEXT_REDIRECT:/sign-in?error=callback");

    expect(exchangeCodeForSession).toHaveBeenCalledWith("invalid-code");
    expect(redirectMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/sign-in?error=callback");
  });

  it("exchanges a valid code before redirecting to the safe internal path", async () => {
    const exchangeCodeForSession = mockCodeExchange();

    await expect(
      GET(
        request(
          "https://aptivio.test/auth/callback?code=valid-code&next=%2Fdashboard%3Ftab%3Dcourses",
        ),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard?tab=courses");

    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard?tab=courses");
  });

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "/%5Cattacker.example",
  ])("falls back to the dashboard for unsafe next target %s", async (next) => {
    const exchangeCodeForSession = mockCodeExchange();
    const url = new URL("https://aptivio.test/auth/callback");
    url.searchParams.set("code", "valid-code");
    url.searchParams.set("next", next);

    await expect(GET(request(url.toString()))).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
