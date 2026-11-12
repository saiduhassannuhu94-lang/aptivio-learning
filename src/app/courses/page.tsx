import Link from "next/link";
import { getLessonCount, learningPackages } from "@/lib/learning/library";

export const metadata = {
  title: "Explore learning",
  description: "Free self-paced learning material across programming, web development and software engineering.",
};

export default function LearningLibraryPage() {
  return (
    <main className="catalogue-page">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
        <nav className="challenge-nav"><Link href="/challenges">Challenges</Link><Link href="/progress">My progress</Link><Link href="/dashboard">Account</Link></nav>
      </header>
      <section className="catalogue-content">
        <span className="eyebrow">THE APTIVIO LEARNING LIBRARY</span>
        <h1>Learn at your own pace.</h1>
        <p>Explore practical learning material, work through examples and test your understanding. No course enrolment or payment is needed for these library resources.</p>
        <div className="library-preview-notice">
          <strong>Early-access learning library</strong>
          <span>These materials are being refined. Use them for practice and independent learning, and verify important technical or academic decisions with trusted references.</span>
        </div>
        <div className="library-countline"><strong>{learningPackages.length} learning paths</strong><span>{learningPackages.reduce((sum, item) => sum + getLessonCount(item), 0)} lessons · Free access</span></div>
        <div className="catalogue-grid">
          {learningPackages.map((item) => (
            <article className="catalogue-card" key={item.course.slug}>
              <span className="catalogue-kicker">{item.course.level} · {item.sections.length} sections</span>
              <h2>{item.course.title}</h2>
              <p className="catalogue-subtitle">{item.course.subtitle}</p>
              <p>{item.course.description}</p>
              <div className="catalogue-card-foot">
                <strong>{getLessonCount(item)} lessons · {item.course.duration_minutes} min</strong>
                <Link className="text-link" href={`/learn/${item.course.slug}`}>Open learning path <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
