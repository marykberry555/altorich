import { maskIpAddress } from "@/lib/financial-events/format";
import type { Deposit, Withdrawal } from "@/types/database";
import { inferCategoryFromKind, inferKindFromAuditAction, kindLabel } from "./activity-labels";
import type {
  LoginActivityRow,
  SecurityActivityKind,
  SecurityTimelineCategory,
  SecurityTimelineEvent
} from "./types";

type SecurityEventRow = {
  id: string;
  event_type: string;
  created_at: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
};

type AuditRow = {
  id: string;
  action: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

function locationFromParts(city?: string | null, country?: string | null) {
  const parts = [city, country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function mapLoginRow(row: LoginActivityRow): SecurityTimelineEvent {
  return {
    id: `login-${row.id}`,
    category: "authentication",
    kind: "login_success",
    title: kindLabel("login_success"),
    description: "You signed in to your account.",
    status: "success",
    timestamp: row.created_at,
    device: row.device_type,
    browser: row.browser,
    operatingSystem: row.operating_system,
    location: locationFromParts(row.city, row.country),
    ipMasked: maskIpAddress(row.ip_address),
    exportable: true
  };
}

function mapSecurityEvent(row: SecurityEventRow): SecurityTimelineEvent | null {
  const type = row.event_type.toLowerCase();
  let kind: SecurityActivityKind = "unknown";
  let status: SecurityTimelineEvent["status"] = "info";

  if (type === "login.failed") {
    kind = "login_failed";
    status = "failed";
  } else if (type.includes("password")) {
    kind = "password_changed";
    status = "success";
  } else if (type.includes("pin")) {
    kind = "pin_changed";
    status = "success";
  } else if (type.includes("device")) {
    kind = "device_trusted";
    status = "success";
  } else if (type.includes("email")) {
    kind = "email_updated";
    status = "success";
  } else {
    return null;
  }

  return {
    id: `security-${row.id}`,
    category: inferCategoryFromKind(kind),
    kind,
    title: kindLabel(kind),
    status,
    timestamp: row.created_at,
    ipMasked: maskIpAddress(row.ip_address),
    exportable: true
  };
}

function mapAuditRow(row: AuditRow, actorIsSelf: boolean): SecurityTimelineEvent | null {
  const kind = inferKindFromAuditAction(row.action);
  if (kind === "unknown" && !actorIsSelf) return null;

  const category: SecurityTimelineCategory =
    kind === "unknown" ? "admin" : inferCategoryFromKind(kind);

  return {
    id: `audit-${row.id}`,
    category,
    kind,
    title: kind === "unknown" ? "Account update" : kindLabel(kind),
    description: row.action.replace(/[._]/g, " "),
    status: "info",
    timestamp: row.created_at,
    exportable: true
  };
}

function mapWithdrawal(row: Withdrawal): SecurityTimelineEvent {
  return {
    id: `withdrawal-${row.id}`,
    category: "withdrawal",
    kind: "withdrawal_requested",
    title: kindLabel("withdrawal_requested"),
    description: `Status: ${row.status.replace(/_/g, " ")}`,
    status: row.status === "rejected" ? "failed" : "info",
    timestamp: row.created_at,
    exportable: true
  };
}

function mapDeposit(row: Deposit): SecurityTimelineEvent {
  return {
    id: `deposit-${row.id}`,
    category: "investment",
    kind: "deposit_submitted",
    title: "Deposit submitted",
    description: `Status: ${row.status.replace(/_/g, " ")}`,
    status: row.status === "rejected" ? "failed" : "info",
    timestamp: row.created_at,
    exportable: true
  };
}

export function buildMemberSecurityTimeline(input: {
  userId: string;
  loginActivity?: LoginActivityRow[];
  securityEvents?: SecurityEventRow[];
  auditLogs?: AuditRow[];
  withdrawals?: Withdrawal[];
  deposits?: Deposit[];
  emailVerifiedAt?: string | null;
  limit?: number;
}): SecurityTimelineEvent[] {
  const events: SecurityTimelineEvent[] = [];
  const limit = input.limit ?? 100;

  if (input.emailVerifiedAt) {
    events.push({
      id: "email-verified",
      category: "authentication",
      kind: "email_updated",
      title: "Email verified",
      description: "Your email address was confirmed.",
      status: "success",
      timestamp: input.emailVerifiedAt,
      exportable: true
    });
  }

  for (const row of input.loginActivity ?? []) {
    events.push(mapLoginRow(row));
  }

  for (const row of input.securityEvents ?? []) {
    const mapped = mapSecurityEvent(row);
    if (mapped) events.push(mapped);
  }

  for (const row of input.auditLogs ?? []) {
    const mapped = mapAuditRow(row, true);
    if (mapped) events.push(mapped);
  }

  for (const row of input.withdrawals ?? []) {
    events.push(mapWithdrawal(row));
  }

  for (const row of input.deposits ?? []) {
    events.push(mapDeposit(row));
  }

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function filterTimelineEvents(
  events: SecurityTimelineEvent[],
  input: { category?: SecurityTimelineCategory | "all"; query?: string }
): SecurityTimelineEvent[] {
  let filtered = events;
  if (input.category && input.category !== "all") {
    filtered = filtered.filter((e) => e.category === input.category);
  }
  const q = input.query?.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q) ?? false) ||
        (e.browser?.toLowerCase().includes(q) ?? false) ||
        (e.device?.toLowerCase().includes(q) ?? false) ||
        (e.location?.toLowerCase().includes(q) ?? false)
    );
  }
  return filtered;
}
