import type { AdminRoleDefinition } from "./types";

/** Role definitions for future permission mapping — UI only today. */
export const ADMIN_ROLE_DEFINITIONS: AdminRoleDefinition[] = [
  {
    id: "super_admin",
    label: "Super Admin",
    description: "Full platform access across all operational areas."
  },
  {
    id: "operations",
    label: "Operations",
    description: "Deposits, withdrawals, settlements, and member account management."
  },
  {
    id: "finance",
    label: "Finance",
    description: "Reconciliation, reporting, and financial health monitoring."
  },
  {
    id: "support",
    label: "Support",
    description: "Member assistance, tickets, and communication."
  },
  {
    id: "compliance",
    label: "Compliance",
    description: "KYC review, fraud monitoring, and audit trails."
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Announcements, referrals, and promotional programmes."
  },
  {
    id: "auditor",
    label: "Auditor",
    description: "Read-only access to logs, exports, and reconciliation records."
  }
];

export function getAdminRoleDefinition(id: string): AdminRoleDefinition | undefined {
  return ADMIN_ROLE_DEFINITIONS.find((r) => r.id === id);
}
