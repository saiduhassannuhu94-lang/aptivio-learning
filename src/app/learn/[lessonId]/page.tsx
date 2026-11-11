import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LessonPageProps = { params: Promise<{ lessonId: string }> };

export const metadata = {
  title: "Lesson | APTIVIO",
  robots: { index: false, follow: false },
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  // Fetch only routing metadata first. Protected lesson body and media are
  // deliberately withheld until the exact-version access check succeeds.
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, section_id, title, duration_seconds, is_preview, sort_order")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) notFound();

  const { data: section } = await supabase
    .from("course_sections")
    .select("id, course_version_id, title")
    .eq("id", lesson.section_id)
    .maybeSingle();

  if (!section) notFound();

  const { data: version } = await supabase
    .from("course_versions")
    .select("id, course_id, title")
    .eq("id", section.course_version_id)
    .maybeSingle();

  if (!version) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, status, published_version_id")
    .eq("id", version.course_id)
    .maybeSingle();

  if (!course) notFound();

  const isCurrentPublishedPreview =
    lesson.is_preview &&
    course.status === "published" &&
    course.published_version_id === version.id;

  const { data: enrollment } = auth.user
    ? await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", auth.user.id)
        .eq("course_id", course.id)
        .eq("course_version_id", version.id)
        .in("status", ["active", "completed"])
        .maybeSingle()
    : { data: null };

  if (!isCurrentPublishedPreview && !enrollment) notFound();

  // Re-read the protected fields only after authorization. RLS remains the
  // database-level enforcement boundary if application checks regress.
  const { data: protectedLesson, error: protectedLessonError } = await supabase
    .from("lessons")
    .select("body_markdown, lesson_type, media_provider, media_reference")
    .eq("id", lesson.id)
    .maybeSingle();

  if (protectedLessonError || !protectedLesson) notFound();

  const { data: sections } = await supabase
    .from("course_sections")
    .select("id, sort_order")
    .eq("course_version_id", version.id)
    .order("sort_order", { ascending: true });

  const sectionIds = (sections ?? []).map((item) => item.id);
  const { data: allLessons } = sectionIds.length
    ? await supabase
        .from("lessons")
        .select("id, title, section_id, sort_order")
        .in("section_id", sectionIds)
    : { data: [] };

  const sectionOrder = new Map((sections ?? []).map((item) => [item.id, item.sort_order]));
  const orderedLessons = [...(allLessons ?? [])].sort((a, b) => {
    const sectionDifference =
      (sectionOrder.get(a.section_id) ?? 0) - (sectionOrder.get(b.section_id) ?? 0);
    return sectionDifference || a.sort_order - b.sort_order;
  });
  const currentIndex = orderedLessons.findIndex((item) => item.id === lesson.id);
  const previousLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : null;

  return (
    <main className="lesson-page">
      <header className="dashboard-header">
        <Link className="brand" href="/">
          <span className="brand-mark">A</span><span>APTIVIO</span>
        </Link>
        <Link className="dashboard-signout" href={`/courses/${course.slug}`}>Course overview</Link>
      </header>

      <article className="lesson-content">
        <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dashboard">Dashboard</Link><span>/</span>
          <Link href={`/courses/${course.slug}`}>{version.title}</Link><span>/</span>
          <span>{section.title}</span>
        </nav>
        <span className="eyebrow">LESSON {currentIndex + 1} · {protectedLesson.lesson_type.toUpperCase()}</span>
        <h1>{lesson.title}</h1>
        <p className="lesson-meta">
          {lesson.duration_seconds > 0 ? `${Math.ceil(lesson.duration_seconds / 60)} min` : "Self-paced"}
          {isCurrentPublishedPreview && !enrollment ? " · Preview lesson" : " · Enrolled access"}
        </p>

        {protectedLesson.lesson_type === "text" ? (
          <div className="lesson-body">{protectedLesson.body_markdown}</div>
        ) : (
          <section className="lesson-media-placeholder">
            <h2>{protectedLesson.lesson_type === "video" ? "Video lesson" : protectedLesson.lesson_type === "audio" ? "Audio lesson" : "External lesson"}</h2>
            <p>The lesson content is protected. Its media player will appear here when a supported provider is configured.</p>
          </section>
        )}

        {enrollment && (
          <form action="/api/learning/progress" method="post" className="lesson-progress-form">
            <input type="hidden" name="lessonId" value={lesson.id} />
            <input type="hidden" name="completed" value="true" />
            <button className="button button-primary" type="submit">Mark lesson complete</button>
          </form>
        )}

        <nav className="lesson-navigation" aria-label="Lesson navigation">
          {previousLesson ? (
            <Link href={`/learn/${previousLesson.id}`}>← {previousLesson.title}</Link>
          ) : <span />}
          {nextLesson ? (
            <Link href={`/learn/${nextLesson.id}`}>{nextLesson.title} →</Link>
          ) : <span />}
        </nav>
      </article>
    </main>
  );
}
