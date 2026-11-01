-- Run once in this app's Supabase SQL Editor before using the updated app.
begin;

-- The original policy exposed every member's email and full name to any member.
drop policy if exists "Users can read profiles" on public.profiles;
create policy "Users can read profiles" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Deliberately return only first names, only for story authors, to active users.
create or replace function public.story_authors(author_ids uuid[])
returns table (id uuid, display_name text)
language sql stable security definer set search_path = ''
as $$
  select p.id, split_part(regexp_replace(trim(p.display_name), '\s+', ' ', 'g'), ' ', 1)
  from public.profiles p
  where public.is_active_user()
    and p.id = any(author_ids)
    and exists (select 1 from public.stories s where s.user_id = p.id);
$$;
revoke all on function public.story_authors(uuid[]) from public;
grant execute on function public.story_authors(uuid[]) to authenticated;

-- Reset broad Supabase default grants as well as explicit column grants.
revoke all on public.profiles, public.stories from anon, authenticated;
revoke update (role, active) on public.profiles from authenticated;
revoke update (body, updated_at, theme, experience) on public.stories from authenticated;
grant select on public.profiles to authenticated;
grant update (role, active) on public.profiles to authenticated;
grant select, delete on public.stories to authenticated;
grant insert (user_id, body, experience, theme) on public.stories to authenticated;
grant update (body, updated_at, theme, experience) on public.stories to authenticated;
revoke all on sequence public.story_number_seq from public, anon, authenticated;

-- A word limit alone permits a single enormous unbroken "word".
-- NOT VALID preserves existing stories but enforces this on every new write.
alter table public.stories drop constraint if exists stories_body_size;
alter table public.stories add constraint stories_body_size
  check (char_length(body) <= 10000) not valid;
notify pgrst, 'reload schema';
commit;
