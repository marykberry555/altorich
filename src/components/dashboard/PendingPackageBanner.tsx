import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { getPackageLabel } from "@/lib/packages/constants";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Props = {
  preferredPackageSlug: string;
};

export function PendingPackageBanner({ preferredPackageSlug }: Props) {
  const label = getPackageLabel(preferredPackageSlug);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-[var(--surface-raised)] to-[var(--surface-raised)] p-5 shadow-sm dark:border-amber-500/25 dark:from-amber-500/10 dark:via-[var(--surface-raised)] sm:p-6"
      aria-label="Awaiting funding"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" aria-hidden />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">Awaiting funding</Badge>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Preferred package</p>
          </div>
          <h2 className="text-lg font-bold text-[var(--heading)]">{label}</h2>
          <p className="max-w-lg text-sm text-[var(--text-muted)]">
            You selected this plan at sign-up. Fund your wallet and activate it to start earning on the weekly cycle.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link href="/deposits">
            <Button className="gap-2">
              <Wallet size={16} aria-hidden />
              Fund wallet
            </Button>
          </Link>
          <Link href={`/packages/${preferredPackageSlug}`} className="text-xs font-semibold text-[var(--emerald)] hover:underline">
            View plan details
            <ArrowRight size={12} className="ml-0.5 inline" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
