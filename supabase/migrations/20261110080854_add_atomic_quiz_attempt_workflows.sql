-- Server-only RPCs make quiz attempt creation and submission atomic.
create or replace function public.start_quiz_attempt(
  p_quiz_id uuid,
  p_user_id uuid,
  p_enrollment_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_quiz public.quizzes%rowtype;
  v_enrollment public.enrollments%rowtype;
  v_attempt_number integer;
  v_attempt_id uuid;
  v_question_count integer;
begin
  select * into v_quiz
  from public.quizzes
  where id = p_quiz_id
  for update;

  if not found or not v_quiz.is_published then
    raise exception 'quiz_not_available' using errcode = 'P0001';
  end if;

  select * into v_enrollment
  from public.enrollments
  where id = p_enrollment_id
    and user_id = p_user_id
    and course_version_id = v_quiz.course_version_id
    and status in ('active','completed')
  for share;

  if not found then
    raise exception 'valid_enrollment_required' using errcode = '42501';
  end if;

  select count(*) into v_question_count
  from public.quiz_questions
  where quiz_id = p_quiz_id;

  if v_question_count = 0 then
    raise exception 'quiz_has_no_questions' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.quiz_attempts a
    where a.quiz_id = p_quiz_id
      and a.user_id = p_user_id
      and a.status = 'in_progress'
  ) then
    raise exception 'attempt_already_in_progress' using errcode = 'P0001';
  end if;

  select coalesce(max(a.attempt_number), 0) + 1
  into v_attempt_number
  from public.quiz_attempts a
  where a.quiz_id = p_quiz_id
    and a.user_id = p_user_id;

  if v_quiz.max_attempts is not null and v_attempt_number > v_quiz.max_attempts then
    raise exception 'maximum_attempts_reached' using errcode = 'P0001';
  end if;

  insert into public.quiz_attempts (
    quiz_id, course_version_id, enrollment_id, user_id, attempt_number
  )
  values (
    p_quiz_id, v_quiz.course_version_id, p_enrollment_id, p_user_id, v_attempt_number
  )
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$function$;

revoke all on function public.start_quiz_attempt(uuid,uuid,uuid)
from public, anon, authenticated;
grant execute on function public.start_quiz_attempt(uuid,uuid,uuid)
to service_role;

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
  where id = p_attempt_id
    and user_id = p_user_id
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

  select * into v_quiz
  from public.quizzes
  where id = v_attempt.quiz_id;

  if not found then
    raise exception 'quiz_not_found' using errcode = 'P0002';
  end if;

  select count(*), coalesce(sum(points), 0)
  into v_question_count, v_expected_max_score
  from public.quiz_questions
  where quiz_id = v_attempt.quiz_id;

  select count(*), coalesce(sum((item->>'awarded_points')::numeric), 0)
  into v_answer_count, v_submitted_score
  from pg_catalog.jsonb_array_elements(p_answers) as answers(item);

  if v_question_count = 0
     or v_answer_count <> v_question_count
     or v_expected_max_score <> p_max_score
     or v_submitted_score <> p_score then
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
      v_attempt.id,
      v_attempt.quiz_id,
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

revoke all on function public.submit_quiz_attempt(uuid,uuid,numeric,numeric,jsonb)
from public, anon, authenticated;
grant execute on function public.submit_quiz_attempt(uuid,uuid,numeric,numeric,jsonb)
to service_role;
