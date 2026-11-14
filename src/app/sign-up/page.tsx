import type { Metadata } from "next";
import { AuthForm } from "@/app/(auth)/auth-form";
import { signUpAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Create your account",
  robots: { index: false, follow: false },
};

type SignUpPageProps = { searchParams: Promise<{ error?: string }> };

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const query = await searchParams;
  const googleError = query.error === "google"
    ? "Google sign-up is not enabled for this project yet. Use your email and password for now."
    : null;
  return (
    <main className="auth-page">
      <AuthForm
        mode="sign-up"
        action={signUpAction}
        initialState={{ error: null, message: null }}
        googleError={googleError}
      />
    </main>
  );
}
