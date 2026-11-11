import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./dashboard-shell";

export const metadata = {
  title: "Your learning dashboard",
  robots: { index: false, follow: false },
};

type DashboardPageProps = {
  searchParams: Promise<{ payment?: string }>;
};

const paymentNotices: Record<string, string> = {
  success: "Payment verified. Your course access is ready.",
  pending: "Your payment is still being confirmed. Do not pay again while verification is pending.",
  failed: "The payment provider did not confirm a successful charge. You can return to the course and try again.",
  "verification-needed": "We could not confirm the payment yet. Your access has not been granted. Contact support with your payment reference.",
  invalid: "The payment return link was invalid. Check your payment history before trying again.",
  "not-found": "We could not find a payment linked to this account.",
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const query = await searchParams;
  const paymentNotice = query.payment ? paymentNotices[query.payment] : undefined;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const subject = claimsData?.claims?.sub;

  if (claimsError || typeof subject !== "string") redirect("/sign-in");

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
  if (authUserError || !authUserData.user || authUserData.user.id !== subject) redirect("/sign-in");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("display_name").eq("id", subject).maybeSingle();

  if (profileError) throw new Error("We could not load your learner profile. Please refresh the page.");

  if (!profile) {
    const { error: createProfileError } = await supabase.from("profiles").insert({
      id: subject,
      display_name: typeof authUserData.user.user_metadata.display_name === "string"
        ? authUserData.user.user_metadata.display_name.slice(0, 100) : "",
    });
    if (createProfileError && createProfileError.code !== "23505") {
      throw new Error("We could not create your learner profile. Please try again.");
    }
  }

  const displayName = profile?.display_name ||
    (typeof authUserData.user.user_metadata.display_name === "string"
      ? authUserData.user.user_metadata.display_name : "");

  return <DashboardShell displayName={displayName} paymentNotice={paymentNotice} />;
}
