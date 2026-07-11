import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Crown,
  Landmark,
  LayoutDashboard,
  Layers,
  Settings,
  TrendingUp,
  User,
  Users,
  Wallet
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const dashboardNavItems: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/portfolio", label: "Portfolio", icon: TrendingUp },
  { href: "/investments", label: "Invest", icon: Layers },
  { href: "/deposits", label: "Wallet funding", icon: Landmark },
  { href: "/withdrawals", label: "Payout", icon: Landmark },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/team", label: "Referrals", icon: Users },
  { href: "/vip", label: "VIP", icon: Crown },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings }
];

export const mobileDashboardNavItems = dashboardNavItems.slice(0, 5);

export function getDashboardNavLabel(pathname: string): string {
  const match = dashboardNavItems.find((item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return match?.label ?? "Overview";
}
