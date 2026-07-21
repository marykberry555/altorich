/** Extensible operational status model — overrides can be stored in settings later. */

export type ServiceStatus = "operational" | "degraded" | "maintenance" | "offline";

export type SystemServiceId =
  | "website"
  | "api"
  | "deposits"
  | "withdrawals"
  | "member_portal"
  | "authentication"
  | "email"
  | "notifications"
  | "weekly_settlement";

export type SystemServiceDefinition = {
  id: SystemServiceId;
  name: string;
  description: string;
};

export type SystemServiceState = SystemServiceDefinition & {
  status: ServiceStatus;
  message?: string;
  updatedAt: string;
};

export const SYSTEM_SERVICES: SystemServiceDefinition[] = [
  { id: "website", name: "Website", description: "Public marketing site and information pages." },
  { id: "api", name: "API", description: "Core application programming interfaces." },
  { id: "deposits", name: "Deposits", description: "Funding submission and verification." },
  { id: "withdrawals", name: "Withdrawals", description: "Withdrawal requests and settlement queue." },
  { id: "member_portal", name: "Member Portal", description: "Signed-in dashboard, wallet, and portfolio." },
  { id: "authentication", name: "Authentication", description: "Sign-in, registration, and account security." },
  { id: "email", name: "Email", description: "Verification and account notifications." },
  { id: "notifications", name: "Notifications", description: "In-app alerts and member updates." },
  { id: "weekly_settlement", name: "Weekly Settlement", description: "Monday 09:00 WAT settlement processing." }
];

export const STATUS_LABELS: Record<ServiceStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  maintenance: "Maintenance",
  offline: "Offline"
};

export const STATUS_STYLES: Record<ServiceStatus, string> = {
  operational: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  degraded: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/25",
  maintenance: "bg-slate-500/15 text-slate-700 dark:text-slate-200 border-slate-500/25",
  offline: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25"
};

export type SystemStatusOverrides = Partial<Record<SystemServiceId, { status: ServiceStatus; message?: string }>>;

export function mergeSystemStatus(
  base: Record<SystemServiceId, ServiceStatus>,
  overrides: SystemStatusOverrides | null | undefined,
  now = new Date()
): SystemServiceState[] {
  const updatedAt = now.toISOString();
  return SYSTEM_SERVICES.map((service) => {
    const override = overrides?.[service.id];
    return {
      ...service,
      status: override?.status ?? base[service.id] ?? "operational",
      message: override?.message,
      updatedAt
    };
  });
}
