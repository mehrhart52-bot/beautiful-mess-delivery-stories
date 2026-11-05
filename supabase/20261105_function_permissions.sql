-- Tighten function permissions without changing accounts or stories.
begin;

-- Trigger functions are invoked by the database, not by app/API callers.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.assign_story_code() from public, anon, authenticated;
revoke execute on function public.limit_story_submissions() from public, anon, authenticated;
revoke execute on function public.protect_own_admin_access() from public, anon, authenticated;

-- Row-security policies need these checks for signed-in users only.
-- Neither function accepts another user's ID; both inspect auth.uid().
revoke execute on function public.is_active_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- This intentionally exposes only first names to active signed-in members.
revoke execute on function public.story_authors(uuid[]) from public, anon, authenticated;
grant execute on function public.story_authors(uuid[]) to authenticated;

notify pgrst, 'reload schema';
commit;
