-- APTIVIO independent reasoning challenge engine.
-- Challenges are standalone: no course, enrolment, payment, or certificate dependency.
create table public.brain_challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 160),
  category text not null check (category in ('logical','numerical','verbal','spatial','memory')),
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  summary text not null check (char_length(summary) between 20 and 500),
  instructions text not null default '',
  duration_seconds integer not null check (duration_seconds between 60 and 7200),
  max_attempts integer check (max_attempts is null or max_attempts between 1 and 100),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brain_challenge_questions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.brain_challenges(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 3000),
  options jsonb not null check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8
  ),
  points integer not null default 1 check (points between 1 and 100),
  explanation text not null default '',
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (challenge_id, sort_order),
  unique (id, challenge_id)
);

create table public.brain_challenge_answer_keys (
  question_id uuid primary key references public.brain_challenge_questions(id) on delete cascade,
  correct_option_ids text[] not null check (
    cardinality(correct_option_ids) between 1 and 8
  )
);

create table public.brain_challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.brain_challenges(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null default 'in_progress'
    check (status in ('in_progress','submitted','expired')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  elapsed_seconds integer,
  score numeric(8,2),
  max_score numeric(8,2),
  percentage numeric(5,2),
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id, attempt_number),
  unique (id, user_id)
);

create unique index brain_challenge_one_active_attempt_idx
  on public.brain_challenge_attempts(challenge_id, user_id)
  where status = 'in_progress';
create index brain_challenge_attempts_user_history_idx
  on public.brain_challenge_attempts(user_id, submitted_at desc);
create index brain_challenge_questions_order_idx
  on public.brain_challenge_questions(challenge_id, sort_order);

create table public.brain_challenge_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.brain_challenge_attempts(id) on delete cascade,
  question_id uuid not null references public.brain_challenge_questions(id) on delete restrict,
  selected_option_ids text[] not null default '{}',
  is_correct boolean not null,
  awarded_points numeric(8,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

alter table public.brain_challenges enable row level security;
alter table public.brain_challenge_questions enable row level security;
alter table public.brain_challenge_answer_keys enable row level security;
alter table public.brain_challenge_attempts enable row level security;
alter table public.brain_challenge_attempt_answers enable row level security;

-- All challenge reads and writes pass through authenticated server routes.
-- In particular, answer keys are never exposed to browser clients.
revoke all privileges on table
  public.brain_challenges,
  public.brain_challenge_questions,
  public.brain_challenge_answer_keys,
  public.brain_challenge_attempts,
  public.brain_challenge_attempt_answers
from anon, authenticated;

create or replace function public.start_brain_challenge_attempt(
  p_challenge_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_challenge public.brain_challenges%rowtype;
  v_attempt_number integer;
  v_attempt_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_challenge_id::text, 0)
  );

  select * into v_challenge
  from public.brain_challenges
  where id = p_challenge_id and is_published = true;

  if not found then
    raise exception 'challenge_not_available' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.brain_challenge_questions
    where challenge_id = p_challenge_id
  ) then
    raise exception 'challenge_has_no_questions' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.brain_challenge_attempts
    where challenge_id = p_challenge_id
      and user_id = p_user_id
      and status = 'in_progress'
  ) then
    raise exception 'attempt_already_in_progress' using errcode = 'P0001';
  end if;

  select coalesce(max(attempt_number), 0) + 1 into v_attempt_number
  from public.brain_challenge_attempts
  where challenge_id = p_challenge_id and user_id = p_user_id;

  if v_challenge.max_attempts is not null
     and v_attempt_number > v_challenge.max_attempts then
    raise exception 'maximum_attempts_reached' using errcode = 'P0001';
  end if;

  insert into public.brain_challenge_attempts (
    challenge_id, user_id, attempt_number
  ) values (
    p_challenge_id, p_user_id, v_attempt_number
  ) returning id into v_attempt_id;

  return v_attempt_id;
end;
$function$;

