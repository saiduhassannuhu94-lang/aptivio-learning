"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthActionState } from "./actions";

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "update-password";
type AuthAction = (previousState: AuthActionState, formData: FormData) => Promise<AuthActionState>;

interface AuthFormProps {
  mode: AuthMode;
  action: AuthAction;
  initialState: AuthActionState;
}

const copy: Record<AuthMode, { title: string; description: string; submit: string; kicker: string }> = {
  "sign-in": {
    title: "Your next breakthrough starts here.",
    description: "Sign in to pick up where you left off, track your progress, and keep building practical skills.",
    submit: "Access my workspace",
    kicker: "LEARNER ACCESS",
  },
  "sign-up": {
    title: "Build skills. Build your future.",
    description: "Create your APTIVIO learner account and turn focused learning into measurable progress.",
    submit: "Create learner account",
    kicker: "NEW LEARNER REGISTRATION",
  },
  "forgot-password": {
    title: "Recover your access.",
    description: "Enter the email address linked to your account. We will send a secure reset link if it matches.",
    submit: "Send reset instructions",
    kicker: "ACCOUNT RECOVERY",
  },
  "update-password": {
    title: "Set a stronger password.",
    description: "Choose a new password to secure your learner workspace.",
    submit: "Save new password",
    kicker: "SECURITY UPDATE",
  },
};

export function AuthForm({ mode, action, initialState }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const content = copy[mode];

  return (
    <div className="auth-layout">
      <aside className="auth-showcase" aria-label="APTIVIO learning platform">
        <Link className="brand auth-brand" href="/" aria-label="APTIVIO home">
          <span className="brand-mark">A</span>
          <span>APTIVIO</span>
        </Link>
        <div className="auth-showcase-copy">
          <span className="auth-kicker"><i /> ENGINEERED FOR YOUR NEXT LEVEL</span>
          <h2>Learning is a system.<br /><em>Build yours.</em></h2>
          <p>Structured courses, clear milestones, and a workspace designed to help you move from theory to capability.</p>
        </div>
        <div className="auth-blueprint" aria-hidden="true">
          <div className="blueprint-top"><span>LEARNING SYSTEM / 01</span><span>APTIVIO®</span></div>
          <div className="blueprint-core"><span className="blueprint-ring ring-a" /><span className="blueprint-ring ring-b" /><span className="blueprint-node">A</span><i className="blueprint-cross cross-a" /><i className="blueprint-cross cross-b" /></div>
          <div className="blueprint-bottom"><span>01 — LEARN</span><span>02 — APPLY</span><span>03 — ADVANCE</span></div>
        </div>
        <div className="auth-showcase-foot"><span>DESIGNED FOR CONSISTENT PROGRESS</span><span>01 / 03</span></div>
      </aside>

      <div className="auth-main">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-mobile-brand">
            <Link className="brand" href="/" aria-label="APTIVIO home"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
            <span className="auth-mobile-index">LEARNER PORTAL / 2026</span>
          </div>
          <div className="auth-heading">
            <span className="auth-eyebrow">{content.kicker}</span>
            <h1 id="auth-title">{content.title}</h1>
            <p>{content.description}</p>
          </div>

          <form action={formAction} className="auth-form">
            {mode === "sign-up" && (
              <label className="auth-field">
                <span>FULL NAME</span>
                <input name="displayName" type="text" autoComplete="name" minLength={2} maxLength={100} placeholder="Enter your full name" required />
              </label>
            )}
            {(mode === "sign-in" || mode === "sign-up" || mode === "forgot-password") && (
              <label className="auth-field">
                <span>EMAIL ADDRESS</span>
                <input name="email" type="email" autoComplete="email" maxLength={254} placeholder="name@example.com" required />
              </label>
            )}
            {(mode === "sign-in" || mode === "sign-up" || mode === "update-password") && (
              <label className="auth-field">
                <span>{mode === "update-password" ? "NEW PASSWORD" : "PASSWORD"}</span>
                <input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} maxLength={128} placeholder="Minimum 8 characters" required />
              </label>
            )}
            {mode === "update-password" && (
              <label className="auth-field">
                <span>CONFIRM NEW PASSWORD</span>
                <input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} placeholder="Enter password again" required />
              </label>
            )}
            {mode === "sign-in" && <div className="auth-inline-link"><Link href="/forgot-password">Forgot password?</Link></div>}
            {state.error && <p className="auth-feedback auth-error" role="alert">{state.error}</p>}
            {state.message && <p className="auth-feedback auth-success" role="status">{state.message}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={pending}>
              <span>{pending ? "SECURELY PROCESSING…" : content.submit}</span><span aria-hidden="true">↗</span>
            </button>
          </form>

          {mode === "sign-in" && <p className="auth-switch">New to APTIVIO? <Link href="/sign-up">Create an account <span>↗</span></Link></p>}
          {mode === "sign-up" && <p className="auth-switch">Already registered? <Link href="/sign-in">Sign in <span>↗</span></Link></p>}
          {(mode === "forgot-password" || mode === "update-password") && <p className="auth-switch"><Link href="/sign-in">← Return to sign in</Link></p>}
          <div className="auth-security"><span className="auth-security-icon">⌑</span><p><strong>Private by design</strong><br />Your password stays yours. Never share it by email or message.</p><span className="auth-security-code">SECURE / 256</span></div>
        </section>
        <footer className="auth-main-footer"><span>© 2026 APTIVIO LEARNING</span><span>LEARN WITH INTENT. ADVANCE WITH PROOF.</span></footer>
      </div>
    </div>
  );
}
