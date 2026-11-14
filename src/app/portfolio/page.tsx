import Link from "next/link";
import { CourseArtwork } from "@/app/course-artwork";
import { SiteHeader } from "@/app/site-header";
import { learningPackages } from "@/lib/learning/library";

export const metadata = {
  title: "Portfolio",
  description: "Explore the practical work and project briefs inside APTIVIO learning paths.",
};

export default function PortfolioPage() {
  const projects = learningPackages.map((item, courseIndex) => {
    const lessons = item.sections.flatMap((section) => section.lessons);
    const candidateIndex = lessons.findIndex((lesson) => /project|build|implementation|application/i.test(lesson.title));
    const lessonIndex = candidateIndex >= 0 ? candidateIndex : lessons.length - 1;
    const lesson = lessons[lessonIndex];
    return {
      course: item.course,
      courseIndex,
      lesson,
      lessonNumber: lessonIndex + 1,
      isProject: candidateIndex >= 0,
    };
  });

  return (
    <main className="portfolio-page">
      <SiteHeader current="portfolio" />
      <section className="portfolio-hero">
        <span className="portfolio-kicker">APTIVIO · WORK IN PRACTICE</span>
        <h1>Learning should leave you with something you can show.</h1>
        <p>This portfolio highlights practical project briefs and end-of-path work contained in the learning library. These are learning tasks, not claims of completed student submissions.</p>
        <div className="portfolio-hero-metrics"><span><b>{learningPackages.length}</b> learning paths</span><span><b>{projects.length}</b> practical milestones</span><span><b>₦0</b> to explore</span></div>
      </section>
      <section className="portfolio-content">
        <div className="portfolio-section-heading"><div><span className="portfolio-kicker">PROJECT PATHWAYS</span><h2>From concepts to applied work.</h2></div><p>Each item connects a course to a real lesson and a task you can open and work through.</p></div>
        <div className="portfolio-grid">
          {projects.map((project) => (
            <article className="portfolio-card" key={project.course.slug}>
              <CourseArtwork slug={project.course.slug} title={project.course.title} number={project.courseIndex + 1} />
              <div className="portfolio-card-copy">
                <span className="portfolio-card-label">{project.isProject ? "PROJECT / BUILD" : "PRACTICAL MILESTONE"}</span>
                <h3>{project.lesson.title}</h3>
                <p>{project.lesson.exercise}</p>
                <Link className="aptivio-action portfolio-open-button" href={"/learn/" + project.course.slug + "/" + project.lessonNumber}>Open learning task <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
