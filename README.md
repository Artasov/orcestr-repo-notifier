<p align="right">
  <img src="./assets/orcestr-logo.png" alt="Orcestr logo" width="42" height="42" align="left" />
  <strong>English</strong> · <a href="./README.ru.md">Русский</a>
</p>
<br/>
<img src="/assets/banner.png"/>

# Orcestr Repo Notifier

[![Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-Orcestr%20Repo%20Notifier-blue)](https://github.com/marketplace/actions/orcestr-repo-notifier)
[![Validate](https://github.com/Artasov/orcestr-repo-notifier/actions/workflows/validate.yml/badge.svg)](https://github.com/Artasov/orcestr-repo-notifier/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Turn GitHub pushes into clear Telegram updates.

Helps team leads, founders, product owners and developers see real development progress without reading raw commits. After a push, it uses Codex to inspect the repository change and writes a short Telegram update: what changed, what was shipped, and why it matters. It can also run manually with any prompt, so Codex can inspect the project and write a specific Telegram post on demand.

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

  workflow_dispatch:
    inputs:
      task:
        description: What should Codex write about?
        required: true
        type: string

jobs:
  notify:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: Artasov/orcestr-repo-notifier@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
          # Optional: use this for a Telegram forum topic.
          # telegram-message-thread-id: "123"
          # Optional: filled when the workflow is started manually.
          custom-task: ${{ github.event.inputs.task }}
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

On the next push to `main`, the bot will send a generated update to Telegram. If the whole push is formatting-only, such as formatter/linter autofix, whitespace, import sorting, or generated file reformatting with no semantic change, Codex can return `ORCESTR_NOTIFY_SKIP` and the action will skip Telegram delivery.

To send a manual update, open `Actions -> Repo update to Telegram -> Run workflow`, enter a task, and run it. Codex will inspect the checked-out repository and write a Telegram message for that task instead of summarizing a push. `custom-prompt` still applies in manual mode, so you can define your message format once in YAML.

You can also run it with GitHub CLI:

```bash
gh workflow run orcestr-repo-notifier.yml -f task="Tell subscribers about the new analytics module"
```

Push context includes change stats: commit count, added lines, and deleted lines. You can reference these values from `custom-prompt`.

## Optional Runtime Filters

The recommended first filter is still the workflow trigger:

```yaml
on:
  push:
    branches:
      - main
```

For repositories that use a broader workflow trigger, you can also filter inside the action before Codex runs. Empty filter inputs keep the default behavior: every push allowed by the workflow trigger can run.

Run only on selected branches:

```yaml
- uses: Artasov/orcestr-repo-notifier@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    notify-branches: |
      main
      release/*
```

Run only when at least one pushed commit message contains `[notifier]`:

```yaml
- uses: Artasov/orcestr-repo-notifier@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    require-commit-marker: "true"
    commit-marker: "[notifier]"
```

These runtime filters apply to `push` events. Manual `workflow_dispatch` runs with `custom-task` still run, so you can always ask Codex to write a one-off Telegram update.

See also [`examples/commit-marker.yml`](./examples/commit-marker.yml).

## Telegram Setup

Create a bot:

1. Open `@BotFather` in Telegram.
2. Send `/newbot`.
3. Follow the prompts and copy the token. Use it as `TELEGRAM_BOT_TOKEN`.

Get `TELEGRAM_CHAT_ID`:

1. Add the bot to your group or open a private chat with it.
2. Send a new message after the bot is added.
3. Open:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates
```

4. Find `chat.id` in the response. Group ids usually look like `-1001234567890`.

For Telegram forum topics, also get `telegram-message-thread-id`:

1. Send a message in the target topic.
2. Open `getUpdates` again.
3. Find `message_thread_id` in the message object.

If `getUpdates` is empty, send a fresh message after adding the bot. If the group topic still does not appear, disable bot privacy in `@BotFather` with `/setprivacy`, then send a new message in the topic.

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
| `telegram-message-thread-id` | empty | Optional Telegram forum topic id. |
| `model` | `gpt-5.5` | Codex model. |
| `effort` | `medium` | Reasoning effort. |
| `mode` | `product` | `product`, `technical` or `hybrid`. |
| `language` | `ru` | Output language. |
| `custom-prompt` | empty | Style and format instructions for generated messages. Applies to both push updates and manual tasks. |
| `custom-task` | empty | Manual task for `workflow_dispatch`. When set, Codex writes for this task instead of summarizing the push diff. |
| `notify-branches` | empty | Optional comma- or newline-separated branch names or patterns for push events. Supports `*` wildcards. Empty means no extra action-level branch filter. |
| `require-commit-marker` | `false` | When `true`, push events run only if at least one pushed commit message contains `commit-marker`. |
| `commit-marker` | `[notifier]` | Commit message marker used by `require-commit-marker`. |
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
