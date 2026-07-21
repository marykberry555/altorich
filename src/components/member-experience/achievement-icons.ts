import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Award,
  Banknote,
  Calendar,
  CalendarDays,
  Gift,
  LogIn,
  MailCheck,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "log-in": LogIn,
  "mail-check": MailCheck,
  "user-check": UserCheck,
  "arrow-down-to-line": ArrowDownToLine,
  "trending-up": TrendingUp,
  "arrow-up-from-line": ArrowUpFromLine,
  users: Users,
  gift: Gift,
  banknote: Banknote,
  calendar: Calendar,
  "calendar-days": CalendarDays,
  award: Award
};

export function resolveAchievementIcon(key: string): LucideIcon {
  return ICON_MAP[key] ?? Award;
}
