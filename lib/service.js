import { pool } from "./db";
import { scheduleState, isWorkdayKey, prevWorkday, toSql, fromSql } from "./schedule";
import { buildNotification } from "./engine";

export function parseNow(v) {
  const d = v ? new Date(v) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function computeStreak(userId, dayKey) {
  const [rows] = await pool.query(
    `SELECT a.work_date FROM attendances a
       JOIN logbooks l ON l.user_id = a.user_id AND l.work_date = a.work_date
      WHERE a.user_id = ? AND a.check_in_at IS NOT NULL AND a.work_date <= ?
      ORDER BY a.work_date DESC LIMIT 60`, [userId, dayKey]);
  const set = new Set(rows.map(r => r.work_date));
  let cur = isWorkdayKey(dayKey) ? dayKey : prevWorkday(dayKey);
  if (!set.has(cur) && cur === dayKey) cur = prevWorkday(cur);   // hari ini belum lengkap: hitung dari kemarin
  let n = 0;
  while (set.has(cur)) { n++; cur = prevWorkday(cur); }
  return n;
}

export async function getStatus(userId, now) {
  const s = scheduleState(now);
  const [[user]] = await pool.query("SELECT id, name, email, division FROM users WHERE id = ?", [userId]);
  if (!user) return null;
  const [[att]] = await pool.query("SELECT check_in_at, check_out_at FROM attendances WHERE user_id = ? AND work_date = ?", [userId, s.dayKey]);
  const [[log]] = await pool.query("SELECT content, created_at FROM logbooks WHERE user_id = ? AND work_date = ?", [userId, s.dayKey]);
  const [[gm]] = await pool.query("SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND work_date = ? AND category = 'gamification'", [userId, s.dayKey]);
  const streak = await computeStreak(userId, s.dayKey);
  return {
    user,
    schedule: { active: s.active, workday: s.workday, reason: s.reason, minutes: s.minutes, dayKey: s.dayKey, weekday: s.weekday },
    attendance: { checkIn: fromSql(att?.check_in_at), checkOut: fromSql(att?.check_out_at) },
    logbook: log ? { content: log.content, createdAt: fromSql(log.created_at) } : null,
    streak,
    streakNotified: gm.c > 0
  };
}

/** Bentuk status -> input engine */
export function engineUser(userId, st) {
  return {
    id: userId, name: st.user.name, checkedIn: !!st.attendance.checkIn, checkedOut: !!st.attendance.checkOut,
    logbookDone: !!st.logbook, streak: st.streak, streakNotified: st.streakNotified
  };
}

/** Evaluasi engine; simpan notifikasi baru (dedup per user/kategori/hari) lalu kembalikan daftar terbaru */
export async function pollNotifications(userId, now) {
  const st = await getStatus(userId, now);
  if (!st) return null;
  const notif = buildNotification(engineUser(userId, st), now);

  let fresh = null;
  if (notif) {
    const [r] = await pool.query(
      `INSERT IGNORE INTO notifications (user_id, work_date, category, title, message, action_button, created_at)
       VALUES (?,?,?,?,?,?,?)`,
      [userId, st.schedule.dayKey, notif.category, notif.title, notif.message, notif.action_button, toSql(now)]);
    if (r.affectedRows === 1) fresh = { id: r.insertId, ...notif, createdAt: now.toISOString(), isRead: false };
  }
  const [rows] = await pool.query(
    "SELECT id, category, title, message, action_button, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 20", [userId]);
  const list = rows.map(r => ({ id: r.id, category: r.category, title: r.title, message: r.message, action_button: r.action_button, isRead: !!r.is_read, createdAt: fromSql(r.created_at) }));
  return { fresh, list, unread: list.filter(n => !n.isRead).length };
}
