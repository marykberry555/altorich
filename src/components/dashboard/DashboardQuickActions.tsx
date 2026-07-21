import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Download,
  Headphones,
  LayoutGrid,
  UserPen,
  Users
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type QuickAction = {
  href: string;
  label: string;
  icon: typeof ArrowDownToLine;
  emphasis?: boolean;
};

type Props = {
  walletBalance: number;
  hasActiveInvestment: boolean;
  className?: string;
};

function buildActions(walletBalance: number, hasActiveInvestment: boolean): QuickAction[] {
  const actions: QuickAction[] = [];

  if (walletBalance <= 0) {
    actions.push({ href: "/deposits", label: "Fund wallet", icon: ArrowDownToLine, emphasis: true });
  } else if (!hasActiveInvestment) {
    actions.push({ href: "/investments", label: "Start investing", icon: LayoutGrid, emphasis: true });
    actions.push({ href: "/deposits", label: "Fund wallet", icon: ArrowDownToLine });
  } else {
    actions.push({ href: "/portfolio", label: "View portfolio", icon: LayoutGrid, emphasis: true });
    actions.push({ href: "/withdrawals", label: "Withdraw", icon: ArrowUpFromLine });
    actions.push({ href: "/deposits", label: "Fund wallet", icon: ArrowDownToLine });
  }

  actions.push(
    { href: "/team", label: "Invite friends", icon: Users },
    { href: "/learn", label: "Knowledge Center", icon: BookOpen },
    { href: "/documents", label: "My documents", icon: Download },
    { href: "/profile", label: "Update profile", icon: UserPen },
    { href: "/contact", label: "Contact support", icon: Headphones }
  );

  return actions.slice(0, 6);
}

export function DashboardQuickActions({ walletBalance, hasActiveInvestment, className }: Props) {
  const actions = buildActions(walletBalance, hasActiveInvestment);

  return (
    <Card variant="elevated" padding="md" className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Quick actions</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition hover:border-[var(--emerald)]/40 hover:bg-[var(--emerald-soft)]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald)]",
                action.emphasis
                  ? "border-[var(--emerald)]/30 bg-[var(--emerald-soft)]/50"
                  : "border-[var(--border)] bg-[var(--gray-50)]/40"
              )}
            >
              <Icon size={20} className="text-[var(--emerald)]" aria-hidden />
              <span className="text-xs font-semibold text-[var(--heading)]">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
