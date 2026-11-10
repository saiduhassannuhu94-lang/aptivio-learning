# APTIVIO Paystack Payments

**Status:** Server-side checkout, course-detail purchase entry point, callback verification, and webhook fulfilment implemented. Live transactions remain disabled until production secrets, callback URLs, and webhook settings are configured and tested.

## Payment lifecycle

1. An authenticated learner requests checkout for a course ID.
2. The server reads the published course price and currency from PostgreSQL. Client-supplied prices are never accepted.
3. The server creates a pending payment record with a unique reference and the exact published course version.
4. The server initializes Paystack using the account email, stored amount in minor units, currency, and generated reference.
5. The browser is redirected to Paystack's hosted authorization URL.
6. The callback and webhook both verify the transaction with Paystack from the server.
7. Reference, successful status, amount, currency, and customer email are checked against the stored payment and account.
8. A restricted, atomic database function marks the payment successful and grants the corresponding course-version enrolment.
9. Webhook event keys are unique. Repeated deliveries are safe to retry.

A browser redirect, client-side success message, or unverified webhook body never grants course access.

## Server-only environment variables

- `PAYSTACK_SECRET_KEY`: Paystack test or live secret API key.
- `PAYSTACK_WEBHOOK_SECRET`: current webhook signing secret generated/configured in Paystack's developer API settings. Keep the full secret, including its prefix.
- `PAYSTACK_WEBHOOK_SECRET_PREVIOUS`: optional previous signing secret during Paystack's rotation overlap. Remove it after the overlap ends.

The webhook validates the timestamped `Paystack-Signature` header using raw request bytes. Until Paystack begins sending that header, it falls back to the legacy `x-paystack-signature` HMAC using `PAYSTACK_SECRET_KEY`. Once the timestamped header is present, the current signing secret is required.
- `SUPABASE_SECRET_KEY`: Supabase server secret key used only by server routes.

Never prefix any of these with `NEXT_PUBLIC_`. Never place them in client components, source control, logs, or browser responses.

## Paystack dashboard setup

Configure the webhook URL as:

```text
https://YOUR_CANONICAL_DOMAIN/api/payments/webhook
```

The callback URL is supplied dynamically during transaction initialization:

```text
https://YOUR_CANONICAL_DOMAIN/api/payments/callback
```

Use Paystack test credentials and a verified test transaction before enabling live keys. Confirm that the webhook request includes the timestamped `Paystack-Signature` header. The handler verifies the signature against the raw request body and rejects timestamps outside a five-minute window.

## Operational rules

- Amounts are integer minor units, not floating-point naira values.
- Course price and currency are read from the database on the server.
- One pending payment per learner/course is allowed by a partial unique index.
- A previous pending payment is reconciled with Paystack before a second charge is allowed.
- If Paystack's status cannot be safely determined, checkout is blocked rather than risking a duplicate charge.
- A verified payment and its enrolment are committed in one database transaction.
- Webhook events are deduplicated and retried after transient verification failures.
- Refunds, chargebacks, reconciliation dashboards, and automated refunds are not implemented yet.

## Required pre-live checks

- Add the three server-only secrets to the Vercel production environment.
- Configure the canonical HTTPS site URL and Supabase Auth redirect allow-list.
- Set the Paystack webhook URL and webhook signing secret.
- Verify successful, failed, abandoned, duplicate, delayed-webhook, mismatched-amount, and mismatched-currency cases using test transactions.
- Confirm a learner cannot create or update payment/enrolment records directly through the Data API.
- Run database tests and a production build before enabling live payments.
