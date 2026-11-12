import { NextResponse } from "next/server";
import { z } from "zod";
import { createChallengeAdmin } from "@/lib/challenges/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Context) {
  const { slug } = await context.params;
  const parsed = z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(slug);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid challenge." }, { status: 400 });
  }

  const admin = createChallengeAdmin();
  const { data: challenge, error } = await admin
    .from("brain_challenges")
    .select("id, slug, title, category, difficulty, summary, instructions, duration_seconds, max_attempts")
    .eq("slug", parsed.data)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  const { data: questions, error: questionError } = await admin
    .from("brain_challenge_questions")
    .select("id, prompt, options, points, sort_order")
    .eq("challenge_id", challenge.id)
    .order("sort_order", { ascending: true });

  if (questionError || !questions?.length) {
    return NextResponse.json({ error: "This challenge is being prepared." }, { status: 409 });
  }

  // Answer keys are in a separate server-only table and are never selected here.
  return NextResponse.json({ challenge, questions });
}
