import type { Metadata } from "next";
import { AuthForm } from "@/app/(auth)/auth-form";
import { requestPasswordResetAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <AuthForm
        mode="forgot-password"
        action={requestPasswordResetAction}
        initialState={{ error: null, message: null }}
      />
    </main>
  );
}
