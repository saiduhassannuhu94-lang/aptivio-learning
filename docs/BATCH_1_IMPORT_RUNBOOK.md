# Batch 1 import runbook

## What the importer does

- Reads exactly 20 JSON packages from content/batch-01.
- Refuses duplicate slugs, unsupported course levels, non-free pricing, missing sections/lessons, missing assessment rubrics, or review/publication metadata that is not explicitly draft.
- Defaults to dry-run and does not open a database connection.
- Calls the transactional import_course_package RPC when --apply is supplied.
- Imports each course as status=draft with no published_version_id and no review metadata.
- Preserves lesson exercises and key takeaways in lesson Markdown.
- Preserves the six written/rubric-based assessment questions, final project, references, equipment and accessibility notes in course_assessments.
- Uses a package fingerprint and import ledger for safe retries. A changed package is refused rather than silently overwriting an existing version.

## Database setup

The SQL proposal is in supabase/sql/batch1_course_import.sql. It is not a migration and has not been applied.

Before any environment is changed:
1. Create a Supabase development branch or disposable project.
2. Run supabase migration new batch1_course_import.
3. Review the generated migration and copy the reviewed SQL proposal into it.
4. Run the migration on the disposable database.
5. Verify RLS, service-role-only import RPC permissions, idempotent retry, slug collision rejection and rollback on malformed content.
6. Run Supabase security advisors and database tests.
7. Only then prepare a production migration for explicit approval.

## Dry-run

Run:

    npm run validate:courses
    npm run import:courses

The default importer mode validates all 20 packages and prints the planned import. It does not connect to Supabase.

## Apply to a staging environment

Set these server-side environment variables in a trusted shell or CI secret store:

- APTIVIO_STAGING_SUPABASE_URL
- APTIVIO_STAGING_SUPABASE_SECRET_KEY

Then run:

    npm run import:courses -- --target=staging --apply

Never put a secret key in source control, browser code, NEXT_PUBLIC variables, screenshots or command-line arguments.

## Production

Production import is deliberately blocked unless both explicit flags are supplied:

- APTIVIO_PRODUCTION_SUPABASE_URL
- APTIVIO_PRODUCTION_SUPABASE_SECRET_KEY
- APTIVIO_ALLOW_PRODUCTION_IMPORT=YES

Then:

    npm run import:courses -- --target=production --apply

This imports drafts only. It does not publish courses or enable learner enrolment. Academic review, assessment submission/grading UX, database-enforced publication approval and a separate release approval remain mandatory.

## Current release boundary

The existing production catalogue remains unchanged until a reviewed migration and import are approved. The importer and SQL proposal are code artifacts, not evidence that any course has been inserted into Supabase.
