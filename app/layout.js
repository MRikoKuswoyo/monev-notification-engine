import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Monev MagangHub", description: "Monitoring absen & logbook peserta MagangHub" };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans antialiased">
        <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
          <div className="absolute inset-0 dotgrid" />
          <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl animate-blob" />
          <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/20 blur-3xl animate-blob" style={{ animationDelay: "-7s" }} />
          <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl animate-blob" style={{ animationDelay: "-13s" }} />
        </div>
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30">M</span>
            Monev <span className="text-indigo-300">MagangHub</span>
          </Link>
          <nav className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm backdrop-blur">
            <Link href="/" className="rounded-full px-4 py-1.5 text-slate-200 transition hover:bg-white/10">Dashboard</Link>
            <Link href="/monitor" className="rounded-full px-4 py-1.5 text-slate-200 transition hover:bg-white/10">Monitor</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">{children}</main>
      </body>
    </html>
  );
}
