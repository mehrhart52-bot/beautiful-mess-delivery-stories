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
