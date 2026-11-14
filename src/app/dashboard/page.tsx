import Link from "next/link";
import { AptivioLogo } from "@/app/site-header";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/(auth)/actions";

export const metadata = { title: "Your learning dashboard", robots: { index: false, follow: false } };
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const subject = claimsData?.claims?.sub;
  if (claimsError || typeof subject !== "string") redirect("/sign-in");
  const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
  if (authUserError || !authUserData.user || authUserData.user.id !== subject) redirect("/sign-in");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("display_name").eq("id", subject).maybeSingle();
  if (profileError) throw new Error("We could not load your learner profile. Please refresh the page.");
  if (!profile) {
    const { error: createProfileError } = await supabase.from("profiles").insert({
      id: subject,
      display_name: typeof authUserData.user.user_metadata.display_name === "string" ? authUserData.user.user_metadata.display_name.slice(0, 100) : "",
    });
    if (createProfileError && createProfileError.code !== "23505") throw new Error("We could not create your learner profile. Please try again.");
  }
  const { count: lessonsCompleted, error: learningProgressError } = await supabase
    .from("learning_library_progress")
    .select("lesson_number", { count: "exact", head: true })
    .eq("user_id", subject);
  if (learningProgressError) throw new Error("We could not load your learning progress. Please refresh the page.");
  const displayName = profile?.display_name?.trim() || authUserData.user.user_metadata.display_name || "Learner";
  const firstName = String(displayName).split(" ")[0];

  return (
    <main className="learner-app">
      <aside className="learner-sidebar">
        <AptivioLogo compact />
        <span className="sidebar-caption">YOUR WORKSPACE</span>
        <nav className="sidebar-nav" aria-label="Learner navigation">
          <Link className="active" href="/dashboard"><span>▦</span> Overview</Link>
          <Link href="/courses"><span>⌘</span> Learning library</Link>
          <Link href="/challenges"><span>✳</span> Brain challenges</Link>
          <Link href="/progress"><span>↗</span> My progress</Link>
          <Link href="/portfolio"><span>▤</span> Portfolio</Link>
        </nav>
        <details className="learner-mobile-menu">
          <summary aria-label="Open dashboard menu"><span></span><span></span><span></span><b>Menu</b></summary>
          <nav aria-label="Mobile dashboard navigation">
            <Link href="/dashboard">Overview</Link><Link href="/courses">Learning library</Link><Link href="/challenges">Brain challenges</Link><Link href="/progress">My progress</Link><Link href="/portfolio">Portfolio</Link>
          </nav>
        </details>
        <div className="sidebar-help"><span>✦</span><b>Keep your curiosity alive.</b><p>Small steps, repeated often, build real understanding.</p><Link href="/courses">Find your next lesson →</Link></div>
        <form action={signOutAction}><button className="sidebar-signout" type="submit">↪ <span>Sign out</span></button></form>
      </aside>
      <section className="learner-main">
        <header className="learner-topbar"><div><span className="topbar-label">LEARNING SPACE</span><b>My workspace</b></div><div className="learner-top-actions"><Link href="/courses">Explore library</Link><Link href="/portfolio">Portfolio</Link><span className="learner-avatar">{firstName.slice(0,1).toUpperCase()}</span></div></header>
        <div className="learner-content">
          <div className="learner-welcome"><div><span className="app-overline">YOUR SPACE TO LEARN AND THINK</span><h1>Good to see you, {firstName}.</h1><p>Your next idea is waiting. Pick up a lesson, try a challenge or explore something completely new.</p><div className="welcome-actions"><Link className="app-button app-button-primary" href="/courses">Explore learning <span>→</span></Link><Link className="welcome-text-link" href="/challenges">Test your thinking ↗</Link></div></div><div className="welcome-illustration"><div className="welcome-sun">✳</div><div className="welcome-book"><span>YOUR NEXT CHAPTER</span><b>Curiosity<br/>looks good<br/>on you.</b><i>APTIVIO / LEARN</i></div></div></div>
          <div className="learner-progress-strip">
            <div><strong>{lessonsCompleted ?? 0}</strong><span>Lessons completed</span></div>
            <div><strong>20</strong><span>Learning paths to explore</span></div>
            <Link href="/progress">See your progress →</Link>
          </div>
          <div className="workspace-section-title"><div><span className="app-overline">CHOOSE YOUR NEXT STEP</span><h2>Make today count.</h2></div><span>There is no fixed timetable. Learn at your pace.</span></div>
          <div className="workspace-grid">
            <Link className="workspace-card workspace-learning" href="/courses"><div className="workspace-card-icon">⌘</div><span className="workspace-card-label">01 / LEARN</span><h3>Explore the<br/>learning library</h3><p>Clear explanations, guided lessons, practical examples and exercises across useful subjects.</p><b>Browse learning paths <span>↗</span></b><div className="workspace-decoration">A</div></Link>
            <Link className="workspace-card workspace-thinking" href="/challenges"><div className="workspace-card-icon">✳</div><span className="workspace-card-label">02 / THINK</span><h3>Challenge<br/>your reasoning</h3><p>Try logic, numbers, words, spatial patterns and memory challenges. Review your answers and learn why.</p><b>Enter the Think Lab <span>↗</span></b><div className="workspace-decoration">?</div></Link>
            <Link className="workspace-card workspace-progress" href="/progress"><div className="workspace-card-icon">↗</div><span className="workspace-card-label">03 / IMPROVE</span><h3>See how you<br/>are developing</h3><p>Review completed attempts, understand your results and find the areas to practise next.</p><b>View my progress <span>↗</span></b><div className="workspace-decoration">↗</div></Link>
          </div>
          <div className="workspace-bottom"><div className="bottom-quote"><span>THE APTIVIO WAY</span><h3>Don&apos;t rush to finish.<br/>Make sure you understand.</h3><p>Read a little. Ask questions. Try the example. Explain it in your own words. That&apos;s how knowledge sticks.</p></div><div className="bottom-checklist"><span className="app-overline">A SIMPLE LEARNING ROUTINE</span><div><b>01</b><span>Choose one idea you want to understand.</span></div><div><b>02</b><span>Work through the explanation and example.</span></div><div><b>03</b><span>Try the exercise without looking at the answer.</span></div><div><b>04</b><span>Review what you got wrong and try again.</span></div></div></div>
        </div>
      </section>
    </main>
  );
}
