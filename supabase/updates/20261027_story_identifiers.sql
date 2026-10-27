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
