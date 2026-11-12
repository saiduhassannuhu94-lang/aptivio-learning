import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createChallengeAdmin } from "@/lib/challenges/admin";
import { challengeSubmissionSchema } from "@/lib/challenges/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ attemptId: string }> };

export async function POST(request: Request, context: Context) {
  const { attemptId } = await context.params;
  const parsedId = z.string().uuid().safeParse(attemptId);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid attempt." }, { status: 400 });

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Sign in to submit this challenge." }, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  const parsed = challengeSubmissionSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Your answers could not be read." }, { status: 400 });

  const admin = createChallengeAdmin();
  const { data: ownedAttempt, error: ownedAttemptError } = await admin
    .from("brain_challenge_attempts")
    .select("challenge_id")
    .eq("id", parsedId.data)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (ownedAttemptError || !ownedAttempt) {
    return NextResponse.json({ error: "We could not find this attempt." }, { status: 404 });
  }

  const { data, error } = await admin.rpc("submit_brain_challenge_attempt", {
    p_attempt_id: parsedId.data,
    p_user_id: auth.user.id,
    p_answers: parsed.data.answers,
  });

  if (error || !data) {
    const message = error?.message.includes("challenge_time_expired")
      ? "Time is up. This attempt has expired."
      : error?.message.includes("attempt_already_submitted")
        ? "This attempt has already been submitted."
        : error?.message.includes("attempt_not_found")
          ? "We could not find this attempt."
          : "Your result could not be saved. Please try again.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  if (data.expired === true) {
    return NextResponse.json({ error: "Time is up. This attempt has expired." }, { status: 410 });
  }

  const { data: explanations, error: explanationError } = await admin
    .from("brain_challenge_questions")
    .select("id, explanation")
    .eq("challenge_id", ownedAttempt.challenge_id);

  return NextResponse.json({
    result: {
      ...data,
      explanations: (explanationError ? [] : explanations ?? []).map((item) => ({
        questionId: item.id,
        explanation: item.explanation,
      })),
    },
  });
}
