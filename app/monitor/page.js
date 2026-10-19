"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, NotebookPen, Flame } from "lucide-react";
import { useClock } from "@/components/useClock";
import { fmtTime, nextOpenText } from "@/components/ui";

export default function Monitor() {
  const { mounted, sim, apiNow } = useClock();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!mounted) return;
    const load = async () => {
      try {
        const n = apiNow();
        const r = await fetch(`/api/monitor${n ? `?now=${encodeURIComponent(n)}` : ""}`, { cache: "no-store" });
        const d = await r.json(); if (!d.rows) throw new Error(); setData(d); setErr("");
      } catch { setErr("Database belum siap. Jalankan: npm run db:setup"); }
    };
    load();
    const id = setInterval(load, sim.on && sim.speed > 1 ? 3000 : 8000);
    return () => clearInterval(id);
  }, [mounted, sim.on, sim.base, sim.speed]); // eslint-disable-line

  if (err) return <div className="glass mx-auto mt-16 max-w-lg p-8 text-center text-slate-300">{err}</div>;
  if (!data) return <div className="glass shimmer h-64" />;

  const rows = data.rows, active = data.schedule.active;
  const hadir = rows.filter(r => r.checkIn).length, log = rows.filter(r => r.logbook).length;
  const avg = rows.length ? (rows.reduce((a, r) => a + r.streak, 0) / rows.length).toFixed(1) : 0;
  const status = r => r.checkOut && r.logbook ? ["Lengkap", "bg-emerald-500/20 text-emerald-300"] : r.checkIn ? ["Bekerja", "bg-sky-500/20 text-sky-300"] : active ? ["Belum absen", "bg-amber-500/20 text-amber-300"] : ["—", "bg-slate-500/20 text-slate-300"];

  const cards = [
    { icon: Users, label: "Hadir hari ini", val: `${hadir}/${rows.length}`, pct: rows.length ? hadir / rows.length : 0, c: "from-emerald-500 to-teal-400" },
    { icon: NotebookPen, label: "Logbook terisi", val: `${log}/${rows.length}`, pct: rows.length ? log / rows.length : 0, c: "from-sky-500 to-indigo-400" },
    { icon: Flame, label: "Rata-rata streak", val: `${avg} hari`, pct: Math.min(1, avg / 10), c: "from-orange-500 to-amber-400" }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-2xl font-bold text-white">Monitoring Peserta</h1>
          <p className="text-sm text-slate-400">{active ? "Sistem aktif — data diperbarui otomatis." : `Di luar jadwal — buka lagi ${nextOpenText(data.schedule)}.`}</p></div>
        {sim.on && <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs text-amber-200">Mode simulasi aktif</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }} className="glass p-5">
            <div className="flex items-center gap-2 text-sm text-slate-400"><c.icon size={16} /> {c.label}</div>
            <p className="mt-1 text-3xl font-bold text-white">{c.val}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><motion.div className={`h-full rounded-full bg-gradient-to-r ${c.c}`} initial={{ width: 0 }} animate={{ width: `${c.pct * 100}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }} /></div>
          </motion.div>
        ))}
      </div>

      <div className="glass overflow-x-auto p-2">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-400"><tr>{["Peserta", "Masuk", "Pulang", "Logbook", "Streak", "Status"].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => { const [label, cls] = status(r); return (
              <motion.tr key={r.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="border-t border-white/5 transition hover:bg-white/5">
                <td className="px-4 py-3"><p className="font-medium text-white">{r.name}</p><p className="text-xs text-slate-400">{r.division}</p></td>
                <td className="px-4 py-3 text-slate-200">{fmtTime(r.checkIn)}</td>
                <td className="px-4 py-3 text-slate-200">{fmtTime(r.checkOut)}</td>
                <td className="px-4 py-3">{r.logbook ? <span className="text-emerald-300">✓ Terisi</span> : <span className="text-slate-500">Belum</span>}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-orange-300"><Flame size={14} /> {r.streak}</span></td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span></td>
              </motion.tr>); })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
