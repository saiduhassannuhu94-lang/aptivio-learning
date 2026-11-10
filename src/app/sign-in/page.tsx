import type { Metadata } from "next";
import { AuthForm } from "@/app/(auth)/auth-form";
import { signInAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="auth-page">
      <AuthForm
        mode="sign-in"
        action={signInAction}
        initialState={{ error: null, message: null }}
      />
    </main>
  );
}
