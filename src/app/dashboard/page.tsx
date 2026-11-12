import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/(auth)/actions";

export const metadata = {
  title: "Your learning dashboard",
  robots: { index: false, follow: false },
};

type DashboardPageProps = {
  searchParams: Promise<{ payment?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const query = await searchParams;
  const paymentNotices: Record<string, string> = {
    success: "Payment verified. Your course access is ready.",
    pending: "Your payment is still being confirmed. Do not pay again while verification is pending.",
    failed: "The payment provider did not confirm a successful charge. You can return to the course and try again.",
    "verification-needed": "We could not confirm the payment yet. Your access has not been granted. Contact support with your payment reference.",
    invalid: "The payment return link was invalid. Check your payment history before trying again.",
    "not-found": "We could not find a payment linked to this account.",
  };
  const paymentNotice = query.payment ? paymentNotices[query.payment] : undefined;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const subject = claimsData?.claims?.sub;

  if (claimsError || typeof subject !== "string") {
    redirect("/sign-in");
  }

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser();

  if (authUserError || !authUserData.user || authUserData.user.id !== subject) {
    redirect("/sign-in");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", subject)
    .maybeSingle();

  if (profileError) {
    throw new Error("We could not load your learner profile. Please refresh the page.");
  }

  if (!profile) {
    const { error: createProfileError } = await supabase
      .from("profiles")
      .insert({
        id: subject,
        display_name:
          typeof authUserData.user.user_metadata.display_name === "string"
            ? authUserData.user.user_metadata.display_name.slice(0, 100)
            : "",
      });

    if (createProfileError && createProfileError.code !== "23505") {
      throw new Error("We could not create your learner profile. Please try again.");
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>APTIVIO</span>
        </Link>
        <form action={signOutAction}>
          <button className="dashboard-signout" type="submit">Sign out</button>
        </form>
      </header>

      <section className="dashboard-content">
        <span className="eyebrow">YOUR LEARNING SPACE</span>
        <h1>Welcome to your next chapter.</h1>
        {paymentNotice && <p className="payment-notice" role="status">{paymentNotice}</p>}
        <p className="dashboard-intro">
          Your account is ready. Explore the learning library, take reasoning challenges and review your progress whenever you return.
        </p>

        <div className="dashboard-empty">
          <span className="dashboard-empty-mark">A</span>
          <h2>What would you like to do today?</h2>
          <p>Learn something useful, test your reasoning or see how your skills are developing.</p>
          <div className="dashboard-actions">
            <Link className="button button-primary" href="/courses">Explore learning <span aria-hidden="true">↗</span></Link>
            <Link className="button button-dark" href="/challenges">Take a challenge <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" href="/progress">View my progress →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
