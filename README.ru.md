<p align="right">
  <img src="./assets/orcestr-logo.png" alt="Логотип Orcestr" width="42" height="42" align="left" />
  <a href="./README.md">English</a> · <strong>Русский</strong>
</p>

# Orcestr Repo Notifier

Небольшой инструмент для команд, которые хотят видеть понятный прогресс разработки без чтения сырых коммитов.

Он превращает изменения в репозитории в понятные Telegram-обновления: что запушили, что изменилось и почему это важно для проекта.

Для team lead, founder и product owner это способ следить за ежедневным engineering progress без погружения в diff. Для разработчиков и open-source maintainers - способ вести публичную историю изменений после каждого обновления, не писать посты вручную.

Это часть единой open-source платформы Orcestr: набора developer-инструментов, workflow-примитивов и продуктовой инфраструктуры, выделенной из реальной продуктовой разработки.

## Зачем

Большинство уведомлений из репозитория слишком технические для продуктовых чатов и слишком поверхностные для публичных обновлений. Они показывают commit messages, file names или raw diff, но редко объясняют реальный прогресс.

Этот action отвечает на полезные вопросы: что произошло, что изменилось для пользователей или проекта, и на что команде стоит обратить внимание.

## Как работает

```text
push в GitHub
  -> actions/checkout@v4 с fetch-depth: 0
  -> Orcestr Repo Notifier готовит контекст изменения
  -> openai/codex-action@v1 запускает Codex на checkout
  -> итоговое сообщение отправляется в Telegram
```

Action специально сделан serverless. Нет backend Orcestr, webhook-сервиса и базы данных. Все выполняется на GitHub Actions runner пользователя.

Внутри используются GitHub Actions и Codex. Репозиторий checkout-ится на runner, подготавливается контекст изменений, а Codex пишет итоговое Telegram-ready сообщение.

## Быстрый старт

Создай Telegram-бота через BotFather, добавь его в группу и получи нужный `chat_id`.

Добавь repository secrets:

```text
OPENAI_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
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

      - uses: your-org/orcestr-repo-notifier@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
```

## Режимы

`product` пишет продуктовый update: фичи, UX-изменения, видимые исправления и изменения поведения.

`technical` пишет инженерный update: изменения реализации, риски, миграции, конфиги и operational notes.

`hybrid` сначала объясняет product impact, затем добавляет короткие engineering notes.

## Настройки

`model` по умолчанию `gpt-5.5`.

`effort` по умолчанию `medium`.

`mode` по умолчанию `product`.

`language` по умолчанию `ru`.

`custom-prompt` добавляет project-specific инструкции к базовому prompt.

`sandbox` по умолчанию `read-only`, чтобы Codex мог читать репозиторий и git-контекст, но не правил файлы.

`safety-strategy` по умолчанию `drop-sudo`. Это стандартная безопасная стратегия `openai/codex-action` для Linux/macOS runner. Лучше использовать `ubuntu-latest`.

`max-diff-chars` ограничивает diff sample, который кладется в context file. Это не мешает Codex читать файлы из checkout.

`telegram-parse-mode` по умолчанию `none`, чтобы Telegram formatting не ломал сгенерированное сообщение. Можно поставить `HTML`, `Markdown` или `MarkdownV2`.

`dry-run: true` запускает Codex, но не отправляет сообщение в Telegram.

## Product пример

```yaml
- uses: your-org/orcestr-repo-notifier@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    mode: product
    custom-prompt: |
      Пиши как короткий Telegram-пост для продуктовой команды.
      Не упоминай внутренние классы, функции и имена файлов, если это не важно для понимания изменения.
```

## Technical пример

```yaml
- uses: your-org/orcestr-repo-notifier@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    mode: technical
    effort: high
    custom-prompt: |
      Отдельно отметь миграции, фоновые задачи, конфиги, риски деплоя и важные тесты, если они есть.
```

## Безопасность

Не запускай этот action с secrets на непроверенных pull request событиях. Для публичных репозиториев лучше начинать с `push` в защищенные ветки.

Ключ OpenAI и Telegram bot token должны храниться только в GitHub secrets.

Базовый prompt просит Codex считать commit messages, diffs и файлы репозитория недоверенными входными данными. Это снижает риск prompt injection из измененных файлов, но не отменяет необходимости выбирать безопасные workflow triggers.

## Orcestr

Orcestr Repo Notifier - одна часть общего направления Orcestr: практические product surfaces и open-source infrastructure, собранные из реальных workflows.

Публичное описание см. в [orcestr-overview](https://github.com/Artasov/orcestr-overview).
