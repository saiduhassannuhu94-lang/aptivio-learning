#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/validate-course-packages.mjs <package.json> [...]");
  process.exit(2);
}

const failures = [];
for (const file of files) {
  const fileFailures = [];
  let pkg;
  try {
    pkg = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    failures.push(`${file}: invalid JSON or unreadable file: ${error.message}`);
    continue;
  }

  const course = pkg?.course;
  const requireText = (value, label) => {
    if (typeof value !== "string" || value.trim().length < 3) {
      fileFailures.push(`${file}: ${label} must be a non-empty string of at least 3 characters`);
    }
  };
  requireText(pkg?.schema_version, "schema_version");
  requireText(course?.slug, "course.slug");
  requireText(course?.title, "course.title");
  requireText(course?.description, "course.description");

  if (course?.price_minor !== 0 || course?.currency !== "NGN") {
    fileFailures.push(`${file}: pilot courses must be free and denominated in NGN`);
  }
  if (!Array.isArray(course?.outcomes) || course.outcomes.length < 4) {
    fileFailures.push(`${file}: at least four measurable learning outcomes are required`);
  }
  if (!Array.isArray(course?.sections) || course.sections.length < 4) {
    fileFailures.push(`${file}: at least four sections are required`);
  }

  if (course?.sections?.length !== 4) {
    fileFailures.push(`${file}: exactly four sections are required`);
  }

  let lessonCount = 0;
  for (const [sectionIndex, section] of (course?.sections ?? []).entries()) {
    requireText(section?.title, `sections[${sectionIndex}].title`);
    if (!Array.isArray(section?.lessons) || section.lessons.length === 0) {
      fileFailures.push(`${file}: section ${sectionIndex + 1} must contain lessons`);
      continue;
    }
    for (const [lessonIndex, lesson] of section.lessons.entries()) {
      lessonCount += 1;
      const prefix = `sections[${sectionIndex}].lessons[${lessonIndex}]`;
      requireText(lesson?.title, `${prefix}.title`);
      if (typeof lesson?.body_markdown !== "string" || lesson.body_markdown.trim().length < 500) {
        fileFailures.push(`${file}: ${prefix}.body_markdown must contain at least 500 characters of teaching content`);
      }
      if (typeof lesson?.duration_minutes !== "number" || lesson.duration_minutes < 5) {
        fileFailures.push(`${file}: ${prefix}.duration_minutes must be at least 5`);
      }
      if (typeof lesson?.exercise !== "string" || lesson.exercise.trim().length < 20) {
        fileFailures.push(`${file}: ${prefix}.exercise must contain a meaningful task`);
      }
      if (!Array.isArray(lesson?.key_takeaways) || lesson.key_takeaways.length < 2) {
        fileFailures.push(`${file}: ${prefix}.key_takeaways must contain at least two items`);
      }
    }
  }
  if (lessonCount !== 16) {
    fileFailures.push(`${file}: exactly 16 lessons are required; found ${lessonCount}`);
  }

  const assessment = course?.assessment;
  if (!Array.isArray(assessment?.questions) || assessment.questions.length < 5) {
    fileFailures.push(`${file}: at least five assessment questions are required`);
  } else {
    for (const [questionIndex, question] of assessment.questions.entries()) {
      if (typeof question?.prompt !== "string" || question.prompt.trim().length < 20) {
        fileFailures.push(`${file}: assessment question ${questionIndex + 1} needs a meaningful prompt`);
      }
      if (typeof question?.marks !== "number" || question.marks < 1) {
        fileFailures.push(`${file}: assessment question ${questionIndex + 1} needs positive marks`);
      }
      if (!Array.isArray(question?.rubric) || question.rubric.length < 2) {
        fileFailures.push(`${file}: assessment question ${questionIndex + 1} needs a marking rubric`);
      }
    }
  }
  if (typeof assessment?.pass_mark_percent !== "number" || assessment.pass_mark_percent < 50 || assessment.pass_mark_percent > 100) {
    fileFailures.push(`${file}: assessment pass mark must be between 50 and 100`);
  }
  if (!course?.final_project?.deliverables?.length || !course?.final_project?.acceptance_criteria?.length) {
    fileFailures.push(`${file}: final project needs deliverables and acceptance criteria`);
  }
  if (!Array.isArray(course?.references) || course.references.length < 2) {
    fileFailures.push(`${file}: at least two references are required`);
  } else {
    for (const [referenceIndex, reference] of course.references.entries()) {
      if (typeof reference?.title !== "string" || typeof reference?.url !== "string" || !/^https:\/\//.test(reference.url)) {
        fileFailures.push(`${file}: reference ${referenceIndex + 1} needs a title and HTTPS URL`);
      }
    }
  }

  const status = course?.authoring_notes;
  if (status?.academic_review_status !== "not_reviewed" || status?.publication_status !== "not_published") {
    fileFailures.push(`${file}: draft package must not claim academic review or publication`);
  }
  if (status?.content_status !== "draft_for_technical_and_academic_review") {
    fileFailures.push(`${file}: draft content status is missing or invalid`);
  }

  if (fileFailures.length === 0) {
    console.log(`PASS ${file}: ${course.sections.length} sections, ${lessonCount} lessons, ${assessment.questions.length} assessment questions`);
  } else {
    failures.push(...fileFailures);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
