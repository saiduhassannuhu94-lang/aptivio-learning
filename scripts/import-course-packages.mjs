#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const target = targetArg ? targetArg.slice("--target=".length) : undefined;
const allowedLevels = new Set(["beginner", "intermediate", "advanced", "all_levels"]);

if (process.argv.slice(2).some((arg) => arg !== "--apply" && !arg.startsWith("--target="))) {
  console.error("Usage: node scripts/import-course-packages.mjs [--target=staging|production] [--apply]");
  process.exit(2);
}

const directory = resolve(process.cwd(), "content/batch-01");
const filenames = (await readdir(directory)).filter((filename) => filename.endsWith(".json")).sort();

if (filenames.length !== 20) {
  console.error("Batch 1 must contain exactly 20 JSON course packages. Found:", filenames.length);
  process.exit(1);
}

const packages = [];
const slugs = new Set();
for (const filename of filenames) {
  const filePath = resolve(directory, filename);
  let packageData;
  try {
    packageData = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    console.error(filename, "is not valid JSON:", error.message);
    process.exit(1);
  }

  const course = packageData?.course;
  const valid =
    packageData?.schema_version === "aptivio.course-package.v1" &&
    typeof course?.slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(course.slug) &&
    typeof course?.title === "string" &&
    allowedLevels.has(course.level) &&
    course.price_minor === 0 &&
    course.currency === "NGN" &&
    Array.isArray(course.sections) &&
    course.sections.length === 4 &&
    course.sections.every((section) => Array.isArray(section.lessons) && section.lessons.length === 4) &&
    typeof course.assessment?.title === "string" &&
    typeof course.assessment?.instructions === "string" &&
    Array.isArray(course.assessment?.questions) &&
    course.assessment.questions.length >= 5 &&
    course.assessment.questions.every((question) =>
      typeof question.id === "string" &&
      typeof question.prompt === "string" &&
      typeof question.marks === "number" &&
      question.marks > 0 &&
      Array.isArray(question.rubric) &&
      question.rubric.length >= 2
    ) &&
    course.assessment.total_marks === course.assessment.questions.reduce((sum, question) => sum + question.marks, 0) &&
    Array.isArray(course.final_project?.deliverables) &&
    course.final_project.deliverables.length > 0 &&
    Array.isArray(course.final_project?.acceptance_criteria) &&
    course.final_project.acceptance_criteria.length > 0 &&
    Array.isArray(course.references) &&
    course.references.length >= 2 &&
    course.references.every((reference) => typeof reference.url === "string" && reference.url.startsWith("https://")) &&
    course.authoring_notes?.content_status === "draft_for_technical_and_academic_review" &&
    course.authoring_notes?.academic_review_status === "not_reviewed" &&
    course.authoring_notes?.publication_status === "not_published";

  if (!valid) {
    console.error(filename, "failed import-safety validation.");
    process.exit(1);
  }
  if (slugs.has(course.slug)) {
    console.error("Duplicate course slug:", course.slug);
    process.exit(1);
  }
  slugs.add(course.slug);
  packages.push({ filename, packageData, slug: course.slug, title: course.title });
}

console.log("APTIVIO Batch 1 import preflight");
console.log("Packages:", packages.length);
console.log("Sections:", packages.reduce((sum, item) => sum + item.packageData.course.sections.length, 0));
console.log("Lessons:", packages.reduce((sum, item) => sum + item.packageData.course.sections.reduce((n, section) => n + section.lessons.length, 0), 0));
console.log("Assessment questions:", packages.reduce((sum, item) => sum + item.packageData.course.assessment.questions.length, 0));
console.log("Mode:", apply ? "APPLY" : "DRY RUN");
console.log("Target:", target || "not selected");
console.log("All imported courses are created as unpublished drafts.");

if (!apply) {
  for (const item of packages) console.log("DRY RUN", item.slug, "-", item.title);
  console.log("No database connection was opened. Re-run with --apply and an explicit target to import.");
  process.exit(0);
}

if (!["staging", "production"].includes(target || "")) {
  console.error("Applying requires an explicit --target=staging or --target=production.");
  process.exit(2);
}

if (target === "production" && process.env.APTIVIO_ALLOW_PRODUCTION_IMPORT !== "YES") {
  console.error("Production import blocked. Set APTIVIO_ALLOW_PRODUCTION_IMPORT=YES only after release approval.");
  process.exit(2);
}

const prefix = target === "production" ? "APTIVIO_PRODUCTION" : "APTIVIO_STAGING";
const supabaseUrl = process.env[prefix + "_SUPABASE_URL"];
const secretKey = process.env[prefix + "_SUPABASE_SECRET_KEY"];

if (!supabaseUrl || !secretKey) {
  console.error("Missing " + prefix + "_SUPABASE_URL or " + prefix + "_SUPABASE_SECRET_KEY.");
  process.exit(2);
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

let inserted = 0;
let unchanged = 0;
const failures = [];
for (const item of packages) {
  const { data, error } = await supabase.rpc("import_course_package", {
    p_package: item.packageData,
  });
  if (error) {
    failures.push({ slug: item.slug, message: error.message });
    console.error("FAILED", item.slug, error.message);
    break;
  }
  if (data?.inserted) inserted += 1;
  else unchanged += 1;
  console.log(data?.inserted ? "IMPORTED" : "UNCHANGED", item.slug, data?.course_version_id || "");
}

console.log(JSON.stringify({ target, total: packages.length, inserted, unchanged, failures }, null, 2));
if (failures.length > 0) process.exit(1);
