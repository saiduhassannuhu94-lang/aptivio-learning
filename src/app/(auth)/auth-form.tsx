"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resendSignupConfirmationAction, signInWithGoogleAction, type AuthActionState } from "./actions";
import { ThemeToggle } from "@/app/theme-toggle";

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "update-password";
type AuthAction = (
  previousState: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

interface AuthFormProps {
  mode: AuthMode;
  action: AuthAction;
  initialState: AuthActionState;
  googleError?: string | null;
}

const copy: Record<AuthMode, { title: string; description: string; submit: string }> = {
  "sign-in": {
    title: "Welcome back.",
    description: "Sign in to continue learning and keep your progress moving.",
    submit: "Sign in",
  },
  "sign-up": {
    title: "Start your next chapter.",
    description: "Create your learner account and build skills with direction.",
    submit: "Create account",
  },
  "forgot-password": {
    title: "Reset your password.",
    description: "We will send a secure link if an account matches that email.",
    submit: "Send reset link",
  },
  "update-password": {
    title: "Choose a new password.",
    description: "Use a strong password you have not used elsewhere.",
    submit: "Update password",
  },
};

export function AuthForm({ mode, action, initialState, googleError }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendSignupConfirmationAction,
    initialState,
  );
  const content = copy[mode];
  const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-topline">
        <Link className="brand auth-brand" href="/" aria-label="APTIVIO home">
          <span className="brand-mark">A</span>
          <span>APTIVIO</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="auth-heading">
        <span className="eyebrow">YOUR LEARNING JOURNEY</span>
        <h1 id="auth-title">{content.title}</h1>
        <p>{content.description}</p>
      </div>

      <form action={formAction} className="auth-form">
        {mode === "sign-up" && (
          <label className="auth-field">
            <span>Full name</span>
            <input
              name="displayName"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              placeholder="Your name"
              required
            />
          </label>
        )}

        {(mode === "sign-in" || mode === "sign-up" || mode === "forgot-password") && (
          <label className="auth-field">
            <span>Email address</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="you@example.com"
              required
            />
          </label>
        )}

        {(mode === "sign-in" || mode === "sign-up" || mode === "update-password") && (
          <label className="auth-field">
            <span>{mode === "update-password" ? "New password" : "Password"}</span>
            <input
              name="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={8}
              maxLength={128}
              placeholder="At least 8 characters"
              required
            />
          </label>
        )}

        {mode === "update-password" && (
          <label className="auth-field">
            <span>Confirm new password</span>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              placeholder="Enter the password again"
              required
            />
          </label>
        )}

        {mode === "sign-in" && (
          <div className="auth-inline-link">
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
        )}

        {state.error && <p className="auth-feedback auth-error" role="alert">{state.error}</p>}
        {state.message && <p className="auth-feedback auth-success" role="status">{state.message}</p>}

        <button className="button button-primary auth-submit" type="submit" disabled={pending}>
          {pending ? "Please wait…" : content.submit}
          <span aria-hidden="true">↗</span>
        </button>
      </form>

      {mode === "sign-in" && (
        <details className="auth-resend">
          <summary>Didn&apos;t receive your verification email?</summary>
          <div className="auth-resend-content">
            <p>Enter the email address you used to register. We&apos;ll request a fresh confirmation link.</p>
            <form action={resendFormAction} className="auth-resend-form">
              <label className="auth-field">
                <span>Account email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  placeholder="you@example.com"
                  required
                />
              </label>
              {resendState.error && <p className="auth-feedback auth-error" role="alert">{resendState.error}</p>}
              {resendState.message && <p className="auth-feedback auth-success" role="status">{resendState.message}</p>}
              <button className="button button-outline auth-resend-submit" type="submit" disabled={resendPending}>
                {resendPending ? "Sending…" : "Resend confirmation email"}
              </button>
            </form>
          </div>
        </details>
      )}

      {(mode === "sign-in" || mode === "sign-up") && (
        googleAuthEnabled ? (
          <>
            <div className="auth-divider"><span>OR</span></div>
            {googleError && <p className="auth-feedback auth-error" role="alert">{googleError}</p>}
            <form action={signInWithGoogleAction} className="auth-google-form">
              <button className="button button-outline auth-google-button" type="submit">
                <span className="google-mark" aria-hidden="true">G</span>
                Continue with Google
              </button>
            </form>
          </>
        ) : (
          <p className="auth-google-note" role="note">
            Google sign-in is not enabled yet. Use your email and password to access APTIVIO.
          </p>
        )
      )}

      {mode === "sign-in" && (
        <p className="auth-switch">New to APTIVIO? <Link href="/sign-up">Create an account</Link></p>
      )}
      {mode === "sign-up" && (
        <p className="auth-switch">Already have an account? <Link href="/sign-in">Sign in</Link></p>
      )}
      {mode === "forgot-password" && (
        <p className="auth-switch"><Link href="/sign-in">Return to sign in</Link></p>
      )}
      {mode === "update-password" && (
        <p className="auth-switch"><Link href="/sign-in">Return to sign in</Link></p>
      )}

      <p className="auth-legal">
        Keep your password private. APTIVIO will never ask you to send it by email or message.
      </p>
    </section>
  );
}
