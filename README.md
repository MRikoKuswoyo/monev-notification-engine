# Monev MagangHub

Sistem monitoring absen & logbook peserta MagangHub dengan **notifikasi real-time** yang mengikuti
**jadwal MagangHub: Senin–Jumat, 08.00 – 00.00 WIB**.

**Stack:** Next.js 14 (App Router) · MySQL (Laragon) · Tailwind CSS · Framer Motion · canvas-confetti

## Cara menjalankan (Laragon)

1. **Nyalakan Laragon** → klik **Start All** (yang wajib hanya **MySQL**).
2. Ekstrak zip, buka foldernya di **VS Code**, lalu buka terminal (Ctrl + `).
3. Pasang dependensi:
   ```bash
   npm install
   ```
4. File `.env.local` sudah berisi pengaturan default Laragon (user `root`, password kosong).
   Sesuaikan jika MySQL-mu berbeda (lihat `.env.example`).
5. Buat database, tabel, dan data contoh:
   ```bash
   npm run db:setup
   ```
   (Ingin mengulang dari awal? `npm run db:fresh`)
6. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
7. Buka **http://localhost:3000**

> Alternatif tanpa skrip: impor `database/schema.sql` lewat HeidiSQL / phpMyAdmin Laragon.
> Tetap jalankan `npm run db:setup` bila ingin data contoh.

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

Setiap kategori hanya dikirim **sekali per peserta per hari** (dijamin oleh `UNIQUE` di tabel `notifications`).
Streak dihitung per **hari kerja** berturut-turut (Sabtu–Minggu tidak memutus streak).

## Mode Simulasi (tombol di kiri bawah)
Untuk demo tanpa menunggu jam kerja: pilih tanggal/jam, kecepatan (hingga 1 detik = 5 menit), lalu **Mulai**.
Tombol **Coba Sabtu** menunjukkan kondisi di luar jadwal. Pakai tanggal hari ini agar streak sesuai data contoh.

Skenario cepat (peserta **Riko**, tanggal hari ini):
1. Simulasi 08:00 → notifikasi *Absen Masuk* muncul → klik **Absen Masuk** 🎉
2. Simulasi 15:30 → notifikasi *Logbook* → isi & simpan logbook → streak naik jadi 5 → notifikasi *Pencapaian* + konfeti 🏆
3. Pilih **Dewi**, simulasi 23:10 → notifikasi *Deadline*

## Pengingat Telegram (supaya tidak lupa absen)
Pengingat dikirim ke HP lewat bot Telegram, **walau tab web ditutup**. Bot ikut hidup otomatis bersama `npm run dev`
(lewat `instrumentation.js`), tanpa proses tambahan. Syaratnya: laptop menyala & `npm run dev` berjalan.

**Setup (sekali saja)**
1. Di Telegram, chat **@BotFather** → `/newbot` → ikuti langkahnya → salin **token**.
2. Isi `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC...
   MONEV_USER_NAME=Riko          # nama peserta di tabel users
   REMINDER_NAG_MINUTES=10       # diulang tiap berapa menit sampai kamu konfirmasi
   ```
3. Restart `npm run dev`. Di terminal muncul `[pengingat] aktif sebagai @namabot`.
4. Buka bot-mu di Telegram → kirim **/start**. Selesai.

**Cara kerja**
- Jadwal & aturan sama seperti tabel di atas (Senin–Jumat). Pengingat absen masuk/pulang, logbook, dan deadline
  **diulang tiap 10 menit** selama belum ada konfirmasi.
- Tiap pesan punya tombol **✅ Sudah …** (menghentikan pengingat) dan **⏰ Ingatkan lagi 30 menit**.
- Absen di situs asli MagangHub tidak bisa dibaca sistem ini, jadi tekan ✅ setelah kamu absen di sana.
- `/status` di bot menampilkan kondisi hari ini. Lonceng di web tetap berfungsi.
- Chat pertama yang `/start` akan terkunci ke peserta itu. Untuk memindahkan:
  `UPDATE users SET telegram_chat_id = NULL WHERE name = 'Riko';`
- Ubah jam pengingat di `lib/schedule.js` (`attendanceIn`, `attendanceOut`, `logbook`).

## Struktur
```
app/                 halaman (/, /monitor) + API routes (/api/*)
components/          Dashboard, Toasts, Timeline, SimPanel, useClock
lib/schedule.js      jadwal Senin–Jumat 08.00–00.00 + helper zona WIB
lib/engine.js        logika pemilihan notifikasi
lib/templates.js     template pesan Bahasa Indonesia
lib/telegram.js      klien Bot API Telegram
lib/reminder.js      pengirim pengingat + perintah/tombol bot
lib/policy.js        aturan ulang kirim & tombol (diuji)
instrumentation.js   menyalakan pengingat saat server start
lib/service.js       query database, streak, simpan notifikasi
database/schema.sql  skema MySQL
scripts/setup-db.js  buat DB + tabel + seed
```

## Tabel database
`users` · `attendances` · `logbooks` · `notifications` (waktu disimpan UTC, `work_date` = tanggal kerja WIB)

## API
`GET /api/users` · `GET /api/status?userId=` · `POST /api/attendance` `{userId,type:"in"|"out"}` ·
`POST /api/logbook` `{userId,content}` · `GET /api/notifications?userId=` · `POST /api/notifications/read` · `GET /api/monitor`
Semua endpoint menerima `now` (ISO) opsional untuk simulasi waktu.

## Troubleshooting
- **`ECONNREFUSED`** → MySQL Laragon belum menyala (Start All).
- **`Access denied`** → samakan `DB_USER` / `DB_PASSWORD` di `.env.local` dengan MySQL-mu.
- **Port bentrok 3000** → `npx next dev -p 3001`.
- Halaman menampilkan "Database belum siap" → jalankan `npm run db:setup`.

## Catatan pengembangan lanjutan
Demo ini memilih peserta lewat dropdown (belum ada login) dan "real-time" memakai polling tiap 15 detik.
Untuk produksi: tambahkan autentikasi, tabel hari libur nasional, dan push (WebSocket/FCM) di tempat polling.
