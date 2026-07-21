import { BellRing } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Props = {
  enabled: boolean | null;
};

export function LoginAlertsPanel({ enabled }: Props) {
  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-2">
        <BellRing size={16} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Login alerts</h2>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {enabled === null ? (
          <>
            <Badge>Status unavailable</Badge>
            <p className="text-sm text-[var(--text-muted)]">
              Dedicated login alert preferences are not configured yet. Email notifications from your profile settings
              may still include account updates.
            </p>
          </>
        ) : (
          <>
            <Badge variant={enabled ? "emerald" : "default"}>{enabled ? "Enabled" : "Disabled"}</Badge>
            <p className="text-sm text-[var(--text-muted)]">
              {enabled
                ? "You will receive alerts for important sign-in and security events when supported."
                : "Enable email notifications in Settings to receive account updates."}
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
