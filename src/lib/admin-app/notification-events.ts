import { adminAppPath } from "@/lib/admin-app/constants";

export type AdminNotificationPriority = "information" | "success" | "financial" | "high";

export type AdminNotificationFilter = "all" | "registrations" | "logins" | "investments" | "payouts";

export type AdminNotificationItem = {
  id: string;
  event_type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

const FILTER_EVENT_TYPES: Record<Exclude<AdminNotificationFilter, "all">, string[]> = {
  registrations: ["member.registered"],
  logins: ["user.login"],
  investments: ["investment.created"],
  payouts: ["withdrawal.requested"]
};

export function notificationPriority(item: AdminNotificationItem): AdminNotificationPriority {
  const fromMeta = item.metadata?.priority as AdminNotificationPriority | undefined;
  if (fromMeta) return fromMeta;

  switch (item.event_type) {
    case "member.registered":
      return "success";
    case "user.login":
      return "information";
    case "investment.created":
      return "financial";
    case "withdrawal.requested":
      return "high";
    default:
      return "information";
  }
}

export function notificationHref(item: AdminNotificationItem): string {
  switch (item.event_type) {
    case "member.registered":
      return item.metadata.user_id
        ? adminAppPath(`/members/${String(item.metadata.user_id)}`)
        : adminAppPath("/members");
    case "user.login":
      return adminAppPath("/activity");
    case "investment.created":
      return adminAppPath("/investments");
    case "withdrawal.requested":
      return adminAppPath("/payouts");
    case "deposit.requested":
      return adminAppPath("/deposits");
    default:
      return adminAppPath("/notifications");
  }
}

export function notificationAction(item: AdminNotificationItem): { label: string; href: string } | null {
  if (item.event_type === "withdrawal.requested") {
    return { label: String(item.metadata.action_label ?? "Review Request"), href: adminAppPath("/payouts") };
  }
  if (item.event_type === "deposit.requested") {
    return { label: "Review deposit", href: adminAppPath("/deposits") };
  }
  if (item.event_type === "member.registered" && item.metadata.user_id) {
    return { label: "View member", href: adminAppPath(`/members/${String(item.metadata.user_id)}`) };
  }
  return null;
}

export function priorityStyles(priority: AdminNotificationPriority) {
  switch (priority) {
    case "success":
      return {
        badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        label: "Success",
        accent: "border-l-emerald-500"
      };
    case "financial":
      return {
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        label: "Financial",
        accent: "border-l-amber-500"
      };
    case "high":
      return {
        badge: "bg-red-500/15 text-red-300 border-red-500/30",
        label: "High priority",
        accent: "border-l-red-500"
      };
    default:
      return {
        badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        label: "Information",
        accent: "border-l-sky-500"
      };
  }
}

export function matchesNotificationFilter(item: AdminNotificationItem, filter: AdminNotificationFilter) {
  if (filter === "all") return true;
  return FILTER_EVENT_TYPES[filter].includes(item.event_type);
}

export function formatNotificationTime(value: string) {
  return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export function pushEligibleEventTypes() {
  return ["member.registered", "user.login", "investment.created", "withdrawal.requested"] as const;
}
