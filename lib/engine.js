import { SCHEDULE, scheduleState } from "./schedule";
import { TEMPLATES } from "./templates";

export const STREAK_MILESTONES = [3, 5, 10];
const inRange = (t, w) => t >= w.start && t < w.end;

/** Kategori notifikasi untuk user pada waktu tertentu (null = tidak ada / di luar jadwal) */
export function decideCategory(user, now = new Date()) {
  const s = scheduleState(now);
  if (!s.active) return null;                                   // hanya Senin–Jumat 08.00–00.00 WIB
  const t = s.minutes;

  if (user.logbookDone && user.checkedIn && STREAK_MILESTONES.includes(user.streak) && !user.streakNotified) return "gamification";
  if (!user.logbookDone && t >= SCHEDULE.close - SCHEDULE.urgentLead) return "urgent";
  if (!user.checkedIn && inRange(t, SCHEDULE.attendanceIn)) return "attendance_in";
  if (user.checkedIn && !user.checkedOut && inRange(t, SCHEDULE.attendanceOut)) return "attendance_out";
  if (!user.logbookDone && SCHEDULE.logbook.some(w => inRange(t, w))) return "logbook";
  return null;
}

export function buildNotification(user, now = new Date()) {
  const category = decideCategory(user, now);
  if (!category) return null;
  const { dayKey } = scheduleState(now);
  const list = TEMPLATES[category];
  const seed = [...`${user.id}${dayKey}`].reduce((a, c) => a + c.charCodeAt(0), 0);
  const tpl = list[seed % list.length];
  const fill = s => s.replace(/\{\{(\w+)\}\}/g, (_, k) => ({ nama: user.name, streak: user.streak }[k] ?? ""));
  return { category, title: fill(tpl.title), message: fill(tpl.message), action_button: tpl.action_button };
}
