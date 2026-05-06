# Contributing to Nexo Finance

Thank you for your interest in improving Nexo Finance.

This project is under active product development. Contributions should keep the app stable, focused, and aligned with the current architecture.

---

## Before You Start

Before opening a pull request, please check:

- Existing issues and pull requests
- The current README
- The security policy
- The local setup instructions
- The scope of the change you want to make

Avoid opening large, unfocused pull requests that change unrelated areas at the same time.

---

## Project Scope

Nexo Finance currently includes:

- A React/Vite frontend
- An Express/tRPC backend
- Clerk authentication
- Stripe payment integration
- MySQL with Drizzle ORM
- OpenAI-compatible AI integration
- Python Core for financial reasoning
- Optional Python AI service
- GitHub support workflow
- Railway and Docker deployment paths

---

## Development Setup

### Requirements

- Node.js compatible with the project
- pnpm
- MySQL available through `DATABASE_URL`
- Python 3.12 for Python services
- Clerk credentials for local authentication

### Install dependencies

```bash
pnpm install
```

### Create environment file

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### Start the app

```bash
pnpm dev
```

### Start Python Core

```bash
pnpm dev:python-core
```

Health check:

```bash
curl http://127.0.0.1:8010/health
```

---

## Validation

Before opening a pull request, run the minimum validation flow:

```bash
pnpm check
pnpm test
pnpm build
```

For Python-related changes, also run:

```bash
pnpm check:py
pnpm test:py
pnpm check:python-core
pnpm test:python-core
```

If you cannot run a command locally, mention it clearly in the pull request description.

---

## Pull Request Guidelines

A good pull request should:

- Have a clear title
- Explain what changed
- Explain why the change is needed
- Mention affected areas
- Include screenshots or recordings for UI changes
- Include test notes
- Avoid unrelated formatting-only changes
- Avoid mixing dependency updates with product changes

Recommended PR structure:

```md
## Summary

## Changes

## Testing

## Screenshots

## Notes
```

---

## Commit Style

Use short, descriptive commit messages.

Examples:

```bash
docs: update README gallery
fix: prevent support widget overflow
feat: add python core simulation endpoint
chore: update dependency group
```

Preferred prefixes:

- `feat:` for features
- `fix:` for bug fixes
- `docs:` for documentation
- `chore:` for maintenance
- `test:` for tests
- `refactor:` for internal changes without behavior change

---

## Dependency Updates

Dependency updates should be handled carefully.

Do not combine dependency updates with feature work unless the feature requires it.

For Dependabot pull requests:

1. Prefer grouped updates when available.
2. Run validation before merge.
3. Check production-critical areas after deployment.
4. Close smaller duplicate PRs only after the grouped update is merged safely.

---

## Security

Do not commit secrets, `.env` files, tokens, API keys, private URLs, or personal data.

Security issues must be reported privately. See:

- [SECURITY.md](./SECURITY.md)

---

## Documentation

Documentation should be:

- Clear
- Direct
- Accurate
- Updated when architecture or setup changes
- Free from internal notes, temporary comments, or private project context

Do not add artificial marketing language or claims that are not reflected in the product.

---

## Maintainers

Nexo Finance is developed by **Mackson**.

Repository presentation, documentation, and GitHub organization are maintained with project staff support.
