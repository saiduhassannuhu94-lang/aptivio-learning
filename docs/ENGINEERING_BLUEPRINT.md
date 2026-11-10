# APTIVIO Engineering Blueprint v1.0

**Status:** Proposed baseline for implementation  
**Date:** 2026-11-10  
**Decision owner:** Product owner / engineering lead  
**Related documents:** [Foundation](./FOUNDATION.md), [Architecture](./ARCHITECTURE.md), [Security](./SECURITY.md)

This blueprint turns the product specification into an implementation contract. It is not evidence that the application has already been implemented or tested.

---

## 1. Engineering principles

1. Server-side authority: the browser never decides roles, entitlements, payment success, scores, or privileged state.
2. Explicit domain boundaries: each module owns its validation, policies, data access, and tests.
3. Small reversible decisions: record consequential architecture choices and avoid premature complexity.
4. Secure defaults: deny access unless an explicit policy grants it.
5. Observable behaviour: important state transitions produce structured, non-sensitive logs.
6. Reproducible builds: commit lockfiles, pin runtime/tool versions, and build in CI.
7. Accessible, resilient UX: support keyboard navigation, assistive technology, low-end phones, and weak networks.
8. Evidence-based completion: a feature is complete only when its acceptance criteria and negative cases pass.

## 2. Technology decisions

| Concern | Proposed choice | Reason / constraint |
|---|---|---|
| Web framework | Next.js App Router | Server rendering and route conventions suit a content-led learning platform |
| Language | TypeScript strict mode | Catch invalid contracts and unsafe assumptions early |
| UI | React Server Components by default; Client Components only for real interactivity | Reduce browser JavaScript and keep trusted work on the server |
| Styling | Tailwind CSS with semantic design tokens | Consistent responsive UI and maintainable visual system |
| Database | Supabase PostgreSQL | Relational data, constraints, transactions, and RLS |
| Authentication | Supabase Auth with `@supabase/ssr` integration | Managed identity with server-aware session handling |
| File storage | Private Supabase Storage buckets for protected resources | Access controlled by policies and/or short-lived signed URLs |
| Payment | Paystack | NGN-first checkout; provider verification remains server-side |
| Hosting | Vercel | Next.js deployment and preview environments |
| Source control / CI | GitHub + GitHub Actions | Reviewable changes and automated checks |
| Unit/component tests | Vitest + React Testing Library | Fast isolated tests of business logic and UI behaviour |
| Browser E2E | Playwright | Test real user journeys and access-denial cases in a browser |
| Formatting | Prettier (if adopted) + ESLint | Consistent code and static analysis |

### Version policy

Do not copy floating `latest` dependencies into production and leave them unpinned. At the implementation start:

- Select a supported Node.js LTS runtime compatible with the selected Next.js release and Vercel runtime.
- Select the current stable Next.js release, not a canary or release candidate.
- Pin direct dependency versions and commit the package-manager lockfile.
- Record the exact Node, npm, Next.js, React, TypeScript, Supabase client, and test-tool versions in the repository.
- Upgrade deliberately through reviewed dependency changes and CI, not opportunistic production edits.

The official Next.js installation guide currently documents App Router, TypeScript, ESLint, Tailwind setup, and a Node.js minimum of 20.9. Check the guide again at scaffold time because framework requirements evolve:
https://nextjs.org/docs/app/getting-started/installation

GitHub Actions should use a declared Node runtime and a lockfile-based clean install:
https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs

## 3. Proposed repository structure

Start with a single deployable web application. Keep domain logic separate from framework routing and UI.

