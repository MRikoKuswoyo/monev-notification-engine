import { query } from "@/lib/db";
import { scheduleState, toSql } from "@/lib/schedule";
import { getStatus, parseNow } from "@/lib/service";
export const dynamic = "force-dynamic";

const OUT_OF_SCHEDULE = "Di luar jadwal MagangHub (Senin–Jumat, 08.00–00.00 WIB).";

export async function POST(req) {
  const { userId, type, now: n } = await req.json();
  const now = parseNow(n);
  const s = scheduleState(now);
  if (!s.active) return Response.json({ error: OUT_OF_SCHEDULE }, { status: 400 });

  const [att] = await query("SELECT id, check_in_at, check_out_at FROM attendances WHERE user_id = $1 AND work_date = $2", [userId, s.dayKey]);
  if (type === "in") {
    if (att?.check_in_at) return Response.json({ error: "Kamu sudah absen masuk hari ini." }, { status: 409 });
    await query("INSERT INTO attendances (user_id, work_date, check_in_at) VALUES ($1,$2,$3)", [userId, s.dayKey, toSql(now)]);
  } else if (type === "out") {
    if (!att?.check_in_at) return Response.json({ error: "Absen masuk dulu sebelum absen pulang." }, { status: 409 });
    if (att.check_out_at) return Response.json({ error: "Kamu sudah absen pulang hari ini." }, { status: 409 });
    await query("UPDATE attendances SET check_out_at = $1 WHERE id = $2", [toSql(now), att.id]);
  } else {
    return Response.json({ error: "type harus 'in' atau 'out'" }, { status: 400 });
  }
  return Response.json(await getStatus(userId, now));
}
