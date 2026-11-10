import type { Metadata } from "next";
import { AuthForm } from "@/app/(auth)/auth-form";
import { updatePasswordAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default function UpdatePasswordPage() {
  return (
    <main className="auth-page">
      <AuthForm
        mode="update-password"
        action={updatePasswordAction}
        initialState={{ error: null, message: null }}
      />
    </main>
  );
}
