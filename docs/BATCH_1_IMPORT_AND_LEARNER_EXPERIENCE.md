# Batch 1 Import and Learner-Experience Plan

**Status:** mapping and gap analysis only. No course package has been imported into Supabase.

## Existing database mapping

The current schema can represent the core catalogue and lesson structure:

| Package field | Current database destination | Mapping |
|---|---|---|
| `course.slug` | `courses.slug` | Unique stable slug |
| `course.level` | `courses.level` | Must match the existing `course_level` enum |
| `course.language_code` | `courses.language_code` | Language code |
| `course.price_minor` / `currency` | `courses.price_minor` / `currency` | Batch 1 remains zero NGN |
| `course.title`, `subtitle`, `description` | `course_versions` | Versioned learner-facing metadata |
| `outcomes`, `prerequisites`, `target_audience` | `course_versions` | Text arrays |
| `duration_minutes` | `course_versions.duration_minutes` | Course duration |
| `sections[]` | `course_sections` | Preserve array order as `sort_order` |
| `lessons[]` | `lessons` | Preserve order; store Markdown body; convert lesson minutes to seconds |
| `lesson.title` | `lessons.title` | Plain text |
| `lesson.body_markdown` | `lessons.body_markdown` | Selectable Markdown source |
| `lesson.duration_minutes` | `lessons.duration_seconds` | Multiply by 60 |
| `lesson.exercise`, `key_takeaways` | Lesson body | Append as structured Markdown sections unless dedicated fields are added |

All imports must create `courses.status = 'draft'`. They must not set `published_version_id`, `published_at`, `reviewed_by`, `reviewed_at` or `review_date`.

## Important schema gaps

The course package contains more than the current database can safely represent.

### 1. Final assessment incompatibility

Batch 1 assessments include short answer, algorithm design, trace, debugging, testing and project submissions with marking rubrics. The existing quiz schema currently restricts auto-graded quiz question types to:
- `single_choice`
- `multiple_choice`
- `true_false`

The current answer-key model is designed for option IDs. It cannot safely represent a free-response answer with a rubric or a project submission. Do not coerce these questions into multiple-choice records or pretend that automatic grading exists.

**Required design:** add an assignment/assessment model that supports question type, prompt, marks, rubric, submission format, learner submission, reviewer/marker identity, awarded marks, feedback, grading status and timestamps. Keep answer keys private and do not expose them through learner-facing queries.

### 2. Project and reference preservation

The package's final project deliverables, acceptance criteria, references, equipment and accessibility guidance do not have dedicated columns in the current course schema.

**Required design:** versioned course resources or structured JSON fields with strict validation. These must be included in the content fingerprint so a reviewer approves the same content the learner receives.

### 3. Category assignment

The database has a categories table, but the package schema currently does not assign a category ID. Map courses to an existing category by a controlled category slug. Do not create duplicate categories or infer category IDs from array order.

### 4. Version integrity

Every course must be versioned. Enrolments must point to the exact version, and learner lesson access must remain scoped to that version. Re-importing a package must not silently overwrite a version already reviewed or published.

## Importer requirements

The importer should be a deterministic, idempotent command-line script that:

1. Reads package files from `content/batch-01`.
2. Validates the package schema and course slug.
3. Produces a dry-run summary by default.
4. Requires an explicit `--apply` flag to write.
5. Requires a server-only Supabase credential from the environment; never accepts secrets as command-line arguments or writes them to logs.
6. Uses a database transaction or a narrowly scoped import RPC so a partially imported course cannot be left behind.
7. Creates only draft records.
8. Uses a stable external package identifier or import ledger to prevent duplicate course/version creation.
9. Refuses to overwrite a course version if it has any review decision, enrolment or publication pointer.
10. Reports inserted, skipped and failed records without exposing credentials or private data.

The import must be tested against a disposable database first. The production project must not be used for importer development or dry-run testing.

## Learner experience acceptance criteria

Before the Batch 1 courses can be considered usable:

- Catalogue cards show only published courses.
- Course details show outcomes, prerequisites, duration and a real ordered curriculum.
- A learner can enrol in a free course without payment configuration.
- The learner reader returns lesson bodies only after checking the exact course version and enrolment.
- Previous/next navigation never crosses into another course or version.
- Lesson progress is authenticated, bounded and retry-safe.
- Dashboard progress is calculated from real lesson records.
- Assessments distinguish auto-graded objective questions from written/project work.
- Written/project submissions have clear instructions, upload/text rules, marking rubrics and feedback.
- Mobile layout remains usable on narrow screens and slow connections.
- Empty, loading, unavailable, forbidden and error states are all deliberate.

## Release gates

1. Complete the academic review database gate.
2. Complete the assignment and rubric assessment model.
3. Build and test the importer against a disposable database.
4. Integrate learner-reader work with the content packages.
5. Import all 20 courses as drafts into a non-production environment.
6. Test real learner journeys and cross-account isolation.
7. Obtain authorised academic decisions for each version.
8. Obtain explicit approval before production import or publication.

**A course package being present in GitHub is not the same as a course being present in Supabase, visible in the catalogue, or available to learners.**
