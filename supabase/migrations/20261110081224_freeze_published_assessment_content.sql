-- Freeze assessment content on first publication. Unpublishing hides a quiz;
-- edits require a new quiz record so historical/in-progress attempts remain stable.

alter table public.quizzes
  add column locked_at timestamptz;

create or replace function private.lock_quiz_on_publish()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    if new.is_published then
      new.locked_at := pg_catalog.now();
    end if;
    return new;
  end if;

  if old.locked_at is not null then
    if (pg_catalog.to_jsonb(new) - 'is_published' - 'updated_at')
       is distinct from
       (pg_catalog.to_jsonb(old) - 'is_published' - 'updated_at') then
      raise exception 'published_quiz_content_is_immutable' using errcode = '55000';
    end if;
    return new;
  end if;

  if new.is_published then
    new.locked_at := pg_catalog.now();
  end if;

  return new;
end;
$function$;

revoke all on function private.lock_quiz_on_publish() from public, anon, authenticated;

create trigger quizzes_lock_content
before insert or update on public.quizzes
for each row execute function private.lock_quiz_on_publish();

create or replace function private.prevent_locked_quiz_question_mutation()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_quiz_id uuid;
  v_locked_at timestamptz;
begin
  if tg_op = 'DELETE' then
    select q.quiz_id, z.locked_at into v_quiz_id, v_locked_at
    from public.quiz_questions q
    join public.quizzes z on z.id = q.quiz_id
    where q.id = old.id;
  else
    v_quiz_id := new.quiz_id;
    select z.locked_at into v_locked_at
    from public.quizzes z
    where z.id = v_quiz_id;
  end if;

  if v_locked_at is not null then
    raise exception 'published_quiz_questions_are_immutable' using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;

revoke all on function private.prevent_locked_quiz_question_mutation() from public, anon, authenticated;

create trigger quiz_questions_lock_content
before insert or update or delete on public.quiz_questions
for each row execute function private.prevent_locked_quiz_question_mutation();

create or replace function private.prevent_locked_quiz_answer_key_mutation()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_question_id uuid;
  v_locked_at timestamptz;
begin
  if tg_op = 'DELETE' then v_question_id := old.question_id;
  else v_question_id := new.question_id;
  end if;

  select z.locked_at into v_locked_at
  from public.quiz_questions q
  join public.quizzes z on z.id = q.quiz_id
  where q.id = v_question_id;

  if v_locked_at is not null then
    raise exception 'published_quiz_answer_keys_are_immutable' using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;

revoke all on function private.prevent_locked_quiz_answer_key_mutation() from public, anon, authenticated;

create trigger quiz_answer_keys_lock_content
before insert or update or delete on public.quiz_answer_keys
for each row execute function private.prevent_locked_quiz_answer_key_mutation();
