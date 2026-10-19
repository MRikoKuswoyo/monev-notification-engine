// Dijalankan sekali saat server menyala. Di Vercel (serverless) polling Telegram TIDAK dijalankan,
// supaya tidak bentrok dengan polling di laptop (error konflik getUpdates).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.VERCEL) {
    const { startReminders } = await import("./lib/reminder");
    startReminders();
  }
}
