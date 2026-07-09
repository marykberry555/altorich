"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type SocialEvent =
  | { type: "signup"; firstName: string; location: string }
  | { type: "invest"; firstName: string; location: string; amount: string }
  | { type: "withdraw"; firstName: string; location: string; amount: string };

const seed: SocialEvent[] = [
  { type: "signup", firstName: "Tola", location: "Lekki" },
  { type: "invest", firstName: "Chinedu", location: "Abuja", amount: "₦150,000" },
  { type: "withdraw", firstName: "Amina", location: "Kano", amount: "₦92,500" },
  { type: "invest", firstName: "Kemi", location: "Ibadan", amount: "₦500,000" },
  { type: "withdraw", firstName: "Seyi", location: "Surulere", amount: "₦210,000" }
];

function messageFor(ev: SocialEvent) {
  if (ev.type === "signup") return `${ev.firstName} from ${ev.location} just signed up`;
  if (ev.type === "invest") return `${ev.firstName} from ${ev.location} invested ${ev.amount}`;
  return `${ev.firstName} from ${ev.location} withdrew ${ev.amount}`;
}

export function SocialProofToasts({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  const current = useMemo(() => seed[idx % seed.length], [idx]);

  useEffect(() => {
    // First toast after 10s, then every 60s
    const show = () => {
      setVisible(true);
      window.setTimeout(() => setVisible(false), 8000);
    };

    const first = window.setTimeout(show, 10_000);
    const interval = window.setInterval(() => {
      setIdx((i) => i + 1);
      show();
    }, 60_000);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className={cn("pointer-events-none fixed bottom-6 left-4 right-4 z-[80] sm:left-6 sm:right-auto", className)}>
      <div
        className={cn(
          "pointer-events-auto max-w-md translate-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-lg)] opacity-0 transition-all duration-300",
          visible ? "translate-y-0 opacity-100" : ""
        )}
        role="status"
        aria-live="polite"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Live activity</p>
        <p className="mt-1 text-sm font-medium text-[var(--heading)]">{messageFor(current)}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">A few seconds ago</p>
      </div>
    </div>
  );
}

