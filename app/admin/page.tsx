import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateAccess } from "@/app/actions";
import type { Profile } from "@/lib/types";
import Notice from "@/components/Notice";

export default async function Admin({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("display_name");
  const users = (data ?? []) as Profile[];
  return <><p className="eyebrow">Administration</p><h1>User access</h1><p className="lead">Activate or deactivate accounts and choose who can administer the app.</p><Notice {...await searchParams} /><div className="admin-list">{users.map(user => <div className="admin-row" key={user.id}><form action={updateAccess}><input type="hidden" name="id" value={user.id} /><div><strong>{user.display_name}</strong><br /><span>{user.email}</span></div><div><label htmlFor={`role-${user.id}`}>Role</label><select id={`role-${user.id}`} name="role" defaultValue={user.role}><option value="user">User</option><option value="admin">Administrator</option></select></div><label className="check"><input type="checkbox" name="active" defaultChecked={user.active} /> Active</label><button className="button" type="submit">Save access</button></form></div>)}</div></>;
}
