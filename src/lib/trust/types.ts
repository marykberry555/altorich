/** Member-facing security activity kinds — derived from real events only. */
export type SecurityActivityKind =
  | "login_success"
  | "login_failed"
  | "password_changed"
  | "email_updated"
  | "profile_updated"
  | "bank_details_changed"
  | "withdrawal_requested"
  | "security_settings_updated"
  | "pin_changed"
  | "device_trusted"
  | "deposit_submitted"
  | "notice"
  | "unknown";

export type SecurityTimelineCategory =
  | "authentication"
  | "profile"
  | "investment"
  | "withdrawal"
  | "admin"
  | "notice";

export type SecurityActivityStatus = "success" | "failed" | "info" | "warning";

export type SecurityTimelineEvent = {
  id: string;
  category: SecurityTimelineCategory;
  kind: SecurityActivityKind;
  title: string;
  description?: string;
  status: SecurityActivityStatus;
  timestamp: string;
  device?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  location?: string | null;
  ipMasked?: string | null;
  exportable?: boolean;
};

export type LoginActivityRow = {
  id: string;
  created_at: string;
  browser: string | null;
  device_type: string | null;
  operating_system: string | null;
  ip_address: string | null;
  city: string | null;
  country: string | null;
};

export type TrustedDeviceSummary = {
  id: string;
  device_name: string;
  browser: string;
  operating_system: string;
  country: string | null;
  last_seen_at: string;
  created_at: string;
};

export type MemberSecuritySnapshot = {
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  passwordLastChanged: string | null;
  loginAlertsEnabled: boolean | null;
  recentLogins: LoginActivityRow[];
  trustedDevices: TrustedDeviceSummary[];
  activeSessionsAvailable: boolean;
  timeline: SecurityTimelineEvent[];
};

export type IncidentCategory =
  | "maintenance"
  | "service_disruption"
  | "security_advisory"
  | "operational_update"
  | "resolved_incident";

export type IncidentNotice = {
  id: string;
  category: IncidentCategory;
  title: string;
  body: string;
  startsAt?: string;
  endsAt?: string;
  bannerVisible?: boolean;
  notificationReady?: boolean;
};

export type SystemHealthComponentId =
  | "application"
  | "database"
  | "email"
  | "notifications"
  | "storage"
  | "queue"
  | "scheduled_jobs"
  | "settlement_engine";

export type SystemHealthStatus = "operational" | "degraded" | "maintenance" | "offline" | "unavailable";

export type SystemHealthComponent = {
  id: SystemHealthComponentId;
  name: string;
  description: string;
  status: SystemHealthStatus;
  message?: string;
  lastChecked?: string;
  monitoringAvailable: boolean;
};

export type ComplianceDocument = {
  id: string;
  title: string;
  href: string;
  summary: string;
  category: "legal" | "policy" | "notice";
  searchableText: string;
};

export type AdminSecurityTimelineEntry = {
  id: string;
  category: "login" | "credential" | "permission" | "sensitive" | "flagged" | "config";
  title: string;
  detail?: string;
  actorLabel?: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
};
