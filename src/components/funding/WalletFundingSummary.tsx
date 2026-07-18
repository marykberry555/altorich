import { formatNaira } from "@/lib/domain";

type Props = {
  balance: number;
  pendingFunding: number;
};

export function WalletFundingSummary({ balance, pendingFunding }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--navy)] p-6 text-white sm:p-8">
      <dl className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">Wallet balance</dt>
          <dd className="mt-2 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">{formatNaira(balance)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">Pending funding</dt>
          <dd className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-amber-200 sm:text-3xl">
            {formatNaira(pendingFunding)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
