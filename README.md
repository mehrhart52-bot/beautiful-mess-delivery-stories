# Beautiful Mess Ministries Delivery Stories

A separate web application for collecting and celebrating CarePortal and Beautiful Mess Ministries delivery stories.

## What it includes

- Email and password accounts
- Self-service password reset by email
- Story creation and editing with a 300-word maximum
- Personal and community story lists with previews
- Story deletion by the story owner or an administrator, with confirmation
- A word cloud generated from all saved stories
- Administrator controls for user roles and active access
- Mobile-friendly navy blue and gold ministry branding

## One-time setup

The app uses Supabase because it provides the database, secure login, and password-reset email in one service.

1. Create a new Supabase project for this app at `supabase.com`.
2. Open **SQL Editor**, choose **New query**, paste all of `supabase/schema.sql`, and select **Run**.
3. Open **Project Settings → API**. Copy the Project URL and publishable key.
4. Copy `.env.example` to `.env.local` and replace the two placeholder Supabase values. Keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local use.
5. Run `npm run dev`, open the local address, and create your account.
6. In the Supabase SQL Editor, run the final administrator statement shown at the bottom of `supabase/schema.sql`, using your email address.

For account-confirmation and password-reset email, open **Authentication → URL Configuration** in Supabase. Set the Site URL to the app's address and add `<your-app-address>/auth/callback` as a Redirect URL. For local testing, add `http://localhost:3000/auth/callback`.

## Development

```sh
npm ci
npm run dev
```

Validation:

```sh
npm run typecheck
npm run build
```

Only use delivery stories that are appropriate to share with all signed-in users. Avoid full names, addresses, medical details, and other private information.
