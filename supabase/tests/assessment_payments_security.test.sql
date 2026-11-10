begin;
select extensions.plan(18);

select extensions.ok(to_regclass('public.quizzes') is not null, 'quizzes table exists');
select extensions.ok(to_regclass('public.quiz_questions') is not null, 'quiz questions table exists');
select extensions.ok(to_regclass('public.quiz_answer_keys') is not null, 'quiz answer keys table exists');
select extensions.ok(to_regclass('public.quiz_attempts') is not null, 'quiz attempts table exists');
select extensions.ok(to_regclass('public.quiz_attempt_answers') is not null, 'quiz attempt answers table exists');
select extensions.ok(to_regclass('public.payments') is not null, 'payments table exists');
select extensions.ok(to_regclass('public.payment_webhook_events') is not null, 'webhook events table exists');

select extensions.ok(
  (select count(*) = 7 from pg_class c
   join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r'
     and c.relname in (
       'quizzes','quiz_questions','quiz_answer_keys','quiz_attempts',
       'quiz_attempt_answers','payments','payment_webhook_events'
     )
     and c.relrowsecurity),
  'RLS is enabled on every assessment and payment table'
);

select extensions.ok(
  not has_table_privilege('anon','public.quiz_answer_keys','SELECT')
  and not has_table_privilege('authenticated','public.quiz_answer_keys','SELECT'),
  'browser roles cannot read quiz answer keys'
);

select extensions.ok(
  not has_table_privilege('anon','public.payment_webhook_events','SELECT')
  and not has_table_privilege('authenticated','public.payment_webhook_events','SELECT'),
  'browser roles cannot read webhook events'
);

select extensions.ok(
  not has_table_privilege('authenticated','public.quiz_attempts','INSERT')
  and not has_table_privilege('authenticated','public.quiz_attempts','UPDATE')
  and not has_table_privilege('authenticated','public.payments','INSERT')
  and not has_table_privilege('authenticated','public.payments','UPDATE'),
  'learners cannot create attempts, edit grades, or create/update payments'
);

select extensions.ok(
  has_table_privilege('authenticated','public.quizzes','SELECT')
  and has_table_privilege('authenticated','public.quiz_questions','SELECT')
  and has_table_privilege('authenticated','public.quiz_attempts','SELECT')
  and has_table_privilege('authenticated','public.payments','SELECT'),
  'authenticated learners have the intended read privileges'
);

select extensions.ok(
  has_function_privilege('service_role','public.start_quiz_attempt(uuid,uuid,uuid)','EXECUTE'),
  'service role can start attempts'
);

select extensions.ok(
  has_function_privilege('service_role','public.submit_quiz_attempt(uuid,uuid,numeric,numeric,jsonb)','EXECUTE'),
  'service role can submit attempts'
);

select extensions.ok(
  has_function_privilege('service_role','public.fulfill_verified_paystack_payment(text,bigint,bigint,text,timestamp with time zone,text)','EXECUTE'),
  'service role can fulfil verified payments'
);

select extensions.ok(
  not has_function_privilege('authenticated','public.start_quiz_attempt(uuid,uuid,uuid)','EXECUTE'),
  'authenticated users cannot call attempt-start RPC'
);

select extensions.ok(
  not has_function_privilege('authenticated','public.submit_quiz_attempt(uuid,uuid,numeric,numeric,jsonb)','EXECUTE'),
  'authenticated users cannot call grading RPC'
);

select extensions.ok(
  not has_function_privilege('authenticated','public.fulfill_verified_paystack_payment(text,bigint,bigint,text,timestamp with time zone,text)','EXECUTE'),
  'authenticated users cannot call payment fulfilment RPC'
);

select * from extensions.finish();
rollback;
