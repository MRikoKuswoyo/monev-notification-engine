import { query } from "@/lib/db";
import { scheduleState, toSql } from "@/lib/schedule";
import { getStatus, parseNow } from "@/lib/service";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { userId, content, now: n } = await req.json();
  const now = parseNow(n);
  const s = scheduleState(now);
  if (!s.active) return Response.json({ error: "Di luar jadwal MagangHub (Senin–Jumat, 08.00–00.00 WIB)." }, { status: 400 });
  const text = String(content || "").trim();
  if (text.length < 10) return Response.json({ error: "Logbook minimal 10 karakter ya." }, { status: 400 });

  await query(
    `INSERT INTO logbooks (user_id, work_date, content, created_at) VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id, work_date) DO UPDATE SET content = EXCLUDED.content`,
    [userId, s.dayKey, text.slice(0, 2000), toSql(now)]);
  return Response.json(await getStatus(userId, now));
}
