-- APTIVIO academic review and publication gate.
-- This is a reviewed SQL proposal, not an applied migration.
-- Generate the actual migration with: supabase migration new academic_review_gate

alter type public.app_role add value if not exists 'academic_reviewer';

create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.course_versions(id) on delete restrict,
  reviewer_user_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('approved', 'revision_required')),
  review_notes text not null check (char_length(review_notes) between 30 and 5000),
  content_fingerprint text not null check (content_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists course_reviews_version_created_idx
  on public.course_reviews(course_version_id, created_at desc);

create index if not exists course_reviews_approved_fingerprint_idx
  on public.course_reviews(course_version_id, content_fingerprint)
  where decision = 'approved';

alter table public.course_reviews enable row level security;
revoke all on public.course_reviews from anon, authenticated;
grant select on public.course_reviews to authenticated;
grant all on public.course_reviews to service_role;

create or replace function private.has_academic_reviewer_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role::text = 'academic_reviewer'
  );
$function$;

revoke all on function private.has_academic_reviewer_role() from public, anon;
grant execute on function private.has_academic_reviewer_role() to authenticated;

drop policy if exists "academic staff read course review history" on public.course_reviews;
create policy "academic staff read course review history"
on public.course_reviews
for select
to authenticated
using (
  (select private.has_academic_reviewer_role())
  or (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
);

create or replace function public.course_version_fingerprint(p_course_version_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'course',
          jsonb_build_object(
            'id', c.id,
            'slug', c.slug,
            'category_id', c.category_id,
            'level', c.level::text,
            'language_code', c.language_code,
            'price_minor', c.price_minor,
            'currency', c.currency
          ),
          'version',
          jsonb_build_object(
            'id', cv.id,
            'version_number', cv.version_number,
            'title', cv.title,
            'subtitle', cv.subtitle,
            'description', cv.description,
            'outcomes', cv.outcomes,
            'prerequisites', cv.prerequisites,
            'target_audience', cv.target_audience,
            'duration_minutes', cv.duration_minutes,
            'change_summary', cv.change_summary
          ),
          'sections',
          coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'title', s.title,
                'description', s.description,
                'sort_order', s.sort_order,
                'lessons', coalesce((
                  select jsonb_agg(
                    jsonb_build_object(
                      'title', l.title,
                      'lesson_type', l.lesson_type::text,
                      'body_markdown', l.body_markdown,
                      'media_provider', l.media_provider,
                      'media_reference', l.media_reference,
                      'duration_seconds', l.duration_seconds,
                      'is_preview', l.is_preview,
                      'sort_order', l.sort_order
                    ) order by l.sort_order
                  )
                  from public.lessons l
                  where l.section_id = s.id
                ), '[]'::jsonb)
              ) order by s.sort_order
            )
            from public.course_sections s
            where s.course_version_id = cv.id
          ), '[]'::jsonb),
          'assessment',
          coalesce((
            select jsonb_build_object(
              'title', a.title,
              'instructions', a.instructions,
              'pass_mark_percent', a.pass_mark_percent,
              'total_marks', a.total_marks,
              'questions', a.questions,
              'final_project', a.final_project,
              'source_references', a.source_references,
              'equipment', a.equipment,
              'accessibility', a.accessibility
            )
            from public.course_assessments a
            where a.course_version_id = cv.id
          ), '{}'::jsonb)
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  )
  from public.course_versions cv
  join public.courses c on c.id = cv.course_id
  where cv.id = p_course_version_id;
$function$;

revoke all on function public.course_version_fingerprint(uuid) from public, anon, authenticated;
grant execute on function public.course_version_fingerprint(uuid) to service_role;

