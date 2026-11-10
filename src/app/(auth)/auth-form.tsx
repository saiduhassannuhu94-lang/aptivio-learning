"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthActionState } from "./actions";

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "update-password";
type AuthAction = (
  previousState: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

interface AuthFormProps {
  mode: AuthMode;
  action: AuthAction;
  initialState: AuthActionState;
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

export function AuthForm({ mode, action, initialState }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const content = copy[mode];

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <Link className="brand auth-brand" href="/" aria-label="APTIVIO home">
        <span className="brand-mark">A</span>
        <span>APTIVIO</span>
      </Link>

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
        By continuing, you agree to use APTIVIO responsibly and in accordance with our terms and privacy policy.
      </p>
    </section>
  );
}
