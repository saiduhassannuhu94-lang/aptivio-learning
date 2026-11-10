begin;
select extensions.plan(32);

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
  'update public.quiz_questions set prompt = ''Changed prompt'' where id = ''44444444-4444-4444-8444-444444444444''',
  '55000',
  'published_quiz_questions_are_immutable',
  'published question content cannot be changed'
);

-- A second unpublished quiz proves locked content cannot be moved out.
insert into public.quizzes (id,course_version_id,title,pass_mark,is_published)
values ('33333334-3333-4333-8333-333333333334','22222222-2222-4222-8222-222222222222','Unlocked Destination Quiz',70,false);
insert into public.quiz_questions (id,quiz_id,prompt,question_type,options,points,sort_order)
values ('44444445-4444-4444-8444-444444444445','33333334-3333-4333-8333-333333333334','Destination question?','single_choice','[{"id":"a","text":"A"},{"id":"b","text":"B"}]'::jsonb,1,0);
insert into public.quiz_answer_keys (question_id,correct_option_ids)
values ('44444445-4444-4444-8444-444444444445',array['a']);

select extensions.throws_ok(
  'update public.quiz_answer_keys set correct_option_ids = array[''a''] where question_id = ''44444444-4444-4444-8444-444444444444''',
  '55000',
  'published_quiz_answer_keys_are_immutable',
  'published answer keys cannot be changed'
);

select extensions.throws_ok(
  'update public.quiz_questions set quiz_id = ''33333334-3333-4333-8333-333333333334'' where id = ''44444444-4444-4444-8444-444444444444''',
  '55000',
  'published_quiz_questions_are_immutable',
  'a locked question cannot be moved into an unlocked quiz'
);
select extensions.throws_ok(
  'update public.quiz_answer_keys set question_id = ''44444445-4444-4444-8444-444444444445'' where question_id = ''44444444-4444-4444-8444-444444444444''',
  '55000',
  'published_quiz_answer_keys_are_immutable',
  'a locked answer key cannot be moved to another question'
);

select extensions.lives_ok(
  'update public.quizzes set is_published = false where id = ''33333333-3333-4333-8333-333333333333''',
  'a locked quiz can be unpublished without changing its content'
);
select extensions.throws_ok(
  'update public.quizzes set title = ''Changed quiz'' where id = ''33333333-3333-4333-8333-333333333333''',
  '55000',
  'published_quiz_content_is_immutable',
  'unpublishing does not unlock quiz content'
);


-- Exercise the atomic quiz attempt RPCs with isolated transactional fixtures.
insert into auth.users (
  id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '55555555-5555-4555-8555-555555555555','authenticated','authenticated',
  'aptivio-pgtap-quiz@example.test','',now(),'{}'::jsonb,'{}'::jsonb,now(),now()
);

insert into public.courses (id,slug,status,price_minor,currency)
values ('66666666-6666-4666-8666-666666666666','pgtap-quiz-rpc-test','draft',0,'NGN');
insert into public.course_versions (id,course_id,version_number,title)
values ('77777777-7777-4777-8777-777777777777','66666666-6666-4666-8666-666666666666',1,'RPC Test Course');
update public.courses
set status='published',
    published_version_id='77777777-7777-4777-8777-777777777777',
    published_at=now()
where id='66666666-6666-4666-8666-666666666666';

insert into public.enrollments (
  id,user_id,course_id,course_version_id,status,amount_minor,currency
) values (
  '88888888-8888-4888-8888-888888888888',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  'active',0,'NGN'
);

insert into public.quizzes (id,course_version_id,title,pass_mark,max_attempts,is_published)
values (
  '99999999-9999-4999-8999-999999999999',
  '77777777-7777-4777-8777-777777777777',
  'RPC Quiz',70,1,false
);
insert into public.quiz_questions (id,quiz_id,prompt,question_type,options,points,sort_order)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '99999999-9999-4999-8999-999999999999',
  'Correct option?','single_choice',
  '[{"id":"x","text":"Wrong"},{"id":"y","text":"Right"}]'::jsonb,
  1,0
);
insert into public.quiz_answer_keys (question_id,correct_option_ids)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',array['y']);
update public.quizzes set is_published=true
where id='99999999-9999-4999-8999-999999999999';

create temporary table test_attempt (id uuid);
insert into test_attempt
select public.start_quiz_attempt(
  '99999999-9999-4999-8999-999999999999',
  '55555555-5555-4555-8555-555555555555',
  '88888888-8888-4888-8888-888888888888'
);

select extensions.ok(
  (select count(*)=1 from public.quiz_attempts
   where id=(select id from test_attempt) and status='in_progress'),
  'start RPC creates an in-progress attempt'
);

select extensions.lives_ok(
  'select public.submit_quiz_attempt((select id from test_attempt),''55555555-5555-4555-8555-555555555555'',1,1,''[{"question_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","response":{"optionIds":["y"]},"awarded_points":1}]''::jsonb)',
  'submit RPC accepts valid server-graded answers'
);

select extensions.ok(
  (select status='graded' and score=1 and passed
   from public.quiz_attempts where id=(select id from test_attempt)),
  'submitted attempt stores score and pass result'
);

select extensions.throws_ok(
  'select public.submit_quiz_attempt((select id from test_attempt),''55555555-5555-4555-8555-555555555555'',1,1,''[{"question_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","response":{"optionIds":["y"]},"awarded_points":1}]''::jsonb)',
  'P0001','attempt_already_submitted','duplicate submissions are rejected'
);

select extensions.throws_ok(
  'select public.start_quiz_attempt(''99999999-9999-4999-8999-999999999999'',''55555555-5555-4555-8555-555555555555'',''88888888-8888-4888-8888-888888888888'')',
  'P0001','maximum_attempts_reached','attempt limits are enforced'
);


-- Verify atomic Paystack fulfilment and duplicate delivery behaviour.
insert into public.courses (id,slug,status,price_minor,currency)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','pgtap-payment-rpc-test','draft',250000,'NGN');
insert into public.course_versions (id,course_id,version_number,title)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',1,'Payment RPC Course');
update public.courses
set status='published',
    published_version_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    published_at=now()
where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

insert into public.payments (
  id,user_id,course_id,course_version_id,provider,provider_reference,
  amount_minor,currency,status
) values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '55555555-5555-4555-8555-555555555555',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'paystack','apt_pgtap_payment_test',250000,'NGN','pending'
);

create temporary table test_payment_enrollment (id uuid);
insert into test_payment_enrollment
select public.fulfill_verified_paystack_payment(
  'apt_pgtap_payment_test',123456,250000,'NGN',now(),'card'
);

select extensions.ok(
  (select p.status='success' and e.status='active' and e.payment_id=p.id
   from public.payments p
   join public.enrollments e on e.payment_id=p.id
   where p.id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
  'verified payment and active enrolment are committed together'
);

select extensions.lives_ok(
  'select public.fulfill_verified_paystack_payment(''apt_pgtap_payment_test'',123456,250000,''NGN'',now(),''card'')',
  'duplicate payment fulfilment is safe to retry'
);

select * from extensions.finish();
rollback;
