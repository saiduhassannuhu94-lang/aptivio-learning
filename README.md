# aptivio-learning

APTIVIO is a modern, mobile-first online learning platform designed to make quality education accessible to everyone, from absolute beginners to professionals. Learn practical skills, follow structured courses, track your progress, and grow at your own pace. Knowledge That Moves You Forward.

## Engineering documentation

- [Product foundation](docs/FOUNDATION.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Security model](docs/SECURITY.md)
- [Engineering blueprint](docs/ENGINEERING_BLUEPRINT.md)
- [Database foundation](docs/DATABASE.md)
- [Database testing](docs/DATABASE_TESTING.md)
- [200-course catalogue programme](docs/COURSE_CATALOGUE_200.md)
- [Authentication foundation](docs/AUTHENTICATION.md)
- [Assessment foundation](docs/ASSESSMENTS.md)
- [Paystack payment foundation](docs/PAYMENTS.md)

## Current implementation notes

- Supabase schema, RLS policies, and server-only workflow RPCs are tracked in `supabase/migrations/`.
- Database security assertions are in `supabase/tests/`.
- Learner assessment and payment API routes are under `src/app/api/`.
- Live Paystack processing is not enabled until production secrets and webhook configuration are supplied and verified.
- CI and production build status must be checked from GitHub Actions; do not infer success from a commit existing.
