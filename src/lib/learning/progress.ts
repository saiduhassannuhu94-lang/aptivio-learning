export type LessonProgressRecord = {
  enrollment_id: string;
  lesson_id: string;
  is_completed: boolean;
};

export type CourseProgressSummary = {
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
};

export function summarizeCourseProgress(
  enrollmentId: string,
  lessonIds: readonly string[],
  progressRecords: readonly LessonProgressRecord[],
): CourseProgressSummary {
  const uniqueLessonIds = new Set(lessonIds);
  let completedLessons = 0;
  const counted = new Set<string>();

  for (const record of progressRecords) {
    if (
      record.enrollment_id !== enrollmentId ||
      !record.is_completed ||
      !uniqueLessonIds.has(record.lesson_id) ||
      counted.has(record.lesson_id)
    ) continue;

    counted.add(record.lesson_id);
    completedLessons += 1;
  }

  const totalLessons = uniqueLessonIds.size;
  return {
    completedLessons,
    totalLessons,
    progressPercent: totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0,
  };
}

export function summarizeOverallProgress(
  courses: readonly CourseProgressSummary[],
): CourseProgressSummary {
  const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0);
  const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0);

  return {
    completedLessons,
    totalLessons,
    progressPercent: totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0,
  };
}

const MAX_POSTGRES_INTEGER = 2_147_483_647;

export function clampLessonPosition(positionSeconds: number, durationSeconds: number): number {
  const maximum = durationSeconds > 0
    ? Math.min(durationSeconds, MAX_POSTGRES_INTEGER)
    : MAX_POSTGRES_INTEGER;
  return Math.min(positionSeconds, maximum);
}
