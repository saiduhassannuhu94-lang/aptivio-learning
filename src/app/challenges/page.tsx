import Link from "next/link";
import { createChallengeAdmin } from "@/lib/challenges/admin";

export const metadata = {
  title: "Brain challenges",
  description: "Practise logical, numerical, verbal, spatial and memory reasoning with APTIVIO.",
};

const categoryNames: Record<string, string> = {
  logical: "Logical reasoning",
  numerical: "Numerical reasoning",
  verbal: "Verbal reasoning",
  spatial: "Spatial thinking",
  memory: "Memory & focus",
};

export default async function ChallengesPage() {
  const admin = createChallengeAdmin();
  const { data, error } = await admin
    .from("brain_challenges")
    .select("id, slug, title, category, difficulty, summary, duration_seconds, max_attempts")
    .eq("is_published", true)
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw new Error("The challenge library is temporarily unavailable.");

  const challenges = data ?? [];

  return (
    <main className="challenge-page">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
        <nav className="challenge-nav">
          <Link href="/courses">Learn</Link>
          <Link href="/progress">My progress</Link>
          <Link href="/dashboard">Account</Link>
        </nav>
      </header>
      <section className="challenge-hero">
        <span className="eyebrow">THINKING IS A SKILL</span>
        <h1>Give your mind<br /><em>a real workout.</em></h1>
        <p>Take short reasoning challenges, practise different ways of thinking and learn from your results. These are practice assessments, not clinical IQ tests.</p>
        <div className="challenge-hero-meta"><span>5 skill areas</span><span>Timed challenges</span><span>Personal results</span></div>
      </section>
      <section className="challenge-library">
        <div className="challenge-section-head">
          <div><span className="eyebrow">THE CHALLENGE LIBRARY</span><h2>Choose your challenge</h2></div>
          <p>Start with a skill you want to strengthen. You can review your score and explanations when you finish.</p>
        </div>
        {challenges.length === 0 ? (
          <div className="challenge-empty"><h2>Challenges are being prepared.</h2><p>Come back soon to test your reasoning skills.</p></div>
        ) : (
          <div className="challenge-grid">
            {challenges.map((challenge) => (
              <article className="challenge-card" key={challenge.id}>
                <div className="challenge-card-top"><span>{categoryNames[challenge.category] ?? challenge.category}</span><span className="challenge-spark">✳</span></div>
                <h3>{challenge.title}</h3>
                <p>{challenge.summary}</p>
                <div className="challenge-meta"><span>{challenge.difficulty}</span><span>{Math.ceil(challenge.duration_seconds / 60)} min</span><span>Practice</span></div>
                <Link className="challenge-card-link" href={`/challenges/${challenge.slug}`}>Open challenge <span aria-hidden="true">↗</span></Link>
              </article>
            ))}
          </div>
        )}
        <p className="challenge-disclaimer">APTIVIO scores show performance on these specific practice questions. They are not standardised IQ scores or a diagnosis of intelligence.</p>
      </section>
    </main>
  );
}
