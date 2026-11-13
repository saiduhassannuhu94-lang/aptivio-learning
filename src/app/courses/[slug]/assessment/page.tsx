import Link from "next/link";

export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssessmentForm, type AssessmentQuestion } from "../assessment-form";

type PageProps = { params: Promise<{ slug: string }> };
type FinalProject = {
  title?: string;
  deliverables?: string[];
  acceptance_criteria?: string[];
};
type CourseReference = { title: string; url: string };

function isAssessmentQuestion(value: unknown): value is AssessmentQuestion {
  if (!value || typeof value !== "object") return false;
  const question = value as Record<string, unknown>;
  return typeof question.id === "string" &&
    typeof question.prompt === "string" &&
    typeof question.marks === "number" &&
    Array.isArray(question.rubric) &&
    question.rubric.every((item) => typeof item === "string");
}

export default async function CourseAssessmentPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/sign-in");

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, published_version_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!course?.published_version_id) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("course_id", course.id)
    .eq("course_version_id", course.published_version_id)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (!enrollment) redirect("/courses/" + slug);

  const { data: version } = await supabase
    .from("course_versions")
    .select("id, title")
    .eq("id", course.published_version_id)
    .maybeSingle();

  if (!version) notFound();

  const { data: assessment } = await supabase
    .from("course_assessments")
    .select("id, title, instructions, pass_mark_percent, total_marks, questions, final_project, source_references")
    .eq("course_version_id", version.id)
    .maybeSingle();

  if (!assessment) notFound();

  const questions = Array.isArray(assessment.questions)
    ? assessment.questions.filter(isAssessmentQuestion)
    : [];
  if (questions.length < 5) notFound();

  const project = assessment.final_project as FinalProject;
  const references = Array.isArray(assessment.source_references)
    ? assessment.source_references.filter((item): item is CourseReference =>
        Boolean(item) && typeof item === "object" &&
        typeof (item as Record<string, unknown>).title === "string" &&
        typeof (item as Record<string, unknown>).url === "string"
      )
    : [];

  const { data: submission } = await supabase
    .from("course_assessment_submissions")
    .select("id, status, submitted_at, grade_percent, feedback")
    .eq("assessment_id", assessment.id)
    .eq("enrollment_id", enrollment.id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return (
    <main className="assessment-page">
      <header className="dashboard-header">
        <Link className="brand" href="/">
          <span className="brand-mark">A</span><span>APTIVIO</span>
        </Link>
        <Link className="dashboard-signout" href={"/courses/" + slug}>Course overview</Link>
      </header>

      <div className="assessment-layout">
        <nav className="assessment-breadcrumb" aria-label="Breadcrumb">
          <Link href="/dashboard">Dashboard</Link><span>/</span>
          <Link href={"/courses/" + slug}>{version.title}</Link><span>/</span>
          <span>Final assessment</span>
        </nav>

        <section className="assessment-hero">
          <span className="eyebrow">COURSE ASSESSMENT</span>
          <h1>{assessment.title}</h1>
          <p>{assessment.instructions}</p>
          <div className="assessment-meta">
            <span>{questions.length} written questions</span>
            <span>{assessment.total_marks} total marks</span>
            <span>{assessment.pass_mark_percent}% pass mark</span>
          </div>
        </section>

        {submission?.status === "graded" && (
          <section className="assessment-result">
            <span className="eyebrow">MARKED SUBMISSION</span>
            <strong>{submission.grade_percent}%</strong>
            <p>{submission.feedback || "Your assessor has marked this submission."}</p>
          </section>
        )}

        <section className="assessment-project">
          <span className="eyebrow">APPLIED PROJECT</span>
          <h2>{project.title || "Final project"}</h2>
          <div className="assessment-project-columns">
            <div>
              <h3>Deliverables</h3>
              <ul>{(project.deliverables ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <h3>Acceptance criteria</h3>
              <ul>{(project.acceptance_criteria ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
        </section>

        <AssessmentForm
          assessmentId={assessment.id}
          questions={questions}
          alreadySubmitted={submission?.status === "submitted"}
        />

        {references.length > 0 && (
          <section className="assessment-references">
            <h2>Course references</h2>
            <ul>{references.map((reference) => (
              <li key={reference.url}>
                <a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a>
              </li>
            ))}</ul>
          </section>
        )}
      </div>
    </main>
  );
}
