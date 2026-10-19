import { query } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const rows = await query("SELECT id, name, division FROM users ORDER BY id");
  return Response.json({ users: rows });
}
