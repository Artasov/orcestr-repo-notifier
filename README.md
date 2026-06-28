<p align="right">
  <img src="./assets/orcestr-logo.png" alt="Orcestr logo" width="42" height="42" align="left" />
  <strong>English</strong> · <a href="./README.ru.md">Русский</a>
</p>

# Orcestr Repo Notifier

Orcestr Repo Notifier is a GitHub Action that runs Codex after every push, asks it to inspect the checked-out repository, and sends a clear project update to Telegram.

It is part of the unified Orcestr open-source platform: a growing set of developer tools, workflow primitives and product infrastructure extracted from real product work.

The goal is simple: every repository should be able to explain what changed in the product, not just list commits and files.

## Why

Most repository notifications are too technical for product chats and too shallow for engineering chats. They show commit messages, file names or raw diffs, but they rarely explain the real impact.

Orcestr Repo Notifier gives Codex the full checkout, the push context, changed files and a diff sample. Codex can then inspect the relevant repository files and write a Telegram-ready message: product update, technical update or a mixed summary.

## How it works

```text
push to GitHub
  -> actions/checkout@v4 with fetch-depth: 0
  -> Orcestr Repo Notifier prepares change context
  -> openai/codex-action@v1 runs Codex on the checkout
  -> the final message is sent to Telegram
```

The action is intentionally serverless. There is no Orcestr backend, webhook service or database. The user's own GitHub Actions runner does the work.

## Quick Start

Create a Telegram bot with BotFather, add it to a group and get the target `chat_id`.

Add repository secrets:

```text
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Add a workflow:

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

      - uses: your-org/orcestr-repo-notifier@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
```

## Modes

`product` writes a user-facing project update: features, UX changes, visible fixes and behavior changes.

`technical` writes an engineering update: implementation changes, risks, migrations, configuration and operational notes.

`hybrid` starts with product impact and adds short engineering notes.

## Inputs

`model` defaults to `gpt-5.5`.

`effort` defaults to `medium`.

`mode` defaults to `product`.

`language` defaults to `ru`.

`custom-prompt` appends project-specific instructions to the base prompt.

`sandbox` defaults to `read-only`, so Codex can inspect the repository and git context without editing files.

`safety-strategy` defaults to `drop-sudo`, the default safe strategy of `openai/codex-action` for Linux and macOS runners. Use `ubuntu-latest` unless you have a strong reason not to.

`max-diff-chars` limits the diff sample added to the context file. Codex can still inspect files from the checkout.

`telegram-parse-mode` defaults to `none`, so Telegram formatting does not break the generated message. It can be set to `HTML`, `Markdown` or `MarkdownV2`.

`dry-run: true` runs Codex but skips Telegram sending.

## Product Example

```yaml
- uses: your-org/orcestr-repo-notifier@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    mode: product
    custom-prompt: |
      Write like a short Telegram post for a product team.
      Do not mention internal classes, functions or file names unless they are important for understanding the change.
```

## Technical Example

```yaml
- uses: your-org/orcestr-repo-notifier@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    mode: technical
    effort: high
    custom-prompt: |
      Mention migrations, background jobs, configuration changes, deployment risks and important tests when present.
```

## Security

Do not run this action with secrets on untrusted pull request events. For public repositories, start with `push` events on protected branches.

Keep the OpenAI key and Telegram bot token in GitHub secrets only.

The base prompt tells Codex to treat commit messages, diffs and repository files as untrusted input. This reduces prompt-injection risk from changed files, but it does not remove the need to choose safe workflow triggers.

## Orcestr

Orcestr Repo Notifier is one piece of the broader Orcestr direction: practical product surfaces and open-source infrastructure built from real workflows.

See the public overview in [orcestr-overview](https://github.com/Artasov/orcestr-overview).
