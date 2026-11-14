import Link from "next/link";
import { SiteHeader } from "@/app/site-header";
import { CourseArtwork } from "@/app/course-artwork";
import { getLessonCount, learningPackages } from "@/lib/learning/library";

export const metadata = {
  title: "Explore learning",
  description: "Free guided learning paths, practice and reasoning across computing and software development.",
};

export default function LearningLibraryPage() {
  return (
    <main className="catalogue-page">
      <SiteHeader current="learn" />
      <section className="catalogue-content">
        <span className="eyebrow">THE APTIVIO LEARNING LIBRARY</span>
        <h1>Choose a skill.<br />Build real understanding.</h1>
        <p>Every path is broken into lessons, worked examples, practical exercises and a knowledge check. Start free and learn at your own pace.</p>
        <div className="library-preview-notice">
          <strong>Learn by doing, not just reading.</strong>
          <span>Open a path to see its course map. Complete the lessons, practise the concepts and take the timed knowledge check at the end.</span>
        </div>
        <div className="library-countline"><strong>{learningPackages.length} learning paths</strong><span>{learningPackages.reduce((sum, item) => sum + getLessonCount(item), 0)} lessons · Free access</span></div>
        <div className="catalogue-grid">
          {learningPackages.map((item, index) => (
            <article className="catalogue-card" key={item.course.slug}>
              <Link className="catalogue-art-link" href={"/learn/" + item.course.slug} aria-label={"Open " + item.course.title}>
                <CourseArtwork slug={item.course.slug} title={item.course.title} number={index + 1} />
              </Link>
              <div className="catalogue-card-copy">
                <span className="catalogue-kicker">{item.course.level} · {item.sections.length} sections</span>
                <h2>{item.course.title}</h2>
                <p className="catalogue-subtitle">{item.course.subtitle}</p>
                <div className="catalogue-card-foot">
                  <strong>{getLessonCount(item)} lessons · {item.course.duration_minutes} min</strong>
                  <Link className="aptivio-action catalogue-open-button" href={"/learn/" + item.course.slug}>Open learning path <span aria-hidden="true">↗</span></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
