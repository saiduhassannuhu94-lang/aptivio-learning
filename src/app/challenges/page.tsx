import Link from "next/link";
import { createChallengeAdmin } from "@/lib/challenges/admin";
import { SiteHeader } from "@/app/site-header";

export const dynamic = "force-dynamic";

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
  let data: Array<{id:string;slug:string;title:string;category:string;difficulty:string;summary:string;duration_seconds:number;max_attempts:number|null}> | null = null;
  let unavailable = false;
  try {
    const admin = createChallengeAdmin();
    const response = await admin
      .from("brain_challenges")
      .select("id, slug, title, category, difficulty, summary, duration_seconds, max_attempts")
      .eq("is_published", true)
      .order("category", { ascending: true })
      .order("title", { ascending: true });
    if (response.error) unavailable = true;
    else data = response.data;
  } catch {
    unavailable = true;
  }

  const challenges = data ?? [];

  return (
    <main className="challenge-page">
      <SiteHeader current="think" />
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
        {unavailable ? (
          <div className="challenge-empty" role="status"><h2>Brain challenges are temporarily unavailable.</h2><p>Your learning library is still available. Please try the Think Lab again shortly.</p><Link className="aptivio-action" href="/courses">Continue learning <span>→</span></Link></div>
        ) : challenges.length === 0 ? (
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
