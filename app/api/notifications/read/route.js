import { pool } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function POST(req) {
  const { userId } = await req.json();
  await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
  return Response.json({ ok: true });
}
