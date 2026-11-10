begin;
select extensions.plan(23);

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


-- Published assessment content is frozen on first publication.
insert into public.courses (id,slug,status,price_minor,currency)
values ('11111111-1111-4111-8111-111111111111','pgtap-quiz-lock-test','draft',0,'NGN');
insert into public.course_versions (id,course_id,version_number,title)
values ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111',1,'PGTAP Lock Test');
update public.courses
set status='published', published_version_id='22222222-2222-4222-8222-222222222222', published_at=now()
where id='11111111-1111-4111-8111-111111111111';
insert into public.quizzes (id,course_version_id,title,pass_mark,is_published)
values ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','Lock Test Quiz',70,false);
insert into public.quiz_questions (id,quiz_id,prompt,question_type,options,points,sort_order)
values ('44444444-4444-4444-8444-444444444444','33333333-3333-4333-8333-333333333333','One plus one?','single_choice','[{"id":"a","text":"1"},{"id":"b","text":"2"}]'::jsonb,1,0);
insert into public.quiz_answer_keys (question_id,correct_option_ids)
values ('44444444-4444-4444-8444-444444444444',array['b']);
update public.quizzes set is_published=true where id='33333333-3333-4333-8333-333333333333';

select extensions.ok(
  (select locked_at is not null from public.quizzes where id='33333333-3333-4333-8333-333333333333'),
  'first publication sets an immutable lock timestamp'
);
select extensions.throws_ok(
  $update public.quiz_questions set prompt='Changed prompt' where id='44444444-4444-4444-8444-444444444444'$,
  '55000',
  'published_quiz_questions_are_immutable',
  'published question content cannot be changed'
);
select extensions.throws_ok(
  $update public.quiz_answer_keys set correct_option_ids=array['a'] where question_id='44444444-4444-4444-8444-444444444444'$,
  '55000',
  'published_quiz_answer_keys_are_immutable',
  'published answer keys cannot be changed'
);
select extensions.lives_ok(
  $update public.quizzes set is_published=false where id='33333333-3333-4333-8333-333333333333'$,
  'a locked quiz can be unpublished without changing its content'
);
select extensions.throws_ok(
  $update public.quizzes set title='Changed quiz' where id='33333333-3333-4333-8333-333333333333'$,
  '55000',
  'published_quiz_content_is_immutable',
  'unpublishing does not unlock quiz content'
);

select * from extensions.finish();
rollback;
