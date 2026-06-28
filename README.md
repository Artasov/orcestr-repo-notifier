<p align="right">
  <img src="./assets/orcestr-logo.png" alt="Orcestr logo" width="42" height="42" align="left" />
  <strong>English</strong> · <a href="./README.ru.md">Русский</a>
</p>

# Orcestr Repo Notifier

[![Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-Orcestr%20Repo%20Notifier-blue)](https://github.com/marketplace/actions/orcestr-repo-notifier)
[![Validate](https://github.com/Artasov/orcestr-repo-notifier/actions/workflows/validate.yml/badge.svg)](https://github.com/Artasov/orcestr-repo-notifier/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Turn GitHub pushes into clear Telegram updates.

Helps team leads, founders, product owners and developers see real development progress without reading raw commits. After a push, it uses Codex to inspect the repository change and writes a short Telegram update: what changed, what was shipped, and why it matters.

It can be used for private team updates or for keeping a public project history without writing every post manually.

Part of the [Orcestr](https://orcestr.com) ecosystem.

## Install

Open the action in [GitHub Marketplace](https://github.com/marketplace/actions/orcestr-repo-notifier), or add it manually.

The Marketplace snippet only shows how to reference the action. Use the full workflow below so checkout, secrets and prompt settings are configured correctly.

In the repository you want to monitor, create:

```text
.github/workflows/orcestr-repo-notifier.yml
```

Add this workflow:

```yaml
name: Repo update to Telegram

on:
  push:
    branches:
      - main

jobs:
  notify:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: Artasov/orcestr-repo-notifier@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
          mode: product
          language: ru
          model: gpt-5.5
          effort: medium
          custom-prompt: |
            Write a short Telegram update for the product owner and team.
            Explain what changed in the product, not just what changed in code.
            Do not list every file.
            Avoid technical jargon unless it matters.
            If the change is technical, explain its impact on stability, speed, UX or maintenance.
```

Add repository secrets in `Settings -> Secrets and variables -> Actions`:

```text
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

On the next push to `main`, the bot will send a generated update to Telegram.

## Modes

`product` is the default. It writes a user-facing project update: features, UX changes, visible fixes and behavior changes.

`technical` writes an engineering update: implementation changes, risks, configuration and operational notes.

`hybrid` starts with product impact and adds short engineering notes.

Example:

```yaml
- uses: Artasov/orcestr-repo-notifier@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    mode: technical
    effort: high
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `openai-api-key` | required | OpenAI API key for Codex. |
| `telegram-bot-token` | required | Telegram bot token from BotFather. |
| `telegram-chat-id` | required | Target chat, group or channel id. |
| `model` | `gpt-5.5` | Codex model. |
| `effort` | `medium` | Reasoning effort. |
| `mode` | `product` | `product`, `technical` or `hybrid`. |
| `language` | `ru` | Output language. |
| `custom-prompt` | empty | Extra instructions for the generated message. |
| `max-diff-chars` | `30000` | Diff sample limit passed to Codex. |
| `dry-run` | `false` | Run Codex but skip Telegram sending. |

## Security

Do not run this action with secrets on untrusted pull request events. Start with `push` events on protected branches.

Keep `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in GitHub Actions secrets only.

## Links

- [GitHub Marketplace](https://github.com/marketplace/actions/orcestr-repo-notifier)
- [Orcestr website](https://orcestr.com)
- [Orcestr overview](https://github.com/Artasov/orcestr-overview)
- [Contributing](./CONTRIBUTING.md)
- [Security](./SECURITY.md)
- [License](./LICENSE)
