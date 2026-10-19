// Jadwal MagangHub: Senin–Jumat, 08.00 – 00.00 WIB (menit sejak 00:00)
const m = (h, mi = 0) => h * 60 + mi;

export const SCHEDULE = {
  workdays: [1, 2, 3, 4, 5],        // 1 = Senin ... 5 = Jumat
  open: m(8, 0),                     // sistem aktif 08.00
  close: m(24, 0),                   // sampai 00.00 (deadline logbook)
  attendanceIn: { start: m(8, 0), end: m(9, 0) },
  attendanceOut: { start: m(16, 30), end: m(17, 0) },
  logbook: [{ start: m(15, 30), end: m(16, 0) }, { start: m(20, 0), end: m(20, 30) }],
  urgentLead: 60
};

const WIB_OFFSET = 7 * 3600 * 1000;

/** Pecah waktu menjadi komponen WIB: dayKey (YYYY-MM-DD), weekday (0=Min), minutes */
export function wib(date = new Date()) {
  const s = new Date(date.getTime() + WIB_OFFSET);
  return {
    dayKey: s.toISOString().slice(0, 10),
    weekday: s.getUTCDay(),
    minutes: s.getUTCHours() * 60 + s.getUTCMinutes(),
    seconds: s.getUTCSeconds()
  };
}

export const isWorkdayKey = key => SCHEDULE.workdays.includes(new Date(key + "T00:00:00Z").getUTCDay());

export function prevWorkday(key) {
  const d = new Date(key + "T00:00:00Z");
  do { d.setUTCDate(d.getUTCDate() - 1); } while (!SCHEDULE.workdays.includes(d.getUTCDay()));
  return d.toISOString().slice(0, 10);
}

/** Status jadwal pada waktu tertentu */
export function scheduleState(date = new Date()) {
  const p = wib(date);
  const workday = SCHEDULE.workdays.includes(p.weekday);
  const active = workday && p.minutes >= SCHEDULE.open && p.minutes < SCHEDULE.close;
  let reason = null;
  if (!workday) reason = "weekend";
  else if (p.minutes < SCHEDULE.open) reason = "before_open";
  return { ...p, workday, active, reason };
}

export const toSql = d => d.toISOString().slice(0, 19).replace("T", " ");
export const fromSql = s => (s ? new Date(s.replace(" ", "T") + "Z").toISOString() : null);
