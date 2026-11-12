# APTIVIO colleague preview release checklist

APTIVIO is a free learning library and reasoning-practice platform. It is not an accredited online school, certification provider or clinical IQ-testing service.

## What is included in this preview

- 20 self-paced learning paths bundled from the Batch 1 content library.
- 4 sections and 16 lessons in each learning path: 80 sections and 320 lessons total.
- A standalone reasoning challenge area for logical, numerical, verbal, spatial and memory practice.
- Timed challenge attempts with server-side scoring and personal attempt history.
- Explanations shown after submission, not in the pre-test question payload.
- Free access. No course enrolment or payment is required for the learning library or practice challenges.

## Required setup before public sharing

1. Confirm the correct Supabase project is selected and take a database backup.
2. Apply `supabase/migrations/20261112090000_add_independent_brain_challenges.sql` in the Supabase SQL Editor.
3. Confirm the five seeded challenges exist in `brain_challenges` and each has five questions and five answer keys.
4. Confirm the Vercel project has these environment variables in the deployment environment:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (server-only; never expose it with a `NEXT_PUBLIC_` prefix)
5. Confirm Supabase Auth email confirmation and redirect URLs include the deployed APTIVIO domain.
6. Run the colleague-preview checks below before sharing the link.

Do not run the older Batch 1 course importer for this product direction. Learning paths are bundled as an open library and do not need course enrolment or course-version imports.

## Manual acceptance checks

- Open `/courses`: all 20 learning paths should appear.
- Open one path and complete navigation through its lessons.
- Open `/challenges`: all five seeded challenge categories should appear.
- Sign in, start a challenge, answer questions, submit and confirm score plus explanations.
- Refresh an in-progress challenge and confirm the active attempt can be resumed.
- Let a challenge timer expire and confirm the attempt is marked expired.
- Open `/progress` and confirm only the signed-in user's attempts are displayed.
- Sign out and confirm challenge attempts cannot be started or submitted.
- Test the complete flow on a narrow Android screen.

## Honest product language

- Call these **reasoning practice scores** or **challenge scores**.
- Do not call them a measured IQ score. The challenge bank is not normed or clinically validated.
- Do not claim accreditation, certificates, formal qualifications or guaranteed learning outcomes.
- The learning library is an early-access content set and should be checked by subject reviewers before being presented as authoritative reference material.

## Release status

A successful GitHub CI run validates code and the content package structure. It does not apply the Supabase migration, configure production secrets, verify email delivery, perform real-user acceptance testing or deploy the production site. Those steps must be completed and checked before colleagues are sent the production URL.
