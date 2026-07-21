import { KeyRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ACCOUNT_RECOVERY_STEPS } from "@/lib/trust/security-tips";

export function AccountRecoveryPanel() {
  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
          Account recovery
        </h2>
      </div>
      <ol className="mt-4 space-y-3">
        {ACCOUNT_RECOVERY_STEPS.map((step) => (
          <li key={step.step} className="flex gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
            <Badge>{step.step}</Badge>
            <div>
              <p className="font-semibold text-[var(--heading)]">{step.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