create or replace function public.submit_brain_challenge_attempt(
  p_attempt_id uuid,
  p_user_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_attempt public.brain_challenge_attempts%rowtype;
  v_challenge public.brain_challenges%rowtype;
  v_question record;
  v_selected text[];
  v_correct text[];
  v_score numeric(8,2) := 0;
  v_max_score numeric(8,2) := 0;
  v_elapsed integer;
  v_is_correct boolean;
  v_breakdown jsonb := '[]'::jsonb;
begin
  if pg_catalog.jsonb_typeof(p_answers) <> 'array'
     or pg_catalog.jsonb_array_length(p_answers) > 200 then
    raise exception 'invalid_answer_payload' using errcode = '22023';
  end if;

  select * into v_attempt
  from public.brain_challenge_attempts
  where id = p_attempt_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'attempt_already_submitted' using errcode = 'P0001';
  end if;

  select * into v_challenge
  from public.brain_challenges
  where id = v_attempt.challenge_id;

  v_elapsed := greatest(0, floor(extract(epoch from (pg_catalog.now() - v_attempt.started_at)))::integer);

  if v_elapsed > v_challenge.duration_seconds + 10 then
    update public.brain_challenge_attempts
    set status = 'expired', submitted_at = pg_catalog.now(), elapsed_seconds = v_elapsed
    where id = v_attempt.id;
    return pg_catalog.jsonb_build_object(
      'expired', true,
      'elapsedSeconds', v_elapsed
    );
  end if;

  for v_question in
    select q.id, q.points, q.sort_order, k.correct_option_ids
    from public.brain_challenge_questions q
    join public.brain_challenge_answer_keys k on k.question_id = q.id
    where q.challenge_id = v_attempt.challenge_id
    order by q.sort_order
  loop
    v_max_score := v_max_score + v_question.points;

    select coalesce(array_agg(value order by value), '{}'::text[])
    into v_selected
    from (
      select distinct jsonb_array_elements_text(
        coalesce((
          select answer_item->'optionIds'
          from jsonb_array_elements(p_answers) answer_item
          where answer_item->>'questionId' = v_question.id::text
          limit 1
        ), '[]'::jsonb)
      ) as value
    ) selected_values;

    select coalesce(array_agg(value order by value), '{}'::text[])
    into v_correct
    from unnest(v_question.correct_option_ids) as correct_values(value);

    v_is_correct := v_selected = v_correct;
    if v_is_correct then
      v_score := v_score + v_question.points;
    end if;

    insert into public.brain_challenge_attempt_answers (
      attempt_id, question_id, selected_option_ids, is_correct, awarded_points
    ) values (
      v_attempt.id, v_question.id, v_selected, v_is_correct,
      case when v_is_correct then v_question.points else 0 end
    );

    v_breakdown := v_breakdown || pg_catalog.jsonb_build_object(
      'questionId', v_question.id,
      'correct', v_is_correct,
      'awardedPoints', case when v_is_correct then v_question.points else 0 end,
      'maxPoints', v_question.points
    );
  end loop;

  update public.brain_challenge_attempts
  set status = 'submitted',
      submitted_at = pg_catalog.now(),
      elapsed_seconds = v_elapsed,
      score = v_score,
      max_score = v_max_score,
      percentage = case when v_max_score > 0 then round((v_score / v_max_score) * 100, 2) else 0 end
  where id = v_attempt.id;

  return pg_catalog.jsonb_build_object(
    'attemptId', v_attempt.id,
    'score', v_score,
    'maxScore', v_max_score,
    'percentage', case when v_max_score > 0 then round((v_score / v_max_score) * 100, 2) else 0 end,
    'elapsedSeconds', v_elapsed,
    'breakdown', v_breakdown
  );
end;
$function$;

revoke all on function public.start_brain_challenge_attempt(uuid, uuid) from public, anon, authenticated;
revoke all on function public.submit_brain_challenge_attempt(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.start_brain_challenge_attempt(uuid, uuid) to service_role;
grant execute on function public.submit_brain_challenge_attempt(uuid, uuid, jsonb) to service_role;

-- Starter reasoning set. These are practice questions, not a normed IQ test.
with challenge_data(slug, title, category, difficulty, summary, duration_seconds) as (
  values
    ('logic-sequences', 'Logic & Sequences', 'logical', 'beginner', 'Find the rule behind a sequence and use it to predict what comes next.', 300),
    ('number-sense', 'Numerical Reasoning', 'numerical', 'beginner', 'Work with number relationships, quick arithmetic and numerical patterns.', 360),
    ('word-reasoning', 'Verbal Reasoning', 'verbal', 'beginner', 'Test word relationships, meaning, classification and careful reading.', 360),
    ('spatial-thinking', 'Spatial Thinking', 'spatial', 'intermediate', 'Reason about shapes, orientation, symmetry and visual transformations.', 420),
    ('memory-focus', 'Memory & Focus', 'memory', 'beginner', 'Practise short-term recall and attention to detail.', 300)
)
insert into public.brain_challenges (slug, title, category, difficulty, summary, duration_seconds, is_published)
select slug, title, category, difficulty, summary, duration_seconds, true
from challenge_data
on conflict (slug) do nothing;

with question_data(slug, sort_order, prompt, options, correct_id, explanation) as (
  values
  ('logic-sequences', 1, 'What number comes next: 2, 4, 8, 16, ...?', '[{"id":"a","text":"24"},{"id":"b","text":"30"},{"id":"c","text":"32"},{"id":"d","text":"34"}]'::jsonb, 'c', 'Each number is multiplied by 2.'),
  ('logic-sequences', 2, 'Which item does not belong with the others?', '[{"id":"a","text":"Triangle"},{"id":"b","text":"Square"},{"id":"c","text":"Circle"},{"id":"d","text":"Cube"}]'::jsonb, 'd', 'A cube is three-dimensional; the others are flat 2D shapes.'),
  ('logic-sequences', 3, 'Complete the pattern: A, C, E, G, ...', '[{"id":"a","text":"H"},{"id":"b","text":"I"},{"id":"c","text":"J"},{"id":"d","text":"K"}]'::jsonb, 'b', 'The sequence skips one letter each time.'),
  ('logic-sequences', 4, 'If all Zibs are Loms and all Loms are Teks, which statement must be true?', '[{"id":"a","text":"All Teks are Zibs"},{"id":"b","text":"All Zibs are Teks"},{"id":"c","text":"No Zibs are Teks"},{"id":"d","text":"Some Loms are not Teks"}]'::jsonb, 'b', 'The relationship is transitive: Zibs are inside the group of Loms, which are inside Teks.'),
  ('logic-sequences', 5, 'Choose the next pair: AZ, BY, CX, ...', '[{"id":"a","text":"DW"},{"id":"b","text":"DV"},{"id":"c","text":"EW"},{"id":"d","text":"DX"}]'::jsonb, 'a', 'The first letter moves forward while the second moves backward.'),
  ('number-sense', 1, 'What is 15% of 200?', '[{"id":"a","text":"15"},{"id":"b","text":"20"},{"id":"c","text":"30"},{"id":"d","text":"35"}]'::jsonb, 'c', '10% is 20 and 5% is 10, giving 30.'),
  ('number-sense', 2, 'A price rises from ₦800 to ₦1,000. What is the percentage increase?', '[{"id":"a","text":"20%"},{"id":"b","text":"25%"},{"id":"c","text":"30%"},{"id":"d","text":"40%"}]'::jsonb, 'b', 'The increase is 200; 200 divided by 800 is 25%.'),
  ('number-sense', 3, 'What is the average of 6, 8, 10 and 12?', '[{"id":"a","text":"8"},{"id":"b","text":"9"},{"id":"c","text":"10"},{"id":"d","text":"11"}]'::jsonb, 'b', 'The total is 36; divide by 4 to get 9.'),
  ('number-sense', 4, 'A bus travels 150 km in 3 hours at a constant speed. What is its speed?', '[{"id":"a","text":"30 km/h"},{"id":"b","text":"40 km/h"},{"id":"c","text":"50 km/h"},{"id":"d","text":"60 km/h"}]'::jsonb, 'c', 'Speed equals distance divided by time: 150 ÷ 3 = 50.'),
  ('number-sense', 5, 'What number is missing: 5, 9, 17, 33, ...?', '[{"id":"a","text":"49"},{"id":"b","text":"57"},{"id":"c","text":"65"},{"id":"d","text":"66"}]'::jsonb, 'c', 'The differences double: +4, +8, +16, then +32.'),
  ('word-reasoning', 1, 'Book is to reading as fork is to ...', '[{"id":"a","text":"Drawing"},{"id":"b","text":"Eating"},{"id":"c","text":"Writing"},{"id":"d","text":"Sleeping"}]'::jsonb, 'b', 'A book is used for reading; a fork is used for eating.'),
  ('word-reasoning', 2, 'Which word is closest in meaning to “brief”?', '[{"id":"a","text":"Short"},{"id":"b","text":"Loud"},{"id":"c","text":"Heavy"},{"id":"d","text":"Late"}]'::jsonb, 'a', 'Brief means short in duration or length.'),
  ('word-reasoning', 3, 'Choose the word that does not belong: oak, mango, rose, pine.', '[{"id":"a","text":"Oak"},{"id":"b","text":"Mango"},{"id":"c","text":"Rose"},{"id":"d","text":"Pine"}]'::jsonb, 'c', 'Rose is generally a flowering shrub; the others are trees.'),
  ('word-reasoning', 4, 'If “scarce” means limited, which word is its opposite?', '[{"id":"a","text":"Rare"},{"id":"b","text":"Plentiful"},{"id":"c","text":"Small"},{"id":"d","text":"Unusual"}]'::jsonb, 'b', 'Plentiful means available in large amounts.'),
  ('word-reasoning', 5, 'All researchers ask questions. Ada is a researcher. What follows?', '[{"id":"a","text":"Ada asks questions"},{"id":"b","text":"Ada teaches mathematics"},{"id":"c","text":"Everyone asks questions"},{"id":"d","text":"No researchers ask questions"}]'::jsonb, 'a', 'The conclusion follows directly from the two statements.'),
  ('spatial-thinking', 1, 'A square is rotated 90 degrees. What happens to its shape?', '[{"id":"a","text":"It becomes a rectangle"},{"id":"b","text":"It becomes a diamond"},{"id":"c","text":"It remains a square"},{"id":"d","text":"It becomes a triangle"}]'::jsonb, 'c', 'Rotation changes orientation, not the shape itself.'),
  ('spatial-thinking', 2, 'A shape faces north. It turns right, then right again. Which direction does it face?', '[{"id":"a","text":"North"},{"id":"b","text":"South"},{"id":"c","text":"East"},{"id":"d","text":"West"}]'::jsonb, 'b', 'Two right turns make a 180-degree turn, facing south.'),
  ('spatial-thinking', 3, 'How many sides does a hexagon have?', '[{"id":"a","text":"5"},{"id":"b","text":"6"},{"id":"c","text":"7"},{"id":"d","text":"8"}]'::jsonb, 'b', 'A hexagon has six sides.'),
  ('spatial-thinking', 4, 'Which capital letter has vertical line symmetry in a standard block font?', '[{"id":"a","text":"F"},{"id":"b","text":"G"},{"id":"c","text":"A"},{"id":"d","text":"R"}]'::jsonb, 'c', 'A standard uppercase A has a vertical line of symmetry.'),
  ('spatial-thinking', 5, 'A cube has how many vertices (corners)?', '[{"id":"a","text":"6"},{"id":"b","text":"8"},{"id":"c","text":"10"},{"id":"d","text":"12"}]'::jsonb, 'b', 'A cube has eight vertices.'),
  ('memory-focus', 1, 'Which number is different from the others: 121, 144, 169, 180?', '[{"id":"a","text":"121"},{"id":"b","text":"144"},{"id":"c","text":"169"},{"id":"d","text":"180"}]'::jsonb, 'd', '121, 144 and 169 are square numbers; 180 is not.'),
  ('memory-focus', 2, 'A note says: “Bring a blue folder, 3 pens and a ruler.” What colour is the folder?', '[{"id":"a","text":"Red"},{"id":"b","text":"Green"},{"id":"c","text":"Blue"},{"id":"d","text":"Black"}]'::jsonb, 'c', 'The note explicitly says blue.'),
  ('memory-focus', 3, 'Which pair appeared in this order: 7, 2, 9, 4, 1?', '[{"id":"a","text":"2 then 9"},{"id":"b","text":"9 then 2"},{"id":"c","text":"4 then 9"},{"id":"d","text":"1 then 7"}]'::jsonb, 'a', 'The sequence places 2 immediately before 9.'),
  ('memory-focus', 4, 'A meeting starts at 10:20 and lasts 45 minutes. When does it end?', '[{"id":"a","text":"10:55"},{"id":"b","text":"11:00"},{"id":"c","text":"11:05"},{"id":"d","text":"11:15"}]'::jsonb, 'c', 'Forty minutes after 10:20 is 11:00, plus five minutes is 11:05.'),
  ('memory-focus', 5, 'Which item was mentioned first in this list: key, bottle, notebook, charger?', '[{"id":"a","text":"Bottle"},{"id":"b","text":"Notebook"},{"id":"c","text":"Key"},{"id":"d","text":"Charger"}]'::jsonb, 'c', 'Key was the first item in the list.')
),
inserted as (
  insert into public.brain_challenge_questions (challenge_id, prompt, options, points, explanation, sort_order)
  select c.id, q.prompt, q.options, 1, q.explanation, q.sort_order
  from question_data q
  join public.brain_challenges c on c.slug = q.slug
  on conflict (challenge_id, sort_order) do nothing
  returning id, challenge_id, sort_order
)
insert into public.brain_challenge_answer_keys (question_id, correct_option_ids)
select q.id,
  case d.correct_id
    when 'a' then array['a']::text[]
    when 'b' then array['b']::text[]
    when 'c' then array['c']::text[]
    when 'd' then array['d']::text[]
  end
from public.brain_challenge_questions q
join public.brain_challenges c on c.id = q.challenge_id
join question_data d on d.slug = c.slug and d.sort_order = q.sort_order
on conflict (question_id) do nothing;
