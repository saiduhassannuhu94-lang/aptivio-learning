# APTIVIO Security Baseline and Threat Model

**Status:** Initial engineering baseline; update as implementation and legal review progress.

## 1. Assets to protect

- Learner identity, profile data, and account sessions
- Paid course content and enrolment entitlements
- Quiz questions, answer keys, submissions, and results
- Payment references, verification results, and refund records
- Administrator accounts, publishing controls, and audit records
- Supabase credentials, Paystack secrets, and deployment environment variables
- Course media and private storage objects

## 2. Trust boundaries

- Browser and mobile web clients are untrusted.
- Public catalogue data is intentionally public only when a course/version is published.
- Authenticated identity proves who a user is; it does not automatically authorise every action.
- Supabase RLS is a database enforcement layer, not a substitute for careful server-side business logic.
- Payment provider callbacks and redirects are external inputs and must be authenticated and validated.
- Administrators are privileged actors; their actions require least privilege and auditability.

## 3. Threats and required controls

### Account and role escalation
**Threat:** A learner edits profile metadata or sends a crafted request to become an administrator.

**Controls:** Keep roles in a protected table or trusted claims flow. Do not derive authority from user-editable metadata. Deny client writes to role grants. Test direct REST/RPC requests, not only hidden UI controls.

### Unauthorised course access
**Threat:** A learner changes a course, lesson, storage path, or enrolment ID in a request to access paid content.

**Controls:** Enforce entitlement checks in RLS and/or trusted server functions. Use private storage buckets and short-lived signed URLs where appropriate. Do not expose private media paths as public assets. Test access as anonymous, enrolled, non-enrolled, expired, and revoked users.

### Forged payment success
**Threat:** A user manipulates a browser redirect or submits a fake success response.

**Controls:** Verify the transaction with Paystack from a trusted server environment. Compare provider reference, expected amount, currency, customer, and intended course purchase. Grant entitlement only after verification. Never accept a client-supplied `paid=true` flag.

### Duplicate or replayed webhook
**Threat:** A webhook is retried or replayed, causing duplicate enrolments or inconsistent payment state.

**Controls:** Verify the provider signature using the raw request body as required by provider documentation. Persist a unique event/transaction identity. Process idempotently with database constraints and transaction-safe state transitions. Log rejected or repeated events without leaking secrets.

### Privileged administration abuse
**Threat:** An attacker takes over an admin account or an authorised admin accidentally publishes incomplete content or grants access incorrectly.

**Controls:** Require strong authentication and appropriate MFA where supported. Restrict admin routes and mutations server-side. Audit role changes, publishing, manual grants, and refunds. Separate draft, review, and published states.

### Secret leakage
**Threat:** API keys enter Git history, client bundles, logs, screenshots, or error responses.

**Controls:** Commit only a safe `.env.example`; ignore real environment files. Keep service-role and Paystack secret keys server-only. Use deployment secret storage. Rotate any exposed credential immediately. Redact sensitive values from logs.

### Injection and unsafe rendering
**Threat:** Malicious course content or user input executes script or changes queries.

**Controls:** Validate inputs on the server, use parameterised database operations, render plain text safely, and sanitise any intentionally supported rich HTML with a maintained allowlist sanitizer. Never concatenate user input into SQL.

### Abuse and availability
**Threat:** Automated signup, brute-force attempts, quiz spam, scraping, or expensive requests degrade service.

**Controls:** Apply provider-supported rate limits, sensible pagination and payload limits, abuse monitoring, and bounded expensive operations. Avoid collecting unnecessary personal data.

## 4. Required authorisation test matrix

For every protected table, storage bucket, server action, and RPC, test:

- Anonymous user
- Authenticated learner accessing their own record
- Authenticated learner accessing another learner's record
- Learner without course entitlement
- Learner with valid entitlement
- Learner with expired or revoked entitlement
- Administrator performing an allowed action
- Learner attempting the same administrative action

Every test must assert both expected allowed access and expected denial. A UI-only test is insufficient.

## 5. Payment state discipline

Suggested lifecycle: `created -> pending -> verified_succeeded`, with explicit terminal or exception states such as `failed`, `cancelled`, `refunded`, and `verification_required`.

- Persist the intended amount and currency when creating a payment.
- Use a unique internal purchase/payment identifier and a unique provider reference.
- Verify the provider transaction server-side before state transition.
- Compare amount and currency with the stored purchase intent.
- Grant the entitlement once, in a transaction-safe operation.
- Store webhook receipt and processing state separately.
- Make retries safe and observable.
- Never log secret keys, full card data, or unnecessary payment personal data.

The exact Paystack signature, verification, and refund implementation must follow current official provider documentation when implemented.

## 6. Operational security

- Keep production and preview credentials separate.
- Restrict GitHub and Vercel access to necessary people.
- Review dependency updates and security advisories.
- Keep backups and test restoration, not merely backup creation.
- Monitor failed authentication, denied access, webhook failures, and admin actions.
- Define incident response and credential rotation steps before public launch.
- Review privacy notice, data retention, deletion, and applicable Nigerian legal requirements before collecting real learner data.

## 7. Release blockers

Do not launch while any of these remain unresolved:

- Exposed service-role or payment secret
- Learner can escalate role or modify another learner's data
- Paid lesson or private resource accessible without entitlement
- Payment redirect can grant access without provider verification
- Duplicate webhook can create duplicate entitlements
- Admin-only action is protected only by frontend visibility
- No tested backup/restore path for production data
