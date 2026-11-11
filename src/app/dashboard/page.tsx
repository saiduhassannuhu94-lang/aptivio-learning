import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./dashboard-shell";
import { summarizeCourseProgress, summarizeOverallProgress } from "@/lib/learning/progress";

export const metadata = {
  title: "Your learning dashboard",
  robots: { index: false, follow: false },
};

type DashboardPageProps = {
  searchParams: Promise<{ payment?: string }>;
};

type DashboardCourse = {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  level: string;
  languageCode: string;
  enrollmentStatus: "active" | "completed";
  enrolledAt: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
};

const paymentNotices: Record<string, string> = {
  success: "Payment verified. Your course access is ready.",
  pending: "Your payment is still being confirmed. Do not pay again while verification is pending.",
  failed: "The payment provider did not confirm a successful charge. You can return to the course and try again.",
  "verification-needed": "We could not confirm the payment yet. Your access has not been granted. Contact support with your payment reference.",
  invalid: "The payment return link was invalid. Check your payment history before trying again.",
  "not-found": "We could not find a payment linked to this account.",
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const query = await searchParams;
  const cookieStore = await cookies();
  const initialTheme = cookieStore.get("aptivio-theme")?.value === "dark" ? "dark" : "light";
  const paymentNotice = query.payment ? paymentNotices[query.payment] : undefined;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const subject = claimsData?.claims?.sub;

  if (claimsError || typeof subject !== "string") redirect("/sign-in");

  const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
  if (authUserError || !authUserData.user || authUserData.user.id !== subject) redirect("/sign-in");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("display_name").eq("id", subject).maybeSingle();

  if (profileError) throw new Error("We could not load your learner profile. Please refresh the page.");

  if (!profile) {
    const { error: createProfileError } = await supabase.from("profiles").insert({
      id: subject,
      display_name: typeof authUserData.user.user_metadata.display_name === "string"
        ? authUserData.user.user_metadata.display_name.slice(0, 100) : "",
    });
    if (createProfileError && createProfileError.code !== "23505") {
      throw new Error("We could not create your learner profile. Please try again.");
    }
  }

  const displayName = profile?.display_name ||
    (typeof authUserData.user.user_metadata.display_name === "string"
      ? authUserData.user.user_metadata.display_name : "");

  // Every query runs with the signed-in user's Supabase session. RLS is the
  // final ownership boundary; the explicit user filters add defense in depth.
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id, course_id, course_version_id, status, enrolled_at")
    .eq("user_id", subject)
    .in("status", ["active", "completed"])
    .order("enrolled_at", { ascending: false });

  if (enrollmentError) {
    throw new Error("We could not load your course enrollments. Please refresh the page.");
  }

  const enrollmentRows = enrollments ?? [];
  let learningCourses: DashboardCourse[] = [];

  if (enrollmentRows.length > 0) {
    const courseIds = [...new Set(enrollmentRows.map((item) => item.course_id))];
    const versionIds = [...new Set(enrollmentRows.map((item) => item.course_version_id))];
    const enrollmentIds = enrollmentRows.map((item) => item.id);

    const [
      { data: courses, error: coursesError },
      { data: versions, error: versionsError },
      { data: sections, error: sectionsError },
      { data: progressRows, error: progressError },
    ] = await Promise.all([
      supabase.from("courses")
        .select("id, slug, level, language_code")
        .in("id", courseIds),
      supabase.from("course_versions")
        .select("id, course_id, title")
        .in("id", versionIds),
      supabase.from("course_sections")
        .select("id, course_version_id")
        .in("course_version_id", versionIds),
      supabase.from("lesson_progress")
        .select("enrollment_id, lesson_id, is_completed")
        .eq("user_id", subject)
        .in("enrollment_id", enrollmentIds),
    ]);

    if (coursesError || versionsError || sectionsError || progressError) {
      throw new Error("Your learning data could not be loaded safely. Please refresh the page.");
    }

    const courseRows = courses ?? [];
    const versionRows = versions ?? [];
    const sectionRows = sections ?? [];
    const sectionIds = sectionRows.map((item) => item.id);

    const { data: lessons, error: lessonsError } = sectionIds.length
      ? await supabase.from("lessons")
          .select("id, section_id")
          .in("section_id", sectionIds)
      : { data: [], error: null };

    if (lessonsError) {
      throw new Error("Your course curriculum could not be loaded. Please refresh the page.");
    }

    const courseById = new Map(courseRows.map((item) => [item.id, item]));
    const versionById = new Map(versionRows.map((item) => [item.id, item]));
    const lessonsByVersion = new Map<string, Set<string>>();
    const versionBySection = new Map(sectionRows.map((item) => [item.id, item.course_version_id]));
    for (const lesson of lessons ?? []) {
      const versionId = versionBySection.get(lesson.section_id);
      if (!versionId) continue;
      const existing = lessonsByVersion.get(versionId) ?? new Set<string>();
      existing.add(lesson.id);
      lessonsByVersion.set(versionId, existing);
    }

    learningCourses = enrollmentRows.map((enrollment) => {
      const course = courseById.get(enrollment.course_id);
      const version = versionById.get(enrollment.course_version_id);

      if (!course || !version || version.course_id !== enrollment.course_id) {
        throw new Error("An enrolled course version could not be matched. Please contact support.");
      }

      const lessonIds = [...(lessonsByVersion.get(enrollment.course_version_id) ?? new Set<string>())];
      const progress = summarizeCourseProgress(enrollment.id, lessonIds, progressRows ?? []);

      return {
        enrollmentId: enrollment.id,
        courseId: course.id,
        slug: course.slug,
        title: version.title,
        level: course.level.replaceAll("_", " "),
        languageCode: course.language_code.toUpperCase(),
        enrollmentStatus: enrollment.status as "active" | "completed",
        enrolledAt: enrollment.enrolled_at,
        ...progress,
      };
    });
  }

  const overall = summarizeOverallProgress(learningCourses);
  const { totalLessons, completedLessons, progressPercent: overallProgress } = overall;

  return (
    <DashboardShell
      displayName={displayName}
      paymentNotice={paymentNotice}
      initialTheme={initialTheme}
      learningCourses={learningCourses}
      completedLessons={completedLessons}
      totalLessons={totalLessons}
      overallProgress={overallProgress}
    />
  );
}
