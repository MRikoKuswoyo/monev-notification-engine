import { pool } from "./db";

const token = () => process.env.TELEGRAM_BOT_TOKEN;
export const telegramEnabled = () => !!token();

async function call(method, body = {}, timeoutMs = 15000) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description || res.status}`);
  return data.result;
}

export const sendMessage = (chatId, text, buttons) =>
  call("sendMessage", { chat_id: chatId, text, ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}) });

export const answerCallback = (id, text) => call("answerCallbackQuery", { callback_query_id: id, text }).catch(() => {});
export const clearButtons = (chatId, messageId) =>
  call("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }).catch(() => {});
export const deleteWebhook = () => call("deleteWebhook", {});
export const getMe = () => call("getMe", {});

/** Long polling: timeout 25 dtk di sisi Telegram, batas 35 dtk di sisi kita. */
export const getUpdates = offset =>
  call("getUpdates", { offset, timeout: 25, allowed_updates: ["message", "callback_query"] }, 35000);

/** Tambah kolom telegram_chat_id jika belum ada (aman untuk database lama). */
export async function ensureSchema() {
  const [rows] = await pool.query(
    "SELECT COUNT(*) c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'telegram_chat_id'");
  if (!rows[0].c) await pool.query("ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(30) NULL");
}
