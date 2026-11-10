-- Correct the published-version visibility predicate.
-- The course pointer references course_versions.id, not courses.id.

drop policy if exists "Published course versions are visible" on public.course_versions;

create policy "Published course versions are visible"
on public.course_versions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_versions.course_id
      and c.status = 'published'::public.course_status
      and c.published_version_id = course_versions.id
  )
  or (select private.can_access_course_version(course_versions.id))
  or (select private.has_role('admin'::public.app_role))
  or (select private.has_role('content_manager'::public.app_role))
);
