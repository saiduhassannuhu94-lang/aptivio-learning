"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";

export interface AuthActionState {
  error: string | null;
  message: string | null;
}

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

const signUpSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2).max(100),
});

export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    redirect("/sign-in?error=google_oauth");
  }

  redirect(data.url);
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and a password of at least 8 characters.", message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "We could not sign you in with those details. Check them and try again.", message: null };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter your name, a valid email, and a password with at least 8 characters.", message: null };
  }

  let hasSession = false;
  let authFailure: { name: string; code: string | null; status: number | null } | null = null;

  try {
    const siteUrl = getSiteUrl();
    const callbackUrl = new URL("/auth/callback", `${siteUrl}/`);
    callbackUrl.searchParams.set("next", "/dashboard");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      authFailure = {
        name: error.name,
        code: error.code ?? null,
        status: error.status ?? null,
      };
    } else {
      hasSession = Boolean(data.session);
    }
  } catch (cause) {
    console.error("[auth.signUp] Registration failed before Supabase returned a response", {
      name: cause instanceof Error ? cause.name : "UnknownError",
      message: cause instanceof Error ? cause.message : "Unknown registration failure",
    });

    return {
      error: "We could not reach the registration service. Please try again. If this continues, contact APTIVIO support.",
      message: null,
    };
  }

  if (authFailure) {
    console.error("[auth.signUp] Supabase Auth rejected the registration request", authFailure);

    if (authFailure.status === 429) {
      return {
        error: "Too many registration attempts. Please wait a little and try again.",
        message: null,
      };
    }

    if (authFailure.code === "weak_password") {
      return {
        error: "Choose a stronger password and try again.",
        message: null,
      };
    }

    return {
      error: "We could not complete registration. Check your details and try again.",
      message: null,
    };
  }

  if (hasSession) {
    redirect("/dashboard");
  }

  return {
    error: null,
    message: "Your account request is ready. Check your email for the verification link to finish signing up.",
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = z.string().trim().email().max(254).safeParse(formData.get("email"));

  if (!email.success) {
    return { error: "Enter a valid email address.", message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { error: "We could not process that request right now. Please try again later.", message: null };
  }

  return {
    error: null,
    message: "If an account exists for that email, a password reset link will arrive shortly.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = formData.get("password");
  const confirmation = formData.get("confirmPassword");

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return { error: "Choose a password between 8 and 128 characters.", message: null };
  }

  if (password !== confirmation) {
    return { error: "The passwords do not match.", message: null };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || typeof claimsData?.claims?.sub !== "string") {
    return { error: "Your reset session is invalid or has expired. Request a new reset link.", message: null };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "We could not update your password. Request a new reset link and try again.", message: null };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
