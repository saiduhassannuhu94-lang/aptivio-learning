# APTIVIO

APTIVIO is a free learning and reasoning-practice hub. It is **not** a formal online school, LMS clone, certification marketplace, or clinical IQ-testing service.

Learners explore practical topics, study guided explanations and concept diagrams, work through real-life examples, test their understanding, and practise reasoning. The goal is understanding and measurable personal progress, not collecting enrolments or certificates.

## Current first-release scope

- 20 self-paced learning paths, 80 sections and 320 guided lessons.
- Teaching-first lesson pages with concept diagrams, worked examples, code samples, practice tasks and self-checks.
- Five independent reasoning areas: logical, numerical, verbal, spatial and memory.
- Timed challenge attempts with server-side scoring, explanations and personal attempt history.
- Account-backed lesson progress and a learner dashboard.
- Free access. No enrolment or payment is required for the learning library or reasoning challenges.

Challenge results are practice scores, not standardised IQ scores. Learning materials are early-access content and are not accredited qualifications.

## Engineering documentation

- [Product foundation](docs/FOUNDATION.md)
- [Product direction](docs/PRODUCT_DIRECTION.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Security model](docs/SECURITY.md)
- [Engineering blueprint](docs/ENGINEERING_BLUEPRINT.md)
- [Database foundation](docs/DATABASE.md)
- [Database testing](docs/DATABASE_TESTING.md)
- [Authentication foundation](docs/AUTHENTICATION.md)
- [Learning and challenge release checklist](docs/COLLEAGUE_PREVIEW_RELEASE.md)
- [Long-term 200-topic catalogue inventory](docs/COURSE_CATALOGUE_200.md)

## Current implementation notes

- The learning library is bundled from the Batch 1 content packages and does not require course-version imports.
- Supabase stores account-backed learner progress and the independent reasoning challenge bank, attempts and protected answer keys.
- Row-level security restricts each learner to their own progress and attempts.
- The legacy versioned-course, quiz and payment foundations remain in the repository for reference; they are not the centre of the current learner journey.
- Paystack processing is not enabled. No payment wall is part of the current first release.
- CI and production build status must be checked from GitHub Actions; do not infer success from a commit existing.
