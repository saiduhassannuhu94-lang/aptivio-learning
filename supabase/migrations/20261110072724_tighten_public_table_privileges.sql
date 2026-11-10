-- Revoke broad default grants and restore only the operations needed by each client role.
revoke all privileges on all tables in schema public from anon, authenticated;

grant select on table
  public.categories,
  public.courses,
  public.course_versions,
  public.course_sections,
  public.lessons
to anon;

grant select on table
  public.categories,
  public.courses,
  public.course_versions,
  public.course_sections,
  public.lessons,
  public.profiles,
  public.enrollments,
  public.lesson_progress
to authenticated;

grant insert, update on table public.profiles to authenticated;
grant insert on table public.enrollments to authenticated;
grant insert, update on table public.lesson_progress to authenticated;

grant insert, update, delete on table
  public.categories,
  public.courses,
  public.course_versions,
  public.course_sections,
  public.lessons
to authenticated;
