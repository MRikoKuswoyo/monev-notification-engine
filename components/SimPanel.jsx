"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical, Play, RotateCcw } from "lucide-react";
import { wib } from "@/lib/schedule";
import { pad } from "./ui";

const toLocalInput = d => { const p = wib(d); return `${p.dayKey}T${pad(Math.floor(p.minutes / 60))}:${pad(p.minutes % 60)}`; };

export default function SimPanel({ sim, now, startSim, stopSim }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [speed, setSpeed] = useState(1);
  useEffect(() => { if (open && !value) setValue(toLocalInput(now)); }, [open]); // eslint-disable-line

  const setTime = hhmm => setValue(v => `${(v || toLocalInput(now)).slice(0, 10)}T${hhmm}`);
  const saturday = () => {
    const d = new Date(now); while (wib(d).weekday !== 6) d.setUTCDate(d.getUTCDate() + 1);
    setValue(`${wib(d).dayKey}T10:00`);
  };
  const run = () => startSim(`${value}:00+07:00`, speed);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="glass mb-3 w-80 p-4 text-sm shadow-2xl">
            <p className="font-semibold text-white">Mode Simulasi Waktu</p>
            <p className="mb-3 text-xs text-slate-400">Coba notifikasi di jam berbeda tanpa menunggu. Gunakan tanggal hari ini agar streak sesuai data contoh.</p>
            <input type="datetime-local" value={value} onChange={e => setValue(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-white [color-scheme:dark]" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["08:00", "12:00", "15:30", "16:30", "20:00", "23:00"].map(t => (
                <button key={t} onClick={() => setTime(t)} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs transition hover:bg-white/15">{t}</button>
              ))}
              <button onClick={saturday} className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-200 transition hover:bg-rose-500/20">Coba Sabtu</button>
            </div>
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))}
              className="mt-3 w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-white">
              <option value={1}>Kecepatan normal (1x)</option>
              <option value={60}>Cepat (1 detik = 1 menit)</option>
              <option value={300}>Sangat cepat (1 detik = 5 menit)</option>
            </select>
            <div className="mt-3 flex gap-2">
              <button onClick={run} disabled={!value} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2 font-semibold text-white transition hover:bg-indigo-400 active:scale-95 disabled:opacity-40"><Play size={14} /> Mulai</button>
              <button onClick={stopSim} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 transition hover:bg-white/10 active:scale-95"><RotateCcw size={14} /> Waktu nyata</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur transition ${sim.on ? "border-amber-400/50 bg-amber-500/20 text-amber-200" : "border-white/15 bg-slate-900/80 text-slate-200"}`}>
        <FlaskConical size={16} /> {sim.on ? `Simulasi aktif${sim.speed > 1 ? ` · ${sim.speed === 60 ? "60x" : "300x"}` : ""}` : "Mode Simulasi"}
      </motion.button>
    </div>
  );
}
