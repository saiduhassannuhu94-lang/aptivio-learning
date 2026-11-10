-- Serialize question/key mutations against the quiz row lock used by publication.
-- This closes the race where content could change while a quiz was being published.

create or replace function private.prevent_locked_quiz_question_mutation()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_quiz_id uuid;
  v_old_locked_at timestamptz;
  v_new_locked_at timestamptz;
begin
  if tg_op = 'INSERT' then
    for v_quiz_id in
      select z.id from public.quizzes z where z.id = new.quiz_id order by z.id
    loop
      perform 1 from public.quizzes z where z.id = v_quiz_id for update;
    end loop;
  elsif tg_op = 'DELETE' then
    for v_quiz_id in
      select z.id from public.quizzes z where z.id = old.quiz_id order by z.id
    loop
      perform 1 from public.quizzes z where z.id = v_quiz_id for update;
    end loop;
  else
    for v_quiz_id in
      select distinct z.id
      from public.quizzes z
      where z.id in (old.quiz_id, new.quiz_id)
      order by z.id
    loop
      perform 1 from public.quizzes z where z.id = v_quiz_id for update;
    end loop;
  end if;

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
  v_quiz_id uuid;
  v_old_locked_at timestamptz;
  v_new_locked_at timestamptz;
begin
  if tg_op = 'INSERT' then
    for v_quiz_id in
      select z.id
      from public.quiz_questions q
      join public.quizzes z on z.id = q.quiz_id
      where q.id = new.question_id
      order by z.id
    loop
      perform 1 from public.quizzes z where z.id = v_quiz_id for update;
    end loop;
  elsif tg_op = 'DELETE' then
    for v_quiz_id in
      select z.id
      from public.quiz_questions q
      join public.quizzes z on z.id = q.quiz_id
      where q.id = old.question_id
      order by z.id
    loop
      perform 1 from public.quizzes z where z.id = v_quiz_id for update;
    end loop;
  else
    for v_quiz_id in
      select distinct z.id
      from public.quiz_questions q
      join public.quizzes z on z.id = q.quiz_id
      where q.id in (old.question_id, new.question_id)
      order by z.id
    loop
      perform 1 from public.quizzes z where z.id = v_quiz_id for update;
    end loop;
  end if;

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