create or replace function public.record_course_review(
  p_course_version_id uuid,
  p_decision text,
  p_review_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_reviewer_id uuid := auth.uid();
  v_author_id uuid;
  v_course_status public.course_status;
  v_fingerprint text;
  v_review_id uuid;
begin
  if v_reviewer_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if not private.has_academic_reviewer_role() then
    raise exception 'academic_reviewer_role_required' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'revision_required')
     or p_review_notes is null
     or char_length(p_review_notes) < 30
     or char_length(p_review_notes) > 5000 then
    raise exception 'invalid_review_decision_or_notes' using errcode = '22023';
  end if;

  select cv.created_by, c.status
  into v_author_id, v_course_status
  from public.course_versions cv
  join public.courses c on c.id = cv.course_id
  where cv.id = p_course_version_id;

  if not found then
    raise exception 'course_version_not_found' using errcode = 'P0002';
  end if;

  if v_author_id = v_reviewer_id then
    raise exception 'authors_cannot_approve_their_own_course' using errcode = '42501';
  end if;

  if v_course_status <> 'in_review' then
    raise exception 'course_must_be_in_review' using errcode = 'P0001';
  end if;

  v_fingerprint := public.course_version_fingerprint(p_course_version_id);
  if v_fingerprint is null then
    raise exception 'course_version_fingerprint_unavailable' using errcode = 'P0002';
  end if;

  insert into public.course_reviews (
    course_version_id, reviewer_user_id, decision, review_notes, content_fingerprint
  ) values (
    p_course_version_id, v_reviewer_id, p_decision, p_review_notes, v_fingerprint
  )
  returning id into v_review_id;

  return v_review_id;
end;
$function$;

revoke all on function public.record_course_review(uuid, text, text) from public, anon;
grant execute on function public.record_course_review(uuid, text, text) to authenticated;

create or replace function private.prevent_approved_course_content_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_version_id uuid;
  v_other_version_id uuid;
  v_section_id uuid;
begin
  if tg_table_name = 'course_versions' then
    if tg_op = 'DELETE' then
      v_version_id := old.id;
    else
      v_version_id := new.id;
    end if;
    if tg_op = 'UPDATE' then
      if (to_jsonb(new) - 'reviewed_by' - 'reviewed_at' - 'review_date')
         is not distinct from
         (to_jsonb(old) - 'reviewed_by' - 'reviewed_at' - 'review_date') then
        return new;
      end if;
    end if;
  elsif tg_table_name = 'course_sections' then
    if tg_op = 'DELETE' then
      v_version_id := old.course_version_id;
    else
      v_version_id := new.course_version_id;
    end if;
    if tg_op = 'UPDATE' then
      v_other_version_id := old.course_version_id;
    end if;
  elsif tg_table_name = 'lessons' then
    if tg_op = 'DELETE' then
      v_section_id := old.section_id;
    else
      v_section_id := new.section_id;
    end if;
    select s.course_version_id into v_version_id
    from public.course_sections s
    where s.id = v_section_id;
    if tg_op = 'UPDATE' then
      select s.course_version_id into v_other_version_id
      from public.course_sections s
      where s.id = old.section_id;
    end if;
  elsif tg_table_name = 'course_assessments' then
    if tg_op = 'DELETE' then
      v_version_id := old.course_version_id;
    else
      v_version_id := new.course_version_id;
    end if;
    if tg_op = 'UPDATE' then
      v_other_version_id := old.course_version_id;
    end if;
  end if;

  if exists (
    select 1 from public.course_reviews r
    where r.course_version_id in (v_version_id, v_other_version_id)
      and r.decision = 'approved'
  ) then
    raise exception 'approved_course_version_is_immutable_create_a_new_version'
      using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;

revoke all on function private.prevent_approved_course_content_mutation() from public, anon, authenticated;

drop trigger if exists freeze_approved_course_version on public.course_versions;
create trigger freeze_approved_course_version
before update or delete on public.course_versions
for each row execute function private.prevent_approved_course_content_mutation();

drop trigger if exists freeze_approved_course_sections on public.course_sections;
create trigger freeze_approved_course_sections
before insert or update or delete on public.course_sections
for each row execute function private.prevent_approved_course_content_mutation();

drop trigger if exists freeze_approved_lessons on public.lessons;
create trigger freeze_approved_lessons
before insert or update or delete on public.lessons
for each row execute function private.prevent_approved_course_content_mutation();

drop trigger if exists freeze_approved_course_assessments on public.course_assessments;
create trigger freeze_approved_course_assessments
before insert or update or delete on public.course_assessments
for each row execute function private.prevent_approved_course_content_mutation();

create or replace function private.guard_course_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_review public.course_reviews%rowtype;
  v_fingerprint text;
