-- Run this entire file once in the Supabase SQL Editor for this app's project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(display_name) between 1 and 100),
  role text not null default 'user' check (role in ('user', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (
    char_length(trim(body)) > 0
    and array_length(regexp_split_to_array(trim(body), '\s+'), 1) <= 300
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stories_user_id_idx on public.stories(user_id);
alter table public.stories add column if not exists experience text
  check (experience in ('CarePortal', 'Beautiful Mess Ministries', 'Other'));
create index if not exists stories_created_at_idx on public.stories(created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, 'Member'), '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and active and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.stories enable row level security;

drop policy if exists "Users can read profiles" on public.profiles;
create policy "Users can read profiles" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_active_user());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Active users can read stories" on public.stories;
create policy "Active users can read stories" on public.stories
  for select to authenticated
  using (public.is_active_user());

drop policy if exists "Active users can create their stories" on public.stories;
create policy "Active users can create their stories" on public.stories
  for insert to authenticated
  with check (public.is_active_user() and user_id = auth.uid());

drop policy if exists "Owners can update their stories" on public.stories;
create policy "Owners can update their stories" on public.stories
  for update to authenticated
  using (public.is_active_user() and user_id = auth.uid())
  with check (public.is_active_user() and user_id = auth.uid());

drop policy if exists "Owners and admins can delete stories" on public.stories;
create policy "Owners and admins can delete stories" on public.stories
  for delete to authenticated
  using (
    public.is_active_user()
    and (user_id = auth.uid() or public.is_admin())
  );

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant update (role, active) on public.profiles to authenticated;
grant select, insert, update (body, updated_at) on public.stories to authenticated;
grant delete on public.stories to authenticated;
alter table public.stories add column if not exists theme text not null
  default 'no_clear_theme'
  check (theme in (
    'ongoing_relationship', 'practical_obstacle', 'spiritual_growth',
    'family_safety', 'community_connection', 'no_clear_theme'
  ));
grant update (theme) on public.stories to authenticated;
create index if not exists stories_theme_experience_idx on public.stories(theme, experience);
grant update (experience) on public.stories to authenticated;

-- After creating your own account, run the following line with your email address
-- to make yourself the first administrator:
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';

begin;
lock table public.stories in access exclusive mode;
create sequence if not exists public.story_number_seq;
alter table public.stories add column if not exists story_code text;

create or replace function public.assign_story_code()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  number_text text;
  prefix text;
begin
  if TG_OP = 'UPDATE' and OLD.story_code is not null then
    NEW.story_code := OLD.story_code;
    return NEW;
  end if;
  number_text := nextval('public.story_number_seq'::regclass)::text;
  prefix := case NEW.experience
    when 'CarePortal' then 'C'
    when 'Beautiful Mess Ministries' then 'B'
    else 'O'
  end;
  NEW.story_code := prefix || lpad(number_text, greatest(6, length(number_text)), '0');
  return NEW;
end;
$$;
revoke all on function public.assign_story_code() from public;
drop trigger if exists assign_story_code on public.stories;
create trigger assign_story_code before insert or update on public.stories
for each row execute function public.assign_story_code();
-- Fill only missing IDs. Re-running preserves previously assigned IDs.
update public.stories set story_code = null where story_code is null;
alter table public.stories alter column story_code set not null;
create unique index if not exists stories_story_code_unique on public.stories(story_code);
notify pgrst, 'reload schema';
commit;

-- Run after 20261027_story_identifiers.sql.
begin;
lock table public.stories in access exclusive mode;
-- Stop rather than truncate an ID or reuse a number.
do $$
begin
  if exists (select 1 from public.stories
    where story_code !~ '^[CBO][0-9]+$'
       or length(ltrim(substring(story_code from 2), '0')) > 4)
  then raise exception 'Existing story IDs cannot safely fit in four digits.';
  end if;
end;
$$;
alter sequence public.story_number_seq maxvalue 9999;

create or replace function public.assign_story_code()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  number_text text;
  prefix text;
begin
  if TG_OP = 'UPDATE' and OLD.story_code is not null then
    NEW.story_code := OLD.story_code;
    return NEW;
  end if;
  number_text := nextval('public.story_number_seq'::regclass)::text;
  prefix := case NEW.experience
    when 'CarePortal' then 'C'
    when 'Beautiful Mess Ministries' then 'B'
    else 'O'
  end;
  NEW.story_code := prefix || lpad(number_text, 4, '0');
  return NEW;
end;
$$;
revoke all on function public.assign_story_code() from public;
drop trigger if exists assign_story_code on public.stories;
update public.stories
  set story_code = left(story_code, 1) ||
    lpad(ltrim(substring(story_code from 2), '0'), 4, '0');
create trigger assign_story_code before insert or update on public.stories
for each row execute function public.assign_story_code();
notify pgrst, 'reload schema';
commit;
