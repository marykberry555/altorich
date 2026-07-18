"use client";

import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatNaira } from "@/lib/domain";
import { StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/design-system";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Database } from "@/types/database";

type MemberDetail = {
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  email: string | null;
  walletBalance: number;
  walletTransactions: Database["public"]["Tables"]["wallet_transactions"]["Row"][];
  investments: Array<
    Database["public"]["Tables"]["investments"]["Row"] & {
      investment_plans: { name: string; slug: string; settlement_frequency: string | null } | null;
    }
  >;
  withdrawals: Database["public"]["Tables"]["withdrawals"]["Row"][];
  deposits: Database["public"]["Tables"]["deposits"]["Row"][];
  referrals: Database["public"]["Tables"]["referrals"]["Row"][];
  bankAccounts: Database["public"]["Tables"]["bank_accounts"]["Row"][];
};

type Props = {
  memberId: string | null;
  memberName?: string;
  onClose: () => void;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export function MemberDetailPanel({ memberId, memberName, onClose }: Props) {
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load member");
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load member");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!memberId) return null;

  const title = detail?.profile.full_name || memberName || "Member profile";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <Card variant="elevated" padding="md" className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden">
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Member profile</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--heading)]">{title}</h2>
            {detail ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {detail.email ?? detail.profile.phone ?? detail.profile.username ?? detail.profile.invite_code}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-[var(--text-subtle)]" size={24} />
            </div>
          ) : error ? (
            <p className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : detail ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card variant="outline" padding="sm">
                  <p className="text-xs text-[var(--text-muted)]">Wallet balance</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{formatNaira(detail.walletBalance)}</p>
                </Card>
                <Card variant="outline" padding="sm">
                  <p className="text-xs text-[var(--text-muted)]">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={detail.profile.account_status ?? "active"} />
                  </div>
                </Card>
                <Card variant="outline" padding="sm">
                  <p className="text-xs text-[var(--text-muted)]">VIP level</p>
                  <p className="mt-1 text-lg font-semibold">{detail.profile.vip_level ?? 0}</p>
                </Card>
                <Card variant="outline" padding="sm">
                  <p className="text-xs text-[var(--text-muted)]">Joined</p>
                  <p className="mt-1 text-sm font-medium">{formatDate(detail.profile.created_at)}</p>
                </Card>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--heading)]">Account details</h3>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-[var(--text-muted)]">Username:</span> {detail.profile.username ?? "—"}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Phone:</span> {detail.profile.phone ?? "—"}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Invite code:</span> {detail.profile.invite_code}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">KYC:</span> {detail.profile.kyc_status ?? "pending"}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Referrals made:</span> {detail.referrals.length}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Bank accounts:</span> {detail.bankAccounts.length}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--heading)]">Investments ({detail.investments.length})</h3>
                {detail.investments.length === 0 ? (
                  <p className="text-sm text-[var(--text-subtle)]">
                    No investments yet — this member has not activated a sector.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.investments.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.investment_plans?.name ?? "—"}</TableCell>
                          <TableCell className="tabular-nums">{formatNaira(Number(inv.amount))}</TableCell>
                          <TableCell>
                            <StatusBadge status={inv.status} />
                          </TableCell>
                          <TableCell>{formatDate(inv.started_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--heading)]">Withdrawals ({detail.withdrawals.length})</h3>
                {detail.withdrawals.length === 0 ? (
                  <p className="text-sm text-[var(--text-subtle)]">
                    No withdrawals yet — withdrawal history will appear after the first request.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="tabular-nums">{formatNaira(Number(w.amount))}</TableCell>
                          <TableCell>{w.bank_name}</TableCell>
                          <TableCell>
                            <StatusBadge status={w.status} />
                          </TableCell>
                          <TableCell>{formatDate(w.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--heading)]">Deposits ({detail.deposits.length})</h3>
                {detail.deposits.length === 0 ? (
                  <p className="text-sm text-[var(--text-subtle)]">No deposits</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.deposits.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="tabular-nums">{formatNaira(Number(d.amount))}</TableCell>
                          <TableCell className="font-mono text-xs">{d.reference}</TableCell>
                          <TableCell>
                            <StatusBadge status={d.status} />
                          </TableCell>
                          <TableCell>{formatDate(d.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--heading)]">Wallet activity</h3>
                {detail.walletTransactions.length === 0 ? (
                  <p className="text-sm text-[var(--text-subtle)]">No wallet transactions</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.walletTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="capitalize">{tx.type}</TableCell>
                          <TableCell className="tabular-nums">{formatNaira(Number(tx.amount))}</TableCell>
                          <TableCell className="capitalize">{tx.reason.replace(/_/g, " ")}</TableCell>
                          <TableCell>{formatDate(tx.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
