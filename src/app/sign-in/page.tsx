import type { Metadata } from "next";
import { AuthForm } from "@/app/(auth)/auth-form";
import { signInAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type SignInPageProps = { searchParams: Promise<{ error?: string }> };

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  const googleError = query.error === "google"
    ? "Google sign-in could not start. The Google provider may need to be enabled in Supabase Auth."
    : null;
  return (
    <main className="auth-page">
      <AuthForm
        mode="sign-in"
        action={signInAction}
        initialState={{ error: null, message: null }}
        googleError={googleError}
      />
    </main>
  );
}
