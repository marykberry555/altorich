import { Shield } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatFinancialDateTime, maskIpAddress } from "@/lib/financial-events/format";

export type SecurityActivityRow = {
  id: string;
  created_at: string;
  browser: string | null;
  device_type: string | null;
  operating_system: string | null;
  ip_address: string | null;
  city: string | null;
  country: string | null;
};

type Props = {
  rows: SecurityActivityRow[];
  title?: string;
};

export function SecurityActivityPanel({ rows, title = "Security activity" }: Props) {
  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{title}</h2>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No security events yet"
            description="Recent sign-ins and account changes will appear here so you can spot anything unusual."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-[var(--border)] px-4 py-3 transition-colors hover:border-[var(--emerald)]/30"
            >
              <p className="font-semibold text-[var(--heading)]">Recent login</p>
              <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-[var(--text-subtle)]">Browser</dt>
                  <dd className="font-medium">{row.browser ?? "Unknown browser"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-subtle)]">Device</dt>
                  <dd className="font-medium">{row.device_type ?? row.operating_system ?? "Unknown device"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-subtle)]">IP address</dt>
                  <dd className="font-mono text-xs">{maskIpAddress(row.ip_address)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-subtle)]">Session started</dt>
                  <dd>
                    <time dateTime={row.created_at}>{formatFinancialDateTime(row.created_at)}</time>
                  </dd>
                </div>
                {row.city || row.country ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-[var(--text-subtle)]">Location</dt>
                    <dd className="font-medium">
                      {[row.city, row.country].filter(Boolean).join(", ") || "—"}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
