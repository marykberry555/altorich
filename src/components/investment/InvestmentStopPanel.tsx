"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, Wallet } from "lucide-react";
import Link from "next/link";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  investmentId: string;
  status: string;
  stopRequestedAt: string | null;
  amount: number;
  totalEarned: number;
  weeklyRoiPercent: number;
};

export function InvestmentStopPanel({
  investmentId,
  status,
  stopRequestedAt,
  amount,
  totalEarned,
  weeklyRoiPercent
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isActive = status === "active" || status === "stopping";
  const stopping = Boolean(stopRequestedAt) || status === "stopping";

  async function requestStop() {
    if (loading || stopping) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/investments/${investmentId}/stop`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not stop investment.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isActive) return null;

  return (
    <Card variant="elevated" padding="md" className="space-y-4">
      <div>
        <h2 className="font-semibold text-[var(--heading)]">Weekly earnings & stop</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Earnings auto-reinvest every Monday at 09:00 WAT at <strong>{weeklyRoiPercent}% weekly</strong> on your
          current balance ({formatNaira(amount)}). Returns are guaranteed.
        </p>
      </div>

      {stopping ? (
        <div className="rounded-[var(--radius-sm)] border border-[var(--gold)]/30 bg-[var(--gold-soft)]/40 p-4 text-sm">
          <p className="font-medium text-[var(--heading)]">Stop scheduled</p>
          <p className="mt-1 text-[var(--text-muted)]">
            Your interest ({formatNaira(totalEarned)} credited so far) will be paid to your wallet on Monday at 09:00
            WAT. Then withdraw from your wallet.
          </p>
          <Link href="/withdrawals" className="mt-3 inline-block">
            <Button size="sm" variant="outline" className="gap-2">
              <Wallet size={14} /> Go to withdraw
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="gap-2" disabled={loading} onClick={requestStop}>
            <PauseCircle size={16} />
            {loading ? "Scheduling…" : "Stop investment"}
          </Button>
          <p className="text-xs text-[var(--text-subtle)] self-center">
            Stop anytime — earnings paid to wallet on the next Monday.
          </p>
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </Card>
  );
}
