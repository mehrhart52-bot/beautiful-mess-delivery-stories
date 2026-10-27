-- Preserve existing stories and start them under "No clear theme yet".
begin;
alter table public.stories add column if not exists theme text not null
  default 'no_clear_theme'
  check (theme in (
    'ongoing_relationship', 'practical_obstacle', 'spiritual_growth',
    'family_safety', 'community_connection', 'no_clear_theme'
  ));
grant update (theme) on public.stories to authenticated;
create index if not exists stories_theme_experience_idx on public.stories(theme, experience);
notify pgrst, 'reload schema';
commit;
