import { NextResponse } from "next/server";
import { createChallengeAdmin } from "@/lib/challenges/admin";

export const runtime = "nodejs";

export async function GET() {
  const admin = createChallengeAdmin();
  const { data, error } = await admin
    .from("brain_challenges")
    .select("id, slug, title, category, difficulty, summary, duration_seconds, max_attempts")
    .eq("is_published", true)
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Challenges are temporarily unavailable." }, { status: 503 });
  }

  return NextResponse.json({ challenges: data ?? [] }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
