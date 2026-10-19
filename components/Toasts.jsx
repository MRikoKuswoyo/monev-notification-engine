"use client";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { CAT, TONE } from "./ui";

export default function Toasts({ toasts, onClose, onAction }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-3">
      <AnimatePresence>
        {toasts.map(t => {
          const meta = CAT[t.category] || CAT.logbook;
          const tone = TONE[meta.tone];
          const Icon = meta.icon;
          return (
            <motion.div key={t.key} layout
              initial={{ opacity: 0, x: 90, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 90, scale: 0.9 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className={`glass pointer-events-auto relative overflow-hidden border ${tone.border} p-4 shadow-2xl`}>
              <button onClick={() => onClose(t.key)} className="absolute right-2 top-2 rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"><X size={14} /></button>
              <div className="flex gap-3">
                <motion.div animate={{ rotate: [0, -12, 12, -8, 8, 0] }} transition={{ duration: 0.7, delay: 0.2 }}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone.bg} ${tone.text}`}><Icon size={20} /></motion.div>
                <div className="min-w-0 pr-4">
                  <p className="font-semibold text-white">{t.title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-300">{t.message}</p>
                  <button onClick={() => onAction(t)} className={`mt-3 rounded-lg ${tone.solid} px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 active:scale-95`}>{t.action_button}</button>
                </div>
              </div>
              <motion.div className={`absolute bottom-0 left-0 h-0.5 ${tone.bar}`} initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 9, ease: "linear" }} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
