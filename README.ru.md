<p align="right">
  <img src="./assets/orcestr-logo.png" alt="Логотип Orcestr" width="42" height="42" align="left" />
  <a href="./README.md">English</a> · <strong>Русский</strong>
</p>

# Orcestr Repo Notifier

[![Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-Orcestr%20Repo%20Notifier-blue)](https://github.com/marketplace/actions/orcestr-repo-notifier)
[![Validate](https://github.com/Artasov/orcestr-repo-notifier/actions/workflows/validate.yml/badge.svg)](https://github.com/Artasov/orcestr-repo-notifier/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Превращает GitHub pushes в понятные Telegram-обновления.

Помогает team lead, founder, product owner и разработчикам видеть реальный прогресс разработки без чтения сырых коммитов. После push использует Codex, анализирует изменение в репозитории и пишет короткое Telegram-сообщение: что изменилось, что было сделано и почему это важно.

Можно использовать для внутренних командных обновлений или для публичной истории проекта, чтобы не писать каждый пост вручную.

Часть экосистемы [Orcestr](https://orcestr.com).

## Установка

Открой action в [GitHub Marketplace](https://github.com/marketplace/actions/orcestr-repo-notifier) или добавь вручную.

Marketplace snippet показывает только как сослаться на action. Используй полный workflow ниже, чтобы правильно были настроены checkout, secrets и prompt.

В репозитории, который нужно отслеживать, создай:

```text
.github/workflows/orcestr-repo-notifier.yml
```

Добавь workflow:

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
          # Optional: для Telegram forum topic.
          # telegram-message-thread-id: "123"
          mode: product
          language: ru
          model: gpt-5.5
          effort: medium
          custom-prompt: |
            Пиши короткое Telegram-сообщение для владельца продукта и команды.
            Объясняй, что реально поменялось в продукте, а не просто в коде.
            Не перечисляй все файлы.
            Не используй технический жаргон без необходимости.
            Если изменение техническое, объясни влияние на стабильность, скорость, UX или поддержку.
```

Добавь repository secrets в `Settings -> Secrets and variables -> Actions`:

```text
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

При следующем push в `main` бот отправит сгенерированное обновление в Telegram.

## Настройка Telegram

Создай бота:

1. Открой `@BotFather` в Telegram.
2. Отправь `/newbot`.
3. Пройди шаги и скопируй token. Его нужно сохранить как `TELEGRAM_BOT_TOKEN`.

Получи `TELEGRAM_CHAT_ID`:

1. Добавь бота в группу или открой личный чат с ботом.
2. Отправь новое сообщение после добавления бота.
3. Открой:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates
```

4. Найди `chat.id` в ответе. У групп id обычно выглядит так: `-1001234567890`.

Для Telegram forum topics дополнительно нужен `telegram-message-thread-id`:

1. Отправь сообщение в нужную тему.
2. Снова открой `getUpdates`.
3. Найди `message_thread_id` внутри message object.

Если `getUpdates` пустой, отправь новое сообщение после добавления бота. Если тема группы все равно не появляется, отключи privacy mode у бота в `@BotFather` через `/setprivacy`, затем отправь новое сообщение в тему.

## Режимы

`product` используется по умолчанию. Он пишет продуктовый update: фичи, UX-изменения, видимые исправления и изменения поведения.

`technical` пишет инженерный update: изменения реализации, риски, конфиги и operational notes.

`hybrid` сначала объясняет product impact, затем добавляет короткие engineering notes.

Пример:

```yaml
- uses: Artasov/orcestr-repo-notifier@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    mode: technical
    effort: high
```

## Настройки

| Input | По умолчанию | Описание |
| --- | --- | --- |
| `openai-api-key` | required | OpenAI API key для Codex. |
| `telegram-bot-token` | required | Telegram bot token из BotFather. |
| `telegram-chat-id` | required | Целевой chat, group или channel id. |
| `telegram-message-thread-id` | empty | Optional id темы в Telegram forum group. |
| `model` | `gpt-5.5` | Codex model. |
| `effort` | `medium` | Reasoning effort. |
| `mode` | `product` | `product`, `technical` или `hybrid`. |
| `language` | `ru` | Язык сообщения. |
| `custom-prompt` | empty | Дополнительные инструкции для сообщения. |
| `max-diff-chars` | `30000` | Лимит diff sample для Codex. |
| `dry-run` | `false` | Запустить Codex, но не отправлять сообщение в Telegram. |

## Безопасность

Не запускай этот action с secrets на непроверенных pull request events. Начни с `push` в защищенные ветки.

Храни `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` только в GitHub Actions secrets.

## Ссылки

- [GitHub Marketplace](https://github.com/marketplace/actions/orcestr-repo-notifier)
- [Сайт Orcestr](https://orcestr.com)
- [Orcestr overview](https://github.com/Artasov/orcestr-overview)
- [Contributing](./CONTRIBUTING.md)
- [Security](./SECURITY.md)
- [License](./LICENSE)
