# Contributing

Thanks for considering a contribution.

Orcestr Repo Notifier is a small GitHub Action. Keep changes focused, easy to review and safe for public repositories.

## Development

The current implementation uses Node.js scripts without external runtime dependencies.

Before opening a pull request, run:

```bash
node --check src/check-run.mjs
node --check src/prepare-prompt.mjs
node --check src/send-telegram.mjs
```

If you change `action.yml`, also test the action in a real GitHub repository with `dry-run: true` before relying on Telegram delivery.

## Pull Requests

Use a concise title and explain:

- what changed;
- why it is needed;
- how it was tested;
- whether it affects security, secrets or workflow triggers.

Do not include real API keys, Telegram tokens, chat ids from private groups or private repository data in issues, pull requests or logs.
