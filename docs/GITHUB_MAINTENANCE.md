# GitHub Maintenance Guide

This document is the operational starting point for keeping the Nexo Finance repository organized, secure, and easy to evolve.

---

## Current State

- `stable` is the official product branch.
- `codex/*` branches are work branches.
- Pull requests should target `stable`.
- `.env` files must never be committed.
- Account, payment, personal data, and security issues must not be handled through public issues.

---

## Issues

Use issues only for public, safe, non-sensitive work.

Recommended labels:

- `bug`: reproducible app error.
- `support: bug`: bug created by AI support after sanitization.
- `support: suggestion`: public suggestion created by AI support.
- `type: roadmap`: strategic task or product backlog item.
- `status: needs-triage`: requires review and decision.
- `status: verified`: validated or completed.

When to close:

- Close test issues after the flow is validated.
- Close roadmap issues only after the change has landed in `stable`.
- Do not close production alerts before testing in the final environment.

---

## Pull Requests

Recommended flow:

1. Open the pull request against `stable`.
2. Run CI.
3. Review `Files changed`.
4. Confirm that `.env` files, credentials, tokens, or secrets were not included.
5. Merge only when checks are green and the change scope is clear.

For Dependabot:

- Prioritize grouped pull requests when they cover multiple dependencies.
- Run `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm audit`.
- After the grouped pull request is safely merged, close smaller redundant pull requests.

---

## Tags and Releases

Use tags to mark real product checkpoints.

Suggested milestones:

- `v0.9.0`: AI support foundation, GitHub automation, and initial repository governance.
- `v1.0.0`: production-ready app with domain, Clerk, Stripe, database, and support flow validated.

Local release tag example:

```bash
git checkout stable
git pull origin stable
git tag -a v0.9.0 -m "NEXO support foundation"
git push origin v0.9.0
```

---

## Projects, Wiki, and Documentation

The GitHub Project `NEXO Finance — Product Roadmap` should remain the execution board.

Use:

- `Projects` for tasks, statuses, and next steps.
- `docs/` for versioned guides that evolve with the code.
- `Wiki` later if public documentation grows beyond repository docs.

For now, `docs/` is the best source of truth because it can be reviewed through pull requests and versioned with the product.

---

## Stable Branch Protection

The `stable` branch should be protected even if GitHub shows protection as `Not enforced` on a private free repository.

Recommended configuration:

- Require pull requests before merge.
- Require status checks.
- Prevent force pushes.
- Prevent branch deletion.

If enforced protection is required for a private repository, use GitHub Team/Enterprise features or consider making the repository public when appropriate.

---

## Security and Dependabot

Important files:

- `SECURITY.md`
- `.github/dependabot.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/*`

Useful commands:

```bash
pnpm audit
pnpm outdated
pnpm check
pnpm test
pnpm build
```

Current security priority:

1. Validate and merge the grouped Dependabot pull request.
2. Resolve critical alerts related to `@clerk/shared` and `jspdf`/`dompurify`.
3. Resolve high alerts related to `vite`, `rollup`, `pnpm`, `tar`, and `axios`.
4. Run the app and check login, checkout, AI support, and export flows.

---

## AI Support and Issues

AI support may automatically create public issues only for:

- Public technical bugs.
- Public product suggestions.

AI support must not create public issues for:

- Account issues.
- Payment issues.
- Security issues.
- Personal data.
- Screenshots containing sensitive information.

Those cases should use the private channel configured through `OWNER_NOTIFICATION_WEBHOOK_URL`.

---

## Maintenance Rule

Do not mix unrelated work in the same pull request.

Keep documentation, dependency updates, product changes, security fixes, and UI changes separated whenever possible. This keeps `stable` easier to review, deploy, and recover.
