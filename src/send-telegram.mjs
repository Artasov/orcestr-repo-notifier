import { readFileSync } from "node:fs";
import { join } from "node:path";

const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
const botToken = process.env.ORCESTR_TELEGRAM_BOT_TOKEN || "";
const chatId = process.env.ORCESTR_TELEGRAM_CHAT_ID || "";
const messageThreadId = process.env.ORCESTR_TELEGRAM_MESSAGE_THREAD_ID || "";
const parseMode = process.env.ORCESTR_TELEGRAM_PARSE_MODE || "none";
const finalMessage = process.env.ORCESTR_CODEX_FINAL_MESSAGE || readOutputFile();

function readOutputFile() {
  try {
    return readFileSync(join(workspace, ".orcestr-repo-notifier", "codex-output.md"), "utf8");
  } catch {
    return "";
  }
}

function splitMessage(text, limit = 3900) {
  const chunks = [];
  let remaining = text.trim();

  while (remaining.length > limit) {
    const splitAt = Math.max(
      remaining.lastIndexOf("\n", limit),
      remaining.lastIndexOf(" ", limit),
    );
    const index = splitAt > 0 ? splitAt : limit;
    chunks.push(remaining.slice(0, index).trim());
    remaining = remaining.slice(index).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

async function sendMessage(text) {
  const body = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };

  if (messageThreadId) {
    body.message_thread_id = Number(messageThreadId);
  }

  if (parseMode && parseMode !== "none") {
    body.parse_mode = parseMode;
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API failed with ${response.status}: ${errorText}`);
  }
}

if (!botToken) {
  throw new Error("telegram-bot-token is required.");
}

if (!chatId) {
  throw new Error("telegram-chat-id is required.");
}

if (messageThreadId && !/^\d+$/.test(messageThreadId)) {
  throw new Error("telegram-message-thread-id must be an integer.");
}

if (!finalMessage.trim()) {
  throw new Error("Codex returned an empty message.");
}

for (const chunk of splitMessage(finalMessage)) {
  await sendMessage(chunk);
}
