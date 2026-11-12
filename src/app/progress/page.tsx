import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createChallengeAdmin } from "@/lib/challenges/admin";

export const metadata = { title: "My progress", robots: { index: false, follow: false } };

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) redirect("/sign-in");

  const admin = createChallengeAdmin();
  const { data: attempts, error: attemptsError } = await admin
    .from("brain_challenge_attempts")
    .select("id, challenge_id, attempt_number, status, submitted_at, elapsed_seconds, score, max_score, percentage")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (attemptsError) throw new Error("Your progress could not be loaded.");

  const challengeIds = [...new Set((attempts ?? []).map((item) => item.challenge_id))];
  const { data: challenges } = challengeIds.length
    ? await admin.from("brain_challenges").select("id, title, category, slug").in("id", challengeIds)
    : { data: [] };
  const names = new Map((challenges ?? []).map((item) => [item.id, item]));

  const completed = (attempts ?? []).filter((item) => item.status === "submitted");
  const average = completed.length
    ? Math.round(completed.reduce((sum, item) => sum + Number(item.percentage ?? 0), 0) / completed.length)
    : 0;

  return (
    <main className="challenge-page">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
        <nav className="challenge-nav"><Link href="/courses">Learn</Link><Link href="/challenges">Challenges</Link><Link href="/dashboard">Account</Link></nav>
      </header>
      <section className="progress-content">
        <span className="eyebrow">YOUR THINKING JOURNEY</span>
        <h1>Progress you can <em>actually see.</em></h1>
        <p>Review your challenge attempts and notice which skills are improving. These scores describe your performance on APTIVIO practice questions.</p>
        <div className="progress-stats">
          <div><strong>{completed.length}</strong><span>Completed challenges</span></div>
          <div><strong>{average}%</strong><span>Average score</span></div>
          <div><strong>{attempts?.length ?? 0}</strong><span>Total attempts</span></div>
        </div>
        <div className="progress-history">
          <h2>Attempt history</h2>
          {!attempts?.length ? (
            <div className="challenge-empty"><h3>Your first challenge is waiting.</h3><p>Take a reasoning challenge to start building your progress history.</p><Link className="button button-primary" href="/challenges">Explore challenges ↗</Link></div>
          ) : (
            <div className="history-list">
              {attempts.map((item) => {
                const challenge = names.get(item.challenge_id);
                return (
                  <article className="history-row" key={item.id}>
                    <div><strong>{challenge?.title ?? "APTIVIO challenge"}</strong><span>{challenge?.category ?? "Reasoning"} · Attempt {item.attempt_number}</span></div>
                    <div className="history-score">{item.status === "submitted" ? `${Number(item.percentage).toFixed(0)}%` : item.status === "in_progress" ? "In progress" : "Expired"}</div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        <p className="challenge-disclaimer">APTIVIO practice scores are not standardised IQ scores and should not be used for clinical or educational diagnosis.</p>
      </section>
    </main>
  );
}
