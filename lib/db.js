import { Pool, types } from "pg";

// DATE  -> string "YYYY-MM-DD" (bukan objek Date), supaya cocok dengan dayKey di lib/schedule.js
types.setTypeParser(1082, v => v);

// TIMESTAMPTZ -> string ISO UTC (apa pun zona waktu sesi database)
types.setTypeParser(1184, v => {
  const m = /^(\d{4}-\d\d-\d\d) (\d\d:\d\d:\d\d)(\.\d+)?([+-]\d\d)(?::?(\d\d))?$/.exec(v);
  if (!m) return new Date(v).toISOString();
  return new Date(`${m[1]}T${m[2]}${m[3] || ""}${m[4]}:${m[5] || "00"}`).toISOString();
});

// COUNT(*) dll. (bigint) -> number
types.setTypeParser(20, v => Number(v));

const url = process.env.DATABASE_URL;
const local = !url || /@(localhost|127\.0\.0\.1)/.test(url);

const g = globalThis;
export const pool =
  g.__monevPool ??
  (g.__monevPool = new Pool({
    connectionString: url,
    ssl: local ? false : { rejectUnauthorized: false }, // Supabase wajib SSL
    max: 5
  }));

/** Jalankan query, kembalikan array baris. Placeholder: $1, $2, ... */
export async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}
