import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLearningPackage } from "@/lib/learning/library";

export const runtime = "nodejs";

const slugSchema = z.string().min(1).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const updateSchema = z.object({
  slug: slugSchema,
  lessonNumber: z.number().int().min(1).max(100),
  completed: z.boolean(),
});

export async function GET(request: Request) {
  const slug = slugSchema.safeParse(new URL(request.url).searchParams.get("slug"));
  if (!slug.success || !getLearningPackage(slug.data)) {
    return NextResponse.json({ error: "Learning path not found." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ error: "Sign in to view your learning progress." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("learning_library_progress")
    .select("lesson_number")
    .eq("user_id", auth.user.id)
    .eq("learning_path_slug", slug.data)
    .order("lesson_number", { ascending: true });

  if (error) return NextResponse.json({ error: "Learning progress could not be loaded." }, { status: 500 });
  return NextResponse.json({ completedLessonNumbers: (data ?? []).map((item) => item.lesson_number) });
}

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid lesson progress update." }, { status: 400 });

  const item = getLearningPackage(parsed.data.slug);
  const totalLessons = item?.sections.reduce((sum, section) => sum + section.lessons.length, 0) ?? 0;
  if (!item || parsed.data.lessonNumber > totalLessons) {
    return NextResponse.json({ error: "Lesson not found in this learning path." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ error: "Sign in to save your learning progress." }, { status: 401 });
  }

  if (parsed.data.completed) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("learning_library_progress").upsert({
      user_id: auth.user.id,
      learning_path_slug: parsed.data.slug,
      lesson_number: parsed.data.lessonNumber,
      completed_at: now,
      updated_at: now,
    }, { onConflict: "user_id,learning_path_slug,lesson_number" });
    if (error) return NextResponse.json({ error: "Your lesson completion could not be saved." }, { status: 500 });
  } else {
    const { error } = await supabase.from("learning_library_progress").delete()
      .eq("user_id", auth.user.id)
      .eq("learning_path_slug", parsed.data.slug)
      .eq("lesson_number", parsed.data.lessonNumber);
    if (error) return NextResponse.json({ error: "Your lesson completion could not be updated." }, { status: 500 });
  }

  return NextResponse.json({ completed: parsed.data.completed });
}
