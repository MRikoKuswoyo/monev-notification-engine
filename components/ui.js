// Util & konstanta tampilan bersama
import { LogIn, LogOut, NotebookPen, Trophy, Clock3 } from "lucide-react";
import { wib } from "@/lib/schedule";

export const pad = n => String(n).padStart(2, "0");
export const hhmm = min => `${pad(Math.floor(min / 60) % 24)}.${pad(min % 60)}`;
export const fmtTime = iso => (iso ? new Date(iso).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }) : "—");
export const fmtDate = d => d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const fmtShort = iso => new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const clockText = now => { const p = wib(now); return { h: pad(Math.floor(p.minutes / 60)), m: pad(p.minutes % 60), s: pad(p.seconds) }; };

export const greeting = now => { const h = Math.floor(wib(now).minutes / 60); return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam"; };

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export function nextOpenText(s) {
  if (s.workday && s.minutes < 480) return "hari ini pukul 08.00 WIB";
  for (let i = 1; i <= 7; i++) {
    const d = (s.weekday + i) % 7;
    if (d >= 1 && d <= 5) return `${i === 1 ? "besok" : DAYS[d]} pukul 08.00 WIB`;
  }
  return "Senin pukul 08.00 WIB";
}

export const TONE = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-400/40", solid: "bg-emerald-500", bar: "bg-emerald-400" },
  violet:  { bg: "bg-violet-500/15",  text: "text-violet-300",  border: "border-violet-400/40",  solid: "bg-violet-500",  bar: "bg-violet-400" },
  sky:     { bg: "bg-sky-500/15",     text: "text-sky-300",     border: "border-sky-400/40",     solid: "bg-sky-500",     bar: "bg-sky-400" },
  amber:   { bg: "bg-amber-500/15",   text: "text-amber-300",   border: "border-amber-400/40",   solid: "bg-amber-500",   bar: "bg-amber-400" },
  rose:    { bg: "bg-rose-500/15",    text: "text-rose-300",    border: "border-rose-400/40",    solid: "bg-rose-500",    bar: "bg-rose-400" }
};

export const CAT = {
  attendance_in:  { label: "Absen Masuk",  icon: LogIn,       tone: "emerald", target: "card-absen" },
  attendance_out: { label: "Absen Pulang", icon: LogOut,      tone: "violet",  target: "card-absen" },
  logbook:        { label: "Logbook",      icon: NotebookPen, tone: "sky",     target: "card-logbook" },
  gamification:   { label: "Pencapaian",   icon: Trophy,      tone: "amber",   target: "card-streak" },
  urgent:         { label: "Deadline",     icon: Clock3,      tone: "rose",    target: "card-logbook" }
};
