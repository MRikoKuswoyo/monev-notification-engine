import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function POST(req) {
  const { userId } = await req.json();
  await query("UPDATE notifications SET is_read = true WHERE user_id = $1", [userId]);
  return Response.json({ ok: true });
}
