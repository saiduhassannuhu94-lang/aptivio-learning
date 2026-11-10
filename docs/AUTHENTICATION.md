# APTIVIO authentication foundation

## Implemented

- Supabase browser and request-scoped server clients using `@supabase/ssr`.
- Next.js 16 `src/proxy.ts` refreshes cookie-backed Auth sessions using `auth.getClaims()`.
- Email/password sign-in and registration.
- Email confirmation callback using PKCE code exchange.
- Password reset request and authenticated password update.
- Protected learner dashboard using verified claims and a server-verified user record.
- Learner profile initialization through the user's own RLS-protected profile insert.
- Safe internal redirect validation to prevent open redirects.
- Generic authentication errors to avoid exposing account existence or provider details.

## Environment variables

Set these in local `.env.local` and the deployment environment:

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical origin used for email callback URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Browser-safe Supabase publishable key |
| `SUPABASE_SECRET_KEY` | Server only | Privileged server operations when introduced |
| `PAYSTACK_SECRET_KEY` | Server only | Payment provider operations |
| `PAYSTACK_WEBHOOK_SECRET` | Server only | Payment webhook signature verification |

Never expose a Supabase secret key or payment secret through a `NEXT_PUBLIC_` variable.

## Supabase Auth dashboard configuration

Before testing email flows against a deployed host:

1. Set the Auth Site URL to the canonical deployed HTTPS origin.
2. Add the local callback URL `http://localhost:3000/auth/callback` to the redirect allow list.
3. Add the production callback URL `https://YOUR_REAL_DOMAIN/auth/callback` after the domain is confirmed.
4. Keep email confirmation enabled for public registration.
5. Configure and test the confirmation and password-reset email templates.
6. Verify SMTP delivery and sender-domain authentication before public launch.

Do not add an invented production domain. Replace the placeholder only after the domain is owned and connected.

## Route behavior

- `/sign-in`: email/password sign-in.
- `/sign-up`: learner registration.
- `/forgot-password`: generic password reset request response.
- `/auth/callback`: exchanges the one-time authorization code for a session.
- `/update-password`: requires a valid recovery session before changing the password.
- `/dashboard`: verifies claims and the user with Supabase Auth before returning learner data.
- `/courses`: public catalogue backed by published course rows and RLS.

## Security notes

- Proxy refreshes sessions; it is not the sole authorization boundary.
- Sensitive pages and Server Actions must verify identity and enforce ownership/role checks themselves.
- User-editable Auth metadata is used only as an optional display name, never for authorization.
- The callback accepts only local absolute paths and rejects protocol-relative and backslash-based redirect values.
- Auth failures are presented generically to reduce account enumeration.
- The browser uses the publishable key and relies on PostgreSQL grants and RLS for data access.

## Not yet complete

- Supabase dashboard redirect allow-list and production Site URL configuration.
- Production SMTP sender and email-template verification.
- CAPTCHA / abuse controls and rate-limit review.
- OAuth providers, MFA, account deletion, and session-management UI.
- Automated end-to-end tests with separate real test identities.
- Production deployment and live email round-trip verification.

This is an implemented application foundation, not a production security certification.

## Pre-launch acceptance checklist

- [ ] Registration with valid and invalid input.
- [ ] Confirmation email arrives and its callback establishes a session.
- [ ] A confirmed user can sign in and sign out.
- [ ] An unauthenticated visitor cannot render the learner dashboard.
- [ ] A learner can read only their own profile and enrolments.
- [ ] Password reset email returns through the allow-listed callback.
- [ ] Expired or malformed recovery links cannot update a password.
- [ ] Callback redirects reject external and protocol-relative destinations.
- [ ] Production callback URLs use HTTPS and the verified canonical domain.
- [ ] Auth email delivery, CAPTCHA, and abuse controls are tested before launch.
