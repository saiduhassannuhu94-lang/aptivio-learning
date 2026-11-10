import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ quizId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { quizId } = await context.params;
  const parsedQuizId = z.string().uuid().safeParse(quizId);

  if (!parsedQuizId.success) {
    return NextResponse.json({ error: "Invalid quiz." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in to start this assessment." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: quiz, error: quizError } = await admin
    .from("quizzes")
    .select("id, course_version_id, title, instructions, pass_mark, max_attempts, time_limit_seconds, is_published")
    .eq("id", parsedQuizId.data)
    .maybeSingle();

  if (quizError || !quiz || !quiz.is_published) {
    return NextResponse.json({ error: "This assessment is not available." }, { status: 404 });
  }

  const { data: enrollment, error: enrollmentError } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", authData.user.id)
    .eq("course_version_id", quiz.course_version_id)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (enrollmentError || !enrollment) {
    return NextResponse.json({ error: "You need access to this course before taking its assessment." }, { status: 403 });
  }

  // Load the safe question payload before creating an attempt, so a transient
  // question-read failure cannot strand the learner with an empty attempt.
  const { data: questions, error: questionsError } = await admin
    .from("quiz_questions")
    .select("id, prompt, question_type, options, points, sort_order")
    .eq("quiz_id", quiz.id)
    .order("sort_order", { ascending: true });

  if (questionsError || !questions?.length) {
    return NextResponse.json({ error: "This assessment is not ready yet." }, { status: 409 });
  }

  const { data: attemptId, error: attemptError } = await admin.rpc("start_quiz_attempt", {
    p_quiz_id: quiz.id,
    p_user_id: authData.user.id,
    p_enrollment_id: enrollment.id,
  });

  if (attemptError || !attemptId) {
    const message = attemptError?.message.includes("maximum_attempts_reached")
      ? "You have used all available attempts for this assessment."
      : attemptError?.message.includes("attempt_already_in_progress")
        ? "You already have an assessment in progress."
        : "We could not start this assessment. Refresh and try again.";

    return NextResponse.json({ error: message }, { status: 409 });
  }

  const { data: attempt, error: attemptReadError } = await admin
    .from("quiz_attempts")
    .select("id, attempt_number, started_at")
    .eq("id", attemptId)
    .single();

  if (attemptReadError || !attempt) {
    return NextResponse.json({ error: "The assessment attempt could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({
    attempt,
    quiz: {
      id: quiz.id,
      title: quiz.title,
      instructions: quiz.instructions,
      passMark: quiz.pass_mark,
      timeLimitSeconds: quiz.time_limit_seconds,
    },
    questions,
  });
}
