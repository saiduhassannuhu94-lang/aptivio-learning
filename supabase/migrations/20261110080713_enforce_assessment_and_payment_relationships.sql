-- Add composite integrity constraints so attempts cannot mix a quiz,
-- an enrolment, a learner, or a question from unrelated courses.

alter table public.quizzes
  add constraint quizzes_id_course_version_unique unique (id, course_version_id);

alter table public.enrollments
  add constraint enrollments_id_course_version_unique unique (id, course_version_id),
  add constraint enrollments_id_user_unique unique (id, user_id);

alter table public.quiz_attempts
  add column course_version_id uuid;

update public.quiz_attempts a
set course_version_id = q.course_version_id
from public.quizzes q
where q.id = a.quiz_id;

alter table public.quiz_attempts
  alter column course_version_id set not null,
  add constraint quiz_attempts_id_quiz_unique unique (id, quiz_id),
  add constraint quiz_attempts_quiz_version_fk
    foreign key (quiz_id, course_version_id)
    references public.quizzes(id, course_version_id) on delete restrict,
  add constraint quiz_attempts_enrollment_version_fk
    foreign key (enrollment_id, course_version_id)
    references public.enrollments(id, course_version_id) on delete restrict,
  add constraint quiz_attempts_enrollment_user_fk
    foreign key (enrollment_id, user_id)
    references public.enrollments(id, user_id) on delete restrict;

alter table public.quiz_attempt_answers
  add column quiz_id uuid;

update public.quiz_attempt_answers aa
set quiz_id = a.quiz_id
from public.quiz_attempts a
where a.id = aa.attempt_id;

alter table public.quiz_attempt_answers
  alter column quiz_id set not null,
  add constraint quiz_attempt_answers_attempt_quiz_fk
    foreign key (attempt_id, quiz_id)
    references public.quiz_attempts(id, quiz_id) on delete cascade,
  add constraint quiz_attempt_answers_question_quiz_fk
    foreign key (question_id, quiz_id)
    references public.quiz_questions(id, quiz_id) on delete restrict;

drop function if exists private.fulfill_verified_paystack_payment(text,bigint,bigint,text,timestamptz,text);

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

  if v_payment.expires_at < pg_catalog.now() then
    raise exception 'payment_intent_expired' using errcode = 'P0001';
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

  return v_enrollment_id;
end;
$function$;

revoke all on function public.fulfill_verified_paystack_payment(text,bigint,bigint,text,timestamptz,text)
from public, anon, authenticated;
grant execute on function public.fulfill_verified_paystack_payment(text,bigint,bigint,text,timestamptz,text)
to service_role;
