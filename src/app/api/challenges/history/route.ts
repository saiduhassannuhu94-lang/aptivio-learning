import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createChallengeAdmin } from "@/lib/challenges/admin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Sign in to view your progress." }, { status: 401 });

  const admin = createChallengeAdmin();
  const { data, error } = await admin
    .from("brain_challenge_attempts")
    .select("id, challenge_id, attempt_number, status, started_at, submitted_at, elapsed_seconds, score, max_score, percentage")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Your progress could not be loaded." }, { status: 503 });

  const challengeIds = [...new Set((data ?? []).map((item) => item.challenge_id))];
  const { data: challenges, error: challengeError } = challengeIds.length
    ? await admin.from("brain_challenges").select("id, title, category, slug").in("id", challengeIds)
    : { data: [], error: null };

  if (challengeError) return NextResponse.json({ error: "Challenge names could not be loaded." }, { status: 503 });
  const byId = new Map((challenges ?? []).map((item) => [item.id, item]));

  return NextResponse.json({
    attempts: (data ?? []).map((item) => ({ ...item, challenge: byId.get(item.challenge_id) ?? null })),
  });
}
