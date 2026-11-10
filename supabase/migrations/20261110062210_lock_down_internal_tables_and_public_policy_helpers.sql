-- Generated from the applied APTIVIO hardening migration.
-- Internal authorization tables remain inaccessible to browser roles.
-- Helper functions return only boolean authorization results and are safe
-- for anonymous execution because auth.uid() is NULL for anonymous requests.

create policy "Internal roles are not client-readable"
  on public.user_roles for all to anon, authenticated
  using (false) with check (false);

create policy "Audit log is server-managed"
  on public.admin_audit_logs for all to anon, authenticated
  using (false) with check (false);

grant usage on schema private to anon;
grant execute on function private.has_role(public.app_role) to anon;
grant execute on function private.can_access_course(uuid) to anon;
