-- Existing stories stay uncategorized until their authors edit them.
begin;
alter table public.stories add column if not exists experience text
  check (experience in ('CarePortal', 'Beautiful Mess Ministries', 'Other'));
grant update (experience) on public.stories to authenticated;
notify pgrst, 'reload schema';
commit;
