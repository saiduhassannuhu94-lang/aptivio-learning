import { NextResponse } from "next/server";
import { z } from "zod";
import { gradeQuiz } from "@/lib/assessment/grading";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ attemptId: string }> };

const submissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      optionIds: z.array(z.string().min(1).max(80)).max(12),
    }),
  ).max(200),
});

export async function POST(request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  const parsedAttemptId = z.string().uuid().safeParse(attemptId);

  if (!parsedAttemptId.success) {
    return NextResponse.json({ error: "Invalid assessment attempt." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in to submit this assessment." }, { status: 401 });
  }

  const payload: unknown = await request.json().catch(() => null);
  const parsedPayload = submissionSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json({ error: "Your answers could not be read. Review them and try again." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: attempt, error: attemptError } = await admin
    .from("quiz_attempts")
    .select("id, quiz_id, user_id, status, started_at")
    .eq("id", parsedAttemptId.data)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: "Assessment attempt not found." }, { status: 404 });
  }

  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "This assessment has already been submitted." }, { status: 409 });
  }

  const { data: quiz, error: quizError } = await admin
    .from("quizzes")
    .select("pass_mark, time_limit_seconds")
    .eq("id", attempt.quiz_id)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Assessment configuration could not be loaded." }, { status: 500 });
  }

  if (
    quiz.time_limit_seconds !== null &&
    Date.now() - new Date(attempt.started_at).getTime() > quiz.time_limit_seconds * 1000
  ) {
    await admin
      .from("quiz_attempts")
      .update({ status: "expired" })
      .eq("id", attempt.id)
      .eq("status", "in_progress");

    return NextResponse.json({ error: "The time limit for this assessment has passed." }, { status: 410 });
  }

  const { data: questions, error: questionsError } = await admin
    .from("quiz_questions")
    .select("id, question_type, options, points")
    .eq("quiz_id", attempt.quiz_id)
    .order("sort_order", { ascending: true });

  if (questionsError || !questions?.length) {
    return NextResponse.json({ error: "Assessment questions could not be loaded." }, { status: 500 });
  }

  const questionIds = questions.map((question) => question.id);
  const { data: answerKeys, error: answerKeysError } = await admin
    .from("quiz_answer_keys")
    .select("question_id, correct_option_ids")
    .in("question_id", questionIds);

  if (answerKeysError || !answerKeys) {
    return NextResponse.json({ error: "Assessment grading is temporarily unavailable." }, { status: 500 });
  }

  const keysByQuestion = new Map(answerKeys.map((key) => [key.question_id, key.correct_option_ids]));
  const gradeableQuestions = questions.map((question) => ({
    ...question,
    correct_option_ids: keysByQuestion.get(question.id) ?? [],
  }));

  let result: ReturnType<typeof gradeQuiz>;

  try {
    result = gradeQuiz(gradeableQuestions, parsedPayload.data.answers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The submitted answers are invalid.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const passed = (result.score / result.maxScore) * 100 >= quiz.pass_mark;
  const rpcAnswers = result.gradedAnswers as unknown as Json;

  const { error: submitError } = await admin.rpc("submit_quiz_attempt", {
    p_attempt_id: attempt.id,
    p_user_id: authData.user.id,
    p_score: result.score,
    p_max_score: result.maxScore,
    p_answers: rpcAnswers,
  });

  if (submitError) {
    return NextResponse.json({ error: "Your assessment could not be submitted. Refresh and try again." }, { status: 409 });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    score: result.score,
    maxScore: result.maxScore,
    percentage: Math.round((result.score / result.maxScore) * 10000) / 100,
    passed,
  });
}
