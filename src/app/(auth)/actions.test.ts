import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, redirectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/supabase/env", () => ({
  getSiteUrl: () => "https://aptivio-preview.example",
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import {
  requestPasswordResetAction,
  signInAction,
  signOutAction,
  signUpAction,
  updatePasswordAction,
} from "./actions";

const previousState = { error: null, message: null };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function makeClient(overrides?: {
  signInError?: { message: string } | null;
  signUpError?: { message: string; name?: string; code?: string; status?: number } | null;
  signUpSession?: unknown;
  resetError?: { message: string } | null;
  claims?: { claims?: { sub?: string } } | null;
  claimsError?: { message: string } | null;
  updateError?: { message: string } | null;
  signOutError?: { message: string } | null;
}) {
  const auth = {
    signInWithPassword: vi.fn().mockResolvedValue({ error: overrides?.signInError ?? null }),
    signUp: vi.fn().mockResolvedValue({
      data: { session: overrides?.signUpSession ?? null },
      error: overrides?.signUpError ?? null,
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: overrides?.resetError ?? null }),
    getClaims: vi.fn().mockResolvedValue({
      data: overrides?.claims === undefined ? { claims: { sub: "learner-1" } } : overrides.claims,
      error: overrides?.claimsError ?? null,
    }),
    updateUser: vi.fn().mockResolvedValue({ error: overrides?.updateError ?? null }),
    signOut: vi.fn().mockResolvedValue({ error: overrides?.signOutError ?? null }),
  };
  return { auth, client: { auth } };
}

describe("authentication server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects malformed sign-in input before creating a Supabase client", async () => {
    const result = await signInAction(previousState, form({ email: "not-an-email", password: "short" }));
    expect(result.error).toBeTruthy();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("signs in and redirects to the learner dashboard", async () => {
    const supabase = makeClient();
    createClientMock.mockResolvedValue(supabase.client);

    await expect(signInAction(previousState, form({
      email: "learner@example.com",
      password: "correct-horse-battery",
    }))).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "learner@example.com",
      password: "correct-horse-battery",
    });
  });

  it("returns a generic sign-in error when credentials are rejected", async () => {
    const supabase = makeClient({ signInError: { message: "invalid credentials" } });
    createClientMock.mockResolvedValue(supabase.client);

    const result = await signInAction(previousState, form({
      email: "learner@example.com",
      password: "wrong-password",
    }));

    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain("invalid credentials");
  });

  it("sends sign-up verification to the internal callback", async () => {
    const supabase = makeClient();
    createClientMock.mockResolvedValue(supabase.client);

    const result = await signUpAction(previousState, form({
      displayName: "Learner One",
      email: "learner@example.com",
      password: "correct-horse-battery",
    }));

    expect(result.message).toContain("Check your email");
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "learner@example.com",
      password: "correct-horse-battery",
      options: {
        data: { display_name: "Learner One" },
        emailRedirectTo: "https://aptivio-preview.example/auth/callback?next=/dashboard",
      },
    });
  });


  it("returns a useful rate-limit message without exposing provider details", async () => {
    const supabase = makeClient({
      signUpError: { message: "provider detail", name: "AuthApiError", status: 429 },
    });
    createClientMock.mockResolvedValue(supabase.client);

    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await signUpAction(previousState, form({
      displayName: "Learner One",
      email: "learner@example.com",
      password: "correct-horse-battery",
    }));

    expect(result.error).toContain("wait");
    expect(result.error).not.toContain("provider detail");
    log.mockRestore();
  });

  it("handles a signup transport failure without exposing the thrown message", async () => {
    createClientMock.mockRejectedValue(new Error("internal network detail"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await signUpAction(previousState, form({
      displayName: "Learner One",
      email: "learner@example.com",
      password: "correct-horse-battery",
    }));

    expect(result.error).toContain("registration service");
    expect(result.error).not.toContain("internal network detail");
    log.mockRestore();
  });

  it("redirects immediately when Supabase returns a sign-up session", async () => {
    const supabase = makeClient({ signUpSession: { access_token: "session" } });
    createClientMock.mockResolvedValue(supabase.client);

    await expect(signUpAction(previousState, form({
      displayName: "Learner One",
      email: "learner@example.com",
      password: "correct-horse-battery",
    }))).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("requests password reset with a safe internal callback path", async () => {
    const supabase = makeClient();
    createClientMock.mockResolvedValue(supabase.client);

    const result = await requestPasswordResetAction(previousState, form({
      email: "learner@example.com",
    }));

    expect(result.message).toContain("If an account exists");
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "learner@example.com",
      { redirectTo: "https://aptivio-preview.example/auth/callback?next=/update-password" },
    );
  });

  it("does not reveal whether an email address has an account", async () => {
    const supabase = makeClient({ resetError: { message: "provider detail" } });
    createClientMock.mockResolvedValue(supabase.client);

    const result = await requestPasswordResetAction(previousState, form({
      email: "learner@example.com",
    }));

    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain("provider detail");
  });

  it("refuses password changes without a valid reset session", async () => {
    const supabase = makeClient({ claims: null });
    createClientMock.mockResolvedValue(supabase.client);

    const result = await updatePasswordAction(previousState, form({
      password: "new-password-123",
      confirmPassword: "new-password-123",
    }));

    expect(result.error).toContain("expired");
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("updates the password and redirects only after a valid reset session", async () => {
    const supabase = makeClient();
    createClientMock.mockResolvedValue(supabase.client);

    await expect(updatePasswordAction(previousState, form({
      password: "new-password-123",
      confirmPassword: "new-password-123",
    }))).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "new-password-123" });
  });

  it("rejects mismatched password confirmation", async () => {
    const result = await updatePasswordAction(previousState, form({
      password: "new-password-123",
      confirmPassword: "different-password",
    }));

    expect(result.error).toContain("do not match");
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("signs out and redirects home", async () => {
    const supabase = makeClient();
    createClientMock.mockResolvedValue(supabase.client);

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT:/");

    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });
});
