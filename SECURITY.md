# Security Policy

## Supported Versions

Security fixes are handled on the default branch until the first stable versioned release.

## Reporting a Vulnerability

Do not open a public issue for secrets exposure, token leakage, prompt-injection bypasses or unsafe workflow behavior.

Report security issues privately to the maintainer through GitHub.

Include:

- affected files or workflow configuration;
- what an attacker can do;
- whether secrets can be exposed;
- a minimal reproduction if possible.

## Workflow Safety

Do not run this action with secrets on untrusted pull request events.

Recommended first setup:

```yaml
on:
  push:
    branches:
      - main
```

Keep `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in GitHub Actions secrets only.
