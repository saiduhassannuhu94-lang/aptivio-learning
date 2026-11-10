import type { Metadata } from "next";
import { AuthForm } from "@/app/(auth)/auth-form";
import { signUpAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Create your account",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <AuthForm
        mode="sign-up"
        action={signUpAction}
        initialState={{ error: null, message: null }}
      />
    </main>
  );
}
