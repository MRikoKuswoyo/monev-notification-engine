import { getStatus, parseNow } from "@/lib/service";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const st = await getStatus(Number(q.get("userId")), parseNow(q.get("now")));
  return st ? Response.json(st) : Response.json({ error: "User tidak ditemukan" }, { status: 404 });
}