```text
aptivio-learning/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── FOUNDATION.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── ENGINEERING_BLUEPRINT.md
│   ├── decisions/
│   └── runbooks/
├── public/
│   ├── brand/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   ├── (auth)/
│   │   ├── (learner)/
│   │   ├── (admin)/
│   │   ├── api/
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── not-found.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   └── shared/
│   ├── features/
│   │   ├── identity/
│   │   ├── catalogue/
│   │   ├── courses/
│   │   ├── enrolments/
│   │   ├── learning/
│   │   ├── assessments/
│   │   ├── payments/
│   │   └── administration/
│   ├── lib/
│   │   ├── env/
│   │   ├── supabase/
│   │   ├── paystack/
│   │   ├── security/
│   │   ├── observability/
│   │   └── validation/
│   └── styles/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

This is a target structure, not a requirement to create every directory immediately. Add a folder when a real module or test requires it. Do not create empty placeholder files just to make the tree look impressive.

### Module rules

- `app/` handles routing, layouts, route-level loading/error boundaries, and composition.
- `features/<domain>/` owns domain-specific schemas, services, policies, and types.
- `components/ui/` contains accessible primitives, not business rules.
- `lib/` contains cross-cutting infrastructure with explicit server/client separation.
- Server-only modules must be marked and imported only from server contexts.
- Client Components must never import service-role clients, secret-bearing modules, or privileged server code.
- Avoid circular dependencies between feature modules. Shared contracts belong in a small, reviewed shared layer.

## 4. Route and access model

Proposed route groups:

- Public: `/`, `/courses`, `/courses/[slug]`, `/about`, `/contact`, `/privacy`, `/terms`, `/refunds`
- Authentication: `/login`, `/register`, `/forgot-password`, `/auth/callback`
- Learner: `/learn`, `/learn/courses/[courseId]`, `/learn/lessons/[lessonId]`, `/learn/assessments/[assessmentId]`, `/account`
- Administration: `/admin`, `/admin/courses`, `/admin/courses/[courseId]`, `/admin/reviews`, `/admin/users`
- API/webhooks: narrowly scoped route handlers for payment initialization, provider callbacks/webhooks, and other server integrations.

A route group is a presentation/organisation boundary, not a security control. Every server action, route handler, database query, and storage access must independently enforce authentication and authorisation.

## 5. Server/client and data-access contracts

### Server by default

- Fetch public catalogue data in Server Components where possible.
- Keep service credentials and payment secrets in server-only modules.
- Use Client Components for forms, menus, media controls, quiz interactions, and other genuine browser interactions.
- Never send privileged data to the browser and then rely on hiding it in the UI.
- Validate all untrusted input at the boundary using shared schemas (for example, Zod); validation does not replace authorisation.

### Data access

Each feature exposes narrow operations, not arbitrary database access to UI components. Example conceptual contracts:

- Catalogue: `listPublishedCourses(filters, pagination)`, `getPublishedCourseBySlug(slug)`
- Enrolment: `createFreeEnrolment(userId, courseVersionId)`, `getActiveEntitlement(userId, courseVersionId)`
- Learning: `markLessonComplete(userId, enrolmentId, lessonId)`
- Assessment: `submitAttempt(userId, enrolmentId, assessmentId, answers)`
- Payments: `createCheckoutIntent(userId, courseVersionId)`, `verifyProviderTransaction(reference)`, `processVerifiedWebhook(event)`
- Administration: `createDraftCourseVersion(actor, input)`, `submitForReview(actor, versionId)`, `publishReviewedVersion(actor, versionId)`

These are design contracts, not implemented function signatures. Each operation must validate input, check the actor's authority, enforce state transitions, and return typed success/failure results. Do not expose generic update endpoints that allow clients to change protected columns.

## 6. Environment and secret management

The first implementation should define and validate a small explicit environment contract.

Expected categories:

- Public Supabase project URL and publishable key (browser-visible by design)
- Supabase secret/service-role credential (server only; do not prefix with `NEXT_PUBLIC_`)
- Paystack public key only if a browser integration strictly requires it
- Paystack secret key (server only)
- Application base URL and environment mode

Rules:

- Commit `.env.example` with names and safe placeholders only.
- Never commit `.env.local`, real tokens, service-role keys, payment secrets, or production data.
- Validate required environment variables at startup or at the relevant server boundary.
- Fail clearly when a required secret is missing; never silently fall back to a production credential or demo mode.
- Keep local, preview, and production secrets separate.
- Rotate credentials immediately if exposed.
- Redact secrets and sensitive personal/payment data from logs.

## 7. Database migration and policy workflow

- Treat SQL migrations as the source of truth for schema changes.
- Use ordered, reviewed migrations; do not rely on undocumented manual dashboard edits.
- Apply constraints, foreign keys, uniqueness, and indexes in migrations.
- Enable RLS on every exposed table and write table-specific policies.
- Test both allowed and denied paths using distinct user identities.
- Keep seed data deterministic and clearly non-production; production must not depend on demo seeds.
- Run Supabase security advisors and review policy/view/function/storage behaviour before promoting migrations.
- Keep privileged functions out of exposed schemas unless a documented security review proves they are necessary.

Supabase-specific implementation must follow its current security guidance, including RLS, user-editable metadata restrictions, view security, and secret handling. Re-read the installed Supabase skill and current docs immediately before schema/auth/storage implementation.

## 8. Testing strategy

### Unit tests
Test pure domain rules and deterministic helpers:

- Course publication eligibility
- Price/currency validation
- Enrolment state transitions
- Entitlement expiry/revocation rules
- Quiz grading and attempt limits
- Payment amount/currency comparison
- Webhook idempotency decisions

### Integration tests
Test application services against a controlled database/test environment:

- RLS ownership and role boundaries
- Enrolment creation and uniqueness
- Lesson completion authorisation
- Quiz submission and scoring
- Payment verification state transitions
- Duplicate webhook handling
- Storage object access

### End-to-end tests
Use browser automation for the real user journey:

1. Visitor browses published courses.
2. Learner registers and signs in.
3. Learner enrols in a free course.
4. Learner opens authorised lessons and records progress.
5. Learner submits a quiz and sees the permitted result.
6. Non-enrolled learner is denied paid lesson access.
7. Learner cannot access another learner's dashboard or records.
8. Non-admin is denied all admin actions.
9. Payment test flow grants access only after verified provider success.

Use provider test mode and controlled fixtures. Never use real charges in automated tests.

### Quality checks

A pull request must pass:

- Clean dependency installation from the committed lockfile
- Formatting check (if formatter is configured)
- ESLint
- TypeScript type check
- Unit tests
- Integration tests that can run safely in CI
- Production build
- E2E smoke tests for critical flows as those flows are implemented
- Dependency and secret scanning where available

Do not silence type errors or disable build checks to make a deployment green.

## 9. CI and Git workflow

### Branching

- `main` is the deployable integration branch.
- Use short-lived branches such as `feat/course-catalogue`, `fix/lesson-access-policy`, and `docs/payment-threat-model`.
- Keep commits focused and messages descriptive.
- Require CI checks and review before merging once branch protection is configured.
- Never force-push shared history to conceal a broken change.

### Pull request expectations

Every PR states:

- Problem and intended behaviour
- Scope and explicit non-goals
- Screenshots or short recording for visual changes
- Database migration and RLS impact
- Security/privacy implications
- Tests run and actual results
- Deployment/configuration changes and rollback notes

### CI sequence

1. Checkout repository.
2. Set the declared Node runtime.
3. Install dependencies with `npm ci`.
4. Run lint and formatting checks.
5. Run type-check.
6. Run unit tests.
7. Start controlled services and run integration tests when configured.
8. Run production build.
9. Run critical E2E smoke tests when available.
10. Publish test results; do not deploy if required checks fail.

Deployment is a separate controlled stage. CI passing is not proof that production secrets, DNS, payment callbacks, or database policies are configured correctly.

## 10. Error handling and observability

- Use typed domain errors for expected failures (not enrolled, course unavailable, payment pending).
- Return safe user-facing messages; never expose SQL, stack traces, tokens, or provider secrets.
- Log unexpected errors with request/correlation IDs and redacted context.
- Track key operational events: auth failures, denied access, course publication, payment verification, webhook processing, and admin grants/refunds.
- Monitor latency, error rate, failed webhooks, and payment reconciliation.
- Establish alert thresholds from pilot baselines rather than inventing arbitrary targets.
- Do not log full quiz answers, passwords, access tokens, card data, or unnecessary personal data.

## 11. Accessibility, responsive UX, and performance

- Target WCAG 2.2 AA as the accessibility baseline.
- Use semantic HTML, visible focus, keyboard-operable controls, labels, sufficient contrast, and accessible error messages.
- Design from narrow mobile widths upward; test on modest Android hardware and slow network profiles.
- Prefer server-rendered content and small client bundles.
- Optimise images and video delivery; do not autoplay heavy media on mobile.
- Use pagination and bounded queries; avoid loading entire course catalogues or learner histories.
- Add loading, empty, error, offline/network interruption, and retry states.
- Measure Core Web Vitals and real-device performance before tuning caches or adding infrastructure.

## 12. Release and rollback policy

- Local development and preview deployments use non-production credentials and test data.
- Production deployment requires passing CI and reviewed configuration.
- Database migrations must be backward-compatible where practical: deploy additive changes first, migrate data, then remove obsolete structures in a later release.
- Document rollback steps for application releases and database changes separately.
- Do not assume a database migration can be safely rolled back automatically.
- Verify health, auth, catalogue, protected lesson access, and payment webhook processing after deployment.
- Keep a tested backup/restore procedure before real learner data is introduced.

## 13. Definition of Done

A task is done only when:

- Acceptance criteria are met.
- Types, lint, and relevant tests pass.
- Authorisation and denial paths are tested.
- No secrets or private data leak to the browser or repository.
- Mobile and accessibility behaviour are reviewed where applicable.
- Errors and retry behaviour are considered.
- Documentation/configuration/migrations are updated.
- The change is committed and its resulting repository state is verified.

## 14. Implementation gates

### Gate B1 — Repository and toolchain
Create the Next.js skeleton, strict TypeScript configuration, Tailwind setup, lint/format/test scripts, environment schema, and lockfile. CI must install and build from a clean checkout.

### Gate B2 — Runtime foundation
Add application shell, accessible design tokens, error boundaries, health check, logging baseline, and preview deployment. No real learner data or payment processing yet.

### Gate C — Identity and authorisation
Implement Supabase SSR session handling, profiles, roles, RLS, and security tests. Do not proceed to paid content until unauthorised access tests pass.

### Gate D — Learning core
Implement catalogue, immutable course versions, lessons, enrolments, quizzes, and progress.

### Gate E — Payments
Implement Paystack test-mode checkout, server verification, webhook signature verification, idempotency, and reconciliation.

### Gate F/G — Pilot and launch
Complete content review, mobile/accessibility/performance/security review, backup restore test, support workflow, pilot feedback, and launch approval.

---

## 15. Architecture decision records to create as decisions are finalised

Create one short ADR per consequential choice:

- ADR-001: Modular monolith for MVP
- ADR-002: Next.js App Router and server-first rendering
- ADR-003: Supabase as managed PostgreSQL/Auth/Storage platform
- ADR-004: Course versioning and enrolment pinning
- ADR-005: Payment-to-entitlement transaction boundary
- ADR-006: Testing stack and CI release gates
- ADR-007: Video delivery and bandwidth strategy

Do not mark a decision as final until its trade-offs and alternatives have been reviewed.
