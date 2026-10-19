import { pool } from "./db";
import { scheduleState, toSql } from "./schedule";
import { buildNotification } from "./engine";
import { getStatus, pollNotifications, engineUser } from "./service";
import { shouldSend, buttonsFor, DEFAULT_NAG_MINUTES } from "./policy";
import {
  telegramEnabled, ensureSchema, sendMessage, answerCallback, clearButtons, deleteWebhook, getMe, getUpdates
} from "./telegram";

const NAG_MINUTES = Number(process.env.REMINDER_NAG_MINUTES) || DEFAULT_NAG_MINUTES;
const DEFAULT_NAME = process.env.MONEV_USER_NAME || "Riko";

// State di memori (bertahan selama server hidup)
const g = globalThis;
g.__monevRem ??= { started: false, lastSent: new Map(), snooze: new Map(), offset: 0 };
const S = g.__monevRem;

const log = (...a) => console.log("[pengingat]", ...a);
const fmt = iso => (iso ? new Date(iso).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }).replace(".", ":") : "—");

/* ---------- Kirim pengingat (dipanggil tiap menit) ---------- */
export async function tick(now = new Date()) {
  if (!scheduleState(now).active) return;
  const [users] = await pool.query("SELECT id, name, telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL");
  for (const u of users) {
    try {
      const st = await getStatus(u.id, now);
      if (!st) continue;
      await pollNotifications(u.id, now);                       // tetap isi lonceng di web
      const notif = buildNotification(engineUser(u.id, st), now);
      if (!notif) continue;

      const key = `${u.id}|${notif.category}|${st.schedule.dayKey}`;
      const ok = shouldSend({
        category: notif.category, lastSentMs: S.lastSent.get(key) ?? null,
        snoozeUntilMs: S.snooze.get(u.id) ?? null, nowMs: now.getTime(), nagMinutes: NAG_MINUTES
      });
      if (!ok) continue;

      await sendMessage(u.telegram_chat_id, `${notif.title}\n\n${notif.message}`, buttonsFor(notif.category));
      S.lastSent.set(key, now.getTime());
    } catch (e) { log(`gagal untuk ${u.name}:`, e.message); }
  }
}

/* ---------- Tandai "sudah" dari tombol Telegram ---------- */
async function markDone(userId, kind, now = new Date()) {
  const { dayKey } = scheduleState(now);
  const t = toSql(now);
  if (kind === "in")
    await pool.query(
      `INSERT INTO attendances (user_id, work_date, check_in_at) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE check_in_at = COALESCE(check_in_at, VALUES(check_in_at))`, [userId, dayKey, t]);
  else if (kind === "out")
    await pool.query("UPDATE attendances SET check_out_at = COALESCE(check_out_at, ?) WHERE user_id = ? AND work_date = ?", [t, userId, dayKey]);
  else if (kind === "log")
    await pool.query(
      `INSERT INTO logbooks (user_id, work_date, content, created_at) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE content = content`, [userId, dayKey, "Dikonfirmasi sudah diisi lewat Telegram.", t]);
}

const userByChat = async chatId => (await pool.query("SELECT id, name FROM users WHERE telegram_chat_id = ?", [String(chatId)]))[0][0];

/* ---------- Perintah & tombol ---------- */
async function onMessage(msg) {
  const chatId = msg.chat.id;
  const [cmdRaw, ...rest] = (msg.text || "").trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace(/@.*$/, "");

  if (cmd === "/start" || cmd === "/daftar") {
    const name = rest.join(" ") || DEFAULT_NAME;
    const [[u]] = await pool.query("SELECT id, name, telegram_chat_id FROM users WHERE LOWER(name) = LOWER(?)", [name]);
    if (!u) return sendMessage(chatId, `Peserta "${name}" tidak ditemukan. Cek tabel users, atau pakai: /daftar NamaPeserta`);
    if (u.telegram_chat_id && u.telegram_chat_id !== String(chatId))
      return sendMessage(chatId, "Peserta ini sudah terhubung ke chat Telegram lain.");
    await pool.query("UPDATE users SET telegram_chat_id = ? WHERE id = ?", [String(chatId), u.id]);
    return sendMessage(chatId,
      `Halo ${u.name}! 👋 Pengingat aktif.\n\nSenin–Jumat aku ingatkan absen masuk, logbook, dan absen pulang. ` +
      `Kalau sudah, tekan tombol ✅ supaya pengingat berhenti.\n\n/status – cek kondisi hari ini`);
  }

  const u = await userByChat(chatId);
  if (!u) return sendMessage(chatId, "Chat ini belum terhubung. Kirim /start dulu.");

  if (cmd === "/status") {
    const st = await getStatus(u.id, new Date());
    return sendMessage(chatId,
      `📋 Hari ini (${st.schedule.dayKey})\n` +
      `Absen masuk : ${fmt(st.attendance.checkIn)}\n` +
      `Absen pulang: ${fmt(st.attendance.checkOut)}\n` +
      `Logbook     : ${st.logbook ? "sudah ✅" : "belum ❌"}\n` +
      `Streak      : ${st.streak} hari`);
  }
}

async function onCallback(cb) {
  const chatId = cb.message?.chat.id;
  const u = chatId && (await userByChat(chatId));
  if (!u) return answerCallback(cb.id, "Chat belum terhubung.");
  const [action, arg] = (cb.data || "").split(":");

  if (action === "done") {
    await markDone(u.id, arg);
    await answerCallback(cb.id, "Sip, tercatat! 🎉");
    await clearButtons(chatId, cb.message.message_id);
    return sendMessage(chatId, "Mantap, pengingat dihentikan untuk yang ini. 👍");
  }
  if (action === "snooze") {
    S.snooze.set(u.id, Date.now() + Number(arg || 30) * 60_000);
    await answerCallback(cb.id, `Oke, diingatkan lagi ${arg || 30} menit lagi ⏰`);
    return clearButtons(chatId, cb.message.message_id);
  }
}

async function pollLoop() {
  for (;;) {
    try {
      const updates = await getUpdates(S.offset);
      for (const up of updates) {
        S.offset = up.update_id + 1;
        try {
          if (up.callback_query) await onCallback(up.callback_query);
          else if (up.message) await onMessage(up.message);
        } catch (e) { log("gagal memproses update:", e.message); }
      }
    } catch (e) {
      log("polling Telegram gagal, coba lagi 10 dtk:", e.message);
      await new Promise(r => setTimeout(r, 10_000));
    }
  }
}

/* ---------- Dipanggil sekali saat server Next menyala ---------- */
export async function startReminders() {
  if (S.started) return;
  if (!telegramEnabled()) { log("TELEGRAM_BOT_TOKEN belum diisi di .env.local — pengingat Telegram nonaktif."); return; }
  S.started = true;
  try {
    await ensureSchema();
    await deleteWebhook();
    const me = await getMe();
    log(`aktif sebagai @${me.username}. Buka Telegram, cari bot itu, lalu kirim /start`);
  } catch (e) { S.started = false; log("gagal menyalakan:", e.message); return; }

  pollLoop();
  setInterval(() => tick().catch(e => log("tick error:", e.message)), 60_000);
  tick().catch(() => {});
}
