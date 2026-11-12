import Link from "next/link";
import { notFound } from "next/navigation";
import { getLearningPackage, getLessonCount, learningPackages } from "@/lib/learning/library";

type Props = { params: Promise<{ lessonId: string }> };

export function generateStaticParams() {
  return learningPackages.map((item) => ({ lessonId: item.course.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  const item = getLearningPackage(lessonId);
  return { title: item?.course.title ?? "Learning path" };
}

export default async function LearningPathPage({ params }: Props) {
  const { lessonId } = await params;
  const item = getLearningPackage(lessonId);
  if (!item) notFound();

  return (
    <main className="lesson-page">
      <header className="dashboard-header">
        <Link className="brand" href="/"><span className="brand-mark">A</span><span>APTIVIO</span></Link>
        <nav className="challenge-nav"><Link href="/courses">All learning</Link><Link href="/challenges">Challenges</Link></nav>
      </header>
      <section className="lesson-path-content">
        <Link className="lesson-back-link" href="/courses">← Learning library</Link>
        <span className="eyebrow">{item.course.level.toUpperCase()} LEARNING PATH</span>
        <h1>{item.course.title}</h1>
        <p className="lesson-path-subtitle">{item.course.subtitle}</p>
        <p className="lesson-path-description">{item.course.description}</p>
        <div className="lesson-path-meta"><span>{item.sections.length} sections</span><span>{getLessonCount(item)} lessons</span><span>{item.course.duration_minutes} minutes estimated</span></div>
        <div className="lesson-path-notice">Self-paced learning resource. You can read the material without enrolling or paying. This is not an accredited course or a professional certification.</div>
        <div className="lesson-outcomes">
          <h2>What you will learn</h2>
          <ul>{item.course.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
        </div>
        <div className="lesson-section-list">
          {item.sections.map((section, sectionIndex) => (
            <section className="lesson-section-card" key={section.title}>
              <div className="lesson-section-heading"><span>SECTION {String(sectionIndex + 1).padStart(2, "0")}</span><h2>{section.title}</h2><p>{section.description}</p></div>
              <div className="lesson-list">
                {section.lessons.map((lesson, lessonIndex) => {
                  const currentNumber = item.sections
                    .slice(0, sectionIndex)
                    .reduce((count, previousSection) => count + previousSection.lessons.length, 0)
                    + lessonIndex + 1;
                  return (
                    <Link className="lesson-list-item" href={`/learn/${item.course.slug}/${currentNumber}`} key={lesson.title}>
                      <span className="lesson-list-number">{String(currentNumber).padStart(2, "0")}</span>
                      <span className="lesson-list-title">{lesson.title}<small>{lesson.duration_minutes} min read</small></span>
                      <span className="lesson-list-arrow">↗</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
