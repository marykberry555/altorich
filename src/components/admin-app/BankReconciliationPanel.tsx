"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { lagosDayKey } from "@/lib/finance/lagos-window";

type ReconResult = {
  dayKey: string;
  summary: {
    platformPaid: number;
    bankLines: number;
    matched: number;
    amountMismatch: number;
    platformUnmatched: number;
    bankUnmatched: number;
    platformTotal: number;
    bankTotal: number;
    deltaTotal: number;
  };
  matches: Array<{
    status: string;
    match_reason: string | null;
    expected_amount: number | null;
    bank_amount: number | null;
    delta: number | null;
    platform: {
      member_name: string | null;
      settlement_reference: string | null;
      account_number: string | null;
      amount: number;
    } | null;
    bank: {
      row: number;
      reference: string | null;
      account_number: string | null;
      amount: number;
    } | null;
  }>;
};

const STATUS_LABEL: Record<string, string> = {
  matched: "Matched",
  amount_mismatch: "Amount mismatch",
  platform_unmatched: "Missing in bank",
  bank_unmatched: "Extra in bank"
};

export function BankReconciliationPanel() {
  const [day, setDay] = useState(lagosDayKey());
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReconResult | null>(null);

  async function run() {
    if (!file) {
      setError("Choose a bank CSV export first");
      return;
    }
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("day", day);
    form.set("file", file);
    const res = await fetch("/api/admin/bank-reconciliation", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Reconciliation failed");
      return;
    }
    setResult(json as ReconResult);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--admin-heading)" }}>
          Bank reconciliation
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--admin-muted)" }}>
          Match paid platform withdrawals against your bank debit CSV. Matching uses settlement
          reference first, then account number + amount.
        </p>
      </div>

      <div
        className="flex flex-wrap items-end gap-3 rounded-xl border p-4"
        style={{ borderColor: "var(--admin-border)", background: "var(--admin-panel)" }}
      >
        <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
          Settlement day (Lagos)
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
          />
        </label>
        <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
          Bank CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block max-w-xs text-sm"
            style={{ color: "var(--admin-text)" }}
          />
        </label>
        <Button type="button" size="sm" onClick={() => void run()} disabled={busy}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Reconcile
        </Button>
      </div>

      <p className="text-xs" style={{ color: "var(--admin-subtle)" }}>
        Expected columns (flexible names): date, amount, account number, reference / narration.
      </p>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Matched", value: String(result.summary.matched) },
              { label: "Amount mismatch", value: String(result.summary.amountMismatch) },
              { label: "Missing in bank", value: String(result.summary.platformUnmatched) },
              { label: "Extra in bank", value: String(result.summary.bankUnmatched) }
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
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
            Platform {formatNaira(result.summary.platformTotal)} · Bank{" "}
            {formatNaira(result.summary.bankTotal)} · Delta {formatNaira(result.summary.deltaTotal)}
          </p>

          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--admin-border)" }}>
            <table className="min-w-full text-left text-sm">
              <thead style={{ background: "var(--admin-panel)", color: "var(--admin-subtle)" }}>
                <tr>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Platform</th>
                  <th className="px-3 py-2 font-medium">Bank</th>
                  <th className="px-3 py-2 font-medium">Δ</th>
                </tr>
              </thead>
              <tbody>
                {result.matches
                  .filter((m) => m.status !== "matched")
                  .concat(result.matches.filter((m) => m.status === "matched"))
                  .map((m, idx) => (
                    <tr key={idx} className="border-t" style={{ borderColor: "var(--admin-border)" }}>
                      <td className="px-3 py-2" style={{ color: "var(--admin-heading)" }}>
                        {STATUS_LABEL[m.status] ?? m.status}
                        {m.match_reason ? (
                          <span className="mt-0.5 block text-[10px]" style={{ color: "var(--admin-subtle)" }}>
                            {m.match_reason}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: "var(--admin-muted)" }}>
                        {m.platform ? (
                          <>
                            {m.platform.member_name ?? "—"} · {formatNaira(m.platform.amount)}
                            <br />
                            <span className="font-mono" style={{ color: "var(--admin-emerald-text)" }}>
                              {m.platform.settlement_reference ?? "—"}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: "var(--admin-muted)" }}>
                        {m.bank ? (
                          <>
                            Row {m.bank.row} · {formatNaira(m.bank.amount)}
                            <br />
                            {m.bank.account_number ?? "—"} · {m.bank.reference ?? "—"}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2" style={{ color: "var(--admin-text)" }}>
                        {m.delta != null ? formatNaira(m.delta) : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
