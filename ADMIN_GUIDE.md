# Administrator setup

1. Create your account in Connection Stories if you have not already done so.
2. Open the **Connection Stories** Supabase project, then **SQL Editor → New query**.
3. Replace the example email below with your account email and run the query:

```sql
update public.profiles
set role = 'admin', active = true
where lower(email) = lower('your-email@example.com')
returning email, role, active;
```

The result should show one row with your email, role `admin`, and active `true`.
If no row appears, check the email and make sure you created the account first.
Refresh the app. The **Admin** menu opens User access.

## What an administrator can do

- Read all stories and use search, category filters, themes, and the word cloud.
- Create, edit, and delete their own stories.
- Delete any author's story after confirming the deletion.
- Activate or deactivate other accounts; deactivation preserves their stories.
- Promote another user to administrator or change them back to a regular user.

Administrators cannot deactivate or demote their own account in the app.
Ask another administrator to do that if needed.

Editing someone else's story, deleting accounts, changing passwords on someone
else's behalf, backups, email settings, and deployment configuration are not
features of this app's Admin screen. Password recovery remains self-service;
authentication settings and database backups are managed in Supabase.

## Apply the review update

Run `supabase/updates/20261030_admin_self_protection.sql` in the SQL Editor
to enforce self-lockout protection in the database as well as in the app.
It does not change anyone's current role or access.
