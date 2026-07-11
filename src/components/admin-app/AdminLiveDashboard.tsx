"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownLeft, ArrowUpRight, LogIn, TrendingUp, Users, Wallet } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { adminAppPath } from "@/lib/admin-app/constants";
import { MetricStatCard } from "@/components/design-system";

type LiveMetrics = {
  onlineMembers: number;
  newLoginsToday: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  investmentsToday: number;
  investmentsTodayAmount: number;
  revenueToday: number;
  payoutsToday: number;
};

type ActivityRow = {
  id: string;
  member_name: string;
  city: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  created_at: string;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

export function AdminLiveDashboard() {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const [metricsRes, activityRes, notificationsRes] = await Promise.all([
        fetch("/api/admin/live-metrics", { cache: "no-store" }),
        fetch("/api/admin/login-activity?limit=8", { cache: "no-store" }),
        fetch("/api/admin/notifications?limit=8", { cache: "no-store" })
      ]);

      if (cancelled) return;
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());
      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        setNotifications(data.items ?? []);
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard
          title="Online members"
          value={String(metrics?.onlineMembers ?? "—")}
          accent="emerald"
          icon={<Users size={16} aria-hidden />}
          href={adminAppPath("/members")}
        />
        <MetricStatCard
          title="New logins today"
          value={String(metrics?.newLoginsToday ?? "—")}
          accent="sky"
          icon={<LogIn size={16} aria-hidden />}
          href={adminAppPath("/activity")}
        />
        <MetricStatCard
          title="Pending deposits"
          value={formatNaira(metrics?.pendingDeposits ?? 0)}
          accent="amber"
          icon={<ArrowDownLeft size={16} aria-hidden />}
          href={adminAppPath("/deposits")}
        />
        <MetricStatCard
          title="Pending withdrawals"
          value={String(metrics?.pendingWithdrawals ?? "—")}
          accent="gold"
          icon={<ArrowUpRight size={16} aria-hidden />}
          href={adminAppPath("/payouts")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard
          title="Investments today"
          value={String(metrics?.investmentsToday ?? "—")}
          accent="navy"
          icon={<TrendingUp size={16} aria-hidden />}
          href={adminAppPath("/investments")}
        />
        <MetricStatCard
          title="Investment volume today"
          value={formatNaira(metrics?.investmentsTodayAmount ?? 0)}
          accent="emerald"
          icon={<Wallet size={16} aria-hidden />}
          href={adminAppPath("/investments")}
        />
        <MetricStatCard
          title="Revenue today"
          value={formatNaira(metrics?.revenueToday ?? 0)}
          accent="sky"
          icon={<Activity size={16} aria-hidden />}
          href={adminAppPath("/settlements")}
        />
        <MetricStatCard
          title="Payouts today"
          value={formatNaira(metrics?.payoutsToday ?? 0)}
          accent="amber"
          icon={<ArrowUpRight size={16} aria-hidden />}
          href={adminAppPath("/payouts")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent logins</h2>
            <Link href={adminAppPath("/activity")} className="text-xs text-emerald-400 hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {activity.length === 0 ? (
              <li className="text-sm text-zinc-400">No login activity yet</li>
            ) : (
              activity.map((row) => (
                <li key={row.id} className="rounded-lg border border-white/5 px-3 py-2">
                  <p className="text-sm font-medium text-white">{row.member_name}</p>
                  <p className="text-xs text-zinc-400">
                    {[row.city, row.country].filter(Boolean).join(", ") || "Location unavailable"} · {row.device_type} ·{" "}
                    {row.browser} / {row.operating_system}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-500">{new Date(row.created_at).toLocaleString("en-NG")}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent activity</h2>
            <Link href={adminAppPath("/notifications")} className="text-xs text-emerald-400 hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {notifications.length === 0 ? (
              <li className="text-sm text-zinc-400">No operational events yet</li>
            ) : (
              notifications.map((item) => (
                <li key={item.id} className="rounded-lg border border-white/5 px-3 py-2">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-zinc-400">{item.body}</p>
                  <p className="mt-1 text-[10px] text-zinc-500">{new Date(item.created_at).toLocaleString("en-NG")}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
