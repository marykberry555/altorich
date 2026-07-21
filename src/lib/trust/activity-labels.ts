import type { SecurityActivityKind, SecurityActivityStatus, SecurityTimelineCategory } from "./types";

export function categoryLabel(category: SecurityTimelineCategory): string {
  const labels: Record<SecurityTimelineCategory, string> = {
    authentication: "Authentication",
    profile: "Profile changes",
    investment: "Investment actions",
    withdrawal: "Withdrawal actions",
    admin: "Admin communications",
    notice: "Important notices"
  };
  return labels[category];
}

export function kindLabel(kind: SecurityActivityKind): string {
  const labels: Record<SecurityActivityKind, string> = {
    login_success: "Successful login",
    login_failed: "Failed login",
    password_changed: "Password changed",
    email_updated: "Email updated",
    profile_updated: "Profile updated",
    bank_details_changed: "Bank details changed",
    withdrawal_requested: "Withdrawal requested",
    security_settings_updated: "Security settings updated",
    pin_changed: "PIN changed",
    device_trusted: "Device recognised",
    deposit_submitted: "Deposit submitted",
    notice: "Notice",
    unknown: "Account activity"
  };
  return labels[kind];
}

export function statusLabel(status: SecurityActivityStatus): string {
  const labels: Record<SecurityActivityStatus, string> = {
    success: "Successful",
    failed: "Failed",
    info: "Recorded",
    warning: "Review"
  };
  return labels[status];
}

export function inferKindFromAuditAction(action: string): SecurityActivityKind {
  const lower = action.toLowerCase();
  if (lower.includes("password")) return "password_changed";
  if (lower.includes("email")) return "email_updated";
  if (lower.includes("pin")) return "pin_changed";
  if (lower.includes("bank")) return "bank_details_changed";
  if (lower.includes("profile")) return "profile_updated";
  if (lower.includes("withdraw")) return "withdrawal_requested";
  if (lower.includes("security") || lower.includes("device")) return "security_settings_updated";
  if (lower.includes("deposit")) return "deposit_submitted";
  return "unknown";
}

export function inferCategoryFromKind(kind: SecurityActivityKind): SecurityTimelineCategory {
  switch (kind) {
    case "login_success":
    case "login_failed":
    case "password_changed":
    case "pin_changed":
    case "device_trusted":
    case "security_settings_updated":
      return "authentication";
    case "email_updated":
    case "profile_updated":
    case "bank_details_changed":
      return "profile";
    case "deposit_submitted":
      return "investment";
    case "withdrawal_requested":
      return "withdrawal";
    case "notice":
      return "notice";
    default:
      return "profile";
  }
}
