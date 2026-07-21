import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  BookOpen,
  Crown,
  FileText,
  Landmark,
  LayoutDashboard,
  Layers,
  Megaphone,
  Settings,
  Shield,
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/portfolio", label: "Portfolio", icon: TrendingUp },
  { href: "/investments", label: "Invest", icon: Layers },
  { href: "/deposits", label: "Deposits", icon: Landmark },
  { href: "/withdrawals", label: "Withdrawals", icon: Landmark },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/team", label: "Referrals", icon: Users },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/security", label: "Security", icon: Shield },
  { href: "/vip", label: "VIP", icon: Crown },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings }
];

/** Bottom bar: Dashboard, Wallet, Invest, Portfolio, Profile */
export const mobileDashboardNavItems: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/investments", label: "Invest", icon: Layers },
  { href: "/portfolio", label: "Portfolio", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: User }
];

export function getDashboardNavLabel(pathname: string): string {
  const match = dashboardNavItems.find((item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return match?.label ?? "Dashboard";
}
