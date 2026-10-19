import { readFileSync } from "node:fs";
import { buildNotification, getWIB } from "./engine.js";

const users = JSON.parse(readFileSync(new URL("../data/users.json", import.meta.url)));
const sent = new Set(); // dedup: userId|kategori|tanggal

// GANTI fungsi ini dengan push notification / WebSocket / email sesungguhnya.
async function send(user, notif) {
  console.log(`[${new Date().toISOString()}] -> ${user.name}:`, JSON.stringify(notif));
}

export async function tick(now = new Date()) {
  const { dayKey } = getWIB(now);
  for (const u of users) {
    const n = buildNotification(u, now);
    if (!n) continue;
    const key = `${u.id}|${n.category}|${dayKey}`;
    if (sent.has(key)) continue;
    sent.add(key);
    await send(u, n);
  }
}

// Cek tiap menit
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Scheduler berjalan (cek tiap 60 detik)...");
  tick();
  setInterval(tick, 60_000);
}
