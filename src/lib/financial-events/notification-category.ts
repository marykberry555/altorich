import type { Notification } from "@/types/database";
import type { NotificationCategory } from "./types";

export function categorizeNotification(row: Pick<Notification, "title" | "body" | "metadata">): NotificationCategory {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const event = String(meta.event ?? meta.type ?? "").toLowerCase();
  const text = `${row.title} ${row.body}`.toLowerCase();

  if (event.includes("deposit") || text.includes("deposit") || text.includes("fund")) return "deposits";
  if (event.includes("withdraw") || event.includes("payout") || text.includes("withdraw")) return "withdrawals";
  if (event.includes("invest") || event.includes("settlement") || text.includes("investment")) return "investment";
  if (event.includes("welcome_bonus") || event.includes("bonus") || text.includes("bonus")) return "bonus";
  if (event.includes("referral") || event.includes("vip") || text.includes("referral")) return "referral";
  if (event.includes("security") || event.includes("login") || event.includes("device") || text.includes("login"))
    return "security";
  if (event.includes("announce") || text.includes("maintenance") || text.includes("announcement")) return "announcements";
  return "announcements";
}

export const NOTIFICATION_CATEGORY_LABELS: Record<Exclude<NotificationCategory, "all">, string> = {
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  investment: "Investment",
  bonus: "Bonus",
  referral: "Referral",
  security: "Security",
  announcements: "Announcements"
};
