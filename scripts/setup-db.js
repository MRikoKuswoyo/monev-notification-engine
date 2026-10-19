// Membuat database + tabel + data contoh.  Jalankan: npm run db:setup   (atau db:fresh untuk reset)
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const fresh = process.argv.includes("--fresh");
const DB = process.env.DB_NAME || "monev_maganghub";

const WIB = 7 * 3600 * 1000;
const dayKey = d => new Date(d.getTime() + WIB).toISOString().slice(0, 10);
const isWork = d => { const w = new Date(d.getTime() + WIB).getUTCDay(); return w >= 1 && w <= 5; };
function lastWorkdays(n) {            // n hari kerja sebelum hari ini
  const out = []; const d = new Date();
  while (out.length < n) { d.setUTCDate(d.getUTCDate() - 1); if (isWork(d)) out.push(dayKey(d)); }
  return out;
}
const sql = (key, hh, mm) => `${key} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`; // jam WIB -> UTC di bawah
function utc(key, h, m) { return new Date(new Date(`${key}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00+07:00`)).toISOString().slice(0, 19).replace("T", " "); }

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "", multipleStatements: true
  });
  if (fresh) { await conn.query(`DROP DATABASE IF EXISTS \`${DB}\``); console.log("• Database lama dihapus"); }
  await conn.query(fs.readFileSync(path.join(__dirname, "../database/schema.sql"), "utf8").replace(/monev_maganghub/g, DB));
  await conn.query(`USE \`${DB}\``);

  const [[{ c }]] = await conn.query("SELECT COUNT(*) c FROM users");
  if (c === 0) {
    const people = [
      ["Riko", "riko@example.com", "Teknologi Informasi", 4],   // selesaikan hari ini -> streak 5 (konfeti!)
      ["Sari", "sari@example.com", "Humas", 2],                 // -> streak 3
      ["Budi", "budi@example.com", "Administrasi", 9],          // -> streak 10
      ["Dewi", "dewi@example.com", "Keuangan", 0],
      ["Andi", "andi@example.com", "Umum", 1]
    ];
    for (const [name, email, div, past] of people) {
      const [r] = await conn.query("INSERT INTO users (name, email, division) VALUES (?,?,?)", [name, email, div]);
      for (const k of lastWorkdays(past)) {
        await conn.query("INSERT INTO attendances (user_id, work_date, check_in_at, check_out_at) VALUES (?,?,?,?)", [r.insertId, k, utc(k, 8, 5), utc(k, 16, 45)]);
        await conn.query("INSERT INTO logbooks (user_id, work_date, content, created_at) VALUES (?,?,?,?)", [r.insertId, k, "Mengerjakan tugas harian, rapat koordinasi, dan dokumentasi kegiatan.", utc(k, 16, 0)]);
      }
    }
    console.log("• 5 peserta contoh + riwayat absen/logbook dibuat");
  } else console.log("• Data sudah ada, seed dilewati (gunakan npm run db:fresh untuk reset)");
  console.log(`✓ Database "${DB}" siap.`);
  await conn.end();
})().catch(e => { console.error("✗ Gagal:", e.message); process.exit(1); });
