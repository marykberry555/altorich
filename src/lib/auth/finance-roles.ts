/** Roles permitted to move money / settle / adjust wallets. Support is excluded. */
export const FINANCE_CAPABLE_ROLES = ["super_admin", "admin", "finance"] as const;

export type FinanceCapableRole = (typeof FINANCE_CAPABLE_ROLES)[number];

export function isFinanceCapableRole(role: string): role is FinanceCapableRole {
  return (FINANCE_CAPABLE_ROLES as readonly string[]).includes(role);
}
