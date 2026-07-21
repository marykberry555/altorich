import { MonitorSmartphone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatFinancialDate, formatFinancialTime, maskIpAddress } from "@/lib/financial-events/format";
import { kindLabel } from "@/lib/trust/activity-labels";
import type { LoginActivityRow } from "@/lib/trust/types";

type Props = {
  rows: LoginActivityRow[];
  title?: string;
  showFailed?: boolean;
};

function locationLabel(row: LoginActivityRow) {
  const parts = [row.city, row.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location unavailable";
}

export function LoginDeviceHistoryPanel({ rows, title = "Recent login activity" }: Props) {
  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-2">
        <MonitorSmartphone size={16} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{title}</h2>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No login history yet"
            description="Successful sign-ins will appear here with device, browser, and approximate location when available."
          />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-subtle)]">
                <th scope="col" className="pb-2 pr-3 font-semibold">
                  Device
                </th>
                <th scope="col" className="pb-2 pr-3 font-semibold">
                  Browser
                </th>
                <th scope="col" className="pb-2 pr-3 font-semibold">
                  OS
                </th>
                <th scope="col" className="pb-2 pr-3 font-semibold">
                  Location
                </th>
                <th scope="col" className="pb-2 pr-3 font-semibold">
                  Date
                </th>
                <th scope="col" className="pb-2 pr-3 font-semibold">
                  Time
                </th>
                <th scope="col" className="pb-2 font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border)]/60 last:border-0">
                  <td className="py-3 pr-3 font-medium text-[var(--heading)]">
                    {row.device_type ?? row.operating_system ?? "Unknown device"}
                  </td>
                  <td className="py-3 pr-3">{row.browser ?? "Unknown"}</td>
                  <td className="py-3 pr-3">{row.operating_system ?? "—"}</td>
                  <td className="py-3 pr-3">{locationLabel(row)}</td>
                  <td className="py-3 pr-3">
                    <time dateTime={row.created_at}>{formatFinancialDate(row.created_at)}</time>
                  </td>
                  <td className="py-3 pr-3">{formatFinancialTime(row.created_at)}</td>
                  <td className="py-3">
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {kindLabel("login_success")}
                    </span>
                    <span className="sr-only"> IP {maskIpAddress(row.ip_address)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
