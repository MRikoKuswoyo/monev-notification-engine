// Placeholder: {{nama}}, {{streak}}, {{deadline}} — pesan maks. 160 karakter
export const TEMPLATES = {
  attendance_in: [
    { title: "Selamat Pagi, Siap Absen?", message: "Halo {{nama}}! 👋 Sudah siap menjalani hari ini? Yuk catat kehadiranmu pagi ini di Monev MagangHub ✨", action_button: "Absen Sekarang" },
    { title: "Hari Baru, Semangat Baru!", message: "Pagi {{nama}}! ☀️ Jangan lupa absen masuk dulu ya sebelum mulai kerja. Have a productive day!", action_button: "Absen Masuk" },
    { title: "Yuk Mulai Harimu", message: "Halo {{nama}}, kehadiranmu pagi ini belum tercatat nih. 🚀 Absen dulu, 10 detik saja!", action_button: "Absen Sekarang" }
  ],
  attendance_out: [
    { title: "Hampir Waktunya Pulang!", message: "Satu langkah lagi menuju jam pulang, {{nama}}! 🚀 Yuk absen pulang sekarang biar kehadiranmu tercatat rapi.", action_button: "Absen Pulang" },
    { title: "Kerja Hebat Hari Ini!", message: "Terima kasih sudah berkontribusi hari ini, {{nama}}! 🙌 Jangan lupa absen pulang sebelum meninggalkan kantor.", action_button: "Absen Pulang" }
  ],
  logbook: [
    { title: "Ada Cerita Apa Hari Ini?", message: "{{nama}}, sempatkan 3 menit untuk mencatat aktivitas dan progresmu di logbook harian yuk! 📝", action_button: "Isi Logbook Sekarang" },
    { title: "Catat Progresmu Yuk", message: "Halo {{nama}}! ✍️ Apa yang kamu pelajari hari ini? Tulis di logbook sebelum lupa ya.", action_button: "Isi Logbook" },
    { title: "Logbook Menunggumu", message: "Hai {{nama}}, aktivitas hari ini belum dicatat. 📝 Cukup 3 menit, kok!", action_button: "Isi Logbook Sekarang" }
  ],
  gamification: [
    { title: "Streak {{streak}} Hari, Keren Banget!", message: "Mantap, {{nama}}! 🔥 Kamu sudah absen & mengisi logbook {{streak}} hari berturut-turut. Pertahankan terus, ya!", action_button: "Lihat Pencapaian" },
    { title: "Konsisten Itu Keren!", message: "{{nama}}, {{streak}} hari berturut-turut absen dan logbook lengkap! 🏆 Pertahankan performa hebatmu!", action_button: "Lihat Pencapaian" }
  ],
  urgent: [
    { title: "Pengingat Cepat!", message: "Yuk {{nama}}, masih ada waktu isi logbook hari ini sebelum berganti hari. ⏳ Jangan sampai terlewat ya!", action_button: "Isi Logbook Sekarang" },
    { title: "Sedikit Lagi Deadline", message: "Hai {{nama}}, logbook hari ini ditutup pukul 00.00 WIB. ⏳ Yuk selesaikan sekarang!", action_button: "Isi Logbook" }
  ]
};
