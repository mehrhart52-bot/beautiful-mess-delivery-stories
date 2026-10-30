begin;
create or replace function public.protect_own_admin_access()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if OLD.id = auth.uid() and OLD.role = 'admin' and OLD.active
     and (NEW.role <> 'admin' or not NEW.active) then
    raise exception 'An administrator cannot remove their own administrator access.';
  end if;
  return NEW;
end;
$$;
drop trigger if exists protect_own_admin_access on public.profiles;
create trigger protect_own_admin_access before update on public.profiles
for each row execute function public.protect_own_admin_access();
notify pgrst, 'reload schema';
commit;
