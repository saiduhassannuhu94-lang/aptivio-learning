# APTIVIO Architecture and Data Model

**Status:** Proposed baseline; validate before schema migrations.

## 1. Architectural shape

APTIVIO starts as a modular monolith: one Next.js application, one Supabase project, and clearly separated domain modules. A module owns its validation, business rules, data access, and tests. Modules may share database transactions where necessary, but must not bypass another module's authorisation rules.

Suggested application boundaries:

- `identity`: user profile, role resolution, account lifecycle
- `catalogue`: categories, course discovery, publication state
- `content`: course versions, sections, lessons, protected resources
- `enrolment`: learner-course entitlement and access windows
- `learning`: lesson completion and progress summaries
- `assessment`: quizzes, questions, attempts, grading
- `payments`: payment intents, provider verification, webhook events, refunds
- `administration`: moderation, publishing workflow, audit events

The browser is an untrusted client. Server-side actions and database policies enforce all privileged operations.

## 2. Initial logical data model

Use UUID primary keys unless a provider requires an external identifier. Add `created_at` and `updated_at` where they provide useful auditability. Use foreign keys and explicit uniqueness constraints rather than relying on application code alone.

### Identity and administration

- `profiles`: `id` (references auth.users), `display_name`, `avatar_path`, `locale`, timestamps. A profile is not an authority for privileged role assignment.
- `user_roles`: `user_id`, `role`, `granted_by`, `granted_at`. Only trusted administrative processes can grant or revoke roles. Consider a constrained role enum or check constraint.
- `admin_audit_logs`: actor, action, target type/id, timestamp, and minimal structured metadata. Restrict reads to authorised administrators; do not store secrets or unnecessary personal data.

### Catalogue and course content

- `categories`: name, slug, description, active state.
- `courses`: stable course identity, slug, category, owner, publication state, current published version reference, timestamps.
- `course_versions`: course, version number, title, summary, target audience, level, outcomes, prerequisites, language, estimated duration, price amount in minor units, currency, access terms, review metadata, and lifecycle state.
- `course_sections`: course version, title, description, ordering.
- `lessons`: section, title, lesson type, body/content reference, ordering, estimated duration, publication state.
- `course_resources`: lesson/course version, storage object path, resource type, visibility and metadata.

Published content should be immutable by version. Editing a live course creates a new draft version; publishing changes the active version pointer. Existing enrolments must have explicit, documented rules for whether they retain their enrolled version or move to a newer version.

### Enrolment and learning

- `enrolments`: learner, course version, source (free, payment, admin grant), status, granted time, optional expiry, and originating verified payment reference. Add uniqueness rules that prevent duplicate active entitlements for the same learner and course access policy.
- `lesson_progress`: learner, enrolment, lesson, status, completed time, last activity. Enforce one progress row per learner/enrolment/lesson.
- `quiz_attempts`: learner, quiz, enrolment, attempt number, submitted time, score, grading status.
- `quiz_responses`: attempt, question, response payload, awarded score, feedback visibility. Keep answer keys and grading logic server-side.

### Payments

- `payments`: learner, course/version, provider, provider reference, amount minor units, currency, status, verified time, and safe provider metadata.
- `payment_webhook_events`: provider event identifier, event type, received time, processing state, processed time, and minimal diagnostic metadata. Enforce unique provider event IDs for idempotency.
- `refunds`: payment, provider refund reference, amount minor units, status, requested/processed times, and authorised actor where relevant.

A payment record is not itself an entitlement. A verified successful payment must pass business checks before an enrolment is granted. Browser redirects never grant access.

## 3. Relationship summary

- One auth user has one profile and may have multiple explicitly granted roles.
- A course has many immutable versions; each version has ordered sections and lessons.
- An enrolment belongs to one learner and one course version under a defined access policy.
- Lesson progress belongs to an enrolment and a lesson within its authorised course version.
- A quiz attempt belongs to a learner and an authorised enrolment.
- A payment may result in at most one corresponding entitlement under the applicable purchase policy.
- Webhook events are deduplicated by provider event identity and/or a provider transaction reference.

## 4. Critical invariants

1. A learner can read only published catalogue content and lesson content covered by a valid entitlement, except explicitly public preview lessons.
2. A learner can modify only their own permitted profile fields, progress, and quiz submissions.
3. A learner cannot set their own role, payment status, enrolment status, score, completion state, or certificate status through arbitrary client writes.
4. Only authorised administrators can create/review/publish course versions or grant/revoke manual entitlements.
5. Every paid entitlement is traceable to a server-verified payment or a documented authorised administrative grant.
6. Payment processing and webhook handling are safe to retry.
7. Course-version changes do not silently alter the content or access promise attached to an existing purchase.

## 5. Query and performance approach

- Index foreign keys and frequent filters: published state, category/slug, course version, learner ID, enrolment status, lesson ordering, payment provider reference, and webhook event ID.
- Paginate catalogue and admin lists.
- Fetch only fields required by the current view.
- Avoid loading full course media or all learner history on dashboard initial render.
- Add database constraints for invariants that can be represented safely in SQL.
- Measure real mobile performance before adding caching complexity.

## 6. Open design questions

- Exact role set and whether instructors exist in MVP (default: learner and administrator only).
- Whether course access is lifetime or time-limited per purchase.
- Whether existing enrolments remain pinned to a course version.
- Quiz retake limits, grading rules, and passing thresholds.
- Which lesson types and preview rules are needed in the first pilot.
- Whether certificates are excluded entirely from MVP (recommended until meaning and verification are defined).
