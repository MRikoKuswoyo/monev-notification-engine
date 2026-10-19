// Next.js menjalankan register() sekali saat server menyala -> pengingat Telegram ikut hidup bersama `npm run dev`.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startReminders } = await import("./lib/reminder");
    startReminders();
  }
}
