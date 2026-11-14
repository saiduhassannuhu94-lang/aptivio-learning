create table if not exists public.learning_library_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_path_slug text not null
    check (length(learning_path_slug) <= 100 and learning_path_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  lesson_number integer not null check (lesson_number between 1 and 100),
  completed_at timestamptz not null default pg_catalog.now(),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, learning_path_slug, lesson_number)
);

alter table public.learning_library_progress enable row level security;
revoke all on public.learning_library_progress from anon;
grant select, insert, update, delete on public.learning_library_progress to authenticated;
grant all on public.learning_library_progress to service_role;

create policy "Users can read their own learning library progress"
  on public.learning_library_progress for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their own learning library progress"
  on public.learning_library_progress for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their own learning library progress"
  on public.learning_library_progress for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their own learning library progress"
  on public.learning_library_progress for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
