import type { AnnouncementCategory, PlatformAnnouncement } from "./types";

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  feature: "New Features",
  maintenance: "Scheduled Maintenance",
  policy: "Policy Updates",
  education: "Educational Content",
  notice: "Important Notices"
};

/** Platform announcements — extend this list as new notices are published. */
export const PLATFORM_ANNOUNCEMENTS: PlatformAnnouncement[] = [
  {
    id: "ann-knowledge-center",
    category: "feature",
    title: "Knowledge Center now available",
    body: "Browse guides on funding, settlements, security, and financial planning from your dashboard or the Learn menu.",
    publishedAt: "2026-07-01T09:00:00.000Z",
    href: "/learn"
  },
  {
    id: "ann-settlement-schedule",
    category: "education",
    title: "Understanding Monday settlements",
    body: "Withdrawal processing opens every Monday at 9:00 AM. Track your queue position from the Withdrawals page.",
    publishedAt: "2026-06-15T09:00:00.000Z",
    href: "/learn/withdrawal-process"
  },
  {
    id: "ann-security-reminder",
    category: "notice",
    title: "Protect your account",
    body: "Alto Rich will never ask for your PIN or password by phone or message. Review your security settings regularly.",
    publishedAt: "2026-06-01T09:00:00.000Z",
    href: "/settings"
  }
];

export function sortAnnouncements(items: PlatformAnnouncement[]): PlatformAnnouncement[] {
  return [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export const ANNOUNCEMENT_READ_KEY = "alto-announcements-read";
