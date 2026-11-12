import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createChallengeAdmin } from "@/lib/challenges/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ attemptId: string }> };

const schema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    optionIds: z.array(z.string().min(1).max(80)).max(8),
  })).max(200),
});

export async function POST(request: Request, context: Context) {
  const { attemptId } = await context.params;
  const parsedId = z.string().uuid().safeParse(attemptId);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid attempt." }, { status: 400 });

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Sign in to submit this challenge." }, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Your answers could not be read." }, { status: 400 });

  const admin = createChallengeAdmin();
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

  return NextResponse.json({ result: data });
}
