-- Run this once in the Supabase SQL Editor to add story deletion.

drop policy if exists "Owners and admins can delete stories" on public.stories;
create policy "Owners and admins can delete stories" on public.stories
  for delete to authenticated
  using (
    public.is_active_user()
    and (user_id = auth.uid() or public.is_admin())
  );

grant delete on public.stories to authenticated;
