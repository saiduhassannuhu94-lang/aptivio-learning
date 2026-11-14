# APTIVIO Academic Review and Publishing Gate

**Status:** design specification only. No production database changes have been made.

## Why this gate is required

The current database has a `course_status` enum with `draft`, `in_review`, `published` and `archived`. The current `app_role` enum contains `admin`, `content_manager` and `support`. Course content managers can currently write course, version, section and lesson records, while course publication is represented by updating the course row.

The `course_versions` table has `review_date`, `reviewed_by` and `reviewed_at` columns, but those columns alone do not prove that a valid academic review took place. There is no append-only academic decision history table, no dedicated academic reviewer role, and no database-enforced rule that a published version must have a valid approval.

A user interface that hides the Publish button is not an adequate control. The database must reject publication without a valid approval, even if a caller sends a direct API request.

## Roles and separation of duties

| Role | Responsibility | Must not be able to |
|---|---|---|
| Admin | Assign roles, manage platform configuration and emergency operations | Fabricate an academic decision on behalf of a reviewer |
| Content manager | Create and revise course drafts, submit versions for review | Approve their own content or publish an unapproved version |
| Academic reviewer | Review a specific immutable course version and record a decision | Edit the submitted course content or approve their own authored version |
| Support | Help users and investigate support issues | Edit, review or publish course content |
| Learner | Browse published catalogue and access authorised course versions | Read draft content or other learners' private progress |

Academic reviewer assignment must be explicit and controlled by an administrator. Do not use user-editable profile metadata or client-supplied role strings for authorization. Use the existing trusted `user_roles` table and the database role-check helper.

## Review record

Introduce an append-only `course_reviews` table with:

- `id`: UUID primary key.
- `course_version_id`: foreign key to the exact version being reviewed.
- `reviewer_user_id`: foreign key to `auth.users`.
- `decision`: constrained to `approved` or `revision_required`.
- `review_notes`: required text with a reasonable minimum and maximum length.
- `content_fingerprint`: SHA-256 fingerprint of the version metadata, ordered sections and ordered lesson content at the time of review.
- `created_at`: server-generated timestamp.

A review decision is about a version, not a course slug. If content changes, it must become a new version and receive a new review. Do not update or delete prior review records to rewrite history.

## Fingerprint and immutability

The fingerprint must be calculated by trusted database code from canonical, ordered content. Do not accept a fingerprint supplied by a browser as proof of what was reviewed.

The canonical input should include:
- course identity and version number;
- title, subtitle, description, outcomes, prerequisites, audience and duration;
- section titles, descriptions and sort order;
- lesson titles, type, body, media reference, duration, preview state and sort order;
- assessment definitions and project requirements once those are represented in the database schema.

The existing project has `pgcrypto` installed. Use SHA-256 and deterministic JSON construction with explicit ordering. Ensure nulls, arrays and text encoding are handled consistently.

After an approval is recorded, freeze the reviewed version and its child content. A content manager who needs to make a correction must create a new version, copy the content into that version, edit it there and submit the new version. This avoids a previously approved version silently changing after review.

## Required database enforcement

1. Add an `academic_reviewer` value to the trusted application role enum.
2. Create `course_reviews` with foreign keys, decision constraints, reviewer/version indexes and RLS enabled.
3. Permit authenticated academic reviewers to insert a decision only when they hold the trusted role and are not the version author. Reviewers must not update or delete review records.
4. Permit reviewers to read the review history needed for their work; do not expose internal review notes to anonymous visitors or learners.
5. Add a trusted fingerprint function with a fixed search path and narrowly scoped execution privileges.
6. Prevent changes to an approved version's metadata, sections, lessons and associated assessment content. A new version is the only edit path after approval.
7. Add a publication guard. A transition to `published` must reference a version belonging to that course and must have a matching `approved` review whose fingerprint equals the current database fingerprint.
8. Populate `reviewed_by`, `reviewed_at` and `review_date` from the real review record in the publication transaction. Never accept those values from a client request.
9. Ensure a course cannot point to a version belonging to a different course.
10. Keep existing published course versions readable according to current enrolment and preview policies; new publication rules must not accidentally expose drafts.

The publication guard must be enforced in the database trigger or a narrowly scoped database function, not only in a Next.js server action. Any privileged function must use an empty or fixed `search_path`, validate `auth.uid()` and the trusted role, and have EXECUTE revoked from `PUBLIC` unless explicitly granted.

## Application workflow

1. **Draft:** content manager creates a course and version. It remains invisible to learners.
2. **Submit:** content manager marks the version `in_review`. The submitted content becomes read-only for the review period.
3. **Review:** an authorised reviewer opens the exact version, checks outcomes, lessons, examples, references, assessments, accessibility and curriculum alignment.
4. **Decision:** reviewer records `approved` or `revision_required` with meaningful notes. The system records the reviewer identity, timestamp and fingerprint.
5. **Revision:** if changes are required, the content manager creates a new version and resubmits it. Previous review history remains intact.
6. **Publish:** an authorised publishing actor publishes only a version with a matching valid approval. The database guard verifies the approval and writes review metadata.
7. **Maintain:** published content is immutable. Corrections require a new version and another review. Existing enrolments remain pinned to their enrolled version according to the platform's version-access policy.

## Required automated tests

- Anonymous user cannot read draft course versions, draft sections or draft lesson bodies.
- Content manager can create and edit an unapproved draft.
- Content manager cannot insert an academic decision.
- Academic reviewer can read a submitted version and record a decision.
- User without the academic reviewer role cannot insert a review.
- A content author cannot approve their own version.
- A review cannot be updated or deleted through the Data API.
- Publishing without an approval fails.
- Publishing a different version from the approved version fails.
- Publishing after lesson, section or metadata content has changed fails.
- Editing an approved version fails; creating a new version remains possible.
- A valid approval allows publication and populates review metadata from the actual review record.
- A reviewer cannot read or alter unrelated private learner data.
- Existing learner access to previously published versions continues to work.
- Two simultaneous publication attempts cannot produce inconsistent published-version pointers.

Tests must run inside rollback transactions with synthetic users and content. A test that only asserts the Publish button is hidden is insufficient.

## Deployment sequence

1. Generate the migration using the Supabase CLI from the repository's linked project workflow.
2. Review the generated SQL and confirm it does not alter existing course records or fabricated review metadata.
3. Run database tests against a disposable local/test database.
4. Run Supabase security and performance advisors.
5. Deploy the migration to a preview/staging project and verify RLS and publication denial cases.
6. Deploy application review screens after the database contract is stable.
7. Assign a real academic reviewer through an authorised administrator.
8. Import Batch 1 as drafts, not published content.
9. Complete real academic reviews and publish only approved versions after explicit production approval.

## Current verified gap

- Existing role enum: `admin`, `content_manager`, `support`.
- Existing role assignments at the time of inspection: zero.
- Existing course status values: `draft`, `in_review`, `published`, `archived`.
- Existing review metadata columns: `review_date`, `reviewed_by`, `reviewed_at`.
- Dedicated review history and database-enforced academic approval gate: not present.

**Do not mark the review workflow complete until the migration, RLS policies, database tests, application screens and real reviewer assignment have all been verified.**
