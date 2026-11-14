import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseArtwork } from "@/app/course-artwork";
import { SiteHeader } from "@/app/site-header";
import { getLessonCount, getLearningPackage, learningPackages } from "@/lib/learning/library";

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

  const courseIndex = learningPackages.findIndex((entry) => entry.course.slug === lessonId);
  const lessonCount = getLessonCount(item);
  const firstLessonHref = "/learn/" + item.course.slug + "/1";

  return (
    <main className="lesson-path-page">
      <SiteHeader current="learn" />
      <div className="lesson-path-shell">
        <nav className="lesson-path-breadcrumb" aria-label="Breadcrumb">
          <Link href="/courses">Learning library</Link><span>/</span><span>{item.course.title}</span>
        </nav>

        <section className="lesson-path-hero">
          <div className="lesson-path-hero-copy">
            <span className="lesson-path-kicker">APTIVIO LEARNING PATH · {item.course.level.toUpperCase()}</span>
            <h1>{item.course.title}</h1>
            <p className="lesson-path-subtitle">{item.course.subtitle}</p>
            <p className="lesson-path-description">{item.course.description}</p>
            <div className="lesson-path-meta">
              <span><b>{item.sections.length}</b> sections</span>
              <span><b>{lessonCount}</b> lessons</span>
              <span><b>{item.course.duration_minutes}</b> min estimated</span>
              <span><b>Free</b> access</span>
            </div>
            <div className="lesson-path-actions">
              <Link className="aptivio-action lesson-path-primary" href={firstLessonHref}>Start first lesson <span aria-hidden="true">→</span></Link>
              <Link className="aptivio-action lesson-path-secondary" href={"/learn/" + item.course.slug + "/quiz"}>Take the course quiz <span aria-hidden="true">✦</span></Link>
            </div>
          </div>
          <CourseArtwork slug={item.course.slug} title={item.course.title} number={courseIndex + 1} />
        </section>

        <section className="lesson-path-outcomes">
          <div className="lesson-path-section-heading">
            <span className="lesson-path-kicker">YOUR LEARNING OUTCOMES</span>
            <h2>What you will be able to do</h2>
            <p>Use these outcomes as checkpoints. The goal is to explain and apply each idea, not just reach the bottom of the page.</p>
          </div>
          <div className="lesson-outcome-grid">
            {item.course.outcomes.map((outcome, index) => (
              <article className="lesson-outcome-item" key={outcome}>
                <span>{String(index + 1).padStart(2, "0")}</span><p>{outcome}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lesson-path-curriculum">
          <div className="lesson-path-section-heading">
            <span className="lesson-path-kicker">THE COURSE MAP</span>
            <h2>Learn in clear stages.</h2>
            <p>Move through the sections in order. Each lesson includes an explanation, a worked example and a task to try.</p>
          </div>
          <div className="lesson-section-list">
            {item.sections.map((section, sectionIndex) => {
              const lessonStart = item.sections
                .slice(0, sectionIndex)
                .reduce((count, previousSection) => count + previousSection.lessons.length, 0);
              return (
                <section className="lesson-section-card" key={section.title}>
                  <div className="lesson-section-heading">
                    <div className="lesson-section-number">{String(sectionIndex + 1).padStart(2, "0")}</div>
                    <div className="lesson-section-copy">
                      <span>SECTION {String(sectionIndex + 1).padStart(2, "0")} · {section.lessons.length} LESSONS</span>
                      <h3>{section.title}</h3>
                      <p>{section.description}</p>
                    </div>
                    <span className="lesson-section-chevron" aria-hidden="true">⌄</span>
                  </div>
                  <div className="lesson-list">
                    {section.lessons.map((lesson, lessonIndex) => {
                      const number = lessonStart + lessonIndex + 1;
                      return (
                        <Link className="lesson-list-item" href={"/learn/" + item.course.slug + "/" + number} key={lesson.title}>
                          <span className="lesson-list-number">{String(number).padStart(2, "0")}</span>
                          <span className="lesson-list-title">{lesson.title}<small>{lesson.duration_minutes} min · Guided lesson</small></span>
                          <span className="lesson-list-arrow" aria-hidden="true">↗</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="lesson-path-quiz-cta">
          <div className="quiz-cta-orbit" aria-hidden="true"><span>?</span></div>
          <div>
            <span className="lesson-path-kicker">PUT YOUR UNDERSTANDING TO THE TEST</span>
            <h2>Ready for the knowledge check?</h2>
            <p>Answer five questions with a five-minute countdown. Get instant feedback, review mistakes and move to the next path when you reach the pass mark.</p>
          </div>
          <Link className="aptivio-action lesson-path-quiz-button" href={"/learn/" + item.course.slug + "/quiz"}>Start course quiz <span aria-hidden="true">→</span></Link>
        </section>

        <p className="lesson-path-disclaimer">Self-paced learning resource. No payment is required. Completion of this learning path is not an accredited qualification or professional certification.</p>
        <footer className="lesson-path-footer"><span>APTIVIO</span><span>Learn · Think · Build</span><Link href="/courses">Explore more learning paths ↗</Link></footer>
      </div>
    </main>
  );
}
