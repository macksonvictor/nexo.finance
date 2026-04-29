# Security Policy — NEXO Finance

## Supported versions

NEXO Finance is currently in active development.

Security reviews and fixes are focused on the latest version available in the `stable` branch.

## Reporting a vulnerability

If you discover a vulnerability, do not open a public issue containing sensitive details.

Please report it privately through:

- Email: macksongaspar@gmail.com
- GitHub private contact, if available

Include:

- A clear description of the vulnerability
- Steps to reproduce
- Potential impact
- Screenshots or logs, only if they do not expose secrets
- Suggested fix, if known

## Sensitive data rules

Never share or commit:

- `.env` files
- API keys
- Stripe secrets
- Clerk secrets
- database URLs
- access tokens
- user financial data
- private credentials

## Scope

Security concerns include:

- authentication flaws
- exposed secrets
- payment or billing vulnerabilities
- database access issues
- unsafe AI output handling
- user financial data exposure
- broken access control
- dependency vulnerabilities

## Response process

Security reports will be reviewed and prioritized based on risk.

Critical issues should be fixed before new feature work.

## Responsible disclosure

Please avoid publicly disclosing security issues before a fix is available.
