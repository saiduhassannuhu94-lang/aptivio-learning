-- APTIVIO Batch 1 import foundation.
-- Review this file and convert it into a timestamped Supabase migration with
-- supabase migration new batch1_course_import before applying it anywhere.
-- This file is intentionally NOT applied to the linked production database.

create table if not exists public.course_assessments (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null unique references public.course_versions(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  instructions text not null default '',
  pass_mark_percent numeric(5,2) not null check (pass_mark_percent between 50 and 100),
  total_marks integer not null check (total_marks > 0),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) >= 5),
  final_project jsonb not null check (jsonb_typeof(final_project) = 'object'),
  source_references jsonb not null default '[]'::jsonb check (jsonb_typeof(source_references) = 'array'),
  equipment jsonb not null default '[]'::jsonb check (jsonb_typeof(equipment) = 'array'),
  accessibility text not null default '',
  content_fingerprint text not null check (content_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.course_package_imports (
  course_slug text primary key,
  package_fingerprint text not null check (package_fingerprint ~ '^[a-f0-9]{64}$'),
  course_id uuid not null references public.courses(id) on delete cascade,
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  imported_at timestamptz not null default now()
);

alter table public.course_assessments enable row level security;
alter table public.course_package_imports enable row level security;

drop policy if exists "enrolled learners read their version assessment" on public.course_assessments;
create policy "enrolled learners read their version assessment"
on public.course_assessments
for select
to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    where e.user_id = (select auth.uid())
      and e.course_version_id = course_assessments.course_version_id
      and e.status in ('active', 'completed')
  )
);

revoke all on public.course_assessments from anon, authenticated;
grant select on public.course_assessments to authenticated;
revoke all on public.course_package_imports from anon, authenticated;
grant all on public.course_assessments, public.course_package_imports to service_role;

