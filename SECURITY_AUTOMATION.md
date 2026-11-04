# Scheduled security maintenance

## What is configured in this repository

- **Every hour**, at minute 23 UTC, GitHub Actions checks the npm lockfile against published vulnerability advisories, including development/build dependencies. High or critical findings fail the workflow. Registry/network errors also fail, so inspect the log rather than assuming every failure is a vulnerability.
- **Daily**, GitHub CodeQL scans JavaScript/TypeScript for supported security patterns; it also scans changes pushed to main and proposed pull requests. This does not scan SQL policies or Supabase configuration. Private repositories may need a paid GitHub Code Security entitlement. If unavailable, the workflow will fail and cannot provide this coverage.
- **Daily**, Dependabot checks npm updates and opens update pull requests. It also checks GitHub Actions versions weekly. Security-specific fixes can arrive independently of this schedule once Dependabot security updates are enabled in Settings.
- Every proposed pull request runs the dependency audit and production build (which includes TypeScript checking), with placeholder configuration and no production secrets.
- Compatible Dependabot npm update pull requests can merge automatically after both build/audit and CodeQL pass for the same commit. This includes routine compatible updates as well as security fixes. Some vulnerabilities have no available fix or require application changes. This is scheduled security maintenance, not an autonomous incident-response service.

## One-time GitHub activation checks

Open this repository's **Settings → Security / Advanced Security** (labels may vary):

1. Enable the dependency graph, Dependabot alerts and Dependabot security updates. The YAML daily update schedule alone does not enable security alerts or security-specific updates.
2. Enable Code Security/CodeQL if available for this repository. This repository provides an advanced CodeQL workflow; avoid enabling a duplicate default setup. Check private-repository licensing before purchasing anything.
3. Enable secret scanning and push protection if available for your account/repository. These detect supported credential patterns; they are distinct from CodeQL and npm audit.
4. Under **Actions → General**, permit the actions used by the workflows. Ensure GitHub Actions is enabled and has available runner minutes.
5. Allow squash merging. Under branch protection/rulesets for `main`, require pull requests and the successful **Validate app changes / build** check. Select the exact status shown after its first run. Security alerts are not automatically branch protections.
6. Configure your GitHub notification settings for failed Actions runs and Dependabot/security alerts, including email delivery, and verify you receive a notification. Do not assume merely watching the repository guarantees all security notifications.
7. In **Actions**, manually run the hourly dependency and code-security workflows once and confirm successful results. Inspect **Security → Code scanning / Dependabot alerts**. A committed workflow is not proof that its service is active.

Settings could not be inspected or changed from the development environment because requests to GitHub's settings API returned Forbidden. Verify these items before relying on the schedule.

GitHub scheduled workflows run on the default branch and may be delayed or skipped during service load. They are not a guaranteed hourly response time. Public repository schedules may be disabled after 60 days of inactivity. Runner-minute limits and service outages can also interrupt coverage.

## Emergency workflow

When a serious advisory appears, the hourly check fails and (if enabled) Dependabot prepares an available fix. The compatible-fix merger handles eligible changes after successful checks; other updates need review, merging and redeployment. A repository fix does not protect an already running site until the patched application is deployed. Major-version fixes may need manual code changes and additional testing. A build alone cannot establish that login and every user workflow still work.

Automatic merging is configured at the user's request. It accepts only same-repository PRs authored by `dependabot[bot]`, changing only package.json/package-lock.json, with patch/minor upgrades on the same major version (for 0.x, only patch upgrades). It rejects changed scripts, direct dependency additions/removals, transitive package additions/removals, major bumps, prereleases, downgrades and unknown version formats. These conservative rules may hold some otherwise safe updates for manual review.

Both the latest build/audit and CodeQL runs must pass for the exact PR head commit. The branch must not be behind main; the merge uses a SHA precondition. Missing/failed CodeQL coverage blocks auto-merging. The privileged workflow checks out only the default branch's policy script; it never installs or executes PR dependencies with its write token. Repository rules still apply and may block merges. Turn off the **Merge validated dependency fixes** workflow in Actions to pause automatic merging.

An automatic merge may trigger your hosting provider's deployment integration. Verify that behavior and rollback before production: pushes performed with GitHub's GITHUB_TOKEN generally do not trigger additional GitHub Actions workflows. A GitHub Actions deployment workflow would need a separately designed trigger. No hosting deployment or live settings are configured by this change.

## Protection that remains outside these jobs

These checks cannot detect every malicious package, zero-day vulnerability, compromised account, spam attempt or attack against the running site. At launch, separately configure hosting/firewall alerts, Supabase authentication and audit monitoring, backups, provider-account MFA and the Turnstile/rate-limit setup described in PRODUCTION_SECURITY_SETUP.md. Never put production admin keys into CI to run these scans.
