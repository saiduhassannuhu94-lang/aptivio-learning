import { describe, expect, it } from "vitest";
import {
  clampLessonPosition,
  summarizeCourseProgress,
  summarizeOverallProgress,
} from "./progress";

describe("summarizeCourseProgress", () => {
  it("counts only completed lessons belonging to the requested enrollment", () => {
    const result = summarizeCourseProgress("enrollment-a", ["lesson-1", "lesson-2"], [
      { enrollment_id: "enrollment-a", lesson_id: "lesson-1", is_completed: true },
      { enrollment_id: "enrollment-a", lesson_id: "lesson-2", is_completed: false },
      { enrollment_id: "enrollment-b", lesson_id: "lesson-2", is_completed: true },
    ]);

    expect(result).toEqual({
      completedLessons: 1,
      totalLessons: 2,
      progressPercent: 50,
    });
  });

  it("ignores duplicate progress records and lesson IDs", () => {
    const result = summarizeCourseProgress("enrollment-a", ["lesson-1", "lesson-1"], [
      { enrollment_id: "enrollment-a", lesson_id: "lesson-1", is_completed: true },
      { enrollment_id: "enrollment-a", lesson_id: "lesson-1", is_completed: true },
    ]);

    expect(result).toEqual({
      completedLessons: 1,
      totalLessons: 1,
      progressPercent: 100,
    });
  });

  it("ignores completed progress for lessons outside the enrolled version", () => {
    const result = summarizeCourseProgress("enrollment-a", ["current-lesson"], [
      { enrollment_id: "enrollment-a", lesson_id: "old-version-lesson", is_completed: true },
    ]);

    expect(result).toEqual({
      completedLessons: 0,
      totalLessons: 1,
      progressPercent: 0,
    });
  });

  it("returns zero progress for an empty curriculum", () => {
    expect(summarizeCourseProgress("enrollment-a", [], [])).toEqual({
      completedLessons: 0,
      totalLessons: 0,
      progressPercent: 0,
    });
  });
});

describe("summarizeOverallProgress", () => {
  it("weights courses by their actual lesson counts", () => {
    expect(summarizeOverallProgress([
      { completedLessons: 1, totalLessons: 2, progressPercent: 50 },
      { completedLessons: 8, totalLessons: 10, progressPercent: 80 },
    ])).toEqual({
      completedLessons: 9,
      totalLessons: 12,
      progressPercent: 75,
    });
  });

  it("handles no enrolled courses", () => {
    expect(summarizeOverallProgress([])).toEqual({
      completedLessons: 0,
      totalLessons: 0,
      progressPercent: 0,
    });
  });
});

describe("clampLessonPosition", () => {
  it("clamps playback position to the known lesson duration", () => {
    expect(clampLessonPosition(150, 90)).toBe(90);
  });

  it("does not clamp when lesson duration is unknown", () => {
    expect(clampLessonPosition(150, 0)).toBe(150);
  });
});
