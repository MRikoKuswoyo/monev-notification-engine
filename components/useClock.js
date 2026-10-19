"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "monev_sim";
const OFF = { on: false, base: 0, start: 0, speed: 1 };

/** Jam aplikasi: waktu nyata, atau waktu simulasi (bisa dipercepat) untuk demo di luar jam kerja */
export function useClock() {
  const [sim, setSim] = useState(OFF);
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);
  const ref = useRef(OFF);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s?.on) { ref.current = s; setSim(s); } } catch {}
    setMounted(true);
    const id = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const getNow = useCallback(() => {
    const s = ref.current;
    return s.on ? new Date(s.base + (Date.now() - s.start) * s.speed) : new Date();
  }, []);
  const apiNow = useCallback(() => (ref.current.on ? getNow().toISOString() : null), [getNow]);
  const update = useCallback(next => { ref.current = next; setSim(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {} }, []);
  const startSim = useCallback((iso, speed) => update({ on: true, base: new Date(iso).getTime(), start: Date.now(), speed }), [update]);
  const stopSim = useCallback(() => update(OFF), [update]);

  return { mounted, now: getNow(), sim, startSim, stopSim, getNow, apiNow };
}
