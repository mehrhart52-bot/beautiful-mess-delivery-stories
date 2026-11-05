# Security review — November 1, 2026

Scope: Connection Stories repository, installed dependency advisory scan, isolated PostgreSQL-compatible permission tests, and local production browser tests. This is not a penetration test of a deployed site or a malware scan of the user's computer. Live Supabase policies/settings and hosting were not inspected or changed.

## Findings and fixes

- **Member privacy:** Any active member could query all profiles, including email addresses and full names, through the database API. Profiles are now restricted to the owner and admins. Story pages use a narrowly scoped function returning only authors' first names to active members. Requires the SQL update below.
- **Cross-site request protection:** The Codespaces wildcard exception also applied to production. Production now uses Next.js same-origin checks; development trusts only the current Codespace's port-3000 hostname.
- **Database privileges:** Explicitly reset broad table grants (including Supabase defaults), allow only necessary write columns, remove anonymous table access, and protect the story-number sequence. Row-level policies still govern all member operations. Requires SQL.
- **Oversized submissions:** The 300-word rule alone allowed enormous unbroken text. New writes are limited to 10,000 characters in both the application and database, with a 64 KB Server Action request limit. Existing stories are not removed. Requires SQL for direct API protection.
- **Browser protection:** Added a per-request nonce Content Security Policy, blocking unauthorized HTML script injection, external resource loading, embedded objects and framing. Inline styles remain allowed for the existing layout; production script evaluation is not allowed. Password toggle/hydration verified in the production build.
- **Account errors:** Signup now gives a generic error rather than returning provider internals. Name length is validated before submission. Server-only guards protect authentication/database modules from accidental client imports.

## Apply before running the updated app

In this app's Supabase SQL Editor, run **supabase/20261101_security_hardening.sql**. The complete schema includes this update for new projects. Existing installations should run just the migration. It preserves stories and accounts. Story listings in the new app require the new author function, so apply SQL before updating the app.

## Checks completed

- `npm audit --json`: zero reported vulnerabilities in the installed dependency tree at review time. This is an advisory check, not a guarantee against unknown vulnerabilities or malicious packages.
- `npm run build`: passed.
- `tests/security-permissions.mjs`: isolated PGlite tests passed for anonymous denial, member email privacy, ownership enforcement, admin deletion and role management, self-promotion denial, inactive-user denial, admin self-lockout protection, oversized text rejection, and sequence access denial. Run from the repository root with `PGLITE_MODULE` pointing to an installed PGlite JS entry point.
- Local production Chromium: login password toggle, nonce rotation, and blocking a simulated injected HTML script passed.
- Source review found no executable user HTML rendering, user file-upload endpoint, user-controlled shell execution, or raw SQL interpolation. Stories render as escaped React text. Redirect destinations are restricted. A source search found no service-role/private key; the bundled development key is intentionally publishable and depends on database policies for protection.

## Before public launch

1. **Decide who may join.** Current behavior intentionally allows self-registration and immediate access to all shared stories for active members. If email confirmation is disabled, signup does not prove email ownership. Login alone does not make this an invitation-only community. Keep this behavior only if it fits the intended audience; otherwise add invitation or admin approval before launch.
2. **Configure abuse protection.** Verify Supabase authentication rate limits, password policy and email settings. Add CAPTCHA with application integration if public registration attracts bots; enable hosting firewall/rate limits. No persistent application-level story/account quota currently exists. Attackers with accounts could spam stories and exhaust the finite 9,999-number sequence, including by repeatedly creating/deleting stories. The new size limit does not solve this volume risk.
3. **Production setup:** Use a separate production Supabase project, explicit production environment values, HTTPS hosting, exact production auth callback URLs and secure provider accounts with MFA. Never place a service-role key in public settings or the ZIP. Configure backups, monitoring and an update routine. The app does not currently require MFA for its own admin login or keep a dedicated administrative audit trail.
4. **Verify deployed controls:** Apply all migrations, use Supabase Security Advisor, then test with two ordinary accounts and an admin. Verify email/password recovery, deactivation and access restrictions against the actual hosted site. The isolated tests cannot establish the current live database configuration.

No hosting firewall, live authentication setting, or database migration was changed by this review.

## Follow-up: bot protection and submission limits

The app now integrates Turnstile on all four public authentication forms and adds
resend-confirmation recovery. Database-backed per-account submission limits are
implemented in `20261101_story_submission_limits.sql`. These address the previous
lack of story quotas after that migration is applied. Multi-account abuse and
provider traffic limits still need launch configuration. See
[PRODUCTION_SECURITY_SETUP.md](PRODUCTION_SECURITY_SETUP.md) for activation steps
and validation limits; live provider settings have not been changed.

## Production Advisor follow-up — November 5, 2026

The screenshot showed public and signed-in execute warnings for handle_new_user,
is_active_user and is_admin; two of the reported eight warnings were not visible.
`supabase/20261105_function_permissions.sql` revokes PUBLIC and explicit anon/
authenticated execution of trigger-only functions and removes anonymous execution
of access helpers and story_authors. It retains authenticated access to is_admin,
is_active_user and story_authors: policies require the first two (both inspect only
auth.uid()), and the app needs the last one's restricted first-name results.
Signed-in SECURITY DEFINER warnings for these three functions may remain by design;
this migration is not a claim that all Advisor warnings have been resolved.

Tests model explicit Supabase-style default grants and verify effective privileges,
new-user profile creation, member isolation, admin actions and submission limits.
They passed in isolated PGlite. Apply only the new migration to existing projects,
then rerun Security Advisor. No production database was changed from this workspace.
