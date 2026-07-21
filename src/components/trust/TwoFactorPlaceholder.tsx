import { Smartphone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function TwoFactorPlaceholder() {
  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-[var(--emerald)]" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            Two-factor authentication
          </h2>
        </div>
        <Badge variant="gold">Planned</Badge>
      </div>
      <p className="mt-3 text-sm text-[var(--text-muted)]">
        An extra verification step for sign-in and sensitive actions is planned. You will be notified when two-factor
        authentication becomes available for your account.
      </p>
    </Card>
  );
}
