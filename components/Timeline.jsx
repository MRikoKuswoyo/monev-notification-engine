"use client";
import { motion } from "framer-motion";
import { SCHEDULE } from "@/lib/schedule";
import { hhmm } from "./ui";

const MARKS = [
  { m: 480, l: "Absen masuk" }, { m: 930, l: "Logbook" }, { m: 990, l: "Absen pulang" },
  { m: 1200, l: "Logbook" }, { m: 1380, l: "Deadline −1 jam" }
];
const span = SCHEDULE.close - SCHEDULE.open;
const pct = m => Math.max(0, Math.min(100, ((m - SCHEDULE.open) / span) * 100));

export default function Timeline({ minutes, active }) {
  const now = active ? pct(minutes) : 0;
  return (
    <div className="relative mx-8 mt-2 h-24 select-none">
      <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" />
      <motion.div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-400"
        animate={{ width: `${now}%` }} transition={{ type: "spring", stiffness: 60, damping: 18 }} />
      {active && (
        <motion.div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" animate={{ left: `${now}%` }} transition={{ type: "spring", stiffness: 60, damping: 18 }}>
          <span className="absolute -inset-2 animate-ping rounded-full bg-fuchsia-400/50" />
          <span className="relative block h-4 w-4 rounded-full border-2 border-white bg-fuchsia-500 shadow-lg shadow-fuchsia-500/50" />
        </motion.div>
      )}
      {MARKS.map((k, i) => {
        const done = active && minutes >= k.m;
        const up = i % 2 === 0;
        return (
          <div key={k.m} className="absolute top-1/2" style={{ left: `${pct(k.m)}%` }}>
            <div className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors duration-500 ${done ? "h-3 w-3 border-emerald-300 bg-emerald-400" : "h-3 w-3 border-slate-500 bg-slate-800"}`} />
            <div className={`absolute w-24 -translate-x-1/2 text-center text-[10px] leading-tight ${up ? "bottom-3" : "top-3"} ${done ? "text-emerald-300" : "text-slate-400"}`}>
              <b className="block text-[11px]">{hhmm(k.m)}</b>{k.l}
            </div>
          </div>
        );
      })}
      <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 text-[10px] text-slate-400">
        <div className="absolute -translate-x-1/2 top-3 w-20 text-center"><b className="block text-[11px]">00.00</b>Tutup</div>
      </div>
    </div>
  );
}
