import { TEMPLATES } from "./templates.js";

export const STREAK_MILESTONES = [3, 5, 10];

// Jendela waktu (menit sejak 00:00 WIB)
const hm = (h, m = 0) => h * 60 + m;
export const WINDOWS = {
  attendance_in:  { start: hm(7, 30),  end: hm(8, 30) },
  attendance_out: { start: hm(16, 30), end: hm(17, 0) },
  logbook: [
    { start: hm(15, 30), end: hm(16, 0) },   // pemicu 15:30
    { start: hm(20, 0),  end: hm(20, 30) }   // catch-up 20:00
  ],
  urgentLeadMinutes: 60                       // 1 jam sebelum deadline logbook
};

/** Ambil jam/menit/tanggal dalam zona Asia/Jakarta (WIB). */
export function getWIB(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  const hour = Number(p.hour) % 24;
  return { minutes: hour * 60 + Number(p.minute), dayKey: `${p.year}-${p.month}-${p.day}` };
}

const parseHM = (s = "23:59") => { const [h, m] = s.split(":").map(Number); return hm(h, m || 0); };
const inRange = (t, w) => t >= w.start && t <= w.end;

function render(tpl, vars) {
  const fill = s => s.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
  return { title: fill(tpl.title), message: fill(tpl.message), action_button: tpl.action_button };
}

function pick(category, user, dayKey) {
  const list = TEMPLATES[category];
  // Rotasi deterministik per user per hari
  const seed = [...`${user.id ?? user.name}${dayKey}`].reduce((a, c) => a + c.charCodeAt(0), 0);
  return list[seed % list.length];
}

/**
 * Tentukan kategori notifikasi yang relevan untuk user pada waktu tertentu.
 * user: { id, name, checkedIn, checkedOut, logbookDone, streak, streakNotified, logbookDeadline }
 * Return kategori atau null.
 */
export function decideCategory(user, now = new Date()) {
  const { minutes } = getWIB(now);
  const deadline = parseHM(user.logbookDeadline);

  // 1. Gamifikasi: capaian streak (sekali per milestone)
  if (user.logbookDone && STREAK_MILESTONES.includes(user.streak) && !user.streakNotified) return "gamification";

  // 2. Urgent: 1 jam sebelum deadline logbook
  if (!user.logbookDone &&
      minutes >= deadline - WINDOWS.urgentLeadMinutes && minutes <= deadline) return "urgent";

  // 3. Absen masuk
  if (!user.checkedIn && inRange(minutes, WINDOWS.attendance_in)) return "attendance_in";

  // 4. Absen pulang
  if (user.checkedIn && !user.checkedOut && inRange(minutes, WINDOWS.attendance_out)) return "attendance_out";

  // 5. Logbook harian (15:30 / 20:00)
  if (!user.logbookDone && WINDOWS.logbook.some(w => inRange(minutes, w))) return "logbook";

  return null;
}

/** Buat objek notifikasi final (atau null jika tidak ada yang perlu dikirim). */
export function buildNotification(user, now = new Date()) {
  const category = decideCategory(user, now);
  if (!category) return null;
  const { dayKey } = getWIB(now);
  const tpl = pick(category, user, dayKey);
  const out = render(tpl, {
    nama: user.name, streak: user.streak, deadline: user.logbookDeadline ?? "23:59"
  });
  return { ...out, category };
}
