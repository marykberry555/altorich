"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, Wallet, Landmark } from "lucide-react";
import Link from "next/link";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
  const [liqLoading, setLiqLoading] = useState(false);
  const [error, setError] = useState("");
  const [liqOpen, setLiqOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [liqSubmitted, setLiqSubmitted] = useState(false);

  const isActive = status === "active" || status === "stopping" || status === "stopped";
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

  async function requestLiquidation(event: React.FormEvent) {
    event.preventDefault();
    if (liqLoading) return;
    setLiqLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/investments/${investmentId}/liquidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comments: comments || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit liquidation request.");
        return;
      }
      setLiqSubmitted(true);
      setLiqOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLiqLoading(false);
    }
  }

  if (!isActive && status !== "stopped") return null;

  return (
    <div className="space-y-4">
      <Card variant="elevated" padding="md" className="space-y-4">
        <div>
          <h2 className="font-semibold text-[var(--heading)]">Earnings options</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Weekly ROI <strong>{weeklyRoiPercent}%</strong> on {formatNaira(amount)}. Earnings auto-reinvest every
            Monday unless you withdraw them.
          </p>
        </div>

        {stopping ? (
          <div className="rounded-[var(--radius-sm)] border border-[var(--gold)]/30 bg-[var(--gold-soft)]/40 p-4 text-sm">
            <p className="font-medium text-[var(--heading)]">Earnings payout scheduled</p>
            <p className="mt-1 text-[var(--text-muted)]">
              Interest credited so far ({formatNaira(totalEarned)}) pays to your wallet Monday 09:00 WAT. Principal stays
              invested until capital liquidation is approved.
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
              {loading ? "Scheduling…" : "Withdraw earnings (Monday)"}
            </Button>
          </div>
        )}
      </Card>

      <Card variant="elevated" padding="md" className="space-y-4">
        <div>
          <h2 className="font-semibold text-[var(--heading)]">Capital liquidation</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Principal cannot be withdrawn directly. Submit a liquidation request for admin review.
          </p>
        </div>

        {liqSubmitted ? (
          <div className="rounded-[var(--radius-sm)] border border-[var(--emerald)]/25 bg-[var(--emerald-soft)]/40 p-4 text-sm">
            <p className="font-medium text-[var(--heading)]">Liquidation request submitted</p>
            <p className="mt-1 text-[var(--text-muted)]">We will notify you when an administrator responds.</p>
          </div>
        ) : liqOpen ? (
          <form onSubmit={requestLiquidation} className="space-y-3">
            <Input
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Why are you requesting capital return?"
            />
            <Input
              label="Comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Additional details"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={liqLoading || reason.trim().length < 3} className="gap-2">
                <Landmark size={16} />
                {liqLoading ? "Submitting…" : "Submit request"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setLiqOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button type="button" variant="outline" className="gap-2" onClick={() => setLiqOpen(true)}>
            <Landmark size={16} />
            Request capital liquidation
          </Button>
        )}
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
