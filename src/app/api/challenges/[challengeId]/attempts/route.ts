import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createChallengeAdmin } from "@/lib/challenges/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ challengeId: string }> };

export async function GET(_request: Request, context: Context) {
  const { challengeId } = await context.params;
  const parsed = z.string().uuid().safeParse(challengeId);
  if (!parsed.success) return NextResponse.json({ error: "Invalid challenge." }, { status: 400 });

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Sign in to start a challenge." }, { status: 401 });

  const admin = createChallengeAdmin();
  const { data, error } = await admin
    .from("brain_challenge_attempts")
    .select("id, attempt_number, started_at, status")
    .eq("challenge_id", parsed.data)
    .eq("user_id", auth.user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Your active attempt could not be loaded." }, { status: 503 });
  return NextResponse.json({ attempt: data });
}

export async function POST(_request: Request, context: Context) {
  const { challengeId } = await context.params;
  const parsed = z.string().uuid().safeParse(challengeId);
  if (!parsed.success) return NextResponse.json({ error: "Invalid challenge." }, { status: 400 });

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Sign in to start a challenge." }, { status: 401 });

  const admin = createChallengeAdmin();
  const { data, error } = await admin.rpc("start_brain_challenge_attempt", {
    p_challenge_id: parsed.data,
    p_user_id: auth.user.id,
  });

  if (error || !data) {
    const message = error?.message.includes("maximum_attempts_reached")
      ? "You have used all available attempts for this challenge."
      : error?.message.includes("attempt_already_in_progress")
        ? "You already have an attempt in progress. Resume it instead."
        : "We could not start this challenge. Please try again.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const { data: attempt, error: attemptError } = await admin
    .from("brain_challenge_attempts")
    .select("id, attempt_number, started_at")
    .eq("id", data)
    .single();

  if (attemptError || !attempt) return NextResponse.json({ error: "The attempt could not be loaded." }, { status: 503 });
  return NextResponse.json({ attempt });
}
