"use client";

import { Bitcoin, Coins } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Card } from "@/components/ui/Card";
import type { CryptoWalletConfig } from "@/lib/payments";

type Props = {
  wallets: CryptoWalletConfig;
};

function CryptoRow({
  label,
  icon,
  address,
  network
}: {
  label: string;
  icon: React.ReactNode;
  address: string;
  network?: string;
}) {
  const configured = Boolean(address?.trim());

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)] p-4 dark:bg-[var(--surface)]">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-raised)] text-[var(--heading)]">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--heading)]">{label}</p>
          {network ? <p className="text-xs text-[var(--text-subtle)]">{network}</p> : null}
        </div>
      </div>
      {configured ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <code className="break-all text-xs text-[var(--text-muted)]">{address}</code>
          <CopyButton value={address} />
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--text-subtle)]">Wallet address will appear here once configured by operations.</p>
      )}
    </div>
  );
}

export function CryptoWalletsPanel({ wallets }: Props) {
  return (
    <Card variant="elevated" className="h-full">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gold-soft)] text-[var(--gold)]">
          <Coins size={18} aria-hidden />
        </span>
        <h2 className="font-semibold text-[var(--heading)]">Cryptocurrency</h2>
      </div>
      <p className="mt-3 text-sm text-[var(--text-muted)]">
        Send USDT, USDC, or BTC to the addresses below. Submit your transaction reference for verification.
      </p>
      <div className="mt-5 space-y-3">
        <CryptoRow label="USDT" icon={<span className="text-sm font-bold">₮</span>} address={wallets.usdt.address} network={wallets.usdt.network} />
        <CryptoRow label="USDC" icon={<span className="text-sm font-bold">$</span>} address={wallets.usdc.address} network={wallets.usdc.network} />
        <CryptoRow label="Bitcoin (BTC)" icon={<Bitcoin size={16} aria-hidden />} address={wallets.btc.address} />
      </div>
    </Card>
  );
}
