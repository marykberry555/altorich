import Link from "next/link";
import { Bell, Clock, TrendingUp, Wallet } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import type { TodaySummary } from "@/lib/member-experience/types";
import { cn } from "@/lib/utils";

type Props = {
  summary: TodaySummary;
  className?: string;
};

type StatProps = {
  label: string;
  value: string;
  href?: string;
  icon: React.ReactNode;
};

function Stat({ label, value, href, icon }: StatProps) {
  const inner = (
    <div className="flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:border-[var(--emerald)]/30 hover:bg-[var(--emerald)]/5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--gray-100)] text-[var(--emerald)] dark:bg-white/5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--text-subtle)]">{label}</p>
        <p className="mt-0.5 truncate text-base font-semibold tabular-nums text-[var(--heading)]">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="min-w-[140px] flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald)]">
        {inner}
      </Link>
    );
  }

  return <div className="min-w-[140px] flex-1">{inner}</div>;
}

export function TodaySummaryStrip({ summary, className }: Props) {
  return (
    <section className={cn("space-y-2", className)} aria-label="Today's summary">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Today</p>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {summary.todaysEarnings != null ? (
          <Stat
            label="Today's earnings"
            value={formatNaira(summary.todaysEarnings)}
            href="/portfolio"
            icon={<TrendingUp size={18} aria-hidden />}
          />
        ) : null}
        <Stat
          label="Portfolio"
          value={formatNaira(summary.portfolioValue)}
          href="/portfolio"
          icon={<TrendingUp size={18} aria-hidden />}
        />
        <Stat
          label="Wallet"
          value={formatNaira(summary.walletBalance)}
          href="/wallet"
          icon={<Wallet size={18} aria-hidden />}
        />
        {summary.pendingActions > 0 ? (
          <Stat
            label="Pending actions"
            value={String(summary.pendingActions)}
            href="/notifications"
            icon={<Clock size={18} aria-hidden />}
          />
        ) : null}
        {summary.unreadNotifications > 0 ? (
          <Stat
            label="Unread alerts"
            value={String(summary.unreadNotifications)}
            href="/notifications"
            icon={<Bell size={18} aria-hidden />}
          />
        ) : null}
      </div>
    </section>
  );
}