begin
  if new.status = 'published'
     and (
       old.status is distinct from new.status
       or old.published_version_id is distinct from new.published_version_id
     ) then
    if new.published_version_id is null then
      raise exception 'published_course_requires_a_version' using errcode = '23514';
    end if;

    v_fingerprint := public.course_version_fingerprint(new.published_version_id);

    select * into v_review
    from public.course_reviews r
    where r.course_version_id = new.published_version_id
      and r.decision = 'approved'
      and r.content_fingerprint = v_fingerprint
    order by r.created_at desc
    limit 1;

    if not found then
      raise exception 'matching_academic_approval_required_before_publication'
        using errcode = '42501';
    end if;

    update public.course_versions
    set reviewed_by = v_review.reviewer_user_id,
        reviewed_at = v_review.created_at,
        review_date = (v_review.created_at at time zone 'UTC')::date
    where id = new.published_version_id
      and course_id = new.id;
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_course_publication() from public, anon, authenticated;

drop trigger if exists require_academic_approval_before_publish on public.courses;
create trigger require_academic_approval_before_publish
before update of status, published_version_id on public.courses
for each row execute function private.guard_course_publication();


-- Publication is a separate reviewer action after the matching version has
-- an approved review. The courses trigger independently enforces the same
-- fingerprint check, so direct table updates cannot bypass the gate.
create or replace function public.publish_reviewed_course_version(
  p_course_version_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_reviewer_id uuid := auth.uid();
  v_course_id uuid;
  v_course_status public.course_status;
  v_fingerprint text;
begin
  if v_reviewer_id is null or not private.has_academic_reviewer_role() then
    raise exception 'academic_reviewer_role_required' using errcode = '42501';
  end if;

  select cv.course_id, c.status
  into v_course_id, v_course_status
  from public.course_versions cv
  join public.courses c on c.id = cv.course_id
  where cv.id = p_course_version_id
  for update of cv, c;

  if not found then
    raise exception 'course_version_not_found' using errcode = 'P0002';
  end if;

  if v_course_status <> 'in_review' then
    raise exception 'course_must_be_in_review_before_publication' using errcode = 'P0001';
  end if;

  v_fingerprint := public.course_version_fingerprint(p_course_version_id);

  if not exists (
    select 1
    from public.course_reviews r
    where r.course_version_id = p_course_version_id
      and r.decision = 'approved'
      and r.content_fingerprint = v_fingerprint
  ) then
    raise exception 'current_content_requires_academic_approval' using errcode = '42501';
  end if;

  update public.courses
  set status = 'published',
      published_version_id = p_course_version_id,
      published_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  where id = v_course_id;

  return v_course_id;
end;
$function$;

revoke all on function public.publish_reviewed_course_version(uuid) from public, anon;
grant execute on function public.publish_reviewed_course_version(uuid) to authenticated;


create or replace function public.submit_course_version_for_review(
  p_course_version_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_course_id uuid;
  v_status public.course_status;
  v_section_count integer;
  v_lesson_count integer;
  v_assessment_count integer;
begin
  if auth.uid() is null
     or not (
       private.has_role('admin'::public.app_role)
       or private.has_role('content_manager'::public.app_role)
     ) then
    raise exception 'content_manager_role_required' using errcode = '42501';
  end if;

  select cv.course_id, c.status
  into v_course_id, v_status
  from public.course_versions cv
  join public.courses c on c.id = cv.course_id
  where cv.id = p_course_version_id
  for update of cv, c;

  if not found then
    raise exception 'course_version_not_found' using errcode = 'P0002';
  end if;

  if v_status <> 'draft' then
    raise exception 'only_draft_courses_can_enter_review' using errcode = 'P0001';
  end if;

  select count(*) into v_section_count
  from public.course_sections s
  where s.course_version_id = p_course_version_id;

  select count(*) into v_lesson_count
  from public.course_sections s
  join public.lessons l on l.section_id = s.id
  where s.course_version_id = p_course_version_id;

  select count(*) into v_assessment_count
  from public.course_assessments a
  where a.course_version_id = p_course_version_id;

  if v_section_count < 4 or v_lesson_count < 16 or v_assessment_count <> 1 then
    raise exception 'course_requires_four_sections_sixteen_lessons_and_one_assessment'
      using errcode = '23514';
  end if;

  update public.courses
  set status = 'in_review', updated_at = pg_catalog.now()
  where id = v_course_id;

  return v_course_id;
end;
$function$;

revoke all on function public.submit_course_version_for_review(uuid) from public, anon;
grant execute on function public.submit_course_version_for_review(uuid) to authenticated;
