"use client";

import { createContext, useContext, useEffect, useState } from "react";

const LiveNowContext = createContext<Date | null>(null);

export function LiveNowProvider({ children, intervalMs = 1000 }: { children: React.ReactNode; intervalMs?: number }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return <LiveNowContext.Provider value={now}>{children}</LiveNowContext.Provider>;
}

export function useLiveNow() {
  const ctx = useContext(LiveNowContext);
  return ctx ?? new Date();
}
