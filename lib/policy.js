// Aturan murni (tanpa DB / jaringan) untuk pengingat Telegram — mudah diuji.

/** Kategori yang diulang terus sampai kamu konfirmasi "sudah". Gamifikasi hanya sekali. */
export const NAG_CATEGORIES = new Set(["attendance_in", "attendance_out", "logbook", "urgent"]);

export const DEFAULT_NAG_MINUTES = 10;

/**
 * Perlu kirim pengingat Telegram sekarang?
 * @param category      hasil engine (null = tidak ada yang perlu diingatkan)
 * @param lastSentMs    kapan terakhir dikirim untuk (user, kategori, hari) ini; null = belum pernah
 * @param snoozeUntilMs sampai kapan ditunda lewat tombol "Ingatkan lagi"; null = tidak ditunda
 */
export function shouldSend({ category, lastSentMs = null, snoozeUntilMs = null, nowMs, nagMinutes = DEFAULT_NAG_MINUTES }) {
  if (!category) return false;
  if (snoozeUntilMs != null && nowMs < snoozeUntilMs) return false;
  if (lastSentMs == null) return true;
  if (!NAG_CATEGORIES.has(category)) return false;
  return nowMs - lastSentMs >= nagMinutes * 60_000;
}

/** Tombol inline di bawah pesan Telegram. */
export function buttonsFor(category) {
  const done = {
    attendance_in: { text: "✅ Sudah absen masuk", callback_data: "done:in" },
    attendance_out: { text: "✅ Sudah absen pulang", callback_data: "done:out" },
    logbook: { text: "✅ Sudah isi logbook", callback_data: "done:log" },
    urgent: { text: "✅ Sudah isi logbook", callback_data: "done:log" }
  }[category];
  if (!done) return null;
  return [[done], [{ text: "⏰ Ingatkan lagi 30 menit", callback_data: "snooze:30" }]];
}
