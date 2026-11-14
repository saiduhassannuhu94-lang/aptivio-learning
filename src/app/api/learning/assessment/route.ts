import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const submissionSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().min(1).max(80),
    response: z.string().trim().min(1).max(12000),
  })).min(1).max(30),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return NextResponse.json({ error: "Sign in to submit this assessment." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The submission body is invalid." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Answer every question before submitting." }, { status: 400 });
  }

  const { data: submissionId, error } = await supabase.rpc("submit_course_assessment", {
    p_assessment_id: parsed.data.assessmentId,
    p_answers: parsed.data.answers.map((answer) => ({
      question_id: answer.questionId,
      response: answer.response,
    })),
  });

  if (error) {
    if (error.code === "42501") {
      return NextResponse.json({ error: "An active enrolment is required to submit this assessment." }, { status: 403 });
    }
    if (error.code === "P0002") {
      return NextResponse.json({ error: "This assessment is no longer available." }, { status: 404 });
    }
    if (error.code === "P0001") {
      return NextResponse.json({ error: "This assessment has already been graded and can no longer be changed." }, { status: 409 });
    }
    if (error.code === "22023") {
      return NextResponse.json({ error: "The answers do not match the assessment questions." }, { status: 400 });
    }
    return NextResponse.json({ error: "Your assessment could not be submitted. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ submitted: true, submissionId }, { status: 200 });
}
