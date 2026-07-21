import { MemberAvatar } from "@/components/profile/MemberAvatar";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";
import { formatFinancialDate } from "@/lib/financial-events/format";
import type { ReferralProgressView } from "@/lib/financial-events/types";
import { OperationalStepTracker } from "./OperationalStepTracker";
import { StatusChip } from "./StatusChip";

type Props = {
  referral: ReferralProgressView;
};

export function ReferralProgressCard({ referral }: Props) {
  return (
    <Card variant="elevated" padding="md" className="transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="flex items-start gap-3">
        <MemberAvatar fullName={referral.name} avatarUrl={referral.avatarUrl ?? null} size="md" href={null} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-[var(--heading)]">{referral.name}</p>
              {referral.username ? <p className="text-xs text-[var(--text-muted)]">@{referral.username}</p> : null}
              <p className="mt-0.5 text-xs text-[var(--text-subtle)]">Joined {formatFinancialDate(referral.joinedAt)}</p>
            </div>
            <StatusChip
              label={referral.outcomeLabel}
              variant={referral.outcomeTone === "emerald" ? "emerald" : referral.outcomeTone === "gold" ? "gold" : "slate"}
            />
          </div>

          <div className="my-4 h-px bg-[var(--border)]" aria-hidden />

          <OperationalStepTracker
            steps={referral.steps.map((s) => ({ ...s, description: undefined }))}
            label={`Referral progress for ${referral.name}`}
          />

          {referral.commissionAmount ? (
            <p className="mt-3 text-sm font-semibold tabular-nums text-[var(--emerald)]">
              Earned {formatNaira(referral.commissionAmount)}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
