import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createChallengeAdmin } from "@/lib/challenges/admin";
import { learningPackages } from "@/lib/learning/library";

export const dynamic = "force-dynamic";

export const metadata = { title: "My progress", robots: { index: false, follow: false } };

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) redirect("/sign-in");

  const { data: learningProgress, error: learningProgressError } = await supabase
    .from("learning_library_progress")
    .select("learning_path_slug, lesson_number, completed_at")
    .eq("user_id", auth.user.id);
  if (learningProgressError) throw new Error("Your learning progress could not be loaded.");

  const completedByPath = new Map<string, number>();
  for (const item of learningProgress ?? []) {
    completedByPath.set(item.learning_path_slug, (completedByPath.get(item.learning_path_slug) ?? 0) + 1);
  }
  const startedPaths = learningPackages.filter((item) => (completedByPath.get(item.course.slug) ?? 0) > 0);

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
          <div><strong>{learningProgress?.length ?? 0}</strong><span>Lessons completed</span></div>
          <div><strong>{completed.length}</strong><span>Completed challenges</span></div>
          <div><strong>{average}%</strong><span>Average challenge score</span></div>
        </div>
        <div className="learning-progress-history">
          <h2>Learning path progress</h2>
          {!startedPaths.length ? (
            <div className="challenge-empty"><h3>Your learning progress starts with one lesson.</h3><p>Open a learning path, work through a lesson and mark it complete after you can explain the key ideas.</p><Link className="button button-primary" href="/courses">Explore learning paths ↗</Link></div>
          ) : (
            <div className="learning-path-progress-list">
              {startedPaths.map((item) => {
                const count = completedByPath.get(item.course.slug) ?? 0;
                const total = item.sections.reduce((sum, section) => sum + section.lessons.length, 0);
                return (
                  <article className="learning-path-progress-row" key={item.course.slug}>
                    <div className="learning-path-progress-heading"><div><strong>{item.course.title}</strong><span>{count} of {total} lessons completed</span></div><b>{Math.round((count / total) * 100)}%</b></div>
                    <div className="learning-path-progress-track"><span style={{ width: String(Math.round((count / total) * 100)) + "%" }} /></div>
                    <Link href={"/learn/" + item.course.slug}>Continue learning ↗</Link>
                  </article>
                );
              })}
            </div>
          )}
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
