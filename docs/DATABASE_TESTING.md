# APTIVIO Database Testing

APTIVIO uses pgTAP for PostgreSQL structure, grant, function, and RLS assertions.

## Run locally

With the Supabase CLI installed and the project linked/configured:

```bash
supabase start
supabase test db
```

The test suite lives in `supabase/tests/`. Keep tests transaction-scoped and roll back test data.

## Current verified checks

The assessment/payment security suite was executed against the linked Supabase project using pgTAP:

- 30 assertions passed. Coverage includes RLS and client grants, quiz publication immutability, attempt start/submission/retake limits, and atomic Paystack payment fulfilment with safe duplicate retries.
- Seven assessment/payment tables exist.
- RLS is enabled on all seven.
- Browser roles cannot read quiz answer keys or webhook events.
- Learners cannot directly create attempts, alter grades, or create/update payment records.
- Learners have only the intended read privileges.
- Server role can execute the three restricted workflow RPCs.
- Authenticated users cannot execute those RPCs.

The local Supabase CLI test command and GitHub CI have not yet been run from a reproducible local environment. The linked-project pgTAP run is a direct database verification, not a claim that the full CI pipeline is green.
