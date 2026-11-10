create or replace function private.prevent_locked_quiz_question_mutation()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_old_locked_at timestamptz;
  v_new_locked_at timestamptz;
begin
  if tg_op <> 'INSERT' then
    select z.locked_at into v_old_locked_at
    from public.quizzes z where z.id = old.quiz_id;
  end if;

  if tg_op <> 'DELETE' then
    select z.locked_at into v_new_locked_at
    from public.quizzes z where z.id = new.quiz_id;
  end if;

  if v_old_locked_at is not null or v_new_locked_at is not null then
    raise exception 'published_quiz_questions_are_immutable' using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;

create or replace function private.prevent_locked_quiz_answer_key_mutation()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_old_locked_at timestamptz;
  v_new_locked_at timestamptz;
begin
  if tg_op <> 'INSERT' then
    select z.locked_at into v_old_locked_at
    from public.quiz_questions q
    join public.quizzes z on z.id = q.quiz_id
    where q.id = old.question_id;
  end if;

  if tg_op <> 'DELETE' then
    select z.locked_at into v_new_locked_at
    from public.quiz_questions q
    join public.quizzes z on z.id = q.quiz_id
    where q.id = new.question_id;
  end if;

  if v_old_locked_at is not null or v_new_locked_at is not null then
    raise exception 'published_quiz_answer_keys_are_immutable' using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;