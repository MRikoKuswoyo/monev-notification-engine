// Membuat tabel + data contoh di Supabase (PostgreSQL) dari database/schema.sql.
// Jalankan: npm run db:setup   (atau db:fresh untuk menghapus 4 tabel Monev lalu membuat ulang)
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const fresh = process.argv.includes("--fresh");
const url = process.env.DATABASE_URL;
if (!url) { console.error("✗ DATABASE_URL belum diisi di .env.local"); process.exit(1); }

const local = /@(localhost|127\.0\.0\.1)/.test(url);

(async () => {
  const client = new Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
  await client.connect();
  if (fresh) {
    await client.query("DROP TABLE IF EXISTS public.notifications, public.logbooks, public.attendances, public.users CASCADE");
    console.log("• Tabel lama dihapus");
  }
  await client.query(fs.readFileSync(path.join(__dirname, "../database/schema.sql"), "utf8"));
  const { rows } = await client.query("SELECT COUNT(*)::int AS c FROM public.users");
  console.log(`✓ Database siap. Jumlah peserta: ${rows[0].c}`);
  await client.end();
})().catch(e => { console.error("✗ Gagal:", e.message); process.exit(1); });
