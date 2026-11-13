import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLearningPackage } from "@/lib/learning/library";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format/currency";
import { CourseAccessButton } from "./course-access-button";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const libraryItem = getLearningPackage(slug);
  if (libraryItem) return { title: libraryItem.course.title, description: libraryItem.course.description };
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("published_version_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!course?.published_version_id) {
    return { title: "Course not found" };
  }

  const { data: version } = await supabase
    .from("course_versions")
    .select("title, description")
    .eq("id", course.published_version_id)
    .maybeSingle();

  return {
    title: version?.title ?? "Course",
    description: version?.description ?? "Explore a structured APTIVIO course.",
  };
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug } = await params;
  if (getLearningPackage(slug)) redirect("/learn/" + slug);
  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, slug, level, language_code, price_minor, currency, published_version_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (courseError || !course?.published_version_id) {
    notFound();
  }

  const { data: version, error: versionError } = await supabase
    .from("course_versions")
    .select("id, title, subtitle, description, outcomes, prerequisites, duration_minutes")
    .eq("id", course.published_version_id)
    .maybeSingle();

  if (versionError || !version) {
    notFound();
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("course_sections")
    .select("id, title, description, sort_order")
    .eq("course_version_id", version.id)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    throw new Error("Course curriculum could not be loaded.");
  }

  const sectionIds = (sections ?? []).map((section) => section.id);
  const { data: lessons, error: lessonsError } = sectionIds.length
    ? await supabase
        .from("lessons")
        .select("id, section_id, title, lesson_type, duration_seconds, is_preview, sort_order")
        .in("section_id", sectionIds)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  if (lessonsError) {
    throw new Error("Course lessons could not be loaded.");
  }

  const { data: authData } = await supabase.auth.getUser();
  const { data: enrollment } = authData.user
    ? await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", authData.user.id)
        .eq("course_id", course.id)
        .eq("course_version_id", version.id)
        .in("status", ["active", "completed"])
        .maybeSingle()
    : { data: null };

  const { data: courseAssessment, error: courseAssessmentError } = enrollment
    ? await supabase
        .from("course_assessments")
        .select("id")
        .eq("course_version_id", version.id)
        .maybeSingle()
    : { data: null, error: null };

  if (courseAssessmentError) {
    throw new Error("Course assessment details could not be loaded.");
  }

  const lessonsBySection = new Map<string, typeof lessons>();
  for (const lesson of lessons ?? []) {
    const existing = lessonsBySection.get(lesson.section_id) ?? [];
    existing.push(lesson);
    lessonsBySection.set(lesson.section_id, existing);
  }

  return (
    <main className="course-detail-page">
      <header className="dashboard-header">
        <Link className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>APTIVIO</span>
        </Link>
        <Link className="dashboard-signout" href="/courses">All courses</Link>
      </header>

      <section className="course-detail-hero">
        <div className="course-detail-copy">
          <Link className="course-back-link" href="/courses">← Course catalogue</Link>
          <span className="eyebrow">APTIVIO LEARNING PATH</span>
          <h1>{version.title}</h1>
          {version.subtitle && <p className="course-detail-subtitle">{version.subtitle}</p>}
          <p className="course-detail-description">{version.description}</p>
          <div className="course-detail-meta">
            <span>{course.level.replaceAll("_", " ")}</span>
            <span>{course.language_code.toUpperCase()}</span>
            <span>{version.duration_minutes > 0 ? `${version.duration_minutes} min` : "Self-paced"}</span>
          </div>
        </div>

        <aside className="course-purchase-card">
          <span className="catalogue-kicker">COURSE ACCESS</span>
          <strong className="course-price">
            {course.price_minor === 0 ? "Free" : formatMoney(course.price_minor, course.currency)}
          </strong>
          <p>
            {course.price_minor === 0
              ? "Enrol at no cost and begin learning."
              : "One-time course payment. Access is granted only after verified payment."}
          </p>
          {enrollment ? (
            <Link className="button button-primary" href="/dashboard">Go to your dashboard</Link>
          ) : (
            <CourseAccessButton
              courseId={course.id}
              courseVersionId={version.id}
              priceMinor={course.price_minor}
              currency={course.currency}
            />
          )}
          {enrollment && courseAssessment && (
            <Link className="text-link" href={`/courses/${course.slug}/assessment`}>
              Open final assessment <span aria-hidden="true">↗</span>
            </Link>
          )}
          <small>Secure access · Version-specific course content</small>
        </aside>
      </section>

      <section className="course-detail-section">
        <div className="course-detail-main">
          {version.outcomes.length > 0 && (
            <div className="course-detail-block">
              <span className="eyebrow">WHAT YOU WILL LEARN</span>
              <h2>Skills and outcomes</h2>
              <ul className="course-outcome-list">
                {version.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
              </ul>
            </div>
          )}

          {version.prerequisites.length > 0 && (
            <div className="course-detail-block">
              <span className="eyebrow">BEFORE YOU BEGIN</span>
              <h2>Prerequisites</h2>
              <ul className="course-outcome-list">
                {version.prerequisites.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}

          <div className="course-detail-block">
            <span className="eyebrow">COURSE CURRICULUM</span>
            <h2>What is inside</h2>
            {!sections?.length ? (
              <p>The curriculum is being prepared for publication.</p>
            ) : (
              <div className="course-curriculum-list">
                {sections.map((section, index) => {
                  const sectionLessons = lessonsBySection.get(section.id) ?? [];
                  return (
                    <article className="course-curriculum-section" key={section.id}>
                      <div className="course-curriculum-heading">
                        <span>SECTION {index + 1}</span>
                        <strong>{section.title}</strong>
                      </div>
                      {section.description && <p>{section.description}</p>}
                      {sectionLessons.length > 0 ? (
                        <ul>
                          {sectionLessons.map((lesson) => (
                            <li key={lesson.id}>
                              {lesson.is_preview || enrollment ? (
                                <Link href={`/learn/${lesson.id}`}>{lesson.title}</Link>
                              ) : (
                                <span>{lesson.title}</span>
                              )}
                              <small>
                                {lesson.is_preview ? "Preview" : "Enrolled learners"}
                                {lesson.duration_seconds > 0
                                  ? ` · ${Math.ceil(lesson.duration_seconds / 60)} min`
                                  : ""}
                              </small>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="course-curriculum-locked">Lesson details are available to enrolled learners.</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