create or replace function public.import_course_package(p_package jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_course jsonb;
  v_slug text;
  v_hash text;
  v_course_id uuid;
  v_version_id uuid;
  v_category_id uuid;
  v_section jsonb;
  v_lesson jsonb;
  v_section_id uuid;
  v_section_order integer := 0;
  v_lesson_order integer;
  v_lesson_body text;
  v_existing public.course_package_imports%rowtype;
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_package) <> 'object'
     or p_package ->> 'schema_version' <> 'aptivio.course-package.v1'
     or jsonb_typeof(p_package -> 'course') <> 'object' then
    raise exception 'invalid_course_package' using errcode = '22023';
  end if;

  v_course := p_package -> 'course';
  v_slug := v_course ->> 'slug';

  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or length(v_slug) > 120 then
    raise exception 'invalid_course_slug' using errcode = '22023';
  end if;

  if coalesce(v_course ->> 'price_minor', '') <> '0'
     or coalesce(v_course ->> 'currency', '') <> 'NGN' then
    raise exception 'batch_1_courses_must_be_free_ngn' using errcode = '22023';
  end if;

  if jsonb_typeof(v_course -> 'sections') <> 'array'
     or jsonb_array_length(v_course -> 'sections') <> 4
     or (
       select coalesce(sum(
         case when jsonb_typeof(section -> 'lessons') = 'array'
           then jsonb_array_length(section -> 'lessons')
           else 0
         end
       ), 0)
       from jsonb_array_elements(v_course -> 'sections') as sections(section)
     ) <> 16
     or exists (
       select 1
       from jsonb_array_elements(v_course -> 'sections') as sections(section)
       where jsonb_typeof(section -> 'lessons') <> 'array'
          or jsonb_array_length(section -> 'lessons') = 0
          or nullif(section ->> 'title', '') is null
          or exists (
            select 1
            from jsonb_array_elements(section -> 'lessons') as lessons(lesson)
            where nullif(lesson ->> 'title', '') is null
               or length(coalesce(lesson ->> 'body_markdown', '')) < 500
               or nullif(lesson ->> 'exercise', '') is null
          )
     )
     or nullif(v_course #>> '{assessment,title}', '') is null
     or jsonb_typeof(v_course #> '{assessment,questions}') <> 'array'
     or jsonb_array_length(v_course #> '{assessment,questions}') < 5
     or exists (
       select 1
       from jsonb_array_elements(v_course #> '{assessment,questions}') as questions(question)
       where nullif(question ->> 'id', '') is null
          or nullif(question ->> 'prompt', '') is null
          or coalesce((question ->> 'marks')::integer, 0) <= 0
          or jsonb_typeof(question -> 'rubric') <> 'array'
          or jsonb_array_length(question -> 'rubric') < 2
     )
     or (v_course #>> '{assessment,total_marks}')::integer <>
       (select sum((question ->> 'marks')::integer)
        from jsonb_array_elements(v_course #> '{assessment,questions}') as questions(question))
     or jsonb_typeof(v_course -> 'final_project') <> 'object'
     or jsonb_array_length(coalesce(v_course #> '{final_project,deliverables}', '[]'::jsonb)) = 0
     or jsonb_array_length(coalesce(v_course #> '{final_project,acceptance_criteria}', '[]'::jsonb)) = 0 then
    raise exception 'course_package_is_incomplete' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_slug));

  v_hash := encode(
    extensions.digest(convert_to(p_package::text, 'UTF8'), 'sha256'),
    'hex'
  );

  select * into v_existing
  from public.course_package_imports
  where course_slug = v_slug
  for update;

  if found then
    if v_existing.package_fingerprint = v_hash then
      return jsonb_build_object(
        'inserted', false,
        'course_id', v_existing.course_id,
        'course_version_id', v_existing.course_version_id,
        'slug', v_slug,
        'status', 'draft',
        'message', 'Package already imported; no changes made.'
      );
    end if;
    raise exception 'package_changed_after_import_create_new_version' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.courses c where c.slug = v_slug) then
    raise exception 'course_slug_exists_without_import_ledger_refusing_overwrite' using errcode = '23505';
  end if;

  select id into v_category_id
  from public.categories
  where slug = 'computing-technology' and is_active = true
  limit 1;

  insert into public.courses (
    category_id, slug, status, level, language_code, price_minor, currency
  ) values (
    v_category_id,
    v_slug,
    'draft',
    (v_course ->> 'level')::public.course_level,
    coalesce(v_course ->> 'language_code', 'en'),
    0,
    'NGN'
  )
  returning id into v_course_id;

  insert into public.course_versions (
    course_id, version_number, title, subtitle, description,
    outcomes, prerequisites, target_audience, duration_minutes,
    change_summary
  ) values (
    v_course_id,
    1,
    v_course ->> 'title',
    coalesce(v_course ->> 'subtitle', ''),
    coalesce(v_course ->> 'description', ''),
    array(select jsonb_array_elements_text(coalesce(v_course -> 'outcomes', '[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(v_course -> 'prerequisites', '[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(v_course -> 'target_audience', '[]'::jsonb))),
    coalesce((v_course ->> 'duration_minutes')::integer, 0),
    'Imported from Batch 1 package as an unreviewed draft. Not approved or published.'
  )
  returning id into v_version_id;

  for v_section in
    select value
    from jsonb_array_elements(v_course -> 'sections') with ordinality as items(value, position)
    order by position
  loop
    insert into public.course_sections (
      course_version_id, title, description, sort_order
    ) values (
      v_version_id,
      v_section ->> 'title',
      coalesce(v_section ->> 'description', ''),
      v_section_order
    )
    returning id into v_section_id;

    v_lesson_order := 0;
    for v_lesson in
      select value
      from jsonb_array_elements(v_section -> 'lessons') with ordinality as lessons(value, position)
      order by position
    loop
      v_lesson_body :=
        coalesce(v_lesson ->> 'body_markdown', '') ||
        E'\n\n## Exercise\n\n' || coalesce(v_lesson ->> 'exercise', '') ||
        E'\n\n## Key takeaways\n\n' ||
        coalesce((
          select string_agg('- ' || takeaway, E'\n' order by position)
          from jsonb_array_elements_text(coalesce(v_lesson -> 'key_takeaways', '[]'::jsonb))
            with ordinality as takeaways(takeaway, position)
        ), '');

      insert into public.lessons (
        section_id, title, lesson_type, body_markdown,
        duration_seconds, is_preview, sort_order
      ) values (
        v_section_id,
        v_lesson ->> 'title',
        'text',
        v_lesson_body,
        greatest(0, coalesce((v_lesson ->> 'duration_minutes')::integer, 0) * 60),
        false,
        v_lesson_order
      );

      v_lesson_order := v_lesson_order + 1;
    end loop;

    v_section_order := v_section_order + 1;
  end loop;

  insert into public.course_assessments (
    course_version_id, title, instructions, pass_mark_percent, total_marks,
    questions, final_project, source_references, equipment, accessibility, content_fingerprint
  ) values (
    v_version_id,
    v_course #>> '{assessment,title}',
    coalesce(v_course #>> '{assessment,instructions}', ''),
    (v_course #>> '{assessment,pass_mark_percent}')::numeric,
    (v_course #>> '{assessment,total_marks}')::integer,
    v_course #> '{assessment,questions}',
    v_course -> 'final_project',
    coalesce(v_course -> 'references', '[]'::jsonb),
    coalesce(v_course -> 'equipment', '[]'::jsonb),
    coalesce(v_course ->> 'accessibility', ''),
    v_hash
  );

  insert into public.course_package_imports (
    course_slug, package_fingerprint, course_id, course_version_id
  ) values (v_slug, v_hash, v_course_id, v_version_id);

  return jsonb_build_object(
    'inserted', true,
    'course_id', v_course_id,
    'course_version_id', v_version_id,
    'slug', v_slug,
    'status', 'draft',
    'sections', v_section_order,
    'lessons', (select count(*) from public.course_sections s
      join public.lessons l on l.section_id = s.id
      where s.course_version_id = v_version_id),
    'message', 'Course imported as a draft. Academic review and publication are still required.'
  );
end;
$function$;

revoke all on function public.import_course_package(jsonb) from public, anon, authenticated;
grant execute on function public.import_course_package(jsonb) to service_role;


create table if not exists public.course_assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.course_assessments(id) on delete cascade,
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  status text not null default 'submitted' check (status in ('submitted', 'graded')),
  submitted_at timestamptz not null default now(),
  grade_percent numeric(5,2) check (grade_percent between 0 and 100),
  feedback text,
  graded_by uuid references auth.users(id) on delete set null,
  graded_at timestamptz,
  unique (assessment_id, enrollment_id),
  check (
    (status = 'submitted' and grade_percent is null and graded_by is null and graded_at is null)
    or
    (status = 'graded' and grade_percent is not null and graded_by is not null and graded_at is not null)
  )
);

alter table public.course_assessment_submissions enable row level security;
drop policy if exists "learners read own assessment submissions" on public.course_assessment_submissions;
create policy "learners read own assessment submissions"
on public.course_assessment_submissions
for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.course_assessment_submissions from anon, authenticated;
grant select on public.course_assessment_submissions to authenticated;
grant all on public.course_assessment_submissions to service_role;

create or replace function public.submit_course_assessment(
  p_assessment_id uuid,
  p_answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_course_version_id uuid;
  v_questions jsonb;
  v_enrollment_id uuid;
  v_submission_id uuid;
  v_existing_status text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select a.course_version_id, a.questions
  into v_course_version_id, v_questions
  from public.course_assessments a
  where a.id = p_assessment_id;

  if not found then
    raise exception 'assessment_not_found' using errcode = 'P0002';
  end if;

  select e.id into v_enrollment_id
  from public.enrollments e
  join public.courses c on c.id = e.course_id
  where e.user_id = v_user_id
    and e.course_version_id = v_course_version_id
    and c.published_version_id = v_course_version_id
    and c.status = 'published'
    and e.status in ('active', 'completed')
  limit 1;

  if v_enrollment_id is null then
    raise exception 'active_enrollment_required' using errcode = '42501';
  end if;

  if p_answers is null
     or jsonb_typeof(p_answers) <> 'array'
     or jsonb_array_length(p_answers) <> jsonb_array_length(v_questions) then
    raise exception 'incomplete_assessment_answers' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) as submitted(item)
    where jsonb_typeof(item) <> 'object'
       or nullif(item ->> 'question_id', '') is null
       or nullif(item ->> 'response', '') is null
       or length(item ->> 'response') > 12000
       or not exists (
         select 1
         from jsonb_array_elements(v_questions) as questions(question)
         where question ->> 'id' = item ->> 'question_id'
       )
  ) then
    raise exception 'invalid_assessment_answer' using errcode = '22023';
  end if;

  if (
    select count(distinct item ->> 'question_id')
    from jsonb_array_elements(p_answers) as submitted(item)
  ) <> jsonb_array_length(v_questions) then
    raise exception 'duplicate_or_missing_assessment_question' using errcode = '22023';
  end if;

  insert into public.course_assessment_submissions (
    assessment_id, course_version_id, enrollment_id, user_id, answers
  ) values (
    p_assessment_id, v_course_version_id, v_enrollment_id, v_user_id, p_answers
  )
  on conflict (assessment_id, enrollment_id)
  do update set
    answers = excluded.answers,
    submitted_at = pg_catalog.now()
  where public.course_assessment_submissions.status = 'submitted'
  returning id into v_submission_id;

  if v_submission_id is null then
    select s.id, s.status
    into v_submission_id, v_existing_status
    from public.course_assessment_submissions s
    where s.assessment_id = p_assessment_id
      and s.enrollment_id = v_enrollment_id;

    if v_existing_status = 'graded' then
      raise exception 'assessment_already_graded' using errcode = 'P0001';
    end if;
  end if;

  return v_submission_id;
end;
$function$;

revoke all on function public.submit_course_assessment(uuid, jsonb) from public, anon;
grant execute on function public.submit_course_assessment(uuid, jsonb) to authenticated;
