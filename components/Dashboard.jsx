"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Bell, Flame, LogIn, LogOut, NotebookPen, Radio, Moon, CheckCircle2 } from "lucide-react";
import { useClock } from "./useClock";
import Toasts from "./Toasts";
import Timeline from "./Timeline";
import SimPanel from "./SimPanel";
import { CAT, TONE, clockText, fmtDate, fmtShort, fmtTime, greeting, nextOpenText } from "./ui";
import { STREAK_MILESTONES } from "@/lib/engine";

const boom = (o = {}) => confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, ...o });
const bigBoom = () => {
  boom({ particleCount: 160, spread: 110 });
  setTimeout(() => boom({ particleCount: 90, angle: 60, spread: 60, origin: { x: 0, y: 0.8 } }), 200);
  setTimeout(() => boom({ particleCount: 90, angle: 120, spread: 60, origin: { x: 1, y: 0.8 } }), 350);
};

export default function Dashboard() {
  const { mounted, now, sim, startSim, stopSim, apiNow } = useClock();
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState(null);
  const [notifs, setNotifs] = useState({ list: [], unread: 0 });
  const [toasts, setToasts] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fatal, setFatal] = useState("");
  const [logText, setLogText] = useState("");
  const [flash, setFlash] = useState("");
  const dirty = useRef(false);
  const prevStreak = useRef(null);

  const qs = () => { const n = apiNow(); return n ? `&now=${encodeURIComponent(n)}` : ""; };

  const loadStatus = useCallback(async id => {
    if (!id) return;
    const r = await fetch(`/api/status?userId=${id}${qs()}`, { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setStatus(d);
    if (d.logbook && !dirty.current) setLogText(d.logbook.content);
  }, []); // eslint-disable-line

  const pushToast = useCallback(n => {
    const key = `${n.id}-${Date.now()}`;
    setToasts(t => [...t, { ...n, key }]);
    setTimeout(() => setToasts(t => t.filter(x => x.key !== key)), 9000);
    if (n.category === "gamification") bigBoom();
    try { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(n.title, { body: n.message }); } catch {}
  }, []);

  const poll = useCallback(async id => {
    if (!id) return;
    const r = await fetch(`/api/notifications?userId=${id}${qs()}`, { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setNotifs({ list: d.list, unread: d.unread });
    if (d.fresh) pushToast(d.fresh);
  }, [pushToast]); // eslint-disable-line

  // daftar peserta
  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(d => {
      if (!d.users) throw new Error();
      setUsers(d.users);
      const saved = Number(localStorage.getItem("monev_user"));
      setUserId(d.users.find(u => u.id === saved)?.id ?? d.users[0]?.id ?? null);
    }).catch(() => setFatal("Database belum siap. Pastikan MySQL Laragon menyala, lalu jalankan: npm run db:setup"));
  }, []);

  // ganti peserta / mode simulasi berubah -> muat ulang
  useEffect(() => {
    if (!userId) return;
    dirty.current = false; prevStreak.current = null; setLogText(""); setError("");
    localStorage.setItem("monev_user", String(userId));
    loadStatus(userId); poll(userId);
  }, [userId, sim.on, sim.base, sim.speed]); // eslint-disable-line

  // polling "real-time"
  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => { loadStatus(userId); poll(userId); }, sim.on && sim.speed > 1 ? 3000 : 15000);
    return () => clearInterval(id);
  }, [userId, sim.on, sim.speed, loadStatus, poll]);

  // efek saat streak naik
  useEffect(() => {
    if (!status) return;
    if (prevStreak.current !== null && status.streak > prevStreak.current) boom({ colors: ["#f59e0b", "#ef4444", "#fb923c"] });
    prevStreak.current = status.streak;
  }, [status?.streak]); // eslint-disable-line

  const act = async (url, body, onOk) => {
    setBusy(true); setError("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, ...body, now: apiNow() }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Terjadi kesalahan"); return; }
      setStatus(d); onOk?.(d); dirty.current = false;
      await poll(userId);
    } finally { setBusy(false); }
  };

  const goTo = t => {
    setToasts(x => x.filter(y => y.key !== t.key));
    const target = (CAT[t.category] || CAT.logbook).target;
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(target); setTimeout(() => setFlash(""), 1800);
  };

  const openBell = async () => {
    setBellOpen(o => !o);
    if (!bellOpen && notifs.unread > 0) {
      await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      setTimeout(() => setNotifs(n => ({ list: n.list.map(x => ({ ...x, isRead: true })), unread: 0 })), 1200);
    }
  };

  const askBrowserNotif = () => { try { Notification.requestPermission(); } catch {} };

  if (fatal) return <div className="glass mx-auto mt-16 max-w-lg p-8 text-center"><p className="text-lg font-semibold text-white">Oops 😅</p><p className="mt-2 text-slate-300">{fatal}</p></div>;
  if (!mounted || !status) return <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="glass shimmer h-48" />)}</div>;

  const s = status.schedule;
  const { h, m, s: sec } = clockText(now);
  const checkedIn = !!status.attendance.checkIn, checkedOut = !!status.attendance.checkOut;
  const todayDone = checkedIn && !!status.logbook;
  const nextMilestone = STREAK_MILESTONES.find(x => x > status.streak);

  return (
    <div className="space-y-5">
      <Toasts toasts={toasts} onClose={k => setToasts(t => t.filter(x => x.key !== k))} onAction={goTo} />

      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass relative z-30 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-slate-400">{greeting(now)},</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">{status.user.name} <motion.span className="inline-block origin-[70%_70%]" animate={{ rotate: [0, 18, -8, 18, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3 }}>👋</motion.span></h1>
            <p className="text-sm text-slate-400">{status.user.division} · {fmtDate(now)}</p>
          </div>

          <div className="flex items-center gap-3">
            <select value={userId} onChange={e => setUserId(Number(e.target.value))}
              className="rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white">
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <div className="relative">
              <motion.button whileTap={{ scale: 0.9 }} onClick={openBell} className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 transition hover:bg-white/10">
                <motion.span animate={notifs.unread ? { rotate: [0, -15, 15, -10, 10, 0] } : {}} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5 }}><Bell size={18} /></motion.span>
                <AnimatePresence>{notifs.unread > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{notifs.unread}</motion.span>
                )}</AnimatePresence>
              </motion.button>
              <AnimatePresence>{bellOpen && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="glass absolute right-0 top-12 z-50 w-80 max-w-[85vw] overflow-hidden p-2 shadow-2xl">
                  <p className="px-3 py-2 text-sm font-semibold text-white">Notifikasi</p>
                  <div className="max-h-72 overflow-auto">
                    {notifs.list.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-400">Belum ada notifikasi.</p>}
                    {notifs.list.map(n => { const meta = CAT[n.category] || CAT.logbook; const Icon = meta.icon; return (
                      <div key={n.id} className="flex gap-3 rounded-xl px-3 py-2 transition hover:bg-white/5">
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TONE[meta.tone].bg} ${TONE[meta.tone].text}`}><Icon size={15} /></span>
                        <div className="min-w-0"><p className="text-sm font-medium text-white">{n.title}</p><p className="text-xs text-slate-400">{n.message}</p><p className="mt-0.5 text-[10px] text-slate-500">{fmtShort(n.createdAt)}</p></div>
                      </div>); })}
                  </div>
                  {typeof Notification !== "undefined" && Notification.permission === "default" &&
                    <button onClick={askBrowserNotif} className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-xs text-indigo-200 transition hover:bg-white/10">Aktifkan notifikasi browser</button>}
                </motion.div>
              )}</AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-baseline gap-1 font-mono text-6xl font-bold tracking-tight text-white md:text-7xl">
            {h}<span className="blink text-indigo-300">:</span>{m}<span className="ml-2 text-2xl text-slate-500">{sec}</span><span className="ml-2 text-sm font-sans font-medium text-slate-400">WIB</span>
          </div>
          <motion.div key={s.active ? "on" : "off"} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${s.active ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300" : "border-slate-500/40 bg-slate-500/10 text-slate-300"}`}>
            {s.active ? <><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span><Radio size={15} /> Sistem aktif · Senin–Jumat 08.00–00.00</>
              : <><Moon size={15} /> Di luar jadwal · buka lagi {nextOpenText(s)}</>}
          </motion.div>
        </div>
        <Timeline minutes={s.minutes} active={s.active} />
      </motion.section>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Absensi */}
        <motion.section id="card-absen" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`glass p-6 ${flash === "card-absen" ? "flash" : ""}`}>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Absensi Hari Ini</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${checkedOut ? "bg-violet-500/20 text-violet-300" : checkedIn ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{checkedOut ? "Selesai" : checkedIn ? "Hadir" : "Belum absen"}</span></div>
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            <div className="rounded-xl bg-white/5 p-3"><p className="text-slate-400">Masuk</p><p className="text-2xl font-bold text-white">{fmtTime(status.attendance.checkIn)}</p></div>
            <div className="rounded-xl bg-white/5 p-3"><p className="text-slate-400">Pulang</p><p className="text-2xl font-bold text-white">{fmtTime(status.attendance.checkOut)}</p></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.94 }} disabled={busy || checkedIn || !s.active}
              onClick={() => act("/api/attendance", { type: "in" }, () => boom())}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"><LogIn size={18} /> Absen Masuk</motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.94 }} disabled={busy || !checkedIn || checkedOut || !s.active}
              onClick={() => act("/api/attendance", { type: "out" }, () => boom({ colors: ["#a78bfa", "#818cf8", "#e879f9"] }))}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/20 transition disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"><LogOut size={18} /> Absen Pulang</motion.button>
          </div>
          <AnimatePresence>{error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</motion.p>}</AnimatePresence>
        </motion.section>

        {/* Streak */}
        <motion.section id="card-streak" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`glass p-6 ${flash === "card-streak" ? "flash" : ""}`}>
          <h2 className="mb-2 text-lg font-semibold text-white">Streak Kehadiran</h2>
          <div className="flex items-center gap-4">
            <Flame size={64} className={`${status.streak > 0 ? "animate-flame text-orange-400 drop-shadow-[0_0_18px_rgba(251,146,60,.7)]" : "text-slate-600"}`} />
            <div>
              <AnimatePresence mode="popLayout"><motion.span key={status.streak} initial={{ scale: 2, opacity: 0, y: -10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="block text-6xl font-extrabold leading-none text-white">{status.streak}</motion.span></AnimatePresence>
              <p className="text-sm text-slate-400">hari kerja berturut-turut</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2">
            {STREAK_MILESTONES.map(x => (
              <motion.div key={x} animate={status.streak >= x ? { scale: [1, 1.2, 1] } : {}} className={`flex-1 rounded-xl border px-2 py-2 text-center text-xs font-semibold ${status.streak >= x ? "border-amber-400/50 bg-amber-500/20 text-amber-200" : "border-white/10 bg-white/5 text-slate-400"}`}>
                {status.streak >= x ? "🏆" : "🔒"} {x} hari</motion.div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-300">
            {todayDone ? <span className="inline-flex items-center gap-1.5 text-emerald-300"><CheckCircle2 size={15} /> Hari ini sudah lengkap!</span> : "Absen masuk + isi logbook hari ini untuk menambah streak."}
            {nextMilestone && <span className="text-slate-400"> Target berikutnya: {nextMilestone} hari.</span>}
          </p>
        </motion.section>
      </div>

      {/* Logbook */}
      <motion.section id="card-logbook" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`glass p-6 ${flash === "card-logbook" ? "flash" : ""}`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><NotebookPen size={18} className="text-sky-300" /> Logbook Harian</h2>
          {status.logbook && <span className="flex items-center gap-1 text-xs text-emerald-300"><CheckCircle2 size={14} /> Tersimpan {fmtTime(status.logbook.createdAt)}</span>}
        </div>
        <textarea value={logText} onChange={e => { dirty.current = true; setLogText(e.target.value); }} rows={4} maxLength={2000} disabled={!s.active}
          placeholder={s.active ? "Ceritakan aktivitas, progres, dan hal yang kamu pelajari hari ini…" : "Logbook bisa diisi Senin–Jumat, 08.00–00.00 WIB."}
          className="w-full resize-none rounded-xl border border-white/15 bg-slate-900/70 p-4 text-slate-100 transition placeholder:text-slate-500 focus:border-sky-400/60 focus:ring-4 focus:ring-sky-400/10 disabled:opacity-50" />
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-xs ${logText.trim().length >= 10 ? "text-slate-400" : "text-amber-300"}`}>{logText.length}/2000 · minimal 10 karakter</span>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} disabled={busy || !s.active || logText.trim().length < 10}
            onClick={() => act("/api/logbook", { content: logText }, () => bigBoom())}
            className="rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-sky-500/20 transition disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none">
            {status.logbook ? "Perbarui Logbook" : "Simpan Logbook"}</motion.button>
        </div>
      </motion.section>

      <SimPanel sim={sim} now={now} startSim={startSim} stopSim={stopSim} />
    </div>
  );
}
