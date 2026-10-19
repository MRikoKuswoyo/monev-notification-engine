# Monev MagangHub

Sistem monitoring absen & logbook peserta MagangHub dengan **notifikasi real-time** dan **pengingat Telegram**,
mengikuti **jadwal MagangHub: Senin–Jumat, 08.00 – 00.00 WIB**.

**Stack:** Next.js 14 (App Router) · Supabase (PostgreSQL via `pg`) · Tailwind CSS · Framer Motion · canvas-confetti · Telegram Bot API

> **Catatan migrasi:** database sebelumnya memakai MySQL (Laragon). Sekarang seluruh sistem memakai
> **PostgreSQL di Supabase**: skema `database/schema.sql`, skrip `scripts/setup-db.js`, dan koneksi `lib/db.js`
> sudah berbasis Postgres (driver `pg`, placeholder `$1, $2, ...`, `timestamptz`, `ON CONFLICT`).

## Prasyarat
- Node.js 18.17+ (disarankan 22+ agar `npm test` berjalan mulus)
- Akun [Supabase](https://supabase.com) (gratis)
- *(Opsional)* akun Telegram untuk pengingat di HP

## Cara menjalankan

1. Buat project di [supabase.com](https://supabase.com) (misalnya `monev-maganghub`) dan simpan password database-nya.
2. Ekstrak/clone proyek, buka di **VS Code**, lalu buka terminal (Ctrl + `).
3. Pasang dependensi:
   ```bash
   npm install
   ```
4. Salin `.env.example` menjadi `.env.local`, lalu isi `DATABASE_URL`:
   Supabase → tombol **Connect** → **Session pooler** → salin URI → ganti `[YOUR-PASSWORD]`.
5. Buat tabel + data contoh (pilih salah satu):
   - **Lewat skrip:** `npm run db:setup` (ulang dari awal: `npm run db:fresh`, menghapus 4 tabel Monev lalu membuat ulang)
   - **Manual:** Supabase → SQL Editor → tempel isi `database/schema.sql` → Run
6. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
7. Buka **http://localhost:3000**

### Perintah npm
| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan (sekaligus menyalakan pengingat Telegram) |
| `npm run build` · `npm start` | Build & jalankan versi produksi |
| `npm run db:setup` | Buat tabel + data contoh di Supabase |
| `npm run db:fresh` | Hapus tabel Monev lalu buat ulang dari nol |
| `npm test` | Uji aturan pengingat (`test/reminder.test.js`) |

## Konfigurasi (`.env.local`)
| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | URI Postgres Supabase (**Session pooler**). SSL otomatis aktif untuk host non-lokal |
| `TELEGRAM_BOT_TOKEN` | Tidak | Token dari @BotFather. Kosong = pengingat Telegram nonaktif |
| `MONEV_USER_NAME` | Tidak | Nama peserta default yang dihubungkan saat `/start` (bawaan: `Riko`) |
| `REMINDER_NAG_MINUTES` | Tidak | Interval pengulangan pengingat dalam menit (bawaan: `10`) |

> `.env.local` sudah masuk `.gitignore`. **Jangan** pernah meng-commit password database atau token bot.

## Halaman
| URL | Isi |
|---|---|
| `/` | Dashboard peserta: jam WIB live, timeline hari kerja, absen masuk/pulang, logbook, streak, lonceng notifikasi |
| `/monitor` | Monitoring semua peserta (hadir, logbook, streak, status) — auto refresh |

## Jadwal & aturan notifikasi (WIB)
Sistem **hanya aktif Senin–Jumat 08.00–00.00**. Di luar itu absen/logbook ditolak dan tidak ada notifikasi.

| Kategori | Waktu | Syarat |
|---|---|---|
| `attendance_in` | 08.00–09.00 | belum absen masuk |
| `logbook` | 15.30 & 20.00 (jendela 30 menit) | logbook belum diisi |
| `attendance_out` | 16.30–17.00 | sudah masuk, belum pulang |
| `urgent` | 23.00–00.00 (1 jam sebelum deadline) | logbook belum diisi |
| `gamification` | streak 3 / 5 / 10 hari | absen masuk + logbook hari ini lengkap |

Setiap kategori hanya masuk ke lonceng web **sekali per peserta per hari** (dijamin oleh `UNIQUE (user_id, category, work_date)`
di tabel `notifications`). Streak dihitung per **hari kerja** berturut-turut (Sabtu–Minggu tidak memutus streak).

## Mode Simulasi (tombol di kiri bawah)
Untuk demo tanpa menunggu jam kerja: pilih tanggal/jam, kecepatan (hingga 1 detik = 5 menit), lalu **Mulai**.
Tombol **Coba Sabtu** menunjukkan kondisi di luar jadwal. Pakai tanggal hari ini agar streak sesuai data contoh.

Data contoh (seed) berisi 5 peserta: **Riko** (streak 4 → jadi 5 setelah hari ini lengkap), **Sari** (2), **Budi** (9),
**Dewi** (0), dan **Andi** (1).

Skenario cepat (peserta **Riko**, tanggal hari ini):
1. Simulasi 08:00 → notifikasi *Absen Masuk* muncul → klik **Absen Masuk** 🎉
2. Simulasi 15:30 → notifikasi *Logbook* → isi & simpan logbook → streak naik jadi 5 → notifikasi *Pencapaian* + konfeti 🏆
3. Pilih **Dewi**, simulasi 23:10 → notifikasi *Deadline*

## Pengingat Telegram (supaya tidak lupa absen)
Pengingat dikirim ke HP lewat bot Telegram, **walau tab web ditutup**. Bot ikut hidup otomatis bersama `npm run dev`
(lewat `instrumentation.js`), tanpa proses tambahan. Syaratnya: server (laptop) menyala & `npm run dev` berjalan.

**Setup (sekali saja)**
1. Di Telegram, chat **@BotFather** → `/newbot` → ikuti langkahnya → salin **token**.
2. Isi `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC...
   MONEV_USER_NAME=Riko          # nama peserta di tabel users
   REMINDER_NAG_MINUTES=10       # diulang tiap berapa menit sampai kamu konfirmasi
   ```
3. Restart `npm run dev`. Di terminal muncul `[pengingat] aktif sebagai @namabot`.
4. Buka bot-mu di Telegram → kirim **/start** (atau `/daftar NamaPeserta`). Selesai.

**Cara kerja**
- Server mengecek tiap 1 menit dan memakai jadwal & aturan yang sama seperti tabel di atas (Senin–Jumat).
  Pengingat absen masuk/pulang, logbook, dan deadline **diulang tiap 10 menit** selama belum ada konfirmasi
  (kategori `gamification` hanya dikirim sekali).
- Tiap pesan punya tombol **✅ Sudah …** (menghentikan pengingat) dan **⏰ Ingatkan lagi 30 menit**.
- Absen di situs asli MagangHub tidak bisa dibaca sistem ini, jadi tekan ✅ setelah kamu absen di sana.
  Tombol ini mencatat absen/logbook di database Monev (untuk logbook, isinya otomatis
  *"Dikonfirmasi sudah diisi lewat Telegram."*).
- Perintah bot: `/start`, `/daftar <nama>`, `/status` (kondisi hari ini). Lonceng di web tetap berfungsi.
- Satu peserta hanya bisa terhubung ke satu chat Telegram. Untuk memindahkan, jalankan di Supabase SQL Editor:
  ```sql
  UPDATE users SET telegram_chat_id = NULL WHERE name = 'Riko';
  ```
- Kolom `users.telegram_chat_id` otomatis ditambahkan saat bot menyala bila belum ada (`ALTER TABLE ... IF NOT EXISTS`).
- Status "terakhir dikirim" dan "tunda" disimpan di memori server, jadi ikut reset saat server di-restart.
- Ubah jam pengingat di `lib/schedule.js` (`attendanceIn`, `attendanceOut`, `logbook`).

## Struktur
```
app/                 halaman (/, /monitor) + API routes (/api/*)
components/          Dashboard, Toasts, Timeline, SimPanel, useClock, ui
lib/db.js            koneksi Postgres (pool pg, SSL untuk Supabase, parser tipe DATE/TIMESTAMPTZ)
lib/schedule.js      jadwal Senin–Jumat 08.00–00.00 + helper zona WIB
lib/engine.js        logika pemilihan notifikasi
lib/templates.js     template pesan Bahasa Indonesia
lib/service.js       query database, streak, simpan notifikasi
lib/telegram.js      klien Bot API Telegram
lib/reminder.js      pengirim pengingat + perintah/tombol bot
lib/policy.js        aturan ulang kirim & tombol (diuji)
instrumentation.js   menyalakan pengingat saat server start
database/schema.sql  skema + RLS + seed PostgreSQL (Supabase)
scripts/setup-db.js  jalankan schema.sql ke Supabase (db:setup / db:fresh)
test/                reminder.test.js (aktif) · engine.test.js (untuk prototipe lama di src/)
src/, public/, data/ prototipe awal mandiri (server HTTP + users.json), tidak dipakai aplikasi Next.js
```

## Database (Supabase / PostgreSQL)
Empat tabel di schema `public`, semuanya memakai `integer generated by default as identity` sebagai primary key:

| Tabel | Isi | Constraint penting |
|---|---|---|
| `users` | peserta: nama, email, divisi, `telegram_chat_id` | `email` unik |
| `attendances` | `check_in_at`, `check_out_at` per hari kerja | `UNIQUE (user_id, work_date)` |
| `logbooks` | isi logbook per hari kerja | `UNIQUE (user_id, work_date)` |
| `notifications` | riwayat notifikasi + status `is_read` | `UNIQUE (user_id, category, work_date)` |

- Waktu (`check_in_at`, `check_out_at`, `created_at`) disimpan sebagai **`timestamptz` (UTC)**; `work_date` adalah **tanggal kerja WIB**.
- Semua tabel mengaktifkan **Row Level Security (RLS) tanpa policy**, sehingga anon/authenticated key Supabase tidak bisa
  membaca atau menulis lewat API publik. Aplikasi ini mengakses database langsung lewat `DATABASE_URL` di sisi server.
- Relasi `user_id` memakai `ON DELETE CASCADE`.

## API
`GET /api/users` · `GET /api/status?userId=` · `POST /api/attendance` `{userId,type:"in"|"out"}` ·
`POST /api/logbook` `{userId,content}` · `GET /api/notifications?userId=` · `POST /api/notifications/read` `{userId}` ·
`GET /api/monitor`

Semua endpoint menerima `now` (ISO) opsional untuk simulasi waktu. Logbook minimal 10 karakter (maksimal 2000 karakter disimpan).

## Troubleshooting
- **`DATABASE_URL belum diisi`** → isi `.env.local` (lihat langkah 4).
- **`password authentication failed`** → password di `DATABASE_URL` salah; reset di Supabase → Project Settings → Database.
- **`ENOTFOUND` / `ETIMEDOUT` ke `db.xxx.supabase.co`** → jaringanmu belum mendukung IPv6; pakai string **Session pooler** (host `...pooler.supabase.com`).
- **Port bentrok 3000** → `npx next dev -p 3001`.
- **Halaman menampilkan "Database belum siap"** → jalankan `npm run db:setup`.
- **Pengingat Telegram tidak muncul** → pastikan `TELEGRAM_BOT_TOKEN` terisi, server sudah di-restart, dan kamu sudah kirim `/start` ke bot.

## Catatan pengembangan lanjutan
Demo ini memilih peserta lewat dropdown (belum ada login) dan "real-time" memakai polling tiap 15 detik.
Untuk produksi: tambahkan autentikasi (mis. Supabase Auth), tabel hari libur nasional, dan push (WebSocket/FCM) di tempat polling.

---

## Pembuat & Hak Cipta

Dibuat oleh **[MRikoKuswoyo](https://github.com/MRikoKuswoyo)**.

**Hak Cipta © 2026 MRikoKuswoyo. Seluruh hak dilindungi.**
Dilarang menyalin, memodifikasi, atau mendistribusikan ulang proyek ini tanpa izin tertulis dari pembuatnya.
