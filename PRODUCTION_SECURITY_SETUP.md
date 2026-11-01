# Bot protection and email verification

The code is ready for these protections. They become effective only after the matching Supabase and hosting settings are configured. No administrator approval is required.

## 1. Apply the database updates

For the existing test project, apply any missing updates in order:

1. `supabase/20261101_security_hardening.sql` from the security review.
2. `supabase/20261101_story_submission_limits.sql` from this update.

Paste each file into this app's Supabase SQL Editor and run it. Neither file deletes stories or accounts. For a new production project, run the complete `supabase/schema.sql` instead; it includes both updates.

The database enforces one new story per account per 30 seconds and up to 20 in a rolling 24-hour period. The limit applies to admins too. Editing does not count; deleting does not refund a submission. Counters are private, persist across restarts, and serialize simultaneous requests for the same account. Trusted database maintenance with no end-user session is exempt. Limits do not stop a person creating many accounts, so use the bot protections too.

## 2. Connect Cloudflare Turnstile

1. In Cloudflare Turnstile, create a **Managed** widget and register the production hostname. Register a separate test widget for local/test hostnames if needed.
2. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the app's hosting environment to the widget's **site key**.
3. In Supabase Authentication settings, find CAPTCHA protection, enable it, choose **Turnstile**, and enter the matching **secret key** there. The secret key must never be placed in a `NEXT_PUBLIC_` variable, source code, or ZIP.
4. Rebuild/redeploy the app after changing public environment variables. Next.js embeds public environment values when building; changing only a running production server's variables is insufficient.
5. Test signup, login, password reset and resending confirmation. Each form passes its token to Supabase, which validates it. A missing or invalid token must be rejected, including direct requests to Supabase Auth.

Leaving the site key blank preserves local testing without a widget. This is not bot protection. Setting only the site key shows the widget but does not establish provider-side enforcement: **both settings are required**. Conversely, enabling Supabase CAPTCHA without configuring the app will block sign-ins and signups. Coordinate the settings before inviting users.

The widget has expired-check/error recovery and disables submission until a token is available. After a failed submission it refreshes the one-use check. Content Security Policy permits only the Cloudflare challenge origin needed for its script/frame/connection.

## 3. Enable email verification and reliable delivery

1. In the production Supabase project's Email provider settings, enable **Confirm email**.
2. Set Authentication's **Site URL** to the production HTTPS address. Add the exact callback URL `<site>/auth/callback` and, if required by the redirect allowlist, the two exact destinations `<site>/auth/callback?next=/dashboard` and `<site>/auth/callback?next=/reset-password`. Use the matching local addresses only on the test project.
3. Set the app's `NEXT_PUBLIC_SITE_URL`, Supabase URL and publishable key to that same production project/site, then rebuild.
4. Configure a production SMTP provider and verified sender domain in Supabase. Complete the provider's SPF/DKIM setup; check delivery and spam folders. Supabase's default mail service is limited and is not a substitute for production mail delivery.
5. Keep the supported PKCE confirmation links (the default Supabase `{{ .ConfirmationURL }}` template). The app exchanges the callback code for a session. Ask users to open the email link in the browser where they requested it. Links opened in another browser may not have the required cookie; the app offers login or a new confirmation email instead of a dead end.

Existing confirmed accounts do not need to confirm on every login. Turning confirmation on may not retrospectively require confirmation for accounts created while it was off. Inspect existing test accounts separately. A production project starts clean.

## 4. Configure traffic controls

Review Supabase authentication rate limits (especially signup and outgoing email), password policy, and hosting firewall/rate-limiting options. These are provider settings; this code update does not configure them. Use MFA for provider/hosting administrator accounts. Monitor unusual registration and submission activity. The in-app Admin page can deactivate abusive accounts and delete stories.

## 5. Before inviting users

Use an email address you control and test:

- Signup → confirmation email → app → save a story → logout → login.
- Login before confirming → clear instructions → resend confirmation → login.
- Expired/used confirmation links and password-reset links → recovery instructions.
- Forgot password → email → set new password → login with the new password.
- An expired/failed bot check, and a new check after an unsuccessful submission.
- A second story within 30 seconds → message with text retained; retry after waiting → saves.
- Daily limit → message with text retained; editing existing stories still works.
- Ordinary users cannot access Admin; deactivated accounts cannot read or submit stories.

## Validation performed in this change

Production build and TypeScript checks passed. Isolated PGlite tests covered cooldown, rolling cap, deletion bypass, independent accounts, counter privacy, edits, reapplying the migration, expired counts, sequence preservation on rejected submissions, and queued duplicate requests. PGlite serializes requests, so this is not a live multi-connection concurrency/load test.

Browser tests used simulated Cloudflare and Supabase responses to check token forwarding, token expiry/retry, disabled submission, confirmation guidance and failed-link destinations. Real Cloudflare validation, real inbox delivery and the complete hosted confirmation/reset flow still require configured-provider tests.

An initial browser test used a build with the test project's URL embedded and created `fiction@example.com` in that test project. No stories were submitted. That test account can be removed through Supabase Authentication → Users. Subsequent auth tests used a local simulated provider.
