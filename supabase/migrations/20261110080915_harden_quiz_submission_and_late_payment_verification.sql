create or replace function public.submit_quiz_attempt(
  p_attempt_id uuid,
  p_user_id uuid,
  p_score numeric,
  p_max_score numeric,
  p_answers jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_attempt public.quiz_attempts%rowtype;
  v_quiz public.quizzes%rowtype;
  v_answer jsonb;
  v_passed boolean;
  v_question_count integer;
  v_answer_count integer;
  v_expected_max_score numeric;
  v_submitted_score numeric;
begin
  select * into v_attempt
  from public.quiz_attempts
  where id = p_attempt_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'attempt_already_submitted' using errcode = 'P0001';
  end if;
  if p_score is null or p_max_score is null
     or p_max_score <= 0 or p_score < 0 or p_score > p_max_score then
    raise exception 'invalid_quiz_score' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_answers) <> 'array' then
    raise exception 'invalid_quiz_answers' using errcode = '22023';
  end if;

  select * into v_quiz from public.quizzes where id = v_attempt.quiz_id;
  if not found then
    raise exception 'quiz_not_found' using errcode = 'P0002';
  end if;

  select count(*), coalesce(sum(points), 0)
  into v_question_count, v_expected_max_score
  from public.quiz_questions where quiz_id = v_attempt.quiz_id;

  select count(*), coalesce(sum((item->>'awarded_points')::numeric), 0)
  into v_answer_count, v_submitted_score
  from pg_catalog.jsonb_array_elements(p_answers) as answers(item);

  if v_question_count = 0 or v_answer_count <> v_question_count
     or v_expected_max_score <> p_max_score or v_submitted_score <> p_score then
    raise exception 'inconsistent_quiz_submission' using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_answers) as answers(item)
    where pg_catalog.jsonb_typeof(item) <> 'object'
       or not (item ? 'question_id')
       or not (item ? 'response')
       or not (item ? 'awarded_points')
       or (item->>'awarded_points')::numeric < 0
       or not exists (
         select 1 from public.quiz_questions q
         where q.id = (item->>'question_id')::uuid
           and q.quiz_id = v_attempt.quiz_id
           and (item->>'awarded_points')::numeric <= q.points
       )
  ) then
    raise exception 'invalid_quiz_answer_item' using errcode = '22023';
  end if;

  for v_answer in select value from pg_catalog.jsonb_array_elements(p_answers)
  loop
    insert into public.quiz_attempt_answers (
      attempt_id, quiz_id, question_id, response, awarded_points
    )
    values (
      v_attempt.id, v_attempt.quiz_id,
      (v_answer->>'question_id')::uuid,
      v_answer->'response',
      (v_answer->>'awarded_points')::numeric
    );
  end loop;

  v_passed := ((p_score / p_max_score) * 100) >= v_quiz.pass_mark;
  update public.quiz_attempts
  set status = 'graded',
      submitted_at = pg_catalog.now(),
      score = p_score,
      max_score = p_max_score,
      passed = v_passed,
      graded_at = pg_catalog.now()
  where id = v_attempt.id;

  return v_attempt.id;
end;
$function$;

create or replace function public.fulfill_verified_paystack_payment(
  p_reference text,
  p_transaction_id bigint,
  p_verified_amount bigint,
  p_verified_currency text,
  p_provider_paid_at timestamptz,
  p_provider_channel text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_payment public.payments%rowtype;
  v_enrollment_id uuid;
begin
  select * into v_payment
  from public.payments
  where provider_reference = p_reference
  for update;

  if not found then
    raise exception 'payment_reference_not_found' using errcode = 'P0002';
  end if;

  if v_payment.status = 'success' then
    select e.id into v_enrollment_id
    from public.enrollments e
    where e.payment_id = v_payment.id;
    return v_enrollment_id;
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'payment_not_pending' using errcode = 'P0001';
  end if;

  if v_payment.amount_minor <> p_verified_amount
     or v_payment.currency <> pg_catalog.upper(p_verified_currency) then
    raise exception 'verified_payment_amount_or_currency_mismatch' using errcode = 'P0001';
  end if;

  if p_transaction_id is null or p_transaction_id <= 0 then
    raise exception 'invalid_provider_transaction_id' using errcode = '22023';
  end if;

  update public.payments
  set status = 'success',
      provider_transaction_id = p_transaction_id,
      provider_paid_at = p_provider_paid_at,
      provider_channel = p_provider_channel,
      verified_at = pg_catalog.now()
  where id = v_payment.id;

  insert into public.enrollments (
    user_id, course_id, course_version_id, status,
    amount_minor, currency, payment_id
  )
  values (
    v_payment.user_id, v_payment.course_id, v_payment.course_version_id, 'active',
    v_payment.amount_minor, v_payment.currency, v_payment.id
  )
  on conflict (user_id, course_id) where status in ('active','completed')
  do nothing
  returning id into v_enrollment_id;

  if v_enrollment_id is null then
    select e.id into v_enrollment_id
    from public.enrollments e
    where e.user_id = v_payment.user_id
      and e.course_id = v_payment.course_id
      and e.status in ('active','completed')
    order by e.enrolled_at desc
    limit 1;
  end if;

  update public.enrollments
  set payment_id = v_payment.id
  where id = v_enrollment_id and payment_id is null;

  return v_enrollment_id;
end;
$function$;
