"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownLeft, ArrowUpRight, LogIn, TrendingUp, Users, Wallet } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { adminAppPath } from "@/lib/admin-app/constants";
import { MetricStatCard } from "@/components/design-system";
import { useAdminRealtime } from "@/lib/admin-app/useAdminRealtime";

type LiveMetrics = {
  onlineMembers: number;
  offlineMembers: number;
  newLoginsToday: number;
  todayNewMembers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  investmentsToday: number;
  investmentsTodayAmount: number;
  todayDeposits: number;
  todayDepositsAmount: number;
  todayWithdrawals: number;
  todayWithdrawalsAmount: number;
  revenueToday: number;
  payoutsToday: number;
  members: number;
  totalWalletBalance: number;
  platformAssets: number;
  monthlyRevenue: number;
};

type ActivityRow = {
  id: string;
  member_name: string;
  city: string | null;
  region: string | null;
  country: string | null;
  isp: string | null;
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

  const refresh = useCallback(async () => {
    try {
      const [metricsRes, activityRes, notificationsRes] = await Promise.all([
        fetch("/api/admin/live-metrics", { cache: "no-store" }),
        fetch("/api/admin/login-activity?limit=8", { cache: "no-store" }),
        fetch("/api/admin/notifications?limit=8", { cache: "no-store" })
      ]);

      if (metricsRes.ok) {
        setMetrics((await metricsRes.json()) as LiveMetrics);
      }
      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivity(Array.isArray(data) ? data : []);
      }
      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        setNotifications(data.items ?? []);
      }
    } catch {
      // Keep last good snapshot — never crash the admin shell on a metrics fetch failure.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useAdminRealtime(() => void refresh());

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard title="Online members" value={String(metrics?.onlineMembers ?? "—")} accent="emerald" icon={<Users size={16} aria-hidden />} href={adminAppPath("/members")} />
        <MetricStatCard title="Offline members" value={String(metrics?.offlineMembers ?? "—")} accent="sky" icon={<Users size={16} aria-hidden />} href={adminAppPath("/members")} />
        <MetricStatCard title="New members today" value={String(metrics?.todayNewMembers ?? "—")} accent="navy" icon={<Users size={16} aria-hidden />} href={adminAppPath("/members")} />
        <MetricStatCard title="Total members" value={String(metrics?.members ?? "—")} accent="emerald" icon={<Users size={16} aria-hidden />} href={adminAppPath("/members")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard title="Today's investments" value={String(metrics?.investmentsToday ?? "—")} accent="navy" icon={<TrendingUp size={16} aria-hidden />} href={adminAppPath("/investments")} />
        <MetricStatCard title="Investment volume today" value={formatNaira(metrics?.investmentsTodayAmount ?? 0)} accent="emerald" icon={<Wallet size={16} aria-hidden />} href={adminAppPath("/investments")} />
        <MetricStatCard title="Today's deposits" value={String(metrics?.todayDeposits ?? "—")} accent="amber" icon={<ArrowDownLeft size={16} aria-hidden />} href={adminAppPath("/deposits")} />
        <MetricStatCard title="Deposit volume today" value={formatNaira(metrics?.todayDepositsAmount ?? 0)} accent="amber" icon={<ArrowDownLeft size={16} aria-hidden />} href={adminAppPath("/deposits")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard title="Today's withdrawals" value={String(metrics?.todayWithdrawals ?? "—")} accent="gold" icon={<ArrowUpRight size={16} aria-hidden />} href={adminAppPath("/payouts")} />
        <MetricStatCard title="Withdrawal volume today" value={formatNaira(metrics?.todayWithdrawalsAmount ?? 0)} accent="gold" icon={<ArrowUpRight size={16} aria-hidden />} href={adminAppPath("/payouts")} />
        <MetricStatCard title="Today's payouts" value={formatNaira(metrics?.payoutsToday ?? 0)} accent="sky" icon={<ArrowUpRight size={16} aria-hidden />} href={adminAppPath("/payouts")} />
        <MetricStatCard title="Today's revenue" value={formatNaira(metrics?.revenueToday ?? 0)} accent="sky" icon={<Activity size={16} aria-hidden />} href={adminAppPath("/settlements")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard title="Pending deposits" value={formatNaira(metrics?.pendingDeposits ?? 0)} accent="amber" icon={<ArrowDownLeft size={16} aria-hidden />} href={adminAppPath("/deposits")} />
        <MetricStatCard title="Pending withdrawals" value={String(metrics?.pendingWithdrawals ?? "—")} accent="gold" icon={<ArrowUpRight size={16} aria-hidden />} href={adminAppPath("/payouts")} />
        <MetricStatCard title="Pending KYC" value={String(metrics?.pendingKyc ?? "—")} accent="navy" icon={<Users size={16} aria-hidden />} href={adminAppPath("/members")} />
        <MetricStatCard title="New logins today" value={String(metrics?.newLoginsToday ?? "—")} accent="emerald" icon={<LogIn size={16} aria-hidden />} href={adminAppPath("/activity")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricStatCard title="Monthly revenue" value={formatNaira(metrics?.monthlyRevenue ?? 0)} accent="emerald" icon={<TrendingUp size={16} aria-hidden />} href={adminAppPath("/reports")} />
        <MetricStatCard title="Wallet balances" value={formatNaira(metrics?.totalWalletBalance ?? 0)} accent="sky" icon={<Wallet size={16} aria-hidden />} href={adminAppPath("/members")} />
        <MetricStatCard title="Platform assets" value={formatNaira(metrics?.platformAssets ?? 0)} accent="navy" icon={<Wallet size={16} aria-hidden />} href={adminAppPath("/investments")} />
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
                    {[row.city, row.region, row.country].filter(Boolean).join(", ") || "Location unavailable"}
                    {row.isp ? ` · ${row.isp}` : ""} · {row.device_type} · {row.browser} / {row.operating_system}
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
