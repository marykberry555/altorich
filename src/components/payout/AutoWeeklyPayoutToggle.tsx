"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function AutoWeeklyPayoutToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/payout/auto-withdraw")
      .then((r) => r.json())
      .then((data) => setEnabled(Boolean(data.enabled)))
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(next: boolean) {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/payout/auto-withdraw", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next })
    });

    setSaving(false);
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error ?? "Could not update automatic withdrawal.");
      return;
    }

    setEnabled(Boolean(body.enabled));
    setMessage(
      body.enabled
        ? "Automatic weekly withdrawal enabled. Only accrued earnings will be withdrawn."
        : "Automatic weekly withdrawal disabled."
    );
  }

  return (
    <Card variant="elevated" className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-lg">
          <h3 className="font-semibold text-[var(--heading)]">Automatic weekly withdrawal</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Automatically withdraw accrued investment earnings every Monday settlement. Your investment capital stays
            invested.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={loading || saving}
          onClick={() => void toggle(!enabled)}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
            enabled ? "bg-[var(--emerald)]" : "bg-[var(--gray-200)]",
            (loading || saving) && "opacity-60"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
              enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
      {saving ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-[var(--text-subtle)]">
          <Loader2 size={12} className="animate-spin" /> Saving…
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-[var(--text-muted)]">{message}</p> : null}
    </Card>
  );
}
