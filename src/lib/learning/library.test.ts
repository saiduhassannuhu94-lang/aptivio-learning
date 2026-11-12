import { describe, expect, it } from "vitest";
import { getLessonCount, learningPackages } from "./library";

describe("learning library package normalization", () => {
  it("exposes all twenty learning paths", () => {
    expect(learningPackages).toHaveLength(20);
  });

  it("normalizes four sections and sixteen lessons for every path", () => {
    for (const item of learningPackages) {
      expect(item.sections, item.course.slug).toHaveLength(4);
      expect(getLessonCount(item), item.course.slug).toBe(16);
      expect(item.sections.every((section) => section.lessons.length > 0)).toBe(true);
    }
  });

  it("keeps each lesson's reading content available", () => {
    for (const item of learningPackages) {
      for (const section of item.sections) {
        for (const lesson of section.lessons) {
          expect(lesson.body_markdown.length, item.course.slug).toBeGreaterThan(500);
          expect(lesson.exercise.length).toBeGreaterThan(0);
          expect(lesson.key_takeaways.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
