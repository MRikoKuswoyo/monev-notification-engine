import { query } from "@/lib/db";
import { getStatus } from "@/lib/service";
import { sendMessage, telegramEnabled } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Dipanggil Vercel Cron sekali per hari (Senin–Jumat). Vercel otomatis mengirim
// header "Authorization: Bearer <CRON_SECRET>" jika env CRON_SECRET diisi.
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!telegramEnabled()) return Response.json({ skipped: "TELEGRAM_BOT_TOKEN kosong" });

  const now = new Date();
  const users = await query("SELECT id, name, telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL");
  let sent = 0;
  for (const u of users) {
    try {
      const st = await getStatus(u.id, now);
      if (!st || !st.schedule.workday) continue;
      await sendMessage(
        u.telegram_chat_id,
        `☀️ Selamat pagi, ${u.name}!\n\nHari ini jangan lupa:\n` +
        `${st.attendance.checkIn ? "✅" : "⬜"} Absen masuk\n` +
        `${st.logbook ? "✅" : "⬜"} Isi logbook\n` +
        `${st.attendance.checkOut ? "✅" : "⬜"} Absen pulang\n\n` +
        `Streak: ${st.streak} hari 🔥`
      );
      sent++;
    } catch (e) { console.log("[cron/daily] gagal untuk", u.name, e.message); }
  }
  return Response.json({ ok: true, sent });
}
