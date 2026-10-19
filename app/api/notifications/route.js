import { pollNotifications, parseNow } from "@/lib/service";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const r = await pollNotifications(Number(q.get("userId")), parseNow(q.get("now")));
  return r ? Response.json(r) : Response.json({ error: "User tidak ditemukan" }, { status: 404 });
}
