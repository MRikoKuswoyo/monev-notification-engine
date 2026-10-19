import { pool } from "@/lib/db";
import { getStatus, parseNow } from "@/lib/service";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const now = parseNow(new URL(req.url).searchParams.get("now"));
  const [users] = await pool.query("SELECT id FROM users ORDER BY id");
  const rows = [];
  let schedule = null;
  for (const u of users) {
    const st = await getStatus(u.id, now);
    schedule = st.schedule;
    rows.push({ id: st.user.id, name: st.user.name, division: st.user.division, checkIn: st.attendance.checkIn, checkOut: st.attendance.checkOut, logbook: !!st.logbook, streak: st.streak });
  }
  return Response.json({ schedule, rows });
}
