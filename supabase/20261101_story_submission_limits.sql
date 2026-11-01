-- Apply after the earlier schema/security updates. Accounts and stories are preserved.
begin;
-- Serialize installation with submissions so the initial counters are complete.
lock table public.stories in share row exclusive mode;
create table if not exists public.story_submission_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  submitted_at timestamptz[] not null default '{}'
);
alter table public.story_submission_limits enable row level security;
revoke all on public.story_submission_limits from public, anon, authenticated;

-- Seed recent stories on first installation. Subsequent runs preserve counters,
-- including submissions whose stories have since been deleted.
insert into public.story_submission_limits (user_id, submitted_at)
select user_id, array_agg(created_at order by created_at)
from public.stories where created_at > clock_timestamp() - interval '24 hours'
group by user_id on conflict (user_id) do nothing;

create or replace function public.limit_story_submissions()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  recent timestamptz[];
  checked_at timestamptz;
begin
  -- Trusted maintenance with no end-user session can import data.
  if auth.uid() is null then return NEW; end if;
  if NEW.user_id <> auth.uid() or not public.is_active_user() then
    raise exception 'Story submission is not permitted' using errcode = '42501';
  end if;
  insert into public.story_submission_limits(user_id) values (NEW.user_id)
    on conflict (user_id) do nothing;
  -- A row lock serializes concurrent requests for this account.
  select submitted_at into recent from public.story_submission_limits
    where user_id = NEW.user_id for update;
  checked_at := clock_timestamp();
  select coalesce(array_agg(t order by t), '{}'::timestamptz[]) into recent
    from unnest(recent) as t where t > checked_at - interval '24 hours';
  if cardinality(recent) >= 20 then
    raise exception 'story_daily_limit' using errcode = 'P0001';
  end if;
  if cardinality(recent) > 0 and recent[cardinality(recent)] > checked_at - interval '30 seconds' then
    raise exception 'story_too_soon' using errcode = 'P0001';
  end if;
  update public.story_submission_limits
    set submitted_at = array_append(recent, checked_at) where user_id = NEW.user_id;
  return NEW;
end;
$$;
revoke all on function public.limit_story_submissions() from public, anon, authenticated;
-- Alphabetical order: run before assign_story_code so rejected bursts don't consume IDs.
drop trigger if exists aa_limit_story_submissions on public.stories;
create trigger aa_limit_story_submissions before insert on public.stories
for each row execute function public.limit_story_submissions();
notify pgrst, 'reload schema';
commit;
