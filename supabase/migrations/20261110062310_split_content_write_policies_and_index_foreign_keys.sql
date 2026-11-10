-- Separate write policies from read policies to avoid duplicate permissive SELECT rules.
drop policy if exists "Content managers manage categories" on public.categories;
drop policy if exists "Content managers manage courses" on public.courses;
drop policy if exists "Content managers manage course versions" on public.course_versions;
drop policy if exists "Content managers manage sections" on public.course_sections;
drop policy if exists "Content managers manage lessons" on public.lessons;

create policy "Content managers insert categories"
on public.categories for insert to authenticated
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers update categories"
on public.categories for update to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')))
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers delete categories"
on public.categories for delete to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')));

create policy "Content managers insert courses"
on public.courses for insert to authenticated
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers update courses"
on public.courses for update to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')))
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers delete courses"
on public.courses for delete to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')));

create policy "Content managers insert course versions"
on public.course_versions for insert to authenticated
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers update course versions"
on public.course_versions for update to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')))
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers delete course versions"
on public.course_versions for delete to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')));

create policy "Content managers insert sections"
on public.course_sections for insert to authenticated
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers update sections"
on public.course_sections for update to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')))
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers delete sections"
on public.course_sections for delete to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')));

create policy "Content managers insert lessons"
on public.lessons for insert to authenticated
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers update lessons"
on public.lessons for update to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')))
with check ((select private.has_role('admin')) or (select private.has_role('content_manager')));
create policy "Content managers delete lessons"
on public.lessons for delete to authenticated
using ((select private.has_role('admin')) or (select private.has_role('content_manager')));

-- Cover foreign-key lookups used by joins and deletes.
create index if not exists admin_audit_logs_actor_user_id_idx on public.admin_audit_logs(actor_user_id);
create index if not exists course_versions_created_by_idx on public.course_versions(created_by);
create index if not exists course_versions_reviewed_by_idx on public.course_versions(reviewed_by);
create index if not exists courses_created_by_idx on public.courses(created_by);
create index if not exists courses_updated_by_idx on public.courses(updated_by);
create index if not exists courses_published_version_fk_idx on public.courses(published_version_id, id);
create index if not exists enrollments_course_version_fk_idx on public.enrollments(course_version_id, course_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);
create index if not exists user_roles_assigned_by_idx on public.user_roles(assigned_by);
