"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { lagosDayKey } from "@/lib/finance/lagos-window";

type SettlementReport = {
  period: "day" | "week";
  dayKey: string;
  weekStartKey?: string;
  weekEndKey?: string;
  summary: {
    withdrawalsPaid: number;
    withdrawalsAmount: number;
    referralPayoutsPaid: number;
    referralAmount: number;
    totalPaid: number;
    totalAmount: number;
    avgWaitMinutes: number | null;
    uniqueMembers: number;
  };
  lines: Array<{
    kind: string;
    id: string;
    member_name: string | null;
    amount: number;
    settlement_reference: string | null;
    bank_name: string | null;
    account_number: string | null;
    paid_at: string | null;
    wait_minutes: number | null;
  }>;
};

export function SettlementReportPanel() {
  const [period, setPeriod] = useState<"day" | "week">("day");
  const [day, setDay] = useState(lagosDayKey());
  const [report, setReport] = useState<SettlementReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ period, day });
    const res = await fetch(`/api/admin/settlement-report?${params}`, { cache: "no-store" });
    if (!res.ok) {
      setError("Failed to load settlement report");
      setLoading(false);
      return;
    }
    setReport((await res.json()) as SettlementReport);
    setLoading(false);
  }, [period, day]);

  useEffect(() => {
    void load();
  }, [load]);

  const csvHref = `/api/admin/settlement-report?period=${period}&day=${encodeURIComponent(day)}&format=csv`;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--admin-heading)" }}>
            Settlement reporting
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-muted)" }}>
            End-of-day / end-of-week paid withdrawals and referral payouts (Africa/Lagos).
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
            Period
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "day" | "week")}
              className="mt-1 block rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
            >
              <option value="day">Day</option>
              <option value="week">Week (Mon–Sun)</option>
            </select>
          </label>
          <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
            Anchor day
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="mt-1 block rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
            />
          </label>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </Button>
          <a href={csvHref} className="inline-flex">
            <Button type="button" size="sm" variant="secondary">
              <Download size={14} />
              CSV
            </Button>
          </a>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total paid", value: formatNaira(report.summary.totalAmount), sub: `${report.summary.totalPaid} payouts` },
              {
                label: "Withdrawals",
                value: formatNaira(report.summary.withdrawalsAmount),
                sub: `${report.summary.withdrawalsPaid} paid`
              },
              {
                label: "Referral payouts",
                value: formatNaira(report.summary.referralAmount),
                sub: `${report.summary.referralPayoutsPaid} paid`
              },
              {
                label: "Avg wait",
                value: report.summary.avgWaitMinutes != null ? `${report.summary.avgWaitMinutes}m` : "—",
                sub: `${report.summary.uniqueMembers} members`
              }
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--admin-border)", background: "var(--admin-panel)" }}
              >
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--admin-subtle)" }}>
                  {card.label}
                </p>
                <p className="mt-2 text-xl font-semibold" style={{ color: "var(--admin-heading)" }}>
                  {card.value}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--admin-muted)" }}>
                  {card.sub}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs" style={{ color: "var(--admin-subtle)" }}>
            {report.period === "week"
              ? `Week ${report.weekStartKey} → ${report.weekEndKey}`
              : `Day ${report.dayKey}`}{" "}
            · Africa/Lagos
          </p>

          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--admin-border)" }}>
            <table className="min-w-full text-left text-sm">
              <thead style={{ background: "var(--admin-panel)", color: "var(--admin-subtle)" }}>
                <tr>
                  <th className="px-3 py-2 font-medium">Paid at</th>
                  <th className="px-3 py-2 font-medium">Kind</th>
                  <th className="px-3 py-2 font-medium">Member</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Bank</th>
                  <th className="px-3 py-2 font-medium">Wait</th>
                </tr>
              </thead>
              <tbody>
                {report.lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center" style={{ color: "var(--admin-muted)" }}>
                      No paid settlements in this window
                    </td>
                  </tr>
                ) : (
                  report.lines.map((line) => (
                    <tr key={`${line.kind}-${line.id}`} className="border-t" style={{ borderColor: "var(--admin-border)" }}>
                      <td className="whitespace-nowrap px-3 py-2" style={{ color: "var(--admin-muted)" }}>
                        {line.paid_at ? new Date(line.paid_at).toLocaleString("en-NG") : "—"}
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--admin-text)" }}>
                        {line.kind === "withdrawal" ? "Withdrawal" : "Referral"}
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--admin-text)" }}>
                        {line.member_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-medium" style={{ color: "var(--admin-heading)" }}>
                        {formatNaira(line.amount)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--admin-emerald-text)" }}>
                        {line.settlement_reference ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: "var(--admin-muted)" }}>
                        {line.bank_name ? `${line.bank_name} · ${line.account_number ?? ""}` : "—"}
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--admin-muted)" }}>
                        {line.wait_minutes != null ? `${line.wait_minutes}m` : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : loading ? (
        <p className="flex items-center gap-2 text-sm" style={{ color: "var(--admin-muted)" }}>
          <Loader2 size={16} className="animate-spin" /> Loading report…
        </p>
      ) : null}
    </section>
  );
}
