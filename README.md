<p align="right">
  <img src="./assets/orcestr-logo.png" alt="Orcestr logo" width="42" height="42" align="left" />
  <strong>English</strong> · <a href="./README.ru.md">Русский</a>
</p>

# Orcestr Repo Notifier

[![Validate](https://github.com/Artasov/orcestr-repo-notifier/actions/workflows/validate.yml/badge.svg)](https://github.com/Artasov/orcestr-repo-notifier/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Part of the [Orcestr](https://orcestr.com) ecosystem.

Links: [main website](https://orcestr.com) · [Orcestr overview repository](https://github.com/Artasov/orcestr-overview)

A small tool for teams that want to see clear development progress without reading raw commits.

It turns repository changes into understandable Telegram updates: what was pushed, what changed, and why it matters for the project.

For team leads, founders and product owners, it makes day-to-day engineering progress easier to follow. For developers and open-source maintainers, it helps keep a public history of changes after every update without writing posts manually.

It is part of the unified Orcestr open-source platform: a growing set of developer tools, workflow primitives and product infrastructure extracted from real product work.

## Why

Most repository notifications are too technical for product chats and too shallow for public updates. They show commit messages, file names or raw diffs, but they rarely explain the real progress.

This action is designed to answer the useful questions: what happened, what changed for users or the project, and what the team should notice.

## How it works

```text
push to GitHub
  -> actions/checkout@v4 with fetch-depth: 0
  -> Orcestr Repo Notifier prepares change context
  -> openai/codex-action@v1 runs Codex on the checkout
  -> the final message is sent to Telegram
```

The action is intentionally serverless. There is no Orcestr backend, webhook service or database. The user's own GitHub Actions runner does the work.

Under the hood it uses GitHub Actions and Codex. The repository is checked out on the runner, change context is prepared, and Codex writes the final Telegram-ready message.

## Quick Start

Create a Telegram bot with BotFather, add it to a group and get the target `chat_id`.

In the GitHub repository you want to monitor, open `Settings -> Secrets and variables -> Actions` and add repository secrets:

```text
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Create this file in the same repository you want to monitor:

```text
.github/workflows/orcestr-repo-notifier.yml
```

Put this workflow into that file:

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

      - uses: Artasov/orcestr-repo-notifier@main
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
```

After the first stable release, replace `@main` with a version tag like `@v1`.

On the next push to `main`, GitHub Actions will run the workflow and the bot will post the generated update to Telegram.

## Publishing a New Action Version

Release helper scripts live in [.run](./.run). They are meant to be launched from PyCharm or from a terminal.

First check what will happen:

```bash
./.run/release-action-dry-run.sh v1.0.0
```

Then publish the version:

```bash
./.run/release-action.sh v1.0.0
```

The script pushes `main`, creates the exact tag `v1.0.0`, and updates the floating major tag `v1`. Users should normally reference the action through the major tag:

```yaml
uses: Artasov/orcestr-repo-notifier@v1
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
- uses: Artasov/orcestr-repo-notifier@main
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
- uses: Artasov/orcestr-repo-notifier@main
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

## Project Files

- [CONTRIBUTING.md](./CONTRIBUTING.md) - contribution guide.
- [SECURITY.md](./SECURITY.md) - security policy and reporting notes.
- [LICENSE](./LICENSE) - MIT license.
- [.run](./.run) - local release scripts for publishing action tags.

## Orcestr Ecosystem

Orcestr Repo Notifier is one piece of the broader Orcestr direction: practical product surfaces and open-source infrastructure built from real workflows.

Useful links:

- [Main Orcestr website](https://orcestr.com)
- [Orcestr overview repository](https://github.com/Artasov/orcestr-overview)
- [Orcestr UI](https://github.com/Artasov/orcestr-ui)
