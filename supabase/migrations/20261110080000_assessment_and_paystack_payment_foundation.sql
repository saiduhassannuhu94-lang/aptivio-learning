-- APTIVIO assessment and Paystack payment foundation.
-- Sensitive answer keys, attempts, payments, and webhook records are server-owned.

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  instructions text not null default '',
  pass_mark numeric(5,2) not null default 70 check (pass_mark between 0 and 100),
  max_attempts integer check (max_attempts is null or max_attempts between 1 and 100),
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds between 60 and 86400),
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 5000),
  question_type text not null check (question_type in ('single_choice','multiple_choice','true_false')),
  options jsonb not null,
  points integer not null default 1 check (points between 1 and 1000),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  constraint quiz_questions_options_array check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 12
  ),
  unique (quiz_id, sort_order),
  unique (id, quiz_id)
);

create table public.quiz_answer_keys (
  question_id uuid primary key references public.quiz_questions(id) on delete cascade,
  correct_option_ids text[] not null check (
    cardinality(correct_option_ids) >= 1 and cardinality(correct_option_ids) <= 12
  ),
  updated_at timestamptz not null default now()
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete restrict,
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null default 'in_progress'
    check (status in ('in_progress','submitted','graded','expired')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(7,2) check (score is null or score >= 0),
  max_score numeric(7,2) check (max_score is null or max_score > 0),
  passed boolean,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, user_id, attempt_number),
  unique (id, user_id)
);

create table public.quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete restrict,
  response jsonb not null,
  awarded_points numeric(7,2) check (awarded_points is null or awarded_points >= 0),
  feedback text,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  course_version_id uuid not null,
  provider text not null default 'paystack' check (provider = 'paystack'),
  provider_reference text not null unique,
  provider_transaction_id bigint unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending'
    check (status in ('pending','success','failed','abandoned','reversed','refunded','expired')),
  provider_channel text,
  provider_paid_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_course_version_course_fk
    foreign key (course_version_id, course_id)
    references public.course_versions(id, course_id) on delete restrict
);

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paystack' check (provider = 'paystack'),
  event_key text not null,
  event_type text not null,
  provider_reference text,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  processing_status text not null default 'received'
    check (processing_status in ('received','processed','ignored','failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  failure_code text,
  unique (provider, event_key)
);

alter table public.enrollments
  add column payment_id uuid unique references public.payments(id) on delete restrict;

create unique index enrollments_one_active_course_per_user_idx
  on public.enrollments(user_id, course_id)
  where status in ('active','completed');

create unique index payments_one_pending_course_per_user_idx
  on public.payments(user_id, course_id)
  where status = 'pending';

create index quizzes_course_version_published_idx
  on public.quizzes(course_version_id, is_published);
create index quiz_questions_quiz_order_idx
  on public.quiz_questions(quiz_id, sort_order);
create index quiz_attempts_user_quiz_idx
  on public.quiz_attempts(user_id, quiz_id, created_at desc);
create index quiz_attempt_answers_attempt_idx
  on public.quiz_attempt_answers(attempt_id);
create index payments_user_created_idx
  on public.payments(user_id, created_at desc);
create index payments_course_status_idx
  on public.payments(course_id, status);
create index payment_webhook_events_reference_idx
  on public.payment_webhook_events(provider_reference);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answer_keys enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;

revoke all privileges on table
  public.quizzes, public.quiz_questions, public.quiz_answer_keys,
  public.quiz_attempts, public.quiz_attempt_answers,
  public.payments, public.payment_webhook_events
from anon, authenticated;

grant select on table
  public.quizzes, public.quiz_questions, public.quiz_attempts,
  public.quiz_attempt_answers, public.payments
to authenticated;

grant insert, update, delete on table
  public.quizzes, public.quiz_questions
to authenticated;

create policy "Enrolled learners and content managers read quizzes"
on public.quizzes for select to authenticated
using (
  (is_published and (select private.can_access_course_version(course_version_id)))
  or (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
);

create policy "Content managers insert quizzes"
on public.quizzes for insert to authenticated
with check (
  (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
);

create policy "Content managers update quizzes"
on public.quizzes for update to authenticated
using (
  (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
)
with check (
  (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
);

create policy "Content managers delete quizzes"
on public.quizzes for delete to authenticated
using (
  (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
);

create policy "Enrolled learners and content managers read quiz questions"
on public.quiz_questions for select to authenticated
using (
  exists (
    select 1 from public.quizzes q
    where q.id = quiz_questions.quiz_id
      and (
        (q.is_published and (select private.can_access_course_version(q.course_version_id)))
        or (select private.has_role('admin'::public.app_role))
        or (select private.has_role('content_manager'::public.app_role))
      )
  )
);

create policy "Content managers insert quiz questions"
on public.quiz_questions for insert to authenticated
with check (
  (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
);

create policy "Content managers update quiz questions"
on public.quiz_questions for update to authenticated
using (
  (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
)
with check (
  (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
);

create policy "Content managers delete quiz questions"
on public.quiz_questions for delete to authenticated
using (
  (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
);

create policy "Learners read their own quiz attempts"
on public.quiz_attempts for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_role('admin'::public.app_role))
);

create policy "Learners read their own quiz attempt answers"
on public.quiz_attempt_answers for select to authenticated
using (
  exists (
    select 1 from public.quiz_attempts a
    where a.id = quiz_attempt_answers.attempt_id
      and (
        a.user_id = (select auth.uid())
        or (select private.has_role('admin'::public.app_role))
      )
  )
);

create policy "Learners read their own payments"
on public.payments for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_role('admin'::public.app_role))
  or (select private.has_role('support'::public.app_role))
);

create trigger quizzes_set_updated_at
before update on public.quizzes
for each row execute function private.set_updated_at();
create trigger quiz_attempts_set_updated_at
before update on public.quiz_attempts
for each row execute function private.set_updated_at();
create trigger payments_set_updated_at
before update on public.payments
for each row execute function private.set_updated_at();

create or replace function private.fulfill_verified_paystack_payment(
  p_reference text,
  p_transaction_id bigint,
  p_verified_amount bigint,
  p_verified_currency text,
  p_provider_paid_at timestamptz,
  p_provider_channel text
)
returns uuid
language plpgsql
security definer
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

revoke all on function private.fulfill_verified_paystack_payment(text,bigint,bigint,text,timestamptz,text)
from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.fulfill_verified_paystack_payment(text,bigint,bigint,text,timestamptz,text)
to service_role;
