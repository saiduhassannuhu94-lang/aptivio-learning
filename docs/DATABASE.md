# APTIVIO database foundation

Project: `aptivio-learning`
Project ref: `jxcwojyaywmxfzmgobsp`
PostgreSQL: 17

## Current schema

The initial database foundation contains:

- `profiles`: learner profile data linked to Supabase Auth.
- `user_roles`: server-managed administrative roles.
- `categories`: course catalogue categories.
- `courses`: course identity, publication state, language, and price.
- `course_versions`: reviewed, versioned course metadata and learning outcomes.
- `course_sections` and `lessons`: version-specific learning content.
- `enrollments`: learner access and the purchase-time price snapshot.
- `lesson_progress`: learner-owned progress records.
- `admin_audit_logs`: server-managed administrative audit trail.

Money is stored as integer minor units with an ISO 4217 currency code. The initial default is NGN.

## Access model

- RLS is enabled on every table in the exposed `public` schema.
- Anonymous users can read only published catalogue data and preview lessons.
- Authenticated users can read their own profile, enrolments, and progress.
- Learners can enrol directly only in published free courses.
- Paid enrolments must be created by a trusted server-side payment workflow after payment verification.
- Administrative roles are stored in `user_roles`, which has no browser-role table grants.
- Authorization helper functions live in the non-exposed `private` schema and use a fixed empty search path.
- Audit logs are server-managed and not client-readable.
- Explicit table grants are used because table grants and RLS policies are separate controls.

## Migration tracking note

The initial schema was provisioned directly in the hosted project during iterative development. The first tracked migration currently records the subsequent internal-table hardening. A clean, replayable baseline migration still needs to be generated and reconciled with the hosted migration history using the Supabase CLI before any fresh environment or production deployment is provisioned.

Do not treat this project as production-ready until that baseline reconciliation, automated RLS tests, authentication flows, and payment verification are complete.
