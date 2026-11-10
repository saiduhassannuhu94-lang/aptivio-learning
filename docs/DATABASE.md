# APTIVIO database foundation

Project: `aptivio-learning`
Project ref: `jxcwojyaywmxfzmgobsp`
PostgreSQL: 17

## Current schema

### Identity, catalogue and learning

- `profiles`: learner profile data linked to Supabase Auth.
- `user_roles`: server-managed administrative roles.
- `categories`: course catalogue categories.
- `courses`: course identity, publication state, language, and price.
- `course_versions`: reviewed, versioned course metadata and learning outcomes.
- `course_sections` and `lessons`: version-specific learning content.
- `enrollments`: learner access and the purchase-time price snapshot; paid enrolments reference a payment record.
- `lesson_progress`: learner-owned progress records.
- `admin_audit_logs`: server-managed administrative audit trail.

### Assessment

- `quizzes`: course-version-scoped assessment rules, pass mark, time limit, and attempt limit.
- `quiz_questions`: prompts, safe option lists, points, and order.
- `quiz_answer_keys`: correct option IDs, with no browser-role grants.
- `quiz_attempts`: server-created attempts and server-calculated scores.
- `quiz_attempt_answers`: learner responses and awarded points, written only by the trusted server workflow.

### Payments

- `payments`: learner, course/version, Paystack reference, amount in minor units, currency, status, and verification details.
- `payment_webhook_events`: idempotent webhook event records and processing state.

Refunds, chargeback operations, certificates, and automated instructor payouts are not implemented.

## Access model

- RLS is enabled on every table in the exposed `public` schema.
- Anonymous users can read only published catalogue data and preview lessons.
- Authenticated users can read their own profile, enrolments, progress, attempts, and payments, subject to table-specific policies.
- Learners can enrol directly only in published free courses.
- Course access is version-scoped: an enrolment unlocks the exact course version purchased, not a later or unpublished version.
- Paid enrolments are created only by the restricted server-side payment fulfilment RPC after Paystack transaction verification.
- Quiz answer keys and webhook event records have no browser-role table grants.
- Learners cannot create attempts, submit scores, update grades, create payment records, or mark payments successful through the Data API.
- Attempt creation, grading, and payment fulfilment RPCs are executable only by `service_role`.
- Published quiz content and answer keys are frozen on first publication. Unpublishing hides a quiz but does not unlock it for editing; a revised assessment requires a new quiz record.
- Administrative roles are stored in `user_roles`, which has no browser-role table grants.
- Authorization helper functions live in the non-exposed `private` schema and use a fixed empty search path.
- Audit logs are server-managed and not client-readable.
- Explicit table grants are used because table grants and RLS policies are separate controls.

## Migrations and reproducibility

The initial schema was provisioned directly in the hosted project during iterative development. The first tracked migration records subsequent hardening, not the original creation of every base table. The current assessment, payment, and security changes are tracked under `supabase/migrations/`.

The initial baseline still needs to be reconciled into a clean, replayable migration history before provisioning a fresh environment. Do not deploy a new database from the current migration folder alone until that baseline is generated and tested.

## Verification

- The committed pgTAP assessment/payment security suite has 32 assertions and has been executed against the linked Supabase project.
- The suite verifies table existence, RLS, client grants, server-only RPC permissions, quiz publication immutability, attempt start/submission/attempt limits, and atomic payment fulfilment/idempotency.
- Security and health advisors must be re-run after schema changes.
- The performance advisor may report unused indexes while the project has no real workload; retain justified foreign-key and policy indexes until query telemetry supports a change.
- The local Supabase CLI workflow, full GitHub CI, and production build have not yet been verified.

Do not treat APTIVIO as production-ready until baseline migration reconciliation, local database replay, application-level tests with separate learner identities, real auth round-trips, and Paystack test transactions have passed.
