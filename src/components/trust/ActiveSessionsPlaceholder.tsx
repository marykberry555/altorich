import { Laptop } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function ActiveSessionsPlaceholder() {
  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Laptop size={16} className="text-[var(--emerald)]" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            Active sessions
          </h2>
        </div>
        <Badge>Unavailable</Badge>
      </div>
      <p className="mt-3 text-sm text-[var(--text-muted)]">
        Session-level management is not yet available. You can sign out from this device below, or remove trusted
        devices to require email verification on other browsers.
      </p>
    </Card>
  );
}
