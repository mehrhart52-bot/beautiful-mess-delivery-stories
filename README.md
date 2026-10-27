# Beautiful Mess Ministries Connection Stories

## Community Themes update

Before running this version against an existing database, run
`supabase/updates/20261027_community_themes.sql` in the Supabase SQL Editor.
The experience-category update must already be installed.
Existing stories start under “No clear theme yet”; authors can edit them
to select a primary theme. New stories require one theme from the dropdown.
Community Themes shows exact story counts for each theme, with collection
filters and links to the supporting stories. Each story belongs to one theme.

## Updating an existing database for experience categories

Run `supabase/updates/20261027_experiences.sql` in the Supabase SQL Editor
before using this version. It adds a category field without deleting stories.
Authors choose CarePortal, Beautiful Mess Ministries, or Other when creating
or editing a story. Previously saved stories remain in the All stories cloud;
their authors can edit them to assign a category. Category clouds count only
words in that category and keep the five-appearance minimum and 12-word maximum.

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

The existing Delivery Stories development project is already connected for local previews.
Download and unzip the latest GitHub ZIP, open a terminal in the extracted folder, and run:

```sh
npm run dev
```

The first run installs dependencies automatically. Open http://localhost:3000 after Ready appears.
No configuration file is needed. These defaults contain only the project's public URL and
publishable key; login and database security rules still control access.
Existing environment or .env.local settings take precedence. Stop with Control+C and use
the same command to restart. Production builds require explicit environment settings.

The steps below are only needed when connecting a different Supabase project:

The app uses Supabase because it provides the database, secure login, and password-reset email in one service.

1. Create a new Supabase project for this app at `supabase.com`.
2. Open **SQL Editor**, choose **New query**, paste all of `supabase/schema.sql`, and select **Run**.
3. Open **Project Settings → API**. Copy the Project URL and publishable key.
4. Copy `.env.example` to `.env.local` and replace the two placeholder Supabase values. Keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local use.
5. Run `npm run dev`, open the local address, and create your account.
6. In the Supabase SQL Editor, run the final administrator statement shown at the bottom of `supabase/schema.sql`, using your email address.

For account-confirmation and password-reset email, open **Authentication → URL Configuration** in Supabase. Set the Site URL to the app's address and add `<your-app-address>/auth/callback` as a Redirect URL. For local testing, add `http://localhost:3000/auth/callback`.

## Development

### Allow signup without email verification

In this app's Supabase project, open Authentication → Sign In / Providers
(or Providers), open Email, switch Confirm email off, and save.
New signups will then sign in immediately without a verification email.
Password-reset emails remain enabled.

Existing unconfirmed accounts may still need confirmation: inspect the account
under Authentication → Users and use its confirmation action if available.
Do not delete an existing account to resolve login problems, as its stories
are linked to it.

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
