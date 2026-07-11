"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SIGNUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type SocialEvent = {
  type: "signup" | "invest" | "withdraw";
  firstName: string;
  location: string;
  amount?: string;
  occurredAt: number;
};

function buildSeed(now: number): SocialEvent[] {
  return [
    { type: "signup", firstName: "Tola", location: "Lekki", occurredAt: now - 4 * 60 * 1000 },
    { type: "invest", firstName: "Chinedu", location: "Abuja", amount: "₦150,000", occurredAt: now - 18 * 60 * 1000 },
    { type: "withdraw", firstName: "Amina", location: "Kano", amount: "₦92,500", occurredAt: now - 42 * 60 * 1000 },
    { type: "invest", firstName: "Kemi", location: "Ibadan", amount: "₦500,000", occurredAt: now - 55 * 60 * 1000 },
    { type: "withdraw", firstName: "Seyi", location: "Surulere", amount: "₦210,000", occurredAt: now - 90 * 60 * 1000 },
    { type: "signup", firstName: "Ngozi", location: "Port Harcourt", occurredAt: now - 28 * 60 * 60 * 1000 }
  ];
}

function isEligible(ev: SocialEvent, now: number) {
  if (ev.type !== "signup") return true;
  return now - ev.occurredAt < SIGNUP_MAX_AGE_MS;
}

function messageFor(ev: SocialEvent) {
  if (ev.type === "signup") return `${ev.firstName} from ${ev.location} just signed up`;
  if (ev.type === "invest") return `${ev.firstName} from ${ev.location} invested ${ev.amount}`;
  return `${ev.firstName} from ${ev.location} withdrew ${ev.amount}`;
}

function timeAgo(ms: number, now: number) {
  const diffSec = Math.max(1, Math.floor((now - ms) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  return "Recently";
}

import { isAppRoute } from "@/lib/route-zones";

export function SocialProofToasts({ className }: { className?: string }) {
  const pathname = usePathname();
  const [mountedAt] = useState(() => Date.now());
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const events = useMemo(() => {
    return buildSeed(mountedAt).filter((ev) => isEligible(ev, now));
  }, [mountedAt, now]);

  const current = events.length > 0 ? events[idx % events.length] : null;

  useEffect(() => {
    if (events.length === 0) return;

    const tick = window.setInterval(() => setNow(Date.now()), 30_000);

    const show = () => {
      setNow(Date.now());
      setVisible(true);
      window.setTimeout(() => setVisible(false), 8000);
    };

    const first = window.setTimeout(show, 10_000);
    const interval = window.setInterval(() => {
      setIdx((i) => i + 1);
      show();
    }, 60_000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [events.length]);

  if (isAppRoute(pathname)) return null;
  if (!current) return null;

  return (
    <div className={cn("pointer-events-none fixed bottom-6 left-4 right-4 z-[80] sm:left-6 sm:right-auto", className)}>
      <div
        className={cn(
          "pointer-events-auto max-w-md translate-y-3 rounded-2xl border px-4 py-3 backdrop-blur-lg transition-all duration-300",
          "border-emerald-700/25 bg-white/72 shadow-[0_8px_28px_rgba(6,78,59,0.14)]",
          "dark:border-emerald-400/30 dark:bg-slate-950/72 dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)]",
          visible ? "translate-y-0 opacity-100" : "opacity-0"
        )}
        role="status"
        aria-live="polite"
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">Live activity</p>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50">{messageFor(current)}</p>
        <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{timeAgo(current.occurredAt, now)}</p>
      </div>
    </div>
  );
}
