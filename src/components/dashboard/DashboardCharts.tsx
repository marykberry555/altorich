"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartEmptyPlaceholder } from "@/components/dashboard/ChartEmptyPlaceholder";
import { Card } from "@/components/ui/Card";
import { accentBar, type StatAccent } from "@/components/design-system/accent";
import { cn } from "@/lib/utils";
import { formatNaira, NAIRA_SYMBOL } from "@/lib/domain";
import type { AllocationPoint, ChartPoint } from "@/lib/dashboard/chart-data";

const PIE_COLORS = ["#047857", "#1e3a5f", "#b8860b", "#0ea5e9"];

function ChartShell({
  title,
  children,
  emptyTitle,
  hasData,
  href,
  viewLabel = "Explore",
  accent = "emerald"
}: {
  title: string;
  children: React.ReactNode;
  emptyTitle: string;
  hasData: boolean;
  href?: string;
  viewLabel?: string;
  accent?: StatAccent;
}) {
  const inner = (
    <Card variant="elevated" padding="none" className={cn("relative overflow-hidden", href && "transition hover:shadow-[var(--shadow-md)]")}>
      <div className={cn("h-1 w-full bg-gradient-to-r", accentBar(accent))} aria-hidden />
      <div className="px-5 pb-2 pt-5">
        <h3 className="text-base font-semibold text-[var(--heading)]">{title}</h3>
      </div>
      <div className="h-56 px-2 pb-4">
        {!hasData ? <ChartEmptyPlaceholder /> : children}
      </div>
      {href ? (
        <div className="border-t border-[var(--border)] bg-[var(--gray-50)]/60 px-5 py-2.5 text-xs font-medium text-[var(--emerald)]">
          {viewLabel} →
        </div>
      ) : null}
    </Card>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export function BalanceHistoryChart({ data, href }: { data: ChartPoint[]; href?: string }) {
  return (
    <ChartShell title="Balance activity" emptyTitle="No balance history yet" hasData={data.length > 0} href={href} viewLabel="Open wallet" accent="emerald">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#047857" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#047857" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-subtle)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-subtle)" tickFormatter={(v) => `${NAIRA_SYMBOL}${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatNaira(Number(v ?? 0))} />
          <Area type="monotone" dataKey="value" stroke="#047857" fill="url(#balanceFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function EarningsTrendChart({ data, href }: { data: ChartPoint[]; href?: string }) {
  return (
    <ChartShell title="Settlement earnings" emptyTitle="No settlements yet" hasData={data.length > 0} href={href} viewLabel="View portfolio" accent="gold">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-subtle)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-subtle)" />
          <Tooltip formatter={(v) => formatNaira(Number(v ?? 0))} />
          <Bar dataKey="value" fill="#b8860b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function AllocationChart({ data, href, title = "Allocation" }: { data: AllocationPoint[]; href?: string; title?: string }) {
  return (
    <ChartShell title={title} emptyTitle="No allocation data" hasData={data.length > 0} href={href} viewLabel="View portfolio" accent="navy">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatNaira(Number(v ?? 0))} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmptyPlaceholder />
      )}
    </ChartShell>
  );
}
