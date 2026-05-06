# Security Policy

Nexo Finance takes security reports seriously. If you believe you have found a vulnerability, please report it privately and do not open a public GitHub issue, discussion, or pull request with sensitive details.

---

## Reporting Security Issues

Please report security issues through one of the following private channels:

- GitHub Security Advisory, when available for this repository
- The private support channel inside the Nexo Finance app, when available
- The internal notification channel configured by the project maintainers

Do not include passwords, API keys, tokens, private URLs, financial data, account screenshots, payment details, or personal information in public GitHub issues.

For normal bugs that do not contain sensitive information, use the public bug report template.

---

## Reporting Process

1. **Submit the report** using a private channel.
2. **Initial review** checks whether the report is reproducible and security-relevant.
3. **Validation** confirms the affected area and potential impact.
4. **Fix planning** defines the safest patch path.
5. **Release** ships the fix through the supported branch.
6. **Disclosure** may happen after users have had reasonable time to update.

---

## What to Include

A useful report should include:

- Affected area: authentication, payments, AI, support, database, dashboard, deployment, or another area
- Clear reproduction steps
- Expected impact
- Browser, operating system, and approximate time of discovery
- Version, branch, or commit hash if known
- Potential mitigation or workaround if known

Please keep screenshots minimal and avoid exposing private information.

---

## Disclosure Policy

Please follow responsible disclosure:

- Do not publicly disclose the issue before it has been reviewed.
- Allow reasonable time for validation, patching, and deployment.
- Avoid testing against accounts, data, or systems you do not own or have permission to use.
- Do not exfiltrate, alter, or destroy data.
- Do not use social engineering, spam, denial of service, or physical attacks.

---

## Supported Versions

Security fixes are handled from the active development branch.

| Version / Branch | Supported |
| --- | --- |
| `stable` | ✅ |
| `codex/*` branches | Development only |
| Local forks | ❌ |
| Archived or abandoned branches | ❌ |

---

## Severity Guide

Security reports are triaged by impact.

| Severity | Examples |
| --- | --- |
| Critical | Data exposure, unauthorized access, exposed secrets, payment compromise |
| High | Authentication bypass, production database issues, broken payment flow, severe API abuse |
| Medium | Functional security weakness with limited scope or clear workaround |
| Low | Hardening, documentation, dependency hygiene, non-sensitive UI issue |

---

## Dependency Security

Dependency alerts should be handled through pull requests and validated before merge.

Recommended validation:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm audit
```

Python services should also be validated when affected:

```bash
pnpm check:py
pnpm test:py
pnpm check:python-core
pnpm test:python-core
```

When Dependabot opens grouped and individual pull requests for the same dependency area, validate the grouped pull request first. Smaller pull requests covered by the grouped update can be closed after the grouped update is merged.

---

## Security Best Practices

When running or deploying Nexo Finance:

- Keep dependencies up to date.
- Never commit `.env` files or secrets.
- Use private environment variables for API keys and tokens.
- Rotate exposed credentials immediately.
- Keep Clerk, Stripe, database, and AI provider keys isolated by environment.
- Validate deployment logs after changes to authentication, payments, AI, or database logic.
- Prefer private security reports over public issue comments.

---

## Scope

Currently in scope:

- Main web application
- Node/tRPC gateway
- Python Core
- Optional Python AI service
- Authentication and payment integrations
- GitHub support flow
- Deployment configuration used by the project

Out of scope:

- Third-party services outside project control
- User-created forks not maintained by the project
- Non-security visual bugs
- Reports without reproducible impact

---

Last updated: May 2026
