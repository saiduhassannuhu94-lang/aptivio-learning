# APTIVIO Foundation Specification

**Status:** Draft for implementation planning  
**Product tagline:** Knowledge That Moves You Forward  
**Last reviewed:** 2026-11-10

## 1. Product purpose

APTIVIO is a Nigeria-first, internationally accessible learning platform. It should help learners discover structured courses, understand exactly what a course offers, learn through organised lessons, practise what they learn, and track their progress.

The product must work well on modest Android devices and unreliable or expensive connections. Mobile usability, clear pricing, trustworthy course information, and secure access are core requirements, not later polish.

## 2. MVP user journey

1. A visitor browses and searches a published course catalogue.
2. The visitor opens a course page and can inspect its outcomes, audience, prerequisites, curriculum, language, estimated duration, price, and access terms.
3. The visitor creates an account and signs in.
4. The learner enrols in a free course or completes a verified payment for a paid course.
5. The learner accesses authorised sections and lessons.
6. The learner completes lessons and quizzes.
7. The learner sees accurate progress in a personal dashboard.

Course publishing is controlled by authorised administrators during the MVP.

## 3. MVP scope

### Included

- Responsive public landing page and course catalogue
- Course search and practical filters
- Detailed course pages with transparent access and pricing information
- Email-based authentication and learner profiles
- Server-enforced enrolment and lesson access
- Course sections and text/video lessons
- Lesson completion and progress tracking
- Basic quizzes and recorded attempts
- Learner dashboard
- Admin-managed course creation, review, publishing, and unpublishing
- Free enrolment
- Paystack checkout for NGN-priced courses, with server-side transaction verification and secure, idempotent webhook handling
- Privacy, terms, refund/access policy, and contact/support pages
- Error handling, operational logs, backups, and privacy-respecting basic analytics

### Explicitly out of scope for MVP

- Open instructor self-service marketplace or automatic instructor payouts
- Microservices
- Native Android/iOS applications
- AI features without a validated learner problem
- Public rankings that expose private learner information
- Unverified job, income, accreditation, or certification claims
- A large catalogue of incomplete or placeholder courses
- Subscriptions, bundles, institutional administration, referrals, and community features
- Offline/PWA functionality unless separately prioritised after the core learning journey works reliably

## 4. Course publishing quality gate

A course must not be purchasable or labelled complete until it has:

- An accountable content owner and reviewer
- A defined target learner and difficulty level
- Measurable learning outcomes and stated prerequisites
- A complete, ordered curriculum and usable lessons
- Exercises or assessments appropriate to the outcomes
- Accurate language, duration, and media/resource information
- Reviewed and usable media/resources
- A review date and content version
- Clear price, access duration, and refund/access terms

Draft and in-review courses must remain unavailable for purchase and learner enrolment.

## 5. Technical direction

Use a modular monolith for the MVP. Avoid premature distributed architecture.

- **Web application:** Next.js App Router and TypeScript
- **Styling:** Tailwind CSS, with accessible reusable components
- **Backend platform:** Supabase PostgreSQL, Auth, and Storage
- **Hosting and deployment:** Vercel
- **Payments:** Paystack, with all trusted payment decisions made server-side
- **Source control:** GitHub

Keep domain logic separated into clear modules (identity/access, catalogue/content, enrolment/progress, assessment, payments, and administration). The UI must not be treated as a security boundary.

## 6. Security and privacy baseline

- Enable and test Row Level Security (RLS) on every table exposed to client access.
- Apply least-privilege policies for learners, administrators, and service processes.
- Never allow users to assign their own role, payment status, enrolment entitlement, lesson completion, quiz score, or certificate status through editable profile metadata or client requests.
- Never expose Supabase service-role keys or payment secrets in browser code, source control, logs, or public build output.
- Protect course content and storage objects according to enrolment entitlement and publication status.
- Verify Paystack transactions on the server. Never grant access based only on a browser redirect or client-submitted payment status.
- Verify webhook signatures and make webhook processing idempotent.
- Record security-sensitive administrative actions in an audit trail.
- Collect only personal data required to operate the service; document retention and deletion rules before launch.
- Validate and authorise every server-side mutation, not merely the corresponding UI action.

## 7. Data and payment conventions

- Store monetary amounts as integer minor units with an explicit ISO currency code.
- Do not use floating-point arithmetic for money.
- Store timestamps in UTC and render them in the learner's local timezone.
- Treat payment initiation, provider verification, webhook receipt, and entitlement granting as separate states.
- Make duplicate payment notifications safe; one successful transaction must not create duplicate entitlements.

## 8. Quality gates

### Gate A — Product and architecture foundation
- Confirm the product scope and unresolved business policies.
- Document domain boundaries, data model, access rules, and threat assumptions.
- Define acceptance criteria for the core learner journey.

### Gate B — Technical skeleton
- Establish a reproducible Next.js/TypeScript project.
- Add lint, type-check, and production build checks.
- Validate safe environment-variable handling.
- Deploy a private/preview build only after local or CI checks pass.

### Gate C — Identity and access
- Implement authentication, profiles, roles, and RLS.
- Test both allowed and denied access paths, including direct API requests.

### Gate D — Learning journey
- Implement catalogue, course content, enrolment, lessons, quizzes, and progress end to end.

### Gate E — Payments
- Implement Paystack initiation, server verification, webhook signature checks, idempotency, and refund/access handling.

### Gate F — Pilot readiness
- Review real course content, mobile usability, accessibility, performance, privacy, security, backups, and support operations.

### Gate G — Public launch
- Launch only after pilot feedback is reviewed and critical/high-severity issues are resolved.

## 9. Decisions still required before launch

These are intentionally not invented in this specification:

- First course subjects and the initial set of fully completed courses
- Content owners, reviewers, and update responsibilities
- One-time purchase versus subscription (MVP currently assumes one-time course purchases)
- Refund policy, access duration, and support contact
- Whether any certificate will exist and exactly what it represents
- Video hosting provider, bandwidth limits, and operating budget
- Minimum age policy, privacy notice, and applicable legal obligations
- Final brand/domain/trademark clearance for the APTIVIO name and tagline

## 10. Definition of done

A feature is not complete because its page renders. It is complete only when its acceptance criteria are documented, the relevant success and failure paths are tested, access control is enforced server-side, mobile behaviour is checked, and the implementation has been reviewed for security and operational failure modes.

No demo data, fake metrics, fabricated testimonials, or unverified claims may be presented as real.
