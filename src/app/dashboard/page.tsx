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
  const paymentNotice = {
    success: "Payment verified. Your course access is ready.",
    pending: "Your payment is still being confirmed. Do not pay again while verification is pending.",
    "verification-needed": "We could not confirm the payment yet. Your access has not been granted. Contact support with your payment reference.",
    invalid: "The payment return link was invalid. Check your payment history before trying again.",
    "not-found": "We could not find a payment linked to this account.",
  }[query.payment ?? ""];
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
          Your account is ready. Your learning dashboard will grow here as you enrol in courses and make progress.
        </p>

        <div className="dashboard-empty">
          <span className="dashboard-empty-mark">A</span>
          <h2>Your learning journey starts here.</h2>
          <p>Explore the catalogue to find a course that matches the skills you want to build.</p>
          <Link className="button button-primary" href="/courses">
            Explore courses <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
