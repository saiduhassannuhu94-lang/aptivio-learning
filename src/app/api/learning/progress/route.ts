import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clampLessonPosition } from "@/lib/learning/progress";

const progressSchema = z.object({
  lessonId: z.string().uuid(),
  completed: z.boolean().default(false),
  positionSeconds: z.number().int().min(0).default(0),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let input: unknown;

  try {
    if (contentType.includes("application/json")) {
      input = await request.json();
    } else {
      const form = await request.formData();
      input = {
        lessonId: form.get("lessonId"),
        completed: form.get("completed") === "true",
        positionSeconds: Number(form.get("positionSeconds") ?? 0),
      };
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lesson progress data." }, { status: 400 });
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, section_id, duration_seconds")
    .eq("id", parsed.data.lessonId)
    .maybeSingle();

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const { data: section } = await supabase
    .from("course_sections")
    .select("course_version_id")
    .eq("id", lesson.section_id)
    .maybeSingle();

  if (!section) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const { data: version } = await supabase
    .from("course_versions")
    .select("course_id")
    .eq("id", section.course_version_id)
    .maybeSingle();

  if (!version) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("course_id", version.course_id)
    .eq("course_version_id", section.course_version_id)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: "An active enrolment for this course version is required." }, { status: 403 });
  }

  const { data: existingProgress, error: existingProgressError } = await supabase
    .from("lesson_progress")
    .select("is_completed, completed_at")
    .eq("enrollment_id", enrollment.id)
    .eq("lesson_id", lesson.id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existingProgressError) {
    return NextResponse.json({ error: "Existing lesson progress could not be loaded." }, { status: 500 });
  }

  const positionSeconds = clampLessonPosition(parsed.data.positionSeconds, lesson.duration_seconds);
  // Completion is monotonic: a routine playback-position save must not undo
  // a lesson the learner has already marked complete.
  const isCompleted = parsed.data.completed || existingProgress?.is_completed === true;
  const completedAt = existingProgress?.completed_at ??
    (isCompleted ? new Date().toISOString() : null);

  const { error: upsertError } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        enrollment_id: enrollment.id,
        lesson_id: lesson.id,
        user_id: auth.user.id,
        last_position_seconds: positionSeconds,
        is_completed: isCompleted,
        completed_at: completedAt,
      },
      { onConflict: "enrollment_id,lesson_id" },
    );

  if (upsertError) {
    return NextResponse.json({ error: "Progress could not be saved." }, { status: 500 });
  }

  const acceptsJson = contentType.includes("application/json");
  if (acceptsJson) {
    return NextResponse.json({ saved: true });
  }

  return NextResponse.redirect(new URL(`/learn/${lesson.id}?progress=saved`, request.url), 303);
}
