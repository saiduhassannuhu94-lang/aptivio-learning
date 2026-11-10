create or replace function private.can_access_course_version(target_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.course_version_id = target_version_id
      and e.user_id = (select auth.uid())
      and e.status in ('active', 'completed')
  );
$$;

revoke all on function private.can_access_course_version(uuid) from public;
grant execute on function private.can_access_course_version(uuid) to anon, authenticated;

drop policy if exists "Published course versions are visible" on public.course_versions;
create policy "Published course versions are visible"
on public.course_versions for select to anon, authenticated
using (
  exists (
    select 1 from public.courses c
    where c.id = course_id
      and c.status = 'published'
      and c.published_version_id = id
  )
  or (select private.can_access_course_version(id))
  or (select private.has_role('admin'))
  or (select private.has_role('content_manager'))
);

drop policy if exists "Published course sections are visible" on public.course_sections;
create policy "Published course sections are visible"
on public.course_sections for select to anon, authenticated
using (
  exists (
    select 1 from public.course_versions cv
    join public.courses c on c.id = cv.course_id
    where cv.id = course_version_id
      and c.status = 'published'
      and c.published_version_id = cv.id
  )
  or (select private.can_access_course_version(course_version_id))
  or (select private.has_role('admin'))
  or (select private.has_role('content_manager'))
);

drop policy if exists "Preview or enrolled lessons are visible" on public.lessons;
create policy "Preview or enrolled lessons are visible"
on public.lessons for select to anon, authenticated
using (
  exists (
    select 1
    from public.course_sections s
    join public.course_versions cv on cv.id = s.course_version_id
    join public.courses c on c.id = cv.course_id
    where s.id = section_id
      and c.status = 'published'
      and c.published_version_id = cv.id
      and is_preview
  )
  or exists (
    select 1
    from public.course_sections s
    join public.course_versions cv on cv.id = s.course_version_id
    where s.id = section_id
      and (select private.can_access_course_version(cv.id))
  )
  or (select private.has_role('admin'))
  or (select private.has_role('content_manager'))
);

drop policy if exists "Users create progress for enrolled lessons" on public.lesson_progress;
create policy "Users create progress for enrolled lessons"
on public.lesson_progress for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.enrollments e
    join public.lessons l on l.id = lesson_id
    join public.course_sections s on s.id = l.section_id
    join public.course_versions cv on cv.id = s.course_version_id
    where e.id = enrollment_id
      and e.user_id = (select auth.uid())
      and e.course_version_id = cv.id
      and e.status in ('active', 'completed')
  )
);

drop policy if exists "Users update their own lesson progress" on public.lesson_progress;
create policy "Users update their own lesson progress"
on public.lesson_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.enrollments e
    join public.lessons l on l.id = lesson_id
    join public.course_sections s on s.id = l.section_id
    join public.course_versions cv on cv.id = s.course_version_id
    where e.id = enrollment_id
      and e.user_id = (select auth.uid())
      and e.course_version_id = cv.id
      and e.status in ('active', 'completed')
  )
);
